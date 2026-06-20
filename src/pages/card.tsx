import { useState } from 'react'
import { CreditCard, Eye, EyeOff, Lock, Unlock, Smartphone, Shield, Check, ChevronRight, MapPin } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/auth-context'

const SPENDING = [
  { flag: '🇫🇷', country: 'France', amount: '€124.50', currency: 'EUR', date: 'Aujourd\'hui' },
  { flag: '🇯🇵', country: 'Japon', amount: '¥8 400', currency: 'JPY', date: 'Hier' },
  { flag: '🇺🇸', country: 'États-Unis', amount: '$45.00', currency: 'USD', date: 'Il y a 2 jours' },
]

export function CardPage() {
  const { profile } = useAuth()
  const [frozen, setFrozen] = useState(false)
  const [showNumber, setShowNumber] = useState(false)
  const [online, setOnline] = useState(true)
  const [contactless, setContactless] = useState(true)
  const [atm, setAtm] = useState(true)
  const name = profile?.full_name ?? 'Votre Nom'

  return (
    <div className="min-h-screen pb-20 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Carte</h1>
          <p className="text-sm text-[var(--ink-60)]">Dépensez dans 10+ pays au taux réel</p>
        </div>

        {/* Card visual */}
        <div className="flex justify-center py-2">
          <div className="relative">
            <div
              className="w-72 h-44 rounded-3xl p-5 flex flex-col justify-between"
              style={{
                background: frozen
                  ? 'linear-gradient(135deg, #888 0%, #aaa 100%)'
                  : 'linear-gradient(135deg, var(--ink) 0%, #1a1c18 100%)',
                boxShadow: '0 20px 60px rgba(14,15,12,0.25)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="FamillyBill" className="w-5 h-5 object-contain" style={{ opacity: frozen ? 0.5 : 1 }} />
                  <span className="text-white font-semibold text-xs">FamillyBill</span>
                  <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: 'var(--lime)', color: '#ffffff' }}>HT</span>
                </div>
                {frozen && <Lock className="w-4 h-4 text-white/50" />}
              </div>
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Multi-devises</p>
                <p className="text-white font-mono tracking-[0.2em] text-sm">
                  {showNumber ? '4729 1234 5678 9012' : '•••• •••• •••• 4729'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-white/30 text-[9px] uppercase tracking-widest">Titulaire</p>
                    <p className="text-white/80 text-xs font-medium">{name.toUpperCase().slice(0, 22)}</p>
                  </div>
                  <CreditCard className="w-5 h-5 text-white/30" />
                </div>
              </div>
            </div>
            {frozen && (
              <div className="absolute inset-0 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(14,15,12,0.5)' }}>
                <div className="text-center">
                  <Lock className="w-6 h-6 text-white mx-auto mb-1" />
                  <p className="text-white font-medium text-sm">Carte bloquée</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              icon: frozen ? Unlock : Lock,
              label: frozen ? 'Débloquer' : 'Bloquer',
              onClick: () => setFrozen(!frozen),
            },
            {
              icon: showNumber ? EyeOff : Eye,
              label: showNumber ? 'Masquer' : 'Afficher',
              onClick: () => setShowNumber(!showNumber),
            },
            {
              icon: Smartphone,
              label: 'Portefeuille',
              onClick: () => {},
            },
          ].map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="card-flat flex flex-col items-center gap-2 p-4 hover:bg-[var(--surface)] tr cursor-pointer"
            >
              <Icon className="w-5 h-5 text-[var(--ink)]" />
              <span className="text-xs font-medium text-[var(--ink-60)]">{label}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Dépensé ce mois', value: '€243.50' },
            { label: 'Devises', value: '3' },
            { label: 'Pays', value: '3' },
          ].map((s, i) => (
            <div key={i} className="card-flat p-4 text-center">
              <p className="text-xl font-bold text-[var(--ink)] tabular-nums">{s.value}</p>
              <p className="text-xs text-[var(--ink-60)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Card controls */}
        <div className="card-flat overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
            <Shield className="w-4 h-4 text-[var(--ink-60)]" />
            <h3 className="font-semibold text-sm text-[var(--ink)]">Contrôles de carte</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {[
              { label: 'Paiements en ligne', desc: 'Autoriser les achats web', state: online, setState: setOnline },
              { label: 'Sans contact', desc: 'Paiement par approche', state: contactless, setState: setContactless },
              { label: 'Retraits DAB', desc: 'Retirer du cash', state: atm, setState: setAtm },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-sm text-[var(--ink)]">{item.label}</p>
                  <p className="text-xs text-[var(--ink-60)]">{item.desc}</p>
                </div>
                <Switch checked={item.state} onCheckedChange={item.setState} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent spending */}
        <div className="card-flat overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
            <MapPin className="w-4 h-4 text-[var(--ink-60)]" />
            <h3 className="font-semibold text-sm text-[var(--ink)]">Dépenses récentes</h3>
            <span className="ml-auto text-[10px] font-medium text-[var(--ink-60)] border border-[var(--border)] px-1.5 py-0.5 rounded">Carte</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {SPENDING.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--surface)] tr cursor-pointer">
                <span className="text-xl">{item.flag}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-[var(--ink)]">{item.country}</p>
                  <p className="text-xs text-[var(--ink-60)]">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-[var(--ink)]">{item.amount}</p>
                  <p className="text-xs text-[var(--ink-60)]">{item.currency}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--ink-30)]" />
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="card-dark p-6 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-5" style={{ background: 'var(--lime)' }} />
          <h3 className="font-semibold text-white mb-4 relative z-10">Avantages carte</h3>
          <div className="grid grid-cols-2 gap-2.5 relative z-10">
            {[
              'Sans frais de change',
              'Taux de change réel',
              'Blocage instantané',
              'Dépensez en 10 devises',
              'Valide dans 10+ pays',
              'Apple & Google Pay',
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--lime)' }}>
                  <Check className="w-2.5 h-2.5" style={{ color: 'var(--ink)' }} />
                </div>
                <span className="text-white/70 text-xs">{b}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
