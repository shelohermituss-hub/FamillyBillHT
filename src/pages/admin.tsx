import { ShieldCheck, Users, ArrowLeftRight, Building2, FileText, Bell, BarChart2, Settings, Lock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const MODULES = [
  { icon: BarChart2,    label: 'Dashboard',       desc: 'KPIs & métriques temps réel',         href: '#', color: '#6366f1' },
  { icon: Users,        label: 'Utilisateurs',    desc: 'Comptes, statuts, historique',        href: '#', color: '#0ea5e9' },
  { icon: ArrowLeftRight, label: 'Transactions', desc: 'Paiements, remboursements, logs',    href: '#', color: '#10b981' },
  { icon: Building2,    label: 'Fournisseurs',    desc: 'Gestion & configuration API',         href: '#', color: '#f59e0b' },
  { icon: FileText,     label: 'Reçus',           desc: 'Vérification & régénération',         href: '#', color: '#8b5cf6' },
  { icon: Bell,         label: 'Notifications',   desc: 'Templates & canaux d\'envoi',          href: '#', color: '#ec4899' },
  { icon: BarChart2,    label: 'Rapports',        desc: 'Exports CSV/PDF, rapports financiers', href: '#', color: '#14b8a6' },
  { icon: Lock,         label: 'Audit logs',      desc: 'Traçabilité complète des actions',    href: '#', color: '#f43f5e' },
  { icon: Settings,     label: 'Paramètres',      desc: 'Config système, rôles, permissions',  href: '#', color: '#64748b' },
]

export function AdminPage() {
  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(159,232,112,0.15)' }}>
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--lime)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Administration</h1>
          <p className="text-xs" style={{ color: 'var(--ink-60)' }}>Centre de contrôle FamillyBill HT</p>
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="rounded-2xl p-4 mb-6 flex items-start gap-3"
        style={{ background: 'rgba(159,232,112,0.12)', border: '1px solid rgba(159,232,112,0.35)' }}>
        <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--lime)' }} />
        <div>
          <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--ink)' }}>Module en cours de développement</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-60)' }}>
            Le panneau d'administration complet sera disponible prochainement. Il inclura la gestion des utilisateurs, transactions, fournisseurs, audit logs et rapports.
          </p>
        </div>
      </div>

      {/* Modules grid */}
      <div className="space-y-2">
        {MODULES.map(({ icon: Icon, label, desc, color }) => (
          <div key={label}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{label}</p>
              <p className="text-xs truncate" style={{ color: 'var(--ink-60)' }}>{desc}</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-60)' }}>Bientôt</span>
          </div>
        ))}
      </div>

      {/* Back link */}
      <div className="mt-6 flex justify-center">
        <Link to="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold cursor-pointer"
          style={{ color: 'var(--ink-60)' }}>
          <ChevronRight className="w-4 h-4 rotate-180" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
