import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { authService } from '../services/authService.js'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/common/Logo.jsx'
import Mascot from '../components/common/Mascot.jsx'
import ThemeToggle from '../components/common/ThemeToggle.jsx'

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-surface-alt/60 border border-edge">
      {checks.map(({ label, ok }) => (
        <div
          key={label}
          className={`flex items-center gap-1.5 text-[11px] font-medium ${
            ok ? 'text-emerald-500 font-bold' : 'text-faint'
          }`}
        >
          <CheckCircle className={`w-3 h-3 ${ok ? 'text-emerald-500' : 'text-faint/50'}`} />
          {label}
        </div>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await authService.register(form)
      // Auto-login after registration
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Floating Theme Switcher top right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle showThemeMenu={true} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block hover:opacity-90 transition-opacity mb-4">
          <Logo size="lg" />
        </Link>

        {/* Mascot celebrating */}
        <div className="flex justify-center mb-2">
          <Mascot variant="celebrate" size={90} speech="Join DocuMind!" animated={true} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-main">
          Create Your Account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-bento p-6 sm:p-8 bg-surface border border-edge shadow-lift">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs font-semibold text-red-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-main uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                name="full_name"
                type="text"
                required
                className="input-theme"
                placeholder="Jane Smith"
                value={form.full_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-theme"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-main uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-theme pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-main"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div>
              <label className="block text-xs font-bold text-main uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-theme"
                placeholder="••••••••"
                value={form.confirm_password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-theme-primary w-full py-3 text-sm shadow-md mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-edge text-center">
            <Link to="/" className="text-xs text-muted hover:text-main font-semibold">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
