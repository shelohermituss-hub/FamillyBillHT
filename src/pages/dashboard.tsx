import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight, ArrowDownLeft, Repeat, Plus, Eye, EyeOff,
  TrendingUp, TrendingDown, Zap, X, Share2, Copy, Check, QrCode,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount, type Transaction } from '@/lib/supabase'
import { getCurrency, getRate } from '@/lib/currencies'
import { cn } from '@/lib/utils'
import { BILL_CATEGORIES } from '@/lib/haiti-providers'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

const TX_LABEL: Record<string, string> = {
  send: 'Envoi', receive: 'Réception', convert: 'Conversion',
  deposit: 'Dépôt', withdraw: 'Retrait', bill_payment: 'Facture',
}
const TX_STATUS: Record<string, string> = {
  pending: 'En attente', processing: 'En cours',
  completed: 'Complété', failed: 'Échoué', cancelled: 'Annulé',
}

// Simulated live rates with micro-fluctuations
const RATE_PAIRS = [
  { from: 'USD', to: 'HTG', label: 'Dollar américain', color: '#22c55e', seed: 1 },
  { from: 'EUR', to: 'HTG', label: 'Euro',             color: '#3b82f6', seed: 2 },
  { from: 'BRL', to: 'HTG', label: 'Real brésilien',   color: '#f59e0b', seed: 3 },
  { from: 'CAD', to: 'HTG', label: 'Dollar canadien',  color: '#ef4444', seed: 4 },
]

const RATE_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', BRL: 'R$', CAD: 'C$' }

const FLAG_ICONS: Record<string, string> = {
  USD: '/icons/currencies/usd.png',
  EUR: '/icons/currencies/eur-new.png',
  BRL: '/icons/currencies/brl.jpg',
  CAD: '/icons/currencies/cad.png',
}

function CurrencyBadge({ code, color }: { code: string; color: string }) {
  const src = FLAG_ICONS[code]
  if (src) return <img src={src} className="w-9 h-9 rounded-full object-cover shrink-0" alt={code} onError={e => (e.currentTarget.style.display = 'none')} />
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0"
      style={{ background: color }}
    >
      {RATE_SYMBOLS[code] ?? code.slice(0, 2)}
    </div>
  )
}

function simulatedChange(seed: number, tick: number): number {
  const v = Math.sin(seed * 31.7 + tick * 0.23) * 0.014 +
            Math.cos(seed * 17.3 + tick * 0.41) * 0.007
  return parseFloat(v.toFixed(4))
}

function RateTicker({ visible }: { visible: boolean }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--ink)]">Taux de change</h2>
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--lime-light)]" style={{ color: 'var(--ink)' }}>
            <Zap className="w-2.5 h-2.5" style={{ color: 'var(--lime)' }} /> En direct
          </span>
        </div>
        <Link to="/transfer?mode=convert" className="text-xs font-medium tr hover:opacity-70" style={{ color: 'var(--ink-60)' }}>
          Convertir →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {RATE_PAIRS.map(({ from, to, label, color, seed }) => {
          const baseRate = getRate(from, to)
          const chg = simulatedChange(seed, tick)
          const rate = baseRate * (1 + chg)
          const isUp = chg >= 0

          return (
            <div key={from} className="card-flat p-4 space-y-2 overflow-hidden relative">
              {/* Bleed decorative circle */}
              <div
                className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.07] pointer-events-none"
                style={{ background: color }}
              />
              <div
                className="absolute -bottom-6 -left-3 w-16 h-16 rounded-full opacity-[0.05] pointer-events-none"
                style={{ background: color }}
              />

              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <CurrencyBadge code={from} color={color} />
                  <div>
                    <p className="text-xs font-bold text-[var(--ink)] leading-tight">{from}/{to}</p>
                    <p className="text-[10px] text-[var(--ink-60)] leading-tight">{label}</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-lg",
                  isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                )}>
                  {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(chg * 100).toFixed(2)}%
                </div>
              </div>
              <div className="relative">
                {visible ? (
                  <>
                    <p className="text-lg font-bold text-[var(--ink)] tabular-nums leading-tight">
                      G {rate.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-[var(--ink-60)]">1 {from} en HTG</p>
                  </>
                ) : (
                  <p className="text-lg font-bold text-[var(--ink)]">G •••••</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── Receive Modal ────────────────────────────────────────────────────────────
function ReceiveModal({ profile, onClose }: { profile: { full_name?: string; user_code?: string } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const userCode = (profile as any)?.user_code as string | undefined
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
        await navigator.share({
          title: 'FamillyBill HT',
          text: `Envoyez-moi de l'argent sur FamillyBill HT !\nMon ID: ${userCode}\nNom: ${name}`,
        })
        return
      } catch { /* fallback to copy */ }
    }
    copy()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl md:rounded-3xl overflow-hidden animate-fade-in-up"
        style={{ background: 'var(--card-bg)', boxShadow: '0 -4px 40px rgba(14,15,12,0.18)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Recevoir de l'argent</h2>
            <p className="text-xs text-[var(--ink-60)] mt-0.5">Partagez votre ID pour recevoir des paiements</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer tr" style={{ background: 'var(--surface-2)' }}>
            <X className="w-4 h-4 text-[var(--ink-60)]" />
          </button>
        </div>

        {/* ID card */}
        <div className="mx-5 mb-5 relative overflow-hidden rounded-2xl p-5" style={{ background: 'var(--ink)' }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10" style={{ background: 'var(--lime)' }} />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-5" style={{ background: 'var(--lime)' }} />
          <div className="relative z-10">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold mb-4 shrink-0"
              style={{ background: 'rgba(228,34,34,0.15)', color: 'var(--lime)', border: '1.5px solid rgba(228,34,34,0.3)' }}>
              <QrCode className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Mon ID FamillyBill
            </p>
            <p className="text-2xl font-black tracking-widest font-mono mb-1" style={{ color: 'var(--lime)' }}>
              {userCode ?? '—'}
            </p>
            <p className="text-sm font-medium text-white">{name}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 grid grid-cols-2 gap-3">
          <button
            onClick={copy}
            className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold border border-[var(--border)] tr cursor-pointer hover:bg-[var(--surface)]"
            style={{ color: 'var(--ink)' }}
          >
            {copied ? <Check className="w-4 h-4" style={{ color: 'var(--lime)' }} /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier l\'ID'}
          </button>
          <button
            onClick={share}
            className="btn-lime flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </button>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [transactions, setTx]   = useState<Transaction[]>([])
  const [loading, setLoading]   = useState(true)
  const [visible, setVisible]   = useState(true)
  const [showReceive, setShowReceive] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const [a, t] = await Promise.all([
      supabase.from('currency_accounts').select('*').eq('user_id', user.id).order('is_main', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ])
    if (a.data) setAccounts(a.data)
    if (t.data) setTx(t.data)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const totalUSD = accounts.reduce((s, a) => s + a.balance * getRate(a.currency, 'USD'), 0)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'là'

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--surface)' }}>
      {showReceive && <ReceiveModal profile={profile} onClose={() => setShowReceive(false)} />}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        {/* Greeting row */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <p className="text-sm text-[var(--ink-60)]">{greeting()},</p>
            <h1 className="text-xl font-semibold text-[var(--ink)] mt-0.5">{firstName}</h1>
          </div>
          <button
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? 'Masquer' : 'Afficher'}
            className="w-9 h-9 flex items-center justify-center rounded-full tr cursor-pointer border border-[var(--border)]"
            style={{ background: 'var(--card-bg)' }}
          >
            {visible
              ? <Eye className="w-4 h-4 text-[var(--ink-60)]" />
              : <EyeOff className="w-4 h-4 text-[var(--ink-60)]" />}
          </button>
        </div>

        {/* Balance card */}
        <div className="relative overflow-hidden animate-fade-in-up stagger-1 rounded-3xl p-6"
          style={{ background: 'var(--ink)', boxShadow: '0 8px 40px rgba(14,15,12,0.22), 0 2px 8px rgba(14,15,12,0.14)' }}>
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full opacity-10" style={{ background: 'var(--lime)' }} />
          <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full opacity-5" style={{ background: 'var(--lime)' }} />
          <div className="absolute top-1/2 right-12 w-28 h-28 rounded-full opacity-5" style={{ background: 'var(--lime)' }} />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--lime)' }}>
              Solde total
            </p>
            {loading ? (
              <Skeleton className="h-10 w-48 mb-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }} />
            ) : (
              <p className="text-4xl font-bold text-white tabular-nums leading-none mb-1">
                {visible
                  ? `$ ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '$ ••• •••'}
              </p>
            )}
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {accounts.length} devise{accounts.length !== 1 ? 's' : ''} · en USD
            </p>

            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: ArrowUpRight,  label: 'Envoyer',   action: () => navigate('/transfer'),              lime: true  },
                { icon: ArrowDownLeft, label: 'Recevoir',  action: () => setShowReceive(true),               lime: false },
                { icon: Repeat,        label: 'Convertir', action: () => navigate('/transfer?mode=convert'), lime: false },
                { icon: Plus,          label: 'Ajouter',   action: () => navigate('/wallet'),                lime: false },
              ].map(({ icon: Icon, label, action, lime }) => (
                <button key={label} onClick={action} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div
                    className="rounded-2xl flex items-center justify-center tr group-hover:opacity-85"
                    style={{ width: 52, height: 52, background: lime ? 'var(--lime)' : 'rgba(255,255,255,0.12)' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: lime ? 'var(--ink)' : 'white' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bill payment quick access */}
        <section className="animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Payer une facture</h2>
            <Link to="/bills" className="text-xs font-medium tr hover:opacity-70" style={{ color: 'var(--ink-60)' }}>
              Tout voir →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BILL_CATEGORIES.slice(0, 8).map(cat => (
              <Link key={cat.id} to={`/bills?category=${cat.id}`}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl tr cursor-pointer group card-flat card-hover">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-xl tr group-hover:scale-110 bg-white">
                    {cat.icon
                      ? <img src={cat.icon} alt={cat.label} className="w-full h-full object-contain" />
                      : <span style={{ color: cat.color }}>{cat.emoji}</span>}
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--ink)] text-center leading-tight">{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Real-time exchange rates (replacing Vos devises) */}
        <RateTicker visible={visible} />

        {/* Recent transactions */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Activité récente</h2>
            <Link to="/history" className="text-xs font-medium text-[var(--ink-60)] hover:opacity-70 tr">
              Tout voir →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="card-flat p-8 text-center">
              <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--lime-light)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--ink)' }} />
              </div>
              <p className="text-sm font-medium text-[var(--ink)]">Aucune transaction</p>
              <p className="text-xs text-[var(--ink-60)] mt-1 mb-4">Envoyez ou ajoutez des fonds pour commencer.</p>
              <Link to="/transfer">
                <button className="btn-lime px-4 py-2 rounded-xl text-sm cursor-pointer">Envoyer</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {transactions.map(tx => {
                const isSend    = tx.type === 'send' || tx.type === 'withdraw'
                const isReceive = tx.type === 'receive' || tx.type === 'deposit'
                const curr      = getCurrency(tx.currency)
                return (
                  <div key={tx.id} className="card-flat flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isSend ? "bg-red-50" : isReceive ? "bg-[var(--lime-light)]" : "bg-[var(--surface-2)]"
                    )}>
                      {isSend
                        ? <ArrowUpRight className="w-5 h-5 text-red-500" />
                        : isReceive
                          ? <ArrowDownLeft className="w-5 h-5" style={{ color: 'var(--ink)' }} />
                          : <Repeat className="w-5 h-5 text-[var(--ink-60)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)] truncate">
                        {tx.type === 'convert'
                          ? `${tx.currency} → ${tx.target_currency}`
                          : (tx.recipient_name ?? (TX_LABEL[tx.type] ?? 'Transfert'))}
                      </p>
                      <p className="text-xs text-[var(--ink-60)]">
                        {TX_LABEL[tx.type]} · {TX_STATUS[tx.status] ?? tx.status}
                      </p>
                    </div>
                    <p className={cn("text-sm font-semibold tabular-nums shrink-0",
                      isSend ? "text-red-500" : isReceive ? "" : "text-[var(--ink-60)]"
                    )}
                      style={isReceive ? { color: 'var(--ink)' } : {}}>
                      {isSend ? '−' : isReceive ? '+' : ''}{curr?.symbol}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
