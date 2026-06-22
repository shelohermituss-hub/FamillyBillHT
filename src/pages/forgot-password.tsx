import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── Tokens ────────────────────────────────────────────────────────────────────
const INDIGO  = '#4F46E5'
const INK     = '#111827'
const MUTED   = '#6B7280'
const BG_IN   = '#F3F4F6'
const BTN_OFF = '#E5E7EB'
const OTP_LEN = 6
const OTP_TTL = 30

type FpStep = 'email' | 'otp' | 'password' | 'success'

// ── Numpad (telephone style) ─────────────────────────────────────────────────
const PAD_KEYS = [
  { n: '1', s: '' },    { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
  { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
  { n: '7', s: 'PQRS'}, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ'},
  { n: '', s: '' },      { n: '0', s: '' },     { n: '⌫', s: '' },
]

function Numpad({ onDigit, onDel }: { onDigit: (d: string) => void; onDel: () => void }) {
  const rows = [PAD_KEYS.slice(0,3), PAD_KEYS.slice(3,6), PAD_KEYS.slice(6,9), PAD_KEYS.slice(9,12)]
  return (
    <div style={{ borderTop: '1px solid #F3F4F6' }}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((k, ki) => (
            <button
              key={ki}
              onClick={() => k.n === '⌫' ? onDel() : k.n ? onDigit(k.n) : undefined}
              disabled={!k.n}
              className="flex-1 flex flex-col items-center justify-center select-none active:bg-gray-100 transition-colors"
              style={{
                height: 62, background: 'white',
                borderRight: ki < 2 ? '1px solid #F3F4F6' : 'none',
                borderBottom: ri < 3 ? '1px solid #F3F4F6' : 'none',
                cursor: k.n ? 'pointer' : 'default',
              }}
            >
              {k.n === '⌫' ? (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round">
                  <path d="M20 5H8.5a2 2 0 00-1.6.8L2 12l4.9 6.2a2 2 0 001.6.8H20a2 2 0 002-2V7a2 2 0 00-2-2z"/>
                  <path d="M15 9l-4 4M11 9l4 4"/>
                </svg>
              ) : k.n ? (
                <>
                  <span className="text-[21px] font-light leading-none" style={{ color: INK }}>{k.n}</span>
                  {k.s && <span className="text-[8px] tracking-widest font-semibold mt-0.5" style={{ color: MUTED }}>{k.s}</span>}
                </>
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── OTP boxes ────────────────────────────────────────────────────────────────
function OtpBoxes({ value }: { value: string }) {
  return (
    <div className="flex gap-2.5 justify-center my-8">
      {Array.from({ length: OTP_LEN }).map((_, i) => {
        const focused = i === value.length
        const filled  = i < value.length
        return (
          <div key={i}
            className="w-[44px] h-[54px] rounded-2xl flex items-center justify-center text-2xl font-bold transition-all"
            style={{
              border: `2px solid ${focused ? INDIGO : filled ? '#D1D5DB' : '#E5E7EB'}`,
              background: filled ? 'white' : '#FAFAFA',
              color: INK,
            }}>
            {value[i] || ''}
          </div>
        )
      })}
    </div>
  )
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(initial: number) {
  const [count, setCount] = useState(initial)
  const ref = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  function start() {
    setCount(initial)
    clearInterval(ref.current)
    ref.current = setInterval(() => {
      setCount(c => { if (c <= 1) { clearInterval(ref.current); return 0 } return c - 1 })
    }, 1000)
  }
  useEffect(() => { start(); return () => clearInterval(ref.current) }, [])
  return { count, restart: start }
}

function pad2(n: number) { return String(n).padStart(2, '0') }

// ── Gradient header ───────────────────────────────────────────────────────────
function GradientHeader({ title, subtitle, onBack, backTo }: {
  title: string; subtitle: string; onBack?: () => void; backTo?: string
}) {
  return (
    <div
      className="relative flex flex-col items-center pt-14 pb-10 px-6"
      style={{
        background: 'linear-gradient(160deg, #6B63F5 0%, #4F46E5 50%, #2D27AA 100%)',
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
      }}
    >
      {onBack && (
        <button onClick={onBack} className="absolute top-12 left-5 flex items-center cursor-pointer">
          <ChevronLeft className="w-7 h-7 text-white/80" />
        </button>
      )}
      {backTo && !onBack && (
        <Link to={backTo} className="absolute top-12 left-5 flex items-center cursor-pointer">
          <ChevronLeft className="w-7 h-7 text-white/80" />
        </Link>
      )}
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
      <h1 className="text-white font-bold text-2xl tracking-tight">{title}</h1>
      <p className="text-white/60 text-sm mt-1 text-center">{subtitle}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [step, setStep]         = useState<FpStep>('email')
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confPw, setConfPw]     = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  const { count, restart } = useCountdown(OTP_TTL)

  function go(s: FpStep) { setStep(s); setError('') }

  // ── Step: email ──────────────────────────────────────────────────────────
  async function sendCode() {
    if (!email.trim()) { setError('Entrez votre adresse email.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    restart()
    go('otp')
  }

  // ── Step: otp ────────────────────────────────────────────────────────────
  function otpDigit(d: string) {
    if (otp.length >= OTP_LEN) return
    const next = otp + d
    setOtp(next)
    if (next.length === OTP_LEN) {
      setTimeout(() => verifyOtp(next), 250)
    }
  }
  function otpDel() { setOtp(p => p.slice(0, -1)) }

  async function verifyOtp(code: string) {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'recovery',
    })
    setLoading(false)
    if (err) {
      setError('Code incorrect ou expiré. Réessayez.')
      setOtp('')
    } else {
      go('password')
    }
  }

  async function resendCode() {
    setOtp(''); setError('')
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    })
    restart()
  }

  // ── Step: password ───────────────────────────────────────────────────────
  const pwValid   = newPw.length >= 6
  const bothMatch = pwValid && newPw === confPw

  async function updatePassword() {
    if (!bothMatch) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)
    if (err) { setError(err.message); return }
    go('success')
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (step === 'email') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#ffffff', maxWidth: 480, margin: '0 auto' }}>
        <GradientHeader
          title="Mot de passe oublié"
          subtitle="Entrez votre email pour recevoir un code"
          backTo="/login"
        />
        <div className="flex-1 px-6 pt-8 pb-10 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: INK }}>
              Adresse email
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && sendCode()}
              className="w-full py-3.5 px-4 text-base outline-none rounded-2xl"
              style={{ background: BG_IN, color: INK }}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <button
            onClick={sendCode}
            disabled={!email.trim() || loading}
            className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center cursor-pointer"
            style={{ background: email.trim() && !loading ? INDIGO : BTN_OFF, color: email.trim() && !loading ? 'white' : MUTED }}
          >
            {loading
              ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : 'Envoyer le code de réinitialisation'}
          </button>

          <p className="text-center text-sm mt-auto" style={{ color: MUTED }}>
            Vous vous souvenez ?{' '}
            <Link to="/login" className="font-bold" style={{ color: INDIGO }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#ffffff', maxWidth: 480, margin: '0 auto' }}>
        <GradientHeader
          title="Vérification"
          subtitle={`Code envoyé à ${email}`}
          onBack={() => { go('email'); setOtp('') }}
        />
        <div className="flex-1 flex flex-col">
          <div className="px-6 pt-6">
            {/* Countdown */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
                style={{ background: count > 0 ? INDIGO : BTN_OFF, color: count > 0 ? 'white' : MUTED }}>
                {pad2(Math.floor(count / 60))}
              </div>
              <span className="font-bold text-xl" style={{ color: INK }}>:</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
                style={{ background: count > 0 ? INDIGO : BTN_OFF, color: count > 0 ? 'white' : MUTED }}>
                {pad2(count % 60)}
              </div>
            </div>

            <OtpBoxes value={otp} />

            {error && (
              <div className="px-4 py-3 rounded-2xl text-sm mb-3" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                {error}
              </div>
            )}

            {loading && (
              <div className="flex justify-center mb-4">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-indigo-600 animate-spin" />
              </div>
            )}

            {count === 0 && (
              <button onClick={resendCode}
                className="w-full text-center text-sm font-semibold py-2 mb-3 cursor-pointer"
                style={{ color: INDIGO }}>
                Renvoyer le code
              </button>
            )}
          </div>

          <div className="mt-auto">
            <Numpad onDigit={otpDigit} onDel={otpDel} />
          </div>
        </div>
      </div>
    )
  }

  if (step === 'password') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#ffffff', maxWidth: 480, margin: '0 auto' }}>
        <GradientHeader
          title="Nouveau mot de passe"
          subtitle="Choisissez un mot de passe sécurisé"
          onBack={() => go('otp')}
        />
        <div className="flex-1 px-6 pt-8 pb-10 flex flex-col gap-5">

          {/* New password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: INK }}>
              Nouveau mot de passe
            </label>
            <div className="relative flex items-center rounded-2xl"
              style={{
                background: BG_IN,
                border: `2px solid ${pwValid ? '#22C55E' : 'transparent'}`,
                transition: 'border-color 0.2s',
              }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 caractères"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setError('') }}
                className="flex-1 bg-transparent py-3.5 pl-4 pr-12 text-base outline-none"
                style={{ color: INK }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 cursor-pointer">
                {pwValid
                  ? <Check className="w-5 h-5" style={{ color: '#22C55E' }} />
                  : showPw
                    ? <EyeOff className="w-5 h-5" style={{ color: MUTED }} />
                    : <Eye    className="w-5 h-5" style={{ color: MUTED }} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: INK }}>
              Confirmer le mot de passe
            </label>
            <div className="relative flex items-center rounded-2xl"
              style={{
                background: BG_IN,
                border: `2px solid ${bothMatch ? '#22C55E' : 'transparent'}`,
                transition: 'border-color 0.2s',
              }}>
              <input
                type={showConf ? 'text' : 'password'}
                placeholder="Répétez le mot de passe"
                value={confPw}
                onChange={e => { setConfPw(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && updatePassword()}
                className="flex-1 bg-transparent py-3.5 pl-4 pr-12 text-base outline-none"
                style={{ color: INK }}
              />
              <button type="button" onClick={() => setShowConf(!showConf)}
                className="absolute right-3 cursor-pointer">
                {bothMatch
                  ? <Check    className="w-5 h-5" style={{ color: '#22C55E' }} />
                  : showConf
                    ? <EyeOff className="w-5 h-5" style={{ color: MUTED }} />
                    : <Eye    className="w-5 h-5" style={{ color: MUTED }} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <button
            onClick={updatePassword}
            disabled={!bothMatch || loading}
            className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center cursor-pointer"
            style={{ background: bothMatch && !loading ? INDIGO : BTN_OFF, color: bothMatch && !loading ? 'white' : MUTED }}
          >
            {loading
              ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : 'Enregistrer le mot de passe'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step: success ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: '#ffffff', maxWidth: 480, margin: '0 auto' }}>
      <div className="text-center space-y-6">
        {/* Success circle */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #6B63F5, #4F46E5)' }}>
          <Check className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: INK }}>Mot de passe modifié !</h1>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            Votre mot de passe a été mis à jour avec succès.<br />
            Vous pouvez maintenant vous connecter.
          </p>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center cursor-pointer"
          style={{ background: INDIGO, color: 'white' }}
        >
          Se connecter
        </button>
      </div>
    </div>
  )
}
