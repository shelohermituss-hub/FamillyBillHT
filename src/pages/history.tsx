import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Repeat, Search, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type Transaction } from '@/lib/supabase'
import { getCurrency } from '@/lib/currencies'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  completed:  { bg: 'bg-[var(--lime-light)]', text: 'text-[var(--ink)]',    label: 'Complété'   },
  processing: { bg: 'bg-blue-50',             text: 'text-blue-700',         label: 'En cours'   },
  pending:    { bg: 'bg-amber-50',            text: 'text-amber-700',        label: 'En attente' },
  failed:     { bg: 'bg-red-50',              text: 'text-red-600',          label: 'Échoué'     },
  cancelled:  { bg: 'bg-[var(--surface-2)]',  text: 'text-[var(--ink-60)]',  label: 'Annulé'     },
}

function txLabel(tx: Transaction): string {
  if (tx.type === 'convert') return `${tx.currency} → ${tx.target_currency ?? ''}`
  if (tx.type === 'receive') return tx.recipient_name ? `De ${tx.recipient_name}` : 'Reçu'
  if (tx.type === 'deposit') return 'Dépôt'
  if (tx.type === 'withdraw') return 'Retrait'
  return tx.recipient_name ?? 'Transfert'
}

function txIcon(tx: Transaction) {
  if (tx.type === 'convert')  return { Icon: Repeat,        bg: 'bg-[var(--surface-2)]', color: 'text-[var(--ink-60)]' }
  if (tx.type === 'receive' || tx.type === 'deposit')
                              return { Icon: ArrowDownLeft, bg: 'bg-[var(--lime-light)]', color: 'text-[var(--ink)]'   }
  return                             { Icon: ArrowUpRight,  bg: 'bg-red-50',             color: 'text-red-500'         }
}

function txAmount(tx: Transaction) {
  const curr = getCurrency(tx.currency)
  const isSend    = tx.type === 'send'    || tx.type === 'withdraw'
  const isReceive = tx.type === 'receive' || tx.type === 'deposit'
  const sign  = isSend ? '−' : isReceive ? '+' : ''
  const color = isSend ? 'text-red-500' : isReceive ? 'text-[var(--ink)]' : 'text-[var(--ink-60)]'
  return { text: `${sign}${curr?.symbol ?? ''}${tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`, color }
}

const FILTERS = [
  { value: 'all',     label: 'Tout'       },
  { value: 'send',    label: 'Envois'     },
  { value: 'receive', label: 'Reçus'      },
  { value: 'convert', label: 'Conversions'},
]

export function HistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (data) setTransactions(data)
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = transactions.filter(tx => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      txLabel(tx).toLowerCase().includes(q) ||
      tx.currency.toLowerCase().includes(q) ||
      (tx.target_currency ?? '').toLowerCase().includes(q) ||
      (tx.reference ?? '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || tx.type === filter
    return matchSearch && matchFilter
  })

  const sendCount    = transactions.filter(t => t.type === 'send').length
  const receiveCount = transactions.filter(t => t.type === 'receive').length

  return (
    <div className="min-h-screen pb-20 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-5">

        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Historique</h1>
          <p className="text-sm text-[var(--ink-60)]">Toutes vos transactions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: transactions.length.toString() },
            { label: 'Envois', value: sendCount.toString() },
            { label: 'Reçus', value: receiveCount.toString() },
          ].map((s, i) => (
            <div key={i} className="card-flat p-4 text-center">
              <p className="text-2xl font-bold text-[var(--ink)] tabular-nums">{s.value}</p>
              <p className="text-xs text-[var(--ink-60)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-60)]" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "h-9 px-3 rounded-xl text-sm font-medium tr cursor-pointer",
                  filter === f.value
                    ? "text-[var(--ink)]"
                    : "text-[var(--ink-60)] bg-white border border-[var(--border)] hover:bg-[var(--surface)]"
                )}
                style={filter === f.value ? { background: 'var(--lime)' } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="h-9 px-3 rounded-xl text-sm font-medium border border-[var(--border)] bg-white text-[var(--ink-60)] hover:bg-[var(--surface)] tr cursor-pointer flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>

        {/* Transaction list */}
        <div className="space-y-1.5 pb-4">
          {loading ? (
            [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)
          ) : filtered.length === 0 ? (
            <div className="card-flat p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center bg-[var(--surface)]">
                <Search className="w-5 h-5 text-[var(--ink-60)]" />
              </div>
              <p className="font-medium text-[var(--ink)]">Aucune transaction trouvée</p>
              <p className="text-xs text-[var(--ink-60)]">
                {search ? 'Essayez un autre terme ou filtre.' : 'Vos transactions apparaîtront ici.'}
              </p>
            </div>
          ) : (
            filtered.map(tx => {
              const { Icon, bg, color } = txIcon(tx)
              const statusCfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending
              const amount = txAmount(tx)
              const label = txLabel(tx)
              const toCurr = tx.target_currency ? getCurrency(tx.target_currency) : null

              return (
                <div key={tx.id} className="card-flat flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-medium text-sm text-[var(--ink)] truncate">{label}</p>
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0", statusCfg.bg, statusCfg.text)}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--ink-60)] flex-wrap">
                      <span>{new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {tx.reference && <><span>·</span><span className="font-mono">{tx.reference}</span></>}
                      {toCurr && tx.target_amount && (
                        <><span>·</span><span>{toCurr.flag} {tx.target_amount.toLocaleString('fr-FR', { minimumFractionDigits: toCurr.decimals, maximumFractionDigits: toCurr.decimals })} {toCurr.code}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("font-semibold text-sm tabular-nums", amount.color)}>{amount.text}</p>
                    <p className="text-xs text-[var(--ink-60)]">{tx.currency}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
