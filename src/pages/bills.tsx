import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ArrowRight, CheckCircle2, Loader2, ChevronRight, Info, Wallet, CreditCard, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { getRate, getFeeRate } from '@/lib/currencies'
import { insertNotification } from '@/lib/api'
import {
  BILL_CATEGORIES,
  PROVIDERS,
  getProvidersForCategory,
  type Provider,
  type BillCategory,
} from '@/lib/haiti-providers'

type Step = 'category' | 'provider' | 'details' | 'review' | 'payment-method' | 'success'
const STEPS: Step[] = ['category', 'provider', 'details', 'review', 'payment-method', 'success']

// ── Icon helpers ─────────────────────────────────────────────────────────────
function ProviderLogo({
  provider,
  size = 'md',
}: {
  provider: Provider
  size?: 'sm' | 'md' | 'lg'
}) {
  const cls = size === 'lg' ? 'w-16 h-16 rounded-2xl text-3xl'
    : size === 'sm' ? 'w-11 h-11 rounded-xl text-xl'
    : 'w-14 h-14 rounded-2xl text-2xl'

  if (provider.logo) {
    return (
      <div className={`${cls} overflow-hidden shrink-0 flex items-center justify-center bg-white border border-[var(--border)]`}>
        <img
          src={provider.logo}
          alt={provider.shortName}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }
  return (
    <div
      className={`${cls} shrink-0 flex items-center justify-center`}
      style={{ background: provider.bg }}
    >
      {provider.emoji}
    </div>
  )
}

function CategoryIcon({
  cat,
  size = 'md',
}: {
  cat: BillCategory
  size?: 'sm' | 'md' | 'lg'
}) {
  const cls = size === 'lg' ? 'w-14 h-14 rounded-2xl text-3xl'
    : size === 'sm' ? 'w-10 h-10 rounded-xl text-base'
    : 'w-12 h-12 rounded-2xl text-2xl'

  if (cat.icon) {
    return (
      <div className={`${cls} overflow-hidden shrink-0 flex items-center justify-center bg-white border border-[var(--border)]`}>
        <img
          src={cat.icon}
          alt={cat.label}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }
  return (
    <div
      className={`${cls} shrink-0 flex items-center justify-center`}
      style={{ background: cat.bg }}
    >
      {cat.emoji}
    </div>
  )
}

// ── Step bar ─────────────────────────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const visible = STEPS.slice(0, 4)
  const idx = visible.indexOf(current)
  return (
    <div className="flex gap-1.5 mb-6">
      {visible.map((s, i) => (
        <div
          key={s}
          className="h-1 flex-1 rounded-full tr"
          style={{ background: i <= idx ? 'var(--lime)' : 'var(--surface-2)' }}
        />
      ))}
    </div>
  )
}

// ── Category grid ─────────────────────────────────────────────────────────────
function CategoryStep({ onSelect }: { onSelect: (cat: BillCategory) => void }) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)]">Quelle facture payez-vous ?</h2>
        <p className="text-sm text-[var(--ink-60)] mt-1">Choisissez une catégorie</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {BILL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--ink-30)] tr cursor-pointer group"
            style={{ background: 'var(--card-bg)' }}
          >
            <div className="tr group-hover:scale-110">
              <CategoryIcon cat={cat} size="md" />
            </div>
            <span className="text-xs font-semibold text-[var(--ink)] text-center leading-tight">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Provider list ─────────────────────────────────────────────────────────────
function ProviderStep({
  category,
  onSelect,
}: {
  category: BillCategory
  onSelect: (p: Provider) => void
}) {
  const providers = getProvidersForCategory(category.id)
  const others = PROVIDERS.filter(
    p => !category.providerIds.includes(p.id) && p.priority === 1
  )

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-1">
        <CategoryIcon cat={category} size="sm" />
        <h2 className="text-lg font-semibold text-[var(--ink)]">{category.label}</h2>
      </div>
      <p className="text-sm text-[var(--ink-60)] -mt-2">Choisissez le fournisseur</p>

      <div className="card-flat overflow-hidden divide-y divide-[var(--border)]">
        {providers.map(provider => (
          <button
            key={provider.id}
            onClick={() => onSelect(provider)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer text-left"
          >
            <ProviderLogo provider={provider} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)]">{provider.name}</p>
              <p className="text-xs text-[var(--ink-60)] truncate">{provider.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {provider.instant && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--lime)', color: '#ffffff' }}>
                  Instantané
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-[var(--ink-30)]" />
            </div>
          </button>
        ))}
      </div>

      {others.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)] px-1">Autres services populaires</p>
          <div className="card-flat overflow-hidden divide-y divide-[var(--border)]">
            {others.map(provider => (
              <button
                key={provider.id}
                onClick={() => onSelect(provider)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer text-left"
              >
                <ProviderLogo provider={provider} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">{provider.name}</p>
                  <p className="text-xs text-[var(--ink-60)] truncate">{provider.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--ink-30)]" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── USD → HTG conversion block ────────────────────────────────────────────────
function ConversionBlock({ usdAmount }: { usdAmount: number }) {
  if (usdAmount <= 0) return null

  const USD_HTG_RATE = getRate('USD', 'HTG')
  const feeRate      = getFeeRate('HTG', 'USD')
  const fee          = usdAmount * feeRate
  const htgEquiv     = (usdAmount - fee) * USD_HTG_RATE

  return (
    <div className="space-y-2 pt-3 border-t border-[var(--border)]">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--ink-60)]">Frais de service</span>
        <span className="font-semibold" style={{ color: 'var(--lime)' }}>
          − ${fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-[var(--ink-60)]">
          <span>Taux de change</span>
          <Info className="w-3.5 h-3.5" />
        </div>
        <span className="font-medium text-[var(--ink)]">
          1 USD = {USD_HTG_RATE.toFixed(2)} HTG
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--ink-60)]">Équivalent HTG</span>
        <span className="font-semibold text-[var(--ink)]">
          ≈ G {htgEquiv.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--lime-light)', color: 'var(--ink)' }}>
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--lime)' }} />
        Taux garanti pendant 48 heures
      </div>
    </div>
  )
}

// ── Details form ─────────────────────────────────────────────────────────────
function DetailsStep({
  provider,
  fields: fieldValues,
  amount,
  onFieldChange,
  onAmountChange,
  onNext,
}: {
  provider: Provider
  fields: Record<string, string>
  amount: string
  onFieldChange: (id: string, val: string) => void
  onAmountChange: (val: string) => void
  onNext: () => void
}) {
  const usdAmount = parseFloat(amount) || 0
  const canProceed =
    provider.fields.filter(f => f.required).every(f => fieldValues[f.id]?.trim()) &&
    usdAmount > 0

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Provider header */}
      <div className="flex items-center gap-3">
        <ProviderLogo provider={provider} size="md" />
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">{provider.name}</h2>
          <p className="text-xs text-[var(--ink-60)]">{provider.description}</p>
        </div>
      </div>

      <div className="card-flat p-5 space-y-4">
        {provider.fields.map(field => (
          <div key={field.id} className="space-y-1.5">
            <Label className="text-sm font-medium text-[var(--ink)]">
              {field.label}
              {field.required
                ? <span className="text-red-400 ml-0.5">*</span>
                : <span className="text-[var(--ink-30)] ml-1 text-xs">(optionnel)</span>}
            </Label>

            {field.type === 'select' ? (
              <select
                value={fieldValues[field.id] ?? ''}
                onChange={e => onFieldChange(field.id, e.target.value)}
                className="w-full h-11 rounded-xl border border-[var(--border)] px-3 bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer focus:outline-none focus:border-[var(--ink-30)]"
                style={{ fontSize: '16px' }}
              >
                <option value="">Sélectionner...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <Input
                type={field.type}
                value={fieldValues[field.id] ?? ''}
                onChange={e => onFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                className="h-11 rounded-xl"
                style={{ fontSize: '16px' }}
              />
            )}
            {field.hint && (
              <p className="text-xs text-[var(--ink-60)]">{field.hint}</p>
            )}
          </div>
        ))}

        {/* Amount block */}
        <div className="space-y-3 pt-2 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">Vous payez</p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--border)] focus-within:border-[var(--ink-30)] tr">
            <Input
              type="number"
              value={amount}
              onChange={e => onAmountChange(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="border-0 shadow-none text-3xl font-bold p-0 h-auto focus-visible:ring-0 flex-1 tabular-nums bg-transparent text-[var(--ink)]"
              style={{ fontSize: '16px' }}
            />
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm shrink-0" style={{ background: 'var(--lime)', color: '#ffffff' }}>
              $ USD
            </div>
          </div>

          {/* USD → HTG conversion estimate */}
          <ConversionBlock usdAmount={usdAmount} />
        </div>
      </div>

      <button
        className="btn-lime w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        onClick={onNext}
        disabled={!canProceed}
      >
        Continuer
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Review ────────────────────────────────────────────────────────────────────
function ReviewStep({
  provider,
  category,
  fields: fieldValues,
  amount,
  submitting,
  error,
  onConfirm,
}: {
  provider: Provider
  category: BillCategory
  fields: Record<string, string>
  amount: string
  submitting: boolean
  error: string
  onConfirm: () => void
}) {
  const usdAmount = parseFloat(amount) || 0
  const USD_HTG_RATE = getRate('USD', 'HTG')
  const feeRate = getFeeRate('HTG', 'USD')
  const fee = usdAmount * feeRate
  const htgEquiv = (usdAmount - fee) * USD_HTG_RATE

  const rows = provider.fields
    .filter(f => fieldValues[f.id])
    .map(f => ({ label: f.label, value: fieldValues[f.id] }))

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)]">Récapitulatif</h2>
        <p className="text-sm text-[var(--ink-60)] mt-1">Vérifiez avant de confirmer le paiement</p>
      </div>

      {/* Provider card */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--card-bg)' }}>
        <ProviderLogo provider={provider} size="sm" />
        <div>
          <p className="font-semibold text-[var(--ink)]">{provider.name}</p>
          <p className="text-xs text-[var(--ink-60)]">{category.label}</p>
        </div>
        {provider.instant && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--lime)', color: '#ffffff' }}>
            Instantané
          </span>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-start gap-3 px-4 py-3">
            <span className="text-sm text-[var(--ink-60)] shrink-0">{row.label}</span>
            <span className="text-sm font-medium text-[var(--ink)] text-right break-all">{row.value}</span>
          </div>
        ))}
        {/* Amount breakdown */}
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Vous payez</span>
          <span className="font-semibold text-[var(--ink)]">${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Frais de service</span>
          <span className="font-semibold" style={{ color: 'var(--lime)' }}>
            − ${fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Taux de change</span>
          <span className="font-medium text-[var(--ink)]">1 USD = {USD_HTG_RATE.toFixed(2)} HTG</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3.5" style={{ background: 'var(--lime-light)' }}>
          <span className="text-sm font-semibold text-[var(--ink)]">Total USD</span>
          <span className="text-lg font-bold text-[var(--ink)]">${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Équivalent HTG</span>
          <span className="font-semibold text-[var(--ink-60)]">≈ G {htgEquiv.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm text-red-600 bg-red-50">{error}</div>
      )}

      <button
        className="btn-lime w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        onClick={onConfirm}
        disabled={submitting}
      >
        <ArrowRight className="w-4 h-4" />
        Choisir le moyen de paiement
      </button>
      <p className="text-xs text-[var(--ink-60)] text-center">
        En confirmant, vous acceptez nos conditions générales de paiement.
      </p>
    </div>
  )
}

// ── Payment Method ─────────────────────────────────────────────────────────────
type PayMethod = 'wallet' | 'card'

function PaymentMethodStep({
  amount,
  submitting,
  error,
  onConfirm,
}: {
  amount: string
  submitting: boolean
  error: string
  onConfirm: (method: PayMethod) => void
}) {
  const { user } = useAuth()
  const [selected, setSelected] = useState<PayMethod>('wallet')
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const usdAmount = parseFloat(amount) || 0

  useEffect(() => {
    if (!user) return
    supabase
      .from('currency_accounts')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', 'USD')
      .eq('is_main', true)
      .maybeSingle()
      .then(({ data }) => { if (data) setWalletBalance(data.balance) })
  }, [user])

  const walletInsufficient = walletBalance !== null && walletBalance < usdAmount

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)]">Moyen de paiement</h2>
        <p className="text-sm text-[var(--ink-60)] mt-1">Choisissez comment payer votre facture</p>
      </div>

      {/* Amount summary */}
      <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
        style={{ background: 'var(--lime-light)', border: '1px solid var(--lime)20' }}>
        <span className="text-sm font-semibold text-[var(--ink)]">Total à payer</span>
        <span className="text-lg font-bold text-[var(--ink)]">
          ${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
        </span>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {/* Wallet option */}
        <button
          onClick={() => !walletInsufficient && setSelected('wallet')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 tr cursor-pointer"
          style={{
            borderColor: selected === 'wallet' ? 'var(--lime)' : 'var(--border)',
            background: selected === 'wallet' ? 'var(--lime-light)' : 'var(--card-bg)',
            opacity: walletInsufficient ? 0.5 : 1,
          }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: selected === 'wallet' ? 'var(--lime)' : 'var(--surface-2)' }}>
            <Wallet className="w-5 h-5" style={{ color: selected === 'wallet' ? '#fff' : 'var(--ink-60)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm text-[var(--ink)]">Solde du portefeuille</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-60)' }}>
              {walletBalance !== null
                ? `$${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD disponible`
                : 'Chargement…'}
              {walletInsufficient && ' — Solde insuffisant'}
            </p>
          </div>
          {selected === 'wallet' && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--lime)' }}>
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </button>

        {/* Card option */}
        <button
          onClick={() => setSelected('card')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 tr cursor-pointer"
          style={{
            borderColor: selected === 'card' ? 'var(--lime)' : 'var(--border)',
            background: selected === 'card' ? 'var(--lime-light)' : 'var(--card-bg)',
          }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: selected === 'card' ? 'var(--lime)' : 'var(--surface-2)' }}>
            <CreditCard className="w-5 h-5" style={{ color: selected === 'card' ? '#fff' : 'var(--ink-60)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm text-[var(--ink)]">Carte bancaire</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-60)' }}>Visa / Mastercard</p>
          </div>
          {selected === 'card' && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--lime)' }}>
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm text-red-600 bg-red-50">{error}</div>
      )}

      <button
        className="btn-lime w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        onClick={() => onConfirm(selected)}
        disabled={submitting || (selected === 'wallet' && !!walletInsufficient)}
      >
        {submitting
          ? <><Loader2 className="w-4 h-4 animate-spin" />Traitement...</>
          : <>Payer — ${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</>}
      </button>
    </div>
  )
}

// ── Success ───────────────────────────────────────────────────────────────────
function SuccessStep({
  provider,
  amount,
  txId,
  onNew,
}: {
  provider: Provider
  amount: string
  txId: string
  onNew: () => void
}) {
  const navigate = useNavigate()
  const usdAmount = parseFloat(amount) || 0
  const htgEquiv = usdAmount * getRate('USD', 'HTG')

  return (
    <div className="card-flat p-8 text-center space-y-6 animate-scale-in">
      <div className="relative w-24 h-24 mx-auto">
        <div className="w-24 h-24 rounded-3xl overflow-hidden border border-[var(--border)] bg-white flex items-center justify-center">
          {provider.logo
            ? <img src={provider.logo} alt={provider.shortName} className="w-full h-full object-contain" />
            : <span className="text-5xl">{provider.emoji}</span>}
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white" style={{ background: 'var(--lime)' }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: '#ffffff' }} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">Paiement effectué !</h2>
        <p className="text-sm text-[var(--ink-60)]">
          Votre paiement à <strong>{provider.name}</strong> a été traité avec succès.
        </p>
      </div>

      <div className="text-left rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Référence</span>
          <span className="font-mono font-semibold text-xs text-[var(--ink)]">
            {txId ? txId.slice(0, 8).toUpperCase() : `BILL-${Date.now().toString(36).toUpperCase()}`}
          </span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Fournisseur</span>
          <span className="font-semibold text-[var(--ink)]">{provider.name}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Montant USD</span>
          <span className="font-bold text-[var(--ink)]">${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Équivalent HTG</span>
          <span className="font-medium text-[var(--ink-60)]">≈ G {htgEquiv.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-[var(--ink-60)]">Statut</span>
          <span className="font-semibold px-2 py-0.5 rounded text-xs" style={{ background: 'var(--lime)', color: '#ffffff' }}>
            {provider.instant ? 'Confirmé' : 'En cours'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          className="btn-lime w-full h-12 rounded-xl font-semibold text-sm cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          Retour au tableau de bord
        </button>
        <button
          className="w-full h-12 rounded-xl font-semibold text-sm border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface)] tr cursor-pointer"
          onClick={onNew}
        >
          Payer une autre facture
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function BillsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const initialCategory = searchParams.get('category')
    ? BILL_CATEGORIES.find(c => c.id === searchParams.get('category'))
    : undefined
  const initialProvider = searchParams.get('provider')
    ? PROVIDERS.find(p => p.id === searchParams.get('provider'))
    : undefined

  const [step, setStep] = useState<Step>(
    initialProvider ? 'details' : initialCategory ? 'provider' : 'category'
  )
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(initialCategory ?? null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(initialProvider ?? null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [txId, setTxId] = useState('')

  function goBack() {
    if (step === 'category')        { navigate(-1);           return }
    if (step === 'provider')        { setStep('category');    return }
    if (step === 'details')         { setStep('provider');    return }
    if (step === 'review')          { setStep('details');     return }
    if (step === 'payment-method')  { setStep('review');      return }
  }

  function handleCategorySelect(cat: BillCategory) {
    setSelectedCategory(cat)
    setSelectedProvider(null)
    setFieldValues({})
    setAmount('')
    setStep('provider')
  }

  function handleProviderSelect(provider: Provider) {
    setSelectedProvider(provider)
    setFieldValues({})
    setAmount('')
    setStep('details')
  }

  async function handleConfirm(method: PayMethod = 'wallet') {
    if (!user || !selectedProvider) return
    setSubmitting(true)
    setSubmitError('')

    const ref = `BILL-${selectedProvider.id.toUpperCase()}-${Date.now()}`
    const recipientName = fieldValues['account_name']
      || fieldValues['landlord_name']
      || fieldValues['moncash_number']
      || selectedProvider.name

    const usdAmt = parseFloat(amount)
    const htgAmt = usdAmt * getRate('USD', 'HTG')
    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'send',
      status: selectedProvider.instant ? 'completed' : 'processing',
      amount: usdAmt,
      currency: 'USD',
      target_amount: htgAmt,
      target_currency: 'HTG',
      exchange_rate: getRate('USD', 'HTG'),
      fee: usdAmt * getFeeRate('HTG', 'USD'),
      recipient_name: recipientName,
      note: `Paiement ${selectedProvider.name} via ${method === 'wallet' ? 'portefeuille' : 'carte'} — ${Object.entries(fieldValues)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')}`,
      reference: ref,
    }).select().single()

    if (error) {
      setSubmitError('Paiement échoué. Vérifiez votre solde et réessayez.')
      setSubmitting(false)
      return
    }
    if (data) {
      setTxId(data.id)
      await insertNotification({
        user_id: user.id,
        type: 'bill_paid',
        title: `Facture payée — ${selectedProvider.name}`,
        body: `Paiement de $${usdAmt.toFixed(2)} USD à ${selectedProvider.name} effectué.`,
        data: { tx_id: data.id, provider: selectedProvider.id, amount: usdAmt },
      })
    }
    setSubmitting(false)
    setStep('success')
  }

  function handleReset() {
    setStep('category')
    setSelectedCategory(null)
    setSelectedProvider(null)
    setFieldValues({})
    setAmount('')
    setTxId('')
    setSubmitError('')
  }

  const visibleLabel = step === 'success'
    ? 'Paiement réussi'
    : step === 'category'
      ? 'Payer une facture'
      : step === 'provider'
        ? selectedCategory?.label ?? 'Fournisseur'
        : step === 'details'
          ? selectedProvider?.name ?? 'Informations'
          : step === 'payment-method'
            ? 'Moyen de paiement'
            : 'Confirmation'

  const stepNumber = STEPS.indexOf(step)

  return (
    <div className="pb-6" style={{ background: 'var(--surface)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {step !== 'success' && (
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
            <button
              onClick={goBack}
              className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center tr hover:bg-[var(--surface)] cursor-pointer shrink-0"
              style={{ background: 'var(--card-bg)' }}
            >
              <ChevronLeft className="w-4 h-4 text-[var(--ink)]" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-[var(--ink)]">{visibleLabel}</h1>
              {step !== 'category' && (
                <p className="text-xs text-[var(--ink-60)]">
                  Étape {stepNumber} sur {STEPS.length - 1}
                </p>
              )}
            </div>
          </div>
        )}

        {step !== 'success' && step !== 'category' && <StepBar current={step} />}

        {step === 'category' && (
          <CategoryStep onSelect={handleCategorySelect} />
        )}

        {step === 'provider' && selectedCategory && (
          <ProviderStep category={selectedCategory} onSelect={handleProviderSelect} />
        )}

        {step === 'details' && selectedProvider && (
          <DetailsStep
            provider={selectedProvider}
            fields={fieldValues}
            amount={amount}
            onFieldChange={(id, val) => setFieldValues(p => ({ ...p, [id]: val }))}
            onAmountChange={setAmount}
            onNext={() => setStep('review')}
          />
        )}

        {step === 'review' && selectedProvider && selectedCategory && (
          <ReviewStep
            provider={selectedProvider}
            category={selectedCategory}
            fields={fieldValues}
            amount={amount}
            submitting={false}
            error=""
            onConfirm={() => setStep('payment-method')}
          />
        )}

        {step === 'payment-method' && (
          <PaymentMethodStep
            amount={amount}
            submitting={submitting}
            error={submitError}
            onConfirm={handleConfirm}
          />
        )}

        {step === 'success' && selectedProvider && (
          <SuccessStep
            provider={selectedProvider}
            amount={amount}
            txId={txId}
            onNew={handleReset}
          />
        )}
      </div>
    </div>
  )
}
