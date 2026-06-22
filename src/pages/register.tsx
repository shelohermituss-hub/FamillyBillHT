import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff, Search, Check, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

type Step = 'welcome' | 'phone' | 'otp' | 'name' | 'country' | 'email' | 'pin' | 'pinConfirm' | 'password'

// ── Tokens ────────────────────────────────────────────────────────────────────
const INDIGO = '#4F46E5'
const INK    = '#111827'
const MUTED  = '#6B7280'
const BG_IN  = '#F3F4F6'
const BTN_OFF = '#E5E7EB'
const PIN_LEN = 6
const OTP_TTL = 30  // seconds countdown

const COUNTRIES = [
  'Haïti', 'États-Unis', 'Canada', 'France', 'République Dominicaine',
  'Martinique', 'Guadeloupe', 'Guyane française', 'Belgique', 'Suisse',
  'Brésil', 'Mexique', 'Colombie', 'Venezuela', 'Chili', 'Argentine',
  'Cuba', 'Jamaïque', 'Puerto Rico', 'Bahamas', 'Trinidad-et-Tobago',
  'Barbade', 'Espagne', 'Portugal', 'Italie', 'Allemagne', 'Pays-Bas',
  'Royaume-Uni', 'Maroc', 'Sénégal', "Côte d'Ivoire", 'Cameroun', 'Autre',
]

// ── Google & Apple SVG icons ──────────────────────────────────────────────────
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

// ── Demo credit card ───────────────────────────────────────────────────────────
function DemoCard() {
  return (
    <div
      className="mx-auto relative select-none"
      style={{
        width: 290, height: 185,
        borderRadius: 22,
        background: 'linear-gradient(135deg, #5B52F5 0%, #2D27AA 45%, #0D0B2E 100%)',
        transform: 'rotate(-4deg)',
        boxShadow: '0 24px 60px rgba(79,70,229,0.45)',
      }}
    >
      {/* Cardholder name */}
      <p className="absolute top-5 left-5 text-white/80 text-[13px] italic font-medium leading-tight">
        FamillyBill<br/>HT
      </p>
      {/* Mastercard circles */}
      <div className="absolute top-4 right-5 flex -space-x-3">
        <div className="w-9 h-9 rounded-full opacity-75" style={{ background: '#FF5F00' }}/>
        <div className="w-9 h-9 rounded-full opacity-65" style={{ background: '#FFB300' }}/>
      </div>
      {/* Card numbers (right column, like the screenshot) */}
      <div className="absolute right-5 top-14 text-right space-y-0">
        {['2507','5645','6685','5633'].map(n => (
          <p key={n} className="text-white/55 text-sm font-mono leading-[1.4]">{n}</p>
        ))}
      </div>
      {/* Chip */}
      <div className="absolute left-5 top-[60px]">
        <div className="w-11 h-9 rounded-md opacity-60" style={{ background: 'linear-gradient(135deg, #BF9B3F, #E8CC80)' }}>
          <div className="w-full h-full rounded-md flex items-center justify-center">
            <div className="w-7 h-5 border border-yellow-900/30 rounded" style={{ background: 'linear-gradient(90deg,#C8A845,#F0D870,#C8A845)' }}/>
          </div>
        </div>
      </div>
      {/* Brand */}
      <p className="absolute bottom-4 left-5 text-white font-black text-lg tracking-wider uppercase"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
        FamillyBill
      </p>
    </div>
  )
}

// ── Telephone numpad (with letter labels) ─────────────────────────────────────
const PAD_KEYS = [
  { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
  { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
  { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
  { n: '', s: '' }, { n: '0', s: '' }, { n: '⌫', s: '' },
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
                height: 66, background: 'white',
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
                  <span className="text-[22px] font-light leading-none" style={{ color: INK }}>{k.n}</span>
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

// ── PIN dots (masking) ────────────────────────────────────────────────────────
function PinDots({ value }: { value: string }) {
  return (
    <div className="flex gap-3.5 justify-center my-10">
      {Array.from({ length: PIN_LEN }).map((_, i) => {
        const filled = i < value.length
        const isLast = filled && i === value.length - 1
        return (
          <div key={i} className="w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-100"
            style={{ background: filled ? INDIGO : '#E5E7EB', transform: isLast ? 'scale(1.08)' : 'scale(1)' }}>
            {isLast && <span className="text-xl font-bold text-white">{value[i]}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── OTP boxes (visible digits) ────────────────────────────────────────────────
function OtpBoxes({ value }: { value: string }) {
  return (
    <div className="flex gap-2.5 justify-center my-8">
      {Array.from({ length: PIN_LEN }).map((_, i) => {
        const isFocused = i === value.length
        const filled = i < value.length
        return (
          <div key={i}
            className="w-[46px] h-[56px] rounded-2xl flex items-center justify-center text-2xl font-bold transition-all"
            style={{
              border: `2px solid ${isFocused ? INDIGO : filled ? '#D1D5DB' : '#E5E7EB'}`,
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

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(initial: number) {
  const [count, setCount] = useState(initial)
  const ref = useRef<ReturnType<typeof setInterval>|undefined>(undefined)
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

// ── Shared sub-components ─────────────────────────────────────────────────────
function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center cursor-pointer py-1 -ml-1">
      <ChevronLeft className="w-7 h-7" style={{ color: INK }}/>
    </button>
  )
}

function Btn({ label, onClick, disabled, loading }: {
  label: string; onClick: () => void; disabled?: boolean; loading?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center cursor-pointer transition-colors"
      style={{ background: disabled || loading ? BTN_OFF : INDIGO, color: disabled || loading ? MUTED : 'white' }}>
      {loading
        ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
        : label}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('welcome')
  const [viaEmail, setViaEmail] = useState(false)

  // Form fields
  const [phone, setPhone]           = useState('')
  const [otpInput, setOtpInput]     = useState('')
  const [fullName, setFullName]     = useState('')
  const [country, setCountry]       = useState('')
  const [cSearch, setCSearch]       = useState('')
  const [email, setEmail]           = useState('')
  const [pinVal, setPinVal]         = useState('')
  const [pinConf, setPinConf]       = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showConfPw, setShowConfPw] = useState(false)
  const [confPw, setConfPw]         = useState('')

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const { count: otpCount, restart: restartOtp } = useCountdown(OTP_TTL)

  // ── Navigation ────────────────────────────────────────────────────────────
  function prevStep(): Step | null {
    switch (step) {
      case 'welcome':    return null
      case 'phone':      return 'welcome'
      case 'otp':        return 'phone'
      case 'name':       return viaEmail ? 'welcome' : 'otp'
      case 'country':    return 'name'
      case 'email':      return 'country'
      case 'pin':        return 'email'
      case 'pinConfirm': return 'pin'
      case 'password':   return 'pinConfirm'
      default:           return null
    }
  }

  function goBack() {
    const prev = prevStep()
    if (!prev) navigate('/')
    else { setStep(prev); setError('') }
  }

  function go(s: Step) { setStep(s); setError('') }

  // ── OAuth ─────────────────────────────────────────────────────────────────
  async function oauthGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
  }
  async function oauthApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
  }

  // ── Step logic ────────────────────────────────────────────────────────────
  function submitPhone() {
    if (phone.replace(/\D/g, '').length < 7) { setError('Numéro invalide.'); return }
    restartOtp(); go('otp')
  }

  function skipPhone() { setViaEmail(true); setPhone(''); go('name') }

  function otpDigit(d: string) {
    if (otpInput.length >= PIN_LEN) return
    const next = otpInput + d
    setOtpInput(next)
    if (next.length === PIN_LEN) setTimeout(() => { setOtpInput(''); go('name') }, 250)
  }
  function otpDel() { setOtpInput(p => p.slice(0,-1)) }

  async function resendOtp() {
    restartOtp(); setOtpInput('')
    // In production: supabase.auth.signInWithOtp({ phone })
  }

  function submitName() {
    if (fullName.trim().length < 2) { setError('Nom trop court.'); return }
    go('country')
  }

  function submitCountry() {
    if (!country) { setError('Sélectionnez un pays.'); return }
    go('email')
  }

  function submitEmail() {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!ok) { setError('Email invalide.'); return }
    go('pin')
  }

  function pinDigit(d: string) {
    if (pinVal.length >= PIN_LEN) return
    const next = pinVal + d
    setPinVal(next)
    if (next.length === PIN_LEN) setTimeout(() => go('pinConfirm'), 280)
  }
  function pinDel() { setPinVal(p => p.slice(0,-1)) }

  function pinConfDigit(d: string) {
    if (pinConf.length >= PIN_LEN) return
    const next = pinConf + d
    setPinConf(next)
    if (next.length === PIN_LEN) {
      if (next === pinVal) { setTimeout(() => go('password'), 280) }
      else { setTimeout(() => { setError('Codes différents. Réessayez.'); setPinConf('') }, 150) }
    }
  }
  function pinConfDel() { setPinConf(p => p.slice(0,-1)) }

  async function submitPassword() {
    if (password.length < 6) { setError('Au moins 6 caractères.'); return }
    if (password !== confPw)  { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true); setError('')
    const { error: err, userId } = await signUp(email, password, fullName.trim(), phone||undefined, country||undefined)
    if (err) {
      const m = err.message
      if (m.includes('already registered')) setError('Cet email est déjà utilisé. Connectez-vous.')
      else if (m.includes('rate limit')) setError('Limite atteinte. Réessayez dans quelques minutes.')
      else setError(m)
      setLoading(false); return
    }
    if (userId) localStorage.setItem(`fb-app-pin-${userId}`, pinVal)
    navigate('/dashboard', { replace: true })
  }

  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(cSearch.toLowerCase()))

  // ── PIN / OTP screen (numpad at bottom) ───────────────────────────────────
  if (step === 'pin' || step === 'pinConfirm' || step === 'otp') {
    const isOtp = step === 'otp'
    const isPinConf = step === 'pinConfirm'
    const currentVal = isOtp ? otpInput : isPinConf ? pinConf : pinVal
    const onD = isOtp ? otpDigit : isPinConf ? pinConfDigit : pinDigit
    const onDel = isOtp ? otpDel : isPinConf ? pinConfDel : pinDel
    const title = isOtp ? 'Vérifier le compte' : isPinConf ? 'Confirmer le code' : 'Créer un code'
    const sub = isOtp
      ? `Code envoyé au +${phone.replace(/\D/g,'').slice(0,3)} *** ${phone.replace(/\D/g,'').slice(-4)}`
      : 'Le code doit comporter 6 chiffres'

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 pt-12 pb-2 shrink-0">
          <Back onClick={goBack}/>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-2">
          <h1 className="text-[26px] font-bold text-center" style={{ color: INK }}>{title}</h1>
          <p className="text-sm text-center mt-1.5" style={{ color: MUTED }}>{sub}</p>
          {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}
          {isOtp ? <OtpBoxes value={currentVal}/> : <PinDots value={currentVal}/>}
          {isOtp && (
            <div className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
              <span>Renvoyer le code</span>
              {otpCount > 0
                ? <span className="font-semibold" style={{ color: INK }}>{String(Math.floor(otpCount/60)).padStart(2,'0')}:{String(otpCount%60).padStart(2,'0')}</span>
                : <button onClick={resendOtp} className="font-semibold cursor-pointer" style={{ color: INDIGO }}>Renvoyer</button>}
            </div>
          )}
          {isOtp && (
            <div className="mt-5 w-full px-0">
              <Btn label="Continuer" onClick={() => { setOtpInput(''); go('name') }} disabled={otpInput.length < PIN_LEN}/>
            </div>
          )}
        </div>
        <div className="shrink-0">
          <Numpad onDigit={onD} onDel={onDel}/>
          <div className="h-6"/>
        </div>
      </div>
    )
  }

  // ── Regular form screens ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {step !== 'welcome' && (
        <div className="px-6 pt-12 pb-4 shrink-0">
          <Back onClick={goBack}/>
        </div>
      )}

      <div className={`flex-1 px-6 pb-8 ${step === 'welcome' ? 'flex flex-col' : ''}`}>

        {/* ── Welcome ── */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center flex-1 pt-14">
            {/* Card */}
            <div className="mb-8">
              <DemoCard/>
            </div>
            {/* App name */}
            <p className="text-2xl font-black tracking-tight mb-1" style={{ color: INDIGO }}>FamillyBill HT</p>
            <p className="text-sm text-center mb-10" style={{ color: MUTED }}>Service de paiement financier tout-en-un.</p>

            {/* OAuth buttons */}
            <div className="w-full space-y-3">
              <button onClick={oauthGoogle}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-[15px] cursor-pointer transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E5E7EB', color: INK, background: 'white' }}>
                <GoogleIcon/>
                Continuer avec Google
              </button>
              <button onClick={oauthApple}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-[15px] cursor-pointer transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E5E7EB', color: INK, background: 'white' }}>
                <AppleIcon/>
                Continuer avec Apple
              </button>
              <button onClick={() => go('phone')}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-[15px] cursor-pointer transition-colors hover:bg-gray-50"
                style={{ border: '1.5px solid #E5E7EB', color: INK, background: 'white' }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,12 2,6"/>
                </svg>
                S'inscrire par email
              </button>
            </div>

            <p className="text-sm mt-6" style={{ color: MUTED }}>
              Déjà un compte ?{' '}
              <Link to="/login" className="font-bold cursor-pointer" style={{ color: INDIGO }}>Se connecter</Link>
            </p>
          </div>
        )}

        {/* ── Phone ── */}
        {step === 'phone' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Votre numéro</h1>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Entrez votre numéro pour créer votre compte</p>
            <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>Numéro de téléphone</p>
            <div className="flex items-center h-14 rounded-2xl px-4 gap-1 mb-2" style={{ background: BG_IN }}>
              <span className="text-sm font-semibold shrink-0" style={{ color: INK }}>+</span>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="509 XXXX XXXX" autoFocus
                className="flex-1 h-full bg-transparent text-base outline-none px-1" style={{ color: INK }}/>
            </div>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <p className="text-xs mb-8" style={{ color: MUTED }}>Un code de vérification sera envoyé à ce numéro</p>
            <Btn label="Continuer" onClick={submitPhone} disabled={phone.replace(/\D/g,'').length < 7}/>
            <button onClick={skipPhone}
              className="w-full text-center text-sm font-semibold mt-5 cursor-pointer py-2" style={{ color: INDIGO }}>
              S'inscrire sans vérification téléphonique
            </button>
          </div>
        )}

        {/* ── Name ── */}
        {step === 'name' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Votre nom complet</h1>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Tel qu'il apparaîtra sur votre compte</p>
            <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>Nom complet</p>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Marie Jean" autoFocus
              className="w-full h-14 px-4 rounded-2xl text-base outline-none mb-2"
              style={{ background: BG_IN, color: INK }}/>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="mt-6">
              <Btn label="Continuer" onClick={submitName} disabled={fullName.trim().length < 2}/>
            </div>
          </div>
        )}

        {/* ── Country ── */}
        {step === 'country' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Lieu de résidence</h1>
            <p className="text-sm mb-5" style={{ color: MUTED }}>Dans quel pays vivez-vous actuellement ?</p>
            <div className="flex items-center gap-2 h-12 px-4 rounded-2xl mb-3" style={{ background: BG_IN }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: MUTED }}/>
              <input type="text" value={cSearch} onChange={e => setCSearch(e.target.value)}
                placeholder="Rechercher un pays..." autoFocus
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: INK }}/>
            </div>
            <div className="overflow-y-auto rounded-2xl" style={{ maxHeight: 300, border: '1px solid #F3F4F6' }}>
              {filtered.map(c => (
                <button key={c} onClick={() => { setCountry(c); setCSearch(c) }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 cursor-pointer"
                  style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <span className="text-sm font-medium text-left" style={{ color: INK }}>{c}</span>
                  {country === c && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: INDIGO }}>
                      <Check className="w-3 h-3 text-white"/>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <div className="mt-5"><Btn label="Continuer" onClick={submitCountry} disabled={!country}/></div>
          </div>
        )}

        {/* ── Email ── */}
        {step === 'email' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Votre adresse email</h1>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Restez informé et accédez aux détails de votre compte</p>
            <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>Email</p>
            <div className="flex items-center h-14 px-4 rounded-2xl gap-2 mb-2" style={{ background: BG_IN }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="exemple@email.com" autoFocus
                className="flex-1 bg-transparent text-base outline-none" style={{ color: INK }}/>
              {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                <button onClick={submitEmail}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                  style={{ background: INDIGO }}>
                  <ArrowRight className="w-4 h-4 text-white"/>
                </button>
              )}
            </div>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <p className="text-xs mb-4" style={{ color: MUTED }}>Un lien de vérification sera envoyé après la création du compte</p>
            <div className="flex items-start gap-3 p-4 rounded-2xl mb-6" style={{ background: '#F9FAFB' }}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                Protection complète des données : Chiffrement robuste et transmission sécurisée.
              </p>
            </div>
            <Btn label="Continuer" onClick={submitEmail} disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}/>
          </div>
        )}

        {/* ── Password ── */}
        {step === 'password' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Créer votre mot de passe</h1>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Veuillez choisir quelque chose dont vous vous souviendrez</p>

            <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>Nouveau mot de passe</p>
            <div className="flex items-center h-14 px-4 rounded-2xl gap-2 mb-1"
              style={{ background: BG_IN, border: `1.5px solid ${password.length >= 6 ? '#22C55E' : 'transparent'}` }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe" autoFocus
                className="flex-1 bg-transparent text-base outline-none" style={{ color: INK }}/>
              <button onClick={() => setShowPw(!showPw)} className="shrink-0 cursor-pointer">
                {showPw ? <Eye className="w-5 h-5" style={{ color: MUTED }}/> : <EyeOff className="w-5 h-5" style={{ color: MUTED }}/>}
              </button>
            </div>
            {password.length >= 6 && (
              <div className="flex items-center gap-1.5 mb-4">
                <Check className="w-3.5 h-3.5" style={{ color: '#22C55E' }}/>
                <p className="text-xs" style={{ color: '#22C55E' }}>Il doit contenir plus de 6 lettres et chiffres</p>
              </div>
            )}
            {password.length > 0 && password.length < 6 && (
              <p className="text-xs mb-4" style={{ color: MUTED }}>Il doit contenir plus de 6 lettres et chiffres</p>
            )}
            {!password && <p className="text-xs mb-4" style={{ color: MUTED }}>Il doit contenir plus de 6 lettres et chiffres</p>}

            <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>Confirmer le mot de passe</p>
            <div className="flex items-center h-14 px-4 rounded-2xl gap-2 mb-6"
              style={{ background: BG_IN, border: `1.5px solid ${confPw && confPw === password ? '#22C55E' : 'transparent'}` }}>
              <input type={showConfPw ? 'text' : 'password'} value={confPw} onChange={e => setConfPw(e.target.value)}
                placeholder="Confirmer le mot de passe"
                className="flex-1 bg-transparent text-base outline-none" style={{ color: INK }}/>
              <button onClick={() => setShowConfPw(!showConfPw)} className="shrink-0 cursor-pointer">
                {showConfPw ? <Eye className="w-5 h-5" style={{ color: MUTED }}/> : <EyeOff className="w-5 h-5" style={{ color: MUTED }}/>}
              </button>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            <Btn
              label={loading ? 'Création du compte...' : 'Continuer'}
              onClick={submitPassword}
              disabled={password.length < 6 || password !== confPw}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
