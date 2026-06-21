import { useState } from 'react'
import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Bell, User } from 'lucide-react'

type IconProps = { className?: string; style?: React.CSSProperties }

function NavIconHome({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z"/>
      <path d="M9 21V13h6v8"/>
    </svg>
  )
}
function NavIconPay({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="2" y="5" width="20" height="14" rx="3"/>
      <path d="M2 10h20"/>
      <path d="M6 15h3M17 15h1"/>
    </svg>
  )
}
function NavIconWallet({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <circle cx="16.5" cy="13" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function NavIconTransfer({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M5 12h14"/>
      <path d="M15 7l5 5-5 5"/>
      <path d="M3 6l3-3 3 3"/>
      <path d="M6 3v8"/>
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
import { NotificationsPanel } from '@/components/notifications-panel'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: NavIconHome,   label: 'Accueil',  href: '/dashboard' },
  { icon: NavIconPay,    label: 'Payer',    href: '/bills'     },
  { icon: NavIconWallet, label: 'Wallet',   href: '/wallet'    },
  { icon: NavIconTransfer, label: 'Transfert', href: '/transfer' },
  { icon: NavIconStats,  label: 'Stats',    href: '/history'   },
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
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setNotifOpen(v => !v)}
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
        <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>

      <Link to="/profile">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-80 tr shrink-0 overflow-hidden"
          style={avatarUrl ? {} : { background: 'var(--lime)', color: 'white' }}
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
          {NAV_ITEMS.map(item => {
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
                <p className="text-xs truncate" style={{ color: 'var(--ink-60)' }}>{profile?.email ?? ''}</p>
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
        <HeaderActions />
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
        <HeaderActions />
      </header>

      {/* ── Main ── */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-16 min-h-screen pb-28 md:pb-0">
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.96)',
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
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className="w-11 h-9 flex items-center justify-center rounded-xl tr"
                  style={{
                    background: active ? 'var(--lime)' : 'transparent',
                    transition: 'background 200ms ease',
                  }}
                >
                  <item.icon
                    className="tr"
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
