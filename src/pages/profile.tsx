import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, FileText, KeyRound, Fingerprint, ShieldCheck,
  MapPin, Languages, Gauge, ChevronRight,
  LogOut, Moon, Sun, Check, X, Download, Bell,
  Phone, Mail, Edit3, Loader2, Copy,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { supabase, type Transaction } from '@/lib/supabase'
import { getCurrency } from '@/lib/currencies'
import { cn } from '@/lib/utils'

const LANGUAGES = ['Français', 'English', 'Kreyòl ayisyen', 'Español', 'Português']

// ── Account Details Modal ─────────────────────────────────────────────────────
function AccountDetailsModal({ onClose }: { onClose: () => void }) {
  const { profile, user } = useAuth()
  const [name,  setName]  = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState((profile as any)?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  async function save() {
    if (!user) return
    setSaving(true)
    await supabase.from('wise_users').update({ full_name: name }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  return (
    <Modal title="Détails du compte" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nom complet" icon={<User className="w-4 h-4" />}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-sm font-medium text-[var(--ink)] bg-transparent outline-none"
            placeholder="Votre nom"
          />
        </Field>
        <Field label="Email" icon={<Mail className="w-4 h-4" />}>
          <p className="text-sm text-[var(--ink-60)]">{profile?.email ?? user?.email ?? '—'}</p>
        </Field>
        <Field label="Téléphone" icon={<Phone className="w-4 h-4" />}>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full text-sm font-medium text-[var(--ink)] bg-transparent outline-none"
            placeholder="+509 xxxxxxxx"
          />
        </Field>
        <Field label="Statut du compte" icon={<Check className="w-4 h-4" style={{ color: 'var(--lime)' }} />}>
          <span className="text-sm font-semibold" style={{ color: 'var(--lime)' }}>Compte vérifié</span>
        </Field>
      </div>
      <button
        onClick={save}
        disabled={saving || saved}
        className="btn-lime mt-5 w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        {saved ? 'Enregistré !' : 'Enregistrer'}
      </button>
    </Modal>
  )
}

// ── Statements Modal ──────────────────────────────────────────────────────────
function StatementsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [txs,     setTxs]     = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('transactions').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setTxs(data); setLoading(false) })
  }, [user])

  function exportCSV() {
    const header = ['Date', 'Type', 'Statut', 'Montant', 'Devise', 'Bénéficiaire', 'Référence']
    const rows = txs.map(tx => [
      new Date(tx.created_at).toLocaleDateString('fr-FR'),
      tx.type, tx.status,
      tx.amount.toFixed(2),
      tx.currency,
      tx.recipient_name ?? '',
      tx.reference ?? '',
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `releve-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const TYPE_LABEL: Record<string, string> = {
    send: 'Envoi', receive: 'Reçu', convert: 'Conversion',
    deposit: 'Dépôt', withdraw: 'Retrait', bill_payment: 'Facture',
  }

  return (
    <Modal title="Relevés de compte" onClose={onClose}>
      <button
        onClick={exportCSV}
        className="btn-lime w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer mb-4"
      >
        <Download className="w-4 h-4" /> Télécharger CSV
      </button>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-[var(--surface-2)] animate-pulse" />)}
        </div>
      ) : txs.length === 0 ? (
        <p className="text-sm text-center text-[var(--ink-60)] py-6">Aucune transaction.</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {txs.map(tx => {
            const curr = getCurrency(tx.currency)
            const isSend = tx.type === 'send' || tx.type === 'withdraw'
            return (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface)] tr">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--ink)] truncate">
                    {TYPE_LABEL[tx.type] ?? tx.type}
                    {tx.recipient_name ? ` — ${tx.recipient_name}` : ''}
                  </p>
                  <p className="text-[10px] text-[var(--ink-60)]">
                    {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <p className={cn("text-xs font-bold tabular-nums shrink-0", isSend ? "text-red-500" : "text-[var(--ink)]")}>
                  {isSend ? '−' : '+'}{curr?.symbol}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

// ── Transaction Limits Modal ──────────────────────────────────────────────────
function LimitsModal({ onClose }: { onClose: () => void }) {
  const [dailyLimit,  setDailyLimit]  = useState('5000')
  const [perTxLimit,  setPerTxLimit]  = useState('1000')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('fb-limits')
    if (stored) {
      const { daily, perTx } = JSON.parse(stored)
      setDailyLimit(daily); setPerTxLimit(perTx)
    }
  }, [])

  function save() {
    localStorage.setItem('fb-limits', JSON.stringify({ daily: dailyLimit, perTx: perTxLimit }))
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  return (
    <Modal title="Limites de transaction" onClose={onClose}>
      <p className="text-sm text-[var(--ink-60)] mb-4">
        Définissez vos plafonds de sécurité quotidiens et par transaction.
      </p>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">
            Limite par transaction (USD)
          </label>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] focus-within:border-[var(--ink-30)] tr">
            <span className="text-[var(--ink-60)] font-semibold">$</span>
            <input
              type="number"
              value={perTxLimit}
              onChange={e => setPerTxLimit(e.target.value)}
              className="flex-1 text-sm font-semibold text-[var(--ink)] bg-transparent outline-none tabular-nums"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)]">
            Limite journalière (USD)
          </label>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] focus-within:border-[var(--ink-30)] tr">
            <span className="text-[var(--ink-60)] font-semibold">$</span>
            <input
              type="number"
              value={dailyLimit}
              onChange={e => setDailyLimit(e.target.value)}
              className="flex-1 text-sm font-semibold text-[var(--ink)] bg-transparent outline-none tabular-nums"
            />
          </div>
        </div>
        <div className="p-3 rounded-xl text-xs text-[var(--ink-60)] border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
          💡 Ces limites protègent votre compte contre les transactions non autorisées.
        </div>
      </div>
      <button
        onClick={save}
        className="btn-lime mt-5 w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        {saved ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        {saved ? 'Enregistré !' : 'Enregistrer les limites'}
      </button>
    </Modal>
  )
}

// ── Shared Modal wrapper ──────────────────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
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

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[var(--ink-60)]" style={{ background: 'var(--surface-2)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-60)] mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
type ModalType = 'account' | 'statements' | 'limits' | null

export function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [displayCode, setDisplayCode] = useState<string>(profile?.user_code ?? '')

  // Generate user_code if missing
  const ensureUserCode = useCallback(async () => {
    if (!user || profile?.user_code) return
    const code = 'FB' + Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('wise_users').update({ user_code: code }).eq('id', user.id)
    setDisplayCode(code)
  }, [user, profile?.user_code])

  useEffect(() => {
    if (profile?.user_code) setDisplayCode(profile.user_code)
    else ensureUserCode()
  }, [profile?.user_code, ensureUserCode])

  const [modal,        setModal]        = useState<ModalType>(null)
  const [biometric,    setBiometric]    = useState(() => localStorage.getItem('fb-biometric') === 'true')
  const [twoFA,        setTwoFA]        = useState(() => localStorage.getItem('fb-2fa') !== 'false')
  const [location,     setLocation]     = useState(() => localStorage.getItem('fb-location') === 'true')
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('fb-notif') !== 'false')
  const [showLang,     setShowLang]     = useState(false)
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('fb-lang') ?? 'Français')
  const [codeCopied,   setCodeCopied]   = useState(false)

  function toggle(key: string, val: boolean, setter: (v: boolean) => void) {
    setter(val); localStorage.setItem(key, String(val))
  }

  function copyUserCode() {
    if (!displayCode) return
    navigator.clipboard.writeText(displayCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const initials = (profile?.full_name ?? 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleSignOut() { await signOut(); navigate('/') }

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--surface)' }}>
      {modal === 'account'    && <AccountDetailsModal onClose={() => setModal(null)} />}
      {modal === 'statements' && <StatementsModal     onClose={() => setModal(null)} />}
      {modal === 'limits'     && <LimitsModal         onClose={() => setModal(null)} />}

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Profile header card */}
        <div className="card-flat p-5 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0 relative"
              style={{ background: 'var(--ink)' }}
            >
              {initials}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[var(--card-bg)] flex items-center justify-center" style={{ background: 'var(--lime)' }}>
                <Check className="w-2.5 h-2.5" style={{ color: 'var(--ink)' }} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-[var(--ink)] truncate">{profile?.full_name ?? 'Utilisateur'}</h1>
              <p className="text-sm text-[var(--ink-60)] truncate">{profile?.email ?? ''}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
                <Check className="w-2.5 h-2.5" /> Compte vérifié
              </span>
            </div>
            <button
              onClick={() => setModal('account')}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface)] tr cursor-pointer border border-[var(--border)]"
            >
              <Edit3 className="w-4 h-4 text-[var(--ink-60)]" />
            </button>
          </div>

          {/* User ID card */}
          <div
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: 'var(--ink)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Mon ID FamillyBill
              </p>
              {displayCode ? (
                <p className="text-base font-black tracking-widest font-mono" style={{ color: 'var(--lime)' }}>
                  {displayCode}
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Génération…</p>
              )}
            </div>
            {displayCode && (
              <button
                onClick={copyUserCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tr cursor-pointer shrink-0"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              >
                {codeCopied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--lime)' }} /> : <Copy className="w-3.5 h-3.5" />}
                {codeCopied ? 'Copié !' : 'Copier'}
              </button>
            )}
          </div>
        </div>

        {/* Compte section */}
        <Section title="Compte" delay={50}>
          <MenuItem icon={User}     label="Détails du compte"   desc="Informations personnelles"    onClick={() => setModal('account')} />
          <MenuItem icon={FileText} label="Relevés de compte"   desc="Historique et export CSV"     onClick={() => setModal('statements')} />
          <MenuItem icon={KeyRound} label="Changer le code PIN" desc="Modifier votre code secret"   onClick={() => navigate('/wallet')} last />
        </Section>

        {/* Sécurité section */}
        <Section title="Sécurité" delay={100}>
          <ToggleItem
            icon={Fingerprint} label="Authentification biométrique" desc="Face ID / Empreinte digitale"
            checked={biometric} onChange={v => toggle('fb-biometric', v, setBiometric)}
          />
          <ToggleItem
            icon={ShieldCheck} label="Double authentification (2FA)" desc="Protection renforcée"
            checked={twoFA} onChange={v => toggle('fb-2fa', v, setTwoFA)}
          />
          <ToggleItem
            icon={Bell} label="Notifications" desc="Alertes transactions et offres"
            checked={notifEnabled} onChange={v => toggle('fb-notif', v, setNotifEnabled)}
          />
          <ToggleItem
            icon={MapPin} label="Localisation" desc="Transactions par géolocalisation"
            checked={location} onChange={v => toggle('fb-location', v, setLocation)} last
          />
        </Section>

        {/* Préférences section */}
        <Section title="Préférences" delay={150}>
          {/* Theme toggle */}
          <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer" onClick={toggleTheme}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
              {theme === 'dark'
                ? <Sun  className="w-5 h-5 text-[var(--ink-60)]" />
                : <Moon className="w-5 h-5 text-[var(--ink-60)]" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--ink)]">Apparence</p>
              <p className="text-xs text-[var(--ink-60)]">{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>

          {/* Language */}
          <div className="relative">
            <div
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer"
              onClick={() => setShowLang(!showLang)}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                <Languages className="w-5 h-5 text-[var(--ink-60)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--ink)]">Langue</p>
                <p className="text-xs text-[var(--ink-60)]">{selectedLang}</p>
              </div>
              <ChevronRight className={cn("w-4 h-4 text-[var(--ink-30)] tr", showLang && "rotate-90")} />
            </div>
            {showLang && (
              <div className="mx-4 mb-2 rounded-xl border border-[var(--border)] overflow-hidden animate-scale-in" style={{ background: 'var(--card-bg)' }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setSelectedLang(lang); localStorage.setItem('fb-lang', lang); setShowLang(false) }}
                    className={cn("w-full flex items-center justify-between px-4 py-2.5 text-sm tr cursor-pointer hover:bg-[var(--surface)]",
                      lang === selectedLang ? "font-semibold text-[var(--ink)]" : "text-[var(--ink-60)]"
                    )}
                  >
                    {lang}
                    {lang === selectedLang && <Check className="w-3.5 h-3.5" style={{ color: 'var(--lime)' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <MenuItem icon={Gauge} label="Limites de transaction" desc="Gérer vos plafonds quotidiens" onClick={() => setModal('limits')} last />
        </Section>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full card-flat flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-50 tr cursor-pointer animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-sm">Déconnexion</span>
        </button>

      </div>
    </div>
  )
}

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-60)] px-1 mb-2">{title}</p>
      <div className="card-flat overflow-hidden divide-y divide-[var(--border)]">
        {children}
      </div>
    </div>
  )
}

function MenuItem({
  icon: Icon, label, desc, last = false, onClick,
}: {
  icon: typeof User; label: string; desc?: string; last?: boolean; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn("w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer text-left", last && "")}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
        <Icon className="w-5 h-5 text-[var(--ink-60)]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
        {desc && <p className="text-xs text-[var(--ink-60)]">{desc}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--ink-30)] shrink-0" />
    </button>
  )
}

function ToggleItem({
  icon: Icon, label, desc, checked, onChange, last = false,
}: {
  icon: typeof User; label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer", last && "")}
      onClick={() => onChange(!checked)}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
        <Icon className="w-5 h-5 text-[var(--ink-60)]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
        {desc && <p className="text-xs text-[var(--ink-60)]">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} onClick={e => e.stopPropagation()} />
    </div>
  )
}
