import { useEffect, useState, useMemo, useRef } from 'react'
import { ArrowUpRight, ArrowDownLeft, Repeat, Receipt, X, Share2, ChevronLeft } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type Transaction, type CurrencyAccount } from '@/lib/supabase'
import { getCurrency, getRate, formatCurrency } from '@/lib/currencies'

// ── Card gradient styles ──────────────────────────────────────────────────────

const CARD_GRADIENTS: Record<string, string> = {
  HTG: 'linear-gradient(135deg, #1a0070 0%, #3b12cc 45%, #6d28d9 100%)',
  USD: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #34d399 100%)',
  EUR: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #60a5fa 100%)',
  CAD: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #fb923c 100%)',
  BRL: 'linear-gradient(135deg, #831843 0%, #e11d48 45%, #fb7185 100%)',
}
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1a0070 0%, #3b12cc 45%, #6d28d9 100%)'

// ── Helpers ───────────────────────────────────────────────────────────────────

function txLabel(tx: Transaction): string {
  if (tx.type === 'convert') return `${tx.currency} → ${tx.target_currency ?? ''}`
  if (tx.type === 'receive') return tx.recipient_name ? `De ${tx.recipient_name}` : 'Reçu'
  if (tx.type === 'deposit') return 'Dépôt'
  if (tx.type === 'withdraw') return 'Retrait'
  if (tx.type === 'bill_payment') return tx.recipient_name ?? 'Facture'
  return tx.recipient_name ?? 'Transfert'
}

function txSign(tx: Transaction) {
  const isSend = tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'bill_payment'
  const isRecv = tx.type === 'receive' || tx.type === 'deposit'
  return { isSend, isRecv }
}

function txAmountStr(tx: Transaction) {
  const curr = getCurrency(tx.currency)
  const { isSend, isRecv } = txSign(tx)
  const sign = isSend ? '−' : isRecv ? '+' : ''
  return `${sign}${curr?.symbol ?? ''}${tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`
}

function groupByDate(txs: Transaction[]) {
  const groups: { label: string; txs: Transaction[] }[] = []
  const map = new Map<string, Transaction[]>()
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  for (const tx of txs) {
    const d = new Date(tx.created_at); d.setHours(0,0,0,0)
    let label: string
    if (d.getTime() === today.getTime()) label = "Aujourd'hui"
    else if (d.getTime() === yesterday.getTime()) label = 'Hier'
    else label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!map.has(label)) { map.set(label, []); groups.push({ label, txs: map.get(label)! }) }
    map.get(label)!.push(tx)
  }
  return groups
}

// Brand icon for tx (SVG inline, no emoji)
function TxBrandIcon({ tx }: { tx: Transaction }) {
  const { isSend, isRecv } = txSign(tx)
  if (tx.type === 'convert') {
    return (
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: '#F3F0FF' }}>
        <Repeat className="w-4 h-4" style={{ color: '#7C3AED' }} />
      </div>
    )
  }
  if (tx.type === 'bill_payment') {
    return (
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: '#EFF6FF' }}>
        <Receipt className="w-4 h-4" style={{ color: '#2563EB' }} />
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{ background: isSend ? '#FFF1F2' : '#F0FDF4' }}>
      {isSend
        ? <ArrowUpRight className="w-4 h-4" style={{ color: '#F43F5E' }} />
        : <ArrowDownLeft className="w-4 h-4" style={{ color: '#22C55E' }} />}
    </div>
  )
}

// ── Transaction Detail Bottom Sheet ───────────────────────────────────────────

function TxDetailSheet({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const curr = getCurrency(tx.currency)
  const { isSend } = txSign(tx)
  const amountStr = txAmountStr(tx)
  const amountColor = isSend ? '#F43F5E' : '#22C55E'
  const date = new Date(tx.created_at)

  return (
    <div className="fixed inset-0 z-80 flex items-end justify-center" style={{ zIndex: 80 }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl overflow-hidden animate-fade-in-up"
        style={{ background: '#fff', boxShadow: '0 -4px 40px rgba(0,0,0,0.18)', maxHeight: '85vh', overflowY: 'auto' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#E5E7EB' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h2 className="text-base font-bold" style={{ color: '#111' }}>Détails de la transaction</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
            style={{ background: '#F3F4F6' }}>
            <X className="w-4 h-4" style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Amount block */}
        <div className="mx-5 mb-4 rounded-2xl p-5 flex items-center gap-4"
          style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
          <TxBrandIcon tx={tx} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>{txLabel(tx)}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' — '}
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-extrabold tabular-nums" style={{ color: amountColor }}>{amountStr}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{curr?.code}</p>
          </div>
        </div>

        {/* Payment info table */}
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid #F3F4F6' }}>
          {[
            { label: 'Type', value: tx.type === 'send' ? 'Envoi' : tx.type === 'receive' ? 'Réception' : tx.type === 'deposit' ? 'Dépôt' : tx.type === 'convert' ? 'Conversion' : tx.type === 'bill_payment' ? 'Facture' : 'Retrait' },
            { label: 'Catégorie', value: tx.type === 'bill_payment' ? 'Paiement facture' : tx.type === 'convert' ? 'Conversion devise' : 'Virement' },
            tx.reference ? { label: 'Référence', value: tx.reference } : null,
            { label: 'Frais', value: tx.fee ? `${curr?.symbol ?? ''}${tx.fee.toFixed(2)}` : 'Aucun' },
            tx.recipient_name ? { label: 'Bénéficiaire', value: tx.recipient_name } : null,
            { label: 'Statut', value: tx.status === 'completed' ? 'Complété' : tx.status === 'pending' ? 'En attente' : tx.status === 'failed' ? 'Échoué' : tx.status },
          ].filter(Boolean).map((row, i, arr) => (
            <div key={i} className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{row!.label}</p>
              <p className="text-sm font-semibold" style={{ color: '#111' }}>{row!.value}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mx-5 mb-4 grid grid-cols-2 gap-3">
          <button className="h-11 rounded-2xl text-sm font-semibold cursor-pointer tr"
            style={{ background: '#F3F4F6', color: '#374151' }}>
            Voir reçu
          </button>
          <button className="h-11 rounded-2xl text-sm font-semibold cursor-pointer tr"
            style={{ background: '#F3F4F6', color: '#374151' }}>
            Partager
          </button>
        </div>

        {/* CTA */}
        <div className="mx-5 mb-6 flex flex-col gap-2">
          <button onClick={onClose}
            className="w-full h-12 rounded-2xl text-sm font-semibold cursor-pointer"
            style={{ background: '#9fe870', color: '#0e0f0c' }}>
            Terminé
          </button>
          <button className="w-full h-12 rounded-2xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
            style={{ background: '#F9FAFB', color: '#374151', border: '1px solid #F3F4F6' }}>
            <Share2 className="w-4 h-4" /> Partager le reçu
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Transfer Details Full Screen ───────────────────────────────────────────────

function TransferDetailsView({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const curr = getCurrency(tx.currency)
  const toCurr = tx.target_currency ? getCurrency(tx.target_currency) : null
  const gradient = CARD_GRADIENTS[tx.currency] ?? DEFAULT_GRADIENT
  const date = new Date(tx.created_at)

  return (
    <div className="fixed inset-x-0 bottom-0 flex flex-col" style={{ top: 56, zIndex: 90, background: '#F9FAFB' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0" style={{ background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
          style={{ background: '#F3F4F6' }}>
          <ChevronLeft className="w-4 h-4" style={{ color: '#374151' }} />
        </button>
        <h2 className="text-base font-bold" style={{ color: '#111' }}>Détails du transfert</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-5 pb-8 space-y-4">

          {/* Amount card */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: gradient }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {tx.type === 'send' ? "J'envoie" : tx.type === 'receive' ? 'Je reçois' : 'Montant'}
              </p>
              <p className="text-3xl font-extrabold text-white tabular-nums" style={{ letterSpacing: '-0.03em' }}>
                {curr?.symbol}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {curr?.code}
              </p>
              {toCurr && tx.target_amount != null && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Le bénéficiaire reçoit</p>
                  <p className="text-xl font-bold text-white mt-0.5 tabular-nums">
                    {toCurr.symbol}{tx.target_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {toCurr.code}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info rows */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #F3F4F6' }}>
            {[
              tx.recipient_name ? { label: 'Bénéficiaire', value: tx.recipient_name } : null,
              { label: 'Moyen de paiement', value: tx.currency + ' Wallet' },
              { label: 'Date & heure', value: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + ' · ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
              tx.reference ? { label: 'Référence', value: tx.reference } : null,
              { label: 'Frais', value: tx.fee ? `${curr?.symbol ?? ''}${tx.fee.toFixed(2)}` : 'Aucun' },
              { label: 'Statut', value: tx.status === 'completed' ? 'Complété' : tx.status === 'pending' ? 'En attente' : tx.status },
            ].filter(Boolean).map((row, i, arr) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>{row!.label}</p>
                <p className="text-sm font-semibold" style={{ color: '#111', maxWidth: 200, textAlign: 'right' }}>{row!.value}</p>
              </div>
            ))}
          </div>

          {/* Get Receipt */}
          <button className="w-full h-12 rounded-2xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
            style={{ background: '#9fe870', color: '#0e0f0c' }}>
            Obtenir le reçu
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stats tab ─────────────────────────────────────────────────────────────────

function StatsTab({ accounts, transactions, loading }: {
  accounts: CurrencyAccount[]
  transactions: Transaction[]
  loading: boolean
}) {
  const toUSD = (tx: Transaction) => tx.amount * getRate(tx.currency, 'USD')

  const totalBalance = accounts.reduce((s, a) => s + a.balance * getRate(a.currency, 'USD'), 0)
  const totalSpending = transactions
    .filter(t => t.type === 'send' || t.type === 'withdraw' || t.type === 'bill_payment')
    .reduce((s, t) => s + toUSD(t), 0)

  // Monthly area chart — last 6 months
  const areaData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const label = d.toLocaleDateString('fr-FR', { month: 'short' })
      const txsInMonth = transactions.filter(t => {
        const td = new Date(t.created_at)
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
      })
      return {
        month: label,
        dépenses: Math.round(txsInMonth.filter(t => t.type === 'send' || t.type === 'withdraw' || t.type === 'bill_payment').reduce((s, t) => s + toUSD(t), 0)),
        reçus: Math.round(txsInMonth.filter(t => t.type === 'receive' || t.type === 'deposit').reduce((s, t) => s + toUSD(t), 0)),
      }
    })
  }, [transactions])

  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-4">
      {/* Card carousel */}
      <div>
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>Mes comptes</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Mis à jour {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
          {loading
            ? [1, 2, 3].map(i => <div key={i} className="w-52 h-28 rounded-2xl bg-gray-100 animate-pulse shrink-0" />)
            : accounts.map(acc => {
                const curr = getCurrency(acc.currency)
                const grad = CARD_GRADIENTS[acc.currency] ?? DEFAULT_GRADIENT
                const usdVal = acc.balance * getRate(acc.currency, 'USD')
                return (
                  <div key={acc.id} className="relative rounded-2xl overflow-hidden shrink-0 p-4 flex flex-col justify-between"
                    style={{ width: 200, height: 110, background: grad }}>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                    <div className="relative z-10">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>{curr?.flag} {acc.currency}</p>
                      <p className="text-xl font-extrabold text-white tabular-nums mt-1" style={{ letterSpacing: '-0.02em' }}>
                        {formatCurrency(acc.balance, acc.currency)}
                      </p>
                    </div>
                    <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      ≈ ${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )
              })}
        </div>
      </div>

      {/* Balance + Spending */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Total Balance</p>
          {loading
            ? <div className="h-7 w-28 rounded-lg bg-gray-100 animate-pulse" />
            : <p className="text-xl font-extrabold tabular-nums" style={{ color: '#111', letterSpacing: '-0.02em' }}>
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>}
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Total Dépensé</p>
          {loading
            ? <div className="h-7 w-28 rounded-lg bg-gray-100 animate-pulse" />
            : <p className="text-xl font-extrabold tabular-nums" style={{ color: '#F43F5E', letterSpacing: '-0.02em' }}>
                ${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>}
        </div>
      </div>

      {/* Area chart */}
      <div className="mx-4 rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: '#111' }}>Dépenses mensuelles</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>6 derniers mois · USD</p>
        </div>
        {loading
          ? <Skeleton className="h-36 rounded-xl" />
          : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={areaData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRecv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9fe870" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9fe870" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, fontSize: 11 }}
                  cursor={{ stroke: '#F3F4F6', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="dépenses" name="Dépenses" stroke="#F43F5E" strokeWidth={2} fill="url(#gradDep)" />
                <Area type="monotone" dataKey="reçus" name="Reçus" stroke="#9fe870" strokeWidth={2} fill="url(#gradRecv)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>
    </div>
  )
}

// ── History tab ───────────────────────────────────────────────────────────────

const PERIODS = ['Jour', 'Semaine', 'Mois', 'Année'] as const
type Period = typeof PERIODS[number]

function HistoryTab({ accounts, transactions, loading }: {
  accounts: CurrencyAccount[]
  transactions: Transaction[]
  loading: boolean
}) {
  const [period, setPeriod] = useState<Period>('Mois')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [showTransferDetails, setShowTransferDetails] = useState(false)

  const now = new Date()
  const currentMonthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const filteredByPeriod = useMemo(() => {
    const d = new Date()
    switch (period) {
      case 'Jour': { const start = new Date(d); start.setHours(0,0,0,0); return transactions.filter(t => new Date(t.created_at) >= start) }
      case 'Semaine': { const start = new Date(d); start.setDate(d.getDate() - 7); return transactions.filter(t => new Date(t.created_at) >= start) }
      case 'Mois': { return transactions.filter(t => { const td = new Date(t.created_at); return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() }) }
      case 'Année': { return transactions.filter(t => new Date(t.created_at).getFullYear() === d.getFullYear()) }
    }
  }, [transactions, period])

  const toUSD = (tx: Transaction) => tx.amount * getRate(tx.currency, 'USD')
  const totalIn = filteredByPeriod.filter(t => t.type === 'receive' || t.type === 'deposit').reduce((s, t) => s + toUSD(t), 0)

  // Bar chart: per account spending in period
  const barData = useMemo(() => accounts.map(acc => ({
    name: acc.currency,
    montant: Math.round(filteredByPeriod.filter(t => t.currency === acc.currency && (t.type === 'send' || t.type === 'withdraw' || t.type === 'bill_payment')).reduce((s, t) => s + t.amount, 0)),
  })).filter(d => d.montant > 0), [accounts, filteredByPeriod])

  const grouped = useMemo(() => groupByDate(filteredByPeriod), [filteredByPeriod])

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="mx-4 rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <p className="text-xs mb-1 capitalize" style={{ color: '#9CA3AF' }}>Reçu en {currentMonthName}</p>
        {loading
          ? <div className="h-8 w-36 rounded-lg bg-gray-100 animate-pulse" />
          : <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#111', letterSpacing: '-0.03em' }}>
              ${totalIn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>}
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 px-4">
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className="flex-1 h-9 rounded-xl text-sm font-semibold cursor-pointer tr"
            style={period === p
              ? { background: '#9fe870', color: '#0e0f0c' }
              : { background: '#F3F4F6', color: '#9CA3AF' }}>
            {p}
          </button>
        ))}
      </div>

      {/* Account bar chart */}
      {barData.length > 0 && (
        <div className="mx-4 rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#374151' }}>Dépenses par compte</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={barData} barSize={28} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, fontSize: 11 }}
                cursor={{ fill: '#F9FAFB' }}
              />
              <Bar dataKey="montant" name="Dépenses" radius={[6, 6, 0, 0]}
                fill="#9fe870"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grouped transaction list */}
      <div className="px-4 space-y-4 pb-4">
        {loading ? (
          [1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#fff', border: '1px solid #F3F4F6' }}>
            <p className="text-sm font-semibold" style={{ color: '#374151' }}>Aucune transaction</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>pour cette période</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label}>
              <p className="text-xs font-bold mb-2" style={{ color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {group.label}
              </p>
              <div className="space-y-2">
                {group.txs.map(tx => {
                  const curr = getCurrency(tx.currency)
                  const { isSend } = txSign(tx)
                  const amountStr = txAmountStr(tx)
                  const amountColor = tx.type === 'convert' ? '#374151' : isSend ? '#F43F5E' : '#22C55E'
                  return (
                    <button key={tx.id}
                      onClick={() => {
                        setSelectedTx(tx)
                        setShowTransferDetails(tx.type === 'send' || tx.type === 'receive')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left cursor-pointer tr"
                      style={{ background: '#fff', border: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <TxBrandIcon tx={tx} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#111' }}>{txLabel(tx)}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                          {new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {tx.reference ? ` · ${tx.reference}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums" style={{ color: amountColor }}>{amountStr}</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{curr?.code}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transaction detail sheet */}
      {selectedTx && !showTransferDetails && (
        <TxDetailSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}

      {/* Transfer details full screen */}
      {selectedTx && showTransferDetails && (
        <TransferDetailsView tx={selectedTx} onClose={() => { setSelectedTx(null); setShowTransferDetails(false) }} />
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function HistoryPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'stats' | 'history'>('stats')

  useEffect(() => {
    if (!user) return
    async function load() {
      const [a, t] = await Promise.all([
        supabase.from('currency_accounts').select('*').eq('user_id', user!.id).order('is_main', { ascending: false }),
        supabase.from('transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      ])
      if (a.data) setAccounts(a.data)
      if (t.data) setTransactions(t.data)
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div className="min-h-screen pb-28 md:pb-8 overflow-x-hidden" style={{ background: '#F9FAFB', maxWidth: '100vw' }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-30 px-4 pt-5 pb-3" style={{ background: '#F9FAFB' }}>
        <h1 className="text-xl font-extrabold mb-4" style={{ color: '#111', letterSpacing: '-0.03em' }}>Statistiques</h1>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: '#F3F4F6' }}>
          <button
            onClick={() => setTab('stats')}
            className="flex-1 h-9 rounded-lg text-sm font-semibold cursor-pointer tr"
            style={tab === 'stats'
              ? { background: '#fff', color: '#111', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: '#9CA3AF' }}>
            Statistiques
          </button>
          <button
            onClick={() => setTab('history')}
            className="flex-1 h-9 rounded-lg text-sm font-semibold cursor-pointer tr"
            style={tab === 'history'
              ? { background: '#fff', color: '#111', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: '#9CA3AF' }}>
            Historique
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'stats'
        ? <StatsTab accounts={accounts} transactions={transactions} loading={loading} />
        : <HistoryTab accounts={accounts} transactions={transactions} loading={loading} />}
    </div>
  )
}
