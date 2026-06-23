import { useEffect, useState } from 'react'
import { PROVIDERS, BILL_CATEGORIES, type Provider } from '@/lib/haiti-providers'
import { getAdminSettings, updateAdminSetting } from '@/lib/admin-api'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle, XCircle, X } from 'lucide-react'

type ProviderStats = { count: number; total: number }

function Toast({ message, ok }: { message: string; ok: boolean }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold"
      style={{ background: ok ? '#0D1B4B' : '#DC2626', color: 'white' }}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  )
}

export function AdminProvidersPage() {
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({})
  const [stats, setStats] = useState<Record<string, ProviderStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Provider | null>(null)
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      // Load provider status from admin settings
      const settings = await getAdminSettings()
      const ps = (settings['providers_status'] ?? {}) as Record<string, boolean>
      setProviderStatus(ps)

      // Load bill payment stats per provider
      const { data } = await supabase
        .from('bill_payments')
        .select('provider_id, amount, status')
      if (data) {
        const s: Record<string, ProviderStats> = {}
        for (const row of data) {
          if (!s[row.provider_id]) s[row.provider_id] = { count: 0, total: 0 }
          s[row.provider_id].count++
          if (row.status === 'completed') s[row.provider_id].total += row.amount
        }
        setStats(s)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleProvider(id: string) {
    const current = providerStatus[id] !== false
    const newStatus = { ...providerStatus, [id]: !current }
    setSaving(true)
    try {
      await updateAdminSetting('providers_status', newStatus as Record<string, unknown>)
      setProviderStatus(newStatus)
      showToast(`Fournisseur ${!current ? 'activé' : 'désactivé'}`, true)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setSaving(false)
    }
  }

  function getCategoryLabel(id: string) {
    return BILL_CATEGORIES.find(c => c.id === id)?.label ?? id
  }

  const isActive = (id: string) => providerStatus[id] !== false

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Fournisseurs</h2>
        <p className="text-sm text-gray-500 mt-0.5">{PROVIDERS.length} fournisseurs configurés</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-6" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Erreur</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button onClick={load} className="text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer" style={{ background: '#DC2626', color: 'white' }}>
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#F3F4F8' }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {PROVIDERS.map(p => {
            const st = stats[p.id] ?? { count: 0, total: 0 }
            const active = isActive(p.id)
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                style={{ background: 'white', border: `1px solid ${active ? '#E5E7EB' : '#FECACA'}`, opacity: active ? 1 : 0.7 }}
                onClick={() => setSelected(p)}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: p.bg }}>
                  {p.logo
                    ? <img src={p.logo} alt={p.shortName} className="w-8 h-8 object-contain rounded" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    : p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#F3F4F8', color: '#6B7280' }}>{getCategoryLabel(p.category)}</span>
                    {p.instant && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#059669' }}>Instantané</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{st.count} paiements · {st.total.toLocaleString('fr-HT')} HTG</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full`}
                    style={{ background: active ? '#D1FAE5' : '#FEE2E2', color: active ? '#059669' : '#DC2626' }}>
                    {active ? 'Actif' : 'Inactif'}
                  </span>
                  <button
                    disabled={saving}
                    onClick={e => { e.stopPropagation(); toggleProvider(p.id) }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer disabled:opacity-50"
                    style={{ background: active ? '#FEE2E2' : '#D1FAE5', color: active ? '#DC2626' : '#059669' }}
                  >
                    {active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <h3 className="text-base font-bold text-gray-900">Détail fournisseur</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer" style={{ background: '#F3F4F8' }}>
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: selected.bg }}>
                  {selected.emoji}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500">{selected.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Catégorie', value: getCategoryLabel(selected.category) },
                  { label: 'Priorité', value: `Priorité ${selected.priority}` },
                  { label: 'Instantané', value: selected.instant ? 'Oui' : 'Non' },
                  { label: 'Frais', value: `${selected.fee}%` },
                  { label: 'Paiements', value: String(stats[selected.id]?.count ?? 0) },
                  { label: 'Volume (HTG)', value: (stats[selected.id]?.total ?? 0).toLocaleString('fr-HT') },
                  ...(selected.minAmount ? [{ label: 'Min', value: `${selected.minAmount} HTG` }] : []),
                  ...(selected.maxAmount ? [{ label: 'Max', value: `${selected.maxAmount} HTG` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Champs requis</p>
                <div className="space-y-1.5">
                  {selected.fields.map(f => (
                    <div key={f.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: '#F9FAFB' }}>
                      <span className="text-sm text-gray-700">{f.label}</span>
                      {f.required && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>Requis</span>}
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={saving}
                onClick={() => toggleProvider(selected.id)}
                className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                style={isActive(selected.id)
                  ? { background: '#FEE2E2', color: '#DC2626' }
                  : { background: '#D1FAE5', color: '#059669' }}
              >
                {isActive(selected.id) ? 'Désactiver ce fournisseur' : 'Activer ce fournisseur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} ok={toast.ok} />}
    </div>
  )
}
