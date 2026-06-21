import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, ChevronRight, ChevronLeft, Check, Copy,
  Plus, Loader2, Bell, Shield, RefreshCw, Snowflake, AlertTriangle,
  ScanLine, Fingerprint, ArrowDownLeft, Key, X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount } from '@/lib/supabase'
import { getCurrency, getRate, CURRENCIES } from '@/lib/currencies'

// ── Constants ──────────────────────────────────────────────────────────────────
const CURRENCY_FLAGS: Record<string, string> = {
  BRL: '/icons/currencies/brl-flag.jpg',
  HTG: '/icons/currencies/htg-flag.jpg',
  USD: '/icons/currencies/usd-flag.png',
  EUR: '/icons/currencies/eur-flag.png',
  CAD: '/icons/currencies/cad.png',
}

const CARD_STYLES = [
  { id: 'purple', gradient: 'linear-gradient(135deg,#1a0070 0%,#3b12cc 45%,#6d28d9 100%)', glow: '#7c3aed', accent: 'rgba(167,139,250,0.35)', name: 'Violet'  },
  { id: 'green',  gradient: 'linear-gradient(135deg,#064e3b 0%,#059669 45%,#34d399 100%)', glow: '#10b981', accent: 'rgba(52,211,153,0.35)',   name: 'Vert'    },
  { id: 'blue',   gradient: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 45%,#60a5fa 100%)', glow: '#3b82f6', accent: 'rgba(96,165,250,0.35)',   name: 'Bleu'    },
  { id: 'orange', gradient: 'linear-gradient(135deg,#7c2d12 0%,#ea580c 45%,#fb923c 100%)', glow: '#f97316', accent: 'rgba(251,146,60,0.35)',   name: 'Orange'  },
  { id: 'rose',   gradient: 'linear-gradient(135deg,#831843 0%,#e11d48 45%,#fb7185 100%)', glow: '#f43f5e', accent: 'rgba(251,113,133,0.35)',  name: 'Rose'    },
]
const CURRENCY_DEFAULT_STYLE: Record<string, string> = { HTG: 'purple', USD: 'green', EUR: 'blue', CAD: 'orange', BRL: 'rose' }
type CardStyleDef = typeof CARD_STYLES[0]
type UserLike = { user_metadata?: { full_name?: string }; email?: string; id?: string } | null

function getCardStyle(acc: CurrencyAccount): CardStyleDef {
  const id = localStorage.getItem(`fb-card-style-${acc.id}`) ?? CURRENCY_DEFAULT_STYLE[acc.currency] ?? 'purple'
  return CARD_STYLES.find(s => s.id === id) ?? CARD_STYLES[0]
}
function getCardNumber(acc: CurrencyAccount) {
  if (acc.account_number) return acc.account_number
  const h = acc.id.replace(/-/g, '')
  return `${h.slice(0,4).toUpperCase()} •••• •••• ${h.slice(-4).toUpperCase()}`
}
function getCardCVV(acc: CurrencyAccount) {
  const n = acc.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return String(100 + (n % 900))
}
function getCardExpiry(acc: CurrencyAccount) {
  try {
    const d = new Date(acc.created_at ?? Date.now())
    d.setFullYear(d.getFullYear() + 3)
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`
  } catch { return '12/28' }
}
function getUserInitials(u: UserLike) {
  const n = u?.user_metadata?.full_name || u?.email || 'U'
  const p = n.split(/[\s@.]+/).filter(Boolean)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (p[0]?.[0] ?? 'U').toUpperCase()
}
function getUserDisplayName(u: UserLike) {
  return u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Utilisateur'
}
const walletPinKey = (id: string) => `fb-w-pin-${id}`

// ── Card Front ─────────────────────────────────────────────────────────────────
function CardFront({ acc, user, visible = true, height = 210 }: {
  acc: CurrencyAccount; user: UserLike; visible?: boolean; height?: number
}) {
  const cs      = getCardStyle(acc)
  const curr    = getCurrency(acc.currency)
  const num     = getCardNumber(acc)
  const exp     = getCardExpiry(acc)
  const flag    = CURRENCY_FLAGS[acc.currency]
  const frozen  = acc.id !== 'preview' && localStorage.getItem(`fb-frozen-${acc.id}`)  === 'true'
  const blocked = acc.id !== 'preview' && localStorage.getItem(`fb-blocked-${acc.id}`) === 'true'

  return (
    <div className="relative rounded-[1.75rem] overflow-hidden w-full select-none"
      style={{ background: cs.gradient, boxShadow: `0 12px 40px ${cs.glow}55`, height }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 60%)' }} />
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl" style={{ background: cs.accent }} />
      <div className="relative h-full flex flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 13 }}>
              {getUserInitials(user)}
            </div>
            <div>
              <p className="font-semibold text-white leading-tight" style={{ fontSize: 11 }}>{getUserDisplayName(user)}</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{curr?.name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              {flag && <img src={flag} alt={acc.currency} className="w-6 h-4 object-cover rounded shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                onError={e => (e.currentTarget.style.display = 'none')} />}
              <span className="font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', fontSize: 10 }}>
                {acc.currency}
              </span>
            </div>
            <svg width="26" height="19" viewBox="0 0 28 20" fill="none">
              <rect x=".5" y=".5" width="27" height="19" rx="3.5" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.28)"/>
              <line x1=".5" y1="7" x2="27.5" y2="7" stroke="rgba(255,255,255,0.28)"/>
              <line x1=".5" y1="13" x2="27.5" y2="13" stroke="rgba(255,255,255,0.28)"/>
              <line x1="9" y1=".5" x2="9" y2="19.5" stroke="rgba(255,255,255,0.28)"/>
              <line x1="19" y1=".5" x2="19" y2="19.5" stroke="rgba(255,255,255,0.28)"/>
            </svg>
          </div>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em' }}>SOLDE DISPONIBLE</p>
          <p className="font-bold text-white tabular-nums" style={{ fontSize: height < 190 ? 20 : 26, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 4 }}>
            {visible ? `${curr?.symbol} ${acc.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}` : `${curr?.symbol} ••••••`}
          </p>
        </div>
        <div className="flex items-end justify-between">
          <p className="font-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: '0.12em' }}>
            {visible ? num : `•••• •••• •••• ${num.slice(-4)}`}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{exp}</p>
        </div>
      </div>
      {/* Frozen overlay */}
      {frozen && !blocked && (
        <div className="absolute inset-0 rounded-[1.75rem] flex flex-col items-center justify-center gap-2"
          style={{ background: 'rgba(30,58,138,0.55)', backdropFilter: 'blur(2px)' }}>
          <Snowflake className="w-10 h-10 text-white" />
          <span className="font-bold text-white tracking-widest" style={{ fontSize: 13 }}>GELÉ</span>
        </div>
      )}
      {/* Blocked overlay */}
      {blocked && (
        <div className="absolute inset-0 rounded-[1.75rem] flex flex-col items-center justify-center gap-2"
          style={{ background: 'rgba(185,28,28,0.6)', backdropFilter: 'blur(2px)' }}>
          <AlertTriangle className="w-10 h-10 text-white" />
          <span className="font-bold text-white tracking-widest" style={{ fontSize: 13 }}>BLOQUÉ</span>
        </div>
      )}
    </div>
  )
}

// ── Card Back ──────────────────────────────────────────────────────────────────
function CardBack({ acc, height = 210 }: { acc: CurrencyAccount; height?: number }) {
  const cs = getCardStyle(acc)
  const cvv = getCardCVV(acc)
  const exp = getCardExpiry(acc)
  return (
    <div className="relative rounded-[1.75rem] overflow-hidden w-full select-none"
      style={{ background: cs.gradient, boxShadow: `0 12px 40px ${cs.glow}55`, height }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.28)' }} />
      <div className="absolute left-0 right-0" style={{ top: 44, height: 44, background: 'rgba(0,0,0,0.82)' }} />
      <div className="absolute left-5 right-5" style={{ top: 100 }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-9 rounded" style={{ background: 'repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 2px,#f9fafb 2px,#f9fafb 6px)' }} />
          <div className="px-3 h-9 rounded flex items-center shrink-0" style={{ background: 'rgba(255,255,255,0.95)' }}>
            <span className="font-mono font-bold text-sm tracking-widest" style={{ color: '#1a0070' }}>{cvv}</span>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, marginTop: 3 }}>CVV</p>
      </div>
      <div className="absolute left-5 right-5 bottom-4 flex justify-between items-end">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, letterSpacing: '0.08em' }}>VALID THRU</p>
          <p className="font-mono font-semibold text-white" style={{ fontSize: 11 }}>{exp}</p>
        </div>
        <p className="font-bold text-white" style={{ fontSize: 10, letterSpacing: '0.08em', opacity: 0.75 }}>FamillyBill HT</p>
      </div>
    </div>
  )
}

// ── Phone PIN Pad ──────────────────────────────────────────────────────────────
function PinPad({ value, onChange, onBiometric }: {
  value: string; onChange: (v: string) => void; onBiometric?: () => void
}) {
  function press(d: string) { if (value.length < 4) onChange(value + d) }
  function del() { onChange(value.slice(0, -1)) }
  const rows = [
    [{ n:'1',s:'' },{ n:'2',s:'ABC' },{ n:'3',s:'DEF' }],
    [{ n:'4',s:'GHI' },{ n:'5',s:'JKL' },{ n:'6',s:'MNO' }],
    [{ n:'7',s:'PQRS' },{ n:'8',s:'TUV' },{ n:'9',s:'WXYZ' }],
  ]
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center tr"
            style={{ borderColor: i < value.length ? '#1A56DB' : '#DDE1F0', background: i < value.length ? '#EEF3FF' : '#fff' }}>
            {i < value.length && <div className="w-3 h-3 rounded-full" style={{ background: '#1A56DB' }} />}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-[270px]">
        {rows.map(row => row.map(({ n, s }) => (
          <button key={n} onClick={() => press(n)}
            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 cursor-pointer tr active:scale-95"
            style={{ background: '#F3F3F6' }}>
            <span className="font-bold text-xl" style={{ color: '#0D1B4B' }}>{n}</span>
            {s && <span style={{ fontSize: 7, color: 'rgba(13,27,75,0.4)', letterSpacing: '0.12em', fontWeight: 600 }}>{s}</span>}
          </button>
        )))}
        <button onClick={onBiometric}
          className="h-16 rounded-2xl flex items-center justify-center cursor-pointer tr active:scale-95"
          style={{ background: '#F3F3F6' }}>
          <Fingerprint className="w-6 h-6" style={{ color: 'rgba(13,27,75,0.45)' }} />
        </button>
        <button onClick={() => press('0')}
          className="h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 cursor-pointer tr active:scale-95"
          style={{ background: '#F3F3F6' }}>
          <span className="font-bold text-xl" style={{ color: '#0D1B4B' }}>0</span>
          <span style={{ fontSize: 7, color: 'rgba(13,27,75,0.4)', letterSpacing: '0.12em', fontWeight: 600 }}>+</span>
        </button>
        <button onClick={del}
          className="h-16 rounded-2xl flex items-center justify-center cursor-pointer tr active:scale-95"
          style={{ background: '#F3F3F6' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D1B4B" strokeWidth="2">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
            <line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className="relative w-11 h-6 rounded-full shrink-0 tr cursor-pointer"
      style={{ background: on ? '#1A56DB' : '#DDE1F0' }}>
      <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm tr"
        style={{ left: on ? 'calc(100% - 22px)' : 2 }} />
    </button>
  )
}

// ── Sub-screen overlay (sits BETWEEN top header h-14 and bottom nav) ──────────
// z-35: above page content but below bottom nav (z-40) and top header (z-50)
function ScreenOverlay({ children, onBack, title }: {
  children: React.ReactNode; onBack: () => void; title: string
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 flex flex-col animate-slide-right"
      style={{ top: 56, zIndex: 35, background: '#F3F3F6' }}>
      {/* Mini header with back button */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #F3F3F6' }}>
        <button onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer tr shrink-0"
          style={{ background: '#F3F3F6' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#0D1B4B' }} />
        </button>
        <h1 className="font-bold text-base flex-1 truncate" style={{ color: '#0D1B4B', letterSpacing: '-0.02em' }}>{title}</h1>
      </div>
      {/* Scrollable content — pb-28 clears the bottom nav */}
      <div className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' as const }}>
        <div className="pb-28">{children}</div>
      </div>
    </div>
  )
}

// ── Modals (z-70 — above everything including top header & bottom nav) ─────────

function WalletPinModal({ acc, user, onSuccess, onCancel }: {
  acc: CurrencyAccount; user: UserLike; onSuccess: () => void; onCancel: () => void
}) {
  const [pin, setPin]     = useState('')
  const [error, setError] = useState('')

  function handleChange(v: string) {
    setPin(v); setError('')
    if (v.length === 4) {
      if (v === localStorage.getItem(walletPinKey(acc.id))) { onSuccess() }
      else { setError('Code PIN incorrect.'); setTimeout(() => setPin(''), 500) }
    }
  }
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-end" style={{ zIndex: 70 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-lg rounded-t-3xl animate-fade-in-up overflow-hidden" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="font-bold text-base" style={{ color: '#0D1B4B' }}>Code PIN requis</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(13,27,75,0.5)' }}>Portefeuille {acc.currency}</p>
          </div>
          <button onClick={onCancel} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer tr" style={{ background: '#F3F3F6' }}>
            <X className="w-4 h-4" style={{ color: '#0D1B4B' }} />
          </button>
        </div>
        <div className="px-5 pb-4"><CardFront acc={acc} user={user} height={120} /></div>
        {error && <p className="text-center text-sm pb-2 font-medium" style={{ color: '#DC2626' }}>{error}</p>}
        <div className="px-5 pb-8"><PinPad value={pin} onChange={handleChange} /></div>
      </div>
    </div>
  )
}

function BlockConfirmModal({ acc, onCancel, onConfirm }: {
  acc: CurrencyAccount; onCancel: () => void; onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 70 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-lg rounded-t-3xl p-6 space-y-5 animate-fade-in-up" style={{ background: '#fff' }}>
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#FEF2F2' }}>
            <AlertTriangle className="w-8 h-8" style={{ color: '#DC2626' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: '#0D1B4B' }}>Bloquer ce portefeuille ?</h2>
          <p className="text-sm" style={{ color: 'rgba(13,27,75,0.6)', maxWidth: 280 }}>
            Le portefeuille {acc.currency} sera suspendu. Toutes les transactions seront bloquées.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 h-12 rounded-2xl font-semibold text-sm cursor-pointer tr border"
            style={{ borderColor: '#DDE1F0', color: '#0D1B4B', background: '#fff' }}>
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 h-12 rounded-2xl font-semibold text-sm cursor-pointer tr active:scale-[0.97]"
            style={{ background: '#DC2626', color: '#fff' }}>
            Bloquer
          </button>
        </div>
      </div>
    </div>
  )
}

function DepositModal({ acc, user, onClose, onSuccess }: {
  acc: CurrencyAccount; user: UserLike; onClose: () => void; onSuccess: () => void
}) {
  const [amount,  setAmount]  = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const curr = getCurrency(acc.currency)

  const quickAmounts = acc.currency === 'HTG' ? [1000, 5000, 10000, 25000]
    : [10, 50, 100, 500]

  async function confirm() {
    const num = parseFloat(amount.replace(',', '.'))
    if (!user?.id || !num || num <= 0) return
    setLoading(true)
    await supabase.from('currency_accounts')
      .update({ balance: acc.balance + num })
      .eq('id', acc.id)
    await supabase.from('transactions').insert({
      user_id: user.id, type: 'deposit', status: 'completed',
      amount: num, currency: acc.currency, fee: 0,
      reference: `DEP-${Date.now()}`,
    })
    setLoading(false)
    setDone(true)
    setTimeout(() => { onSuccess(); onClose() }, 1400)
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 70 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl p-6 space-y-5 animate-fade-in-up" style={{ background: '#fff' }}>
        {done ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: '#ECFDF5' }}>
              <Check className="w-8 h-8" style={{ color: '#059669' }} />
            </div>
            <p className="font-bold text-lg" style={{ color: '#0D1B4B' }}>Rechargement réussi !</p>
            <p className="text-sm" style={{ color: 'rgba(13,27,75,0.55)' }}>
              {curr?.symbol} {parseFloat(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ajouté au portefeuille {acc.currency}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg" style={{ color: '#0D1B4B' }}>Recharger</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Portefeuille {acc.currency} — {curr?.name}</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer tr" style={{ background: '#F3F3F6' }}>
                <X className="w-4 h-4" style={{ color: '#0D1B4B' }} />
              </button>
            </div>
            {/* Amount input */}
            <div className="rounded-2xl px-4 py-4" style={{ background: '#F3F3F6' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'rgba(13,27,75,0.45)' }}>Montant</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: 'rgba(13,27,75,0.35)' }}>{curr?.symbol}</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" autoFocus
                  className="flex-1 text-3xl font-bold bg-transparent outline-none tabular-nums"
                  style={{ color: '#0D1B4B' }} />
              </div>
            </div>
            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map(v => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className="py-2.5 rounded-xl text-xs font-bold cursor-pointer tr"
                  style={amount === String(v)
                    ? { background: '#1A56DB', color: '#fff' }
                    : { background: '#F3F3F6', color: '#0D1B4B' }}>
                  {curr?.symbol}{v >= 1000 ? `${v/1000}k` : v}
                </button>
              ))}
            </div>
            <button onClick={confirm} disabled={loading || !(parseFloat(amount) > 0)}
              className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer tr disabled:opacity-40 active:scale-[0.98]"
              style={{ background: '#1A56DB', color: '#fff' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmer le rechargement
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className="fixed left-4 right-4 bottom-24 animate-fade-in-up" style={{ zIndex: 80 }}>
      <div className="mx-auto max-w-sm rounded-2xl px-5 py-4 flex items-center gap-3 shadow-xl"
        style={{ background: '#0D1B4B', color: '#fff' }}>
        <Check className="w-5 h-5 shrink-0" style={{ color: '#34d399' }} />
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  )
}

// ── Details Screen ─────────────────────────────────────────────────────────────
function DetailsScreen({ acc, user, onBack }: { acc: CurrencyAccount; user: UserLike; onBack: () => void }) {
  const [showNum, setShowNum] = useState(false)
  const [showCVV, setShowCVV] = useState(false)
  const [copied,  setCopied]  = useState(false)
  const num  = getCardNumber(acc)
  const cvv  = getCardCVV(acc)
  const exp  = getCardExpiry(acc)
  const name = getUserDisplayName(user)
  const curr = getCurrency(acc.currency)

  function copyAll() {
    navigator.clipboard.writeText(`Nom: ${name}\nNuméro: ${num}\nExpiration: ${exp}\nCVV: ${cvv}\nDevise: ${acc.currency}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ScreenOverlay title="Détails du portefeuille" onBack={onBack}>
      <div className="px-4 pt-4 space-y-4">
        <CardFront acc={acc} user={user} visible={showNum} />
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
          {[
            { label: 'Titulaire',              value: name, mask: false, toggle: null },
            { label: 'Numéro de portefeuille', value: num,  mask: !showNum, toggle: () => setShowNum(v => !v) },
            { label: "Date d'expiration",      value: exp,  mask: false, toggle: null },
            { label: 'CVV',                    value: cvv,  mask: !showCVV, toggle: () => setShowCVV(v => !v) },
            { label: 'Devise',                 value: `${curr?.flag ?? ''} ${acc.currency} — ${curr?.name ?? ''}`, mask: false, toggle: null },
          ].map(({ label, value, mask, toggle }, i, arr) => (
            <div key={label} className="flex items-center px-4 py-4"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #F3F3F6' : 'none' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>{label}</p>
                <p className="font-semibold text-sm truncate" style={{ color: '#0D1B4B', letterSpacing: mask ? '0.12em' : '0', fontFamily: mask ? 'monospace' : 'inherit' }}>
                  {mask ? '•••• •••• ••••' : value}
                </p>
              </div>
              {toggle && (
                <button onClick={toggle} className="ml-3 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer tr shrink-0" style={{ background: '#F3F3F6' }}>
                  {mask ? <EyeOff className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.5)' }} /> : <Eye className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.5)' }} />}
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={copyAll}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer tr active:scale-[0.98]"
          style={{ background: copied ? '#059669' : '#1A56DB', color: '#fff' }}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copié !' : 'Copier les détails'}
        </button>
      </div>
    </ScreenOverlay>
  )
}

// ── Settings Screen ────────────────────────────────────────────────────────────
function SettingsScreen({ acc, user, onBack, onBlock, onCardBack, onFullSettings, onChangePIN }: {
  acc: CurrencyAccount; user: UserLike
  onBack: () => void; onBlock: () => void; onCardBack: () => void; onFullSettings: () => void; onChangePIN: () => void
}) {
  const [frozen, setFrozen] = useState(localStorage.getItem(`fb-frozen-${acc.id}`)  === 'true')
  const [online, setOnline] = useState(localStorage.getItem(`fb-online-${acc.id}`)  !== 'false')
  const [limit,  setLimit]  = useState(localStorage.getItem(`fb-limit-${acc.id}`)   === 'true')
  const [apple,  setApple]  = useState(localStorage.getItem(`fb-apple-${acc.id}`)   === 'true')
  const [limitAmt, setLimitAmt] = useState(localStorage.getItem(`fb-limit-amt-${acc.id}`) ?? '')
  const [showBlock, setShowBlock] = useState(false)
  const curr = getCurrency(acc.currency)

  const persist = (key: string, val: boolean) => localStorage.setItem(`fb-${key}-${acc.id}`, String(val))

  return (
    <ScreenOverlay title="Paramètres du portefeuille" onBack={onBack}>
      {showBlock && <BlockConfirmModal acc={acc} onCancel={() => setShowBlock(false)} onConfirm={() => { setShowBlock(false); onBlock() }} />}
      <div className="px-4 pt-4 space-y-4">
        <CardFront acc={acc} user={user} />
        {/* Action pills */}
        <div className="flex gap-3">
          <button onClick={() => { const n = !frozen; setFrozen(n); persist('frozen', n) }}
            className="flex-1 h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer tr active:scale-[0.97]"
            style={{ background: frozen ? '#1A56DB' : '#EEF3FF', color: frozen ? '#fff' : '#1A56DB' }}>
            <Snowflake className="w-4 h-4" />
            {frozen ? 'Dégeler' : 'Geler'}
          </button>
          <button onClick={onCardBack}
            className="flex-1 h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer tr active:scale-[0.97]"
            style={{ background: '#F3F3F6', color: '#0D1B4B' }}>
            <RefreshCw className="w-4 h-4" />
            Vue arrière
          </button>
          <button onClick={() => setShowBlock(true)}
            className="flex-1 h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer tr active:scale-[0.97]"
            style={{ background: '#FEF2F2', color: '#DC2626' }}>
            <AlertTriangle className="w-4 h-4" />
            Bloquer
          </button>
        </div>
        {/* Toggles */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
          <div className="flex items-center px-4 py-4 gap-3" style={{ borderBottom: '1px solid #F3F3F6' }}>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#0D1B4B' }}>Paiements en ligne</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Autoriser les achats internet</p>
            </div>
            <Toggle on={online} onChange={v => { setOnline(v); persist('online', v) }} />
          </div>
          <div style={{ borderBottom: '1px solid #F3F3F6' }}>
            <div className="flex items-center px-4 py-4 gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#0D1B4B' }}>Activer la limite</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Définir un plafond mensuel</p>
              </div>
              <Toggle on={limit} onChange={v => { setLimit(v); persist('limit', v) }} />
            </div>
            {limit && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#EEF3FF' }}>
                  <span className="font-semibold" style={{ color: '#1A56DB' }}>{curr?.symbol}</span>
                  <input type="number" placeholder="Montant du plafond"
                    value={limitAmt}
                    onChange={e => { setLimitAmt(e.target.value); localStorage.setItem(`fb-limit-amt-${acc.id}`, e.target.value) }}
                    className="flex-1 bg-transparent font-semibold text-sm outline-none"
                    style={{ color: '#1A56DB' }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center px-4 py-4 gap-3">
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#0D1B4B' }}>Ajouter à Apple Pay</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Payer avec iPhone / Apple Watch</p>
            </div>
            <Toggle on={apple} onChange={v => { setApple(v); persist('apple', v) }} />
          </div>
        </div>
        {/* Quick links */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
          {[
            { label: 'Modifier le code PIN', action: onChangePIN },
            { label: 'Tous les paramètres',  action: onFullSettings },
          ].map(({ label, action }, i) => (
            <button key={label} onClick={action}
              className="w-full flex items-center justify-between px-4 py-4 cursor-pointer tr"
              style={{ borderBottom: i < 1 ? '1px solid #F3F3F6' : 'none' }}>
              <span className="text-sm font-medium" style={{ color: '#0D1B4B' }}>{label}</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.3)' }} />
            </button>
          ))}
        </div>
      </div>
    </ScreenOverlay>
  )
}

// ── Card Back Screen ───────────────────────────────────────────────────────────
function CardBackScreen({ acc, onBack, onBlock }: {
  acc: CurrencyAccount; onBack: () => void; onBlock: () => void
}) {
  const [frozen,    setFrozen]    = useState(localStorage.getItem(`fb-frozen-${acc.id}`) === 'true')
  const [showBlock, setShowBlock] = useState(false)
  const curr = getCurrency(acc.currency)
  const cs   = getCardStyle(acc)

  return (
    <ScreenOverlay title="Vue arrière de la carte" onBack={onBack}>
      {showBlock && <BlockConfirmModal acc={acc} onCancel={() => setShowBlock(false)} onConfirm={() => { setShowBlock(false); onBlock() }} />}
      <div className="px-4 pt-4 space-y-4">
        <CardBack acc={acc} />
        <div className="flex gap-3">
          <button onClick={() => { const n = !frozen; setFrozen(n); localStorage.setItem(`fb-frozen-${acc.id}`, String(n)) }}
            className="flex-1 h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer tr active:scale-[0.97]"
            style={{ background: frozen ? '#1A56DB' : '#EEF3FF', color: frozen ? '#fff' : '#1A56DB' }}>
            <Snowflake className="w-4 h-4" />{frozen ? 'Dégeler' : 'Geler'}
          </button>
          <button onClick={onBack}
            className="flex-1 h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer tr active:scale-[0.97]"
            style={{ background: '#F3F3F6', color: '#0D1B4B' }}>
            <ChevronLeft className="w-4 h-4" />Retour
          </button>
          <button onClick={() => setShowBlock(true)}
            className="flex-1 h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer tr active:scale-[0.97]"
            style={{ background: '#FEF2F2', color: '#DC2626' }}>
            <AlertTriangle className="w-4 h-4" />Bloquer
          </button>
        </div>
        {/* Month limit card */}
        <div className="rounded-2xl p-4" style={{ background: '#fff' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(13,27,75,0.45)', letterSpacing: '0.08em' }}>LIMITE MENSUELLE</p>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Utilisé</p>
              <p className="font-bold text-xl" style={{ color: '#0D1B4B' }}>
                {curr?.symbol} {(acc.balance * 0.3).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs mb-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Plafond</p>
              <p className="font-bold text-xl" style={{ color: cs.glow }}>
                {curr?.symbol} {localStorage.getItem(`fb-limit-amt-${acc.id}`)
                  ? parseFloat(localStorage.getItem(`fb-limit-amt-${acc.id}`)!).toLocaleString('fr-FR')
                  : (acc.balance * 1.5).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F3F6' }}>
            <div className="h-full rounded-full" style={{ width: '30%', background: cs.gradient }} />
          </div>
        </div>
        {/* Settings list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
          {[
            { icon: Key,  label: 'Code PIN',      desc: 'Modifier votre code secret', action: () => {} },
            { icon: Bell, label: 'Notifications', desc: 'Alertes de transaction',     action: () => {} },
          ].map(({ icon: Icon, label, desc, action }, i) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer tr"
              style={{ borderBottom: i < 1 ? '1px solid #F3F3F6' : 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3F3F6' }}>
                <Icon className="w-5 h-5" style={{ color: 'rgba(13,27,75,0.6)' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: '#0D1B4B' }}>{label}</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,75,0.45)' }}>{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(13,27,75,0.3)' }} />
            </button>
          ))}
        </div>
      </div>
    </ScreenOverlay>
  )
}

// ── Full Settings Screen ───────────────────────────────────────────────────────
function FullSettingsScreen({ acc, onBack, onBlock, onChangePIN, onSettings }: {
  acc: CurrencyAccount; onBack: () => void; onBlock: () => void; onChangePIN: () => void; onSettings: () => void
}) {
  const navigate = useNavigate()
  const [showBlock,   setShowBlock]   = useState(false)
  const [toast,       setToast]       = useState('')
  const [notif,       setNotif]       = useState(localStorage.getItem(`fb-notif-${acc.id}`) !== 'false')

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
      {showBlock && <BlockConfirmModal acc={acc} onCancel={() => setShowBlock(false)} onConfirm={() => { setShowBlock(false); onBlock() }} />}
      <ScreenOverlay title="Tous les paramètres" onBack={onBack}>
        <div className="px-4 pt-4 space-y-4">
          <CardBack acc={acc} height={170} />
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
            {/* Code PIN */}
            <button onClick={onChangePIN}
              className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer tr" style={{ borderBottom: '1px solid #F3F3F6' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EEF3FF' }}>
                <Key className="w-5 h-5" style={{ color: '#1A56DB' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: '#0D1B4B' }}>Code PIN</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,75,0.45)' }}>Modifier votre code secret</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.3)' }} />
            </button>
            {/* Bloquer */}
            <button onClick={() => setShowBlock(true)}
              className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer tr" style={{ borderBottom: '1px solid #F3F3F6' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FEF2F2' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>Bloquer le portefeuille</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,75,0.45)' }}>Suspendre toutes les transactions</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.3)' }} />
            </button>
            {/* Notifications */}
            <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #F3F3F6' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3F3F6' }}>
                <Bell className="w-5 h-5" style={{ color: 'rgba(13,27,75,0.6)' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#0D1B4B' }}>Notifications</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,75,0.45)' }}>Alertes de transactions</p>
              </div>
              <Toggle on={notif} onChange={v => { setNotif(v); localStorage.setItem(`fb-notif-${acc.id}`, String(v)) }} />
            </div>
            {/* Paiements */}
            <button onClick={() => navigate('/history')}
              className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer tr" style={{ borderBottom: '1px solid #F3F3F6' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3F3F6' }}>
                <ArrowDownLeft className="w-5 h-5" style={{ color: 'rgba(13,27,75,0.6)' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: '#0D1B4B' }}>Paiements</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,75,0.45)' }}>Historique des transactions</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.3)' }} />
            </button>
            {/* Paramètre de carte */}
            <button onClick={onSettings}
              className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer tr" style={{ borderBottom: '1px solid #F3F3F6' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3F3F6' }}>
                <Shield className="w-5 h-5" style={{ color: 'rgba(13,27,75,0.6)' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: '#0D1B4B' }}>Paramètre de carte</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,75,0.45)' }}>Limites et restrictions</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.3)' }} />
            </button>
            {/* Remplacer */}
            <button onClick={() => setToast('Demande de remplacement envoyée !')}
              className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer tr">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F3F3F6' }}>
                <RefreshCw className="w-5 h-5" style={{ color: 'rgba(13,27,75,0.6)' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: '#0D1B4B' }}>Remplacer le portefeuille</p>
                <p className="text-xs" style={{ color: 'rgba(13,27,75,0.45)' }}>Demander un nouveau portefeuille</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.3)' }} />
            </button>
          </div>
        </div>
      </ScreenOverlay>
    </>
  )
}

// ── Change PIN Screen ──────────────────────────────────────────────────────────
function ChangePinScreen({ acc, onBack, onDone }: {
  acc: CurrencyAccount; onBack: () => void; onDone: () => void
}) {
  const [step,   setStep]   = useState<'current' | 'new' | 'confirm'>('current')
  const [pin,    setPin]    = useState('')
  const [newPin, setNewPin] = useState('')
  const [error,  setError]  = useState('')

  const hasPin = !!localStorage.getItem(walletPinKey(acc.id))

  function handleChange(v: string) {
    setPin(v); setError('')
    if (v.length === 4) {
      if (step === 'current') {
        if (!hasPin || v === localStorage.getItem(walletPinKey(acc.id))) { setPin(''); setStep('new') }
        else { setError('PIN incorrect.'); setTimeout(() => setPin(''), 500) }
      } else if (step === 'new') {
        setNewPin(v); setPin(''); setStep('confirm')
      } else {
        if (v === newPin) { localStorage.setItem(walletPinKey(acc.id), v); onDone() }
        else { setError('Les codes ne correspondent pas.'); setPin(''); setNewPin(''); setStep('new') }
      }
    }
  }

  const titles    = { current: 'PIN actuel', new: 'Nouveau PIN', confirm: 'Confirmer le PIN' }
  const subtitles = {
    current: hasPin ? 'Entrez votre code PIN actuel' : 'Aucun PIN défini — entrez un nouveau code',
    new:     'Choisissez un nouveau code à 4 chiffres',
    confirm: 'Saisissez à nouveau votre nouveau PIN',
  }

  return (
    <ScreenOverlay title="Modifier le code PIN" onBack={onBack}>
      <div className="flex flex-col items-center px-4 pt-8 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#EEF3FF' }}>
            <Key className="w-8 h-8" style={{ color: '#1A56DB' }} />
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#0D1B4B' }}>{titles[step]}</h2>
          <p className="text-sm" style={{ color: 'rgba(13,27,75,0.55)', maxWidth: 240, margin: '0 auto' }}>{subtitles[step]}</p>
          {error && <p className="text-sm mt-2 font-medium" style={{ color: '#DC2626' }}>{error}</p>}
        </div>
        <PinPad value={pin} onChange={handleChange} />
      </div>
    </ScreenOverlay>
  )
}

// ── PIN Setup (for new wallet) ─────────────────────────────────────────────────
function PinSetupScreen({ onBack, onConfirm }: { onBack: () => void; onConfirm: (pin: string) => void }) {
  const [step,  setStep]  = useState<'set' | 'confirm'>('set')
  const [pin,   setPin]   = useState('')
  const [first, setFirst] = useState('')
  const [error, setError] = useState('')

  function handleChange(v: string) {
    setPin(v); setError('')
    if (v.length === 4) {
      if (step === 'set') { setFirst(v); setPin(''); setStep('confirm') }
      else {
        if (v === first) { onConfirm(v) }
        else { setError('Les codes ne correspondent pas.'); setPin(''); setFirst(''); setStep('set') }
      }
    }
  }

  return (
    <ScreenOverlay title={step === 'set' ? 'Créer votre code PIN' : 'Confirmer le PIN'} onBack={onBack}>
      <div className="flex flex-col items-center px-4 pt-8 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#EEF3FF' }}>
            <Key className="w-8 h-8" style={{ color: '#1A56DB' }} />
          </div>
          <p className="text-sm" style={{ color: 'rgba(13,27,75,0.55)', maxWidth: 240, margin: '0 auto' }}>
            {step === 'set' ? 'Choisissez un code PIN à 4 chiffres pour ce portefeuille' : 'Saisissez à nouveau votre code PIN pour confirmer'}
          </p>
          {error && <p className="text-sm mt-2 font-medium" style={{ color: '#DC2626' }}>{error}</p>}
        </div>
        <PinPad value={pin} onChange={handleChange} />
      </div>
    </ScreenOverlay>
  )
}

// ── Add Wallet Screen ──────────────────────────────────────────────────────────
interface NewWalletData { holderName: string; currency: string; styleId: string; setDefault: boolean }

function AddWalletScreen({ user, onBack, onNext }: {
  user: UserLike; onBack: () => void; onNext: (d: NewWalletData) => void
}) {
  const [holderName, setHolderName] = useState(getUserDisplayName(user))
  const [currency,   setCurrency]   = useState('HTG')
  const [styleId,    setStyleId]    = useState('purple')
  const [setDefault, setSetDefault] = useState(false)
  const [step,       setStep]       = useState<'form' | 'verify'>('form')
  const [toast,      setToast]      = useState('')

  const autoNum = useState(() => `${Math.floor(1000 + Math.random() * 9000)} •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`)[0]
  const autoExp = (() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 3)
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`
  })()
  const autoCVV = useState(() => String(100 + Math.floor(Math.random() * 900)))[0]
  const cs   = CARD_STYLES.find(s => s.id === styleId) ?? CARD_STYLES[0]
  const curr = getCurrency(currency)
  const flag = CURRENCY_FLAGS[currency]

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
      <ScreenOverlay title={step === 'form' ? 'Ajouter un portefeuille' : 'Vérifier'} onBack={step === 'verify' ? () => setStep('form') : onBack}>
        <div className="px-4 pt-4 space-y-4">
          {/* Card preview */}
          <div className="relative rounded-[1.75rem] overflow-hidden w-full select-none"
            style={{ background: cs.gradient, boxShadow: `0 12px 40px ${cs.glow}55`, height: 200 }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 60%)' }} />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl" style={{ background: cs.accent }} />
            <div className="relative h-full flex flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
                    style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 13 }}>
                    {getUserInitials(user)}
                  </div>
                  <div>
                    <p className="font-semibold text-white" style={{ fontSize: 11 }}>{holderName || 'Votre nom'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{curr?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {flag && <img src={flag} alt={currency} className="w-6 h-4 object-cover rounded" style={{ border: '1px solid rgba(255,255,255,0.3)' }} onError={e => (e.currentTarget.style.display = 'none')} />}
                  <span className="font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', fontSize: 10 }}>{currency}</span>
                </div>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600 }}>SOLDE DISPONIBLE</p>
                <p className="font-bold text-white" style={{ fontSize: 26 }}>{curr?.symbol} 0,00</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="font-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: '0.12em' }}>{autoNum}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{autoExp}</p>
              </div>
            </div>
          </div>

          {step === 'form' ? (
            <>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
                <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #F3F3F6' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'rgba(13,27,75,0.45)' }}>Numéro (auto)</p>
                  <p className="font-mono font-semibold text-sm" style={{ color: '#0D1B4B' }}>{autoNum}</p>
                </div>
                <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #F3F3F6' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'rgba(13,27,75,0.45)' }}>Titulaire</p>
                  <input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Votre nom complet"
                    className="w-full font-semibold text-sm bg-transparent outline-none" style={{ color: '#0D1B4B' }} />
                </div>
                <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #F3F3F6' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'rgba(13,27,75,0.45)' }}>Devise</p>
                  <select value={currency} onChange={e => { setCurrency(e.target.value); setStyleId(CURRENCY_DEFAULT_STYLE[e.target.value] ?? 'purple') }}
                    className="w-full font-semibold text-sm bg-transparent outline-none cursor-pointer" style={{ color: '#0D1B4B' }}>
                    {CURRENCIES.slice(0, 10).map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex">
                  <div className="flex-1 px-4 py-3.5" style={{ borderRight: '1px solid #F3F3F6' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'rgba(13,27,75,0.45)' }}>Expiration</p>
                    <p className="font-mono font-semibold text-sm" style={{ color: '#0D1B4B' }}>{autoExp}</p>
                  </div>
                  <div className="flex-1 px-4 py-3.5">
                    <p className="text-xs font-medium mb-1" style={{ color: 'rgba(13,27,75,0.45)' }}>CVV</p>
                    <p className="font-mono font-semibold text-sm" style={{ color: '#0D1B4B' }}>{autoCVV}</p>
                  </div>
                </div>
              </div>
              {/* Style picker */}
              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(13,27,75,0.5)', letterSpacing: '0.08em' }}>DESIGN DE CARTE</p>
                <div className="flex gap-2.5">
                  {CARD_STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyleId(s.id)}
                      className="flex-1 h-10 rounded-xl cursor-pointer tr active:scale-95 flex items-center justify-center"
                      style={{ background: s.gradient, boxShadow: styleId === s.id ? `0 0 0 2.5px #fff,0 0 0 5px ${s.glow}` : 'none' }}>
                      {styleId === s.id && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={() => setToast('Fonctionnalité disponible bientôt !')}
                  className="flex-1 h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer tr border"
                  style={{ borderColor: '#DDE1F0', color: '#0D1B4B', background: '#fff' }}>
                  <ScanLine className="w-4 h-4" />Scanner
                </button>
                <button onClick={() => holderName.trim() && setStep('verify')} disabled={!holderName.trim()}
                  className="flex-1 h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer tr disabled:opacity-40"
                  style={{ background: '#1A56DB', color: '#fff' }}>
                  Suivant
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
                <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F3F6' }}>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Titulaire</p>
                    <p className="font-semibold text-sm" style={{ color: '#0D1B4B' }}>{holderName}</p>
                  </div>
                </div>
                <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F3F6' }}>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Devise</p>
                    <p className="font-semibold text-sm" style={{ color: '#0D1B4B' }}>{curr?.flag} {currency} — {curr?.name}</p>
                  </div>
                </div>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(13,27,75,0.45)' }}>Portefeuille principal</p>
                    <p className="text-sm" style={{ color: 'rgba(13,27,75,0.6)' }}>Définir comme défaut</p>
                  </div>
                  <Toggle on={setDefault} onChange={setSetDefault} />
                </div>
              </div>
              <button onClick={() => onNext({ holderName, currency, styleId, setDefault })}
                className="w-full h-12 rounded-2xl font-semibold text-sm cursor-pointer tr active:scale-[0.98]"
                style={{ background: '#1A56DB', color: '#fff' }}>
                Créer le portefeuille
              </button>
            </>
          )}
        </div>
      </ScreenOverlay>
    </>
  )
}

// ── Main Wallet Screen ─────────────────────────────────────────────────────────
type WalletScreen = 'main' | 'details' | 'settings' | 'card-back' | 'full-settings' | 'add-wallet' | 'pin-setup' | 'change-pin'
const SENSITIVE_SCREENS: WalletScreen[] = ['details', 'settings', 'card-back', 'full-settings', 'change-pin']

function MainWalletScreen({ accounts, loading, user, onNavigate, onAddWallet, onRecharge }: {
  accounts: CurrencyAccount[]; loading: boolean; user: UserLike
  onNavigate: (s: WalletScreen, acc?: CurrencyAccount) => void
  onAddWallet: () => void
  onRecharge: (acc: CurrencyAccount) => void
}) {
  const navigate = useNavigate()
  const [cardIdx, setCardIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  const sorted = [...accounts].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1
    if (!a.is_main && b.is_main) return 1
    return 0
  })
  const activeAcc = sorted[cardIdx] ?? null
  const totalUSD  = accounts.reduce((s, a) => s + a.balance * getRate(a.currency, 'USD'), 0)

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F3F3F6' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ background: '#fff', borderBottom: '1px solid #F3F3F6' }}>
        <h1 className="font-bold text-lg" style={{ color: '#0D1B4B', letterSpacing: '-0.02em' }}>Mes Portefeuilles</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setVisible(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full border cursor-pointer tr"
            style={{ borderColor: '#DDE1F0', background: '#fff' }}>
            {visible ? <Eye className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.6)' }} /> : <EyeOff className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.6)' }} />}
          </button>
          <button onClick={onAddWallet}
            className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer tr active:scale-95"
            style={{ background: '#1A56DB' }}>
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Card carousel */}
        {loading ? (
          <div className="h-[210px] rounded-[1.75rem] animate-pulse" style={{ background: '#DDE1F0' }} />
        ) : sorted.length === 0 ? (
          <button onClick={onAddWallet}
            className="h-[210px] w-full rounded-[1.75rem] flex flex-col items-center justify-center gap-3 border-2 border-dashed cursor-pointer tr"
            style={{ borderColor: '#DDE1F0', background: '#fff' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#EEF3FF' }}>
              <Plus className="w-7 h-7" style={{ color: '#1A56DB' }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: '#1A56DB' }}>Ajouter un portefeuille</p>
          </button>
        ) : activeAcc ? (
          <div>
            <CardFront acc={activeAcc} user={user} visible={visible} />
            {sorted.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <button onClick={() => setCardIdx(i => Math.max(0, i - 1))} disabled={cardIdx === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer disabled:opacity-30 tr"
                  style={{ background: '#fff', border: '1px solid #DDE1F0' }}>
                  <ChevronLeft className="w-4 h-4" style={{ color: '#0D1B4B' }} />
                </button>
                <div className="flex gap-1.5">
                  {sorted.map((_, i) => (
                    <button key={i} onClick={() => setCardIdx(i)} className="cursor-pointer tr rounded-full"
                      style={{ width: i === cardIdx ? 20 : 6, height: 6, background: i === cardIdx ? '#1A56DB' : '#DDE1F0' }} />
                  ))}
                </div>
                <button onClick={() => setCardIdx(i => Math.min(sorted.length - 1, i + 1))} disabled={cardIdx === sorted.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer disabled:opacity-30 tr"
                  style={{ background: '#fff', border: '1px solid #DDE1F0' }}>
                  <ChevronRight className="w-4 h-4" style={{ color: '#0D1B4B' }} />
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Total */}
        {!loading && accounts.length > 0 && (
          <div className="text-center py-1">
            <p className="text-xs font-medium" style={{ color: 'rgba(13,27,75,0.5)' }}>Total Cards Balance</p>
            <p className="font-bold tabular-nums" style={{ fontSize: 30, color: '#0D1B4B', letterSpacing: '-0.02em', lineHeight: 1.15, marginTop: 4 }}>
              {visible ? `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$•••,•••.••'}
            </p>
          </div>
        )}

        {/* Quick actions */}
        {!loading && accounts.length > 0 && (
          <div className="flex items-center gap-2.5">
            {[
              { label: 'Transférer', fn: () => navigate('/transfer'), primary: true  },
              { label: 'Recharger',  fn: () => activeAcc && onRecharge(activeAcc),   primary: false },
              { label: 'Payer',      fn: () => navigate('/bills'),     primary: false },
            ].map(({ label, fn, primary }) => (
              <button key={label} onClick={fn}
                className="flex-1 h-11 rounded-full font-semibold text-sm cursor-pointer tr active:scale-[0.97]"
                style={primary ? { background: '#1A56DB', color: '#fff' } : { background: '#fff', color: '#0D1B4B', border: '1.5px solid #DDE1F0' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Settings menu */}
        {!loading && accounts.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
            <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #F3F3F6' }}>
              <p className="font-bold text-sm" style={{ color: '#0D1B4B' }}>Portefeuille Settings</p>
            </div>
            {[
              { label: 'Portefeuille Info',    s: 'details'  as WalletScreen },
              { label: 'Portefeuille Setting', s: 'settings' as WalletScreen },
              { label: 'Paiements',            s: 'main'     as WalletScreen, action: () => navigate('/history') },
            ].map(({ label, s, action }, i) => {
              const hasPIN = !!activeAcc && !!localStorage.getItem(walletPinKey(activeAcc.id))
              return (
                <button key={label} onClick={() => action ? action() : onNavigate(s, activeAcc ?? undefined)}
                  className="w-full flex items-center justify-between px-4 py-4 cursor-pointer tr"
                  style={{ borderBottom: i < 2 ? '1px solid #F3F3F6' : 'none' }}>
                  <span className="text-sm font-medium" style={{ color: '#0D1B4B' }}>{label}</span>
                  <div className="flex items-center gap-2">
                    {hasPIN && s !== 'main' && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#EEF3FF' }}>
                        <Key className="w-3 h-3" style={{ color: '#1A56DB' }} />
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4" style={{ color: 'rgba(13,27,75,0.3)' }} />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Wallets list */}
        {!loading && sorted.length > 1 && (
          <div>
            <p className="text-xs font-semibold mb-3 px-1" style={{ color: 'rgba(13,27,75,0.45)', letterSpacing: '0.08em' }}>TOUS MES PORTEFEUILLES</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
              {sorted.map((acc, i) => {
                const curr = getCurrency(acc.currency)
                const cs   = getCardStyle(acc)
                const flag = CURRENCY_FLAGS[acc.currency]
                const isActive = i === cardIdx
                const frozen   = localStorage.getItem(`fb-frozen-${acc.id}`)  === 'true'
                const blocked  = localStorage.getItem(`fb-blocked-${acc.id}`) === 'true'
                return (
                  <button key={acc.id} onClick={() => setCardIdx(i)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer tr"
                    style={{ borderBottom: i < sorted.length - 1 ? '1px solid #F3F3F6' : 'none', background: isActive ? '#EEF3FF' : '#fff' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
                      style={{ background: cs.gradient }}>
                      {flag
                        ? <img src={flag} alt={acc.currency} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        : <span className="font-bold text-white text-xs">{acc.currency}</span>}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: '#0D1B4B' }}>{acc.currency}</p>
                        {frozen  && !blocked && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>GELÉ</span>}
                        {blocked && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>BLOQUÉ</span>}
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(13,27,75,0.45)' }}>{curr?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm tabular-nums" style={{ color: '#0D1B4B' }}>
                        {visible ? `${curr?.symbol} ${acc.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}` : `${curr?.symbol} ••••`}
                      </p>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#1A56DB' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────────────────────
export function WalletPage() {
  const { user } = useAuth()
  const [accounts,      setAccounts]      = useState<CurrencyAccount[]>([])
  const [loadingAcc,    setLoadingAcc]    = useState(true)
  const [screen,        setScreen]        = useState<WalletScreen>('main')
  const [activeAcc,     setActiveAcc]     = useState<CurrencyAccount | null>(null)
  const [showBlock,     setShowBlock]     = useState(false)
  const [showDeposit,   setShowDeposit]   = useState(false)
  const [depositAcc,    setDepositAcc]    = useState<CurrencyAccount | null>(null)
  const [pendingData,   setPendingData]   = useState<NewWalletData | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [pinRequired,   setPinRequired]   = useState(false)
  const [pendingScreen, setPendingScreen] = useState<WalletScreen | null>(null)

  async function loadAccounts() {
    if (!user) return
    const { data } = await supabase
      .from('currency_accounts').select('*')
      .eq('user_id', user.id).order('is_main', { ascending: false })
    if (data) setAccounts(data)
    setLoadingAcc(false)
  }

  useEffect(() => { loadAccounts() }, [user])

  function goTo(s: WalletScreen, acc?: CurrencyAccount) {
    const target = acc ?? activeAcc
    if (!target) return
    if (SENSITIVE_SCREENS.includes(s) && localStorage.getItem(walletPinKey(target.id))) {
      setActiveAcc(target)
      setPendingScreen(s)
      setPinRequired(true)
    } else {
      if (acc) setActiveAcc(acc)
      setScreen(s)
    }
  }

  function handlePinSuccess() {
    setPinRequired(false)
    if (pendingScreen) { setScreen(pendingScreen); setPendingScreen(null) }
  }

  function handleBlock() {
    if (activeAcc) localStorage.setItem(`fb-blocked-${activeAcc.id}`, 'true')
    setShowBlock(false)
    setScreen('main')
  }

  async function handlePinConfirmed(pin: string) {
    if (!user || !pendingData) return
    setSaving(true)
    const { data: newAcc, error } = await supabase
      .from('currency_accounts')
      .insert({ user_id: user.id, currency: pendingData.currency, balance: 0, is_main: pendingData.setDefault })
      .select().single()
    if (!error && newAcc) {
      localStorage.setItem(`fb-card-style-${newAcc.id}`, pendingData.styleId)
      localStorage.setItem(walletPinKey(newAcc.id), pin)
      await loadAccounts()
    }
    setSaving(false)
    setPendingData(null)
    setScreen('main')
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F3F6' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1A56DB' }} />
    </div>
  )

  return (
    <div className="relative">
      {/* Global modals (z-70, above everything) */}
      {showBlock && activeAcc && (
        <BlockConfirmModal acc={activeAcc} onCancel={() => setShowBlock(false)} onConfirm={handleBlock} />
      )}
      {pinRequired && activeAcc && (
        <WalletPinModal acc={activeAcc} user={user}
          onSuccess={handlePinSuccess}
          onCancel={() => { setPinRequired(false); setPendingScreen(null) }} />
      )}
      {showDeposit && depositAcc && (
        <DepositModal acc={depositAcc} user={user}
          onClose={() => setShowDeposit(false)}
          onSuccess={() => { loadAccounts() }} />
      )}
      {saving && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(13,27,75,0.4)', zIndex: 80 }}>
          <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background: '#fff' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1A56DB' }} />
            <p className="font-semibold text-sm" style={{ color: '#0D1B4B' }}>Création en cours…</p>
          </div>
        </div>
      )}

      {/* Sub-screens (z-35, between top header and bottom nav) */}
      {screen === 'details' && activeAcc && (
        <DetailsScreen acc={activeAcc} user={user} onBack={() => setScreen('main')} />
      )}
      {screen === 'settings' && activeAcc && (
        <SettingsScreen acc={activeAcc} user={user}
          onBack={() => setScreen('main')}
          onBlock={() => setShowBlock(true)}
          onCardBack={() => setScreen('card-back')}
          onFullSettings={() => setScreen('full-settings')}
          onChangePIN={() => setScreen('change-pin')}
        />
      )}
      {screen === 'card-back' && activeAcc && (
        <CardBackScreen acc={activeAcc} onBack={() => setScreen('settings')} onBlock={() => setScreen('main')} />
      )}
      {screen === 'full-settings' && activeAcc && (
        <FullSettingsScreen acc={activeAcc}
          onBack={() => setScreen('settings')}
          onBlock={() => setShowBlock(true)}
          onChangePIN={() => setScreen('change-pin')}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'change-pin' && activeAcc && (
        <ChangePinScreen acc={activeAcc} onBack={() => setScreen('settings')} onDone={() => setScreen('settings')} />
      )}
      {screen === 'add-wallet' && (
        <AddWalletScreen user={user} onBack={() => setScreen('main')} onNext={d => { setPendingData(d); setScreen('pin-setup') }} />
      )}
      {screen === 'pin-setup' && (
        <PinSetupScreen onBack={() => setScreen('add-wallet')} onConfirm={handlePinConfirmed} />
      )}

      {/* Main always in DOM */}
      <MainWalletScreen
        accounts={accounts} loading={loadingAcc} user={user}
        onNavigate={goTo}
        onAddWallet={() => setScreen('add-wallet')}
        onRecharge={acc => { setDepositAcc(acc); setShowDeposit(true) }}
      />
    </div>
  )
}
