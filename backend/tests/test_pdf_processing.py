"""
Tests for PDF Processing and Text Chunking:
- PDF byte validation (non-empty, magic bytes)
- Page-by-page text extraction with PyMuPDF
- Scanned PDF detection (empty/image only text)
- Text chunking with LangChain RecursiveCharacterTextSplitter and metadata preservation
"""
import os
import pytest
import pymupdf

from app.services.pdf_processor import (
    validate_pdf_content,
    extract_pages_from_pdf,
    clean_text,
    PDFProcessingError,
    ScannedPDFError,
)
from app.services.text_chunker import chunk_document_pages


def create_sample_pdf(tmp_path, page_texts) -> str:
    """Helper to generate a real PDF with specific page contents using PyMuPDF."""
    doc = pymupdf.open()
    for text in page_texts:
        page = doc.new_page()
        page.insert_text((50, 72), text, fontsize=12)
    file_path = os.path.join(tmp_path, "sample.pdf")
    doc.save(file_path)
    doc.close()
    return file_path


def test_validate_pdf_content():
    # Valid header
    valid_bytes = b"%PDF-1.7\nSample content..."
    validate_pdf_content(valid_bytes)

    # Empty bytes
    with pytest.raises(PDFProcessingError, match="empty"):
        validate_pdf_content(b"")

    # Invalid header
    with pytest.raises(PDFProcessingError, match="invalid magic header"):
        validate_pdf_content(b"NOT_A_PDF_FILE")


def test_clean_text():
    raw = "Hello\x00\x01 World!\n\n\n\nThis is    a test.   \n"
    cleaned = clean_text(raw)
    assert "\x00" not in cleaned
    assert "\x01" not in cleaned
    assert "Hello World!" in cleaned
    assert "This is    a test." in cleaned


def test_extract_pages_from_pdf(tmp_path):
    page_1_text = "Page 1: DocuMind is an AI-powered document intelligence platform."
    page_2_text = "Page 2: Retrieval-Augmented Generation grounds responses in factual documents."
    pdf_path = create_sample_pdf(tmp_path, [page_1_text, page_2_text])

    pages, total_pages = extract_pages_from_pdf(
        file_path=pdf_path,
        original_filename="sample.pdf",
        document_id=42,
    )

    assert total_pages == 2
    assert len(pages) == 2
    assert pages[0]["page_number"] == 1
    assert "DocuMind" in pages[0]["text"]
    assert pages[1]["page_number"] == 2
    assert "Retrieval-Augmented Generation" in pages[1]["text"]
    assert pages[0]["document_id"] == 42


def test_scanned_pdf_detection(tmp_path):
    # PDF with blank pages (no extractable text)
    pdf_path = create_sample_pdf(tmp_path, ["", "   "])

    with pytest.raises(ScannedPDFError, match="OCR support"):
        extract_pages_from_pdf(
            file_path=pdf_path,
            original_filename="scanned.pdf",
            document_id=99,
        )


def test_chunk_document_pages():
    pages = [
        {"page_number": 1, "text": "Sentence one. Sentence two. " * 30},
        {"page_number": 2, "text": "Page two content regarding embeddings and semantic search. " * 20},
    ]

    chunks = chunk_document_pages(
        pages=pages,
        user_id=1,
        workspace_id=10,
        document_id=100,
        document_name="guide.pdf",
        chunk_size=300,
        chunk_overlap=50,
    )

    assert len(chunks) > 0
    first_chunk = chunks[0]
    assert "chunk_id" in first_chunk
    assert "text" in first_chunk
    assert "metadata" in first_chunk

    meta = first_chunk["metadata"]
    assert meta["user_id"] == "1"
    assert meta["workspace_id"] == "10"
    assert meta["document_id"] == "100"
    assert meta["document_name"] == "guide.pdf"
    assert meta["page_number"] == 1
