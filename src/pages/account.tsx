import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Plus, Check, ChevronRight, Info, Repeat } from 'lucide-react'
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
  USD: [{ type: 'ACH', label: 'Routage + N° de compte' }, { type: 'Wire', label: 'SWIFT/BIC' }],
  EUR: [{ type: 'SEPA', label: 'IBAN' }, { type: 'SWIFT', label: 'Code BIC' }],
  GBP: [{ type: 'Faster Payments', label: 'Code de tri + Compte' }, { type: 'SWIFT', label: 'IBAN' }],
  AUD: [{ type: 'PayID', label: 'BSB + N° de compte' }],
  CAD: [{ type: 'EFT', label: 'Institution / Transit / Compte' }],
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    try {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }
  return (
    <button onClick={copy} title="Copier" className="p-1.5 rounded-lg hover:bg-[var(--surface)] tr cursor-pointer">
      {copied
        ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--lime)' }} />
        : <Copy className="w-3.5 h-3.5 text-[var(--ink-60)]" />}
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
      setAddError('Impossible d\'ajouter la devise. Réessayez.')
    }
  }

  const availableCurrencies = CURRENCIES.filter(c => !accounts.find(a => a.currency === c.code))

  return (
    <div className="min-h-screen pb-20 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-5">

        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Compte</h1>
          <p className="text-sm text-[var(--ink-60)]">Vos soldes multi-devises</p>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-4">
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
                      "w-full flex items-center gap-3 p-4 rounded-2xl border tr text-left cursor-pointer",
                      isSelected
                        ? "border-[var(--ink)] bg-white"
                        : "border-[var(--border)] bg-white hover:bg-[var(--surface)]"
                    )}
                    style={isSelected ? { borderWidth: 2 } : {}}
                  >
                    <span className="text-2xl">{curr?.flag}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[var(--ink)]">{acc.currency}</p>
                      <p className="text-xs text-[var(--ink-60)]">{formatCurrency(acc.balance, acc.currency)}</p>
                    </div>
                    {acc.is_main && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
                        Principal
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[var(--ink-30)]" />
                  </button>
                )
              })
            )}

            {/* Add currency */}
            <div className="card-flat p-3 border-dashed">
              <div className="flex gap-2">
                <select
                  className="flex-1 text-sm rounded-xl border border-[var(--border)] px-2 py-2 bg-white text-[var(--ink)] cursor-pointer"
                  value={addingCurrency}
                  onChange={e => setAddingCurrency(e.target.value)}
                >
                  <option value="">Ajouter une devise...</option>
                  {availableCurrencies.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</option>
                  ))}
                </select>
                <button
                  className="btn-lime px-3 py-2 rounded-xl font-semibold text-sm flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  onClick={addAccount}
                  disabled={!addingCurrency}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
            </div>
          </div>

          {/* Account detail panel */}
          {selected ? (
            <div className="space-y-3">
              {/* Balance card */}
              <div className="card-dark p-6 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10" style={{ background: 'var(--lime)' }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{getCurrency(selected.currency)?.flag}</span>
                    <p className="text-white/60 text-sm">{getCurrency(selected.currency)?.name}</p>
                    {selected.is_main && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-white tabular-nums mb-4">
                    {formatCurrency(selected.balance, selected.currency)}
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-lime px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer">
                      Ajouter des fonds
                    </button>
                    <Link to="/transfer">
                      <button className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/30 text-white hover:bg-white/10 tr cursor-pointer">
                        Envoyer
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Local account details */}
              {LOCAL_DETAILS[selected.currency] ? (
                <div className="card-flat p-5 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-[var(--ink)]">Coordonnées bancaires</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
                      <Check className="w-3 h-3" />
                      Réception gratuite
                    </div>
                  </div>
                  <p className="text-sm text-[var(--ink-60)]">
                    Recevez des paiements en {selected.currency} comme un local.
                  </p>
                  <div className="space-y-2">
                    {LOCAL_DETAILS[selected.currency].map((detail, i) => {
                      const accountNum = LOCAL_ACCOUNT_NUMBERS[selected.currency]?.[detail.type] ?? ''
                      return (
                        <div key={i} className="p-3 rounded-xl bg-[var(--surface)] space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-60)]">{detail.type}</p>
                            <span className="text-[10px] text-[var(--ink-60)] border border-[var(--border)] px-1.5 py-0.5 rounded">{detail.label}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-sm font-medium text-[var(--ink)] break-all">{accountNum}</p>
                            <CopyButton text={accountNum} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                    <p className="text-xs text-blue-700">Les virements internationaux sont gratuits dans la plupart des devises.</p>
                  </div>
                </div>
              ) : (
                <div className="card-flat p-5">
                  <h3 className="font-semibold text-[var(--ink)] mb-2">Détenir {selected.currency}</h3>
                  <p className="text-sm text-[var(--ink-60)]">
                    Convertissez vers {selected.currency} depuis vos autres devises au taux réel.
                  </p>
                </div>
              )}

              {/* Convert */}
              <Link to="/transfer?mode=convert">
                <div className="card-flat flex items-center justify-between px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer">
                  <div>
                    <p className="font-semibold text-sm text-[var(--ink)]">Convertir {selected.currency}</p>
                    <p className="text-xs text-[var(--ink-60)]">Échangez au taux réel</p>
                  </div>
                  <div className="flex items-center gap-1.5 btn-lime px-3 py-1.5 rounded-xl text-sm font-semibold">
                    <Repeat className="w-4 h-4" />
                    Convertir
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="card-flat p-8 text-center text-[var(--ink-60)] text-sm">
              Sélectionnez une devise
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
