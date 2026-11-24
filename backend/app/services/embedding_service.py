"""
Embedding Service
Generates vector embeddings using sentence-transformers/all-MiniLM-L6-v2.
Provides singleton model loading and identical embedding generation for both
document chunks and user search queries.
"""
from typing import List
import os

_model_instance = None
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def get_embedding_model():
    """
    Lazy singleton loader for the sentence-transformers model.
    Falls back to ChromaDB's ONNX-based all-MiniLM-L6-v2 if PyTorch
    is initializing or unavailable.
    """
    global _model_instance
    if _model_instance is not None:
        return _model_instance

    try:
        from sentence_transformers import SentenceTransformer
        _model_instance = SentenceTransformer(MODEL_NAME)
        return _model_instance
    except Exception as e:
        # Fallback to ChromaDB's built-in ONNX all-MiniLM-L6-v2 implementation
        try:
            from chromadb.utils import embedding_functions
            _model_instance = embedding_functions.DefaultEmbeddingFunction()
            return _model_instance
        except Exception as inner_e:
            raise RuntimeError(f"Could not initialize embedding model: {str(e)}; fallback error: {str(inner_e)}")


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of strings (e.g. document chunks).
    Returns list of float vectors (384 dimensions for all-MiniLM-L6-v2).
    """
    if not texts:
        return []

    model = get_embedding_model()

    # If it is a sentence-transformers instance
    if hasattr(model, "encode"):
        embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
        return embeddings.tolist() if hasattr(embeddings, "tolist") else list(embeddings)

    # If it is ChromaDB's DefaultEmbeddingFunction callable
    return model(texts)


def embed_query(query: str) -> List[float]:
    """
    Generate embedding for a single search query string.
    Uses the exact same embedding model as documents.
    """
    results = embed_texts([query])
    return results[0] if results else []
