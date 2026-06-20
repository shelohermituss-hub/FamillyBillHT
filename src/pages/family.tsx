import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Search, Shield, Eye, ArrowUpRight,
  Wallet, Trash2, X, Check, ChevronRight, Copy,
  ArrowDownLeft, Receipt, CreditCard, Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Permission = 'view_balance' | 'pay_bills' | 'withdraw' | 'transfer'

type FamilyWallet = {
  id: string
  creator_id: string
  name: string
  balance: number
  currency: string
  created_at: string
}

type FamilyMember = {
  id: string
  wallet_id: string
  user_id: string
  user_code: string
  display_name: string
  view_balance: boolean
  pay_bills: boolean
  withdraw: boolean
  transfer: boolean
  joined_at: string
}

const PERMISSION_CONFIG: { key: Permission; label: string; desc: string; icon: typeof Eye }[] = [
  { key: 'view_balance', label: 'Voir le solde',         desc: 'Consulter le solde du portefeuille', icon: Eye         },
  { key: 'pay_bills',   label: 'Payer des factures',    desc: 'Effectuer des paiements de services',  icon: Receipt     },
  { key: 'withdraw',    label: 'Retirer des fonds',      desc: 'Retirer de l\'argent',                icon: CreditCard  },
  { key: 'transfer',    label: 'Effectuer des transferts', desc: 'Envoyer de l\'argent',              icon: ArrowUpRight },
]

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 animate-fade-in-up"
        style={{ background: 'var(--card-bg)', boxShadow: '0 -4px 40px rgba(14,15,12,0.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface)] tr cursor-pointer">
            <X className="w-4 h-4 text-[var(--ink-60)]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Create Wallet Modal ────────────────────────────────────────────────────────
function CreateWalletModal({ onClose, onCreate }: { onClose: () => void; onCreate: (w: FamilyWallet) => void }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Entrez un nom pour le portefeuille.'); return }
    if (!user) return
    setSaving(true)
    const { data: newWallet, error: err } = await supabase.from('family_wallets').insert({
      creator_id: user.id,
      name: name.trim(),
      balance: 0,
      currency: 'HTG',
    }).select().single()
    setSaving(false)
    if (err) {
      if (err.message?.includes('does not exist') || err.code === '42P01') {
        setError('Les tables familiales n\'existent pas encore. Appliquez la migration SQL dans votre projet Supabase.')
      } else {
        setError(err.message ?? 'Erreur lors de la création. Réessayez.')
      }
      return
    }
    if (newWallet) onCreate(newWallet as FamilyWallet)
    onClose()
  }

  return (
    <Modal title="Créer un portefeuille familial" onClose={onClose}>
      <div className="space-y-4">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-2"
          style={{ background: 'var(--lime)', boxShadow: '0 4px 20px rgba(159,232,112,0.4)' }}>
          <Users className="w-7 h-7" style={{ color: 'var(--ink)' }} />
        </div>
        <p className="text-sm text-[var(--ink-60)] text-center">
          Créez un portefeuille partagé pour gérer les finances de votre famille.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">
            Nom du portefeuille
          </label>
          <Input
            placeholder="Ex: Famille Jean, Budget Maison…"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            className="h-11 rounded-xl"
            autoFocus
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleCreate}
          disabled={saving}
          className="btn-lime w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Créer le portefeuille
        </button>
      </div>
    </Modal>
  )
}

// ── Add Member Modal ──────────────────────────────────────────────────────────
function AddMemberModal({
  walletId,
  onClose,
  onAdded,
}: { walletId: string; onClose: () => void; onAdded: () => void }) {
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Entrez un ID utilisateur.'); return }
    setSaving(true)
    // Lookup user by user_code
    const { data: found } = await supabase
      .from('wise_users')
      .select('id, full_name, user_code')
      .eq('user_code', trimmed)
      .maybeSingle()
    if (!found) {
      setError('Aucun utilisateur trouvé avec cet ID.')
      setSaving(false)
      return
    }
    // Add member
    const { error: err } = await supabase.from('family_wallet_members').insert({
      wallet_id: walletId,
      user_id: found.id,
      user_code: found.user_code,
      display_name: found.full_name,
      view_balance: true,
      pay_bills: false,
      withdraw: false,
      transfer: false,
    })
    setSaving(false)
    if (err) {
      setError(err.message.includes('duplicate') ? 'Cet utilisateur est déjà membre.' : 'Erreur. Réessayez.')
      return
    }
    onAdded()
    onClose()
  }

  return (
    <Modal title="Ajouter un membre" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-60)]">
          Entrez l'identifiant unique FamillyBill d'un utilisateur (ex. <span className="font-mono font-bold">FB2F4A1B</span>).
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">
            Identifiant FamillyBill
          </label>
          <Input
            placeholder="FB2F4A1B"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            className="h-11 rounded-xl font-mono tracking-wider uppercase"
            autoFocus
            maxLength={8}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleAdd}
          disabled={saving || !code.trim()}
          className="btn-lime w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Ajouter le membre
        </button>
      </div>
    </Modal>
  )
}

// ── Member Permissions Card ───────────────────────────────────────────────────
function MemberCard({
  member,
  isCreator,
  onUpdate,
  onRemove,
}: {
  member: FamilyMember
  isCreator: boolean
  onUpdate: (id: string, perm: Permission, val: boolean) => void
  onRemove: (id: string) => void
}) {
  const initials = member.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="card-flat overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: 'var(--ink)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)] truncate">{member.display_name}</p>
          <p className="text-xs font-mono text-[var(--ink-60)]">{member.user_code}</p>
        </div>
        {isCreator && (
          <button
            onClick={() => onRemove(member.id)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 tr cursor-pointer text-[var(--ink-60)] hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {isCreator && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-60)]">Permissions</p>
          {PERMISSION_CONFIG.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                <Icon className="w-3.5 h-3.5 text-[var(--ink-60)]" />
              </div>
              <p className="flex-1 text-xs font-medium text-[var(--ink)]">{label}</p>
              <Switch
                checked={member[key]}
                onCheckedChange={v => onUpdate(member.id, key, v)}
              />
            </div>
          ))}
        </div>
      )}

      {!isCreator && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {PERMISSION_CONFIG.filter(p => member[p.key]).map(({ key, label }) => (
              <span key={key} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--lime-light)', color: 'var(--ink)' }}>
                <Check className="w-2.5 h-2.5" />
                {label}
              </span>
            ))}
            {PERMISSION_CONFIG.filter(p => !member[p.key]).length === PERMISSION_CONFIG.length && (
              <span className="text-xs text-[var(--ink-60)]">Aucune permission accordée</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Wallet View ───────────────────────────────────────────────────────────────
function WalletView({ wallet }: { wallet: FamilyWallet }) {
  const { user } = useAuth()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [copied, setCopied] = useState(false)

  const isCreator = wallet.creator_id === user?.id

  const loadMembers = useCallback(async () => {
    const { data } = await supabase
      .from('family_wallet_members')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('joined_at')
    if (data) setMembers(data)
    setLoadingMembers(false)
  }, [wallet.id])

  useEffect(() => { loadMembers() }, [loadMembers])

  async function updatePermission(memberId: string, perm: Permission, val: boolean) {
    await supabase.from('family_wallet_members').update({ [perm]: val }).eq('id', memberId)
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, [perm]: val } : m))
  }

  async function removeMember(memberId: string) {
    await supabase.from('family_wallet_members').delete().eq('id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  function copyId() {
    navigator.clipboard.writeText(wallet.id.slice(0, 8).toUpperCase())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine own permissions (for non-creators)
  const myMember = members.find(m => m.user_id === user?.id)

  const canTransfer = isCreator || myMember?.transfer
  const canPayBills = isCreator || myMember?.pay_bills

  return (
    <div className="space-y-4">
      {showAddMember && (
        <AddMemberModal
          walletId={wallet.id}
          onClose={() => setShowAddMember(false)}
          onAdded={loadMembers}
        />
      )}

      {/* Wallet card */}
      <div className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: 'var(--ink)', boxShadow: '0 8px 40px rgba(14,15,12,0.22)' }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'var(--lime)' }} />
        <div className="absolute -bottom-12 -left-6 w-44 h-44 rounded-full opacity-5" style={{ background: 'var(--lime)' }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--lime)' }}>
                Portefeuille familial
              </p>
              <h2 className="text-lg font-bold text-white">{wallet.name}</h2>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>

          <p className="text-3xl font-bold text-white tabular-nums mb-1">
            G {wallet.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {members.length} membre{members.length !== 1 ? 's' : ''} · HTG
          </p>

          {/* Quick actions */}
          <div className="flex gap-2">
            {canTransfer && (
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tr cursor-pointer"
                style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                Envoyer
              </button>
            )}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tr cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Déposer
            </button>
            {canPayBills && (
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tr cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
                <Receipt className="w-3.5 h-3.5" />
                Factures
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wallet ID */}
      <div className="card-flat flex items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
          <Shield className="w-4 h-4 text-[var(--ink-60)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--ink-60)]">ID du portefeuille</p>
          <p className="text-sm font-mono font-semibold text-[var(--ink)] tracking-wider">
            {wallet.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <button
          onClick={copyId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tr cursor-pointer"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-60)' }}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>

      {/* Members section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Membres ({members.length})
          </h3>
          {isCreator && (
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tr cursor-pointer"
              style={{ background: 'var(--lime)', color: 'var(--ink)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          )}
        </div>

        {loadingMembers ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="card-flat p-8 text-center">
            <Users className="w-8 h-8 mx-auto mb-3 text-[var(--ink-60)]" />
            <p className="text-sm font-medium text-[var(--ink)]">Aucun membre</p>
            <p className="text-xs text-[var(--ink-60)] mt-1">Ajoutez des membres par leur ID FamillyBill.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                isCreator={isCreator}
                onUpdate={updatePermission}
                onRemove={removeMember}
              />
            ))}
          </div>
        )}
      </div>

      {/* Permissions legend for non-creators */}
      {!isCreator && (
        <div className="card-flat p-4">
          <p className="text-xs font-semibold text-[var(--ink-60)] mb-3 uppercase tracking-widest">Vos permissions</p>
          <div className="space-y-2">
            {PERMISSION_CONFIG.map(({ key, label, icon: Icon, desc }) => {
              const allowed = myMember?.[key] ?? false
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    allowed ? "bg-[var(--lime-light)]" : "bg-[var(--surface-2)]"
                  )}>
                    <Icon className={cn("w-3.5 h-3.5", allowed ? "text-[var(--ink)]" : "text-[var(--ink-30)]")} />
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-xs font-medium", allowed ? "text-[var(--ink)]" : "text-[var(--ink-60)] line-through")}>{label}</p>
                    <p className="text-[10px] text-[var(--ink-60)]">{desc}</p>
                  </div>
                  {allowed
                    ? <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--lime)' }} />
                    : <X className="w-4 h-4 shrink-0 text-[var(--ink-30)]" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Family Page ──────────────────────────────────────────────────────────
export function FamilyPage() {
  const { user } = useAuth()
  const [wallets, setWallets] = useState<FamilyWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWallet, setSelectedWallet] = useState<FamilyWallet | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const loadWallets = useCallback(async () => {
    if (!user) return
    // Load wallets where user is creator OR member
    const [created, membered] = await Promise.all([
      supabase.from('family_wallets').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('family_wallet_members').select('wallet_id').eq('user_id', user.id),
    ])

    const memberWalletIds = membered.data?.map(m => m.wallet_id) ?? []
    let allWallets = created.data ?? []

    if (memberWalletIds.length > 0) {
      const { data: others } = await supabase
        .from('family_wallets')
        .select('*')
        .in('id', memberWalletIds)
        .neq('creator_id', user.id)
      if (others) allWallets = [...allWallets, ...others]
    }

    setWallets(allWallets)
    setLoading(false)
  }, [user])

  useEffect(() => { loadWallets() }, [loadWallets])

  const filtered = wallets.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase())
  )

  if (selectedWallet) {
    return (
      <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--surface)' }}>
        <div className="max-w-lg mx-auto px-4 pt-6">
          <button
            onClick={() => setSelectedWallet(null)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--ink-60)] hover:text-[var(--ink)] tr cursor-pointer mb-5"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Retour
          </button>
          <WalletView wallet={selectedWallet} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--surface)' }}>
      {showCreate && (
        <CreateWalletModal
          onClose={() => setShowCreate(false)}
          onCreate={(newWallet) => {
            setWallets(prev => [newWallet, ...prev])
            setSelectedWallet(newWallet)
          }}
        />
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-xl font-semibold text-[var(--ink)]">Famille</h1>
            <p className="text-sm text-[var(--ink-60)]">Portefeuilles partagés</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold tr cursor-pointer"
            style={{ background: 'var(--lime)', color: 'var(--ink)' }}
          >
            <Plus className="w-4 h-4" />
            Créer
          </button>
        </div>

        {wallets.length > 2 && (
          <div className="relative animate-fade-in-up">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-60)]" />
            <Input
              placeholder="Rechercher un portefeuille..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        )}

        {/* Wallet list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-flat p-10 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--lime-light)' }}>
              <Users className="w-7 h-7" style={{ color: 'var(--ink)' }} />
            </div>
            <h2 className="text-base font-semibold text-[var(--ink)] mb-1">Aucun portefeuille familial</h2>
            <p className="text-sm text-[var(--ink-60)] mb-5 leading-relaxed max-w-xs mx-auto">
              Créez un portefeuille partagé ou rejoignez-en un via votre ID FamillyBill.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-lime px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer un portefeuille
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((w, i) => {
              const isOwner = w.creator_id === user?.id
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWallet(w)}
                  className="w-full text-left animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="card-flat p-4 hover:bg-[var(--surface)] tr cursor-pointer card-hover">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: isOwner ? 'var(--ink)' : 'var(--surface-2)' }}>
                        <Users className="w-5 h-5" style={{ color: isOwner ? 'white' : 'var(--ink-60)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--ink)] truncate">{w.name}</p>
                          {isOwner && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
                              Créateur
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--ink-60)]">
                          {new Date(w.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--ink-30)] shrink-0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[var(--ink-60)]">Solde</p>
                        <p className="text-lg font-bold text-[var(--ink)] tabular-nums">
                          G {w.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wallet className="w-4 h-4 text-[var(--ink-60)]" />
                        <span className="text-xs text-[var(--ink-60)]">HTG</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Info card */}
        <div className="card-flat p-4 animate-fade-in-up">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--lime-light)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--ink)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--ink)] mb-0.5">Accès contrôlé</p>
              <p className="text-xs text-[var(--ink-60)] leading-relaxed">
                En tant que créateur, vous contrôlez entièrement qui peut voir le solde, payer des factures, retirer ou transférer de l'argent.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
