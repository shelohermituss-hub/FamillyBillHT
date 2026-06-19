import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Loader2, Info, ChevronLeft, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CURRENCIES, calculateTransfer, formatCurrency, getCurrency } from '@/lib/currencies'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Step = 'amount' | 'recipient' | 'review' | 'success'

function CurrencyPill({ code, onChange }: { code: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const curr = getCurrency(code)
  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-border hover:border-foreground/30 bg-white transition-colors font-bold text-sm"
      >
        <span className="text-xl leading-none">{curr?.flag}</span>
        <span>{code}</span>
        <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-20 bg-white border border-border rounded-2xl shadow-xl w-64 overflow-hidden">
            <div className="p-2 border-b border-border">
              <Input
                autoFocus
                placeholder="Search currencies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-sm rounded-xl"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left text-sm transition-colors",
                    c.code === code && "bg-accent"
                  )}
                  onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <div>
                    <span className="font-bold">{c.code}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{c.name}</span>
                  </div>
                  {c.code === code && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0 text-green-500" />}
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
  const [fromCurrency, setFromCurrency] = useState('EUR')
  const [toCurrency, setToCurrency] = useState('USD')
  const [amount, setAmount] = useState('500')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientAccount, setRecipientAccount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [txId, setTxId] = useState('')

  const sendAmount = parseFloat(amount) || 0
  const calc = calculateTransfer(sendAmount, fromCurrency, toCurrency)
  const fromCurr = getCurrency(fromCurrency)
  const toCurr = getCurrency(toCurrency)

  function swap() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  function goBack() {
    const idx = STEPS.indexOf(step)
    if (idx <= 0) navigate(-1)
    else setStep(STEPS[idx - 1])
  }

  const [submitError, setSubmitError] = useState('')

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
    if (error) {
      setSubmitError('Transfer failed. Please try again.')
      setSubmitting(false)
      return
    }
    if (data) setTxId(data.id)
    setSubmitting(false)
    setStep('success')
  }

  const visibleSteps = isConvert ? ['amount', 'review'] : ['amount', 'recipient', 'review']
  const visibleIdx = visibleSteps.indexOf(step)

  return (
    <div className="min-h-screen pb-16 md:pb-12" style={{ backgroundColor: 'var(--wise-sage)' }}>
      <div className="max-w-lg mx-auto px-4 pt-8">

        {/* Header */}
        {step !== 'success' && (
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={goBack}
              className="w-9 h-9 rounded-xl hover:bg-white flex items-center justify-center transition-colors border border-border bg-white/60"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black" style={{ color: 'var(--wise-ink)' }}>
                {isConvert ? 'Convert money' : 'Send money'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Step {visibleIdx + 1} of {visibleSteps.length}
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {step !== 'success' && (
          <div className="flex gap-1.5 mb-8">
            {visibleSteps.map((s, i) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={i <= visibleIdx ? { backgroundColor: 'var(--wise-ink)' } : { backgroundColor: 'oklch(0.922 0.005 120)' }}
              />
            ))}
          </div>
        )}

        {/* STEP 1: Amount */}
        {step === 'amount' && (
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-5">
            {/* You send */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">You send</p>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-border focus-within:border-foreground transition-colors">
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="border-0 shadow-none text-3xl font-black p-0 h-auto focus-visible:ring-0 flex-1 tabular-nums bg-transparent"
                  min="0"
                  placeholder="0"
                />
                <CurrencyPill code={fromCurrency} onChange={setFromCurrency} />
              </div>
            </div>

            {/* Fee breakdown */}
            <div className="space-y-2 py-3 border-y border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transfer fee</span>
                <span className="font-semibold">− {formatCurrency(calc.fee, fromCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount converted</span>
                <span className="font-semibold">{formatCurrency(calc.amountAfterFee, fromCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Exchange rate</span>
                  <Info className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold">1 {fromCurrency} = {calc.rate.toFixed(4)} {toCurrency}</span>
              </div>
            </div>

            {/* Swap */}
            <div className="flex justify-center -my-2">
              <button
                type="button"
                onClick={swap}
                className="w-10 h-10 rounded-full border-2 border-border bg-white hover:bg-accent flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Recipient gets */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recipient gets</p>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-border bg-muted/30">
                <p className="text-3xl font-black flex-1 tabular-nums">
                  {calc.received > 0 ? calc.received.toLocaleString('en-US', {
                    minimumFractionDigits: toCurr?.decimals ?? 2,
                    maximumFractionDigits: toCurr?.decimals ?? 2,
                  }) : '0.00'}
                </p>
                <CurrencyPill code={toCurrency} onChange={setToCurrency} />
              </div>
            </div>

            {/* Rate guarantee */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>We guarantee this rate for 48 hours</span>
            </div>

            <Button
              className="w-full h-12 rounded-2xl font-bold text-base border-0"
              style={{ backgroundColor: 'var(--wise-ink)', color: 'white' }}
              onClick={() => setStep(isConvert ? 'review' : 'recipient')}
              disabled={!sendAmount || sendAmount <= 0}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Recipient */}
        {step === 'recipient' && (
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--wise-ink)' }}>Who are you sending to?</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter recipient details below</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Full name <span className="text-red-400">*</span></Label>
                <Input
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="e.g. Sophie Laurent"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="sophie@example.com"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">IBAN / Account number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={recipientAccount}
                  onChange={e => setRecipientAccount(e.target.value)}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  className="h-12 rounded-2xl font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="What's this payment for?"
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-2xl font-bold text-base border-0"
              style={{ backgroundColor: 'var(--wise-ink)', color: 'white' }}
              onClick={() => setStep('review')}
              disabled={!recipientName.trim()}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 'review' && (
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--wise-ink)' }}>Review your transfer</h2>
              <p className="text-sm text-muted-foreground mt-1">Please confirm everything looks correct</p>
            </div>

            <div className="space-y-0 divide-y divide-border rounded-2xl border border-border overflow-hidden">
              {[
                { label: 'You send', value: `${fromCurr?.flag} ${formatCurrency(sendAmount, fromCurrency)}` },
                { label: 'Fee', value: `− ${formatCurrency(calc.fee, fromCurrency)}` },
                { label: 'Exchange rate', value: `1 ${fromCurrency} = ${calc.rate.toFixed(4)} ${toCurrency}` },
                { label: 'Recipient gets', value: `${toCurr?.flag} ${formatCurrency(calc.received, toCurrency)}`, bold: true },
                ...(recipientName ? [{ label: 'To', value: recipientName }] : []),
                ...(recipientAccount ? [{ label: 'Account', value: recipientAccount, mono: true }] : []),
                ...(note ? [{ label: 'Note', value: note, italic: true }] : []),
              ].map((row, i) => (
                <div key={i} className={cn("flex justify-between items-center px-4 py-3", row.bold && "bg-muted/30")}>
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={cn(
                    "text-sm",
                    row.bold ? "font-black text-base" : "font-semibold",
                    row.mono && "font-mono text-xs",
                    row.italic && "italic text-muted-foreground"
                  )} style={row.bold ? { color: 'var(--wise-ink)' } : {}}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <Button
              className="w-full h-12 rounded-2xl font-bold text-base border-0"
              style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}
              onClick={submit}
              disabled={submitting}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
                : <>Confirm & send {fromCurr?.flag} {formatCurrency(sendAmount, fromCurrency)}</>
              }
            </Button>
            {submitError && (
              <div className="p-3 rounded-2xl text-sm text-destructive" style={{ backgroundColor: 'oklch(0.577 0.245 27.325 / 0.1)' }}>
                {submitError}
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              By confirming, you agree to our transfer terms.
            </p>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && (
          <div className="bg-white rounded-3xl p-8 border border-border shadow-sm text-center space-y-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg" style={{ backgroundColor: 'var(--wise-lime)' }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--wise-ink)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--wise-ink)' }}>Transfer sent!</h2>
              <p className="text-muted-foreground text-sm">
                Your transfer of {fromCurr?.flag} {formatCurrency(sendAmount, fromCurrency)} is on its way.
              </p>
            </div>

            <div className="p-4 rounded-2xl text-left space-y-2.5" style={{ backgroundColor: 'var(--wise-sage)' }}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-bold text-xs">{txId ? txId.slice(0, 8).toUpperCase() : '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient gets</span>
                <span className="font-bold">{toCurr?.flag} {formatCurrency(calc.received, toCurrency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated delivery</span>
                <span className="font-bold" style={{ color: 'var(--wise-ink)' }}>Within 24 hours</span>
              </div>
              {recipientName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-semibold">{recipientName}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-12 rounded-2xl font-bold border-0"
                style={{ backgroundColor: 'var(--wise-ink)', color: 'white' }}
                onClick={() => navigate('/dashboard')}
              >
                Back to dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl font-bold"
                onClick={() => {
                  setStep('amount')
                  setAmount('500')
                  setRecipientName('')
                  setRecipientEmail('')
                  setRecipientAccount('')
                  setNote('')
                  setTxId('')
                }}
              >
                Send another transfer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
