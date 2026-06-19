import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Loader2, Info, ChevronLeft, ArrowLeftRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CURRENCIES, calculateTransfer, formatCurrency, getCurrency } from '@/lib/currencies'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Step = 'amount' | 'recipient' | 'review' | 'success'

function CurrencyPill({ code, onChange, accounts }: {
  code: string
  onChange: (c: string) => void
  accounts?: CurrencyAccount[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const curr = getCurrency(code)

  const list = accounts && accounts.length > 0
    ? accounts.map(a => ({ code: a.currency, balance: a.balance }))
    : null

  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--ink-30)] bg-[var(--surface)] tr font-semibold text-sm cursor-pointer"
      >
        <span className="text-lg leading-none">{curr?.flag}</span>
        <span className="text-[var(--ink)]">{code}</span>
        <svg className="w-3 h-3 text-[var(--ink-30)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-20 bg-white border border-[var(--border)] rounded-2xl shadow-xl w-64 overflow-hidden">
            <div className="p-2 border-b border-[var(--border)]">
              <Input
                autoFocus
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-sm rounded-xl"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {(list
                ? list.map(a => getCurrency(a.code)).filter(Boolean)
                : filtered
              ).map(c => {
                if (!c) return null
                const accBalance = list?.find(a => a.code === c.code)?.balance
                return (
                  <button
                    key={c.code}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface)] text-left text-sm tr cursor-pointer",
                      c.code === code && "bg-[var(--surface)]"
                    )}
                    onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                  >
                    <span className="text-lg leading-none">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[var(--ink)]">{c.code}</span>
                      <span className="text-[var(--ink-60)] ml-2 text-xs">{c.name}</span>
                      {accBalance !== undefined && (
                        <p className="text-xs text-[var(--ink-60)]">{formatCurrency(accBalance, c.code)}</p>
                      )}
                    </div>
                    {c.code === code && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" style={{ color: 'var(--lime)' }} />}
                  </button>
                )
              })}
              {!list && filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface)] text-left text-sm tr cursor-pointer",
                    c.code === code && "bg-[var(--surface)]"
                  )}
                  onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <div>
                    <span className="font-semibold text-[var(--ink)]">{c.code}</span>
                    <span className="text-[var(--ink-60)] ml-2 text-xs">{c.name}</span>
                  </div>
                  {c.code === code && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" style={{ color: 'var(--lime)' }} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const STEPS: Step[] = ['amount', 'recipient', 'review', 'success']

export function TransferPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isConvert = params.get('mode') === 'convert'

  const [step, setStep] = useState<Step>('amount')
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('HTG')
  const [amount, setAmount] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientAccount, setRecipientAccount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [txId, setTxId] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('currency_accounts').select('*')
      .eq('user_id', user.id)
      .then(({ data }) => { if (data) setAccounts(data) })
  }, [user])

  const sendAmount = parseFloat(amount) || 0
  const calc = calculateTransfer(sendAmount, fromCurrency, toCurrency)
  const fromCurr = getCurrency(fromCurrency)
  const toCurr = getCurrency(toCurrency)
  const fromAccount = accounts.find(a => a.currency === fromCurrency)
  const hasEnoughBalance = !fromAccount || sendAmount <= fromAccount.balance

  function swap() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  function goBack() {
    const idx = STEPS.indexOf(step)
    if (idx <= 0) navigate(-1)
    else setStep(STEPS[idx - 1])
  }

  async function submit() {
    if (!user) return
    setSubmitting(true)
    setSubmitError('')

    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: isConvert ? 'convert' : 'send',
      status: 'processing',
      amount: sendAmount,
      currency: fromCurrency,
      target_amount: calc.received,
      target_currency: toCurrency,
      exchange_rate: calc.rate,
      fee: calc.fee,
      recipient_name: recipientName || null,
      recipient_email: recipientEmail || null,
      recipient_account: recipientAccount || null,
      note: note || null,
      reference: `TRF-${Date.now()}`,
    }).select().single()

    if (error || !data) {
      setSubmitError('Virement échoué. Réessayez.')
      setSubmitting(false)
      return
    }

    // Deduct from source account
    if (fromAccount) {
      await supabase.from('currency_accounts')
        .update({ balance: Math.max(0, fromAccount.balance - sendAmount - calc.fee) })
        .eq('id', fromAccount.id)
    }

    // For conversions: credit target account
    if (isConvert) {
      const toAccount = accounts.find(a => a.currency === toCurrency)
      if (toAccount) {
        await supabase.from('currency_accounts')
          .update({ balance: toAccount.balance + calc.received })
          .eq('id', toAccount.id)
      } else if (user) {
        await supabase.from('currency_accounts').insert({
          user_id: user.id,
          currency: toCurrency,
          balance: calc.received,
          is_main: false,
        })
      }
    }

    setTxId(data.id)
    setSubmitting(false)
    setStep('success')
  }

  const visibleSteps = isConvert ? ['amount', 'review'] : ['amount', 'recipient', 'review']
  const visibleIdx = visibleSteps.indexOf(step)

  return (
    <div className="min-h-screen pb-20 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {step !== 'success' && (
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={goBack}
              className="w-9 h-9 rounded-full border border-[var(--border)] bg-white flex items-center justify-center tr hover:bg-[var(--surface)] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--ink)]" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-[var(--ink)]">
                {isConvert ? 'Convertir des devises' : 'Envoyer de l\'argent'}
              </h1>
              <p className="text-xs text-[var(--ink-60)]">
                Étape {visibleIdx + 1} sur {visibleSteps.length}
              </p>
            </div>
          </div>
        )}

        {step !== 'success' && (
          <div className="flex gap-1.5 mb-6">
            {visibleSteps.map((s, i) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full tr"
                style={{ background: i <= visibleIdx ? 'var(--lime)' : 'var(--surface-2)' }}
              />
            ))}
          </div>
        )}

        {/* STEP 1: Amount */}
        {step === 'amount' && (
          <div className="card-flat p-6 space-y-5">
            {/* Balance indicator */}
            {fromAccount && (
              <div className="flex items-center justify-between text-xs text-[var(--ink-60)]">
                <span>Solde disponible</span>
                <span className="font-semibold text-[var(--ink)]">{formatCurrency(fromAccount.balance, fromCurrency)}</span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">Vous envoyez</p>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl border tr",
                !hasEnoughBalance && sendAmount > 0 ? "border-red-300" : "border-[var(--border)] focus-within:border-[var(--ink-30)]"
              )}>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="border-0 shadow-none text-3xl font-bold p-0 h-auto focus-visible:ring-0 flex-1 tabular-nums bg-transparent text-[var(--ink)]"
                  min="0"
                  placeholder="0.00"
                />
                <CurrencyPill code={fromCurrency} onChange={setFromCurrency} accounts={accounts} />
              </div>
              {!hasEnoughBalance && sendAmount > 0 && (
                <p className="text-xs text-red-500">Solde insuffisant</p>
              )}
            </div>

            <div className="space-y-2.5 py-3 border-y border-[var(--border)]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ink-60)]">Frais de transfert</span>
                <span className="font-medium text-[var(--ink)]">− {formatCurrency(calc.fee, fromCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ink-60)]">Montant net</span>
                <span className="font-medium text-[var(--ink)]">{formatCurrency(calc.amountAfterFee, fromCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-[var(--ink-60)]">
                  <span>Taux de change</span>
                  <Info className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-[var(--ink)]">1 {fromCurrency} = {calc.rate.toFixed(4)} {toCurrency}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={swap}
                className="w-9 h-9 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--surface)] flex items-center justify-center tr cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-[var(--ink-60)]" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">Le bénéficiaire reçoit</p>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-3xl font-bold flex-1 tabular-nums text-[var(--ink)]">
                  {calc.received > 0 ? calc.received.toLocaleString('fr-FR', {
                    minimumFractionDigits: toCurr?.decimals ?? 2,
                    maximumFractionDigits: toCurr?.decimals ?? 2,
                  }) : '0.00'}
                </p>
                <CurrencyPill code={toCurrency} onChange={setToCurrency} />
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--lime-light)', color: 'var(--ink)' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--lime)' }} />
              <span>Taux garanti pendant 48 heures</span>
            </div>

            <button
              className="btn-lime w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              onClick={() => setStep(isConvert ? 'review' : 'recipient')}
              disabled={!sendAmount || sendAmount <= 0 || !hasEnoughBalance}
            >
              Continuer
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Recipient */}
        {step === 'recipient' && (
          <div className="card-flat p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">À qui envoyez-vous ?</h2>
              <p className="text-sm text-[var(--ink-60)] mt-1">Coordonnées du bénéficiaire</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[var(--ink)]">Nom complet <span className="text-red-400">*</span></Label>
                <Input
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="ex. Marie Jean"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[var(--ink)]">Email <span className="text-[var(--ink-30)]">(optionnel)</span></Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="sophie@example.com"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[var(--ink)]">IBAN / N° de compte <span className="text-[var(--ink-30)]">(optionnel)</span></Label>
                <Input
                  value={recipientAccount}
                  onChange={e => setRecipientAccount(e.target.value)}
                  placeholder="FR76 1234 5678 ..."
                  className="h-11 rounded-xl font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[var(--ink)]">Note <span className="text-[var(--ink-30)]">(optionnel)</span></Label>
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Objet du paiement"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <button
              className="btn-lime w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              onClick={() => setStep('review')}
              disabled={!recipientName.trim()}
            >
              Continuer
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 'review' && (
          <div className="card-flat p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">Récapitulatif</h2>
              <p className="text-sm text-[var(--ink-60)] mt-1">Vérifiez les informations avant de confirmer</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
              {[
                { label: 'Vous envoyez', value: `${fromCurr?.flag} ${formatCurrency(sendAmount, fromCurrency)}` },
                { label: 'Frais', value: `− ${formatCurrency(calc.fee, fromCurrency)}` },
                { label: 'Taux de change', value: `1 ${fromCurrency} = ${calc.rate.toFixed(4)} ${toCurrency}` },
                { label: 'Le bénéficiaire reçoit', value: `${toCurr?.flag} ${formatCurrency(calc.received, toCurrency)}`, highlight: true },
                ...(recipientName ? [{ label: 'À', value: recipientName }] : []),
                ...(recipientAccount ? [{ label: 'Compte', value: recipientAccount, mono: true }] : []),
                ...(note ? [{ label: 'Note', value: note, italic: true }] : []),
              ].map((row, i) => (
                <div key={i} className={cn("flex justify-between items-center px-4 py-3", row.highlight && "bg-[var(--lime-light)]")}>
                  <span className="text-sm text-[var(--ink-60)]">{row.label}</span>
                  <span className={cn(
                    "text-sm text-[var(--ink)]",
                    row.highlight ? "font-bold text-base" : "font-medium",
                    row.mono && "font-mono text-xs",
                    row.italic && "italic text-[var(--ink-60)]"
                  )}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {submitError && (
              <div className="p-3 rounded-xl text-sm text-red-600 bg-red-50">{submitError}</div>
            )}

            <button
              className="btn-lime w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              onClick={submit}
              disabled={submitting}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Traitement...</>
                : <>Confirmer — {fromCurr?.flag} {formatCurrency(sendAmount, fromCurrency)}</>}
            </button>
            <p className="text-xs text-[var(--ink-60)] text-center">
              En confirmant, vous acceptez nos conditions de virement.
            </p>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && (
          <div className="card-flat p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--lime)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--ink)' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">
                {isConvert ? 'Conversion effectuée' : 'Virement envoyé'}
              </h2>
              <p className="text-sm text-[var(--ink-60)]">
                {fromCurr?.flag} {formatCurrency(sendAmount, fromCurrency)} est en cours de traitement.
              </p>
            </div>

            <div className="text-left rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-[var(--ink-60)]">Référence</span>
                <span className="font-mono font-semibold text-xs text-[var(--ink)]">{txId ? txId.slice(0, 8).toUpperCase() : '—'}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-[var(--ink-60)]">{isConvert ? 'Vous recevez' : 'Bénéficiaire reçoit'}</span>
                <span className="font-semibold text-[var(--ink)]">{toCurr?.flag} {formatCurrency(calc.received, toCurrency)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-[var(--ink-60)]">Délai estimé</span>
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                  {isConvert ? 'Instantané' : 'Sous 24 heures'}
                </span>
              </div>
              {recipientName && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-[var(--ink-60)]">À</span>
                  <span className="font-medium text-[var(--ink)]">{recipientName}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                className="btn-lime w-full h-12 rounded-xl font-semibold text-sm cursor-pointer"
                onClick={() => navigate('/wallet')}
              >
                Retour au portefeuille
              </button>
              <button
                className="w-full h-12 rounded-xl font-semibold text-sm border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface)] tr cursor-pointer"
                onClick={() => { setStep('amount'); setAmount(''); setRecipientName(''); setRecipientEmail(''); setRecipientAccount(''); setNote(''); setTxId('') }}
              >
                Nouveau virement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
