import { useEffect, useState } from 'react'
import { getAdminTransactions, updateAdminTransaction, type AdminTransaction } from '@/lib/admin-api'
import { AlertCircle, ArrowLeftRight, CheckCircle, XCircle, X } from 'lucide-react'

const STATUS_TABS = [
  { key: '', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'processing', label: 'En cours' },
  { key: 'completed', label: 'Complétées' },
  { key: 'failed', label: 'Échouées' },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:    { bg: '#FEF3C7', color: '#D97706', label: 'En attente' },
    processing: { bg: '#DBEAFE', color: '#2563EB', label: 'En cours' },
    completed:  { bg: '#D1FAE5', color: '#059669', label: 'Complétée' },
    failed:     { bg: '#FEE2E2', color: '#DC2626', label: 'Échouée' },
    cancelled:  { bg: '#F3F4F6', color: '#6B7280', label: 'Annulée' },
  }
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    send: 'Envoi', receive: 'Réception', convert: 'Conversion',
    deposit: 'Dépôt', withdraw: 'Retrait', bill_payment: 'Facture',
  }
  return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F3F4F8', color: '#6B7280' }}>{map[type] ?? type}</span>
}

function Toast({ message, ok }: { message: string; ok: boolean }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold"
      style={{ background: ok ? '#0D1B4B' : '#DC2626', color: 'white' }}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  )
}

export function AdminTransactionsPage() {
  const [txs, setTxs] = useState<AdminTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminTransaction | null>(null)
  const [confirm, setConfirm] = useState<{ label: string; action: () => Promise<void> } | null>(null)
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const LIMIT = 20

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function load(p = page, s = status) {
    setLoading(true)
    setError(null)
    try {
      const result = await getAdminTransactions(p, LIMIT, s || undefined)
      setTxs(result.data)
      setTotal(result.total)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setPage(1); load(1, status) }, [status])

  function handlePageChange(p: number) {
    setPage(p)
    load(p, status)
  }

  async function doAction(action: () => Promise<void>, successMsg: string) {
    setActionLoading(true)
    try {
      await action()
      showToast(successMsg, true)
      setConfirm(null)
      setSelected(null)
      load(page, status)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Transactions</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} transactions au total</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors"
            style={status === t.key
              ? { background: '#0D1B4B', color: 'white' }
              : { background: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }}
          >
            {t.label}
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

      {/* Table */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#F3F4F8' }} />
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowLeftRight className="w-12 h-12 mb-3 text-gray-300" />
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
                  <tr key={tx.id} className="cursor-pointer hover:bg-gray-50" style={{ borderTop: '1px solid #F3F4F6' }} onClick={() => { setSelected(tx); setNoteInput(tx.note ?? '') }}>
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

      {/* Pagination */}
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

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <h3 className="text-base font-bold text-gray-900">Détail transaction</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer" style={{ background: '#F3F4F8' }}>
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="text-sm font-mono text-gray-800">{selected.id}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Utilisateur', value: selected.user_name },
                  { label: 'Email', value: selected.user_email },
                  { label: 'Type', value: selected.type },
                  { label: 'Montant', value: `${selected.amount.toLocaleString('fr-HT')} ${selected.currency}` },
                  { label: 'Frais', value: `${selected.fee} ${selected.currency}` },
                  { label: 'Référence', value: selected.reference ?? 'N/A' },
                  ...(selected.recipient_name ? [{ label: 'Bénéficiaire', value: selected.recipient_name }] : []),
                  ...(selected.target_amount ? [{ label: 'Montant cible', value: `${selected.target_amount} ${selected.target_currency}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Note</p>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder="Ajouter une note..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
                  style={{ borderColor: '#E5E7EB' }}
                />
              </div>

              <p className="text-xs text-gray-500">Créée le {new Date(selected.created_at).toLocaleString('fr-FR')}</p>
              {selected.completed_at && (
                <p className="text-xs text-gray-500">Complétée le {new Date(selected.completed_at).toLocaleString('fr-FR')}</p>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #E5E7EB' }}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>

                {(selected.status === 'pending' || selected.status === 'processing') && (
                  <>
                    <button
                      onClick={() => setConfirm({
                        label: 'Marquer cette transaction comme complétée ?',
                        action: () => updateAdminTransaction(selected.id, 'completed', noteInput || undefined),
                      })}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: '#D1FAE5', color: '#059669' }}
                    >
                      Marquer complétée
                    </button>
                    <button
                      onClick={() => setConfirm({
                        label: 'Annuler cette transaction ?',
                        action: () => updateAdminTransaction(selected.id, 'cancelled', noteInput || undefined),
                      })}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ background: '#FEE2E2', color: '#DC2626' }}
                    >
                      Annuler
                    </button>
                  </>
                )}
                {selected.status === 'completed' && (
                  <button
                    onClick={() => setConfirm({
                      label: 'Marquer cette transaction comme suspecte ? Une note sera ajoutée.',
                      action: () => updateAdminTransaction(selected.id, 'completed', `[SUSPECTE] ${noteInput}`),
                    })}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: '#FEF3C7', color: '#D97706' }}
                  >
                    Marquer suspecte
                  </button>
                )}
                {selected.status === 'failed' && (
                  <button
                    onClick={() => setConfirm({
                      label: 'Relancer cette transaction (retour en attente) ?',
                      action: () => updateAdminTransaction(selected.id, 'pending', noteInput || undefined),
                    })}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: '#DBEAFE', color: '#2563EB' }}
                  >
                    Relancer (retour pending)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: 'white' }}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Confirmer l'action</h3>
            <p className="text-sm text-gray-600 mb-5">{confirm.label}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: '#F3F4F8', color: '#374151' }}>
                Annuler
              </button>
              <button
                disabled={actionLoading}
                onClick={() => doAction(confirm.action, 'Transaction mise à jour')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: '#0D1B4B', color: 'white' }}
              >
                {actionLoading ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} ok={toast.ok} />}
    </div>
  )
}
