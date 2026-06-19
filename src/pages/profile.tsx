import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, FileText, KeyRound, Wallet2, Fingerprint, ShieldCheck,
  MapPin, Languages, Gauge, Download, ChevronRight,
  LogOut, Moon, Sun, Check,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'

const LANGUAGES = ['Français', 'English', 'Kreyòl ayisyen', 'Español', 'Português']

export function ProfilePage() {
  const { profile, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [biometric,    setBiometric]    = useState(true)
  const [twoFA,        setTwoFA]        = useState(true)
  const [location,     setLocation]     = useState(false)
  const [showLang,     setShowLang]     = useState(false)
  const [selectedLang, setSelectedLang] = useState('Français')

  const initials = (profile?.full_name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Profile header */}
        <div className="card-flat p-6 flex items-center gap-4 animate-fade-in-up">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: 'var(--ink)' }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-[var(--ink)]">{profile?.full_name ?? 'Utilisateur'}</h1>
            <p className="text-sm text-[var(--ink-60)]">{profile?.email ?? ''}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
              <Check className="w-2.5 h-2.5" /> Compte vérifié
            </span>
          </div>
        </div>

        {/* Account section */}
        <Section title="Compte" delay={50}>
          <MenuItem icon={User}       label="Détails du compte"     desc="Informations personnelles"   />
          <MenuItem icon={FileText}   label="Relevés de compte"     desc="Télécharger vos relevés"     />
          <MenuItem icon={KeyRound}   label="Changer le code PIN"   desc="Modifier votre PIN"          />
          <MenuItem icon={Wallet2}    label="Audit Stellar"         desc="Vérifier le solde on-chain"  last />
        </Section>

        {/* Security section */}
        <Section title="Sécurité" delay={100}>
          <ToggleItem
            icon={Fingerprint}
            label="Authentification biométrique"
            desc="Face ID / Empreinte digitale"
            checked={biometric}
            onChange={setBiometric}
          />
          <ToggleItem
            icon={ShieldCheck}
            label="Double authentification (2FA)"
            desc="Protection renforcée"
            checked={twoFA}
            onChange={setTwoFA}
          />
          <ToggleItem
            icon={MapPin}
            label="Activer la localisation"
            desc="Transactions par géolocalisation"
            checked={location}
            onChange={setLocation}
            last
          />
        </Section>

        {/* Preferences section */}
        <Section title="Préférences" delay={150}>
          {/* Theme toggle */}
          <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer" onClick={toggleTheme}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--surface-2)]">
              {theme === 'dark'
                ? <Sun  className="w-4 h-4 text-[var(--ink-60)]" />
                : <Moon className="w-4 h-4 text-[var(--ink-60)]" />}
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
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--surface-2)]">
                <Languages className="w-4 h-4 text-[var(--ink-60)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--ink)]">Langue</p>
                <p className="text-xs text-[var(--ink-60)]">{selectedLang}</p>
              </div>
              <ChevronRight className={cn("w-4 h-4 text-[var(--ink-30)] tr", showLang && "rotate-90")} />
            </div>
            {showLang && (
              <div className="mx-4 mb-2 rounded-xl border border-[var(--border)] overflow-hidden animate-scale-in">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setSelectedLang(lang); setShowLang(false) }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-sm tr cursor-pointer hover:bg-[var(--surface)]",
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

          <MenuItem icon={Gauge}    label="Limites de transaction"  desc="Gérer vos plafonds"          />
          <MenuItem icon={Download} label="Télécharger formulaire W-8 BEN" desc="Formulaire fiscal" last />
        </Section>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full card-flat flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-50 tr cursor-pointer animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Déconnexion</span>
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
  icon: Icon,
  label,
  desc,
  last = false,
}: {
  icon: typeof User
  label: string
  desc?: string
  last?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer", last && "")}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--surface-2)]">
        <Icon className="w-4 h-4 text-[var(--ink-60)]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
        {desc && <p className="text-xs text-[var(--ink-60)]">{desc}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--ink-30)] shrink-0" />
    </div>
  )
}

function ToggleItem({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
  last = false,
}: {
  icon: typeof User
  label: string
  desc?: string
  checked: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface)] tr", last && "")}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--surface-2)]">
        <Icon className="w-4 h-4 text-[var(--ink-60)]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
        {desc && <p className="text-xs text-[var(--ink-60)]">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
