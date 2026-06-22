import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff, Search, Check, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

type Step = 'phone' | 'otp' | 'name' | 'country' | 'email' | 'pin' | 'pinConfirm' | 'password'

// ── Design tokens (matching screenshots) ─────────────────────────────────────
const INDIGO = '#4F46E5'
const INK = '#111827'
const MUTED = '#6B7280'
const INPUT_BG = '#F3F4F6'
const BTN_OFF = '#E5E7EB'
const PIN_LEN = 6

const PHONE_FLOW: Step[] = ['phone', 'otp', 'name', 'country', 'email', 'pin', 'pinConfirm', 'password']
const EMAIL_FLOW: Step[] = ['name', 'country', 'email', 'pin', 'pinConfirm', 'password']

const COUNTRIES = [
  'Haïti', 'États-Unis', 'Canada', 'France', 'République Dominicaine',
  'Martinique', 'Guadeloupe', 'Guyane française', 'Belgique', 'Suisse',
  'Brésil', 'Mexique', 'Colombie', 'Venezuela', 'Chili', 'Argentine',
  'Cuba', 'Jamaïque', 'Puerto Rico', 'Bahamas', 'Trinidad-et-Tobago',
  'Barbade', 'Guyane', 'Suriname', 'Espagne', 'Portugal', 'Italie',
  'Allemagne', 'Pays-Bas', 'Royaume-Uni', 'Maroc', 'Sénégal',
  "Côte d'Ivoire", 'Cameroun', 'Congo', 'Madagascar', 'Autre',
]

// ── Shared sub-components ─────────────────────────────────────────────────────

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center cursor-pointer py-1 -ml-1">
      <ChevronLeft className="w-7 h-7" style={{ color: INK }}/>
    </button>
  )
}

function Btn({
  label, onClick, disabled, loading,
}: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center cursor-pointer transition-colors"
      style={{ background: disabled || loading ? BTN_OFF : INDIGO, color: disabled || loading ? MUTED : 'white' }}
    >
      {loading
        ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
        : label}
    </button>
  )
}

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>{label}</p>
      {children}
    </div>
  )
}

// ── PIN dots ──────────────────────────────────────────────────────────────────
function PinDots({ value }: { value: string }) {
  return (
    <div className="flex gap-3.5 justify-center my-10">
      {Array.from({ length: PIN_LEN }).map((_, i) => {
        const filled = i < value.length
        const isLast = i === value.length - 1
        return (
          <div
            key={i}
            className="w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-100"
            style={{ background: filled ? INDIGO : '#E5E7EB', transform: isLast ? 'scale(1.1)' : 'scale(1)' }}
          >
            {isLast && value[i] && (
              <span className="text-xl font-bold text-white">{value[i]}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Numpad ────────────────────────────────────────────────────────────────────
function Numpad({ onDigit, onDel }: { onDigit: (d: string) => void; onDel: () => void }) {
  const grid = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ]
  return (
    <div style={{ borderTop: '1px solid #F3F4F6' }}>
      {grid.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((k, ki) => (
            <button
              key={ki}
              onClick={() => k === '⌫' ? onDel() : k ? onDigit(k) : undefined}
              disabled={!k}
              className="flex-1 flex items-center justify-center select-none cursor-pointer active:bg-gray-100 transition-colors"
              style={{
                height: 66,
                borderRight: ki < 2 ? '1px solid #F3F4F6' : 'none',
                borderBottom: ri < 3 ? '1px solid #F3F4F6' : 'none',
                background: 'white',
              }}
            >
              {k === '⌫' ? (
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round">
                  <path d="M20 5H8.5a2 2 0 00-1.6.8L2 12l4.9 6.2a2 2 0 001.6.8H20a2 2 0 002-2V7a2 2 0 00-2-2z"/>
                  <path d="M15 9l-4 4M11 9l4 4"/>
                </svg>
              ) : k ? (
                <span className="text-[22px] font-light" style={{ color: INK }}>{k}</span>
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [viaEmail, setViaEmail] = useState(false)

  // Form data
  const [phone, setPhone] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [fullName, setFullName] = useState('')
  const [country, setCountry] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [email, setEmail] = useState('')
  const [pinVal, setPinVal] = useState('')
  const [pinConf, setPinConf] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const flow = viaEmail ? EMAIL_FLOW : PHONE_FLOW

  function goBack() {
    const idx = flow.indexOf(step)
    if (idx <= 0) navigate('/login')
    else { setStep(flow[idx - 1]); setError('') }
  }

  function goNext(s: Step) { setStep(s); setError('') }

  // ── Step submit handlers ──────────────────────────────────────────────────

  function submitPhone() {
    if (phone.replace(/\D/g, '').length < 7) return
    goNext('otp')
  }

  function skipPhone() {
    setViaEmail(true)
    setPhone('')
    goNext('name')
  }

  function submitOtp() {
    if (otpInput.length < 6) return
    goNext('name')
  }

  function submitName() {
    if (fullName.trim().length < 2) return
    goNext('country')
  }

  function submitCountry() {
    if (!country) return
    goNext('email')
  }

  function submitEmail() {
    if (!email.includes('@') || !email.includes('.')) return
    goNext('pin')
  }

  function pinDigit(d: string) {
    if (pinVal.length >= PIN_LEN) return
    const next = pinVal + d
    setPinVal(next)
    if (next.length === PIN_LEN) setTimeout(() => goNext('pinConfirm'), 300)
  }
  function pinDel() { setPinVal(p => p.slice(0, -1)) }

  function pinConfDigit(d: string) {
    if (pinConf.length >= PIN_LEN) return
    const next = pinConf + d
    setPinConf(next)
    if (next.length === PIN_LEN) {
      if (next === pinVal) {
        setTimeout(() => goNext('password'), 300)
      } else {
        setTimeout(() => {
          setError('Les codes ne correspondent pas. Réessayez.')
          setPinConf('')
        }, 150)
      }
    }
  }
  function pinConfDel() { setPinConf(p => p.slice(0, -1)) }

  function otpDigit(d: string) {
    if (otpInput.length >= 6) return
    const next = otpInput + d
    setOtpInput(next)
    if (next.length === 6) setTimeout(submitOtp, 200)
  }
  function otpDel() { setOtpInput(p => p.slice(0, -1)) }

  async function submitPassword() {
    if (password.length < 6) { setError('Au moins 6 caractères requis.'); return }
    setLoading(true)
    setError('')
    const { error: err, userId } = await signUp(email, password, fullName.trim(), phone || undefined, country || undefined)
    if (err) {
      const msg = err.message
      if (msg.includes('already registered')) setError('Cet email est déjà utilisé. Connectez-vous.')
      else if (msg.includes('rate limit')) setError('Limite atteinte. Réessayez dans quelques minutes.')
      else if (msg.includes('Password should be')) setError('Le mot de passe doit contenir au moins 6 caractères.')
      else setError(msg)
      setLoading(false)
      return
    }
    if (userId) localStorage.setItem(`fb-app-pin-${userId}`, pinVal)
    navigate('/dashboard', { replace: true })
  }

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  )

  // ── PIN / OTP layout (numpad at bottom) ───────────────────────────────────
  if (step === 'pin' || step === 'pinConfirm' || step === 'otp') {
    const currentVal = step === 'otp' ? otpInput : step === 'pin' ? pinVal : pinConf
    const onD = step === 'otp' ? otpDigit : step === 'pin' ? pinDigit : pinConfDigit
    const onDel = step === 'otp' ? otpDel : step === 'pin' ? pinDel : pinConfDel
    const title = step === 'otp'
      ? 'Vérification'
      : step === 'pin'
        ? 'Créer un code'
        : 'Confirmer le code'
    const sub = step === 'otp'
      ? `Entrez le code reçu au ${phone}`
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
          <PinDots value={currentVal}/>
        </div>
        <div className="shrink-0">
          <Numpad onDigit={onD} onDel={onDel}/>
          <div className="h-6"/>
        </div>
      </div>
    )
  }

  // ── Regular step layout ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-6 pt-12 pb-4 shrink-0">
        <Back onClick={goBack}/>
      </div>

      <div className="flex-1 px-6 pb-6">

        {/* ── Phone ── */}
        {step === 'phone' && (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Votre numéro de téléphone</h1>
              <p className="text-sm mb-7" style={{ color: MUTED }}>Entrez votre numéro pour créer votre compte</p>
              <Field label="Numéro de téléphone">
                <div className="flex items-center gap-0 h-14 rounded-2xl overflow-hidden" style={{ background: INPUT_BG }}>
                  <span className="pl-4 pr-1 text-sm font-semibold shrink-0" style={{ color: INK }}>+</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="509 XXXX XXXX"
                    className="flex-1 h-full bg-transparent text-base outline-none px-2"
                    style={{ color: INK }}
                    autoFocus
                  />
                </div>
              </Field>
              <p className="text-xs mt-2 mb-8" style={{ color: MUTED }}>Un code de vérification sera envoyé à ce numéro</p>
              <Btn label="Continuer" onClick={submitPhone} disabled={phone.replace(/\D/g, '').length < 7}/>
            </div>
            <div className="pt-6">
              <button onClick={skipPhone} className="w-full text-center text-sm font-semibold cursor-pointer py-2" style={{ color: INDIGO }}>
                S'inscrire par email
              </button>
              <p className="text-sm text-center mt-4" style={{ color: MUTED }}>
                Déjà un compte ?{' '}
                <Link to="/login" className="font-semibold" style={{ color: INK }}>Se connecter</Link>
              </p>
            </div>
          </div>
        )}

        {/* ── Name ── */}
        {step === 'name' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Votre nom complet</h1>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Tel qu'il apparaîtra sur votre compte</p>
            <Field label="Nom complet">
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Marie Jean"
                className="w-full h-14 px-4 rounded-2xl text-base outline-none"
                style={{ background: INPUT_BG, color: INK }}
                autoFocus
              />
            </Field>
            <div className="mt-7">
              <Btn label="Continuer" onClick={submitName} disabled={fullName.trim().length < 2}/>
            </div>
          </div>
        )}

        {/* ── Country ── */}
        {step === 'country' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Lieu de résidence</h1>
            <p className="text-sm mb-5" style={{ color: MUTED }}>Dans quel pays vivez-vous actuellement ?</p>
            <div className="flex items-center gap-2 h-12 px-4 rounded-2xl mb-3" style={{ background: INPUT_BG }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: MUTED }}/>
              <input
                type="text"
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                placeholder="Rechercher un pays..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: INK }}
                autoFocus
              />
            </div>
            <div className="overflow-y-auto rounded-2xl" style={{ maxHeight: 300, border: '1px solid #F3F4F6' }}>
              {filteredCountries.map(c => (
                <button
                  key={c}
                  onClick={() => { setCountry(c); setCountrySearch(c) }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 cursor-pointer"
                  style={{ borderBottom: '1px solid #F9FAFB' }}
                >
                  <span className="text-sm font-medium text-left" style={{ color: INK }}>{c}</span>
                  {country === c && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: INDIGO }}>
                      <Check className="w-3 h-3 text-white"/>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-5">
              <Btn label="Continuer" onClick={submitCountry} disabled={!country}/>
            </div>
          </div>
        )}

        {/* ── Email ── */}
        {step === 'email' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Votre adresse email</h1>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Restez informé et accédez aux détails de votre compte</p>
            <Field label="Email">
              <div className="flex items-center h-14 px-4 rounded-2xl gap-2" style={{ background: INPUT_BG }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="flex-1 bg-transparent text-base outline-none"
                  style={{ color: INK }}
                  autoFocus
                />
                {email.includes('@') && email.includes('.') && (
                  <button onClick={submitEmail} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer" style={{ background: INDIGO }}>
                    <ArrowRight className="w-4 h-4 text-white"/>
                  </button>
                )}
              </div>
            </Field>
            <p className="text-xs mt-2 mb-4" style={{ color: MUTED }}>
              Un lien de vérification sera envoyé après la création du compte
            </p>
            <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: '#F9FAFB' }}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                Protection complète des données et de la confidentialité : Chiffrement robuste et transmission sécurisée à des fins de vérification d'identité.
              </p>
            </div>
            <div className="mt-6">
              <Btn label="Continuer" onClick={submitEmail} disabled={!email.includes('@') || !email.includes('.')}/>
            </div>
          </div>
        )}

        {/* ── Password ── */}
        {step === 'password' && (
          <div>
            <h1 className="text-[26px] font-bold mb-1.5" style={{ color: INK }}>Créer votre mot de passe</h1>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Sécurisez votre compte avec un mot de passe fort</p>
            <Field label="Mot de passe">
              <div className="flex items-center h-14 px-4 rounded-2xl gap-2" style={{ background: INPUT_BG }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="flex-1 bg-transparent text-base outline-none"
                  style={{ color: INK }}
                  autoFocus
                />
                <button onClick={() => setShowPw(!showPw)} className="shrink-0 cursor-pointer">
                  {showPw
                    ? <Eye className="w-5 h-5" style={{ color: MUTED }}/>
                    : <EyeOff className="w-5 h-5" style={{ color: MUTED }}/>}
                </button>
              </div>
            </Field>
            <p className="text-xs mt-2 mb-7" style={{ color: MUTED }}>Il doit contenir plus de 6 lettres et chiffres</p>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            <Btn
              label={loading ? 'Création du compte...' : 'Créer mon compte'}
              onClick={submitPassword}
              disabled={password.length < 6}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
