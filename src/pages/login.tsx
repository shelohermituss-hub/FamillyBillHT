import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

// ── Tokens ────────────────────────────────────────────────────────────────────
const INDIGO   = '#4F46E5'
const INK      = '#111827'
const MUTED    = '#6B7280'
const BG_IN    = '#F3F4F6'
const BTN_OFF  = '#E5E7EB'

// ── OAuth icon components ─────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.97 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 814 1000" fill={INK}>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-162-39.3c-76.5 0-103.7 40.8-165.9 40.8s-105-57.9-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.2-49.9 190.5-49.9 30.8 0 130.3 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
  )
}

export function LoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [loadingOAuth, setLoadingOAuth] = useState<'google' | 'apple' | null>(null)
  const [error, setError]           = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Remplissez tous les champs.'); return }
    setLoading(true); setError('')
    const { error: err } = await signIn(email.trim(), password)
    if (err) {
      const msg = err.message
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('Email ou mot de passe incorrect.')
      } else if (msg.includes('Email not confirmed')) {
        setError("Votre email n'est pas encore confirmé.")
      } else if (msg.includes('rate limit')) {
        setError('Trop de tentatives. Réessayez dans quelques minutes.')
      } else {
        setError(msg)
      }
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  async function oauthGoogle() {
    setLoadingOAuth('google')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
  }

  async function oauthApple() {
    setLoadingOAuth('apple')
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
  }

  const canLogin = email.trim().length > 0 && password.length > 0

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff', maxWidth: 480, margin: '0 auto' }}>

      {/* ── Gradient header ────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center pt-14 pb-10 px-6"
        style={{
          background: 'linear-gradient(160deg, #6B63F5 0%, #4F46E5 50%, #2D27AA 100%)',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
        }}
      >
        {/* Back arrow */}
        <Link to="/" className="absolute top-12 left-5 flex items-center cursor-pointer">
          <ChevronLeft className="w-7 h-7 text-white/80" />
        </Link>

        {/* Logo circle */}
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
          <img src="/logo.png" alt="FamillyBill HT" className="w-12 h-12 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
          <span className="text-white font-black text-2xl" style={{ display: 'none' }}>FB</span>
        </div>

        <h1 className="text-white font-bold text-2xl tracking-tight">FamillyBill HT</h1>
        <p className="text-white/60 text-sm mt-1">Connectez-vous à votre compte</p>
      </div>

      {/* ── Form area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pt-8 pb-10 flex flex-col gap-5">

        {/* Email field */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: INK }}>
            Adresse email
          </label>
          <div className="relative flex items-center" style={{ background: BG_IN, borderRadius: 14 }}>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && document.getElementById('pw-input')?.focus()}
              className="flex-1 bg-transparent py-3.5 pl-4 pr-12 text-base outline-none"
              style={{ color: INK }}
            />
            <button
              type="button"
              onClick={() => document.getElementById('pw-input')?.focus()}
              className="absolute right-3 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: INDIGO }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Password field */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: INK }}>
            Mot de passe
          </label>
          <div className="relative flex items-center" style={{ background: BG_IN, borderRadius: 14 }}>
            <input
              id="pw-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Votre mot de passe"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && canLogin && handleLogin()}
              className="flex-1 bg-transparent py-3.5 pl-4 pr-12 text-base outline-none"
              style={{ color: INK }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: 'transparent' }}
            >
              {showPw
                ? <EyeOff className="w-5 h-5" style={{ color: MUTED }} />
                : <Eye    className="w-5 h-5" style={{ color: MUTED }} />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <Link to="/forgot-password"
          className="text-right text-sm font-medium self-end -mt-2 cursor-pointer"
          style={{ color: INDIGO }}>
          Mot de passe oublié ?
        </Link>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={!canLogin || loading}
          className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center cursor-pointer transition-all"
          style={{ background: canLogin && !loading ? INDIGO : BTN_OFF, color: canLogin && !loading ? 'white' : MUTED }}
        >
          {loading
            ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : 'Se connecter'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
          <span className="text-sm" style={{ color: MUTED }}>Ou se connecter avec</span>
          <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
        </div>

        {/* OAuth buttons */}
        <div className="flex gap-3">
          <button
            onClick={oauthApple}
            disabled={loadingOAuth !== null}
            className="flex-1 h-13 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-sm cursor-pointer transition-all border"
            style={{ background: 'white', color: INK, borderColor: '#E5E7EB', height: 52 }}
          >
            {loadingOAuth === 'apple'
              ? <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
              : <><AppleIcon /><span>Apple</span></>}
          </button>
          <button
            onClick={oauthGoogle}
            disabled={loadingOAuth !== null}
            className="flex-1 h-13 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-sm cursor-pointer transition-all border"
            style={{ background: 'white', color: INK, borderColor: '#E5E7EB', height: 52 }}
          >
            {loadingOAuth === 'google'
              ? <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
              : <><GoogleIcon /><span>Google</span></>}
          </button>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm mt-auto" style={{ color: MUTED }}>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-bold cursor-pointer" style={{ color: INDIGO }}>
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
