import { useEffect, useState } from 'react'
import { getAdminSettings, updateAdminSetting, type AdminSettings } from '@/lib/admin-api'
import { AlertCircle, Settings, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

function Toast({ message, ok }: { message: string; ok: boolean }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold"
      style={{ background: ok ? '#0D1B4B' : '#DC2626', color: 'white' }}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-11 h-6 rounded-full relative cursor-pointer transition-colors"
      style={{ background: checked ? '#9fe870' : '#D1D5DB' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

type Section = 'platform' | 'fees' | 'limits' | 'notifications_cfg'

const SECTION_LABELS: Record<Section, string> = {
  platform: 'Plateforme',
  fees: 'Frais',
  limits: 'Limites',
  notifications_cfg: 'Notifications',
}

const SENSITIVE_SECTIONS: Section[] = ['fees', 'limits']

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({})
  const [draft, setDraft] = useState<AdminSettings>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Section | null>(null)
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    platform: true, fees: true, limits: true, notifications_cfg: true,
  })
  const [confirm, setConfirm] = useState<{ section: Section; onConfirm: () => void } | null>(null)

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const s = await getAdminSettings()
      setSettings(s)
      setDraft(JSON.parse(JSON.stringify(s)))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function updateDraft(section: Section, key: string, value: unknown) {
    setDraft(prev => ({
      ...prev,
      [section]: { ...(prev[section] ?? {}), [key]: value },
    }))
  }

  async function save(section: Section) {
    setSaving(section)
    try {
      await updateAdminSetting(section, draft[section] ?? {})
      setSettings(prev => ({ ...prev, [section]: draft[section] }))
      showToast('Paramètres sauvegardés', true)
      setConfirm(null)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setSaving(null)
    }
  }

  function handleSave(section: Section) {
    if (SENSITIVE_SECTIONS.includes(section)) {
      setConfirm({ section, onConfirm: () => save(section) })
    } else {
      save(section)
    }
  }

  function toggleSection(s: Section) {
    setOpenSections(prev => ({ ...prev, [s]: !prev[s] }))
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: '#F3F4F8' }} />
        ))}
      </div>
    )
  }

  const sections: Section[] = ['platform', 'fees', 'limits', 'notifications_cfg']
  const d = draft

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configuration de la plateforme</p>
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

      <div className="space-y-4">
        {sections.map(section => {
          const isOpen = openSections[section]
          const vals = d[section] ?? {}
          return (
            <div key={section} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
              {/* Section header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
                style={{ borderBottom: isOpen ? '1px solid #E5E7EB' : 'none' }}
                onClick={() => toggleSection(section)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F8' }}>
                    <Settings className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{SECTION_LABELS[section]}</p>
                  {SENSITIVE_SECTIONS.includes(section) && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#D97706' }}>Sensible</span>
                  )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {isOpen && (
                <div className="px-5 py-4 space-y-4">
                  {/* Platform fields */}
                  {section === 'platform' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nom de la plateforme</label>
                        <input
                          type="text"
                          value={String(vals['name'] ?? '')}
                          onChange={e => updateDraft('platform', 'name', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                          style={{ borderColor: '#E5E7EB' }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Devise par défaut</label>
                          <select
                            value={String(vals['currency_default'] ?? 'HTG')}
                            onChange={e => updateDraft('platform', 'currency_default', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none cursor-pointer"
                            style={{ borderColor: '#E5E7EB' }}
                          >
                            <option value="HTG">HTG</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Langue par défaut</label>
                          <select
                            value={String(vals['lang_default'] ?? 'fr')}
                            onChange={e => updateDraft('platform', 'lang_default', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none cursor-pointer"
                            style={{ borderColor: '#E5E7EB' }}
                          >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Mode maintenance</p>
                          <p className="text-xs text-gray-500">Bloque l'accès pour les utilisateurs</p>
                        </div>
                        <Toggle
                          checked={Boolean(vals['maintenance_mode'])}
                          onChange={v => updateDraft('platform', 'maintenance_mode', v)}
                        />
                      </div>
                    </>
                  )}

                  {/* Fees fields */}
                  {section === 'fees' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { key: 'transfer_pct', label: 'Frais transfert (%)', step: '0.1' },
                        { key: 'bill_payment_flat', label: 'Frais facture (HTG fixe)', step: '1' },
                        { key: 'min_fee', label: 'Frais minimum (HTG)', step: '1' },
                      ].map(({ key, label, step }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{label}</label>
                          <input
                            type="number"
                            step={step}
                            min="0"
                            value={Number(vals[key] ?? 0)}
                            onChange={e => updateDraft('fees', key, parseFloat(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                            style={{ borderColor: '#E5E7EB' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Limits fields */}
                  {section === 'limits' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { key: 'per_transaction', label: 'Limite par transaction (HTG)' },
                        { key: 'daily', label: 'Limite journalière (HTG)' },
                        { key: 'monthly', label: 'Limite mensuelle (HTG)' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{label}</label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={Number(vals[key] ?? 0)}
                            onChange={e => updateDraft('limits', key, parseFloat(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                            style={{ borderColor: '#E5E7EB' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notifications cfg fields */}
                  {section === 'notifications_cfg' && (
                    <div className="space-y-4">
                      {[
                        { key: 'email_enabled', label: 'Email activé', desc: 'Envoyer des notifications par email' },
                        { key: 'sms_enabled', label: 'SMS activé', desc: 'Envoyer des notifications par SMS' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between py-1">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{label}</p>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                          <Toggle
                            checked={Boolean(vals[key])}
                            onChange={v => updateDraft('notifications_cfg', key, v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                    <button
                      disabled={saving === section}
                      onClick={() => handleSave(section)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                      style={{ background: '#0D1B4B', color: 'white' }}
                    >
                      {saving === section ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: 'white' }}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Confirmer la modification</h3>
            <p className="text-sm text-gray-600 mb-5">
              Vous allez modifier les paramètres de <strong>{SECTION_LABELS[confirm.section]}</strong>.
              Ces changements affectent directement les utilisateurs et transactions.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: '#F3F4F8', color: '#374151' }}>
                Annuler
              </button>
              <button
                onClick={confirm.onConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: '#0D1B4B', color: 'white' }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} ok={toast.ok} />}
    </div>
  )
}
