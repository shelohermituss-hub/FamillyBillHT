import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight, ArrowDownLeft, Repeat, Plus, Eye, EyeOff,
  TrendingUp, X, Share2, Copy, Check, QrCode,
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

const FLAG_ICONS: Record<string, string> = {
  HTG: '/icons/currencies/htg.png',
  USD: '/icons/currencies/usd.png',
  EUR: '/icons/currencies/eur-new.png',
  BRL: '/icons/currencies/brl.jpg',
  CAD: '/icons/currencies/cad.png',
}

const ACCOUNT_CARD_STYLES: Record<string, { gradient: string; glowColor: string }> = {
  HTG: { gradient: 'linear-gradient(135deg, #0a1428 0%, #0d2260 50%, #1A56DB 100%)', glowColor: '#1A56DB' },
  USD: { gradient: 'linear-gradient(135deg, #021a12 0%, #04422e 50%, #047857 100%)', glowColor: '#10b981' },
  EUR: { gradient: 'linear-gradient(135deg, #0e0c2a 0%, #1c1862 50%, #4338ca 100%)', glowColor: '#818cf8' },
  CAD: { gradient: 'linear-gradient(135deg, #1e0404 0%, #5a0e0e 50%, #991b1b 100%)', glowColor: '#f87171' },
  BRL: { gradient: 'linear-gradient(135deg, #1c0a00 0%, #5c2d06 50%, #92400e 100%)', glowColor: '#fbbf24' },
}
const DEFAULT_CARD_STYLE = { gradient: 'linear-gradient(135deg, #0a1428 0%, #151a3a 50%, #2d3460 100%)', glowColor: '#60a5fa' }

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
              style={{ background: 'rgba(26,86,219,0.15)', color: 'var(--lime)', border: '1.5px solid rgba(26,86,219,0.3)' }}>
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

  const [activeCardIdx, setActiveCardIdx] = useState(0)
  const cardPtrStart = useRef(0)

  const sorted = [...accounts].sort((a, b) => {
    if (a.currency === 'HTG') return -1
    if (b.currency === 'HTG') return 1
    if (a.currency === 'USD') return -1
    if (b.currency === 'USD') return 1
    return b.balance - a.balance
  })

  const totalUSD = accounts.reduce((s, a) => s + a.balance * getRate(a.currency, 'USD'), 0)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'là'

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--surface)' }}>
      {showReceive && <ReceiveModal profile={profile} onClose={() => setShowReceive(false)} />}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        {/* Greeting row with prominent total balance */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <p className="font-medium" style={{ fontSize: 13, color: 'var(--ink-60)' }}>{greeting()},</p>
            <h1 className="font-extrabold text-[var(--ink)]" style={{ fontSize: 22, letterSpacing: '-0.03em', marginTop: 2 }}>{firstName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-medium text-[var(--ink-60)] mb-0.5">Solde total</p>
              {loading ? (
                <div className="h-7 w-28 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
              ) : (
                <p className="font-extrabold text-[var(--ink)] leading-none tabular-nums" style={{ fontSize: 24, letterSpacing: '-0.03em' }}>
                  {visible
                    ? `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '$•••'}
                </p>
              )}
            </div>
            <button
              onClick={() => setVisible(v => !v)}
              aria-label={visible ? 'Masquer' : 'Afficher'}
              className="w-9 h-9 flex items-center justify-center rounded-xl tr cursor-pointer shrink-0"
              style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}
            >
              {visible
                ? <Eye className="w-4 h-4 text-[var(--ink-60)]" />
                : <EyeOff className="w-4 h-4 text-[var(--ink-60)]" />}
            </button>
          </div>
        </div>

        {/* Account card stack */}
        <div className="space-y-3 animate-fade-in-up stagger-1">
          <div
            className="relative select-none overflow-hidden rounded-[2rem]"
            style={{ height: 195 }}
            onPointerDown={e => { cardPtrStart.current = e.clientX }}
            onPointerUp={e => {
              const d = e.clientX - cardPtrStart.current
              if (d < -40 && activeCardIdx < sorted.length - 1) setActiveCardIdx(i => i + 1)
              else if (d > 40 && activeCardIdx > 0) setActiveCardIdx(i => i - 1)
            }}
          >
            {loading ? (
              <div className="absolute inset-0 rounded-[2rem] animate-pulse" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} />
            ) : sorted.length === 0 ? (
              <div className="absolute inset-0 rounded-[2rem] flex items-center justify-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <p className="text-sm text-[var(--ink-60)]">Aucun compte devise</p>
              </div>
            ) : sorted.map((acc, i) => {
              const offset = i - activeCardIdx
              if (Math.abs(offset) > 2) return null
              const cs = ACCOUNT_CARD_STYLES[acc.currency] ?? DEFAULT_CARD_STYLE
              const scale = 1 - Math.abs(offset) * 0.04
              const ty = Math.abs(offset) * 10
              const tx = offset * 6
              const opacity = 1 - Math.abs(offset) * 0.22
              const curr = getCurrency(acc.currency)
              return (
                <div
                  key={acc.id}
                  className="absolute inset-0 rounded-[2rem] overflow-hidden cursor-pointer"
                  style={{
                    background: cs.gradient,
                    transform: `translateX(${tx}%) translateY(${ty}px) scale(${scale})`,
                    zIndex: sorted.length - Math.abs(offset),
                    opacity,
                    boxShadow: offset === 0
                      ? `0 4px 20px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.07)`
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 320ms cubic-bezier(0.32,0.72,0,1)',
                  }}
                  onClick={() => { if (offset !== 0) setActiveCardIdx(i) }}
                >
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 55%)' }} />
                  {offset === 0 && (
                    <div className="relative h-full p-5 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold tracking-[0.18em] uppercase" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>{acc.currency}</p>
                          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>{curr?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={FLAG_ICONS[acc.currency] ?? ''}
                            alt={acc.currency}
                            className="w-7 h-7 rounded-full object-cover"
                            style={{ border: '1.5px solid rgba(255,255,255,0.2)' }}
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                          <button
                            onClick={ev => { ev.stopPropagation(); setVisible(v => !v) }}
                            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                          >
                            {visible ? <Eye className="w-3.5 h-3.5 text-white/70" /> : <EyeOff className="w-3.5 h-3.5 text-white/70" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 500, marginBottom: 4 }}>Solde disponible</p>
                        <p className="font-bold text-white" style={{ fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1 }}>
                          {visible
                            ? `${curr?.symbol} ${acc.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${curr?.symbol} ••••••`}
                        </p>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="font-mono" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.12em' }}>
                          •••• •••• •••• {acc.id.slice(-4).toUpperCase()}
                        </p>
                        <div className="w-6 h-6 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                          <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Dots */}
          {!loading && sorted.length > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {sorted.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCardIdx(i)}
                  className="h-1 rounded-full tr cursor-pointer"
                  style={{
                    width: i === activeCardIdx ? 20 : 5,
                    background: i === activeCardIdx ? 'var(--ink)' : 'rgba(14,15,12,0.18)',
                    transition: 'all 250ms ease',
                  }}
                />
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { icon: ArrowUpRight,  label: 'Envoyer',   action: () => navigate('/transfer'),              lime: true  },
              { icon: ArrowDownLeft, label: 'Recevoir',  action: () => setShowReceive(true),               lime: false },
              { icon: Repeat,        label: 'Convertir', action: () => navigate('/transfer?mode=convert'), lime: false },
              { icon: Plus,          label: 'Ajouter',   action: () => navigate('/wallet'),                lime: false },
            ].map(({ icon: Icon, label, action, lime }) => (
              <button key={label} onClick={action} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div
                  className="rounded-2xl flex items-center justify-center tr"
                  style={{
                    width: 56, height: 56,
                    background: lime ? 'var(--lime)' : 'var(--card-bg)',
                    boxShadow: lime
                      ? '0 6px 20px rgba(26,86,219,0.35), 0 2px 6px rgba(26,86,219,0.2)'
                      : '0 2px 8px rgba(13,27,75,0.08), 0 1px 3px rgba(13,27,75,0.05)',
                    border: lime ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <Icon
                    className="tr group-hover:scale-110"
                    style={{ width: 20, height: 20, color: lime ? '#ffffff' : 'var(--ink-60)' }}
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-60)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bill payment quick access */}
        <section className="animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Payer une facture</h2>
            <Link to="/bills" className="tr hover:opacity-70" style={{ fontSize: 12, fontWeight: 700, color: 'var(--lime)' }}>
              Tout voir →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {BILL_CATEGORIES.slice(0, 8).map(cat => (
              <Link key={cat.id} to={`/bills?category=${cat.id}`}>
                <div
                  className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl tr cursor-pointer group"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1.5px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(13,27,75,0.06)',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center tr group-hover:scale-105"
                    style={{ background: cat.bg ?? 'var(--lime-light)' }}
                  >
                    {cat.icon
                      ? <img src={cat.icon} alt={cat.label} className="w-full h-full object-contain" />
                      : <span style={{ fontSize: 22 }}>{cat.emoji}</span>}
                  </div>
                  <span className="text-center leading-tight" style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)' }}>{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent transactions */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Activité récente</h2>
            <Link to="/history" className="tr hover:opacity-70" style={{ fontSize: 12, fontWeight: 700, color: 'var(--lime)' }}>
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
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 tr cursor-pointer rounded-2xl hover:bg-[var(--surface-2)]"
                    style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', boxShadow: '0 1px 4px rgba(13,27,75,0.04)' }}>
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
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
