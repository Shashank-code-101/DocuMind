"""
SQLAlchemy engine and session factory.
Call init_db() at application startup to create all tables.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Normalize PostgreSQL dialect if needed (e.g., Neon / Render 'postgres://' URLs)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Configure engine based on database dialect
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,       # test connections before use to handle idle serverless drops
        pool_recycle=300,         # refresh connections older than 5 min (critical for Neon serverless)
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All ORM models inherit from this Base
Base = declarative_base()


def init_db():
    """Import all models so SQLAlchemy can register them, then create all tables."""
    # These imports must happen before create_all so SQLAlchemy sees the models
    from app.database.models import user, workspace, document, conversation  # noqa: F401
    Base.metadata.create_all(bind=engine)
