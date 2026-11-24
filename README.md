# DocuMind – AI-Powered Document Intelligence & Question Answering System

DocuMind is a production-oriented, full-stack web application that allows authenticated users to upload multiple PDF documents, organize them into isolated workspaces, and ask natural-language questions.

The application uses an end-to-end **Retrieval-Augmented Generation (RAG)** pipeline to retrieve relevant information from uploaded documents with semantic similarity search and generate grounded answers using Google Gemini, complete with page-level source citations.

---

## 🌟 Key Features

1. **User Authentication & Isolation**:
   - Secure registration and login with Argon2id password hashing.
   - JWT access tokens with server-side authorization on every route.
   - Complete multi-tenant data isolation: users can never access, query, or view another user's workspaces or documents.

2. **Workspace Management**:
   - Create, list, rename, and delete isolated document workspaces.
   - Live document count and conversation tracking.
   - Cascade deletion: deleting a workspace cleans up all associated documents, disk files, and vector embeddings.

3. **Robust Document Processing Pipeline**:
   - PDF validation using file signature magic bytes (`%PDF-`), file size, and emptiness checks.
   - Page-by-page text extraction with **PyMuPDF**.
   - Automatic detection of scanned or image-only PDFs with clear feedback that OCR is required.
   - Semantic text chunking using LangChain's **RecursiveCharacterTextSplitter** (~800 characters, 100 character overlap) while strictly preserving document, page, and chunk metadata.
   - Duplicate detection per workspace via SHA-256 file hashing.

4. **Vector Store & Semantic Search**:
   - Persistent vector storage powered by **ChromaDB**.
   - Dense embeddings using `sentence-transformers/all-MiniLM-L6-v2`.
   - The identical embedding model is used for document chunks and user search queries.
   - Strict workspace-level and user-level metadata filtering during vector similarity search.

5. **Grounded RAG Engine**:
   - Contextual synthesis with official Google Gemini SDK (`google-genai`).
   - System prompts strictly instructing the model to answer exclusively using the retrieved document context.
   - When the uploaded documents lack sufficient supporting facts, the system directly states it cannot find sufficient information rather than hallucinating.
   - Every answer includes exact document and page number citations.

6. **Interactive Conversational UI & PDF Source Viewer**:
   - Conversational chat with thread history per workspace.
   - One-click copy answer with clipboard feedback.
   - Real-time PDF Source Viewer drawer: clicking any citation opens the original PDF navigated directly to the cited page.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router DOM 6, Axios, Lucide React |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic v2, Alembic |
| **Security** | Argon2id (`argon2-cffi`), JWT (`python-jose`, `cryptography`) |
| **Document Processing** | PyMuPDF (`pymupdf`), LangChain Text Splitters |
| **Vector Database** | ChromaDB (`chromadb`) with cosine similarity |
| **Embedding Model** | `sentence-transformers/all-MiniLM-L6-v2` |
| **LLM Provider** | Google Gemini (`google-genai`) |
| **Primary Database** | PostgreSQL (Production) / SQLite (Local Out-of-the-Box Development) |

---

## 📁 Repository Structure

```
documind/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/         # Logo.jsx, ProtectedRoute.jsx
│   │   │   ├── layout/
│   │   │   └── ...
│   │   ├── context/            # AuthContext.jsx
│   │   ├── pages/              # LandingPage, LoginPage, RegisterPage, DashboardPage, WorkspacePage, ChatPage, SettingsPage
│   │   ├── services/           # api.js, authService.js, workspaceService.js, documentService.js, chatService.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── api/routes/         # auth.py, workspaces.py, documents.py, chat.py
│   │   ├── core/               # config.py, security.py, dependencies.py
│   │   ├── database/           # connection.py, models (user, workspace, document, conversation)
│   │   ├── schemas/            # Pydantic schemas (auth, workspace, document, chat)
│   │   ├── services/           # pdf_processor.py, text_chunker.py, embedding_service.py, vector_store.py, llm_service.py, rag_pipeline.py
│   │   └── main.py
│   ├── storage/
│   │   ├── chroma_db/          # Persistent ChromaDB collections
│   │   └── uploads/            # Uploaded PDF files
│   ├── tests/                  # Pytest test suite (24 tests)
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher (Node 24 tested)
- **Git**

---

### 2. Backend Setup

```bash
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (CMD):
.\.venv\Scripts\activate.bat
# macOS / Linux:
source .venv/bin/activate

# Install all backend dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `backend/.env` to configure your settings:
```ini
# Database: Defaults to SQLite for immediate local dev.
# For PostgreSQL in production, set: postgresql://user:password@localhost:5432/documind
DATABASE_URL=sqlite:///./documind.db

# JWT Security
SECRET_KEY=generate-a-strong-secret-key-for-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Google Gemini (get free key at https://aistudio.google.com/)
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash

# Storage
UPLOAD_DIR=storage/uploads
CHROMA_DB_DIR=storage/chroma_db
MAX_FILE_SIZE_MB=50

# CORS
CORS_ORIGINS=http://localhost:5173
```

Run the backend development server:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Health Check: `http://127.0.0.1:8000/api/health`
- Swagger Interactive Documentation: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

In a new terminal window:
```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

The backend includes a comprehensive 24-test automated suite covering all modules:

```bash
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v
```

### Test Coverage Summary:
- **Authentication (`tests/test_auth.py`)**: Registration, password complexity, duplicate email handling, Argon2 verification, JWT token issuance, protected endpoints, logout.
- **Workspaces (`tests/test_workspaces.py`)**: Workspace CRUD, document counts, strict multi-user isolation.
- **PDF Processing (`tests/test_pdf_processing.py`)**: File header validation, text cleaning, page extraction, scanned PDF detection, chunk generation with metadata.
- **RAG & Vector Engine (`tests/test_rag.py`)**: ChromaDB vector upsert, cosine similarity search, workspace filtering, cross-workspace isolation, grounded context prompt generation, end-to-end query execution with source citations.
- **Health & API Schemas (`tests/test_health.py`)**: Health check endpoint and complete OpenAPI schema validation.

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Push the repository to GitHub.
2. In Vercel, import your repository and set:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: `VITE_API_BASE_URL=https://your-backend.onrender.com`
3. Deploy!

### Backend (Render)
1. In Render, create a new **Web Service**.
2. Connect your repository and configure:
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Attach a **Render PostgreSQL** database and copy the internal connection string to `DATABASE_URL`.
4. Add a **Persistent Disk** mounted at `/opt/render/project/src/storage` so uploaded PDFs and ChromaDB vector records persist across server restarts.
5. Set `GEMINI_API_KEY`, `SECRET_KEY`, and `CORS_ORIGINS`.

---

## 🔒 Security Best Practices Implemented

- Passwords hashed using **Argon2id**, the winner of the Password Hashing Competition.
- Tokens stored in memory / `sessionStorage` rather than persistent long-lived `localStorage`.
- All database queries and vector searches enforce server-side user ID and workspace ID filters.
- Uploaded files validated against both MIME type and `%PDF-` file signature bytes.
- Prompt injection protection: retrieved context is labeled as data, and Gemini is instructed to disregard instructions inside uploaded texts that attempt to override system rules.

---

## 📄 License

MIT License. Built with FastAPI, React, ChromaDB, and Google Gemini.
