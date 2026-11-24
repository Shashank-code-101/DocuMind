import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  MessageSquare,
  FolderOpen,
  LogOut,
  Settings,
  User,
  ChevronRight,
  Loader2,
  Trash2,
  Sparkles,
  BookOpen,
  HelpCircle,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { workspaceService } from "../services/workspaceService.js";
import Logo from "../components/common/Logo.jsx";
import Mascot from "../components/common/Mascot.jsx";
import ThemeToggle from "../components/common/ThemeToggle.jsx";
import ConfirmModal from "../components/common/ConfirmModal.jsx";

function Sidebar({ user, onLogout }) {
  return (
    <aside className="w-64 bg-surface border-r border-edge flex flex-col h-screen fixed left-0 top-0 z-30 transition-colors">
      {/* Brand header */}
      <div className="p-5 border-b border-edge flex items-center justify-between">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-faint px-3 mb-2">
          Studio
        </div>
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-bento-1 text-main font-bold text-sm shadow-xs border border-primary/20 transition-all"
        >
          <FolderOpen className="w-4 h-4 text-primary" />
          <span>Workspaces</span>
        </Link>
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-muted hover:text-main hover:bg-surface-hover font-semibold text-sm transition-all"
        >
          <Settings className="w-4 h-4 text-faint" />
          <span>Themes & Settings</span>
        </Link>
      </nav>

      {/* Theme & User Profile Footer */}
      <div className="p-4 border-t border-edge bg-surface-alt/40 space-y-3">
        <div className="relative flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-faint">Appearance</span>
          <div className="[&_.relative]:static [&_.absolute]:top-auto [&_.absolute]:right-auto [&_.absolute]:bottom-full [&_.absolute]:mb-2 [&_.absolute]:left-1/2 [&_.absolute]:-translate-x-1/2 [&_.absolute]:w-56">
            <ThemeToggle showThemeMenu={true} compact={true} />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-edge flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bento-2 flex items-center justify-center flex-shrink-0 text-main font-bold text-xs border border-edge">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-main truncate">
              {user?.full_name}
            </p>
            <p className="text-[10px] text-faint truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function CreateWorkspaceModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }
    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="card-bento w-full max-w-md p-6 bg-surface border border-edge shadow-lift">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-bento-1 flex items-center justify-center text-primary border border-primary/20">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-main">
              Create New Workspace
            </h2>
            <p className="text-xs text-muted">
              Organize PDFs, embeddings, and chat threads
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-medium text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-main uppercase tracking-wider mb-1.5">
              Workspace Name *
            </label>
            <input
              type="text"
              className="input-theme"
              placeholder="e.g. Legal Contracts 2026 or Biology 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-main uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              className="input-theme h-22 resize-none"
              placeholder="What kind of documents will live in this workspace?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-theme-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-theme-primary flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating…</span>
                </>
              ) : (
                <span>Create Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceService.list();
      setWorkspaces(res.data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleCreate = async (data) => {
    const res = await workspaceService.create(data);
    setWorkspaces((prev) => [res.data, ...prev]);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    setDeleting(true);
    try {
      await workspaceService.delete(workspaceToDelete.id);
      setWorkspaces((prev) =>
        prev.filter((w) => w.id !== workspaceToDelete.id),
      );
      setWorkspaceToDelete(null);
    } catch (err) {
      alert(err.message || "Failed to delete workspace");
    } finally {
      setDeleting(false);
    }
  };

  const totalDocs = workspaces.reduce(
    (sum, ws) => sum + (ws.document_count || 0),
    0,
  );
  const totalConversations = workspaces.reduce(
    (sum, ws) => sum + (ws.conversation_count || 0),
    0,
  );

  // Contextual Greeting helper
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.full_name?.split(" ")[0] || "Friend";

  return (
    <div className="flex min-h-screen bg-page transition-colors duration-200">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="ml-64 flex-1 p-6 sm:p-10 max-w-7xl">
        {/* ── Bento Welcome Banner ── */}
        <div className="card-bento p-6 sm:p-8 bg-bento-1 border border-primary/20 shadow-card mb-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/70 border border-edge text-main text-xs font-bold mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Workspace Studio Active</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-main tracking-tight mb-2">
              {greeting}, {firstName}! 👋
            </h1>

            <p className="text-sm text-muted leading-relaxed font-medium">
              You have{" "}
              <strong className="text-main">
                {workspaces.length} workspaces
              </strong>{" "}
              with <strong className="text-main">{totalDocs} documents</strong>{" "}
              indexed in ChromaDB. Ready to dive into intelligent research?
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="btn-theme-primary text-xs sm:text-sm px-4 py-2.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Workspace</span>
              </button>
            </div>
          </div>

          {/* Docu Mascot Banner Illustration */}
          <div className="z-10 flex-shrink-0 self-center sm:self-auto">
            <Mascot
              variant="wave"
              size={110}
              speech={`Ready to help, ${firstName}!`}
              animated={true}
            />
          </div>
        </div>

        {/* ── Bento Statistics Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {/* Card 1: Workspaces */}
          <div className="card-bento p-5 bg-surface border border-edge flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-faint mb-1">
                Total Workspaces
              </p>
              <p className="text-3xl font-display font-black text-main">
                {workspaces.length}
              </p>
              <p className="text-[11px] text-muted mt-1">
                Organized research hubs
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-bento-1 flex items-center justify-center text-primary border border-primary/20">
              <FolderOpen className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Documents */}
          <div className="card-bento p-5 bg-surface border border-edge flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-faint mb-1">
                Total Documents
              </p>
              <p className="text-3xl font-display font-black text-main">
                {totalDocs}
              </p>
              <p className="text-[11px] text-muted mt-1">
                Extracted & vectorized PDFs
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-bento-2 flex items-center justify-center text-main border border-edge">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Card 3: Conversations */}
          <div className="card-bento p-5 bg-surface border border-edge flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-faint mb-1">
                Conversations
              </p>
              <p className="text-3xl font-display font-black text-main">
                {totalConversations}
              </p>
              <p className="text-[11px] text-muted mt-1">Cited Q&A sessions</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-bento-3 flex items-center justify-center text-main border border-edge">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* ── Workspaces Section ── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-main">
              Your Workspaces
            </h2>
            <p className="text-xs text-muted">
              Select a workspace to manage documents and ask questions
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-theme-secondary text-xs px-3.5 py-2 hidden sm:inline-flex"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Workspace</span>
          </button>
        </div>

        {loading ? (
          <div className="card-bento p-12 flex flex-col items-center justify-center gap-3 text-muted">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm font-medium">
              Gathering your workspaces…
            </span>
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty State with Mascot */
          <div className="card-bento p-12 text-center flex flex-col items-center justify-center bg-surface border border-edge shadow-card">
            <Mascot
              variant="empty"
              size={130}
              speech="Nothing here yet!"
              animated={true}
            />
            <h3 className="text-xl font-display font-bold text-main mt-4 mb-2">
              No workspaces found
            </h3>
            <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
              Create your very first workspace to begin uploading PDFs,
              generating semantic embeddings, and chatting with Docu.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-theme-primary text-sm px-5 py-2.5 shadow-lift"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Workspace</span>
            </button>
          </div>
        ) : (
          /* Bento Workspaces Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="card-bento p-5 bg-surface border border-edge card-bento-hover flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-bento-1 border border-primary/20 flex items-center justify-center text-primary font-bold">
                      <FolderOpen className="w-5 h-5" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setWorkspaceToDelete(ws);
                      }}
                      className="p-1.5 text-faint hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete workspace"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/workspaces/${ws.id}`}
                    className="block group-hover:text-primary transition-colors"
                  >
                    <h3 className="text-base font-display font-bold text-main mb-1 truncate">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-muted mb-4 line-clamp-2 min-h-[32px]">
                      {ws.description || "No description provided."}
                    </p>
                  </Link>
                </div>

                <div className="pt-3.5 border-t border-edge flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <FileText className="w-3.5 h-3.5 text-faint" />
                      {ws.document_count}{" "}
                      {ws.document_count === 1 ? "doc" : "docs"}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <MessageSquare className="w-3.5 h-3.5 text-faint" />
                      {ws.conversation_count || 0}{" "}
                      {ws.conversation_count === 1 ? "chat" : "chats"}
                    </span>
                  </div>

                  <Link
                    to={`/workspaces/${ws.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Open</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Helpful Onboarding Tips Card ── */}
        <div className="mt-12 card-bento p-6 bg-surface-alt/40 border border-edge/80">
          <div className="flex items-center gap-2.5 mb-3 text-main font-bold text-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span>Docu's Quick Tips</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted">
            <div className="p-3 rounded-xl bg-surface border border-edge">
              <span className="font-bold text-main block mb-1">
                1. Multi-Doc Synthesis
              </span>
              Ask questions that compare multiple files — Docu automatically
              searches across all workspace documents simultaneously.
            </div>
            <div className="p-3 rounded-xl bg-surface border border-edge">
              <span className="font-bold text-main block mb-1">
                2. Click Source Chips
              </span>
              Every citation badge in the chat opens the slide-out viewer with
              the exact page and highlight excerpt.
            </div>
            <div className="p-3 rounded-xl bg-surface border border-edge">
              <span className="font-bold text-main block mb-1">
                3. Custom Themes
              </span>
              Switch between Paper Pals, Dreamy Digital, Organic Intelligence,
              and Retro Pop anytime via Settings!
            </div>
          </div>
        </div>
      </main>

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Reusable ConfirmModal for Workspace Deletion */}
      <ConfirmModal
        isOpen={!!workspaceToDelete}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${workspaceToDelete?.name}"? All uploaded documents and conversation histories in this workspace will be permanently deleted.`}
        confirmText="Delete Workspace"
        isLoading={deleting}
        onConfirm={handleDeleteWorkspace}
        onClose={() => setWorkspaceToDelete(null)}
      />
    </div>
  );
}
