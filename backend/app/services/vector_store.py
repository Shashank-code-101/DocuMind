"""
Vector Store Service (ChromaDB)
Manages persistent vector collections, chunk upserts, workspace-level filtering,
similarity search, and cascade vector deletion.
"""
import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings
from app.services.embedding_service import embed_texts, embed_query

COLLECTION_NAME = "documind_chunks"
_client_instance = None


def get_chroma_client() -> chromadb.PersistentClient:
    """Returns singleton persistent ChromaDB client."""
    global _client_instance
    if _client_instance is None:
        os.makedirs(settings.resolved_chroma_dir, exist_ok=True)
        _client_instance = chromadb.PersistentClient(
            path=settings.resolved_chroma_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client_instance


def get_or_create_collection():
    """Get or create the DocuMind chunks collection."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},  # cosine similarity for MiniLM embeddings
    )


def add_chunks_to_vector_store(chunks: List[Dict[str, Any]]) -> int:
    """
    Computes embeddings for chunks and saves vectors, texts, and metadata into ChromaDB.
    Returns the count of indexed chunks.
    """
    if not chunks:
        return 0

    collection = get_or_create_collection()

    ids = [chunk["chunk_id"] for chunk in chunks]
    texts = [chunk["text"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]

    embeddings = embed_texts(texts)

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )

    return len(ids)


def query_workspace_chunks(
    query_text: str,
    workspace_id: int,
    user_id: int,
    top_k: int = 5,
    document_ids: Optional[List[int]] = None,
) -> List[Dict[str, Any]]:
    """
    Performs vector similarity search filtered by workspace_id and user_id.

    Returns:
        List of matching chunk dicts with:
        {
            "chunk_id": str,
            "text": str,
            "score": float (cosine similarity),
            "document_id": int,
            "document_name": str,
            "page_number": int,
        }
    """
    collection = get_or_create_collection()

    query_vector = embed_query(query_text)
    if not query_vector:
        return []

    # ChromaDB 'where' filter: guarantee user and workspace isolation
    where_filter: Dict[str, Any] = {
        "$and": [
            {"workspace_id": {"$eq": str(workspace_id)}},
            {"user_id": {"$eq": str(user_id)}},
        ]
    }

    # If specific document filtering is requested
    if document_ids:
        if len(document_ids) == 1:
            where_filter["$and"].append({"document_id": {"$eq": str(document_ids[0])}})
        else:
            where_filter["$and"].append({
                "$or": [{"document_id": {"$eq": str(did)}} for did in document_ids]
            })

    try:
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=min(top_k, max(1, collection.count())),
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as e:
        # If collection is empty or filter yields no matches
        return []

    hits = []
    if results and results.get("ids") and len(results["ids"]) > 0:
        ids_list = results["ids"][0]
        docs_list = results["documents"][0] if results.get("documents") else []
        metas_list = results["metadatas"][0] if results.get("metadatas") else []
        dists_list = results["distances"][0] if results.get("distances") else []

        for i in range(len(ids_list)):
            meta = metas_list[i] if i < len(metas_list) else {}
            dist = dists_list[i] if i < len(dists_list) else 1.0
            # Cosine distance to similarity score: similarity = 1 - distance
            similarity = round(1.0 - dist, 4)

            hits.append({
                "chunk_id": ids_list[i],
                "text": docs_list[i] if i < len(docs_list) else "",
                "score": similarity,
                "document_id": int(meta.get("document_id", 0)) if meta.get("document_id") else None,
                "document_name": meta.get("document_name", "Unknown"),
                "page_number": int(meta.get("page_number", 1)) if meta.get("page_number") else 1,
            })

    return hits


def delete_document_vectors(document_id: int) -> None:
    """Removes all vectors belonging to a specific document."""
    try:
        collection = get_or_create_collection()
        collection.delete(where={"document_id": str(document_id)})
    except Exception:
        pass


def delete_workspace_vectors(workspace_id: int) -> None:
    """Removes all vectors belonging to an entire workspace."""
    try:
        collection = get_or_create_collection()
        collection.delete(where={"workspace_id": str(workspace_id)})
    except Exception:
        pass
