import { useEffect, useState } from 'react'
import { getAdminMetrics, getAdminTransactions, type AdminMetrics, type AdminTransaction } from '@/lib/admin-api'
import { AlertCircle, RefreshCw, TrendingUp, Users, ArrowLeftRight, CheckCircle, XCircle, FileText } from 'lucide-react'

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
      <div className="h-3 w-24 rounded mb-3" style={{ background: '#E5E7EB' }} />
      <div className="h-8 w-32 rounded mb-2" style={{ background: '#E5E7EB' }} />
      <div className="h-3 w-16 rounded" style={{ background: '#F3F4F8' }} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:    { bg: '#FEF3C7', color: '#D97706', label: 'En attente' },
    processing: { bg: '#DBEAFE', color: '#2563EB', label: 'En cours' },
    completed:  { bg: '#D1FAE5', color: '#059669', label: 'Complétée' },
    failed:     { bg: '#FEE2E2', color: '#DC2626', label: 'Échouée' },
    cancelled:  { bg: '#F3F4F6', color: '#6B7280', label: 'Annulée' },
  }
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    send: 'Envoi', receive: 'Réception', convert: 'Conversion',
    deposit: 'Dépôt', withdraw: 'Retrait', bill_payment: 'Facture',
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#F3F4F8', color: '#6B7280' }}>
      {map[type] ?? type}
    </span>
  )
}

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [txs, setTxs] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const m = await getAdminMetrics()
      setMetrics(m)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadTxs() {
    setTxLoading(true)
    try {
      const result = await getAdminTransactions(1, 10)
      setTxs(result.data)
    } catch {
      // silent
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadTxs()
  }, [])

  const kpis = metrics ? [
    { icon: ArrowLeftRight, label: 'Transactions aujourd\'hui', value: metrics.transactions_today, color: '#6366f1', suffix: '' },
    { icon: TrendingUp,     label: 'Montant traité (HTG)',      value: metrics.amount_today.toLocaleString('fr-HT'), color: '#9fe870', suffix: '' },
    { icon: Users,          label: 'Utilisateurs',              value: metrics.total_users,        color: '#0ea5e9', suffix: '' },
    { icon: CheckCircle,    label: 'Taux de succès',            value: metrics.success_rate,       color: '#10b981', suffix: '%' },
    { icon: XCircle,        label: 'Échecs aujourd\'hui',       value: metrics.transactions_failed, color: '#ef4444', suffix: '' },
    { icon: FileText,       label: 'Factures payées',           value: metrics.bill_payments_today, color: '#f59e0b', suffix: '' },
  ] : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tableau de bord</h2>
          <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble en temps réel</p>
        </div>
        <button
          onClick={() => { loadData(); loadTxs() }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          style={{ background: '#0D1B4B', color: 'white' }}
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-6" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Erreur de chargement</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button onClick={loadData} className="text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer" style={{ background: '#DC2626', color: 'white' }}>
            Réessayer
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map(({ icon: Icon, label, value, color, suffix }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
            </div>
          ))
        }
      </div>

      {/* Volume 30 days */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-5 md:col-span-2" style={{ background: '#0D1B4B' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Volume 30 jours</p>
            <p className="text-3xl font-bold text-white">{metrics.total_volume_30d.toLocaleString('fr-HT')} HTG</p>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{metrics.new_users_30d} nouveaux utilisateurs</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: '#9fe870' }}>
            <p className="text-xs font-medium mb-2" style={{ color: '#0D1B4B', opacity: 0.7 }}>Actifs aujourd'hui</p>
            <p className="text-3xl font-bold" style={{ color: '#0D1B4B' }}>{metrics.active_users_today}</p>
            <p className="text-sm mt-2" style={{ color: '#0D1B4B', opacity: 0.6 }}>utilisateurs uniques</p>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <h3 className="text-sm font-bold text-gray-900">Transactions récentes</h3>
        </div>
        {txLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#F3F4F8' }} />
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ArrowLeftRight className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">Aucune transaction</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['ID', 'Utilisateur', 'Type', 'Montant', 'Statut', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{tx.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-800">{tx.user_name}</p>
                      <p className="text-[10px] text-gray-400">{tx.user_email}</p>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{tx.amount.toLocaleString('fr-HT')} {tx.currency}</td>
                    <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
