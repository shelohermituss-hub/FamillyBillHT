import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Repeat, Search, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type Transaction } from '@/lib/supabase'
import { getCurrency } from '@/lib/currencies'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Complété' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En cours' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' },
  failed: { bg: 'bg-red-100', text: 'text-red-600', label: 'Échoué' },
  cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Annulé' },
}

function txLabel(tx: Transaction): string {
  if (tx.type === 'convert') return `${tx.currency} → ${tx.target_currency ?? ''}`
  if (tx.type === 'receive') return tx.recipient_name ? `De ${tx.recipient_name}` : 'Reçu'
  if (tx.type === 'deposit') return 'Dépôt'
  if (tx.type === 'withdraw') return 'Retrait'
  return tx.recipient_name ?? 'Transfert'
}

function txIcon(tx: Transaction) {
  if (tx.type === 'convert') return { Icon: Repeat, bg: 'bg-blue-50', color: 'text-blue-600' }
  if (tx.type === 'receive' || tx.type === 'deposit') return { Icon: ArrowDownLeft, bg: 'bg-green-50', color: 'text-green-600' }
  return { Icon: ArrowUpRight, bg: 'bg-red-50', color: 'text-red-500' }
}

function txAmount(tx: Transaction) {
  const curr = getCurrency(tx.currency)
  const isSend = tx.type === 'send' || tx.type === 'withdraw'
  const isReceive = tx.type === 'receive' || tx.type === 'deposit'
  const sign = isSend ? '−' : isReceive ? '+' : '↔'
  const color = isSend ? 'text-red-500' : isReceive ? 'text-green-600' : 'text-blue-600'
  return { text: `${sign}${curr?.symbol ?? ''}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color }
}

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

  const sendCount = transactions.filter(t => t.type === 'send').length
  const receiveCount = transactions.filter(t => t.type === 'receive').length

  return (
    <div className="min-h-screen pb-16 md:pb-12" style={{ backgroundColor: 'var(--fb-light)' }}>
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--fb-ink)' }}>Transactions</h1>
          <p className="text-sm text-muted-foreground">Votre historique complet</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: transactions.length.toString() },
            { label: 'Envois', value: sendCount.toString() },
            { label: 'Réceptions', value: receiveCount.toString() },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-border text-center">
              <p className="text-2xl font-black" style={{ color: 'var(--fb-ink)' }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-2xl"
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'send', 'receive', 'convert'].map(f => (
              <Button
                key={f}
                size="sm"
                className="rounded-2xl font-semibold h-9"
                variant={filter === f ? 'default' : 'outline'}
                style={filter === f ? { backgroundColor: 'var(--fb-red)', color: 'white', borderColor: 'transparent' } : {}}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Tout' : f === 'send' ? 'Envoi' : f === 'receive' ? 'Réception' : 'Conversion'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="rounded-2xl font-semibold h-9 gap-1.5">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>

        {/* Transaction list */}
        <div className="space-y-2 pb-4">
          {loading ? (
            [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-border text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--fb-light)' }}>
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold">Aucune transaction trouvée</p>
              <p className="text-xs text-muted-foreground">
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
                <div key={tx.id} className="bg-white rounded-2xl px-4 py-3.5 border border-border hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bg)}>
                      <Icon className={cn("w-5 h-5", color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm truncate">{label}</p>
                        <Badge className={cn("text-xs rounded-full shrink-0 border-0 font-semibold px-2 py-0.5", statusCfg.bg, statusCfg.text)}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>{new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {tx.reference && <><span>·</span><span className="font-mono">{tx.reference}</span></>}
                        {toCurr && tx.target_amount && (
                          <><span>·</span><span>{toCurr.flag} {tx.target_amount.toLocaleString('en-US', { minimumFractionDigits: toCurr.decimals, maximumFractionDigits: toCurr.decimals })} {toCurr.code}</span></>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-bold text-sm tabular-nums", amount.color)}>{amount.text}</p>
                      <p className="text-xs text-muted-foreground">{tx.currency}</p>
                    </div>
                  </div>
                  {tx.note && (
                    <p className="text-xs text-muted-foreground mt-2 pl-14 italic">"{tx.note}"</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
