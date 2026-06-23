import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Bell, LogOut, User, Phone, Mail,
  MapPin, FileText, Settings, ShieldCheck, HelpCircle,
  Fingerprint, Key, Languages, Trash2, Eye, Check, BookOpen,
  Camera, Loader2, Copy, Share2, QrCode, Building2, ArrowDownLeft,
  X, Download,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notifications-context'
import { supabase, type Transaction } from '@/lib/supabase'
import { getCurrency } from '@/lib/currencies'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen =
  | 'main'
  | 'personal'
  | 'notif-manage'
  | 'settings'
  | 'privacy'
  | 'change-password'

// ── Sub-screen shell ──────────────────────────────────────────────────────────

function SubScreen({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden" style={{ zIndex: 60, background: '#F5F5F7' }}>
      <div className="min-h-full pb-12">{children}</div>
    </div>
  )
}

function SubHeader({
  title, onBack, right,
}: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 h-14 bg-white sticky top-0 z-10"
      style={{ borderBottom: '1px solid #F3F4F6' }}>
      <button onClick={onBack}
        className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer tr"
        style={{ background: '#F3F4F6' }}>
        <ChevronLeft className="w-5 h-5" style={{ color: '#374151' }} />
      </button>
      <h1 className="text-base font-bold" style={{ color: '#111', letterSpacing: '-0.02em' }}>{title}</h1>
      <div className="w-9 h-9 flex items-center justify-center">
        {right}
      </div>
    </div>
  )
}

// ── Shared row components ─────────────────────────────────────────────────────

function IconWrap({ Icon, color = '#4F46E5', bg = '#EEF2FF', size = 42 }: {
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  color?: string; bg?: string; size?: number
}) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: bg }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
  )
}

function RowItem({
  Icon, label, onPress, right, last = false,
}: {
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  label: string; onPress?: () => void; right?: ReactNode; last?: boolean
}) {
  return (
    <button onClick={onPress}
      className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-gray-50 text-left"
      style={{ borderBottom: last ? 'none' : '1px solid #F9FAFB' }}>
      <IconWrap Icon={Icon} />
      <span className="flex-1 text-sm font-medium" style={{ color: '#111' }}>{label}</span>
      {right !== undefined ? right : <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />}
    </button>
  )
}

function GroupCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-4 rounded-2xl overflow-hidden', className)}
      style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      {children}
    </div>
  )
}

// ── Notifications list screen ─────────────────────────────────────────────────

// ── Manage Notifications screen ───────────────────────────────────────────────

const NOTIF_SETTINGS = [
  { key: 'fb-notif-bank',    label: 'Bank Statement Emails',     Icon: Building2 },
  { key: 'fb-notif-deposit', label: 'Automatic Deposit',        Icon: ArrowDownLeft },
  { key: 'fb-notif-receive', label: 'Received Money',           Icon: Mail },
  { key: 'fb-notif-balance', label: 'Balance',                  Icon: Eye },
  { key: 'fb-notif-news',    label: 'News And Updates',         Icon: BookOpen },
  { key: 'fb-notif-tx',      label: 'Transactions And Payments', Icon: FileText },
] as const

function ManageNotifsScreen({ onBack }: { onBack: () => void }) {
  const [values, setValues] = useState<Record<string, boolean>>(() => ({
    'fb-notif-bank':    localStorage.getItem('fb-notif-bank') !== 'false',
    'fb-notif-deposit': localStorage.getItem('fb-notif-deposit') === 'true',
    'fb-notif-receive': localStorage.getItem('fb-notif-receive') !== 'false',
    'fb-notif-balance': localStorage.getItem('fb-notif-balance') === 'true',
    'fb-notif-news':    localStorage.getItem('fb-notif-news') === 'true',
    'fb-notif-tx':      localStorage.getItem('fb-notif-tx') === 'true',
  }))

  function toggle(key: string) {
    const next = !values[key]
    localStorage.setItem(key, String(next))
    setValues(v => ({ ...v, [key]: next }))
  }

  return (
    <SubScreen>
      <SubHeader title="Notifications" onBack={onBack} />
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#111' }}>Manage Notifications</h2>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {NOTIF_SETTINGS.map(({ key, label, Icon }, i) => (
            <div key={key}
              className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
              style={{ borderBottom: i < NOTIF_SETTINGS.length - 1 ? '1px solid #F9FAFB' : 'none' }}
              onClick={() => toggle(key)}>
              <IconWrap Icon={Icon} />
              <span className="flex-1 text-sm font-medium" style={{ color: '#111' }}>{label}</span>
              <Switch
                checked={values[key]}
                onCheckedChange={() => toggle(key)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </div>
    </SubScreen>
  )
}

// ── Settings screen ───────────────────────────────────────────────────────────

function SettingsScreen({ onBack, onNotifs, onChangePassword }: { onBack: () => void; onNotifs: () => void; onChangePassword: () => void }) {
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('fb-dark-theme') === 'true')
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem('fb-show-balance-terminal') !== 'false')
  const [showLang, setShowLang] = useState(false)
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('fb-lang') ?? 'Français')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const LANGUAGES = ['Français', 'English', 'Kreyòl ayisyen', 'Español', 'Português']

  function toggleDark() {
    const next = !darkTheme
    setDarkTheme(next)
    localStorage.setItem('fb-dark-theme', String(next))
  }

  function toggleBalance() {
    const next = !showBalance
    setShowBalance(next)
    localStorage.setItem('fb-show-balance-terminal', String(next))
  }

  async function handleDeleteAccount() {
    await signOut()
    navigate('/')
  }

  return (
    <SubScreen>
      <SubHeader title="Paramètres" onBack={onBack} right={
        <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: '#F3F4F6' }}>
          <Bell className="w-4 h-4" style={{ color: '#374151' }} />
        </button>
      } />

      <div className="px-4 pt-6 space-y-5">
        <h2 className="text-xl font-bold" style={{ color: '#111' }}>General</h2>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {/* Dark Theme */}
          <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
            style={{ borderBottom: '1px solid #F9FAFB' }}
            onClick={toggleDark}>
            <IconWrap Icon={Eye} />
            <span className="flex-1 text-sm font-medium" style={{ color: '#111' }}>Dark Theme</span>
            <Switch checked={darkTheme} onCheckedChange={toggleDark} onClick={e => e.stopPropagation()} />
          </div>

          {/* Languages */}
          <div>
            <button
              className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-gray-50"
              style={{ borderBottom: '1px solid #F9FAFB' }}
              onClick={() => setShowLang(v => !v)}>
              <IconWrap Icon={Languages} />
              <div className="flex-1 text-left">
                <span className="text-sm font-medium" style={{ color: '#111' }}>Languages</span>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{selectedLang}</p>
              </div>
              <ChevronRight className={cn("w-4 h-4 tr", showLang && "rotate-90")} style={{ color: '#C7C7CC' }} />
            </button>
            {showLang && (
              <div style={{ background: '#F9FAFB', borderBottom: '1px solid #F9FAFB' }}>
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => { setSelectedLang(lang); localStorage.setItem('fb-lang', lang); setShowLang(false) }}
                    className="w-full flex items-center justify-between px-6 py-2.5 text-sm cursor-pointer tr hover:bg-gray-50"
                    style={{ color: lang === selectedLang ? '#4F46E5' : '#374151' }}>
                    {lang}
                    {lang === selectedLang && <Check className="w-3.5 h-3.5" style={{ color: '#4F46E5' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-gray-50"
            style={{ borderBottom: '1px solid #F9FAFB' }}
            onClick={onNotifs}>
            <IconWrap Icon={Bell} />
            <span className="flex-1 text-left text-sm font-medium" style={{ color: '#111' }}>Notifications</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />
          </button>

          {/* Security */}
          <button className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-gray-50"
            style={{ borderBottom: '1px solid #F9FAFB' }}>
            <IconWrap Icon={ShieldCheck} />
            <span className="flex-1 text-left text-sm font-medium" style={{ color: '#111' }}>Security</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />
          </button>

          {/* Contacts */}
          <button className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-gray-50"
            style={{ borderBottom: '1px solid #F9FAFB' }}>
            <IconWrap Icon={User} />
            <span className="flex-1 text-left text-sm font-medium" style={{ color: '#111' }}>Contacts</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />
          </button>

          {/* Face ID And Pin */}
          <button className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-gray-50"
            style={{ borderBottom: '1px solid #F9FAFB' }}
            onClick={() => navigate('/wallet')}>
            <IconWrap Icon={Fingerprint} />
            <span className="flex-1 text-left text-sm font-medium" style={{ color: '#111' }}>Face ID And Pin</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />
          </button>

          {/* Change Password */}
          <button className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-gray-50"
            style={{ borderBottom: '1px solid #F9FAFB' }}
            onClick={onChangePassword}>
            <IconWrap Icon={Key} />
            <span className="flex-1 text-left text-sm font-medium" style={{ color: '#111' }}>Changer le mot de passe</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />
          </button>

          {/* Show Balance In Terminal */}
          <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
            style={{ borderBottom: '1px solid #F9FAFB' }}
            onClick={toggleBalance}>
            <IconWrap Icon={Eye} />
            <span className="flex-1 text-sm font-medium" style={{ color: '#111' }}>Show Balance In Terminal</span>
            <Switch checked={showBalance} onCheckedChange={toggleBalance} onClick={e => e.stopPropagation()} />
          </div>

          {/* Delete Account */}
          <button className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}>
            <IconWrap Icon={Trash2} color="#EF4444" bg="#FEF2F2" />
            <span className="flex-1 text-left text-sm font-medium" style={{ color: '#EF4444' }}>Delete Account</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#EF4444' }} />
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center px-6" style={{ zIndex: 70, background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#fff' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#111' }}>Supprimer le compte ?</h3>
            <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
              Cette action est irréversible. Toutes vos données seront supprimées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-2xl text-sm font-semibold cursor-pointer"
                style={{ background: '#F3F4F6', color: '#374151' }}>
                Annuler
              </button>
              <button onClick={handleDeleteAccount}
                className="flex-1 h-12 rounded-2xl text-sm font-semibold cursor-pointer"
                style={{ background: '#EF4444', color: '#fff' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </SubScreen>
  )
}

// ── Privacy & Security screen ─────────────────────────────────────────────────

function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const [twoFA,     setTwoFA]     = useState(() => localStorage.getItem('fb-2fa') !== 'false')
  const [biometric, setBiometric] = useState(() => localStorage.getItem('fb-biometric') === 'true')
  const [location,  setLocation]  = useState(() => localStorage.getItem('fb-location') === 'true')

  function toggle(key: string, val: boolean, set: (v: boolean) => void) {
    set(val); localStorage.setItem(key, String(val))
  }

  return (
    <SubScreen>
      <SubHeader title="Confidentialité & Sécurité" onBack={onBack} />
      <div className="px-4 pt-6 space-y-4">
        <GroupCard>
          <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
            style={{ borderBottom: '1px solid #F9FAFB' }}
            onClick={() => toggle('fb-2fa', !twoFA, setTwoFA)}>
            <IconWrap Icon={ShieldCheck} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#111' }}>Double authentification (2FA)</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Protection renforcée du compte</p>
            </div>
            <Switch checked={twoFA} onCheckedChange={v => toggle('fb-2fa', v, setTwoFA)} onClick={e => e.stopPropagation()} />
          </div>
          <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
            style={{ borderBottom: '1px solid #F9FAFB' }}
            onClick={() => toggle('fb-biometric', !biometric, setBiometric)}>
            <IconWrap Icon={Fingerprint} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#111' }}>Biométrie</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Face ID / Empreinte digitale</p>
            </div>
            <Switch checked={biometric} onCheckedChange={v => toggle('fb-biometric', v, setBiometric)} onClick={e => e.stopPropagation()} />
          </div>
          <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
            onClick={() => toggle('fb-location', !location, setLocation)}>
            <IconWrap Icon={MapPin} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#111' }}>Localisation</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Autorisations de géolocalisation</p>
            </div>
            <Switch checked={location} onCheckedChange={v => toggle('fb-location', v, setLocation)} onClick={e => e.stopPropagation()} />
          </div>
        </GroupCard>
      </div>
    </SubScreen>
  )
}

// ── Change Password screen ────────────────────────────────────────────────────

function ChangePasswordScreen({ onBack }: { onBack: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) { setError('Le mot de passe doit avoir au moins 6 caractères.'); return }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setStatus('loading'); setError('')
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) { setError(err.message); setStatus('error'); return }
    setStatus('success')
    setTimeout(onBack, 1500)
  }

  return (
    <SubScreen>
      <SubHeader title="Changer le mot de passe" onBack={onBack} />
      <div className="px-4 pt-6 space-y-4">
        {status === 'success' ? (
          <div className="flex flex-col items-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#D1FAE5' }}>
              <Check className="w-8 h-8" style={{ color: '#059669' }} />
            </div>
            <p className="text-base font-semibold" style={{ color: '#111' }}>Mot de passe modifié !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Entrez votre nouveau mot de passe. Il doit contenir au moins 6 caractères.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-2xl px-4 text-sm border outline-none"
                  style={{ borderColor: '#E5E7EB', background: '#fff', color: '#111' }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-2xl px-4 text-sm border outline-none"
                  style={{ borderColor: '#E5E7EB', background: '#fff', color: '#111' }}
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-xs px-3 py-2 rounded-xl" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-12 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              style={{ background: '#9fe870', color: '#0e0f0c' }}
            >
              {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Enregistrer
            </button>
          </form>
        )}
      </div>
    </SubScreen>
  )
}

// ── Personal Details screen ───────────────────────────────────────────────────

function PersonalDetailsScreen({ onBack, onSettings, onHelp, onSignOut }: {
  onBack: () => void
  onSettings: () => void
  onHelp: () => void
  onSignOut: () => void
}) {
  const { user, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>((profile as any)?.avatar_url ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string>((profile as any)?.full_name ?? '')
  const [phone, setPhone] = useState<string>((profile as any)?.phone ?? '')
  const [address, setAddress] = useState<string>((profile as any)?.address ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const initials = (fullName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 200; canvas.height = 200
      const ctx = canvas.getContext('2d')!
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 200, 200)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      await supabase.from('wise_users').update({ avatar_url: dataUrl }).eq('id', user.id)
      setAvatarUrl(dataUrl)
      setUploadingAvatar(false)
    }
    img.src = url
  }

  async function saveField() {
    if (!user) return
    setSaving(true)
    await supabase.from('wise_users').update({ full_name: fullName, phone, address }).eq('id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => { setSaved(false); setEditingField(null) }, 800)
  }

  const infoRows = [
    { key: 'full_name', label: 'Nom complet', value: fullName || '—', Icon: User },
    { key: 'phone', label: 'Téléphone', value: phone || '—', Icon: Phone },
    { key: 'email', label: 'Email', value: profile?.email ?? user?.email ?? '—', Icon: Mail },
    { key: 'address', label: 'Adresse', value: address || 'Non renseigné', Icon: MapPin },
  ]

  return (
    <SubScreen>
      <SubHeader title="My Profile" onBack={onBack} right={
        <button className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer" style={{ background: '#F3F4F6' }}>
          <Bell className="w-4 h-4" style={{ color: '#374151' }} />
        </button>
      } />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* Avatar */}
      <div className="flex flex-col items-center pt-6 pb-5" style={{ background: '#fff' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group"
          disabled={uploadingAvatar}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white" style={{ background: '#4F46E5' }}>{initials}</div>}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 tr flex items-center justify-center rounded-full">
            {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
          </div>
        </button>
        <p className="text-base font-bold mt-3" style={{ color: '#111' }}>{profile?.full_name ?? 'Utilisateur'}</p>

        {/* Personal | Business tab */}
        <div className="flex rounded-full overflow-hidden mt-3 border" style={{ borderColor: '#E5E7EB' }}>
          <button onClick={() => setActiveTab('personal')}
            className="px-6 py-1.5 text-sm font-semibold cursor-pointer tr"
            style={activeTab === 'personal' ? { background: '#fff', color: '#111' } : { background: '#F3F4F6', color: '#9CA3AF' }}>
            Personal
          </button>
          <button onClick={() => setActiveTab('business')}
            className="px-6 py-1.5 text-sm font-semibold cursor-pointer tr"
            style={activeTab === 'business' ? { background: '#fff', color: '#111' } : { background: '#F3F4F6', color: '#9CA3AF' }}>
            Business
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Info rows */}
        <GroupCard>
          {infoRows.map(({ key, label, value, Icon }, i) => (
            <button key={key}
              className="w-full flex items-center gap-4 px-4 py-3.5 cursor-pointer tr hover:bg-gray-50 text-left"
              style={{ borderBottom: i < infoRows.length - 1 ? '1px solid #F9FAFB' : 'none' }}
              onClick={() => key !== 'email' && setEditingField(editingField === key ? null : key)}>
              <IconWrap Icon={Icon} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
                {editingField === key && key === 'full_name' ? (
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    className="text-sm font-semibold outline-none w-full" style={{ color: '#111' }}
                    autoFocus onBlur={saveField} />
                ) : editingField === key && key === 'phone' ? (
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="text-sm font-semibold outline-none w-full" style={{ color: '#111' }}
                    autoFocus onBlur={saveField} />
                ) : editingField === key && key === 'address' ? (
                  <input value={address} onChange={e => setAddress(e.target.value)}
                    className="text-sm font-semibold outline-none w-full" style={{ color: '#111' }}
                    autoFocus onBlur={saveField} />
                ) : (
                  <p className="text-sm font-semibold truncate" style={{ color: '#111' }}>{value}</p>
                )}
              </div>
              {saving && editingField === key
                ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#4F46E5' }} />
                : saved && editingField === key
                  ? <Check className="w-4 h-4" style={{ color: '#22C55E' }} />
                  : <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />}
            </button>
          ))}
        </GroupCard>

        {/* Settings & Help */}
        <GroupCard>
          <RowItem Icon={Settings} label="Settings" onPress={onSettings} />
          <RowItem Icon={HelpCircle} label="Help Center" onPress={onHelp} last />
        </GroupCard>

        {/* Log Out */}
        <button onClick={onSignOut}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl cursor-pointer tr"
          style={{ background: '#FFF1F0', color: '#EF4444' }}>
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">Log Out</span>
        </button>
      </div>
    </SubScreen>
  )
}

// ── Statements Modal ──────────────────────────────────────────────────────────

function StatementsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [txs, setTxs] = useState<Transaction[]>([])
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
      tx.amount.toFixed(2), tx.currency,
      tx.recipient_name ?? '', tx.reference ?? '',
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `releve-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const TYPE_LABEL: Record<string, string> = {
    send: 'Envoi', receive: 'Reçu', convert: 'Conversion',
    deposit: 'Dépôt', withdraw: 'Retrait', bill_payment: 'Facture',
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 70, background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-md rounded-t-3xl p-6 animate-fade-in-up" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: '#111' }}>Relevés de compte</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer" style={{ background: '#F3F4F6' }}>
            <X className="w-4 h-4" style={{ color: '#374151' }} />
          </button>
        </div>
        <button onClick={exportCSV}
          className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer mb-4"
          style={{ background: '#9fe870', color: '#0e0f0c' }}>
          <Download className="w-4 h-4" /> Télécharger CSV
        </button>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : txs.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>Aucune transaction.</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {txs.map(tx => {
              const curr = getCurrency(tx.currency)
              const isSend = tx.type === 'send' || tx.type === 'withdraw'
              return (
                <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#111' }}>
                      {TYPE_LABEL[tx.type] ?? tx.type}{tx.recipient_name ? ` — ${tx.recipient_name}` : ''}
                    </p>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{new Date(tx.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <p className="text-xs font-bold tabular-nums shrink-0" style={{ color: isSend ? '#EF4444' : '#22C55E' }}>
                    {isSend ? '−' : '+'}{curr?.symbol}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Share Modal ───────────────────────────────────────────────────────────────

function ShareModal({ name, userCode, onClose }: { name: string; userCode: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(userCode)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: 'FamillyBill HT', text: `Mon ID: ${userCode}\nNom: ${name}` }); return } catch { /* fallback */ }
    }
    copy()
  }

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 70, background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-t-3xl overflow-hidden animate-fade-in-up" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold" style={{ color: '#111' }}>Partager mon profil</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer" style={{ background: '#F3F4F6' }}>
            <X className="w-4 h-4" style={{ color: '#374151' }} />
          </button>
        </div>
        <div className="mx-5 mb-5 relative overflow-hidden rounded-2xl p-5" style={{ background: '#4F46E5' }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20" style={{ background: '#818CF8' }} />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>ID FamillyBill</p>
            <p className="text-2xl font-black tracking-widest font-mono mb-1 text-white">{userCode}</p>
            <p className="text-sm font-medium text-white">{name}</p>
          </div>
        </div>
        <div className="px-5 pb-6 grid grid-cols-2 gap-3">
          <button onClick={copy}
            className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold border cursor-pointer tr"
            style={{ borderColor: '#E5E7EB', color: '#374151' }}>
            {copied ? <Check className="w-4 h-4" style={{ color: '#22C55E' }} /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button onClick={share}
            className="flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: '#9fe870', color: '#0e0f0c' }}>
            <Share2 className="w-4 h-4" /> Partager
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Profile Page ─────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [screenStack, setScreenStack] = useState<Screen[]>(['main'])
  const screen = screenStack[screenStack.length - 1]
  const push = useCallback((s: Screen) => setScreenStack(p => [...p, s]), [])
  const back = useCallback(() => setScreenStack(p => p.length > 1 ? p.slice(0, -1) : p), [])

  const [displayCode,  setDisplayCode]  = useState<string>((profile as any)?.user_code ?? '')
  const [avatarUrl,    setAvatarUrl]    = useState<string>((profile as any)?.avatar_url ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showStatements, setShowStatements] = useState(false)
  const [biometric, setBiometric] = useState(() => localStorage.getItem('fb-biometric') === 'true')

  const ensureUserCode = useCallback(async () => {
    if (!user || (profile as any)?.user_code) return
    const code = 'FB' + Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('wise_users').update({ user_code: code }).eq('id', user.id)
    setDisplayCode(code)
  }, [user, profile])

  useEffect(() => {
    const code = (profile as any)?.user_code
    if (code) setDisplayCode(code); else ensureUserCode()
    const av = (profile as any)?.avatar_url
    if (av) setAvatarUrl(av)
  }, [profile, ensureUserCode])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 200; canvas.height = 200
      const ctx = canvas.getContext('2d')!
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 200, 200)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      await supabase.from('wise_users').update({ avatar_url: dataUrl }).eq('id', user.id)
      setAvatarUrl(dataUrl)
      setUploadingAvatar(false)
    }
    img.src = url
  }

  const initials = (profile?.full_name ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  async function handleSignOut() { await signOut(); navigate('/') }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#F5F5F7', maxWidth: '100vw' }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      {showShare && <ShareModal name={profile?.full_name ?? 'Utilisateur'} userCode={displayCode} onClose={() => setShowShare(false)} />}
      {showStatements && <StatementsModal onClose={() => setShowStatements(false)} />}

      {/* ── Main Screen ── */}
      <div className="pb-28">
        {/* Profile header */}
        <div className="pt-5 pb-6 flex flex-col items-center" style={{ background: '#F5F5F7' }}>
          <p className="text-base font-bold mb-5" style={{ color: '#111', letterSpacing: '-0.02em' }}>Profile</p>

          {/* Avatar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group mb-3"
            disabled={uploadingAvatar}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: '#4F46E5' }}>{initials}</div>}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 tr flex items-center justify-center rounded-full">
              {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            </div>
          </button>

          <p className="text-base font-bold" style={{ color: '#111' }}>{profile?.full_name ?? 'Utilisateur'}</p>

          {/* Verified badge */}
          <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full"
            style={{ background: '#4F46E5' }}>
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
            <span className="text-xs font-semibold text-white">Verified</span>
          </div>
        </div>

        <div className="px-4 space-y-3">
          {/* Group 1 */}
          <GroupCard>
            <RowItem Icon={User} label="Personal Details" onPress={() => push('personal')} />
            <RowItem Icon={Bell} label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
              onPress={() => navigate('/notifications')} />
            <RowItem Icon={Fingerprint} label="Set Up Face ID" right={
              <Switch checked={biometric}
                onCheckedChange={v => { setBiometric(v); localStorage.setItem('fb-biometric', String(v)) }}
                onClick={e => e.stopPropagation()} />
            } />
            <RowItem Icon={ShieldCheck} label="Privacy & Security" onPress={() => push('privacy')} last />
          </GroupCard>

          {/* Group 2 */}
          <GroupCard>
            <RowItem Icon={Settings} label="Paramètres" onPress={() => push('settings')} />
            <RowItem Icon={HelpCircle} label="Support" onPress={() => navigate('/support')} last />
          </GroupCard>

          {/* Admin link — visible only for admin/super_admin */}
          {((profile as any)?.role === 'admin' || (profile as any)?.role === 'super_admin') && (
            <GroupCard>
              <RowItem
                Icon={ShieldCheck}
                label="Administration"
                onPress={() => navigate('/admin/dashboard')}
                last
                right={
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#9fe870', color: '#0e0f0c' }}>
                      {(profile as any)?.role === 'super_admin' ? 'SUPER' : 'ADMIN'}
                    </span>
                    <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />
                  </div>
                }
              />
            </GroupCard>
          )}

          {/* User ID */}
          <GroupCard>
            <div className="px-4 py-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: 16 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>Mon ID</p>
                <p className="text-base font-black font-mono text-white">{displayCode || '—'}</p>
              </div>
              <button onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>
                <Share2 className="w-3.5 h-3.5" /> Partager
              </button>
            </div>
          </GroupCard>

          {/* Statements link */}
          <button onClick={() => setShowStatements(true)}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer tr"
            style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <IconWrap Icon={Download} />
            <span className="flex-1 text-left text-sm font-medium" style={{ color: '#111' }}>Relevés de compte (CSV)</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#C7C7CC' }} />
          </button>

          {/* Sign out */}
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer tr"
            style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <IconWrap Icon={LogOut} color="#EF4444" bg="#FEF2F2" />
            <span className="flex-1 text-left text-sm font-semibold" style={{ color: '#EF4444' }}>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* ── Sub-screens (rendered as fixed overlays) ── */}
      {screen === 'personal' && (
        <PersonalDetailsScreen
          onBack={back}
          onSettings={() => push('settings')}
          onHelp={() => {}}
          onSignOut={handleSignOut}
        />
      )}
      {screen === 'notif-manage' && (
        <ManageNotifsScreen onBack={back} />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          onBack={back}
          onNotifs={() => push('notif-manage')}
          onChangePassword={() => push('change-password')}
        />
      )}
      {screen === 'privacy' && (
        <PrivacyScreen onBack={back} />
      )}
      {screen === 'change-password' && (
        <ChangePasswordScreen onBack={back} />
      )}
    </div>
  )
}
