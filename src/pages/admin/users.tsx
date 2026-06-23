import { useEffect, useRef, useState } from 'react'
import { getAdminUsers, updateAdminUser, type AdminUser } from '@/lib/admin-api'
import { AlertCircle, Search, X, CheckCircle, XCircle, Users } from 'lucide-react'

function StatusBadge({ verified }: { verified: boolean }) {
  return verified
    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#059669' }}>Vérifié</span>
    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>Non vérifié</span>
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    user:        { bg: '#F3F4F6', color: '#6B7280' },
    admin:       { bg: '#DBEAFE', color: '#2563EB' },
    super_admin: { bg: '#EDE9FE', color: '#7C3AED' },
  }
  const s = map[role] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>{role}</span>
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

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [confirm, setConfirm] = useState<{ action: string; label: string; payload: () => Promise<void> } | null>(null)
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 20

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function load(p = page, s = search, r = roleFilter) {
    setLoading(true)
    setError(null)
    try {
      const result = await getAdminUsers(p, LIMIT, s || undefined, r || undefined)
      setUsers(result.data)
      setTotal(result.total)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1, search, roleFilter) }, [roleFilter])

  function handleSearch(v: string) {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); load(1, v, roleFilter) }, 400)
  }

  function handlePageChange(p: number) {
    setPage(p)
    load(p, search, roleFilter)
  }

  async function doAction(action: () => Promise<void>, successMsg: string) {
    setActionLoading(true)
    try {
      await action()
      showToast(successMsg, true)
      setConfirm(null)
      setSelected(null)
      load(page, search, roleFilter)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} comptes enregistrés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none"
            style={{ borderColor: '#E5E7EB', background: 'white' }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl text-sm border outline-none cursor-pointer"
          style={{ borderColor: '#E5E7EB', background: 'white' }}
        >
          <option value="">Tous les rôles</option>
          <option value="user">Utilisateur</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
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

      {/* Table */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#F3F4F8' }} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Utilisateur', 'Rôle', 'Vérifié', 'Transactions', 'Inscrit', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="cursor-pointer hover:bg-gray-50" style={{ borderTop: '1px solid #F3F4F6' }} onClick={() => setSelected(u)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#9fe870', color: '#0D1B4B' }}>
                          {(u.full_name[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{u.full_name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3"><StatusBadge verified={u.verified} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.tx_count}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(u) }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                        style={{ background: '#F3F4F8', color: '#374151' }}
                      >
                        Détails
                      </button>
                    </td>
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

      {/* Detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <h3 className="text-base font-bold text-gray-900">Profil utilisateur</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer" style={{ background: '#F3F4F8' }}>
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: '#9fe870', color: '#0D1B4B' }}>
                  {(selected.full_name[0] ?? '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{selected.full_name}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={selected.role} />
                    <StatusBadge verified={selected.verified} />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Transactions', value: selected.tx_count },
                  { label: 'Solde HTG', value: `${selected.htg_balance.toLocaleString('fr-HT')} HTG` },
                  { label: 'Pays', value: selected.country ?? 'N/A' },
                  { label: 'Téléphone', value: selected.phone ?? 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {selected.last_tx_at && (
                <p className="text-xs text-gray-500">Dernière activité : {new Date(selected.last_tx_at).toLocaleString('fr-FR')}</p>
              )}

              <p className="text-xs text-gray-500">Inscrit le {new Date(selected.created_at).toLocaleDateString('fr-FR')}</p>

              {/* Actions */}
              <div className="space-y-2 pt-2" style={{ borderTop: '1px solid #E5E7EB' }}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>

                {selected.role === 'user' && (
                  <button
                    onClick={() => setConfirm({
                      action: `Promouvoir "${selected.full_name}" en admin`,
                      label: `Cette action changera le rôle de ${selected.full_name} en admin.`,
                      payload: async () => updateAdminUser(selected.id, { role: 'admin' }),
                    })}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: '#DBEAFE', color: '#2563EB' }}
                  >
                    Promouvoir admin
                  </button>
                )}
                {selected.role === 'admin' && (
                  <button
                    onClick={() => setConfirm({
                      action: `Rétrograder "${selected.full_name}"`,
                      label: `Cette action changera le rôle de ${selected.full_name} en utilisateur.`,
                      payload: async () => updateAdminUser(selected.id, { role: 'user' }),
                    })}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: '#FEE2E2', color: '#DC2626' }}
                  >
                    Rétrograder utilisateur
                  </button>
                )}
                <button
                  onClick={() => setConfirm({
                    action: `${selected.verified ? 'Désvérifier' : 'Vérifier'} "${selected.full_name}"`,
                    label: `Ce compte sera marqué comme ${selected.verified ? 'non vérifié' : 'vérifié'}.`,
                    payload: async () => updateAdminUser(selected.id, { verified: !selected.verified }),
                  })}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: selected.verified ? '#FEF3C7' : '#D1FAE5', color: selected.verified ? '#D97706' : '#059669' }}
                >
                  {selected.verified ? 'Marquer non vérifié' : 'Marquer vérifié'}
                </button>
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
            <h3 className="text-base font-bold text-gray-900 mb-2">{confirm.action}</h3>
            <p className="text-sm text-gray-600 mb-5">{confirm.label}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: '#F3F4F8', color: '#374151' }}>
                Annuler
              </button>
              <button
                disabled={actionLoading}
                onClick={() => doAction(confirm.payload, 'Action effectuée avec succès')}
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
