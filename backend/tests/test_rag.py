"""
Tests for RAG Engine & Vector Store:
- Vector store chunk upsert and ChromaDB persistence
- Workspace isolation (no cross-workspace retrieval)
- Query embedding generation using all-MiniLM-L6-v2
- Grounded prompt formatting
- Source citation metadata verification
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import Base, engine, SessionLocal
from app.database.models.conversation import Conversation
from app.database.models.workspace import Workspace
from app.database.models.user import User
from app.services.vector_store import (
    add_chunks_to_vector_store,
    query_workspace_chunks,
    delete_document_vectors,
    delete_workspace_vectors,
)
from app.services.llm_service import format_context_for_prompt, llm_service
from app.services.rag_pipeline import run_rag_query

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Clean test collections
    delete_workspace_vectors(101)
    delete_workspace_vectors(102)
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_vector_store_upsert_and_retrieval():
    # Create chunks for Workspace 101, User 1
    chunks = [
        {
            "chunk_id": "doc_1_p1_c0",
            "text": "The admission deadline for the Master in Computer Science program is July 31st.",
            "metadata": {
                "user_id": "1",
                "workspace_id": "101",
                "document_id": "1",
                "document_name": "admissions.pdf",
                "page_number": 1,
                "chunk_id": "doc_1_p1_c0",
            },
        },
        {
            "chunk_id": "doc_1_p2_c0",
            "text": "Applicants must submit official transcripts and three letters of recommendation.",
            "metadata": {
                "user_id": "1",
                "workspace_id": "101",
                "document_id": "1",
                "document_name": "admissions.pdf",
                "page_number": 2,
                "chunk_id": "doc_1_p2_c0",
            },
        },
    ]

    added = add_chunks_to_vector_store(chunks)
    assert added == 2

    # Query for admission deadline
    results = query_workspace_chunks(
        query_text="When is the deadline to apply?",
        workspace_id=101,
        user_id=1,
        top_k=2,
    )

    assert len(results) > 0
    top_hit = results[0]
    assert "July 31st" in top_hit["text"]
    assert top_hit["document_name"] == "admissions.pdf"
    assert top_hit["page_number"] == 1
    assert top_hit["document_id"] == 1


def test_vector_store_workspace_isolation():
    # Chunk in Workspace 101 (User 1)
    chunk_ws1 = [{
        "chunk_id": "ws1_chunk",
        "text": "Project Apollo budget is twenty million dollars.",
        "metadata": {
            "user_id": "1",
            "workspace_id": "101",
            "document_id": "1",
            "document_name": "apollo.pdf",
            "page_number": 1,
            "chunk_id": "ws1_chunk",
        },
    }]
    # Chunk in Workspace 102 (User 2)
    chunk_ws2 = [{
        "chunk_id": "ws2_chunk",
        "text": "Project Zeus budget is forty million dollars.",
        "metadata": {
            "user_id": "2",
            "workspace_id": "102",
            "document_id": "2",
            "document_name": "zeus.pdf",
            "page_number": 1,
            "chunk_id": "ws2_chunk",
        },
    }]

    add_chunks_to_vector_store(chunk_ws1)
    add_chunks_to_vector_store(chunk_ws2)

    # User 2 querying Workspace 102 should NOT see Project Apollo
    results_ws2 = query_workspace_chunks(
        query_text="What is the project budget?",
        workspace_id=102,
        user_id=2,
        top_k=5,
    )

    for hit in results_ws2:
        assert "Apollo" not in hit["text"]
        assert hit["document_name"] != "apollo.pdf"

    # User 1 querying Workspace 101 should NOT see Project Zeus
    results_ws1 = query_workspace_chunks(
        query_text="What is the project budget?",
        workspace_id=101,
        user_id=1,
        top_k=5,
    )

    for hit in results_ws1:
        assert "Zeus" not in hit["text"]
        assert hit["document_name"] != "zeus.pdf"


def test_vector_deletion_by_document():
    chunks = [{
        "chunk_id": "doc_to_delete_chunk",
        "text": "Temporary secret document content.",
        "metadata": {
            "user_id": "1",
            "workspace_id": "101",
            "document_id": "555",
            "document_name": "temp.pdf",
            "page_number": 1,
            "chunk_id": "doc_to_delete_chunk",
        },
    }]
    add_chunks_to_vector_store(chunks)

    # Confirm present
    res = query_workspace_chunks("secret document", workspace_id=101, user_id=1, top_k=1)
    assert len(res) > 0

    # Delete
    delete_document_vectors(555)

    # Confirm removed
    res_after = query_workspace_chunks("secret document", workspace_id=101, user_id=1, top_k=1)
    assert len(res_after) == 0


def test_format_context_for_prompt():
    chunks = [
        {"document_name": "DocA.pdf", "page_number": 3, "text": "Content of passage A."},
        {"document_name": "DocB.pdf", "page_number": 7, "text": "Content of passage B."},
    ]
    formatted = format_context_for_prompt(chunks)
    assert "[Passage 1 | Document: DocA.pdf | Page: 3]" in formatted
    assert "Content of passage A." in formatted
    assert "[Passage 2 | Document: DocB.pdf | Page: 7]" in formatted


def test_run_rag_query_end_to_end():
    db = SessionLocal()
    try:
        # Create user & workspace & conversation
        user = User(full_name="RAG Tester", email="rag@test.com", password_hash="hash")
        db.add(user)
        db.commit()
        db.refresh(user)

        ws = Workspace(user_id=user.id, name="AI Research")
        db.add(ws)
        db.commit()
        db.refresh(ws)

        conv = Conversation(user_id=user.id, workspace_id=ws.id, title="New Conversation")
        db.add(conv)
        db.commit()
        db.refresh(conv)

        # Add chunks
        chunks = [{
            "chunk_id": f"rag_test_{ws.id}",
            "text": "The transformer architecture uses multi-head self-attention mechanisms to process tokens in parallel.",
            "metadata": {
                "user_id": str(user.id),
                "workspace_id": str(ws.id),
                "document_id": "999",
                "document_name": "attention.pdf",
                "page_number": 4,
                "chunk_id": f"rag_test_{ws.id}",
            },
        }]
        add_chunks_to_vector_store(chunks)

        # Run RAG query
        result = run_rag_query(
            question="What mechanism does the transformer architecture use?",
            workspace_id=ws.id,
            user_id=user.id,
            conversation_id=conv.id,
            db=db,
            top_k=2,
            min_similarity_score=0.1,
        )

        assert "answer" in result
        assert len(result["answer"]) > 0
        assert "sources" in result
        assert len(result["sources"]) >= 1

        top_source = result["sources"][0]
        assert top_source["document_name"] == "attention.pdf"
        assert top_source["page_number"] == 4
        assert top_source["document_id"] == 999
    finally:
        db.close()
