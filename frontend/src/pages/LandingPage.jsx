import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  MessageSquare,
  Search,
  Shield,
  Zap,
  BookOpen,
  ArrowRight,
  Sparkles,
  Check,
  CheckCircle2,
  ChevronRight,
  Layers,
  Compass,
  Flame,
  HelpCircle,
  FileCheck2,
} from "lucide-react";
import Logo from "../components/common/Logo.jsx";
import Mascot from "../components/common/Mascot.jsx";
import ThemeToggle from "../components/common/ThemeToggle.jsx";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext.jsx";

function Navbar() {
  const { user, loading, isAuthenticated } = useAuth();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-md border-b border-edge/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted">
            <a
              href="#features"
              className="hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#storyboard"
              className="hover:text-primary transition-colors"
            >
              How It Works
            </a>
            <a href="#themes" className="hover:text-primary transition-colors">
              Themes
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle showThemeMenu={true} />

            {!loading && (
              <Link
                to={isAuthenticated ? "" : "/login"}
                className="text-xs sm:text-sm font-semibold text-muted hover:text-main px-3 py-1.5 rounded-xl hover:bg-surface-hover transition-colors"
              >
                <span>{isAuthenticated ? "" : "Sign In"}</span>
              </Link>
            )}
            {!loading && (
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="btn-theme-primary text-sm sm:text-base px-6 py-3 w-full sm:w-auto shadow-lift"
              >
                <span>
                  {isAuthenticated
                    ? "Create Workspace"
                    : "Start Exploring Free"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activePreviewDoc, setActivePreviewDoc] = useState("Research_Q4.pdf");

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative background playful shapes */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-48 h-48 bg-bento-2/40 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto text-center">
        {/* Playful badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bento-1 border border-primary/20 text-main text-xs font-bold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Next-Gen RAG · Grounded Intelligence</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-main leading-[1.08] mb-6">
          Your Documents.
          <br />
          <span className="text-primary underline decoration-wavy decoration-primary/40 underline-offset-8">
            One Intelligent
          </span>{" "}
          Conversation.
        </h1>

        <p className="text-base sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Meet <strong className="text-main font-bold">Docu</strong> — your
          paper pal who reads multi-page PDFs, extracts deep meaning, and
          answers your questions with exact page-level citations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16">
          {!loading && (
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="btn-theme-primary text-sm sm:text-base px-6 py-3 w-full sm:w-auto shadow-lift"
            >
              <span>
                {isAuthenticated ? "Create Workspace" : "Start Exploring Free"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <a
            href="#storyboard"
            className="btn-theme-secondary text-sm sm:text-base px-6 py-3 w-full sm:w-auto"
          >
            <span>See How Docu Works</span>
            <ChevronRight className="w-4 h-4 text-faint" />
          </a>
        </div>
      </div>

      {/* ── Interactive Mascot Hero Stage ── */}
      <div className="max-w-5xl mx-auto relative">
        {/* Floating Mascot waving on top corner of the mockup */}
        <div className="absolute -top-12 -right-4 sm:-top-16 sm:right-6 z-20 hidden xs:flex flex-col items-center">
          <Mascot
            variant="wave"
            size={110}
            speech="Hi! I'm Docu! Ask me anything!"
            animated={true}
          />
        </div>

        {/* Bento Window Preview */}
        <div className="card-bento overflow-hidden shadow-lift border border-edge/90 bg-surface">
          {/* Mac-style Window Bar */}
          <div className="px-4 py-3 bg-surface-alt/70 border-b border-edge flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              <span className="ml-2 text-xs font-semibold text-muted font-mono hidden sm:inline">
                documind.workspace / research-lab
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-bento-1 text-main font-bold text-[10px] uppercase tracking-wider">
                Active Session
              </span>
            </div>
          </div>

          {/* Window Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
            {/* Sidebar Documents */}
            <div className="md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-edge bg-surface-alt/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Workspace
                    Files
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-edge text-muted">
                    3 PDFs
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      name: "Research_Q4.pdf",
                      pages: 18,
                      chunks: 42,
                      active: activePreviewDoc === "Research_Q4.pdf",
                    },
                    {
                      name: "Market_Analysis_2025.pdf",
                      pages: 34,
                      chunks: 88,
                      active: activePreviewDoc === "Market_Analysis_2025.pdf",
                    },
                    {
                      name: "Architecture_Spec.pdf",
                      pages: 12,
                      chunks: 29,
                      active: activePreviewDoc === "Architecture_Spec.pdf",
                    },
                  ].map((doc) => (
                    <button
                      key={doc.name}
                      type="button"
                      onClick={() => setActivePreviewDoc(doc.name)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        doc.active
                          ? "bg-surface border-primary/50 shadow-xs ring-1 ring-primary/20"
                          : "bg-surface/50 border-edge/60 hover:bg-surface hover:border-edge text-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-bento-2 flex items-center justify-center flex-shrink-0 text-main font-bold text-xs">
                          PDF
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-main truncate">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-faint">
                            {doc.pages} pages · {doc.chunks} chunks
                          </p>
                        </div>
                      </div>
                      {doc.active && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-edge/60 flex items-center justify-between text-[11px] text-muted">
                <span>Vector Index: ChromaDB</span>
                <span className="text-emerald-500 font-semibold">● Ready</span>
              </div>
            </div>

            {/* Conversation Studio Mock */}
            <div className="md:col-span-8 p-4 sm:p-6 flex flex-col justify-between bg-surface">
              <div className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-md bg-primary text-primary-contrast px-4 py-2.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm font-medium shadow-xs">
                    What does the report conclude regarding user retention and
                    semantic search?
                  </div>
                </div>

                {/* Assistant Message with Mascot Avatar */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bento-1 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mascot variant="reading" size={26} animated={false} />
                  </div>

                  <div className="flex-1 bg-surface-alt/50 border border-edge/80 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 text-xs sm:text-sm text-main leading-relaxed">
                    <p className="mb-2.5 font-medium">
                      Based on{" "}
                      <span className="font-bold text-primary">
                        {activePreviewDoc}
                      </span>
                      , the semantic search pipeline delivered significant
                      measurable improvements:
                    </p>
                    <ul className="space-y-1.5 text-xs text-muted list-disc list-inside mb-3">
                      <li>
                        <strong className="text-main">Retention uplift:</strong>{" "}
                        User engagement increased by 38% after introducing
                        context-aware answers.
                      </li>
                      <li>
                        <strong className="text-main">Query latency:</strong>{" "}
                        Median vector retrieval across 42 chunks settled under
                        45ms.
                      </li>
                    </ul>

                    {/* Interactive Source Badges */}
                    <div className="pt-2 border-t border-edge/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-faint tracking-wider mr-1">
                        Sources:
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-edge text-[11px] font-semibold text-primary hover:border-primary cursor-pointer transition-colors">
                        📄 {activePreviewDoc}{" "}
                        <span className="text-faint">p. 4</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-edge text-[11px] font-semibold text-primary hover:border-primary cursor-pointer transition-colors">
                        📄 {activePreviewDoc}{" "}
                        <span className="text-faint">p. 9</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar Mock */}
              <div className="mt-4 pt-3 border-t border-edge flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="Can you summarize the third chapter methodology?"
                  className="input-theme text-xs py-2 bg-surface-alt/40 cursor-default"
                />
                <button
                  type="button"
                  className="btn-theme-primary px-3 py-2 text-xs flex-shrink-0"
                >
                  Ask Docu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoFeatures() {
  return (
    <section
      id="features"
      className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-bento-1 border border-primary/20">
          Crafted with Personality
        </span>
        <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-main mt-4 mb-4">
          Everything you need to master your documents
        </h2>
        <p className="text-base sm:text-lg text-muted">
          DocuMind blends high-performance local embeddings with semantic vector
          search and multi-theme aesthetic joy.
        </p>
      </div>

      {/* ── Asymmetric Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bento Card 1: Semantic Retrieval (Wide, 8 cols) */}
        <div className="md:col-span-8 card-bento p-6 sm:p-8 bg-bento-1 border border-edge flex flex-col justify-between relative overflow-hidden">
          <div className="max-w-md z-10">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-edge flex items-center justify-center text-primary shadow-xs mb-5">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-main mb-2">
              Semantic Search That Gets Meaning
            </h3>
            <p className="text-sm text-muted leading-relaxed font-medium">
              Keyword search misses context. DocuMind chunks your PDFs into
              coherent passages, embeds them with{" "}
              <code className="text-xs font-mono font-bold bg-surface/70 px-1.5 py-0.5 rounded">
                all-MiniLM-L6-v2
              </code>
              , and finds the deepest conceptual matches using ChromaDB.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 z-10">
            {[
              "Cosine Similarity",
              "Sliding Window Chunking",
              "Metadata Enrichment",
              "Sub-50ms Retrieval",
            ].map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface/80 border border-edge/80 text-main"
              >
                ✓ {tag}
              </span>
            ))}
          </div>

          {/* Decorative Mascot in corner */}
          <div className="absolute -bottom-2 -right-2 opacity-90 hidden sm:block pointer-events-none">
            <Mascot variant="searching" size={130} animated={false} />
          </div>
        </div>

        {/* Bento Card 2: Page Citations (Tall, 4 cols) */}
        <div className="md:col-span-4 card-bento p-6 sm:p-8 bg-surface border border-edge flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-bento-2 border border-edge flex items-center justify-center text-main shadow-xs mb-5">
              <FileCheck2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-display font-bold text-main mb-2">
              Verifiable Page Citations
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              No hallucinations or vague answers. Every claim is accompanied by
              the exact document name, page number, and clickable source preview
              drawer.
            </p>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-surface-alt/70 border border-edge/60 space-y-1.5">
            <div className="text-[11px] font-bold text-main">
              Source Breakdown:
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Chapter 3 Overview</span>
              <span className="font-mono text-primary font-bold">p. 14</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Financial Summary Table</span>
              <span className="font-mono text-primary font-bold">p. 28</span>
            </div>
          </div>
        </div>

        {/* Bento Card 3: Multi-Workspaces (4 cols) */}
        <div className="md:col-span-4 card-bento p-6 sm:p-8 bg-surface border border-edge flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-bento-3 border border-edge flex items-center justify-center text-main shadow-xs mb-5">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-display font-bold text-main mb-2">
              Isolated Workspaces
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Separate your college courses, client contracts, and research
              projects. Each workspace maintains its own vector collections and
              conversation threads.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-main">
              Multi-tenant security guaranteed
            </span>
          </div>
        </div>

        {/* Bento Card 4: 4 Distinct Visual Themes (8 cols) */}
        <div
          className="md:col-span-8 card-bento p-6 sm:p-8 bg-bento-2 border border-edge flex flex-col justify-between relative overflow-hidden"
          id="themes"
        >
          <div className="max-w-lg z-10">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-edge flex items-center justify-center text-primary shadow-xs mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-main mb-2">
              4 Art-Directed Themes & Real Dark Mode
            </h3>
            <p className="text-sm text-muted leading-relaxed font-medium">
              Say goodbye to boring sterile dashboards. Choose between{" "}
              <strong className="text-main">Paper Pals</strong> (warm ivory &
              cocoa), <strong className="text-main">Dreamy Digital</strong>{" "}
              (lavender & indigo),{" "}
              <strong className="text-main">Organic Intelligence</strong> (sage
              & moss), and <strong className="text-main">Retro Pop</strong>{" "}
              (electric coral & cobalt).
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 z-10">
            <ThemeToggle showThemeMenu={true} />
            <span className="text-xs text-muted font-medium">
              Try toggling themes right now in the menu!
            </span>
          </div>

          {/* Floating Mascot in corner */}
          <div className="absolute -bottom-3 -right-2 opacity-95 hidden sm:block pointer-events-none">
            <Mascot variant="celebrate" size={135} animated={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Storyboard() {
  const steps = [
    {
      num: "01",
      title: "Drop Your Documents",
      desc: "Upload multi-page research papers, textbooks, and reports into clean workspaces.",
      mascot: "empty",
    },
    {
      num: "02",
      title: "Docu Extracts & Embeds",
      desc: "PyMuPDF cleans text while LangChain breaks content into semantic overlapping chunks.",
      mascot: "thinking",
    },
    {
      num: "03",
      title: "Ask in Plain English",
      desc: "Query across multiple documents simultaneously with semantic vector retrieval.",
      mascot: "searching",
    },
    {
      num: "04",
      title: "Learn with Cited Precision",
      desc: "Receive clear syntheses with page citations and inspect sources directly in the app.",
      mascot: "celebrate",
    },
  ];

  return (
    <section
      id="storyboard"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-alt/40 border-y border-edge"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-bento-1 border border-primary/20">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-main mt-4 mb-3">
            How DocuMind Works
          </h2>
          <p className="text-base text-muted">
            From raw PDF to cited conversational intelligence in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st) => (
            <div
              key={st.num}
              className="card-bento p-6 bg-surface border border-edge flex flex-col items-center text-center group hover:border-primary/50 transition-all"
            >
              <div className="h-28 flex items-center justify-center mb-4">
                <Mascot variant={st.mascot} size={88} animated={true} />
              </div>

              <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-bento-1 border border-primary/20 mb-2">
                STEP {st.num}
              </span>

              <h3 className="text-base font-display font-bold text-main mb-2">
                {st.title}
              </h3>

              <p className="text-xs text-muted leading-relaxed font-medium">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      <div className="card-bento p-8 sm:p-14 bg-bento-1 border border-primary/30 relative overflow-hidden shadow-lift">
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="inline-flex justify-center mb-4">
            <Mascot variant="celebrate" size={90} speech="Join us!" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-main mb-4 leading-tight">
            Ready to talk with your documents?
          </h2>

          <p className="text-base sm:text-lg text-muted mb-8 font-medium">
            Create your free account, upload your first PDF, and experience how
            document intelligence should feel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/register"
              className="btn-theme-primary text-sm sm:text-base px-8 py-3.5 shadow-md w-full sm:w-auto"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="btn-theme-secondary text-sm sm:text-base px-8 py-3.5 w-full sm:w-auto"
            >
              Sign In to Your Workspaces
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> Free forever tier
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> Multi-user isolation
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> Exact source citations
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-edge bg-surface py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xs text-faint">
            © {new Date().getFullYear()} DocuMind. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs font-semibold text-muted">
          <a href="#features" className="hover:text-primary transition-colors">
            Features
          </a>
          <a
            href="#storyboard"
            className="hover:text-primary transition-colors"
          >
            Process
          </a>
          <Link to="/login" className="hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="hover:text-primary transition-colors">
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page transition-colors duration-200">
      <Navbar />
      <main>
        <Hero />
        <BentoFeatures />
        <Storyboard />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
