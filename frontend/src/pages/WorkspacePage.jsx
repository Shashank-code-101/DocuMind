import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Trash2,
  Loader2,
  Plus,
  MessageSquare,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Clock,
  Search,
  ExternalLink,
  Eye,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { workspaceService } from "../services/workspaceService.js";
import { documentService } from "../services/documentService.js";
import { chatService } from "../services/chatService.js";
import ConfirmModal from "../components/common/ConfirmModal.jsx";
import Mascot from "../components/common/Mascot.jsx";
import ThemeToggle from "../components/common/ThemeToggle.jsx";
import Logo from "../components/common/Logo.jsx";

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Deletion modal state
  const [docToDelete, setDocToDelete] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(false);

  const loadData = async () => {
    try {
      const [wsRes, docsRes, convsRes] = await Promise.all([
        workspaceService.get(workspaceId),
        documentService.list(workspaceId),
        chatService.listConversations(workspaceId),
      ]);
      setWorkspace(wsRes.data);
      setDocuments(docsRes.data);
      setConversations(convsRes.data || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  // Auto-poll document list while any document is being processed
  useEffect(() => {
    const activeStatuses = [
      "pending",
      "processing",
      "extracting_text",
      "recognizing_handwriting",
      "generating_embeddings",
    ];
    const hasActiveDocs = documents.some((d) =>
      activeStatuses.includes(d.processing_status),
    );
    if (!hasActiveDocs) return;

    const interval = setInterval(async () => {
      try {
        const res = await documentService.list(workspaceId);
        setDocuments(res.data);
      } catch (_) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [documents, workspaceId]);

  const handleFiles = async (files) => {
    const pdfs = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length === 0) {
      setUploadError("Only PDF files are supported.");
      return;
    }
    setUploadError("");
    setUploading(true);
    for (const file of pdfs) {
      try {
        const res = await documentService.upload(workspaceId, file);
        setDocuments((prev) => [res.data, ...prev]);
      } catch (err) {
        setUploadError(err.message || "Error processing document");
      }
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return;
    setDeletingDoc(true);
    try {
      await documentService.delete(docToDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      setDocToDelete(null);
    } catch (err) {
      alert(err.message || "Failed to delete document");
    } finally {
      setDeletingDoc(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await chatService.createConversation(
        workspaceId,
        "New Conversation",
      );
      navigate(`/workspaces/${workspaceId}/chat/${res.data.id}`);
    } catch (err) {
      alert(err.message || "Failed to create chat");
    }
  };

  const handleContinueChat = () => {
    if (conversations.length > 0) {
      navigate(`/workspaces/${workspaceId}/chat/${conversations[0].id}`);
    } else {
      handleNewChat();
    }
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((d) =>
      d.original_filename.toLowerCase().includes(q),
    );
  }, [documents, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-page gap-3 text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold">Opening workspace studio…</span>
      </div>
    );
  }

  const latestConversation = conversations[0];

  return (
    <div className="min-h-screen bg-page transition-colors duration-200 pb-20">
      {/* ── Top App Bar ── */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-edge sticky top-0 z-40 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-edge bg-surface hover:bg-surface-hover text-muted hover:text-main text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-edge font-mono hidden sm:inline">/</span>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-display font-bold text-main truncate">
                {workspace?.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle showThemeMenu={true} compact={true} />

            {conversations.length > 0 ? (
              <button
                onClick={handleContinueChat}
                className="btn-theme-primary text-xs sm:text-sm px-3.5 py-1.5 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Continue Chat</span>
              </button>
            ) : (
              <button
                onClick={handleNewChat}
                className="btn-theme-primary text-xs sm:text-sm px-3.5 py-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Chat</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Studio ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Workspace Title & Stats Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Studio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-main">
              {workspace?.name}
            </h2>
            {workspace?.description && (
              <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl font-medium">
                {workspace.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-surface border border-edge text-xs font-semibold text-main shadow-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              {documents.length}{" "}
              {documents.length === 1 ? "Document" : "Documents"}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-surface border border-edge text-xs font-semibold text-main shadow-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              {conversations.length}{" "}
              {conversations.length === 1 ? "Conversation" : "Conversations"}
            </span>
          </div>
        </div>

        {/* ── Prominent Chat Action Section on Main Page ── */}
        <section className="card-bento p-6 sm:p-8 bg-bento-1 border border-primary/25 relative overflow-hidden shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/75 border border-edge text-main text-xs font-bold mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Multi-Document Grounded RAG</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-display font-extrabold text-main mb-2">
                {conversations.length > 0
                  ? "Continue Your Conversation"
                  : "Start a New Document Q&A"}
              </h3>

              <p className="text-xs sm:text-sm text-muted leading-relaxed font-medium">
                {conversations.length > 0
                  ? `Resume discussing "${latestConversation?.title}" or start a new thread based on your ${documents.length} uploaded PDF(s). Ask anything — Docu retrieves the exact supporting passages.`
                  : `Ask natural-language questions across all ${documents.length} document(s) uploaded in this workspace. Answers feature verifiable page citations.`}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {conversations.length > 0 ? (
                <>
                  <button
                    onClick={handleContinueChat}
                    className="btn-theme-primary text-xs sm:text-sm px-5 py-3 shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Continue Chat</span>
                  </button>
                  <button
                    onClick={handleNewChat}
                    className="btn-theme-secondary text-xs sm:text-sm px-4 py-3"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Chat</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNewChat}
                  disabled={documents.length === 0}
                  className="btn-theme-primary text-xs sm:text-sm px-6 py-3 shadow-md disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Start New Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent Conversations preview chips */}
          {conversations.length > 0 && (
            <div className="mt-6 pt-5 border-t border-primary/15 relative z-10">
              <p className="text-[11px] font-bold text-main uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Recent Conversations in this Workspace:</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {conversations.slice(0, 3).map((conv) => (
                  <Link
                    key={conv.id}
                    to={`/workspaces/${workspaceId}/chat/${conv.id}`}
                    className="p-3 bg-surface rounded-xl border border-edge hover:border-primary/50 shadow-xs hover:shadow-sm transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-main truncate group-hover:text-primary transition-colors">
                        {conv.title}
                      </p>
                      <span className="text-[10px] text-faint flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(
                          conv.updated_at || conv.created_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-faint group-hover:text-primary transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Decorative Mascot in corner */}
          <div className="absolute -bottom-4 -right-2 opacity-90 hidden lg:block pointer-events-none">
            <Mascot variant="reading" size={120} animated={false} />
          </div>
        </section>

        {/* ── Upload Dropzone ── */}
        <section>
          <div
            className={`card-bento border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
              dragging
                ? "border-primary bg-bento-1 scale-[1.01]"
                : "border-edge hover:border-primary/50 hover:bg-surface-hover bg-surface"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input").click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-main">
                  Docu is reading & indexing your PDF…
                </p>
                <p className="text-xs text-muted">
                  PyMuPDF is extracting clean text and ChromaDB is generating
                  vector embeddings
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <Mascot
                  variant="thinking"
                  size={75}
                  animated={true}
                  className="mb-2"
                />
                <p className="text-sm font-bold text-main">
                  Click to upload or drag & drop PDF files here
                </p>
                <p className="text-xs text-muted mt-1">
                  Supports research papers, books, reports · Up to 50 MB per
                  file
                </p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs font-semibold text-red-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </section>

        {/* ── Document Search & List ── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-display font-bold text-main">
                Workspace Documents{" "}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-bento-2 text-main border border-edge">
                  {documents.length}
                </span>
              </h3>
              <p className="text-xs text-muted">
                Documents chunked and indexed into the vector store
              </p>
            </div>

            {/* Document search filter */}
            {documents.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documents…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-theme pl-8 py-1.5 text-xs"
                />
              </div>
            )}
          </div>

          {documents.length === 0 ? (
            /* Empty State */
            <div className="card-bento p-10 text-center flex flex-col items-center justify-center bg-surface border border-edge">
              <Mascot
                variant="empty"
                size={110}
                speech="No documents yet!"
                animated={true}
              />
              <p className="text-sm font-bold text-main mt-4 mb-1">
                Your document collection is empty
              </p>
              <p className="text-xs text-muted max-w-sm mb-4">
                Drag and drop your first PDF into the upload zone above to
                enable semantic search and AI Q&A.
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="card-bento p-8 text-center text-muted text-xs bg-surface border border-edge">
              No documents matched "{searchQuery}".
            </div>
          ) : (
            /* Documents List */
            <div className="grid grid-cols-1 gap-3">
              {filteredDocuments.map((doc) => {
                const getStatusMeta = (status) => {
                  switch (status) {
                    case "completed":
                      return {
                        label: "Ready",
                        style:
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        active: false,
                      };
                    case "extracting_text":
                      return {
                        label: "Extracting Text",
                        style:
                          "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                        active: true,
                      };
                    case "recognizing_handwriting":
                      return {
                        label: "Recognizing Handwriting",
                        style:
                          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
                        active: true,
                      };
                    case "generating_embeddings":
                      return {
                        label: "Generating Embeddings",
                        style:
                          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                        active: true,
                      };
                    case "processing":
                      return {
                        label: "Processing",
                        style:
                          "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                        active: true,
                      };
                    case "pending":
                      return {
                        label: "Queued",
                        style:
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                        active: true,
                      };
                    case "no_text":
                      return {
                        label: "No Text Found",
                        style:
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                        active: false,
                      };
                    case "failed":
                      return {
                        label: "Failed",
                        style:
                          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                        active: false,
                      };
                    default:
                      return {
                        label: status || "Pending",
                        style: "bg-surface text-faint border-edge",
                        active: false,
                      };
                  }
                };

                const meta = getStatusMeta(doc.processing_status);

                return (
                  <div
                    key={doc.id}
                    className="card-bento px-4 py-3.5 bg-surface border border-edge hover:border-primary/40 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-bento-1 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 font-bold text-xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-main truncate">
                          {doc.original_filename}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1 text-[11px] text-muted flex-wrap">
                          <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                          {doc.total_pages && (
                            <span>• {doc.total_pages} pages</span>
                          )}
                          {doc.chunk_count && (
                            <span>• {doc.chunk_count} chunks</span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${meta.style}`}
                            title={doc.processing_error || meta.label}
                          >
                            {meta.active && (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            )}
                            {meta.label}
                          </span>
                          {doc.processing_error &&
                            doc.processing_status === "completed" && (
                              <span
                                className="text-[10px] text-amber-500 italic truncate max-w-[200px]"
                                title={doc.processing_error}
                              >
                                ({doc.processing_error})
                              </span>
                            )}
                          {doc.processing_error &&
                            doc.processing_status === "failed" && (
                              <span
                                className="text-[10px] text-rose-500 italic truncate max-w-[200px]"
                                title={doc.processing_error}
                              >
                                ({doc.processing_error})
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* View streaming PDF */}
                      <a
                        href={documentService.getViewUrl(doc.id, 1)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-faint hover:text-main hover:bg-surface-hover rounded-xl border border-edge transition-colors"
                        title="View PDF Document"
                      >
                        <Eye className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="p-2 text-faint hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-edge hover:border-red-500/30 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={!!docToDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.original_filename}"?`}
        confirmText="Delete Document"
        isLoading={deletingDoc}
        onConfirm={confirmDeleteDocument}
        onClose={() => setDocToDelete(null)}
      />
    </div>
  );
}
