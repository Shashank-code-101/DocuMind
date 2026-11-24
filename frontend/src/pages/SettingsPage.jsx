import { Link } from 'react-router-dom'
import {
  ArrowLeft, User, Sun, Moon, Check,
  Palette, Cpu, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import Mascot from '../components/common/Mascot.jsx'
import ThemeToggle from '../components/common/ThemeToggle.jsx'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme, mode, setMode, isDark, availableThemes } = useTheme()

  return (
    <div className="min-h-screen bg-page transition-colors duration-200 pb-20">
      {/* ── App Header ── */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-edge sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-main px-3 py-1.5 rounded-xl border border-edge bg-surface hover:bg-surface-hover shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span className="text-edge font-mono">/</span>
          <h1 className="font-display font-bold text-main text-sm sm:text-base">
            Appearance & Settings
          </h1>
        </div>

        <ThemeToggle showThemeMenu={false} />
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* ── Visual Theme Studio Section ── */}
        <section className="card-bento p-6 sm:p-8 bg-surface border border-edge shadow-card">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                <Palette className="w-4 h-4" />
                <span>DocuMind Theme Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-main">
                Select Your Visual Theme
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1 font-medium">
                DocuMind features 4 art-directed color palettes tailored for reading and focus.
              </p>
            </div>

            <div className="hidden sm:block">
              <Mascot variant="celebrate" size={70} animated={false} />
            </div>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {Object.values(availableThemes).map((t) => {
              const isSelected = theme === t.id
              const colors = isDark ? t.palette.dark : t.palette.light

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30 bg-surface shadow-lift'
                      : 'border-edge hover:border-primary/40 bg-surface-alt/40 hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <h3 className="font-display font-bold text-main text-sm flex items-center gap-1.5">
                          {t.name}
                        </h3>
                        <p className="text-[11px] text-muted">{t.tagline}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-contrast flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Swatch Strip */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-edge/60">
                    <span className="text-[10px] font-bold text-faint uppercase tracking-wider mr-1">
                      Palette:
                    </span>
                    {colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-lg border border-edge/60 shadow-xs inline-block transition-transform group-hover:scale-105"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Light / Dark Mode Segmented Cards */}
          <div>
            <label className="block text-xs font-bold text-main uppercase tracking-wider mb-2.5">
              Display Mode
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setMode('light')}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
                  mode === 'light'
                    ? 'bg-bento-1 border-primary text-main ring-1 ring-primary/40'
                    : 'bg-surface border-edge text-muted hover:bg-surface-hover'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('dark')}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
                  mode === 'dark'
                    ? 'bg-bento-1 border-primary text-main ring-1 ring-primary/40'
                    : 'bg-surface border-edge text-muted hover:bg-surface-hover'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── User Profile Section ── */}
        <section className="card-bento p-6 sm:p-8 bg-surface border border-edge shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-bento-1 flex items-center justify-center text-primary border border-primary/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-main">User Profile</h2>
              <p className="text-xs text-muted">Your authenticated DocuMind credentials</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-2.5 border-b border-edge">
              <span className="text-muted font-medium">Full Name</span>
              <span className="font-bold text-main">{user?.full_name || 'Anonymous User'}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-edge">
              <span className="text-muted font-medium">Email Address</span>
              <span className="font-bold text-main">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-muted font-medium">Security</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" /> Argon2id Password Encryption
              </span>
            </div>
          </div>
        </section>

        {/* ── System Status & Engine Architecture ── */}
        <section className="card-bento p-6 sm:p-8 bg-surface border border-edge shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-bento-2 flex items-center justify-center text-main border border-edge">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-main">System & Vector Engine</h2>
              <p className="text-xs text-muted">Local embedding pipeline and model configurations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-alt/60 border border-edge">
              <p className="text-faint font-semibold mb-1">Embedding Model</p>
              <p className="font-bold text-main font-mono">all-MiniLM-L6-v2</p>
              <p className="text-[10px] text-muted mt-1">384-dimensional dense vectors</p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-alt/60 border border-edge">
              <p className="text-faint font-semibold mb-1">Vector Storage</p>
              <p className="font-bold text-main font-mono">ChromaDB Persistent</p>
              <p className="text-[10px] text-muted mt-1">Cosine similarity metric</p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-alt/60 border border-edge">
              <p className="text-faint font-semibold mb-1">Document Extractor</p>
              <p className="font-bold text-main font-mono">PyMuPDF 2.1</p>
              <p className="text-[10px] text-muted mt-1">Native page-level chunking</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
