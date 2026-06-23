import { useEffect, useState } from 'react'
import { getAuditLogs, type AuditLog } from '@/lib/admin-api'
import { AlertCircle, Shield } from 'lucide-react'

function ActionBadge({ action }: { action: string }) {
  let bg = '#F3F4F6'
  let color = '#6B7280'
  if (action.includes('user')) { bg = '#DBEAFE'; color = '#2563EB' }
  else if (action.includes('transaction')) { bg = '#D1FAE5'; color = '#059669' }
  else if (action.includes('setting')) { bg = '#EDE9FE'; color = '#7C3AED' }
  else if (action.includes('bill') || action.includes('payment')) { bg = '#FEF3C7'; color = '#D97706' }
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: bg, color }}>{action}</span>
}

const ACTIONS = [
  '', 'update_user', 'update_transaction_status', 'update_setting',
]
const ENTITY_TYPES = ['', 'user', 'transaction', 'setting', 'bill_payment']

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const LIMIT = 50

  async function load(p = page, a = actionFilter, e = entityFilter) {
    setLoading(true)
    setError(null)
    try {
      const result = await getAuditLogs(p, LIMIT, a || undefined, e || undefined)
      setLogs(result.data)
      setTotal(result.total)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1, actionFilter, entityFilter) }, [actionFilter, entityFilter])

  function handlePageChange(p: number) {
    setPage(p)
    load(p, actionFilter, entityFilter)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Audit logs</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} entrées · lecture seule</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl text-sm border outline-none cursor-pointer"
          style={{ borderColor: '#E5E7EB', background: 'white' }}
        >
          <option value="">Toutes les actions</option>
          {ACTIONS.filter(Boolean).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={e => { setEntityFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl text-sm border outline-none cursor-pointer"
          style={{ borderColor: '#E5E7EB', background: 'white' }}
        >
          <option value="">Tous les types</option>
          {ENTITY_TYPES.filter(Boolean).map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
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
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#F3F4F8' }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Shield className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">Aucun log d'audit</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Date', 'Admin', 'Action', 'Entité', 'ID entité', 'Résultat'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-800">{log.admin_email}</p>
                    </td>
                    <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.entity_type ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">
                      {log.entity_id ? log.entity_id.slice(0, 10) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {log.success
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#059669' }}>Succès</span>
                        : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>Échec</span>
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
