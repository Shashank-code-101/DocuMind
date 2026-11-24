"""
DocuMind FastAPI application entry point.

Registers all route modules, configures CORS, and initializes the database on startup.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.connection import init_db
from app.api.routes import auth, workspaces, documents, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once at startup: create storage directories and initialize the database."""
    os.makedirs(settings.resolved_upload_dir, exist_ok=True)
    os.makedirs(settings.resolved_chroma_dir, exist_ok=True)
    init_db()
    yield


app = FastAPI(
    title="DocuMind API",
    description="AI-powered document intelligence and question-answering system.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow the React dev server and any configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    """Simple health-check endpoint. Returns 200 when the API is running."""
    return {"status": "ok", "service": "DocuMind API", "version": "0.1.0"}
