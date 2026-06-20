import { useState } from 'react'
import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Wallet, BarChart2, LogOut, Bell, User, Receipt, X, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notifications-context'
import { NotificationsPanel } from '@/components/notifications-panel'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: Home,     label: 'Accueil',      href: '/dashboard'  },
  { icon: Receipt,  label: 'Payer',        href: '/bills'      },
  { icon: Wallet,   label: 'Wallet',       href: '/wallet'     },
  { icon: Users,    label: 'Famille',      href: '/family'     },
  { icon: BarChart2, label: 'Statistiques', href: '/history'   },
]

function isActive(href: string, path: string) {
  if (href === '/dashboard') return path === '/dashboard'
  return path === href || path.startsWith(href + '/')
}

function HeaderActions() {
  const { unreadCount } = useNotifications()
  const { profile } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)

  const initials = (profile?.full_name ?? 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const avatarUrl = (profile as any)?.avatar_url as string | undefined

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <button
          onClick={() => setNotifOpen(v => !v)}
          aria-label="Notifications"
          className="w-8 h-8 flex items-center justify-center rounded-full tr cursor-pointer relative"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-60)' }}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: 'var(--lime)', color: '#ffffff' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>

      <Link to="/profile">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-80 tr shrink-0 overflow-hidden"
          style={avatarUrl ? {} : { background: 'var(--ink)', color: 'white' }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            : (initials || <User className="w-4 h-4" />)}
        </div>
      </Link>
    </div>
  )
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const avatarUrl = (profile as any)?.avatar_url as string | undefined
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() { await signOut(); navigate('/') }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--surface)' }}>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30"
        style={{ background: 'var(--card-bg)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="px-5 h-16 flex items-center border-b border-[var(--border)] shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl shrink-0 overflow-hidden">
              <img src="/logo.png" alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold text-[var(--ink)] tracking-tight leading-none">FamillyBill</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none mt-0.5 inline-block"
                style={{ background: 'var(--lime)', color: '#ffffff' }}
              >HT</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, location.pathname)
            return (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium tr cursor-pointer",
                    active
                      ? "font-semibold"
                      : "hover:bg-[var(--surface)]"
                  )}
                  style={active
                    ? { background: 'var(--lime)', color: '#ffffff' }
                    : { color: 'var(--ink-60)' }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 tr"
                    style={active
                      ? { background: 'rgba(255,255,255,0.18)' }
                      : { background: 'transparent' }}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 border-t border-[var(--border)] space-y-1 shrink-0">
          <Link to="/profile">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface)] tr cursor-pointer">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                style={avatarUrl ? {} : { background: 'var(--ink)', color: 'white' }}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  : (profile?.full_name ?? 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[var(--ink)]">{profile?.full_name ?? 'Utilisateur'}</p>
                <p className="text-xs truncate" style={{ color: 'var(--ink-60)' }}>{profile?.email ?? ''}</p>
              </div>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium tr cursor-pointer hover:bg-[var(--surface)]"
            style={{ color: 'var(--ink-60)' }}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Desktop top bar ── */}
      <div
        className="hidden md:flex fixed top-0 right-0 z-20 h-16 items-center px-6"
        style={{ left: 256, background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex-1" />
        <HeaderActions />
      </div>

      {/* ── Mobile header ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between"
        style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg shrink-0 overflow-hidden">
            <img src="/logo.png" alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
          <span className="font-bold text-sm text-[var(--ink)] tracking-tight">
            FamillyBill{' '}
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--lime)', color: '#ffffff' }}
            >HT</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <HeaderActions />
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Fermer menu' : 'Ouvrir menu'}
            className="w-8 h-8 flex items-center justify-center rounded-full tr cursor-pointer"
            style={{ background: 'var(--surface-2)' }}
          >
            {menuOpen
              ? <X className="w-4 h-4 text-[var(--ink)]" />
              : (
                <div className="space-y-1">
                  <span className="block w-4 h-0.5 rounded-full" style={{ background: 'var(--ink)' }} />
                  <span className="block w-2.5 h-0.5 rounded-full" style={{ background: 'var(--ink)' }} />
                  <span className="block w-4 h-0.5 rounded-full" style={{ background: 'var(--ink)' }} />
                </div>
              )}
          </button>
        </div>
      </header>

      {/* ── Mobile menu overlay ── */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 pt-14 animate-slide-down"
          style={{ background: 'var(--card-bg)' }}
        >
          <nav className="px-4 py-5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3" style={{ color: 'var(--ink-30)' }}>
              Navigation
            </p>
            {NAV_ITEMS.map(item => {
              const active = isActive(item.href, location.pathname)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  <div
                    className={cn(
                      "flex items-center gap-4 px-3 py-3.5 rounded-2xl tr cursor-pointer",
                      active ? "" : "hover:bg-[var(--surface)]"
                    )}
                    style={active ? { background: 'var(--lime)' } : {}}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                      style={active
                        ? { background: 'rgba(255,255,255,0.18)' }
                        : { background: 'var(--surface-2)' }}
                    >
                      <item.icon
                        className="w-5 h-5"
                        style={{ color: active ? '#ffffff' : 'var(--ink-60)' }}
                      />
                    </div>
                    <span
                      className="text-base font-semibold"
                      style={{ color: active ? '#ffffff' : 'var(--ink-60)' }}
                    >
                      {item.label}
                    </span>
                    {active && (
                      <div className="ml-auto w-2 h-2 rounded-full" style={{ background: '#ffffff', opacity: 0.5 }} />
                    )}
                  </div>
                </Link>
              )
            })}

            <div className="h-px my-3" style={{ background: 'var(--border)' }} />

            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              <div className="flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-[var(--surface)] tr cursor-pointer">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0" style={{ background: 'var(--surface-2)' }}>
                  <User className="w-5 h-5" style={{ color: 'var(--ink-60)' }} />
                </div>
                <span className="text-base font-semibold" style={{ color: 'var(--ink-60)' }}>Profil</span>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-3 py-3.5 rounded-2xl hover:bg-[var(--surface)] tr cursor-pointer"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0" style={{ background: 'var(--surface-2)' }}>
                <LogOut className="w-5 h-5" style={{ color: 'var(--ink-60)' }} />
              </div>
              <span className="text-base font-semibold" style={{ color: 'var(--ink-60)' }}>Déconnexion</span>
            </button>
          </nav>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-16 min-h-screen pb-32 md:pb-0">
        {children}
      </main>

      {/* ── Mobile bottom nav (floating pill) ── */}
      <nav
        className="md:hidden fixed z-40"
        style={{
          bottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
          left: 16,
          right: 16,
        }}
      >
        <div
          className="flex items-center justify-around px-2 py-2 rounded-[2rem]"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(14,15,12,0.14), 0 2px 8px rgba(14,15,12,0.07)',
            border: '1px solid rgba(14,15,12,0.06)',
          }}
        >
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, location.pathname)
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex-1 flex items-center justify-center py-0.5"
              >
                <div
                  className="flex items-center justify-center rounded-2xl tr cursor-pointer"
                  style={{
                    width: 48,
                    height: 40,
                    background: active ? 'var(--lime)' : 'transparent',
                    transition: 'background 180ms ease',
                  }}
                >
                  <item.icon
                    className="tr"
                    style={{
                      width: 18,
                      height: 18,
                      color: active ? '#ffffff' : 'var(--ink-30)',
                    }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
