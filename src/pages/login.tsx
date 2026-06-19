import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Globe, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--wise-sage)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ backgroundColor: 'var(--wise-ink)' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--wise-lime)' }}>
            <Globe className="w-4 h-4" style={{ color: 'var(--wise-ink)' }} />
          </div>
          <span className="text-2xl font-black text-white">Wise</span>
        </Link>
        <div className="space-y-8">
          <h2 className="text-5xl font-black text-white leading-tight">
            Welcome back to<br />
            <span style={{ color: 'var(--wise-lime)' }}>borderless</span><br />
            money.
          </h2>
          <div className="space-y-4">
            {[
              'Real mid-market exchange rate',
              'Send to 160+ countries',
              '16 million customers worldwide',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--wise-lime)' }}>
                  <Check className="w-3 h-3" style={{ color: 'var(--wise-ink)' }} />
                </div>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">
          © 2024 Wise Payments Ltd. FCA authorised.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--wise-lime)' }}>
              <Globe className="w-4 h-4" style={{ color: 'var(--wise-ink)' }} />
            </div>
            <span className="text-2xl font-black" style={{ color: 'var(--wise-ink)' }}>Wise</span>
          </Link>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--wise-ink)' }}>Log in</h1>
              <p className="text-muted-foreground text-sm">Welcome back. Enter your details to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 rounded-2xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 rounded-2xl pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl font-semibold text-base border-0"
                style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log in'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold underline underline-offset-2" style={{ color: 'var(--wise-ink)' }}>
                  Register for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
