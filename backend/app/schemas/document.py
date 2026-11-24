"""Schemas for document upload and status responses."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    workspace_id: int
    original_filename: str
    file_size: int
    total_pages: Optional[int]
    processing_status: str
    processing_error: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
