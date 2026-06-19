import { useState, useEffect, useCallback } from 'react'
import { ArrowUpDown, Info, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CURRENCIES, calculateTransfer, formatCurrency, getCurrency } from '@/lib/currencies'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type CurrencySelectorProps = {
  value: string
  onChange: (val: string) => void
}

function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const curr = getCurrency(value)
  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors min-w-[100px]"
      >
        <span className="text-lg leading-none">{curr?.flag}</span>
        <span className="font-bold text-sm">{value}</span>
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
                placeholder="Rechercher une devise..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-sm rounded-xl border-border"
                autoFocus
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left",
                    c.code === value && "bg-accent"
                  )}
                  onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <div>
                    <p className="text-sm font-bold">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </div>
                  {c.code === value && (
                    <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" style={{ color: 'var(--fb-red)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

type CurrencyConverterProps = {
  compact?: boolean
}

export function CurrencyConverter({ compact = false }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState('EUR')
  const [toCurrency, setToCurrency] = useState('USD')
  const [amount, setAmount] = useState('1000')
  const [result, setResult] = useState({ rate: 0, fee: 0, received: 0, amountAfterFee: 0 })

  const recalculate = useCallback(() => {
    const num = parseFloat(amount) || 0
    setResult(calculateTransfer(num, fromCurrency, toCurrency))
  }, [amount, fromCurrency, toCurrency])

  useEffect(() => {
    recalculate()
  }, [recalculate])

  function swap() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const toCurr = getCurrency(toCurrency)

  return (
    <div className={cn("bg-white rounded-3xl shadow-2xl border border-border/60", compact ? "max-w-sm p-5" : "w-full max-w-md p-6")}>
      <div className="space-y-4">
        {/* Send Amount */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">You send exactly</p>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-border focus-within:border-foreground transition-colors bg-background">
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="border-0 shadow-none text-2xl font-black p-0 h-auto focus-visible:ring-0 flex-1 bg-transparent"
              min="0"
            />
            <CurrencySelector value={fromCurrency} onChange={setFromCurrency} />
          </div>
        </div>

        {/* Fee & rate info */}
        <div className="px-1 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/40" />
              <span>Transfer fee</span>
            </div>
            <span className="font-semibold">− {formatCurrency(result.fee, fromCurrency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/40" />
              <span>Mid-market rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">1 {fromCurrency} = {result.rate > 0 ? result.rate.toFixed(4) : '—'} {toCurrency}</span>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <button
            type="button"
            onClick={swap}
            className="w-9 h-9 rounded-full border-2 border-border bg-white hover:bg-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Receive Amount */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recipient gets</p>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-border bg-muted/30">
            <p className="text-2xl font-black flex-1 tabular-nums text-foreground">
              {result.received > 0 ? result.received.toLocaleString('en-US', {
                minimumFractionDigits: toCurr?.decimals ?? 2,
                maximumFractionDigits: toCurr?.decimals ?? 2,
              }) : '0.00'}
            </p>
            <CurrencySelector value={toCurrency} onChange={setToCurrency} />
          </div>
        </div>

        {/* Rate guarantee badge */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Guaranteed rate for 48 hours after payment</span>
        </div>

        {/* CTA */}
        <Link to="/register">
          <Button
            className="w-full rounded-2xl font-bold text-base h-12 border-0 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--fb-ink)', color: 'white' }}
          >
            Get started for free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>

        <p className="text-center text-xs text-muted-foreground">
          Sans frais cachés. Nous utilisons le <strong className="text-foreground">taux réel</strong>.
        </p>
      </div>
    </div>
  )
}
