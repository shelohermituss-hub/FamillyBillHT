import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, ArrowUpRight, Wallet, CreditCard, Clock, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: ArrowUpRight, label: 'Send', href: '/transfer' },
  { icon: Wallet, label: 'Account', href: '/account' },
  { icon: CreditCard, label: 'Card', href: '/card' },
  { icon: Clock, label: 'History', href: '/history' },
]

function isNavActive(itemHref: string, pathname: string) {
  if (itemHref === '/dashboard') return pathname === '/dashboard'
  return pathname === itemHref || pathname.startsWith(itemHref + '/')
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--fb-light)' }}>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="FamillyBill HT" className="w-8 h-8 object-contain" />
            <span className="text-xl font-black" style={{ color: 'var(--fb-ink)' }}>FamillyBill <span className="text-red-600">HT</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = isNavActive(item.href, location.pathname)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all",
                  isActive ? "" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                style={isActive ? { backgroundColor: 'var(--fb-red)', color: 'white' } : {}}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ backgroundColor: 'var(--fb-ink)' }}>
              {(profile?.full_name ?? 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="FamillyBill HT" className="w-6 h-6 object-contain" />
          <span className="text-lg font-black" style={{ color: 'var(--fb-ink)' }}>FamillyBill <span className="text-red-600">HT</span></span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-accent">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-14">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = isNavActive(item.href, location.pathname)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all",
                    isActive ? "" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  style={isActive ? { backgroundColor: 'var(--fb-red)', color: 'white' } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-2 py-2">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(item => {
            const isActive = isNavActive(item.href, location.pathname)
            return (
              <Link key={item.href} to={item.href} className="flex flex-col items-center gap-1 p-2 rounded-xl min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={isActive ? { backgroundColor: 'var(--fb-red)' } : {}}
                >
                  <item.icon className="w-4 h-4" style={{ color: isActive ? 'var(--fb-ink)' : 'var(--muted-foreground)' }} />
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: isActive ? 'var(--fb-ink)' : undefined }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
