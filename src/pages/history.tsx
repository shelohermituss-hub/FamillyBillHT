import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Repeat, Search, BarChart2, TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type Transaction } from '@/lib/supabase'
import { getCurrency, getRate } from '@/lib/currencies'
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
  if (tx.type === 'bill_payment') return tx.recipient_name ?? 'Facture'
  return tx.recipient_name ?? 'Transfert'
}

function txIcon(tx: Transaction) {
  if (tx.type === 'convert')
    return { Icon: Repeat,        bg: 'bg-[var(--surface-2)]', color: 'text-[var(--ink-60)]' }
  if (tx.type === 'receive' || tx.type === 'deposit')
    return { Icon: ArrowDownLeft, bg: 'bg-[var(--lime-light)]', color: 'text-[var(--ink)]' }
  if (tx.type === 'bill_payment')
    return { Icon: Receipt,       bg: 'bg-blue-50',             color: 'text-blue-600' }
  return { Icon: ArrowUpRight,    bg: 'bg-red-50',              color: 'text-red-500' }
}

function txAmount(tx: Transaction) {
  const curr = getCurrency(tx.currency)
  const isSend    = tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'bill_payment'
  const isReceive = tx.type === 'receive' || tx.type === 'deposit'
  const sign  = isSend ? '−' : isReceive ? '+' : ''
  const color = isSend ? 'text-red-500' : isReceive ? 'text-[var(--ink)]' : 'text-[var(--ink-60)]'
  return { text: `${sign}${curr?.symbol ?? ''}${tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`, color }
}

const FILTERS = [
  { value: 'all',          label: 'Tout'        },
  { value: 'send',         label: 'Envois'      },
  { value: 'receive',      label: 'Reçus'       },
  { value: 'convert',      label: 'Conversions' },
  { value: 'bill_payment', label: 'Factures'    },
]

const DONUT_COLORS = ['#ef4444', '#1A56DB', '#3b82f6', '#f59e0b', '#8b5cf6']

// Custom donut center label
function DonutCenter({ total }: { total: number }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-8" className="text-xs" fill="var(--ink-60)" fontSize={11}>Total</tspan>
      <tspan x="50%" dy="20" fontWeight="700" fill="var(--ink)" fontSize={16}>
        ${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </tspan>
    </text>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="px-3 py-2 rounded-xl text-xs font-semibold shadow-lg"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
      {name}: ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
    </div>
  )
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

  // Stats
  const toUSD = (tx: Transaction) => tx.amount * getRate(tx.currency, 'USD')
  const sendTotal    = transactions.filter(t => t.type === 'send' || t.type === 'withdraw').reduce((s, t) => s + toUSD(t), 0)
  const receiveTotal = transactions.filter(t => t.type === 'receive' || t.type === 'deposit').reduce((s, t) => s + toUSD(t), 0)
  const billTotal    = transactions.filter(t => t.type === 'bill_payment').reduce((s, t) => s + toUSD(t), 0)
  const convertTotal = transactions.filter(t => t.type === 'convert').reduce((s, t) => s + toUSD(t), 0)

  const donutData = [
    { name: 'Envois',      value: Math.round(sendTotal * 100) / 100 },
    { name: 'Reçus',       value: Math.round(receiveTotal * 100) / 100 },
    { name: 'Factures',    value: Math.round(billTotal * 100) / 100 },
    { name: 'Conversions', value: Math.round(convertTotal * 100) / 100 },
  ].filter(d => d.value > 0)

  // Monthly bar chart data (last 6 months)
  const monthlyData = (() => {
    const now = new Date()
    const months: { month: string; envois: number; reçus: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('fr-FR', { month: 'short' })
      const txsInMonth = transactions.filter(t => {
        const td = new Date(t.created_at)
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
      })
      months.push({
        month: label,
        envois: Math.round(txsInMonth.filter(t => t.type === 'send' || t.type === 'withdraw').reduce((s, t) => s + toUSD(t), 0)),
        reçus:  Math.round(txsInMonth.filter(t => t.type === 'receive' || t.type === 'deposit').reduce((s, t) => s + toUSD(t), 0)),
      })
    }
    return months
  })()

  const totalUSD = donutData.reduce((s, d) => s + d.value, 0)
  const hasData = donutData.length > 0

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-5">

        <div className="animate-fade-in-up">
          <h1 className="font-extrabold text-[var(--ink)]" style={{ fontSize: 22, letterSpacing: '-0.03em' }}>Statistiques</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-60)', marginTop: 2 }}>Vue d'ensemble de vos finances</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-1">
          <div className="rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', boxShadow: '0 2px 8px rgba(13,27,75,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-60)' }}>Total dépensé</p>
            </div>
            <p className="tabular-nums font-extrabold text-red-500" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
              ${(sendTotal + billTotal).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p style={{ fontSize: 10, color: 'var(--ink-30)', marginTop: 2 }}>approx. en USD</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', boxShadow: '0 2px 8px rgba(13,27,75,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--lime-light)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--lime)' }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-60)' }}>Total reçu</p>
            </div>
            <p className="tabular-nums font-extrabold" style={{ fontSize: 20, letterSpacing: '-0.02em', color: 'var(--lime)' }}>
              ${receiveTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p style={{ fontSize: 10, color: 'var(--ink-30)', marginTop: 2 }}>approx. en USD</p>
          </div>
        </div>

        {/* Donut chart */}
        <div className="rounded-2xl p-5 animate-fade-in-up stagger-2"
          style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', boxShadow: '0 2px 8px rgba(13,27,75,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4" style={{ color: 'var(--lime)' }} />
            <h2 className="section-title">Répartition des transactions</h2>
          </div>

          {loading ? (
            <Skeleton className="h-44 rounded-xl" />
          ) : !hasData ? (
            <div className="h-44 flex flex-col items-center justify-center gap-2">
              <BarChart2 className="w-8 h-8 text-[var(--ink-60)]" />
              <p className="text-sm text-[var(--ink-60)]">Aucune donnée à afficher</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <DonutCenter total={totalUSD} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--ink)] truncate">{d.name}</p>
                      <p className="text-[10px] text-[var(--ink-60)]">
                        ${d.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        {totalUSD > 0 && ` · ${Math.round(d.value / totalUSD * 100)}%`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly bar chart */}
        <div className="rounded-2xl p-5 animate-fade-in-up stagger-3"
          style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', boxShadow: '0 2px 8px rgba(13,27,75,0.06)' }}>
          <h2 className="section-title mb-4">Activité mensuelle (USD)</h2>
          {loading ? (
            <Skeleton className="h-36 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--ink-60)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--ink-60)' }} axisLine={false} tickLine={false} width={36}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }}
                  cursor={{ fill: 'var(--surface)' }}
                />
                <Bar dataKey="envois" name="Envois" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reçus"  name="Reçus"  fill="#1A56DB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 flex-wrap items-center animate-fade-in-up">
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
                    ? "text-white"
                    : "text-[var(--ink-60)] bg-white border border-[var(--border)] hover:bg-[var(--surface)]"
                )}
                style={filter === f.value ? { background: 'var(--lime)', color: '#ffffff' } : { color: 'var(--ink-60)' }}
              >
                {f.label}
              </button>
            ))}
          </div>
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
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 tr cursor-pointer rounded-2xl hover:bg-[var(--surface-2)]"
                  style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', boxShadow: '0 1px 4px rgba(13,27,75,0.04)' }}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
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
