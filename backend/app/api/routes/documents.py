"""
Document upload and management routes.
Implements complete PDF validation, text extraction (PyMuPDF), chunking,
embedding generation, ChromaDB storage, and vector deletion upon document removal.
"""
import os
import uuid
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user, authenticate_token
from app.database.connection import SessionLocal
from app.database.models.user import User
from app.database.models.workspace import Workspace
from app.database.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.pdf_processor import (
    validate_pdf_content,
    extract_pages_from_pdf,
    extract_pages_hybrid,
    ScannedPDFError,
    PasswordProtectedPDFError,
    PDFProcessingError,
)
from app.services.handwriting_service import HandwritingRecognitionError
from app.services.text_chunker import chunk_document_pages
from app.services.vector_store import add_chunks_to_vector_store, delete_document_vectors

router = APIRouter(tags=["Documents"])


def _get_workspace_or_404(workspace_id: int, user: User, db: Session) -> Workspace:
    ws = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.user_id == user.id,
    ).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    return ws


def process_document_background(document_id: int, user_id: int, workspace_id: int):
    """
    Background worker:
    1. Extracts pages using hybrid pipeline (PyMuPDF for digital, Gemini Vision for handwriting/scanned).
    2. Updates status dynamically (extracting_text -> recognizing_handwriting -> generating_embeddings -> completed).
    3. Chunks pages using RecursiveCharacterTextSplitter with metadata preservation.
    4. Computes embeddings and stores vectors in ChromaDB.
    5. Updates document status to 'completed' or 'failed'.
    """
    db: Session = SessionLocal()
    try:
        doc = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id,
        ).first()
        if not doc:
            return

        doc.processing_status = "extracting_text"
        doc.processing_error = None
        db.commit()

        def update_status(new_status: str):
            try:
                doc.processing_status = new_status
                db.commit()
            except Exception:
                pass

        # Step 1: Text extraction (Hybrid: digital + handwriting/scanned vision OCR)
        try:
            pages, total_pages, stats = extract_pages_hybrid(
                file_path=doc.file_path,
                original_filename=doc.original_filename,
                document_id=doc.id,
                on_status_callback=update_status,
            )
            doc.total_pages = total_pages
        except HandwritingRecognitionError as hre:
            doc.processing_status = "failed"
            doc.processing_error = str(hre)
            db.commit()
            return
        except ScannedPDFError as spe:
            doc.processing_status = "no_text"
            doc.processing_error = str(spe)
            db.commit()
            return
        except (PasswordProtectedPDFError, PDFProcessingError) as ppe:
            doc.processing_status = "failed"
            doc.processing_error = str(ppe)
            db.commit()
            return
        except Exception as e:
            doc.processing_status = "failed"
            doc.processing_error = f"Extraction error: {str(e)}"
            db.commit()
            return

        # Handle partial page transcription errors (non-fatal if some pages succeeded)
        if stats.get("failed_pages", 0) > 0:
            doc.processing_error = f"Note: {stats['failed_pages']} of {total_pages} page(s) could not be visually transcribed."

        # Step 2: Chunking with metadata
        chunks = chunk_document_pages(
            pages=pages,
            user_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
            document_name=doc.original_filename,
            chunk_size=800,
            chunk_overlap=100,
        )

        if not chunks:
            doc.processing_status = "no_text"
            doc.processing_error = "No non-empty text chunks could be generated from this document."
            db.commit()
            return

        # Step 3: Embeddings + ChromaDB storage
        doc.processing_status = "generating_embeddings"
        db.commit()

        try:
            add_chunks_to_vector_store(chunks)
        except Exception as e:
            doc.processing_status = "failed"
            doc.processing_error = f"Vector indexing error: {str(e)}"
            db.commit()
            return

        # Step 4: Mark completed
        doc.processing_status = "completed"
        if stats.get("failed_pages", 0) == 0:
            doc.processing_error = None
        db.commit()

    finally:
        db.close()


@router.get("/api/workspaces/{workspace_id}/documents", response_model=List[DocumentResponse])
def list_documents(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all documents uploaded to a workspace."""
    _get_workspace_or_404(workspace_id, current_user, db)
    return db.query(Document).filter(
        Document.workspace_id == workspace_id,
        Document.user_id == current_user.id,
    ).order_by(Document.created_at.desc()).all()


@router.post("/api/workspaces/{workspace_id}/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    workspace_id: int,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Validates PDF, saves file to disk, records document in database,
    and dispatches background extraction, chunking, and ChromaDB vector indexing.
    """
    _get_workspace_or_404(workspace_id, current_user, db)

    # Filename check
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are accepted.",
        )

    # Read content
    content = await file.read()

    # Validate PDF content
    try:
        validate_pdf_content(content, max_size_bytes=settings.max_file_size_bytes)
    except PDFProcessingError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # SHA-256 hash for duplicate check within workspace
    file_hash = hashlib.sha256(content).hexdigest()
    existing = db.query(Document).filter(
        Document.workspace_id == workspace_id,
        Document.file_hash == file_hash,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This document ('{existing.original_filename}') has already been uploaded to this workspace.",
        )

    # Save to disk
    user_ws_dir = os.path.join(settings.resolved_upload_dir, str(current_user.id), str(workspace_id))
    os.makedirs(user_ws_dir, exist_ok=True)
    stored_filename = f"{uuid.uuid4().hex}.pdf"
    file_path = os.path.join(user_ws_dir, stored_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        workspace_id=workspace_id,
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_hash=file_hash,
        file_size=len(content),
        processing_status="pending",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Dispatch background document processing pipeline
    background_tasks.add_task(
        process_document_background,
        document_id=doc.id,
        user_id=current_user.id,
        workspace_id=workspace_id,
    )

    return doc


@router.get("/api/documents/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve document metadata and processing status."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.get("/api/documents/{document_id}/view")
def view_document_pdf(
    document_id: int,
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Stream original PDF for inline preview and cited page viewing.
    Supports authentication via standard Bearer header OR ?token=<jwt> query parameter
    so that browser <iframe> and <embed> tags can stream PDFs directly.
    """
    from fastapi.responses import FileResponse

    # 1. Resolve token from Query param or Authorization header
    token_str = token
    if not token_str:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token_str = auth_header[7:].strip()

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required to view document.",
        )

    user = authenticate_token(token_str, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )

    # 2. Verify document ownership
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user.id,
    ).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk.")

    return FileResponse(
        path=doc.file_path,
        media_type="application/pdf",
        filename=doc.original_filename,
        headers={
            "Content-Disposition": f'inline; filename="{doc.original_filename}"',
            "Accept-Ranges": "bytes",
        },
    )


@router.delete("/api/documents/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes document row, cleans up associated ChromaDB vectors,
    and removes the file from disk.
    """
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # 1. Delete vectors from ChromaDB
    delete_document_vectors(doc.id)

    # 2. Delete file on disk
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception:
        pass

    # 3. Delete database record
    db.delete(doc)
    db.commit()
