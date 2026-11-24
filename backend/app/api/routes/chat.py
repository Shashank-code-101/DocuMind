"""
Chat / conversation routes.
RAG integration (vector retrieval + Gemini) will be fully wired in Milestone 5.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.database.models.user import User
from app.database.models.workspace import Workspace
from app.database.models.document import Document
from app.database.models.conversation import Conversation, Message
from app.schemas.chat import (
    ConversationCreate, ConversationResponse,
    MessageResponse, AskRequest, AskResponse,
)

router = APIRouter(tags=["Chat"])


def _get_workspace_or_404(workspace_id: int, user: User, db: Session) -> Workspace:
    ws = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.user_id == user.id,
    ).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    return ws


@router.post("/api/workspaces/{workspace_id}/conversations", response_model=ConversationResponse, status_code=201)
def create_conversation(
    workspace_id: int,
    request: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_workspace_or_404(workspace_id, current_user, db)
    conv = Conversation(
        user_id=current_user.id,
        workspace_id=workspace_id,
        title=request.title or "New Conversation",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/api/workspaces/{workspace_id}/conversations", response_model=List[ConversationResponse])
def list_conversations(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_workspace_or_404(workspace_id, current_user, db)
    convs = db.query(Conversation).filter(
        Conversation.workspace_id == workspace_id,
        Conversation.user_id == current_user.id,
    ).order_by(Conversation.updated_at.desc()).all()
    return convs


@router.get("/api/conversations/{conversation_id}", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    
    messages = []
    for msg in conv.messages:
        sources = []
        for src in msg.sources:
            doc_name = "Document"
            if src.document:
                doc_name = src.document.original_filename
            elif src.document_id:
                doc_record = db.query(Document).filter(Document.id == src.document_id).first()
                if doc_record:
                    doc_name = doc_record.original_filename

            sources.append({
                "document_id": src.document_id,
                "document_name": doc_name,
                "page_number": src.page_number or 1,
                "chunk_id": src.chunk_id,
                "source_text": src.source_text,
            })
        messages.append(MessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            sources=sources,
            created_at=msg.created_at,
        ))
    return messages


@router.delete("/api/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    db.delete(conv)
    db.commit()


@router.post("/api/conversations/{conversation_id}/messages", response_model=AskResponse)
def ask_question(
    conversation_id: int,
    request: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submits a user question to the RAG pipeline:
    1. Authenticates user & verifies conversation ownership.
    2. Embeds question with all-MiniLM-L6-v2.
    3. Retrieves top relevant chunks from ChromaDB (workspace & user isolated).
    4. Passes context to Gemini for grounded synthesis.
    5. Stores conversation history and source citations with exact page numbers.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    from app.services.rag_pipeline import run_rag_query

    result = run_rag_query(
        question=request.question.strip(),
        workspace_id=conv.workspace_id,
        user_id=current_user.id,
        conversation_id=conversation_id,
        db=db,
        top_k=5,
    )

    return AskResponse(
        answer=result["answer"],
        sources=result["sources"],
        conversation_id=result["conversation_id"],
        message_id=result["message_id"],
    )
