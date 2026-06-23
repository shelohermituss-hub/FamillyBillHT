import { useState } from 'react'
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ArrowLeftRight, Building2, FileText,
  Bell, BarChart3, Shield, Settings, LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

// ── AdminProtectedRoute ────────────────────────────────────────
export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D1B4B' }}>
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  const role = (profile as { role?: string } | null)?.role
  if (role !== 'admin' && role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// ── Nav items ──────────────────────────────────────────────────
const ADMIN_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/admin/dashboard' },
  { icon: Users,           label: 'Utilisateurs',  href: '/admin/users'     },
  { icon: ArrowLeftRight,  label: 'Transactions',  href: '/admin/transactions' },
  { icon: Building2,       label: 'Fournisseurs',  href: '/admin/providers' },
  { icon: FileText,        label: 'Reçus',          href: '/admin/receipts'  },
  { icon: Bell,            label: 'Notifications', href: '/admin/notifications' },
  { icon: BarChart3,       label: 'Rapports',      href: '/admin/reports'   },
  { icon: Shield,          label: 'Audit logs',    href: '/admin/audit-logs' },
  { icon: Settings,        label: 'Paramètres',    href: '/admin/settings'  },
]

// ── AdminLayout ────────────────────────────────────────────────
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  function Sidebar() {
    return (
      <div className="flex flex-col h-full" style={{ background: '#0D1B4B' }}>
        {/* Logo */}
        <div className="px-5 h-16 flex items-center gap-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0" style={{ background: '#9fe870' }}>
            <img src="/logo.png" alt="" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">FamillyBill</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: '#9fe870', color: '#0D1B4B' }}>ADMIN</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {ADMIN_NAV.map(({ icon: Icon, label, href }) => {
            const active = location.pathname === href || location.pathname.startsWith(href + '/')
            return (
              <Link key={href} to={href} onClick={() => setSideOpen(false)}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  style={active
                    ? { background: '#9fe870', color: '#0D1B4B' }
                    : { color: 'rgba(255,255,255,0.65)' }}
                >
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                    style={active ? { background: 'rgba(13,27,75,0.2)' } : {}}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 pb-4 pt-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#9fe870', color: '#0D1B4B' }}>
              {((profile?.full_name ?? 'A')[0]).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name ?? 'Admin'}</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{profile?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    )
  }

  const currentLabel = ADMIN_NAV.find(n => location.pathname.startsWith(n.href))?.label ?? 'Administration'

  return (
    <div className="min-h-screen flex" style={{ background: '#F3F4F8' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSideOpen(false)} />
          <div className="relative w-60 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Mobile header */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center gap-3"
        style={{ background: '#0D1B4B', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={() => setSideOpen(v => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          {sideOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
        </button>
        <span className="text-white font-bold text-sm flex-1">{currentLabel}</span>
        <Link
          to="/dashboard"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
        >
          App
        </Link>
      </header>

      {/* Desktop top bar */}
      <div
        className="hidden md:flex fixed top-0 z-20 h-14 items-center px-6 gap-4"
        style={{ left: 240, right: 0, background: 'white', borderBottom: '1px solid #E5E7EB' }}
      >
        <h1 className="text-sm font-bold text-gray-800 flex-1">{currentLabel}</h1>
        <Link
          to="/dashboard"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: '#F3F4F8', color: '#6B7280' }}
        >
          Retour à l'app
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(159,232,112,0.15)' }}>
          <Shield className="w-3.5 h-3.5" style={{ color: '#9fe870' }} />
          <span className="text-xs font-semibold" style={{ color: '#0D1B4B' }}>
            {(profile as { role?: string } | null)?.role ?? 'admin'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 min-h-screen">
        {children}
      </main>
    </div>
  )
}
