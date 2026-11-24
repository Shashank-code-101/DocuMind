"""
Text Chunker Service
Splits extracted document pages into semantic chunks using LangChain's
RecursiveCharacterTextSplitter while strictly preserving page-level and document metadata.
"""
from typing import List, Dict, Any


def chunk_document_pages(
    pages: List[Dict[str, Any]],
    user_id: int,
    workspace_id: int,
    document_id: int,
    document_name: str,
    chunk_size: int = 800,
    chunk_overlap: int = 100,
) -> List[Dict[str, Any]]:
    """
    Chunks a list of page objects into overlapping text chunks with rich metadata.

    Args:
        pages: List of dicts, each with keys 'page_number' and 'text'.
        user_id: User ID owning the workspace.
        workspace_id: Workspace ID.
        document_id: Database Document ID.
        document_name: Original file name.
        chunk_size: Approximate size of each chunk (characters).
        chunk_overlap: Number of characters to overlap between adjacent chunks.

    Returns:
        List of chunk dicts:
        {
            "chunk_id": f"doc_{document_id}_p{page_number}_c{chunk_idx}",
            "text": chunk_text,
            "metadata": {
                "user_id": str(user_id),
                "workspace_id": str(workspace_id),
                "document_id": str(document_id),
                "document_name": document_name,
                "page_number": int(page_number),
                "chunk_id": chunk_id,
            }
        }
    """
    # Import LangChain's RecursiveCharacterTextSplitter with fallback
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            keep_separator=True,
        )
    except ImportError:
        # High quality fallback recursive splitter if langchain-text-splitters isn't available
        class SimpleRecursiveSplitter:
            def __init__(self, c_size: int, c_overlap: int):
                self.c_size = c_size
                self.c_overlap = c_overlap

            def split_text(self, text: str) -> List[str]:
                if not text:
                    return []
                chunks = []
                start = 0
                text_len = len(text)
                while start < text_len:
                    end = start + self.c_size
                    if end >= text_len:
                        chunks.append(text[start:].strip())
                        break
                    # Try to break on paragraph or sentence
                    cut = text.rfind("\n\n", start, end)
                    if cut == -1 or cut <= start:
                        cut = text.rfind(". ", start, end)
                    if cut == -1 or cut <= start:
                        cut = text.rfind(" ", start, end)
                    if cut == -1 or cut <= start:
                        cut = end
                    chunks.append(text[start:cut].strip())
                    start = max(start + 1, cut - self.c_overlap)
                return [c for c in chunks if c]

        splitter = SimpleRecursiveSplitter(chunk_size, chunk_overlap)

    all_chunks = []

    for page in pages:
        page_num = page["page_number"]
        page_text = page.get("text", "").strip()

        if not page_text:
            continue

        raw_splits = splitter.split_text(page_text)

        for chunk_idx, chunk_text in enumerate(raw_splits):
            chunk_text = chunk_text.strip()
            if not chunk_text:
                continue

            chunk_id = f"doc_{document_id}_p{page_num}_c{chunk_idx}"
            chunk_metadata = {
                "user_id": str(user_id),
                "workspace_id": str(workspace_id),
                "document_id": str(document_id),
                "document_name": document_name,
                "page_number": int(page_num),
                "chunk_id": chunk_id,
            }

            all_chunks.append({
                "chunk_id": chunk_id,
                "text": chunk_text,
                "metadata": chunk_metadata,
            })

    return all_chunks
