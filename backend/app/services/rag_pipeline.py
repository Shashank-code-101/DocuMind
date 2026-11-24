"""
RAG Pipeline Service
Orchestrates the entire Retrieval-Augmented Generation flow:
Query -> Embedding -> Vector Search (Workspace Filtered) -> Context Preparation -> LLM Generation -> Citation Formatting.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import re

from app.database.models.conversation import Conversation, Message, Source
from app.services.vector_store import query_workspace_chunks
from app.services.llm_service import llm_service


def is_broad_or_overview_query(question: str) -> bool:
    """Detect if the user is asking a high-level summary or overview query."""
    q_lower = question.lower()
    overview_keywords = [
        "finding", "findings", "takeaway", "takeaways", "summar", "overview",
        "conclusion", "conclusions", "topic", "topics", "what is this", "what are these",
        "about", "key point", "main point", "core", "explain", "intro"
    ]
    return any(k in q_lower for k in overview_keywords)


def run_rag_query(
    question: str,
    workspace_id: int,
    user_id: int,
    conversation_id: int,
    db: Session,
    top_k: int = 5,
    min_similarity_score: float = 0.05,
) -> Dict[str, Any]:
    """
    Executes an end-to-end RAG query:
    1. Stores user question in the conversation.
    2. Retrieves top-k semantic chunks from ChromaDB filtered by workspace & user.
    3. Intelligently filters chunks based on dynamic thresholding.
    4. Generates grounded answer via LLM (or smart local extractive engine).
    5. Stores assistant response and source citations in the database.
    6. Returns answer and formatted source citations.
    """
    # 1. Record user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=question.strip(),
    )
    db.add(user_msg)
    db.flush()

    # 2. Retrieve relevant chunks from vector store
    retrieved_chunks = query_workspace_chunks(
        query_text=question,
        workspace_id=workspace_id,
        user_id=user_id,
        top_k=top_k,
    )

    # 3. Dynamic Thresholding:
    # For high-level/broad queries, use relaxed threshold so top chunks are never discarded.
    effective_min_score = 0.0 if is_broad_or_overview_query(question) else min_similarity_score

    relevant_chunks = [
        c for c in retrieved_chunks
        if c.get("score", 0.0) >= effective_min_score
    ]

    # If all were filtered out but there ARE positive chunks in the workspace, fallback to top chunks
    if not relevant_chunks and retrieved_chunks:
        positive_chunks = [c for c in retrieved_chunks if c.get("score", 0.0) > 0.0]
        if positive_chunks:
            relevant_chunks = positive_chunks[:3]

    # 4. Generate grounded answer
    answer = llm_service.generate_grounded_answer(
        question=question,
        retrieved_chunks=relevant_chunks,
    )

    # 5. Record assistant message
    asst_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=answer,
    )
    db.add(asst_msg)
    db.flush()

    # 6. Record source citations for chunks used
    formatted_sources = []
    seen_sources = set()

    for chunk in relevant_chunks:
        raw_doc_id = chunk.get("document_id")
        doc_id = None
        if raw_doc_id is not None:
            try:
                doc_id = int(raw_doc_id)
            except (ValueError, TypeError):
                doc_id = None

        raw_page = chunk.get("page_number")
        page_num = 1
        if raw_page is not None:
            try:
                page_num = int(raw_page)
            except (ValueError, TypeError):
                page_num = 1

        chunk_id = chunk.get("chunk_id")
        source_key = (doc_id, page_num)

        # Avoid duplicate citations for the exact same page
        if source_key in seen_sources:
            continue
        seen_sources.add(source_key)

        snippet = chunk.get("text", "")[:350]
        db_source = Source(
            message_id=asst_msg.id,
            document_id=doc_id,
            chunk_id=chunk_id,
            page_number=page_num,
            source_text=snippet,
        )
        db.add(db_source)

        formatted_sources.append({
            "document_id": doc_id,
            "document_name": chunk.get("document_name", "Document"),
            "page_number": page_num,
            "chunk_id": chunk_id,
            "source_text": snippet,
        })

    # Update conversation timestamp & title if initial
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conv and conv.title in ["New Conversation", "New Chat"]:
        conv.title = question[:45] + ("..." if len(question) > 45 else "")

    db.commit()
    db.refresh(asst_msg)

    return {
        "answer": answer,
        "sources": formatted_sources,
        "conversation_id": conversation_id,
        "message_id": asst_msg.id,
    }
