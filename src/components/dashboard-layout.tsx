import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, ArrowUpRight, Wallet, CreditCard, Clock, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: Home,         label: 'Accueil',    href: '/dashboard' },
  { icon: ArrowUpRight, label: 'Envoyer',    href: '/transfer'  },
  { icon: Wallet,       label: 'Compte',     href: '/account'   },
  { icon: CreditCard,   label: 'Carte',      href: '/card'      },
  { icon: Clock,        label: 'Historique', href: '/history'   },
]

function isActive(href: string, path: string) {
  if (href === '/dashboard') return path === '/dashboard'
  return path === href || path.startsWith(href + '/')
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() { await signOut(); navigate('/') }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--surface)' }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-[var(--border)] fixed inset-y-0 left-0 z-30">
        <div className="px-6 py-5 border-b border-[var(--border)]">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="FamillyBill HT" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-[var(--ink)] tracking-tight">
              FamillyBill <span className="px-1 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>HT</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, location.pathname)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium tr cursor-pointer",
                  active
                    ? "font-semibold"
                    : "text-[var(--ink-60)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
                )}
                style={active ? { background: 'var(--lime)', color: 'var(--ink)' } : {}}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'var(--ink)' }}>
              {(profile?.full_name ?? 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[var(--ink)]">{profile?.full_name ?? 'Utilisateur'}</p>
              <p className="text-xs text-[var(--ink-60)] truncate">{profile?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--ink-60)] hover:text-[var(--ink)] hover:bg-[var(--surface)] tr cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[var(--border)] h-14 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
          <span className="font-semibold text-sm text-[var(--ink)]">
            FamillyBill <span className="px-1 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--lime)' }}>HT</span>
          </span>
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] tr cursor-pointer"
        >
          <div className="space-y-1.5">
            <span className={cn("block h-0.5 bg-[var(--ink)] tr origin-center", menuOpen ? "rotate-45 translate-y-2 w-5" : "w-5")} />
            <span className={cn("block h-0.5 bg-[var(--ink)] tr", menuOpen ? "opacity-0 w-5" : "w-3.5")} />
            <span className={cn("block h-0.5 bg-[var(--ink)] tr origin-center", menuOpen ? "-rotate-45 -translate-y-2 w-5" : "w-5")} />
          </div>
        </button>
      </header>

      {/* ── Mobile menu overlay ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-14">
          <nav className="px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const active = isActive(item.href, location.pathname)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tr cursor-pointer",
                    active ? "font-semibold" : "text-[var(--ink-60)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
                  )}
                  style={active ? { background: 'var(--lime)', color: 'var(--ink)' } : {}}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--ink-60)] hover:bg-[var(--surface)] tr cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </nav>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--border)] px-2 py-1 safe-b">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, location.pathname)
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center gap-0.5 p-2 rounded-xl cursor-pointer min-w-[52px]"
              >
                <div className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl tr",
                  active ? "" : "hover:bg-[var(--surface)]"
                )}
                  style={active ? { background: 'var(--lime)' } : {}}
                >
                  <item.icon className="w-4 h-4" style={{ color: active ? 'var(--ink)' : 'var(--ink-60)' }} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: active ? 'var(--ink)' : 'var(--ink-60)' }}>
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
