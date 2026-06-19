import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye, EyeOff, Lock, Fingerprint, Key,
  ArrowUpRight, ArrowDownLeft, Repeat, Plus,
  ChevronRight, Download, Shield, ChevronLeft, ChevronRight as CRight, Check,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount } from '@/lib/supabase'
import { formatCurrency, getCurrency, getRate } from '@/lib/currencies'
import { CurrencyIcon } from '@/components/currency-icon'
import { cn } from '@/lib/utils'

const PIN_KEY    = 'fb-wallet-pin'
const LOCKED_KEY = 'fb-wallet-locked'

// ── PIN pad ───────────────────────────────────────────────────────────────────
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
          <Key className="w-8 h-8" style={{ color: 'var(--ink)' }} />
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

      {error && (
        <p className="text-sm text-red-500 -mt-4">{error}</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) =>
          k === '' ? <div key={i} /> : (
            <button
              key={i}
              onClick={() => k === '⌫' ? del() : press(k)}
              className="w-[72px] h-[72px] rounded-2xl font-semibold text-xl flex items-center justify-center tr cursor-pointer border border-[var(--border)] hover:bg-[var(--surface-2)]"
              style={{ background: 'var(--card-bg)', color: 'var(--ink)' }}
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

// ── Currency card (dark, like screenshot) ─────────────────────────────────────
function CurrencyCard({
  account,
  visible,
  isPrimary,
}: {
  account: CurrencyAccount
  visible: boolean
  isPrimary: boolean
}) {
  const curr = getCurrency(account.currency)

  return (
    <div
      className="relative rounded-3xl p-6 overflow-hidden shrink-0 w-full"
      style={{ background: 'var(--ink)' }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10" style={{ background: 'var(--lime)' }} />
      <div className="absolute -bottom-14 -left-6 w-48 h-48 rounded-full opacity-5" style={{ background: 'var(--lime)' }} />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
              <CurrencyIcon code={account.currency} className="w-10 h-10" />
            </div>
            <span className="text-white/70 text-sm font-medium">{curr?.name}</span>
          </div>
          {isPrimary && (
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
              Principal
            </span>
          )}
        </div>

        {/* Balance */}
        <p className="text-4xl font-bold text-white tabular-nums mb-5 leading-none">
          {visible
            ? `${curr?.code} ${account.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `${curr?.code} ••• •••`}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 h-11 rounded-2xl font-semibold text-sm cursor-pointer tr hover:opacity-90"
            style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
            Ajouter des fonds
          </button>
          <Link to="/transfer" className="flex-1">
            <button className="w-full h-11 rounded-2xl font-semibold text-sm border border-white/30 text-white hover:bg-white/10 tr cursor-pointer">
              Envoyer
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Main wallet view ──────────────────────────────────────────────────────────
function WalletMain({
  accounts,
  loading,
  onLock,
  onChangePIN,
}: {
  accounts: CurrencyAccount[]
  loading: boolean
  onLock: () => void
  onChangePIN: () => void
}) {
  const [visible, setVisible]   = useState(true)
  const [cardIdx, setCardIdx]   = useState(0)
  const [addingCurrency, setAddingCurrency] = useState('')
  const { user } = useAuth()

  // Sort: USD first (primary), then main accounts, then rest
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

  async function addAccount() {
    if (!user || !addingCurrency) return
    const { data } = await supabase.from('currency_accounts').insert({
      user_id: user.id,
      currency: addingCurrency,
      balance: 0,
      is_main: false,
    }).select().single()
    if (data) {
      accounts.push(data)
      setAddingCurrency('')
    }
  }

  const QUICK_ACTIONS = [
    { icon: ArrowUpRight, label: 'Payer',     href: '/bills',              lime: true  },
    { icon: ArrowUpRight, label: 'Envoyer',   href: '/transfer',           lime: false },
    { icon: ArrowDownLeft,label: 'Recevoir',  href: '/wallet',             lime: false },
    { icon: Repeat,       label: 'Convertir', href: '/transfer?mode=convert', lime: false },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Mon Portefeuille</h1>
          <p className="text-sm text-[var(--ink-60)]">Total: {visible
            ? `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '$••• •••'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisible(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] tr cursor-pointer"
            style={{ background: 'var(--card-bg)' }}
          >
            {visible
              ? <Eye className="w-4 h-4 text-[var(--ink-60)]" />
              : <EyeOff className="w-4 h-4 text-[var(--ink-60)]" />}
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

      {/* Currency card */}
      {loading ? (
        <Skeleton className="h-52 rounded-3xl" />
      ) : sorted.length > 0 && activeAcc ? (
        <div>
          <CurrencyCard
            account={activeAcc}
            visible={visible}
            isPrimary={activeAcc.currency === 'USD' || activeAcc.is_main}
          />
          {/* Dots */}
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
      ) : null}

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map(({ icon: Icon, label, href, lime }) => (
          <Link key={label} to={href}>
            <div className="flex flex-col items-center gap-2 cursor-pointer group">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center tr"
                style={lime ? { background: 'var(--lime)' } : { background: 'var(--surface-2)' }}
              >
                <Icon className="w-5 h-5" style={{ color: lime ? 'var(--ink)' : 'var(--ink-60)' }} />
              </div>
              <span className="text-xs font-medium text-[var(--ink-60)]">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* All currencies */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--ink)]">Mes devises</h2>
        </div>
        <div className="card-flat overflow-hidden divide-y divide-[var(--border)]">
          {loading
            ? [1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-none" />)
            : sorted.map((acc, i) => {
                const curr = getCurrency(acc.currency)
                const usdVal = acc.balance * getRate(acc.currency, 'USD')
                const isActive = i === cardIdx
                return (
                  <button
                    key={acc.id}
                    onClick={() => setCardIdx(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 tr cursor-pointer text-left",
                      isActive ? "bg-[var(--surface)]" : "hover:bg-[var(--surface)]"
                    )}
                  >
                    <CurrencyIcon code={acc.currency} className="w-9 h-9 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {acc.currency}
                        {(acc.currency === 'USD' || acc.is_main) && (
                          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
                            Principal
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--ink-60)]">{curr?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[var(--ink)] tabular-nums">
                        {visible ? formatCurrency(acc.balance, acc.currency) : `${curr?.symbol} ••••`}
                      </p>
                      <p className="text-xs text-[var(--ink-60)] tabular-nums">
                        {visible ? `≈ $${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '≈ $••••'}
                      </p>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--lime)' }} />}
                  </button>
                )
              })}

          {/* Add currency row */}
          <div className="px-4 py-3 flex gap-2 items-center">
            <select
              value={addingCurrency}
              onChange={e => setAddingCurrency(e.target.value)}
              className="flex-1 text-sm rounded-xl border border-[var(--border)] px-3 py-2 bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer focus:outline-none"
            >
              <option value="">+ Ajouter une devise...</option>
              {['USD','EUR','HTG','GBP','CAD','AUD','CHF']
                .filter(c => !accounts.find(a => a.currency === c))
                .map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={addAccount}
              disabled={!addingCurrency}
              className="h-9 px-4 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40"
              style={{ background: 'var(--lime)', color: 'var(--ink)' }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Wallet controls */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)] px-1 mb-2">Paramètres du portefeuille</p>
        <div className="card-flat overflow-hidden divide-y divide-[var(--border)]">
          {[
            { icon: Lock,         label: 'Verrouiller le portefeuille', desc: 'Protéger avec votre PIN',              action: onLock,       color: undefined },
            { icon: Key,          label: 'Changer le PIN',              desc: 'Modifier votre code secret',           action: onChangePIN,  color: undefined },
            { icon: Fingerprint,  label: 'Authentification biométrique', desc: 'Face ID / Empreinte digitale',        action: () => {},     color: undefined },
            { icon: Shield,       label: 'Sécurité du compte',          desc: 'Double vérification activée',         action: () => {},     color: undefined },
            { icon: Download,     label: 'Exporter l\'historique',      desc: 'Relevé PDF de vos transactions',      action: () => {},     color: undefined },
          ].map(({ icon: Icon, label, desc, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--surface-2)]">
                <Icon className="w-4 h-4 text-[var(--ink-60)]" />
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

// ── Locked view ───────────────────────────────────────────────────────────────
function WalletLocked({ onUnlock }: { onUnlock: () => void }) {
  const [error, setError] = useState('')

  function handlePin(pin: string) {
    const stored = localStorage.getItem(PIN_KEY)
    if (pin === stored) {
      localStorage.setItem(LOCKED_KEY, 'false')
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
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center border-2" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            <Lock className="w-8 h-8 text-[var(--ink-60)]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">Portefeuille verrouillé</p>
        </div>
        <PinPad
          title="Entrez votre PIN"
          subtitle="Déverrouillez votre portefeuille"
          error={error}
          onComplete={handlePin}
        />
      </div>
    </div>
  )
}

// ── Setup / first-time view ───────────────────────────────────────────────────
type SetupView = 'intro' | 'set-pin' | 'confirm-pin' | 'done'

function WalletSetup({ onCreated }: { onCreated: () => void }) {
  const [view, setView] = useState<SetupView>('intro')
  const [pendingPin, setPendingPin] = useState('')
  const [error, setError] = useState('')

  function handleSetPin(pin: string) {
    setPendingPin(pin)
    setView('confirm-pin')
    setError('')
  }

  function handleConfirmPin(pin: string) {
    if (pin === pendingPin) {
      localStorage.setItem(PIN_KEY, pin)
      localStorage.setItem(LOCKED_KEY, 'false')
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
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: 'var(--lime)' }}>
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--ink)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M16 12h5m0 0-2-2m2 2-2 2" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">Votre portefeuille</h1>
        <p className="text-sm text-[var(--ink-60)] max-w-xs">
          Créez votre portefeuille sécurisé pour payer, envoyer et recevoir des fonds en multi-devises.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3 text-left">
        {[
          { emoji: '🔐', text: 'Protégé par un code PIN' },
          { emoji: '💳', text: 'Multi-devises (USD, HTG, EUR...)' },
          { emoji: '⚡', text: 'Paiements instantanés' },
          { emoji: '🌍', text: 'Envois internationaux' },
        ].map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-3 text-sm text-[var(--ink)]">
            <span className="text-lg">{emoji}</span>
            {text}
          </div>
        ))}
      </div>
      <button
        onClick={() => setView('set-pin')}
        className="btn-lime w-full max-w-xs h-12 rounded-xl font-semibold text-sm cursor-pointer"
      >
        Créer mon portefeuille
      </button>
    </div>
  )

  if (view === 'done') return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-4 animate-scale-in">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'var(--lime)' }}>
        <Check className="w-10 h-10" style={{ color: 'var(--ink)' }} />
      </div>
      <h2 className="text-xl font-semibold text-[var(--ink)]">Portefeuille créé !</h2>
      <p className="text-sm text-[var(--ink-60)]">Votre portefeuille est prêt à utiliser.</p>
    </div>
  )

  return (
    <div className="max-w-xs mx-auto">
      {view === 'set-pin' ? (
        <PinPad
          title="Choisissez un PIN"
          subtitle="Code à 4 chiffres pour sécuriser votre portefeuille"
          error={error}
          onComplete={handleSetPin}
          onCancel={() => setView('intro')}
        />
      ) : (
        <PinPad
          title="Confirmez le PIN"
          subtitle="Ressaisissez votre code pour confirmer"
          error={error}
          onComplete={handleConfirmPin}
          onCancel={() => { setView('set-pin'); setError('') }}
        />
      )}
    </div>
  )
}

// ── Change PIN view ───────────────────────────────────────────────────────────
function ChangePIN({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')

  function handleCurrent(pin: string) {
    if (pin === localStorage.getItem(PIN_KEY)) {
      setError(''); setStep('new')
    } else {
      setError('PIN incorrect.')
    }
  }
  function handleNew(pin: string) { setNewPin(pin); setStep('confirm'); setError('') }
  function handleConfirm(pin: string) {
    if (pin === newPin) {
      localStorage.setItem(PIN_KEY, pin)
      onDone()
    } else {
      setError('Les codes ne correspondent pas.')
      setNewPin(''); setStep('new')
    }
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

// ── Page root ─────────────────────────────────────────────────────────────────
type PageView = 'loading' | 'setup' | 'locked' | 'main' | 'change-pin'

export function WalletPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [loadingAcc, setLoadingAcc] = useState(true)
  const [view, setView] = useState<PageView>('loading')

  useEffect(() => {
    const pin    = localStorage.getItem(PIN_KEY)
    const locked = localStorage.getItem(LOCKED_KEY) === 'true'
    if (!pin)   setView('setup')
    else if (locked) setView('locked')
    else        setView('main')
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('currency_accounts').select('*')
      .eq('user_id', user.id)
      .order('is_main', { ascending: false })
      .then(({ data }) => {
        if (data) setAccounts(data)
        setLoadingAcc(false)
      })
  }, [user])

  function handleLock() {
    localStorage.setItem(LOCKED_KEY, 'true')
    setView('locked')
  }

  if (view === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
      <div className="w-10 h-10 rounded-2xl animate-pulse-lime" style={{ background: 'var(--lime)' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-20 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6">
        {view === 'setup'      && <WalletSetup   onCreated={() => setView('main')} />}
        {view === 'locked'     && <WalletLocked  onUnlock={() => setView('main')} />}
        {view === 'change-pin' && <ChangePIN      onDone={() => setView('main')} />}
        {view === 'main'       && (
          <WalletMain
            accounts={accounts}
            loading={loadingAcc}
            onLock={handleLock}
            onChangePIN={() => setView('change-pin')}
          />
        )}
      </div>
    </div>
  )
}
