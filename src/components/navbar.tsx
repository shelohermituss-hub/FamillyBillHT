import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="FamillyBill HT" className="w-8 h-8 object-contain" />
            <span className="text-xl font-black tracking-tight" style={{ color: 'var(--wise-ink)' }}>
              FamillyBill <span className="text-red-600">HT</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Famille', href: '/' },
                { label: 'Transfert', href: '/' },
                { label: 'Épargne', href: '/' },
              ].map(item => (
                <button
                  key={item.label}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                >
                  {item.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
              ))}
            </nav>
          )}

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="rounded-2xl font-semibold">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="rounded-2xl font-semibold wise-lime-btn border-0"
                  onClick={() => signOut()}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-2xl font-semibold text-foreground hover:bg-accent">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="rounded-2xl font-semibold border-0"
                    style={{ backgroundColor: 'var(--wise-ink)', color: 'white' }}
                  >
                    Register
                  </Button>
                </Link>
              </>
            )}
            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-accent"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-2">
          <Link to="/" className="block px-3 py-2 rounded-xl font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Famille</Link>
          <Link to="/" className="block px-3 py-2 rounded-xl font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Transfert</Link>
          <Link to="/" className="block px-3 py-2 rounded-xl font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Épargne</Link>
        </div>
      )}
    </header>
  )
}
