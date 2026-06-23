import { useEffect, useState } from 'react'
import { getAdminNotifications, type AdminNotification } from '@/lib/admin-api'
import { AlertCircle, Bell } from 'lucide-react'

type Tab = 'all' | 'unread'

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    bill_payment:  { bg: '#D1FAE5', color: '#059669' },
    transfer:      { bg: '#DBEAFE', color: '#2563EB' },
    deposit:       { bg: '#EDE9FE', color: '#7C3AED' },
    withdraw:      { bg: '#FEF3C7', color: '#D97706' },
    system:        { bg: '#F3F4F6', color: '#6B7280' },
    security:      { bg: '#FEE2E2', color: '#DC2626' },
  }
  const s = map[type] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>{type}</span>
}

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const LIMIT = 30

  async function load(p = page) {
    setLoading(true)
    setError(null)
    try {
      const result = await getAdminNotifications(p, LIMIT)
      setNotifications(result.data)
      setTotal(result.total)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handlePageChange(p: number) {
    setPage(p)
    load(p)
  }

  const filtered = tab === 'all' ? notifications : notifications.filter(n => !n.read)
  const readCount = notifications.filter(n => n.read).length
  const unreadCount = notifications.filter(n => !n.read).length
  const readRate = total > 0 ? Math.round((readCount / notifications.length) * 100) : 0
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} notifications au total</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: total, color: '#6366f1' },
          { label: 'Lues', value: readCount, color: '#059669' },
          { label: 'Non lues', value: unreadCount, color: '#D97706' },
          { label: 'Taux de lecture', value: `${readRate}%`, color: '#2563EB' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['all', 'Toutes'], ['unread', 'Non lues']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={tab === key
              ? { background: '#0D1B4B', color: 'white' }
              : { background: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-6" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Erreur</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button onClick={() => load()} className="text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer" style={{ background: '#DC2626', color: 'white' }}>
            Réessayer
          </button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#F3F4F8' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">Aucune notification</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Utilisateur', 'Type', 'Titre', 'Message', 'Date', 'Lu'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} style={{ borderTop: '1px solid #F3F4F6', background: n.read ? 'transparent' : 'rgba(254,243,199,0.3)' }}>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-800">{n.user_name}</p>
                      <p className="text-[10px] text-gray-400">{n.user_email}</p>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={n.type} /></td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-[200px] truncate">{n.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[250px] truncate">{n.body}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(n.created_at).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      {n.read
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#059669' }}>Lu</span>
                        : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#D97706' }}>Non lu</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40"
            style={{ background: 'white', border: '1px solid #E5E7EB', color: '#374151' }}>
            Précédent
          </button>
          <span className="text-sm text-gray-500">Page {page} sur {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40"
            style={{ background: 'white', border: '1px solid #E5E7EB', color: '#374151' }}>
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
