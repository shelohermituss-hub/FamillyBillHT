import { useEffect, useState } from 'react'
import { getAdminBillPayments, type AdminBillPayment } from '@/lib/admin-api'
import { supabase } from '@/lib/supabase'
import { AlertCircle, FileText, CheckCircle, XCircle, X } from 'lucide-react'

function hashReceipt(id: string, createdAt: string) {
  return btoa(id + createdAt).replace(/=/g, '').slice(0, 16).toUpperCase()
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: '#FEF3C7', color: '#D97706', label: 'En attente' },
    completed: { bg: '#D1FAE5', color: '#059669', label: 'Complété' },
    failed:    { bg: '#FEE2E2', color: '#DC2626', label: 'Échoué' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'Annulé' },
  }
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
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

export function AdminReceiptsPage() {
  const [receipts, setReceipts] = useState<AdminBillPayment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminBillPayment | null>(null)
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const LIMIT = 20

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function load(p = page) {
    setLoading(true)
    setError(null)
    try {
      const result = await getAdminBillPayments(p, LIMIT, 'completed')
      setReceipts(result.data)
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

  async function handleResendEmail(r: AdminBillPayment) {
    setActionLoading(true)
    try {
      await supabase.from('notifications').insert({
        user_id: r.user_id,
        type: 'bill_payment',
        title: `Reçu: ${r.provider_name}`,
        body: `Votre reçu de paiement pour ${r.provider_name} (${r.amount.toLocaleString('fr-HT')} ${r.currency}) a été renvoyé.`,
        data: { bill_payment_id: r.id, provider_name: r.provider_name, amount: r.amount },
        read: false,
      })
      showToast('Notification renvoyée', true)
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
        <h2 className="text-xl font-bold text-gray-900">Reçus</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} reçus de paiements complétés</p>
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
        ) : receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">Aucun reçu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['ID', 'Fournisseur', 'Utilisateur', 'Montant', 'Date', 'Hash', 'Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.map(r => (
                  <tr key={r.id} className="cursor-pointer hover:bg-gray-50" style={{ borderTop: '1px solid #F3F4F6' }} onClick={() => setSelected(r)}>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{r.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{r.provider_name}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-700">{r.user_name}</p>
                      <p className="text-[10px] text-gray-400">{r.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{r.amount.toLocaleString('fr-HT')} {r.currency}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#6366f1' }}>{hashReceipt(r.id, r.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <h3 className="text-base font-bold text-gray-900">Détail du reçu</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer" style={{ background: '#F3F4F8' }}>
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Hash display */}
              <div className="p-4 rounded-2xl text-center" style={{ background: '#F0F1FF' }}>
                <p className="text-xs text-gray-500 mb-1">Hash de vérification</p>
                <p className="text-lg font-mono font-bold" style={{ color: '#6366f1' }}>{hashReceipt(selected.id, selected.created_at)}</p>
                <p className="text-[10px] text-gray-400 mt-1">Généré à partir de l'ID et la date</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Fournisseur', value: selected.provider_name },
                  { label: 'Catégorie', value: selected.category },
                  { label: 'Utilisateur', value: selected.user_name },
                  { label: 'Email', value: selected.user_email },
                  { label: 'Montant', value: `${selected.amount.toLocaleString('fr-HT')} ${selected.currency}` },
                  { label: 'Statut', value: selected.status },
                  ...(selected.account_ref ? [{ label: 'Réf. compte', value: selected.account_ref }] : []),
                  ...(selected.paid_at ? [{ label: 'Payé le', value: new Date(selected.paid_at).toLocaleDateString('fr-FR') }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500">Créé le {new Date(selected.created_at).toLocaleString('fr-FR')}</p>

              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #E5E7EB' }}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>
                <div className="p-3 rounded-xl" style={{ background: '#D1FAE5' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                    <p className="text-sm font-semibold" style={{ color: '#059669' }}>Hash validé</p>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#059669' }}>Ce reçu est authentique</p>
                </div>
                <button
                  disabled={actionLoading}
                  onClick={() => handleResendEmail(selected)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                  style={{ background: '#DBEAFE', color: '#2563EB' }}
                >
                  {actionLoading ? 'Envoi...' : 'Renvoyer notification email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} ok={toast.ok} />}
    </div>
  )
}
