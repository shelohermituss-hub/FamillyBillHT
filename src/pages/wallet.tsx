import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Lock, Fingerprint, Key,
  ArrowUpRight, ArrowDownLeft, Repeat, Plus,
  ChevronRight, Download, Shield, ChevronLeft, ChevronRight as CRight, Check,
  Copy, QrCode, X, Loader2,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount } from '@/lib/supabase'
import { formatCurrency, getCurrency, getRate, CURRENCIES } from '@/lib/currencies'
import { CurrencyIcon } from '@/components/currency-icon'
import { cn } from '@/lib/utils'

const pinKey    = (uid: string) => `fb-wallet-pin-${uid}`
const lockedKey = (uid: string) => `fb-wallet-locked-${uid}`

function getStoredPin(uid: string): string | null {
  const v = localStorage.getItem(pinKey(uid))
  if (v) return v
  // Migrate from old global key (one-time)
  const old = localStorage.getItem('fb-wallet-pin')
  if (old) {
    localStorage.setItem(pinKey(uid), old)
    localStorage.removeItem('fb-wallet-pin')
    return old
  }
  return null
}

// ── Deposit Modal ──────────────────────────────────────────────────────────────
function DepositModal({
  accounts,
  defaultCurrency,
  onClose,
  onSuccess,
}: {
  accounts: CurrencyAccount[]
  defaultCurrency: string
  onClose: () => void
  onSuccess: (currency: string, amount: number) => void
}) {
  const { user } = useAuth()
  const [currency, setCurrency] = useState(defaultCurrency)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function confirm() {
    if (!user || !parseFloat(amount)) return
    setLoading(true)
    const numAmount = parseFloat(amount)
    const acc = accounts.find(a => a.currency === currency)

    if (acc) {
      await supabase.from('currency_accounts')
        .update({ balance: acc.balance + numAmount })
        .eq('id', acc.id)
    } else {
      await supabase.from('currency_accounts').insert({
        user_id: user.id, currency, balance: numAmount, is_main: false,
      })
    }

    await supabase.from('transactions').insert({
      user_id: user.id, type: 'deposit', status: 'completed',
      amount: numAmount, currency, fee: 0,
      reference: `DEP-${Date.now()}`,
    })

    setLoading(false)
    setDone(true)
    setTimeout(() => { onSuccess(currency, numAmount); onClose() }, 1200)
  }

  const curr = getCurrency(currency)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 space-y-5 animate-fade-in-up"
        style={{ background: 'var(--card-bg)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Ajouter des fonds</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface)] tr cursor-pointer">
            <X className="w-4 h-4 text-[var(--ink-60)]" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'var(--lime)' }}>
              <Check className="w-8 h-8" style={{ color: '#ffffff' }} />
            </div>
            <p className="font-semibold text-[var(--ink)]">Fonds ajoutés !</p>
            <p className="text-sm text-[var(--ink-60)]">{formatCurrency(parseFloat(amount), currency)} crédité sur votre compte</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">Devise</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer focus:outline-none focus:border-[var(--ink-30)]"
              >
                {CURRENCIES.slice(0, 10).map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">Montant</label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[var(--border)] focus-within:border-[var(--ink-30)] tr">
                <span className="text-lg font-semibold text-[var(--ink-60)]">{curr?.symbol}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className="flex-1 text-2xl font-bold bg-transparent text-[var(--ink)] outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {[50, 100, 250, 500].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(v.toString())}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold border tr cursor-pointer",
                    amount === v.toString()
                      ? "text-white"
                      : "border-[var(--border)] text-[var(--ink-60)] hover:bg-[var(--surface)]"
                  )}
                  style={amount === v.toString() ? { background: 'var(--lime)', borderColor: 'var(--lime)' } : {}}
                >
                  {curr?.symbol}{v}
                </button>
              ))}
            </div>

            <button
              onClick={confirm}
              disabled={loading || !parseFloat(amount)}
              className="btn-lime w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirmer l'ajout
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Receive Modal ──────────────────────────────────────────────────────────────
function ReceiveModal({
  account,
  onClose,
}: {
  account: CurrencyAccount
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const curr = getCurrency(account.currency)

  const accountInfo = account.account_number ?? account.iban ?? `FB-${account.id.slice(0, 8).toUpperCase()}`

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 space-y-5 animate-fade-in-up"
        style={{ background: 'var(--card-bg)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Recevoir {account.currency}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface)] tr cursor-pointer">
            <X className="w-4 h-4 text-[var(--ink-60)]" />
          </button>
        </div>

        {/* QR code placeholder */}
        <div className="flex justify-center">
          <div className="w-44 h-44 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)]"
            style={{ background: 'var(--surface)' }}>
            <QrCode className="w-16 h-16 text-[var(--ink-30)]" />
            <p className="text-[10px] text-[var(--ink-60)] mt-2 font-medium">{curr?.flag} {account.currency}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)] mb-1.5">N° de compte</p>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-semibold text-[var(--ink)] break-all">{accountInfo}</p>
              <button
                onClick={() => copy(accountInfo)}
                className="shrink-0 p-2 rounded-lg hover:bg-[var(--surface-2)] tr cursor-pointer"
              >
                {copied
                  ? <Check className="w-4 h-4" style={{ color: 'var(--lime)' }} />
                  : <Copy className="w-4 h-4 text-[var(--ink-60)]" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--lime-light)', color: 'var(--ink)' }}>
            <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--lime)' }} />
            <span className="font-medium">Réception gratuite en {account.currency}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 rounded-xl font-semibold text-sm border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface)] tr cursor-pointer"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

// ── PIN pad ────────────────────────────────────────────────────────────────────
function PinPad({
  title,
  subtitle,
  error = '',
  onComplete,
  onCancel,
}: {
  title: string
  subtitle: string
  error?: string
  onComplete: (pin: string) => void
  onCancel?: () => void
}) {
  const [pin, setPin] = useState('')

  function press(d: string) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) { onComplete(next); setPin('') }
  }
  function del() { setPin(p => p.slice(0, -1)) }

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-fade-in-up">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--lime)' }}>
          <Key className="w-8 h-8" style={{ color: '#ffffff' }} />
        </div>
        <h2 className="text-xl font-semibold text-[var(--ink)]">{title}</h2>
        <p className="text-sm text-[var(--ink-60)] mt-1">{subtitle}</p>
      </div>

      <div className="flex gap-5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border-2 tr"
            style={{
              borderColor: i < pin.length ? 'var(--ink)' : 'var(--border)',
              background: i < pin.length ? 'var(--ink)' : 'transparent',
            }}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-500 -mt-4">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) =>
          k === '' ? <div key={i} /> : (
            <button
              key={i}
              onClick={() => k === '⌫' ? del() : press(k)}
              className="w-[72px] h-[72px] rounded-2xl font-semibold text-xl flex items-center justify-center tr cursor-pointer hover:bg-[var(--surface-2)]"
              style={{ background: 'var(--card-bg)', color: 'var(--ink)', boxShadow: '0 1px 3px rgba(14,15,12,0.08)' }}
            >
              {k}
            </button>
          )
        )}
      </div>

      {onCancel && (
        <button onClick={onCancel} className="text-sm text-[var(--ink-60)] hover:text-[var(--ink)] tr cursor-pointer">
          Annuler
        </button>
      )}
    </div>
  )
}

const WALLET_CARD_STYLES: Record<string, { gradient: string; glowColor: string }> = {
  HTG: { gradient: 'linear-gradient(135deg, #0a1428 0%, #0d2260 50%, #1A56DB 100%)', glowColor: '#1A56DB' },
  USD: { gradient: 'linear-gradient(135deg, #021a12 0%, #04422e 50%, #047857 100%)', glowColor: '#10b981' },
  EUR: { gradient: 'linear-gradient(135deg, #0e0c2a 0%, #1c1862 50%, #4338ca 100%)', glowColor: '#818cf8' },
  CAD: { gradient: 'linear-gradient(135deg, #1e0404 0%, #5a0e0e 50%, #991b1b 100%)', glowColor: '#f87171' },
  BRL: { gradient: 'linear-gradient(135deg, #1c0a00 0%, #5c2d06 50%, #92400e 100%)', glowColor: '#fbbf24' },
}
const WALLET_DEFAULT_CARD_STYLE = { gradient: 'linear-gradient(135deg, #0a1428 0%, #151a3a 50%, #2d3460 100%)', glowColor: '#60a5fa' }
const WALLET_FLAG_ICONS: Record<string, string> = {
  HTG: '/icons/currencies/htg.png',
  USD: '/icons/currencies/usd.png',
  EUR: '/icons/currencies/eur-new.png',
  CAD: '/icons/currencies/cad.png',
  BRL: '/icons/currencies/brl.jpg',
}

// ── Currency card ──────────────────────────────────────────────────────────────
function CurrencyCard({
  account,
  visible,
  isPrimary,
  onDeposit,
  onReceive,
}: {
  account: CurrencyAccount
  visible: boolean
  isPrimary: boolean
  onDeposit: () => void
  onReceive: () => void
}) {
  const curr = getCurrency(account.currency)
  const cs = WALLET_CARD_STYLES[account.currency] ?? WALLET_DEFAULT_CARD_STYLE

  return (
    <div
      className="relative rounded-[2rem] overflow-hidden shrink-0 w-full select-none"
      style={{
        background: cs.gradient,
        boxShadow: `0 4px 20px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06)`,
        border: '1px solid rgba(255,255,255,0.08)',
        height: 200,
      }}
    >
      {/* Shimmer */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />

      <div className="relative h-full p-6 flex flex-col justify-between">
        {/* Top */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold tracking-[0.18em] uppercase" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>{account.currency}</p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>{curr?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPrimary && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)' }}>
                Principal
              </span>
            )}
            <img
              src={WALLET_FLAG_ICONS[account.currency] ?? ''}
              alt={account.currency}
              className="w-8 h-8 rounded-full object-cover"
              style={{ border: '1.5px solid rgba(255,255,255,0.2)' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </div>
        </div>

        {/* Balance */}
        <div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 500, marginBottom: 4 }}>Solde disponible</p>
          <p className="font-bold text-white" style={{ fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {visible
              ? `${curr?.symbol} ${account.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${curr?.symbol} ••••••`}
          </p>
        </div>

        {/* Bottom */}
        <div className="flex items-end justify-between">
          <p className="font-mono" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.12em' }}>
            •••• •••• •••• {account.id.slice(-4).toUpperCase()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onDeposit}
              className="px-3 h-8 rounded-xl text-xs font-semibold cursor-pointer tr"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              + Fonds
            </button>
            <button
              onClick={onReceive}
              className="px-3 h-8 rounded-xl text-xs font-semibold cursor-pointer tr"
              style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
            >
              Recevoir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main wallet view ───────────────────────────────────────────────────────────
function WalletMain({
  accounts,
  loading,
  onLock,
  onChangePIN,
  onAccountsUpdated,
}: {
  accounts: CurrencyAccount[]
  loading: boolean
  onLock: () => void
  onChangePIN: () => void
  onAccountsUpdated: () => void
}) {
  const navigate = useNavigate()
  const [visible, setVisible]   = useState(true)
  const [cardIdx, setCardIdx]   = useState(0)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showReceive, setShowReceive] = useState(false)

  const sorted = [...accounts].sort((a, b) => {
    if (a.currency === 'USD') return -1
    if (b.currency === 'USD') return 1
    if (a.is_main && !b.is_main) return -1
    if (!a.is_main && b.is_main) return 1
    return 0
  })

  const totalUSD = accounts.reduce(
    (s, a) => s + a.balance * getRate(a.currency, 'USD'), 0
  )

  const activeAcc = sorted[cardIdx]

  const QUICK_ACTIONS = [
    { icon: ArrowUpRight, label: 'Payer',     action: () => navigate('/bills'),              lime: true  },
    { icon: ArrowUpRight, label: 'Envoyer',   action: () => navigate('/transfer'),           lime: false },
    { icon: ArrowDownLeft,label: 'Recevoir',  action: () => setShowReceive(true),            lime: false },
    { icon: Repeat,       label: 'Convertir', action: () => navigate('/transfer?mode=convert'), lime: false },
  ]

  return (
    <div className="space-y-5">
      {showDeposit && activeAcc && (
        <DepositModal
          accounts={accounts}
          defaultCurrency={activeAcc.currency}
          onClose={() => setShowDeposit(false)}
          onSuccess={() => { setShowDeposit(false); onAccountsUpdated() }}
        />
      )}
      {showReceive && activeAcc && (
        <ReceiveModal
          account={activeAcc}
          onClose={() => setShowReceive(false)}
        />
      )}

      {/* Header with prominent total */}
      <div>
        <div className="text-center mb-4">
          <p className="text-[11px] font-medium text-[var(--ink-60)] mb-1">Total disponible</p>
          {loading ? (
            <div className="h-10 w-40 rounded-xl animate-pulse mx-auto" style={{ background: 'var(--border)' }} />
          ) : (
            <p className="text-4xl font-bold text-[var(--ink)] tabular-nums leading-none">
              {visible
                ? `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '$•••'}
            </p>
          )}
          <p className="text-xs text-[var(--ink-60)] mt-1.5">
            {accounts.length} devise{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            onClick={() => setVisible(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] tr cursor-pointer"
            style={{ background: 'var(--card-bg)' }}
          >
            {visible ? <Eye className="w-4 h-4 text-[var(--ink-60)]" /> : <EyeOff className="w-4 h-4 text-[var(--ink-60)]" />}
          </button>
          <button
            onClick={onLock}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] tr cursor-pointer"
            style={{ background: 'var(--card-bg)' }}
          >
            <Lock className="w-4 h-4 text-[var(--ink-60)]" />
          </button>
        </div>
      </div>

      {/* Currency card carousel */}
      {loading ? (
        <Skeleton className="h-56 rounded-3xl" />
      ) : sorted.length > 0 && activeAcc ? (
        <div>
          <CurrencyCard
            account={activeAcc}
            visible={visible}
            isPrimary={activeAcc.currency === 'USD' || activeAcc.is_main}
            onDeposit={() => setShowDeposit(true)}
            onReceive={() => setShowReceive(true)}
          />
          {sorted.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                onClick={() => setCardIdx(i => Math.max(0, i - 1))}
                disabled={cardIdx === 0}
                className="w-6 h-6 flex items-center justify-center rounded-full tr cursor-pointer disabled:opacity-30"
                style={{ color: 'var(--ink-60)' }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {sorted.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCardIdx(i)}
                  className="h-1.5 rounded-full tr cursor-pointer"
                  style={{
                    width: i === cardIdx ? 20 : 6,
                    background: i === cardIdx ? 'var(--ink)' : 'var(--border)',
                  }}
                />
              ))}
              <button
                onClick={() => setCardIdx(i => Math.min(sorted.length - 1, i + 1))}
                disabled={cardIdx === sorted.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded-full tr cursor-pointer disabled:opacity-30"
                style={{ color: 'var(--ink-60)' }}
              >
                <CRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card-flat p-8 text-center space-y-3">
          <p className="text-sm text-[var(--ink-60)]">Aucun compte devise configuré.</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="card-elevated p-4">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(({ icon: Icon, label, action, lime }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-2 cursor-pointer group">
              <div
                className="rounded-2xl flex items-center justify-center tr group-hover:opacity-85"
                style={{
                  width: 52, height: 52,
                  background: lime ? 'var(--lime)' : 'var(--surface-2)',
                }}
              >
                <Icon className="w-6 h-6" style={{ color: lime ? 'var(--ink)' : 'var(--ink-60)' }} />
              </div>
              <span className="text-xs font-medium text-[var(--ink-60)]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* All currencies */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--ink)]">Mes devises</h2>
          <button
            onClick={() => setShowDeposit(true)}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl tr cursor-pointer"
            style={{ background: 'var(--lime)', color: '#ffffff' }}
          >
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>
        <div className="card-flat overflow-hidden divide-y divide-[var(--border)]">
          {loading
            ? [1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-none" />)
            : sorted.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--ink-60)]">
                Aucun compte. Ajoutez une devise pour commencer.
              </div>
            )
            : sorted.map((acc, i) => {
                const curr = getCurrency(acc.currency)
                const usdVal = acc.balance * getRate(acc.currency, 'USD')
                const isActive = i === cardIdx
                return (
                  <button
                    key={acc.id}
                    onClick={() => setCardIdx(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-4 tr cursor-pointer text-left",
                      isActive ? "bg-[var(--lime-light)]" : "hover:bg-[var(--surface)]"
                    )}
                  >
                    <CurrencyIcon code={acc.currency} className="w-10 h-10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--ink)]">{acc.currency}</p>
                        {(acc.currency === 'USD' || acc.is_main) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--lime)', color: '#ffffff' }}>
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--ink-60)]">{curr?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[var(--ink)] tabular-nums">
                        {visible ? formatCurrency(acc.balance, acc.currency) : `${curr?.symbol} ••••`}
                      </p>
                      <p className="text-xs text-[var(--ink-60)] tabular-nums">
                        {visible ? `≈ $${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '≈ $••••'}
                      </p>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--lime)' }} />}
                  </button>
                )
              })
          }
        </div>
      </section>

      {/* Wallet controls */}
      <section className="pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)] px-1 mb-3">Paramètres du portefeuille</p>
        <div className="card-flat overflow-hidden divide-y divide-[var(--border)]">
          {[
            { icon: Lock,        label: 'Verrouiller le portefeuille', desc: 'Protéger avec votre PIN',          action: onLock,      danger: false },
            { icon: Key,         label: 'Changer le PIN',              desc: 'Modifier votre code secret',       action: onChangePIN, danger: false },
            { icon: Fingerprint, label: 'Biométrie',                   desc: 'Face ID / Empreinte digitale',     action: () => {},    danger: false },
            { icon: Shield,      label: 'Sécurité',                    desc: 'Double vérification activée',      action: () => {},    danger: false },
            { icon: Download,    label: 'Exporter l\'historique',      desc: 'Relevé PDF de vos transactions',   action: () => navigate('/history'), danger: false },
          ].map(({ icon: Icon, label, desc, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[var(--surface)] tr cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                <Icon className="w-5 h-5 text-[var(--ink-60)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
                <p className="text-xs text-[var(--ink-60)]">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--ink-30)] shrink-0" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Locked view ────────────────────────────────────────────────────────────────
function WalletLocked({ userId, onUnlock }: { userId: string; onUnlock: () => void }) {
  const [error, setError] = useState('')

  function handlePin(pin: string) {
    if (pin === localStorage.getItem(pinKey(userId))) {
      localStorage.setItem(lockedKey(userId), 'false')
      setError('')
      onUnlock()
    } else {
      setError('Code PIN incorrect. Réessayez.')
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-xs">
        <div className="text-center mb-2">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-2)', boxShadow: '0 4px 16px rgba(14,15,12,0.08)' }}>
            <Lock className="w-8 h-8 text-[var(--ink-60)]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">Portefeuille verrouillé</p>
        </div>
        <PinPad title="Entrez votre PIN" subtitle="Déverrouillez votre portefeuille" error={error} onComplete={handlePin} />
      </div>
    </div>
  )
}

// ── Setup ─────────────────────────────────────────────────────────────────────
type SetupView = 'intro' | 'set-pin' | 'confirm-pin' | 'done'

function WalletSetup({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [view, setView] = useState<SetupView>('intro')
  const [pendingPin, setPendingPin] = useState('')
  const [error, setError] = useState('')

  function handleSetPin(pin: string) { setPendingPin(pin); setView('confirm-pin'); setError('') }
  function handleConfirmPin(pin: string) {
    if (pin === pendingPin) {
      localStorage.setItem(pinKey(userId), pin)
      localStorage.setItem(lockedKey(userId), 'false')
      setView('done')
      setTimeout(onCreated, 1200)
    } else {
      setError('Les codes ne correspondent pas. Recommencez.')
      setPendingPin('')
      setView('set-pin')
    }
  }

  if (view === 'intro') return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-6 animate-fade-in-up">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: 'var(--lime)', boxShadow: '0 8px 32px rgba(26,86,219,0.4)' }}>
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#ffffff' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M16 12h5m0 0-2-2m2 2-2 2" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">Votre portefeuille</h1>
        <p className="text-sm text-[var(--ink-60)] max-w-xs">
          Créez votre portefeuille sécurisé pour payer, envoyer et recevoir des fonds en multi-devises.
        </p>
      </div>
      <div className="card-elevated w-full max-w-xs p-4 space-y-3 text-left">
        {[
          { icon: '🔐', text: 'Protégé par un code PIN à 4 chiffres' },
          { icon: '💳', text: 'Multi-devises (USD, HTG, EUR…)' },
          { icon: '⚡', text: 'Paiements de factures instantanés' },
          { icon: '🌍', text: 'Envois internationaux au meilleur taux' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-sm text-[var(--ink)]">
            <span className="text-xl w-7 shrink-0 text-center">{icon}</span>
            {text}
          </div>
        ))}
      </div>
      <button onClick={() => setView('set-pin')} className="btn-lime w-full max-w-xs h-12 rounded-xl font-semibold text-sm cursor-pointer">
        Créer mon portefeuille
      </button>
    </div>
  )

  if (view === 'done') return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-4 animate-scale-in">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'var(--lime)', boxShadow: '0 8px 32px rgba(26,86,219,0.4)' }}>
        <Check className="w-10 h-10" style={{ color: '#ffffff' }} />
      </div>
      <h2 className="text-xl font-semibold text-[var(--ink)]">Portefeuille créé !</h2>
      <p className="text-sm text-[var(--ink-60)]">Votre portefeuille est prêt à utiliser.</p>
    </div>
  )

  return (
    <div className="max-w-xs mx-auto">
      {view === 'set-pin'
        ? <PinPad title="Choisissez un PIN" subtitle="Code à 4 chiffres pour sécuriser votre portefeuille" error={error} onComplete={handleSetPin} onCancel={() => setView('intro')} />
        : <PinPad title="Confirmez le PIN" subtitle="Ressaisissez votre code pour confirmer" error={error} onComplete={handleConfirmPin} onCancel={() => { setView('set-pin'); setError('') }} />}
    </div>
  )
}

// ── Change PIN ─────────────────────────────────────────────────────────────────
function ChangePIN({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')

  function handleCurrent(pin: string) {
    if (pin === localStorage.getItem(pinKey(userId))) { setError(''); setStep('new') }
    else setError('PIN incorrect.')
  }
  function handleNew(pin: string) { setNewPin(pin); setStep('confirm'); setError('') }
  function handleConfirm(pin: string) {
    if (pin === newPin) { localStorage.setItem(pinKey(userId), pin); onDone() }
    else { setError('Les codes ne correspondent pas.'); setNewPin(''); setStep('new') }
  }

  return (
    <div className="max-w-xs mx-auto">
      <button onClick={onDone} className="flex items-center gap-2 text-sm text-[var(--ink-60)] mb-6 cursor-pointer hover:text-[var(--ink)] tr">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>
      {step === 'current' && <PinPad title="PIN actuel" subtitle="Entrez votre code PIN actuel" error={error} onComplete={handleCurrent} onCancel={onDone} />}
      {step === 'new'     && <PinPad title="Nouveau PIN" subtitle="Choisissez un nouveau code à 4 chiffres" error={error} onComplete={handleNew} onCancel={onDone} />}
      {step === 'confirm' && <PinPad title="Confirmer" subtitle="Ressaisissez le nouveau code" error={error} onComplete={handleConfirm} onCancel={onDone} />}
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────────────────────
type PageView = 'loading' | 'setup' | 'locked' | 'main' | 'change-pin'

export function WalletPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [loadingAcc, setLoadingAcc] = useState(true)
  const [view, setView] = useState<PageView>('loading')

  useEffect(() => {
    if (!user) return
    const pin    = getStoredPin(user.id)
    const locked = localStorage.getItem(lockedKey(user.id)) === 'true'
    if (!pin)        setView('setup')
    else if (locked) setView('locked')
    else             setView('main')
  }, [user])

  async function loadAccounts() {
    if (!user) return
    const { data } = await supabase.from('currency_accounts').select('*')
      .eq('user_id', user.id)
      .order('is_main', { ascending: false })
    if (data) setAccounts(data)
    setLoadingAcc(false)
  }

  useEffect(() => { loadAccounts() }, [user])

  function handleLock() {
    if (!user) return
    localStorage.setItem(lockedKey(user.id), 'true')
    setView('locked')
  }

  if (view === 'loading' || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="w-10 h-10 rounded-2xl animate-pulse-lime" style={{ background: 'var(--lime)' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6">
        {view === 'setup'      && <WalletSetup userId={user.id} onCreated={() => { setView('main'); loadAccounts() }} />}
        {view === 'locked'     && <WalletLocked userId={user.id} onUnlock={() => setView('main')} />}
        {view === 'change-pin' && <ChangePIN userId={user.id} onDone={() => setView('main')} />}
        {view === 'main' && (
          <WalletMain
            accounts={accounts}
            loading={loadingAcc}
            onLock={handleLock}
            onChangePIN={() => setView('change-pin')}
            onAccountsUpdated={loadAccounts}
          />
        )}
      </div>
    </div>
  )
}
