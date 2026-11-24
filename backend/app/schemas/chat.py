"""Schemas for conversations, messages, and source citations."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"


class ConversationResponse(BaseModel):
    id: int
    workspace_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SourceResponse(BaseModel):
    document_id: Optional[int]
    document_name: Optional[str]
    page_number: Optional[int]
    chunk_id: Optional[str]
    source_text: Optional[str]

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: List[SourceResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceResponse] = []
    conversation_id: int
    message_id: int
