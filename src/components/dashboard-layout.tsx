import { useState } from 'react'
import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Bell, User, ChevronRight, Settings, ShieldCheck, BarChart2 } from 'lucide-react'

type IconProps = { className?: string; style?: React.CSSProperties }

function NavIconHome({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z"/>
      <path d="M9 21V13h6v8"/>
    </svg>
  )
}
function NavIconWallet({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <circle cx="16.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function NavIconBills({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  )
}
function NavIconFamily({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="9" cy="7" r="3"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <circle cx="18" cy="8" r="2.5"/>
      <path d="M21 21v-1.5a3.5 3.5 0 00-2.5-3.35"/>
    </svg>
  )
}
function NavIconProfile({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}
function NavIconStats({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M18 20V10"/>
      <path d="M12 20V4"/>
      <path d="M6 20v-6"/>
    </svg>
  )
}

import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notifications-context'
import { cn } from '@/lib/utils'

type NavItemDef = { icon: React.FC<IconProps>; label: string; href: string }

const NAV_ITEMS: NavItemDef[] = [
  { icon: NavIconHome,    label: 'Accueil', href: '/dashboard' },
  { icon: NavIconWallet,  label: 'Wallet',  href: '/wallet'    },
  { icon: NavIconStats,   label: 'Stats',   href: '/history'   },
  { icon: NavIconProfile, label: 'Profil',  href: '/profile'   },
]

const SIDEBAR_ITEMS = [
  { icon: NavIconHome,   label: 'Accueil',   href: '/dashboard' },
  { icon: NavIconWallet, label: 'Wallet',    href: '/wallet'    },
  { icon: NavIconBills,  label: 'Factures',  href: '/bills'     },
  { icon: NavIconFamily, label: 'Famille',   href: '/family'    },
  { icon: NavIconStats,  label: 'Historique',href: '/history'   },
]

function isActive(href: string, path: string) {
  if (href === '/dashboard') return path === '/dashboard'
  return path === href || path.startsWith(href + '/')
}

// ── Profile Dropdown ──────────────────────────────────────────────────────────
function ProfileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const avatarUrl = (profile as any)?.avatar_url as string | undefined
  const initials = (profile?.full_name ?? 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleSignOut() {
    onClose()
    await signOut()
    navigate('/')
  }

  function go(href: string) {
    onClose()
    navigate(href)
  }

  if (!open) return null

  const MENU_ITEMS = [
    { icon: User,       label: 'Mon profil',   href: '/profile' },
    { icon: BarChart2,  label: 'Historique',   href: '/history' },
    { icon: Settings,   label: 'Paramètres',   href: '/profile' },
  ]

  return (
    <>
      {/* Backdrop — invisible, closes on tap */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Floating card — positioned below header, right-aligned */}
      <div
        className="fixed z-50 rounded-[28px] overflow-hidden"
        style={{
          top: 58,
          right: 8,
          width: 'calc(75vw)',
          maxWidth: 280,
          background: '#ffffff',
          boxShadow: '0 12px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)',
          animation: 'slideDown 200ms cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        {/* User info */}
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: '1px solid #F0F0F0' }}
        >
          <div
            className="w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center text-base font-bold shrink-0"
            style={avatarUrl
              ? { border: '2px solid #E5E7EB' }
              : { background: 'var(--lime)', color: '#fff' }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : (initials || <User className="w-5 h-5" />)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] leading-tight truncate" style={{ color: '#111827' }}>
              {profile?.full_name ?? 'Utilisateur'}
            </p>
            <p className="text-[13px] truncate mt-0.5" style={{ color: '#9CA3AF' }}>
              {(profile as any)?.email ?? ''}
            </p>
          </div>
        </div>

        {/* Menu items */}
        <div className="py-1.5">
          {MENU_ITEMS.map(({ icon: Icon, label, href }) => (
            <button
              key={label}
              onClick={() => go(href)}
              className="w-full flex items-center gap-3.5 px-5 py-3.5 cursor-pointer tr hover:bg-gray-50 active:bg-gray-100"
            >
              <Icon className="w-[20px] h-[20px] shrink-0" style={{ color: '#6B7280' }} />
              <span className="flex-1 text-[15px] font-semibold text-left" style={{ color: '#111827' }}>
                {label}
              </span>
              <ChevronRight className="w-[16px] h-[16px] shrink-0" style={{ color: '#D1D5DB' }} />
            </button>
          ))}

          {/* Administration */}
          <button
            onClick={() => go('/admin')}
            className="w-full flex items-center gap-3.5 px-5 py-3.5 cursor-pointer tr hover:bg-gray-50 active:bg-gray-100"
          >
            <ShieldCheck className="w-[20px] h-[20px] shrink-0" style={{ color: '#6B7280' }} />
            <span className="flex-1 text-[15px] font-semibold text-left" style={{ color: '#111827' }}>
              Administration
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'var(--lime)', color: '#fff' }}>
              ADMIN
            </span>
          </button>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: '#F0F0F0', margin: '0 16px' }} />

        {/* Logout */}
        <div className="py-1.5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3.5 px-5 py-3.5 cursor-pointer tr hover:bg-red-50"
          >
            <LogOut className="w-[20px] h-[20px] shrink-0" style={{ color: '#EF4444' }} />
            <span className="text-[15px] font-semibold" style={{ color: '#EF4444' }}>
              Déconnexion
            </span>
          </button>
        </div>
      </div>
    </>
  )
}

// ── Header Actions ─────────────────────────────────────────────────────────────
function HeaderActions({ onProfileOpen }: { onProfileOpen: () => void }) {
  const { unreadCount } = useNotifications()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const initials = (profile?.full_name ?? 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const avatarUrl = (profile as any)?.avatar_url as string | undefined

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate('/notifications')}
        aria-label="Notifications"
        className="w-9 h-9 flex items-center justify-center rounded-xl tr cursor-pointer relative"
        style={{ background: 'var(--surface-2)', color: 'var(--ink-60)' }}
      >
        <Bell className="w-[17px] h-[17px]" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: 'var(--lime)', color: '#ffffff' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Profile avatar — opens drawer */}
      <button
        onClick={onProfileOpen}
        aria-label="Menu profil"
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden cursor-pointer tr"
        style={avatarUrl ? { border: '2px solid var(--border)' } : { background: 'var(--lime)', color: 'white' }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          : (initials || <User className="w-4 h-4" />)}
      </button>
    </div>
  )
}

// ── Layout ─────────────────────────────────────────────────────────────────────
export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const avatarUrl = (profile as any)?.avatar_url as string | undefined
  const location = useLocation()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  async function handleSignOut() { await signOut(); navigate('/') }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--surface)' }}>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30"
        style={{ background: 'var(--card-bg)', borderRight: '1px solid var(--border)' }}
      >
        <div className="px-5 h-16 flex items-center border-b border-[var(--border)] shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl shrink-0 overflow-hidden">
              <img src="/logo.png" alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold text-[var(--ink)] tracking-tight leading-none">FamillyBill</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none mt-0.5 inline-block"
                style={{ background: 'var(--lime)', color: '#ffffff' }}>HT</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => {
            const active = isActive(item.href, location.pathname)
            return (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold tr cursor-pointer",
                    active ? "" : "hover:bg-[var(--surface)]"
                  )}
                  style={active
                    ? { background: 'var(--lime)', color: '#ffffff' }
                    : { color: 'var(--ink-60)' }}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 tr"
                    style={active ? { background: 'rgba(255,255,255,0.18)' } : {}}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-[var(--border)] space-y-1 shrink-0">
          <Link to="/profile">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface)] tr cursor-pointer">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                style={avatarUrl ? {} : { background: 'var(--lime)', color: 'white' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  : (profile?.full_name ?? 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-[var(--ink)]">{profile?.full_name ?? 'Utilisateur'}</p>
                <p className="text-xs truncate" style={{ color: 'var(--ink-60)' }}>{(profile as any)?.email ?? ''}</p>
              </div>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold tr cursor-pointer hover:bg-[var(--surface)]"
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
        <HeaderActions onProfileOpen={() => setProfileOpen(true)} />
      </div>

      {/* ── Mobile header ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between"
        style={{
          background: 'rgba(243,243,246,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg shrink-0 overflow-hidden">
            <img src="/logo.png" alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-[var(--ink)] tracking-tight">FamillyBill</span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--lime)', color: '#ffffff' }}>HT</span>
          </div>
        </Link>
        <HeaderActions onProfileOpen={() => setProfileOpen(true)} />
      </header>

      {/* ── Main ── */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-16 pb-28 md:pb-0">
        {children}
      </main>

      {/* ── Profile Drawer ── */}
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around px-1 pt-2 pb-3">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, location.pathname)
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer active:scale-90"
                style={{ transition: 'transform 100ms ease' }}
              >
                <div
                  className="w-11 h-9 flex items-center justify-center rounded-xl"
                  style={{
                    background: active ? 'var(--lime)' : 'transparent',
                    transition: 'background 200ms cubic-bezier(0.34,1.56,0.64,1), transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
                    transform: active ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <item.icon
                    style={{
                      width: 19,
                      height: 19,
                      color: active ? '#ffffff' : 'var(--ink-30)',
                      transition: 'color 200ms ease',
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-semibold tracking-tight"
                  style={{
                    color: active ? 'var(--lime)' : 'var(--ink-30)',
                    transition: 'color 200ms ease',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
