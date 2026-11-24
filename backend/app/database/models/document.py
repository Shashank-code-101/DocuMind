"""
Document model: tracks uploaded PDFs and their processing status.
The actual file is stored on disk; vectors are stored in ChromaDB.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # File metadata
    original_filename = Column(String(512), nullable=False)
    stored_filename = Column(String(512), nullable=False)   # UUID-based name on disk
    file_path = Column(String(1024), nullable=False)
    file_hash = Column(String(64), nullable=False)          # SHA-256 for duplicate detection
    file_size = Column(BigInteger, nullable=False)
    total_pages = Column(Integer, nullable=True)
    
    # Processing lifecycle
    # Statuses: pending | processing | completed | failed | no_text
    processing_status = Column(String(50), default="pending", nullable=False)
    processing_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    workspace = relationship("Workspace", back_populates="documents")
    sources = relationship("Source", back_populates="document", cascade="all, delete-orphan")
