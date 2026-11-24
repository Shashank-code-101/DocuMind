"""
Comprehensive tests for Hybrid PDF Extraction and Handwriting Recognition:
1. Normal digital PDF (direct PyMuPDF extraction, 0 Gemini calls)
2. Fully handwritten PDF (Gemini Vision OCR)
3. Scanned printed PDF (Gemini Vision OCR)
4. Mixed digital and handwritten PDF (hybrid extraction in exact page order)
5. Blank PDF pages (skipped, no unnecessary OCR)
6. Diagram-only PDF pages (detected, returns empty without failing)
7. Poor-quality handwriting with [unclear] tags
8. Recognition failure scenarios (missing API key, partial page failure)
9. End-to-end RAG retrieval & source citations pointing to the correct original page numbers
"""
import os
import pytest
import pymupdf

from app.services.handwriting_service import (
    HandwritingService,
    HandwritingRecognitionError,
    HANDWRITING_RECOGNITION_SYSTEM_PROMPT,
)
from app.services.pdf_processor import (
    classify_page,
    render_page_to_image,
    extract_pages_hybrid,
    PDFProcessingError,
    ScannedPDFError,
)
from app.services.text_chunker import chunk_document_pages
from app.services.vector_store import add_chunks_to_vector_store, query_workspace_chunks, delete_document_vectors


class MockHandwritingService:
    """Mock HandwritingService for deterministic unit and integration tests."""

    def __init__(self, should_fail: bool = False, fail_on_pages=None, transcriptions=None):
        self.should_fail = should_fail
        self.fail_on_pages = set(fail_on_pages or [])
        self.transcriptions = transcriptions or {}
        self.call_history = []

    def is_configured(self) -> bool:
        return True

    def transcribe_page_image(self, image_bytes: bytes, page_number: int = 1) -> str:
        self.call_history.append({"page_number": page_number, "bytes_len": len(image_bytes)})
        if self.should_fail or page_number in self.fail_on_pages:
            raise HandwritingRecognitionError(f"Simulated vision OCR timeout on page {page_number}")

        if page_number in self.transcriptions:
            return self.transcriptions[page_number]

        return f"Handwritten Lecture Notes (Transcribed from Page {page_number}): Gradient Descent optimization and backpropagation."


def create_digital_pdf(tmp_path, filename="digital.pdf") -> str:
    """Creates a purely digital PDF with standard selectable text."""
    doc = pymupdf.open()
    p1 = doc.new_page()
    p1.insert_text((50, 72), "Machine Learning Overview: Supervised learning models map inputs to outputs using labeled training datasets. Common algorithms include linear regression, decision trees, and neural networks.", fontsize=12)
    p2 = doc.new_page()
    p2.insert_text((50, 72), "Unsupervised Learning Overview: Clustering techniques group unlabeled observations based on inherent patterns, distances, or similarities without human annotations.", fontsize=12)
    path = os.path.join(tmp_path, filename)
    doc.save(path)
    doc.close()
    return path


def create_handwritten_pdf(tmp_path, filename="handwritten.pdf") -> str:
    """Creates a PDF simulating handwritten notes with vector curve strokes and an image."""
    doc = pymupdf.open()
    p1 = doc.new_page()
    # Add handwritten-style bezier strokes
    p1.draw_bezier(pymupdf.Point(50, 50), pymupdf.Point(80, 100), pymupdf.Point(110, 40), pymupdf.Point(150, 80), color=(0, 0, 0.8))
    p1.draw_bezier(pymupdf.Point(150, 80), pymupdf.Point(180, 120), pymupdf.Point(210, 60), pymupdf.Point(250, 90), color=(0, 0, 0.8))
    # Insert an image simulating a scan or photo of handwritten notes
    img_doc = pymupdf.open()
    img_page = img_doc.new_page(width=200, height=100)
    img_page.draw_rect(pymupdf.Rect(10, 10, 190, 90), color=(0.1, 0.1, 0.5), fill=(0.95, 0.95, 0.95))
    pix = img_page.get_pixmap()
    img_bytes = pix.tobytes("png")
    img_doc.close()
    p1.insert_image(pymupdf.Rect(50, 120, 450, 350), stream=img_bytes)

    path = os.path.join(tmp_path, filename)
    doc.save(path)
    doc.close()
    return path


def create_mixed_pdf(tmp_path, filename="mixed.pdf") -> str:
    """Creates a 3-page mixed PDF: Page 1 Digital, Page 2 Handwritten Scan, Page 3 Digital."""
    doc = pymupdf.open()
    # Page 1: Digital text
    p1 = doc.new_page()
    p1.insert_text((50, 72), "Chapter 1: Foundational Mathematics for Data Science. Probability distributions, random variables, and expectation theorems are critical components.", fontsize=12)

    # Page 2: Handwritten notes / scanned image
    p2 = doc.new_page()
    img_doc = pymupdf.open()
    img_page = img_doc.new_page(width=200, height=100)
    img_page.draw_rect(pymupdf.Rect(5, 5, 195, 95), color=(0, 0, 0), fill=(1, 1, 0.9))
    pix = img_page.get_pixmap()
    img_bytes = pix.tobytes("png")
    img_doc.close()
    p2.insert_image(pymupdf.Rect(50, 50, 500, 600), stream=img_bytes)

    # Page 3: Digital text
    p3 = doc.new_page()
    p3.insert_text((50, 72), "Chapter 2: Convex Optimization. Gradient descent converges to the global minimum when the objective loss function is strictly convex.", fontsize=12)

    path = os.path.join(tmp_path, filename)
    doc.save(path)
    doc.close()
    return path


def create_blank_pdf(tmp_path, filename="blank.pdf") -> str:
    """Creates a PDF with only blank pages."""
    doc = pymupdf.open()
    doc.new_page()
    doc.new_page()
    path = os.path.join(tmp_path, filename)
    doc.save(path)
    doc.close()
    return path


def create_diagram_only_pdf(tmp_path, filename="diagram.pdf") -> str:
    """Creates a PDF with geometric vector diagram but no readable text."""
    doc = pymupdf.open()
    p = doc.new_page()
    p.draw_rect(pymupdf.Rect(100, 100, 300, 250), color=(0, 0, 0), width=2)
    p.draw_line(pymupdf.Point(100, 100), pymupdf.Point(300, 250), color=(0, 0, 0), width=1)
    path = os.path.join(tmp_path, filename)
    doc.save(path)
    doc.close()
    return path


# ==============================================================================
# TESTS
# ==============================================================================

def test_page_classification_digital(tmp_path):
    """Verifies that pages with sufficient digital text are classified as 'digital' with needs_ocr=False."""
    pdf_path = create_digital_pdf(tmp_path)
    doc = pymupdf.open(pdf_path)
    page = doc.load_page(0)
    info = classify_page(page, page_number=1)
    doc.close()

    assert info["page_type"] == "digital"
    assert info["needs_ocr"] is False
    assert info["char_count"] > 50
    assert "Machine Learning Overview" in info["text"]


def test_page_classification_blank(tmp_path):
    """Verifies that completely blank pages are classified as 'blank' with needs_ocr=False."""
    pdf_path = create_blank_pdf(tmp_path)
    doc = pymupdf.open(pdf_path)
    page = doc.load_page(0)
    info = classify_page(page, page_number=1)
    doc.close()

    assert info["page_type"] == "blank"
    assert info["needs_ocr"] is False
    assert info["text"] == ""


def test_page_classification_diagram_only(tmp_path):
    """Verifies that diagram-only pages without text are identified and do not trigger false OCR."""
    pdf_path = create_diagram_only_pdf(tmp_path)
    doc = pymupdf.open(pdf_path)
    page = doc.load_page(0)
    info = classify_page(page, page_number=1)
    doc.close()

    assert info["page_type"] == "diagram_only"
    assert info["needs_ocr"] is False


def test_page_classification_handwritten_or_scanned(tmp_path):
    """Verifies that scanned/handwritten pages are identified as requiring OCR."""
    pdf_path = create_handwritten_pdf(tmp_path)
    doc = pymupdf.open(pdf_path)
    page = doc.load_page(0)
    info = classify_page(page, page_number=1)
    doc.close()

    assert info["page_type"] == "scanned_or_handwritten"
    assert info["needs_ocr"] is True


def test_render_page_to_image(tmp_path):
    """Verifies that PDF pages render to valid PNG image bytes at 150 DPI."""
    pdf_path = create_digital_pdf(tmp_path)
    doc = pymupdf.open(pdf_path)
    page = doc.load_page(0)
    img_bytes = render_page_to_image(page, dpi=150)
    doc.close()

    assert isinstance(img_bytes, bytes)
    assert len(img_bytes) > 1000
    assert img_bytes.startswith(b"\x89PNG")


def test_digital_pdf_skips_gemini_ocr(tmp_path):
    """Digital PDFs must extract directly with PyMuPDF and make ZERO Gemini API calls."""
    pdf_path = create_digital_pdf(tmp_path)
    mock_hw = MockHandwritingService()

    pages, total_pages, stats = extract_pages_hybrid(
        file_path=pdf_path,
        original_filename="digital.pdf",
        document_id=1,
        handwriting_svc=mock_hw,
    )

    assert total_pages == 2
    assert stats["digital_pages"] == 2
    assert stats["handwritten_pages"] == 0
    assert len(mock_hw.call_history) == 0  # CRITICAL: 0 Gemini calls to preserve quota
    assert "Supervised learning" in pages[0]["text"]
    assert "Unsupervised Learning" in pages[1]["text"]


def test_fully_handwritten_pdf_extraction(tmp_path):
    """Fully handwritten PDFs must trigger Gemini Vision OCR and return transcribed text."""
    pdf_path = create_handwritten_pdf(tmp_path)
    mock_hw = MockHandwritingService(
        transcriptions={
            1: "# Student Lecture Notes\n- Newton-Raphson method for finding roots\n- Learning rate schedule: eta_t = eta_0 / sqrt(t)"
        }
    )

    pages, total_pages, stats = extract_pages_hybrid(
        file_path=pdf_path,
        original_filename="handwritten.pdf",
        document_id=2,
        handwriting_svc=mock_hw,
    )

    assert total_pages == 1
    assert stats["handwritten_pages"] == 1
    assert stats["digital_pages"] == 0
    assert len(mock_hw.call_history) == 1
    assert "Newton-Raphson" in pages[0]["text"]
    assert pages[0]["page_number"] == 1
    assert pages[0]["source_type"] == "handwriting_ocr"


def test_mixed_pdf_hybrid_extraction_in_order(tmp_path):
    """Mixed PDFs must combine direct digital extraction and Gemini OCR in exact page order."""
    pdf_path = create_mixed_pdf(tmp_path)
    mock_hw = MockHandwritingService(
        transcriptions={
            2: "Handwritten Proof: By Bayes' Theorem, P(A|B) = [P(B|A) * P(A)] / P(B)."
        }
    )

    pages, total_pages, stats = extract_pages_hybrid(
        file_path=pdf_path,
        original_filename="mixed.pdf",
        document_id=3,
        handwriting_svc=mock_hw,
    )

    assert total_pages == 3
    assert stats["digital_pages"] == 2
    assert stats["handwritten_pages"] == 1
    # Only page 2 was sent to Gemini
    assert len(mock_hw.call_history) == 1
    assert mock_hw.call_history[0]["page_number"] == 2

    # Verify exact page order and content
    assert pages[0]["page_number"] == 1
    assert pages[0]["source_type"] == "digital"
    assert "Chapter 1: Foundational Mathematics" in pages[0]["text"]

    assert pages[1]["page_number"] == 2
    assert pages[1]["source_type"] == "handwriting_ocr"
    assert "Bayes' Theorem" in pages[1]["text"]

    assert pages[2]["page_number"] == 3
    assert pages[2]["source_type"] == "digital"
    assert "Chapter 2: Convex Optimization" in pages[2]["text"]


def test_poor_quality_handwriting_with_unclear_tag(tmp_path):
    """Verifies that poor quality or partially illegible handwriting is marked with [unclear]."""
    pdf_path = create_handwritten_pdf(tmp_path)
    mock_hw = MockHandwritingService(
        transcriptions={
            1: "The experimental results showed [unclear] correlation with temperature, reaching peak at [unclear] Kelvin."
        }
    )

    pages, total_pages, stats = extract_pages_hybrid(
        file_path=pdf_path,
        original_filename="messy.pdf",
        document_id=4,
        handwriting_svc=mock_hw,
    )

    assert "[unclear]" in pages[0]["text"]
    assert "experimental results" in pages[0]["text"]


def test_all_blank_pdf_raises_error(tmp_path):
    """A PDF with only blank pages raises PDFProcessingError."""
    pdf_path = create_blank_pdf(tmp_path)
    mock_hw = MockHandwritingService()

    with pytest.raises(PDFProcessingError, match="blank pages"):
        extract_pages_hybrid(
            file_path=pdf_path,
            original_filename="blank.pdf",
            document_id=5,
            handwriting_svc=mock_hw,
        )


def test_gemini_unconfigured_raises_error(tmp_path):
    """When Gemini API key is missing, attempting OCR on handwritten PDF raises HandwritingRecognitionError."""
    pdf_path = create_handwritten_pdf(tmp_path)
    unconfigured_svc = HandwritingService(api_key="")

    with pytest.raises(HandwritingRecognitionError, match="Gemini API key is required"):
        extract_pages_hybrid(
            file_path=pdf_path,
            original_filename="notes.pdf",
            document_id=6,
            handwriting_svc=unconfigured_svc,
        )


def test_partial_page_failure_handling(tmp_path):
    """When a multi-page mixed PDF experiences an OCR failure on one page, successful pages are retained."""
    pdf_path = create_mixed_pdf(tmp_path)
    # Mock fails on page 2
    mock_hw = MockHandwritingService(fail_on_pages=[2])

    pages, total_pages, stats = extract_pages_hybrid(
        file_path=pdf_path,
        original_filename="mixed_partial.pdf",
        document_id=7,
        handwriting_svc=mock_hw,
    )

    assert total_pages == 3
    assert stats["digital_pages"] == 2
    assert stats["failed_pages"] == 1
    assert 2 in stats["page_errors"]
    # Pages 1 and 3 are retained
    assert "Chapter 1" in pages[0]["text"]
    assert pages[1]["source_type"] == "ocr_failed"
    assert "Chapter 2" in pages[2]["text"]


def test_end_to_end_rag_with_handwritten_content(tmp_path):
    """
    Verifies that extracted handwritten text is chunked with correct page metadata,
    indexed into ChromaDB, retrieved by semantic query, and citations reference
    the exact original page number.
    """
    pdf_path = create_mixed_pdf(tmp_path)
    mock_hw = MockHandwritingService(
        transcriptions={
            2: "The eigenvalues of a symmetric positive-definite matrix are strictly positive real numbers. This guarantees that quadratic optimization problems have a unique global minimizer."
        }
    )

    # 1. Hybrid extraction
    pages, total_pages, stats = extract_pages_hybrid(
        file_path=pdf_path,
        original_filename="linear_algebra.pdf",
        document_id=88,
        handwriting_svc=mock_hw,
    )

    # 2. Text chunking with metadata
    chunks = chunk_document_pages(
        pages=pages,
        user_id=1,
        workspace_id=999,
        document_id=88,
        document_name="linear_algebra.pdf",
    )

    assert len(chunks) >= 3
    # Check handwritten page chunk metadata
    p2_chunks = [c for c in chunks if c["metadata"]["page_number"] == 2]
    assert len(p2_chunks) > 0
    assert "eigenvalues" in p2_chunks[0]["text"]
    assert p2_chunks[0]["metadata"]["document_id"] == "88"
    assert p2_chunks[0]["metadata"]["document_name"] == "linear_algebra.pdf"

    # 3. Add to vector store
    try:
        add_chunks_to_vector_store(chunks)

        # 4. Query vector store for handwritten content
        results = query_workspace_chunks(
            query_text="What is true about eigenvalues of a positive definite matrix?",
            workspace_id=999,
            user_id=1,
            top_k=3,
        )

        assert len(results) > 0
        top_match = results[0]
        assert "eigenvalues" in top_match["text"].lower()
        # Verify citation points to original Page 2
        assert top_match["page_number"] == 2
        assert top_match["document_id"] == 88

    finally:
        # Clean up test vectors
        delete_document_vectors(88)
