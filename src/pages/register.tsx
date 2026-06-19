import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Globe, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

const BENEFITS = [
  'Free to open, free to hold 40+ currencies',
  'Send money at the real exchange rate',
  'Receive money in 22 currencies like a local',
  'Spend globally with the Wise debit card',
]

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const { error } = await signUp(email, password, fullName)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--wise-sage)' }}>
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ backgroundColor: 'var(--wise-lime)' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <Globe className="w-4 h-4" style={{ color: 'var(--wise-ink)' }} />
          </div>
          <span className="text-2xl font-black" style={{ color: 'var(--wise-ink)' }}>Wise</span>
        </Link>
        <div className="space-y-8">
          <h2 className="text-5xl font-black leading-tight" style={{ color: 'var(--wise-ink)' }}>
            Join 16 million<br />
            people saving<br />
            on transfers.
          </h2>
          <div className="space-y-4">
            {BENEFITS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" style={{ color: 'var(--wise-ink)' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--wise-ink)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm font-medium opacity-60" style={{ color: 'var(--wise-ink)' }}>
          No hidden fees. Regulated worldwide.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--wise-lime)' }}>
              <Globe className="w-4 h-4" style={{ color: 'var(--wise-ink)' }} />
            </div>
            <span className="text-2xl font-black" style={{ color: 'var(--wise-ink)' }}>Wise</span>
          </Link>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--wise-ink)' }}>Create account</h1>
              <p className="text-muted-foreground text-sm">Free to open. No hidden fees.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-semibold">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Smith"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="h-12 rounded-2xl"
                  required
                />
              </div>

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
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 rounded-2xl pr-12"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Use 8+ characters with letters and numbers</p>
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
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By registering, you agree to our{' '}
                <a href="#" className="underline">Terms of Service</a> and{' '}
                <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold underline underline-offset-2" style={{ color: 'var(--wise-ink)' }}>
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
