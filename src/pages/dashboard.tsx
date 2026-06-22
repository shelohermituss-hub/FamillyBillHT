import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight, ArrowDownLeft, Repeat, Plus, Eye, EyeOff,
  X, Share2, Copy, Check, QrCode, LayoutGrid,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount, type Transaction } from '@/lib/supabase'
import { formatCurrency, getCurrency, getRate } from '@/lib/currencies'
import { BILL_CATEGORIES } from '@/lib/haiti-providers'

const ACCOUNT_CARD_STYLES: Record<string, { gradient: string; glowColor: string }> = {
  HTG: { gradient: 'linear-gradient(135deg, #1a0070 0%, #3b12cc 45%, #6d28d9 100%)', glowColor: '#7c3aed' },
  USD: { gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #34d399 100%)', glowColor: '#10b981' },
  EUR: { gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #60a5fa 100%)', glowColor: '#3b82f6' },
  CAD: { gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #fb923c 100%)', glowColor: '#f97316' },
  BRL: { gradient: 'linear-gradient(135deg, #831843 0%, #e11d48 45%, #fb7185 100%)', glowColor: '#f43f5e' },
}
const DEFAULT_CARD_STYLE = { gradient: 'linear-gradient(135deg, #1a0070 0%, #3b12cc 45%, #6d28d9 100%)', glowColor: '#7c3aed' }

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
        <div className="mx-5 mb-5 relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #1a0070 0%, #3b12cc 45%, #6d28d9 100%)' }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20" style={{ background: 'rgba(167,139,250,0.5)' }} />
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

// ── Mini card icon for wallet entries ─────────────────────────────────────────

function MiniCardIcon({ currency }: { currency: string }) {
  const cs = ACCOUNT_CARD_STYLES[currency] ?? DEFAULT_CARD_STYLE
  return (
    <div className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 52, height: 34, background: cs.gradient }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)' }} />
      {/* chip */}
      <div className="absolute bottom-1.5 left-2 w-5 h-3.5 rounded-sm"
        style={{ background: 'rgba(255,220,100,0.6)', border: '0.5px solid rgba(255,255,255,0.3)' }} />
      <p className="absolute top-1 right-2 font-bold text-white" style={{ fontSize: 7, letterSpacing: '0.05em' }}>{currency}</p>
    </div>
  )
}

// ── Bill category card ────────────────────────────────────────────────────────

function BillCategoryCard({ cat }: { cat: typeof BILL_CATEGORIES[0] }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/bills?category=${cat.id}`)}
      className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
      style={{ minWidth: 64 }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center tr group-hover:scale-105 overflow-hidden"
        style={{ background: cat.bg ?? '#F3F4F6', border: '1.5px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {cat.icon
          ? <img src={cat.icon} alt={cat.label} className="w-full h-full object-contain" onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }} />
          : <span style={{ fontSize: 24 }}>{cat.emoji}</span>}
      </div>
      <span className="text-center leading-tight font-semibold" style={{ fontSize: 10, color: '#374151', maxWidth: 56 }}>{cat.label}</span>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [transactions, setTx] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)
  const [showReceive, setShowReceive] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const [a, t] = await Promise.all([
      supabase.from('currency_accounts').select('*').eq('user_id', user.id).order('is_main', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ])
    if (a.data) setAccounts(a.data)
    if (t.data) setTx(t.data)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const sorted = [...accounts].sort((a, b) => {
    if (a.currency === 'HTG') return -1
    if (b.currency === 'HTG') return 1
    if (a.currency === 'USD') return -1
    if (b.currency === 'USD') return 1
    return b.balance - a.balance
  })

  const totalUSD = accounts.reduce((s, a) => s + a.balance * getRate(a.currency, 'USD'), 0)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'là'
  const avatarUrl = profile?.avatar_url
  const initials = (profile?.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const greetHour = new Date().getHours()
  const greetWord = greetHour < 12 ? 'Bonjour' : greetHour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="min-h-screen pb-28 md:pb-8 overflow-x-hidden" style={{ background: '#F3F4F6', maxWidth: '100vw' }}>
      {showReceive && <ReceiveModal profile={profile} onClose={() => setShowReceive(false)} />}

      {/* ── Balance section (white card) ── */}
      <div className="bg-white px-5 pt-5 pb-6" style={{ borderBottom: '1px solid #F3F4F6' }}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* Avatar */}
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
          <div className="flex items-center gap-2">
            <Link to="/history">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl tr cursor-pointer hover:bg-gray-50"
                style={{ background: '#F9FAFB' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
            </Link>
            <button
              className="w-9 h-9 flex items-center justify-center rounded-xl tr cursor-pointer hover:bg-gray-50"
              style={{ background: '#F9FAFB' }}
              onClick={() => navigate('/wallet')}
            >
              <LayoutGrid className="w-4 h-4" style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        </div>

        {/* Balance */}
        <p className="text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Total Account Balance</p>
        <div className="flex items-center gap-2 mb-5">
          {loading ? (
            <div className="h-10 w-44 rounded-xl animate-pulse bg-gray-100" />
          ) : (
            <p className="font-extrabold tabular-nums" style={{ fontSize: 'clamp(26px, 8vw, 40px)', color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {visible
                ? `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '$•••••'}
            </p>
          )}
          <button
            onClick={() => setVisible(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full tr cursor-pointer shrink-0"
            style={{ background: '#F3F4F6' }}
          >
            {visible
              ? <Eye className="w-4 h-4" style={{ color: '#9CA3AF' }} />
              : <EyeOff className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/transfer')}
            className="flex items-center gap-1.5 px-4 h-11 rounded-full text-sm font-semibold text-white cursor-pointer tr hover:opacity-90 active:scale-97 shrink-0"
            style={{ background: 'var(--lime)', boxShadow: '0 4px 16px rgba(26,86,219,0.3)' }}
          >
            <ArrowUpRight className="w-4 h-4" />
            Transfert
          </button>
          <button
            onClick={() => setShowReceive(true)}
            className="flex items-center gap-1.5 px-4 h-11 rounded-full text-sm font-semibold cursor-pointer tr hover:bg-gray-50 active:scale-97 shrink-0"
            style={{ border: '1.5px solid #E5E7EB', color: '#374151' }}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Recevoir
          </button>
          <button
            onClick={() => navigate('/bills')}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer tr hover:bg-gray-50 shrink-0"
            style={{ border: '1.5px solid #E5E7EB' }}
          >
            <LayoutGrid className="w-4 h-4" style={{ color: '#374151' }} />
          </button>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="max-w-2xl mx-auto">

        {/* ── Payer vos factures ── */}
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            <h2 className="font-bold text-base" style={{ color: '#111', letterSpacing: '-0.02em' }}>Payer vos factures</h2>
            <Link to="/bills" className="text-xs font-bold tr hover:opacity-70" style={{ color: 'var(--lime)' }}>
              Voir plus →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-4 pt-3">
            {BILL_CATEGORIES.map(cat => (
              <BillCategoryCard key={cat.id} cat={cat} />
            ))}
            {/* "Voir plus" card at end */}
            <Link to="/bills" className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group" style={{ minWidth: 64 }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center tr group-hover:scale-105"
                style={{ background: '#F3F4F6', border: '1.5px dashed #D1D5DB' }}>
                <span style={{ fontSize: 22, color: '#9CA3AF' }}>+</span>
              </div>
              <span className="text-center leading-tight font-semibold" style={{ fontSize: 10, color: '#9CA3AF', maxWidth: 56 }}>Voir plus</span>
            </Link>
          </div>
        </div>

        {/* ── Wallet card ── */}
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h2 className="font-bold text-base" style={{ color: '#111', letterSpacing: '-0.02em' }}>Portefeuille</h2>
            <button
              onClick={() => navigate('/wallet')}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer tr hover:opacity-80"
              style={{ background: 'var(--lime)' }}
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-0 divide-y divide-gray-50">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-[52px] h-[34px] rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="px-4 pb-6 text-center">
              <p className="text-sm py-4" style={{ color: '#9CA3AF' }}>Aucun compte devise. Ajoutez-en un.</p>
              <button onClick={() => navigate('/wallet')} className="btn-lime px-4 py-2 rounded-xl text-sm cursor-pointer">
                Ajouter
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#F9FAFB' }}>
              {sorted.map(acc => {
                const curr = getCurrency(acc.currency)
                const usdVal = acc.balance * getRate(acc.currency, 'USD')
                return (
                  <button
                    key={acc.id}
                    onClick={() => navigate('/wallet')}
                    className="w-full flex items-center gap-4 px-4 py-3.5 tr hover:bg-gray-50 cursor-pointer text-left"
                  >
                    <MiniCardIcon currency={acc.currency} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold truncate" style={{ color: '#111' }}>{curr?.name ?? acc.currency}</p>
                        <p className="text-xs font-mono ml-2 shrink-0" style={{ color: '#9CA3AF' }}>
                          ****{acc.id.slice(-4).toUpperCase()}
                        </p>
                      </div>
                      <p className="text-sm font-bold tabular-nums" style={{ color: '#374151' }}>
                        {visible
                          ? formatCurrency(acc.balance, acc.currency)
                          : `${curr?.symbol ?? ''} ••••••`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs tabular-nums" style={{ color: '#9CA3AF' }}>
                        {visible ? `≈ $${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '≈ $••••'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {/* View all link */}
          <div className="px-4 py-3 border-t" style={{ borderColor: '#F9FAFB' }}>
            <button onClick={() => navigate('/wallet')} className="w-full text-center text-sm font-semibold cursor-pointer tr hover:opacity-70" style={{ color: 'var(--lime)' }}>
              Voir toutes les devises →
            </button>
          </div>
        </div>

        {/* ── Recent transactions ── */}
        <div className="mx-4 mt-4 mb-4 rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
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
                const isSend = tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'bill_payment'
                const isReceive = tx.type === 'receive' || tx.type === 'deposit'
                const curr = getCurrency(tx.currency)
                const label = tx.type === 'convert'
                  ? `${tx.currency} → ${tx.target_currency}`
                  : (tx.recipient_name ?? (tx.type === 'bill_payment' ? 'Facture' : tx.type === 'deposit' ? 'Dépôt' : 'Transfert'))
                const iconBg = isSend ? '#FEE2E2' : isReceive ? '#D1FAE5' : '#EDE9FE'
                const iconColor = isSend ? '#EF4444' : isReceive ? '#059669' : '#7C3AED'
                const amountColor = isSend ? '#EF4444' : isReceive ? '#059669' : '#374151'
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
                      {isSend
                        ? <ArrowUpRight className="w-4 h-4" style={{ color: iconColor }} />
                        : isReceive
                          ? <ArrowDownLeft className="w-4 h-4" style={{ color: iconColor }} />
                          : <Repeat className="w-4 h-4" style={{ color: iconColor }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#111' }}>{label}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {' · '}{tx.currency}
                      </p>
                    </div>
                    <p className="text-sm font-bold tabular-nums shrink-0" style={{ color: amountColor }}>
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
