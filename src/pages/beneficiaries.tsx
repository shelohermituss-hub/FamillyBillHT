import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Star,
  Plus,
  Search,
  X,
  Send,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  getBeneficiaries,
  addBeneficiary,
  deleteBeneficiary,
  toggleFavorite,
  type Beneficiary,
  type InsertBeneficiary,
} from '@/lib/api'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const CURRENCIES = ['HTG', 'USD', 'EUR', 'CAD', 'BRL'] as const

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BeneficiarySkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-11 h-11 rounded-2xl shrink-0" style={{ background: '#F3F4F6' }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded-lg w-1/2" style={{ background: '#F3F4F6' }} />
        <div className="h-3 rounded-lg w-2/3" style={{ background: '#F3F4F6' }} />
      </div>
      <div className="h-8 w-20 rounded-xl" style={{ background: '#F3F4F6' }} />
    </div>
  )
}

// ── Beneficiary Card ──────────────────────────────────────────────────────────

function BeneficiaryCard({
  b,
  onToggleFav,
  onSend,
  onDelete,
}: {
  b: Beneficiary
  onToggleFav: (id: string, current: boolean) => void
  onSend: () => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 tr"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold"
        style={{
          background: b.avatar_url ? 'transparent' : 'var(--lime)',
          color: '#0e0f0c',
        }}
      >
        {b.avatar_url
          ? <img src={b.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
          : getInitials(b.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {b.name}
          </p>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
            style={{ background: 'var(--surface)', color: 'var(--ink-60)', border: '1px solid var(--border)' }}
          >
            {b.currency}
          </span>
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ink-60)' }}>
          {b.bank_name ?? b.phone ?? b.email ?? 'Bénéficiaire'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onToggleFav(b.id, b.is_favorite)}
          className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer tr"
          style={{ background: b.is_favorite ? 'rgba(251,191,36,0.12)' : 'var(--surface)' }}
          aria-label="Favori"
        >
          <Star
            className="w-3.5 h-3.5"
            style={{ color: b.is_favorite ? '#F59E0B' : 'var(--ink-30)', fill: b.is_favorite ? '#F59E0B' : 'none' }}
          />
        </button>
        <button
          onClick={onSend}
          className="h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer tr flex items-center gap-1"
          style={{ background: 'var(--lime)', color: '#0e0f0c' }}
        >
          <Send className="w-3 h-3" /> Envoyer
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(b.id)}
              className="h-8 px-2 rounded-xl text-xs font-semibold cursor-pointer tr"
              style={{ background: '#FEF2F2', color: '#DC2626' }}
            >
              Oui
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="h-8 px-2 rounded-xl text-xs font-semibold cursor-pointer tr"
              style={{ background: 'var(--surface)', color: 'var(--ink-60)' }}
            >
              Non
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer tr"
            style={{ background: 'var(--surface)' }}
            aria-label="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--ink-30)' }} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Add Beneficiary Drawer ────────────────────────────────────────────────────

function AddBeneficiaryDrawer({
  open,
  onClose,
  userId,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  userId: string
  onAdded: (b: Beneficiary) => void
}) {
  const [form, setForm] = useState<{
    name: string
    phone: string
    email: string
    bank_name: string
    account_number: string
    currency: string
    country: string
  }>({
    name: '',
    phone: '',
    email: '',
    bank_name: '',
    account_number: '',
    currency: 'HTG',
    country: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function reset() {
    setForm({ name: '', phone: '', email: '', bank_name: '', account_number: '', currency: 'HTG', country: '' })
    setFormError(null)
    setSubmitting(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Le nom est requis.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    const payload: InsertBeneficiary = {
      user_id: userId,
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      bank_name: form.bank_name.trim() || undefined,
      account_number: form.account_number.trim() || undefined,
      currency: form.currency,
      country: form.country.trim() || undefined,
      is_favorite: false,
    }

    const { data, error } = await addBeneficiary(payload)
    if (error) {
      setFormError(error)
      setSubmitting(false)
      return
    }
    if (data) onAdded(data)
    handleClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative w-full rounded-t-3xl overflow-hidden animate-fade-in-up"
        style={{ background: '#ffffff', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#DDE1F0' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
            Nouveau bénéficiaire
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
            style={{ background: 'var(--surface)' }}
          >
            <X className="w-4 h-4" style={{ color: 'var(--ink-60)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ink-60)' }}>
              Nom complet *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Jean Dupont"
              className="w-full h-11 px-4 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ink-60)' }}>
              Téléphone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+509 1234 5678"
              className="w-full h-11 px-4 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ink-60)' }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jean@email.com"
              className="w-full h-11 px-4 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
              }}
            />
          </div>

          {/* Bank */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ink-60)' }}>
                Banque
              </label>
              <input
                type="text"
                value={form.bank_name}
                onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                placeholder="BNC, SOGEBANK..."
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ink-60)' }}>
                N° de compte
              </label>
              <input
                type="text"
                value={form.account_number}
                onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                placeholder="1234567890"
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                }}
              />
            </div>
          </div>

          {/* Currency + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ink-60)' }}>
                Devise
              </label>
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                }}
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--ink-60)' }}>
                Pays
              </label>
              <input
                type="text"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                placeholder="Haïti"
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                }}
              />
            </div>
          </div>

          {/* Error */}
          {formError && (
            <p className="text-sm" style={{ color: '#DC2626' }}>{formError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl text-sm font-semibold cursor-pointer tr"
            style={{ background: 'var(--lime)', color: '#0e0f0c', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Ajout en cours...' : 'Ajouter le bénéficiaire'}
          </button>
        </form>

        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <p
        className="text-xs font-bold uppercase tracking-wide"
        style={{ color: 'var(--ink-60)', letterSpacing: '0.06em' }}
      >
        {title}
      </p>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'var(--surface)', color: 'var(--ink-60)' }}
      >
        {count}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BeneficiariesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await getBeneficiaries(user.id)
    if (err) {
      setError(err)
    } else {
      setBeneficiaries(data ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  function handleAdded(b: Beneficiary) {
    setBeneficiaries(prev => [b, ...prev].sort((a, z) => {
      if (a.is_favorite !== z.is_favorite) return a.is_favorite ? -1 : 1
      return a.name.localeCompare(z.name)
    }))
  }

  async function handleToggleFav(id: string, current: boolean) {
    setBeneficiaries(prev =>
      prev.map(b => b.id === id ? { ...b, is_favorite: !current } : b)
    )
    await toggleFavorite(id, current)
  }

  async function handleDelete(id: string) {
    setBeneficiaries(prev => prev.filter(b => b.id !== id))
    await deleteBeneficiary(id)
  }

  // Filter
  const q = search.toLowerCase()
  const filtered = beneficiaries.filter(b =>
    !q ||
    b.name.toLowerCase().includes(q) ||
    (b.email ?? '').toLowerCase().includes(q) ||
    (b.phone ?? '').includes(q)
  )

  const favorites = filtered.filter(b => b.is_favorite)
  const others = filtered.filter(b => !b.is_favorite)

  return (
    <div className="min-h-screen pb-28 md:pb-8" style={{ background: 'var(--surface)' }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-30 px-4 pt-5 pb-3" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-4">
          <h1
            className="text-xl font-extrabold"
            style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
          >
            Bénéficiaires
          </h1>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer tr"
            style={{ background: 'var(--lime)', color: '#0e0f0c' }}
            aria-label="Ajouter"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 h-11 px-3 rounded-xl"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-30)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un bénéficiaire..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--ink)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="cursor-pointer"
              aria-label="Effacer"
            >
              <X className="w-4 h-4" style={{ color: 'var(--ink-30)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="mx-4 rounded-2xl overflow-hidden"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <BeneficiarySkeleton />
          <BeneficiarySkeleton />
          <BeneficiarySkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title={search ? 'Aucun résultat' : 'Aucun bénéficiaire'}
          description={
            search
              ? 'Essayez un autre terme de recherche.'
              : 'Ajoutez vos proches pour envoyer de l\'argent rapidement.'
          }
          action={
            search
              ? undefined
              : { label: 'Ajouter un bénéficiaire', onClick: () => setDrawerOpen(true) }
          }
        />
      ) : (
        <div className="space-y-3 pb-4">
          {/* Favorites section */}
          {favorites.length > 0 && (
            <div>
              <SectionHeader title="Favoris" count={favorites.length} />
              <div
                className="mx-4 rounded-2xl overflow-hidden"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              >
                {favorites.map(b => (
                  <BeneficiaryCard
                    key={b.id}
                    b={b}
                    onToggleFav={handleToggleFav}
                    onSend={() => navigate('/transfer')}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All others */}
          {others.length > 0 && (
            <div>
              <SectionHeader
                title={favorites.length > 0 ? 'Tous les bénéficiaires' : 'Bénéficiaires'}
                count={others.length}
              />
              <div
                className="mx-4 rounded-2xl overflow-hidden"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              >
                {others.map(b => (
                  <BeneficiaryCard
                    key={b.id}
                    b={b}
                    onToggleFav={handleToggleFav}
                    onSend={() => navigate('/transfer')}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Drawer */}
      {user && (
        <AddBeneficiaryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          userId={user.id}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}
