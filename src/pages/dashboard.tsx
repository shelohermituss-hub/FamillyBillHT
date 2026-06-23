import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight, ArrowDownLeft, Repeat, Eye, EyeOff,
  X, Share2, Copy, Check, QrCode,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount, type Transaction } from '@/lib/supabase'
import { getCurrency } from '@/lib/currencies'
import { BILL_CATEGORIES } from '@/lib/haiti-providers'

// ── Receive Modal ─────────────────────────────────────────────────────────────

function ReceiveModal({ profile, onClose }: { profile: { full_name?: string; user_code?: string } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const userCode = profile?.user_code
  const name = profile?.full_name ?? 'Utilisateur'

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function copy() {
    if (!userCode) return
    navigator.clipboard.writeText(userCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function share() {
    if (!userCode) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FamillyBill HT', text: `Mon ID: ${userCode}\nNom: ${name}` })
        return
      } catch { /* fallback */ }
    }
    copy()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl md:rounded-3xl overflow-hidden animate-fade-in-up"
        style={{ background: '#ffffff', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#111' }}>Recevoir de l'argent</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Partagez votre ID pour recevoir des paiements</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer tr"
            style={{ background: '#F3F4F6' }}>
            <X className="w-4 h-4" style={{ color: '#6B7280' }} />
          </button>
        </div>
        <div className="mx-5 mb-5 relative overflow-hidden rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #34d399 100%)' }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20" style={{ background: 'rgba(52,211,153,0.5)' }} />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Mon ID FamillyBill
            </p>
            <p className="text-2xl font-black tracking-widest font-mono mb-1 text-white">{userCode ?? '—'}</p>
            <p className="text-sm font-medium text-white">{name}</p>
          </div>
        </div>
        <div className="px-5 pb-6 grid grid-cols-2 gap-3">
          <button onClick={copy}
            className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold border cursor-pointer tr hover:bg-gray-50"
            style={{ borderColor: '#E5E7EB', color: '#374151' }}>
            {copied ? <Check className="w-4 h-4" style={{ color: 'var(--lime)' }} /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button onClick={share}
            className="btn-lime flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold cursor-pointer">
            <Share2 className="w-4 h-4" /> Partager
          </button>
        </div>
      </div>
    </div>
  )
}

// ── USD Wallet Card ───────────────────────────────────────────────────────────

function UsdWalletCard({ account, visible }: { account: CurrencyAccount | null; visible: boolean }) {
  const navigate = useNavigate()
  const balance = account?.balance ?? 0
  const lastChars = account ? account.id.replace(/-/g, '').slice(-8).toUpperCase() : '————'
  const maskedId  = lastChars.slice(0, 4) + ' ' + lastChars.slice(4)

  return (
    <button
      onClick={() => navigate('/wallet')}
      className="relative w-full overflow-hidden cursor-pointer"
      style={{
        borderRadius: 24,
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #34d399 100%)',
        boxShadow: '0 8px 32px rgba(5,150,105,0.35)',
        minHeight: 172,
      }}
    >
      {/* decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.4)' }} />
      <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full opacity-10"
        style={{ background: 'rgba(255,255,255,0.4)' }} />

      <div className="relative z-10 p-5 flex flex-col h-full text-left">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                <circle cx="16.5" cy="13" r="1.5" fill="white" stroke="none"/>
              </svg>
            </div>
            <span className="text-white/80 text-sm font-semibold">Portefeuille USD</span>
          </div>
          {/* Mastercard-style circles */}
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full opacity-80" style={{ background: '#FF5F00' }} />
            <div className="w-8 h-8 rounded-full opacity-70" style={{ background: '#FFB300' }} />
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">Solde disponible</p>
          <p className="text-white font-extrabold tabular-nums" style={{ fontSize: 32, lineHeight: 1, letterSpacing: '-0.03em' }}>
            {visible
              ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '$•••••••'}
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">ID compte</p>
            <p className="text-white font-mono font-semibold text-sm tracking-widest">{maskedId}</p>
          </div>
          <div className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <span className="text-white text-xs font-bold">USD</span>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Bill Category Grid ────────────────────────────────────────────────────────

function BillGrid() {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-3 gap-3">
      {BILL_CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => navigate(`/bills?category=${cat.id}`)}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer tr hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: cat.bg ?? '#F3F4F6' }}
          >
            {cat.icon
              ? <img src={cat.icon} alt={cat.label} className="w-full h-full object-contain"
                  onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }} />
              : <span style={{ fontSize: 22 }}>{cat.emoji}</span>}
          </div>
          <span className="text-center leading-tight font-semibold" style={{ fontSize: 11, color: '#374151' }}>
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [usdAccount, setUsdAccount] = useState<CurrencyAccount | null>(null)
  const [transactions, setTx] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)
  const [showReceive, setShowReceive] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const [a, t] = await Promise.all([
      supabase.from('currency_accounts').select('*').eq('user_id', user.id).eq('currency', 'USD').maybeSingle(),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ])
    if (a.data) setUsdAccount(a.data)
    if (t.data) setTx(t.data)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'là'
  const avatarUrl = profile?.avatar_url
  const initials = (profile?.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const greetHour = new Date().getHours()
  const greetWord = greetHour < 12 ? 'Bonjour' : greetHour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="min-h-screen pb-28 md:pb-8 overflow-x-hidden" style={{ background: '#F3F4F6', maxWidth: '100vw' }}>
      {showReceive && <ReceiveModal profile={profile} onClose={() => setShowReceive(false)} />}

      {/* ── Header card (white) ── */}
      <div className="bg-white px-5 pt-5 pb-6" style={{ borderBottom: '1px solid #F3F4F6' }}>
        {/* Greeting row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden cursor-pointer"
              style={avatarUrl ? {} : { background: 'var(--lime)', color: '#fff' }}
              onClick={() => navigate('/profile')}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                {greetWord},{' '}
                <span className="font-bold" style={{ color: '#111' }}>{firstName}</span>
              </p>
            </div>
          </div>
          <Link to="/history">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl tr cursor-pointer hover:bg-gray-50"
              style={{ background: '#F9FAFB' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
          </Link>
        </div>

        {/* Balance */}
        <p className="text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Solde USD</p>
        <div className="flex items-center gap-2 mb-5">
          {loading ? (
            <div className="h-10 w-44 rounded-xl animate-pulse bg-gray-100" />
          ) : (
            <p className="font-extrabold tabular-nums" style={{ fontSize: 'clamp(26px, 8vw, 40px)', color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {visible
                ? `$${(usdAccount?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '$•••••'}
            </p>
          )}
          <button
            onClick={() => setVisible(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full tr cursor-pointer shrink-0"
            style={{ background: '#F3F4F6' }}
          >
            {visible
              ? <Eye    className="w-4 h-4" style={{ color: '#9CA3AF' }} />
              : <EyeOff className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/transfer')}
            className="flex items-center gap-1.5 px-5 h-11 rounded-full text-sm font-semibold text-white cursor-pointer tr hover:opacity-90 active:scale-97 shrink-0"
            style={{ background: 'var(--lime)', boxShadow: '0 4px 16px rgba(159,232,112,0.4)' }}
          >
            <ArrowUpRight className="w-4 h-4" />
            Envoyer
          </button>
          <button
            onClick={() => setShowReceive(true)}
            className="flex items-center gap-1.5 px-5 h-11 rounded-full text-sm font-semibold cursor-pointer tr hover:bg-gray-50 active:scale-97 shrink-0"
            style={{ border: '1.5px solid #E5E7EB', color: '#374151' }}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Recevoir
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 space-y-4 pt-4">

        {/* ── USD Wallet Card ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: '#111', letterSpacing: '-0.02em' }}>Mon Portefeuille</h2>
          </div>
          {loading
            ? <div className="h-44 rounded-3xl animate-pulse bg-gray-200" />
            : <UsdWalletCard account={usdAccount} visible={visible} />}
        </div>

        {/* ── Payer vos factures ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: '#111', letterSpacing: '-0.02em' }}>Payer vos factures</h2>
          </div>
          <BillGrid />
        </div>

        {/* ── Recent transactions ── */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h2 className="font-bold text-base" style={{ color: '#111', letterSpacing: '-0.02em' }}>Activité récente</h2>
            <Link to="/history" className="text-sm font-semibold tr hover:opacity-70" style={{ color: 'var(--lime)' }}>
              Tout voir →
            </Link>
          </div>

          {loading ? (
            <div className="px-4 pb-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-36" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
                  </div>
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-4 pb-6 text-center">
              <p className="text-sm py-4" style={{ color: '#9CA3AF' }}>Aucune transaction pour l'instant.</p>
              <button onClick={() => navigate('/transfer')} className="btn-lime px-4 py-2 rounded-xl text-sm cursor-pointer">
                Envoyer des fonds
              </button>
            </div>
          ) : (
            <div className="px-4 pb-4 divide-y" style={{ borderColor: '#F9FAFB' }}>
              {transactions.slice(0, 5).map(tx => {
                const isSend    = tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'bill_payment'
                const isReceive = tx.type === 'receive' || tx.type === 'deposit'
                const curr      = getCurrency(tx.currency)
                const label     = tx.type === 'convert'
                  ? `${tx.currency} → ${tx.target_currency}`
                  : (tx.recipient_name ?? (tx.type === 'bill_payment' ? 'Facture' : tx.type === 'deposit' ? 'Dépôt' : 'Transfert'))
                const iconBg    = isSend ? '#FEE2E2' : isReceive ? '#D1FAE5' : '#EDE9FE'
                const iconColor = isSend ? '#EF4444' : isReceive ? '#059669' : '#7C3AED'
                const amtColor  = isSend ? '#EF4444' : isReceive ? '#059669' : '#374151'
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
                      {isSend
                        ? <ArrowUpRight   className="w-4 h-4" style={{ color: iconColor }} />
                        : isReceive
                          ? <ArrowDownLeft className="w-4 h-4" style={{ color: iconColor }} />
                          : <Repeat        className="w-4 h-4" style={{ color: iconColor }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#111' }}>{label}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {' · '}{tx.currency}
                      </p>
                    </div>
                    <p className="text-sm font-bold tabular-nums shrink-0" style={{ color: amtColor }}>
                      {isSend ? '−' : isReceive ? '+' : ''}{curr?.symbol}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
