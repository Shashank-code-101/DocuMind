"""
PDF Processor Service
Extracts text page-by-page from PDF documents using PyMuPDF (fitz) and
a hybrid extraction pipeline supporting:
1. Digitally generated PDFs (PyMuPDF direct extraction)
2. Scanned PDFs (Gemini Vision OCR)
3. Handwritten notes PDFs (Gemini Vision OCR)
4. Mixed PDFs (combining direct extraction and visual OCR in page order)

Preserves exact 1-based page numbers and metadata throughout.
"""
import logging
import os
import re
from typing import List, Dict, Any, Tuple, Optional, Callable
import pymupdf  # PyMuPDF

from app.services.handwriting_service import (
    HandwritingService,
    HandwritingRecognitionError,
    handwriting_service as default_handwriting_service,
)

logger = logging.getLogger(__name__)


class PDFProcessingError(Exception):
    """Raised when a PDF cannot be processed."""
    pass


class PasswordProtectedPDFError(PDFProcessingError):
    """Raised when a PDF is encrypted or password-protected."""
    pass


class ScannedPDFError(PDFProcessingError):
    """Raised when a PDF contains no extractable text (scanned document requiring OCR)."""
    pass


def validate_pdf_content(content: bytes, max_size_bytes: int = 50 * 1024 * 1024) -> None:
    """
    Validate raw PDF bytes:
    - Non-empty
    - Magic bytes signature (%PDF-)
    - Maximum size limit
    """
    if not content or len(content) == 0:
        raise PDFProcessingError("Uploaded file is empty.")

    if len(content) > max_size_bytes:
        raise PDFProcessingError(f"File size exceeds limit of {max_size_bytes // (1024 * 1024)}MB.")

    if not content.startswith(b"%PDF-"):
        raise PDFProcessingError("File does not appear to be a valid PDF (invalid magic header).")


def clean_text(text: str) -> str:
    """
    Clean extracted text:
    - Replace null bytes and non-printable control characters
    - Normalize excessive whitespace while preserving paragraph breaks
    """
    if not text:
        return ""
    # Strip null bytes and unusual control chars except \n and \t
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Normalize multiple blank lines to a single blank line
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    # Strip trailing and leading whitespace
    return text.strip()


def classify_page(page: pymupdf.Page, page_number: int) -> Dict[str, Any]:
    """
    Analyzes a PDF page to determine whether it contains meaningful digital text,
    is completely blank, contains diagrams/drawings without text, or is a scanned/handwritten
    page requiring multimodal visual recognition.

    Returns:
        Dict with keys:
            - page_number: int (1-based)
            - page_type: 'digital' | 'blank' | 'diagram_only' | 'scanned_or_handwritten'
            - needs_ocr: bool
            - text: str (digital text extracted by PyMuPDF, if any)
            - char_count: int
            - word_count: int
            - image_count: int
            - drawing_count: int
    """
    raw_text = page.get_text("text") or ""
    cleaned = clean_text(raw_text)
    char_count = len(cleaned)
    word_count = len(cleaned.split())

    images = page.get_images()
    image_count = len(images)

    drawings = page.get_drawings()
    drawing_count = len(drawings)

    # 1. Digital text check:
    # A page with >= 50 characters and >= 10 words of readable text is a digital text page.
    # We do NOT send digitally extractable pages to Gemini to save costs and latency.
    if char_count >= 50 and word_count >= 10:
        return {
            "page_number": page_number,
            "page_type": "digital",
            "needs_ocr": False,
            "text": cleaned,
            "char_count": char_count,
            "word_count": word_count,
            "image_count": image_count,
            "drawing_count": drawing_count,
        }

    # 2. Blank page check:
    # No text, no raster images, and no or minimal drawings (e.g. background rect).
    if char_count == 0 and image_count == 0 and drawing_count <= 1:
        try:
            pix = page.get_pixmap(dpi=72)
            # Sample pixels to confirm uniform blank background
            sample_set = set(pix.samples[:1500])
            if len(sample_set) <= 1:
                return {
                    "page_number": page_number,
                    "page_type": "blank",
                    "needs_ocr": False,
                    "text": "",
                    "char_count": 0,
                    "word_count": 0,
                    "image_count": 0,
                    "drawing_count": drawing_count,
                }
        except Exception:
            # If pixmap check fails, fallback to metadata check
            if drawing_count == 0:
                return {
                    "page_number": page_number,
                    "page_type": "blank",
                    "needs_ocr": False,
                    "text": "",
                    "char_count": 0,
                    "word_count": 0,
                    "image_count": 0,
                    "drawing_count": 0,
                }

    # 3. Diagram-only check (vector graphics without text or curves):
    # Has a few simple geometric shapes (rectangles, straight lines), no raster images, and 0 text.
    if char_count == 0 and image_count == 0 and 1 <= drawing_count <= 3:
        all_simple_shapes = True
        for d in drawings:
            for item in d.get("items", []):
                # 'c', 'v', 'y' indicate cubic or quadratic bezier curves common in handwriting
                if item[0] in ("c", "v", "y"):
                    all_simple_shapes = False
                    break
            if not all_simple_shapes:
                break

        if all_simple_shapes:
            return {
                "page_number": page_number,
                "page_type": "diagram_only",
                "needs_ocr": False,
                "text": "",
                "char_count": 0,
                "word_count": 0,
                "image_count": 0,
                "drawing_count": drawing_count,
            }

    # 4. Scanned or handwritten page:
    # Has raster images, dense vector drawings (stylus handwriting), or sparse text with visual elements.
    return {
        "page_number": page_number,
        "page_type": "scanned_or_handwritten",
        "needs_ocr": True,
        "text": cleaned,
        "char_count": char_count,
        "word_count": word_count,
        "image_count": image_count,
        "drawing_count": drawing_count,
    }


def render_page_to_image(page: pymupdf.Page, dpi: int = 150) -> bytes:
    """
    Renders a PDF page to a PNG image bytes at the specified DPI.
    150 DPI provides an optimal balance between handwriting legibility and payload size (~250KB).
    """
    pix = page.get_pixmap(dpi=dpi)
    return pix.tobytes("png")


def extract_pages_hybrid(
    file_path: str,
    original_filename: str,
    document_id: int,
    handwriting_svc: Optional[HandwritingService] = None,
    on_status_callback: Optional[Callable[[str], None]] = None,
) -> Tuple[List[Dict[str, Any]], int, Dict[str, Any]]:
    """
    Hybrid PDF extraction pipeline:
    - Digital text pages -> extracts text directly with PyMuPDF
    - Scanned or handwritten pages -> renders page image and transcribes with Gemini Vision
    - Blank pages -> skips OCR to save cost/latency
    - Preserves exact 1-based page numbers and document order
    - Safely handles partial page failures

    Returns:
        Tuple of (extracted_pages, total_pages, stats)
        where extracted_pages is:
        [
            {
                "document_id": document_id,
                "document_name": original_filename,
                "page_number": int (1-based),
                "text": str,
                "source_type": "digital" | "handwriting_ocr" | "blank" | "diagram_only",
            },
            ...
        ]
        and stats includes page-type counts and any non-fatal page errors.
    """
    if not os.path.exists(file_path):
        raise PDFProcessingError(f"File not found on disk: {file_path}")

    try:
        doc = pymupdf.open(file_path)
    except Exception as e:
        raise PDFProcessingError(f"Could not open PDF: {str(e)}")

    try:
        if doc.is_encrypted:
            raise PasswordProtectedPDFError("This PDF is password-protected or encrypted.")

        total_pages = doc.page_count
        if total_pages == 0:
            raise PDFProcessingError("The PDF contains no pages.")

        hw_service = handwriting_svc or default_handwriting_service

        # Step 1: Pre-classify all pages
        classified_pages = []
        pages_needing_ocr = []

        for page_idx in range(total_pages):
            page_number = page_idx + 1
            page = doc.load_page(page_idx)
            info = classify_page(page, page_number)
            classified_pages.append((page, info))
            if info["needs_ocr"]:
                pages_needing_ocr.append(page_number)

        logger.info(
            f"PDF '{original_filename}' has {total_pages} page(s). "
            f"Pages requiring OCR: {pages_needing_ocr or 'none'}"
        )

        # Notify status update if handwriting recognition will occur
        if pages_needing_ocr and on_status_callback:
            try:
                on_status_callback("recognizing_handwriting")
            except Exception as cb_err:
                logger.warning(f"Status callback failed: {cb_err}")

        extracted_pages = []
        digital_count = 0
        handwritten_count = 0
        blank_count = 0
        diagram_count = 0
        failed_count = 0
        page_errors: Dict[int, str] = {}

        # Step 2: Extract text page by page in original order
        for page, info in classified_pages:
            page_number = info["page_number"]

            if info["needs_ocr"]:
                try:
                    image_bytes = render_page_to_image(page, dpi=150)
                    transcribed = hw_service.transcribe_page_image(image_bytes, page_number=page_number)
                    final_text = clean_text(transcribed)
                    extracted_pages.append({
                        "document_id": document_id,
                        "document_name": original_filename,
                        "page_number": page_number,
                        "text": final_text,
                        "source_type": "handwriting_ocr",
                    })
                    handwritten_count += 1
                except Exception as e:
                    failed_count += 1
                    err_msg = str(e)
                    page_errors[page_number] = err_msg
                    logger.error(f"OCR failed for page {page_number} in {original_filename}: {err_msg}")
                    # Do not silently treat that page as successfully extracted.
                    # Record page with any partial text or empty string, marking source_type as failed.
                    fallback_text = info["text"]  # any digital text fragment that was present
                    extracted_pages.append({
                        "document_id": document_id,
                        "document_name": original_filename,
                        "page_number": page_number,
                        "text": fallback_text,
                        "source_type": "ocr_failed",
                    })

            elif info["page_type"] == "blank":
                blank_count += 1
                extracted_pages.append({
                    "document_id": document_id,
                    "document_name": original_filename,
                    "page_number": page_number,
                    "text": "",
                    "source_type": "blank",
                })

            elif info["page_type"] == "diagram_only":
                diagram_count += 1
                extracted_pages.append({
                    "document_id": document_id,
                    "document_name": original_filename,
                    "page_number": page_number,
                    "text": "",
                    "source_type": "diagram_only",
                })

            else:
                digital_count += 1
                extracted_pages.append({
                    "document_id": document_id,
                    "document_name": original_filename,
                    "page_number": page_number,
                    "text": info["text"],
                    "source_type": "digital",
                })

        total_extracted_characters = sum(len(p["text"]) for p in extracted_pages)

        # Handle complete failure or zero-text cases
        if total_extracted_characters < 10:
            if failed_count > 0:
                first_err = next(iter(page_errors.values()))
                raise HandwritingRecognitionError(
                    f"Handwriting and visual OCR recognition failed: {first_err}"
                )
            elif blank_count == total_pages:
                raise PDFProcessingError("The PDF contains only blank pages with no text or content.")
            else:
                raise ScannedPDFError(
                    "No extractable text found in this PDF. It appears to contain diagrams, images, or unscannable content without readable text."
                )

        stats = {
            "total_pages": total_pages,
            "digital_pages": digital_count,
            "handwritten_pages": handwritten_count,
            "blank_pages": blank_count,
            "diagram_pages": diagram_count,
            "failed_pages": failed_count,
            "page_errors": page_errors,
        }

        return extracted_pages, total_pages, stats

    finally:
        doc.close()


def extract_pages_from_pdf(
    file_path: str,
    original_filename: str,
    document_id: int,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Extracts text page by page from a PDF file using direct PyMuPDF extraction.
    Retained for backward compatibility with existing tests and digital-only flows.
    Raises ScannedPDFError if the PDF contains under 10 characters across all pages.
    """
    if not os.path.exists(file_path):
        raise PDFProcessingError(f"File not found on disk: {file_path}")

    try:
        doc = pymupdf.open(file_path)
    except Exception as e:
        raise PDFProcessingError(f"Could not open PDF: {str(e)}")

    try:
        if doc.is_encrypted:
            raise PasswordProtectedPDFError("This PDF is password-protected or encrypted.")

        total_pages = doc.page_count
        if total_pages == 0:
            raise PDFProcessingError("The PDF contains no pages.")

        extracted_pages = []
        total_extracted_characters = 0

        for page_idx in range(total_pages):
            page_number = page_idx + 1
            page = doc.load_page(page_idx)
            raw_text = page.get_text("text") or ""
            cleaned = clean_text(raw_text)

            total_extracted_characters += len(cleaned)
            extracted_pages.append({
                "document_id": document_id,
                "document_name": original_filename,
                "page_number": page_number,
                "text": cleaned,
            })

        if total_extracted_characters < 10:
            raise ScannedPDFError(
                "No extractable text found in this PDF. It appears to be a scanned document or image-only file, which requires OCR support."
            )

        return extracted_pages, total_pages

    finally:
        doc.close()
