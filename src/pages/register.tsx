import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

const BENEFITS = [
  'Gratuit à ouvrir, détenez 10+ devises',
  'Envoyez au taux de change réel',
  'Recevez dans 10 devises comme un local',
  'Dépensez partout avec la carte FamillyBill HT',
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
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--fb-light)' }}>
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ backgroundColor: 'var(--fb-red)' }}>
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="FamillyBill HT" className="w-8 h-8 object-contain" />
          <span className="text-2xl font-black text-white">FamillyBill HT</span>
        </Link>
        <div className="space-y-8">
          <h2 className="text-5xl font-black leading-tight text-white">
            Rejoignez 50 000<br />
            familles<br />
            haïtiennes.
          </h2>
          <div className="space-y-4">
            {BENEFITS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" style={{ color: 'var(--fb-ink)' }} />
                </div>
                <span className="text-sm font-medium text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm font-medium text-white/60">
          Sans frais cachés. Sécurisé.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <img src="/logo.png" alt="FamillyBill HT" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-black" style={{ color: 'var(--fb-ink)' }}>FamillyBill <span className="text-red-600">HT</span></span>
          </Link>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--fb-ink)' }}>Create account</h1>
              <p className="text-muted-foreground text-sm">Gratuit. Sans frais cachés.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-semibold">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Marie Jean"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="h-12 rounded-2xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">Adresse email</Label>
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
                    placeholder="Au moins 8 caractères"
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
                <p className="text-xs text-muted-foreground">8+ caractères avec lettres et chiffres</p>
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl font-semibold text-base border-0"
                style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Créer un compte'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                En vous inscrivant, vous acceptez nos{' '}
                <a href="#" className="underline">Conditions d'utilisation</a> and{' '}
                <a href="#" className="underline">Politique de confidentialité</a>.
              </p>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <Link to="/login" className="font-semibold underline underline-offset-2" style={{ color: 'var(--fb-ink)' }}>
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
