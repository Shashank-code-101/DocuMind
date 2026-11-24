"""Schemas for workspace CRUD operations."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    document_count: int = 0
    conversation_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
