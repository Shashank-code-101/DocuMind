import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, Loader2, FileText, Copy, Check,
  Plus, Trash2, ExternalLink, X, MessageSquare, ChevronRight,
  Sparkles, HelpCircle, CornerDownLeft, Eye, BookOpen
} from 'lucide-react'
import { chatService } from '../services/chatService.js'
import { documentService } from '../services/documentService.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmModal from '../components/common/ConfirmModal.jsx'
import Mascot from '../components/common/Mascot.jsx'
import ThemeToggle from '../components/common/ThemeToggle.jsx'
import MarkdownRenderer from '../components/common/MarkdownRenderer.jsx'

function MessageItem({ msg, onCitationClick }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : ''} group animate-in fade-in duration-200`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-contrast flex items-center justify-center text-xs font-bold shadow-xs">
            U
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-bento-1 border border-primary/25 flex items-center justify-center shadow-xs">
            <Mascot variant="reading" size={24} animated={false} />
          </div>
        )}
      </div>

      {/* Message Box */}
      <div className={`max-w-2xl ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div
          className={`relative px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-colors ${
            isUser
              ? 'bg-primary text-primary-contrast rounded-tr-xs font-medium whitespace-pre-wrap'
              : 'bg-surface border border-edge text-main rounded-tl-xs'
          }`}
        >
          {isUser ? (
            msg.content
          ) : (
            <MarkdownRenderer content={msg.content} />
          )}

          {/* Copy button for assistant responses */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-edge text-muted hover:text-primary rounded-lg px-2 py-0.5 shadow-xs text-[11px] font-semibold flex items-center gap-1"
              title="Copy answer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>

        {/* Source Citations Badges */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-faint uppercase tracking-wider self-center">
              Sources:
            </span>
            {msg.sources.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onCitationClick(src)}
                className="text-xs bg-surface hover:bg-surface-hover text-main border border-edge hover:border-primary px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs hover:-translate-y-0.5 transition-all cursor-pointer font-medium group/pill"
                title="Click to view source page and highlighted excerpt"
              >
                <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0 group-hover/pill:scale-110 transition-transform" />
                <span className="truncate max-w-[150px] font-semibold">
                  {src.document_name || 'Document'}
                </span>
                {src.page_number && (
                  <span className="px-1.5 py-0.5 rounded-md bg-bento-1 border border-primary/20 text-main text-[10px] font-bold font-mono">
                    p. {src.page_number}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PDFViewerDrawer({ source, workspaceDocs = [], onClose }) {
  const [iframeLoaded, setIframeLoaded] = useState(false)

  if (!source) return null

  // Resolve document ID if missing from source metadata
  const docId =
    source.document_id ||
    workspaceDocs.find((d) => d.original_filename === source.document_name)?.id

  const pageNum = source.page_number || 1
  const pdfUrl = docId ? documentService.getViewUrl(docId, pageNum) : null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface h-full flex flex-col shadow-lift border-l border-edge animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 border-b border-edge flex items-center justify-between bg-surface-alt/60">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <h3 className="font-display font-bold text-main truncate text-sm">
                {source.document_name || 'Document Viewer'}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-bento-1 border border-primary/20 text-main text-xs font-bold font-mono">
                Page {pageNum}
              </span>
              <span className="text-[11px] text-muted">Cited Supporting Reference</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 text-xs font-semibold text-main hover:text-primary rounded-xl hover:bg-surface-hover border border-edge transition-colors flex items-center gap-1.5 shadow-xs"
                title="Open PDF in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Tab</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-muted hover:text-main rounded-xl hover:bg-surface-hover border border-edge transition-colors"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source Text Snippet */}
        {source.source_text && (
          <div className="p-4 bg-bento-1/70 border-b border-primary/20 text-xs text-main">
            <span className="font-bold text-primary uppercase text-[10px] tracking-wider block mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Cited Passage Excerpt (from Page {pageNum}):
            </span>
            <p className="leading-relaxed font-serif italic text-muted max-h-28 overflow-y-auto pr-1">
              "{source.source_text}"
            </p>
          </div>
        )}

        {/* PDF Frame Area */}
        <div className="flex-1 bg-surface-alt/40 relative flex flex-col">
          {pdfUrl ? (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-surface z-10 text-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-medium">Streaming PDF to Page {pageNum}…</span>
                </div>
              )}
              <iframe
                src={pdfUrl}
                title={source.document_name}
                className="w-full h-full border-none"
                onLoad={() => setIframeLoaded(true)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-xs text-muted p-6 text-center">
              <Mascot variant="empty" size={80} animated={false} />
              <p className="font-bold text-main mt-3">Document stream not available</p>
              <p className="text-[11px] text-muted max-w-xs mt-1">
                The file may have been moved or re-uploaded. You can inspect the cited text excerpt above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { workspaceId, conversationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [conversations, setConversations] = useState([])
  const [workspaceDocs, setWorkspaceDocs] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeSource, setActiveSource] = useState(null)
  const [convId, setConvId] = useState(conversationId ? parseInt(conversationId) : null)
  const [convToDelete, setConvToDelete] = useState(null)
  const [deletingConv, setDeletingConv] = useState(false)
  const bottomRef = useRef(null)

  // Load conversations & workspace documents
  const loadInitialData = async () => {
    try {
      const [convsRes, docsRes] = await Promise.all([
        chatService.listConversations(workspaceId),
        documentService.list(workspaceId),
      ])
      setConversations(convsRes.data)
      setWorkspaceDocs(docsRes.data || [])

      if (!convId && convsRes.data.length > 0) {
        setConvId(convsRes.data[0].id)
        navigate(`/workspaces/${workspaceId}/chat/${convsRes.data[0].id}`, { replace: true })
      }
    } catch (_) {}
  }

  useEffect(() => {
    loadInitialData()
  }, [workspaceId])

  // Load messages for current conversation
  useEffect(() => {
    if (!convId) {
      setMessages([])
      return
    }
    setLoading(true)
    chatService
      .getMessages(convId)
      .then((res) => setMessages(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleNewChat = async () => {
    try {
      const res = await chatService.createConversation(workspaceId, 'New Conversation')
      setConversations((prev) => [res.data, ...prev])
      setConvId(res.data.id)
      setMessages([])
      navigate(`/workspaces/${workspaceId}/chat/${res.data.id}`)
    } catch (err) {
      alert(err.message || 'Failed to create chat')
    }
  }

  const confirmDeleteConversation = async () => {
    if (!convToDelete) return
    const id = convToDelete.id
    setDeletingConv(true)
    try {
      await chatService.deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (convId === id) {
        const remaining = conversations.filter((c) => c.id !== id)
        if (remaining.length > 0) {
          setConvId(remaining[0].id)
          navigate(`/workspaces/${workspaceId}/chat/${remaining[0].id}`)
        } else {
          setConvId(null)
          setMessages([])
          navigate(`/workspaces/${workspaceId}/chat`)
        }
      }
      setConvToDelete(null)
    } catch (err) {
      alert(err.message || 'Failed to delete chat')
    } finally {
      setDeletingConv(false)
    }
  }

  const handleSend = async (queryText = null) => {
    const q = (typeof queryText === 'string' ? queryText : input).trim()
    if (!q || sending) return

    let activeConvId = convId
    if (!activeConvId) {
      try {
        const res = await chatService.createConversation(workspaceId, q.slice(0, 45))
        activeConvId = res.data.id
        setConvId(activeConvId)
        setConversations((prev) => [res.data, ...prev])
        navigate(`/workspaces/${workspaceId}/chat/${activeConvId}`, { replace: true })
      } catch (err) {
        alert(err.message || 'Failed to start conversation')
        return
      }
    }

    const userMsg = { id: Date.now(), role: 'user', content: q, sources: [] }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await chatService.ask(activeConvId, q)
      const { answer, sources, message_id } = res.data
      const asstMsg = { id: message_id, role: 'assistant', content: answer, sources: sources || [] }
      setMessages((prev) => [...prev, asstMsg])
      // Refresh list to update conversation title
      chatService.listConversations(workspaceId).then((r) => setConversations(r.data)).catch(() => {})
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Error: ${err.message || 'Failed to generate answer'}`,
          sources: [],
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const promptSuggestions = [
    'What are the key findings or takeaways from these documents?',
    'Summarize the core methodology and conclusion.',
    'Extract any important dates, milestones, or metrics mentioned.',
  ]

  return (
    <div className="flex h-screen bg-page overflow-hidden transition-colors duration-200">
      {/* ── Left Sidebar (Conversations) ── */}
      <aside className="w-72 bg-surface border-r border-edge flex flex-col h-full flex-shrink-0 transition-colors">
        <div className="p-3.5 border-b border-edge flex items-center justify-between">
          <Link
            to={`/workspaces/${workspaceId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-main transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>
          <button
            onClick={handleNewChat}
            className="btn-theme-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-faint">
              <p>No conversations yet.</p>
              <p className="mt-1">Ask a question to start!</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === convId
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setConvId(c.id)
                    navigate(`/workspaces/${workspaceId}/chat/${c.id}`)
                  }}
                  className={`group px-3 py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-bento-1 text-main font-bold border border-primary/25 shadow-xs'
                      : 'text-muted hover:text-main hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConvToDelete(c)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-faint hover:text-red-500 rounded-lg transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Sidebar Footer with Theme Toggle popping upward */}
        <div className="p-3 border-t border-edge flex items-center justify-between bg-surface-alt/30">
          <span className="text-[11px] font-semibold text-faint">Theme</span>
          <ThemeToggle showThemeMenu={true} compact={true} dropDirection="up" />
        </div>
      </aside>

      {/* ── Main Chat Column ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-page">
        {/* Top Header with Theme Toggle */}
        <header className="bg-surface/90 backdrop-blur-md border-b border-edge px-6 py-3 flex items-center justify-between flex-shrink-0 transition-colors z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-bento-1 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="font-display font-bold text-main text-xs sm:text-sm truncate">
                {conversations.find((c) => c.id === convId)?.title || 'Intelligent Q&A Thread'}
              </h2>
              <p className="text-[10px] text-faint">
                {workspaceDocs.length} {workspaceDocs.length === 1 ? 'document' : 'documents'} indexed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-[11px] text-faint">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>ChromaDB Vector Store</span>
            </div>
            {/* Prominent Theme Toggle in Header */}
            <ThemeToggle showThemeMenu={true} compact={false} dropDirection="down" />
          </div>
        </header>

        {/* Messages Scroll View */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <span className="text-xs font-semibold">Loading messages…</span>
              </div>
            ) : messages.length === 0 ? (
              /* Empty Chat State with Mascot & Quick Suggestions */
              <div className="card-bento p-8 text-center flex flex-col items-center justify-center bg-surface border border-edge shadow-card my-10">
                <Mascot variant="searching" size={110} speech="Ask me anything!" animated={true} />
                <h3 className="font-display font-bold text-main text-lg mt-4 mb-1">
                  What would you like to explore?
                </h3>
                <p className="text-xs text-muted max-w-md mx-auto mb-6 leading-relaxed">
                  Docu will semantically search across all documents in this workspace, synthesizing an answer grounded with exact page citations.
                </p>

                {/* Prompt suggestion buttons */}
                <div className="space-y-2 w-full max-w-lg">
                  <div className="text-[10px] uppercase font-bold text-faint tracking-wider mb-1">
                    Try asking:
                  </div>
                  {promptSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(sug)}
                      className="w-full text-left p-2.5 rounded-xl bg-surface-alt/60 hover:bg-surface-hover border border-edge text-xs text-main hover:text-primary transition-all flex items-center justify-between group"
                    >
                      <span className="truncate">"{sug}"</span>
                      <CornerDownLeft className="w-3.5 h-3.5 text-faint group-hover:text-primary flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  onCitationClick={(src) => setActiveSource(src)}
                />
              ))
            )}

            {/* AI Generating Indicator */}
            {sending && (
              <div className="flex gap-3.5 items-start animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-bento-1 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Mascot variant="thinking" size={24} animated={false} />
                </div>
                <div className="card-bento bg-surface border border-edge rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2.5 shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs font-semibold text-muted">
                    Searching vector embeddings & synthesizing cited answer…
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input Bar ── */}
        <div className="bg-surface border-t border-edge p-4 flex-shrink-0 transition-colors">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2.5 items-end">
              <textarea
                className="input-theme flex-1 resize-none min-h-[46px] max-h-32 py-2.5 text-xs sm:text-sm"
                placeholder="Ask Docu anything about your documents… (Enter to send, Shift+Enter for new line)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                className="btn-theme-primary p-3 aspect-square flex items-center justify-center rounded-xl shadow-xs"
                title="Send message"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[10px] text-faint mt-2 text-center">
              Answers are grounded in documents from this workspace. Click any source chip to preview citations in the PDF viewer.
            </p>
          </div>
        </div>
      </div>

      {/* ── PDF Source Viewer Drawer ── */}
      <PDFViewerDrawer
        source={activeSource}
        workspaceDocs={workspaceDocs}
        onClose={() => setActiveSource(null)}
      />

      {/* ── Delete Conversation Confirmation Modal ── */}
      <ConfirmModal
        isOpen={!!convToDelete}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${convToDelete?.title}"? All questions, cited answers, and records in this conversation will be permanently removed.`}
        confirmText="Delete Chat"
        isLoading={deletingConv}
        onConfirm={confirmDeleteConversation}
        onClose={() => setConvToDelete(null)}
      />
    </div>
  )
}
