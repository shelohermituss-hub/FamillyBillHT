import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Plus, Check, ChevronRight, Info, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount } from '@/lib/supabase'
import { formatCurrency, getCurrency, CURRENCIES } from '@/lib/currencies'
import { cn } from '@/lib/utils'

const LOCAL_ACCOUNT_NUMBERS: Record<string, Record<string, string>> = {
  USD: { ACH: '026073150 / 8881234567', Wire: 'WFBIUS6S' },
  EUR: { SEPA: 'BE71 0961 2345 6769', SWIFT: 'GEBABEBB' },
  GBP: { 'Faster Payments': '23-14-70 / 12345678', SWIFT: 'GB29NWBK60161331926819' },
  AUD: { PayID: '062-000 / 12345678' },
  CAD: { EFT: '001 / 00842 / 1234567' },
}

const LOCAL_DETAILS: Record<string, { type: string; label: string }[]> = {
  USD: [{ type: 'ACH', label: 'Routing + Account number' }, { type: 'Wire', label: 'SWIFT/BIC' }],
  EUR: [{ type: 'SEPA', label: 'IBAN' }, { type: 'SWIFT', label: 'BIC code' }],
  GBP: [{ type: 'Faster Payments', label: 'Sort code + Account' }, { type: 'SWIFT', label: 'IBAN' }],
  AUD: [{ type: 'PayID', label: 'BSB + Account number' }],
  CAD: [{ type: 'EFT', label: 'Institution / Transit / Account' }],
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    try {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: nothing
    }
  }
  return (
    <button onClick={copy} title="Copy to clipboard" className="p-1.5 rounded-lg hover:bg-accent transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  )
}

export function AccountPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CurrencyAccount | null>(null)
  const [addingCurrency, setAddingCurrency] = useState('')
  const [addError, setAddError] = useState('')

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data, error } = await supabase
        .from('currency_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_main', { ascending: false })
      if (data && !error) {
        setAccounts(data)
        setSelected(data[0] ?? null)
      }
      setLoading(false)
    }
    load()
  }, [user])

  async function addAccount() {
    if (!user || !addingCurrency) return
    setAddError('')
    const { data, error } = await supabase.from('currency_accounts').insert({
      user_id: user.id,
      currency: addingCurrency,
      balance: 0,
      is_main: false,
    }).select().single()
    if (data && !error) {
      setAccounts(prev => [...prev, data])
      setSelected(data)
      setAddingCurrency('')
    } else {
      setAddError('Could not add currency. Try again.')
    }
  }

  const availableCurrencies = CURRENCIES.filter(c => !accounts.find(a => a.currency === c.code))

  return (
    <div className="min-h-screen pb-16 md:pb-12" style={{ backgroundColor: 'var(--wise-sage)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--wise-ink)' }}>Account</h1>
          <p className="text-sm text-muted-foreground">Your multi-currency balances and local account details</p>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Currency list */}
          <div className="space-y-2">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)
            ) : (
              accounts.map(acc => {
                const curr = getCurrency(acc.currency)
                const isSelected = selected?.id === acc.id
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelected(acc)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                      isSelected ? "border-2 shadow-sm" : "border-border bg-white hover:shadow-sm"
                    )}
                    style={isSelected ? { borderColor: 'var(--wise-ink)', backgroundColor: 'white' } : {}}
                  >
                    <span className="text-2xl">{curr?.flag}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{acc.currency}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(acc.balance, acc.currency)}</p>
                    </div>
                    {acc.is_main && <Badge variant="secondary" className="text-xs rounded-full">Main</Badge>}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )
              })
            )}

            {/* Add currency */}
            <div className="bg-white rounded-2xl border border-dashed border-border p-3">
              <div className="flex gap-2">
                <select
                  className="flex-1 text-sm rounded-xl border border-border px-2 py-1.5 bg-white"
                  value={addingCurrency}
                  onChange={e => setAddingCurrency(e.target.value)}
                >
                  <option value="">Add a currency...</option>
                  {availableCurrencies.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="rounded-xl border-0 font-semibold"
                  style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}
                  onClick={addAccount}
                  disabled={!addingCurrency}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {addError && <p className="text-xs text-destructive mt-2">{addError}</p>}
            </div>
          </div>

          {/* Account detail panel */}
          {selected ? (
            <div className="space-y-4">
              {/* Balance card */}
              <div className="rounded-3xl p-6 border-0" style={{ backgroundColor: 'var(--wise-ink)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCurrency(selected.currency)?.flag}</span>
                      <p className="text-white/60 text-sm font-medium">{getCurrency(selected.currency)?.name}</p>
                    </div>
                    <p className="text-4xl font-black text-white tabular-nums">
                      {formatCurrency(selected.balance, selected.currency)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-xl font-semibold border-0"
                      style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}
                    >
                      Add money
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-xl font-semibold text-white border-white/30 hover:bg-white/10 hover:text-white hover:border-white/50"
                    >
                      <Link to="/transfer">Send</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Local account details */}
              {LOCAL_DETAILS[selected.currency] ? (
                <div className="bg-white rounded-3xl p-6 border border-border space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold" style={{ color: 'var(--wise-ink)' }}>Local account details</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}>
                      <Check className="w-3 h-3" />
                      Free to receive
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive {selected.currency} payments like a local. Share these details with anyone paying you.
                  </p>
                  <div className="space-y-3">
                    {LOCAL_DETAILS[selected.currency].map((detail, i) => {
                      const accountNum = LOCAL_ACCOUNT_NUMBERS[selected.currency]?.[detail.type] ?? ''
                      return (
                        <div key={i} className="p-4 rounded-2xl bg-muted/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{detail.type}</p>
                            <Badge variant="outline" className="text-xs rounded-full">{detail.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-sm font-semibold break-all">{accountNum}</p>
                            <CopyButton text={accountNum} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                    <p className="text-xs text-blue-700">Receiving international transfers is free in most currencies. Local transfers are always free.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 border border-border">
                  <h3 className="font-bold mb-2" style={{ color: 'var(--wise-ink)' }}>Hold {selected.currency}</h3>
                  <p className="text-sm text-muted-foreground">
                    Convert to {selected.currency} from any of your other currencies at the real exchange rate.
                  </p>
                </div>
              )}

              {/* Convert */}
              <Link to="/transfer?mode=convert">
                <div className="bg-white rounded-2xl p-4 border border-border flex items-center justify-between hover:shadow-sm transition-all">
                  <div>
                    <p className="font-semibold text-sm">Convert {selected.currency}</p>
                    <p className="text-xs text-muted-foreground">Exchange between your currencies at the real rate</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}>
                    <Repeat className="w-4 h-4" />
                    Convert
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-border text-center text-muted-foreground text-sm">
              Select a currency to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
