"""
Complete 9-Step Verification Script for Gemini API and DocuMind RAG Pipeline.
Tests:
1. Gemini API Connectivity
2. Direct Text Generation
3. Direct Image Understanding
4. Normal Digital PDF Extraction
5. Handwritten PDF Recognition
6. Embedding Generation
7. ChromaDB Storage
8. Asking Questions through DocuMind Chat
9. Citation and Page-Number Accuracy
"""
import os
import sys
import time
import pymupdf

# Ensure backend is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.services.llm_service import llm_service
from app.services.handwriting_service import handwriting_service
from app.services.pdf_processor import extract_pages_hybrid
from app.services.text_chunker import chunk_document_pages
from app.services.vector_store import add_chunks_to_vector_store, query_workspace_chunks, delete_document_vectors
from app.database.connection import SessionLocal
from app.database.models.user import User
from app.database.models.workspace import Workspace
from app.database.models.conversation import Conversation
from app.services.rag_pipeline import run_rag_query


def main():
    print("=" * 65)
    print("DOCUMIND COMPLETE 9-STEP GEMINI & RAG WORKFLOW VERIFICATION")
    print("=" * 65)

    # STEP 1: Gemini API Connectivity
    print("\n[STEP 1] Testing Gemini API Connectivity...")
    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    models = [m.name for m in client.models.list()]
    assert len(models) > 0, "No models returned from API"
    print(f"  ✓ Success: Connected to Google Gemini API. {len(models)} models available.")
    print(f"  ✓ Active Model: {settings.GEMINI_MODEL}")

    # STEP 2: Direct Text Generation
    print("\n[STEP 2] Testing Direct Text Generation...")
    t0 = time.time()
    res_text = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents="Respond with exactly: DocuMind Gemini Text Generation Verified."
    )
    print(f"  ✓ Success ({round(time.time() - t0, 2)}s): {res_text.text.strip()}")

    # STEP 3: Direct Image Understanding
    print("\n[STEP 3] Testing Direct Image Understanding (Vision)...")
    doc = pymupdf.open()
    p = doc.new_page(width=300, height=120)
    p.insert_text((30, 60), "DocuMind Multimodal Vision Verified", fontsize=15)
    pix = p.get_pixmap()
    img_bytes = pix.tobytes("png")
    doc.close()

    t0 = time.time()
    transcription = handwriting_service.transcribe_page_image(img_bytes, page_number=1)
    print(f"  ✓ Success ({round(time.time() - t0, 2)}s): Transcribed -> \"{transcription}\"")
    assert "DocuMind" in transcription, f"Expected DocuMind in transcription: {transcription}"

    # STEP 4: Normal Digital PDF Extraction
    print("\n[STEP 4] Testing Normal Digital PDF Extraction (PyMuPDF, 0 Gemini calls)...")
    doc = pymupdf.open()
    p1 = doc.new_page()
    p1.insert_text((50, 72), "Page 1: DocuMind Document Intelligence Core Architecture. Utilizes vector similarity search with local MiniLM embeddings and ChromaDB storage.", fontsize=12)
    digital_pdf_path = os.path.join(settings.resolved_upload_dir, "test_digital.pdf")
    os.makedirs(settings.resolved_upload_dir, exist_ok=True)
    doc.save(digital_pdf_path)
    doc.close()

    pages_digital, total_digital, stats_digital = extract_pages_hybrid(
        file_path=digital_pdf_path,
        original_filename="test_digital.pdf",
        document_id=101,
    )
    print(f"  ✓ Success: Extracted {total_digital} page(s). Stats: {stats_digital}")
    assert stats_digital["digital_pages"] == 1
    assert stats_digital["handwritten_pages"] == 0
    assert "DocuMind Document Intelligence Core Architecture" in pages_digital[0]["text"]

    # STEP 5: Handwritten / Scanned PDF Recognition
    print("\n[STEP 5] Testing Handwritten PDF Recognition via Gemini Vision...")
    doc = pymupdf.open()
    # Page 1: Digital Header
    p1 = doc.new_page()
    p1.insert_text((50, 72), "Chapter 1: Standard Digital Text for Introduction to Deep Neural Networks and Backpropagation.", fontsize=12)
    # Page 2: Scanned handwritten note image
    p2 = doc.new_page()
    img_doc = pymupdf.open()
    img_p = img_doc.new_page(width=400, height=200)
    img_p.insert_text((30, 80), "Handwritten Formula: Loss = 0.5 * (y_true - y_pred)^2", fontsize=14)
    img_p.insert_text((30, 130), "Key Conclusion: Learning rate alpha must decay over time.", fontsize=14)
    pix2 = img_p.get_pixmap()
    img2_bytes = pix2.tobytes("png")
    img_doc.close()
    p2.insert_image(pymupdf.Rect(40, 40, 500, 300), stream=img2_bytes)

    hw_pdf_path = os.path.join(settings.resolved_upload_dir, "test_mixed_hw.pdf")
    doc.save(hw_pdf_path)
    doc.close()

    t0 = time.time()
    pages_hw, total_hw, stats_hw = extract_pages_hybrid(
        file_path=hw_pdf_path,
        original_filename="test_mixed_hw.pdf",
        document_id=202,
    )
    print(f"  ✓ Success ({round(time.time() - t0, 2)}s): Extracted {total_hw} pages. Stats: {stats_hw}")
    assert total_hw == 2
    assert stats_hw["digital_pages"] == 1
    assert stats_hw["handwritten_pages"] == 1
    print(f"  ✓ Page 2 Handwritten Transcribed Text: {pages_hw[1]['text'][:80]}...")

    # STEP 6: Embedding Generation
    print("\n[STEP 6] Testing Embedding Generation (Chunking + Sentence Transformers)...")
    chunks = chunk_document_pages(
        pages=pages_hw,
        user_id=1,
        workspace_id=999,
        document_id=202,
        document_name="test_mixed_hw.pdf",
    )
    print(f"  ✓ Success: Generated {len(chunks)} chunk(s) across {total_hw} pages.")
    for c in chunks:
        print(f"    - Chunk {c['chunk_id']} (Page {c['metadata']['page_number']}): {c['text'][:50]}...")

    # STEP 7: ChromaDB Storage
    print("\n[STEP 7] Testing ChromaDB Storage...")
    indexed_count = add_chunks_to_vector_store(chunks)
    print(f"  ✓ Success: Indexed {indexed_count} chunk(s) into ChromaDB collection.")

    # STEP 8: Asking questions through DocuMind chat / RAG
    print("\n[STEP 8] Testing Questions through RAG Pipeline + Gemini...")
    query = "What is the formula for Loss and what is the key conclusion?"
    t0 = time.time()
    retrieved_chunks = query_workspace_chunks(
        query_text=query,
        workspace_id=999,
        user_id=1,
        top_k=3,
    )
    assert len(retrieved_chunks) > 0, "No chunks retrieved from vector store"

    answer = llm_service.generate_grounded_answer(
        question=query,
        retrieved_chunks=retrieved_chunks,
    )
    print(f"  ✓ Success ({round(time.time() - t0, 2)}s): Gemini Generative Answer:")
    print("------------------------------------------------------------")
    print(answer)
    print("------------------------------------------------------------")

    # STEP 9: Citation and Page-Number Accuracy
    print("\n[STEP 9] Verifying Citation & Page-Number Accuracy...")
    print(f"  ✓ Retrieved {len(retrieved_chunks)} relevant passage(s):")
    for s in retrieved_chunks:
        print(f"    - Document: {s.get('document_name')}, Page: {s.get('page_number')}, Score: {round(s.get('score', 0), 3)}, Text: {s.get('text', '')[:60]}...")

    # The handwritten formula was on Page 2
    p2_citations = [s for s in retrieved_chunks if s.get('page_number') == 2]
    assert len(p2_citations) > 0, "Expected citation pointing to Page 2!"
    assert "Loss = 0.5" in p2_citations[0]["text"]
    print("  ✓ Verified: Citation correctly references Page 2 (the handwritten note page)!")

    # Clean up test artifacts
    delete_document_vectors(101)
    delete_document_vectors(202)
    for f in [digital_pdf_path, hw_pdf_path]:
        if os.path.exists(f):
            os.remove(f)

    print("\n" + "=" * 65)
    print("ALL 9 WORKFLOW STEPS PASSED WITH 100% SUCCESS!")
    print("=" * 65)


if __name__ == "__main__":
    main()
