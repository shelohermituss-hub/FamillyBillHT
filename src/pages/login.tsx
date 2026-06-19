import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
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
      const msg = error.message
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('Email ou mot de passe incorrect.')
      } else if (msg.includes('Email not confirmed')) {
        setError("Votre email n'est pas encore confirmé. Contactez l'administrateur.")
      } else if (msg.includes('rate limit')) {
        setError('Trop de tentatives. Attendez quelques minutes.')
      } else {
        setError(msg)
      }
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--fb-light)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ backgroundColor: 'var(--fb-ink)' }}>
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="FamillyBill HT" className="w-8 h-8 object-contain" />
          <span className="text-2xl font-black text-white">FamillyBill <span style={{ color: 'var(--fb-red)' }}>HT</span></span>
        </Link>
        <div className="space-y-8">
          <h2 className="text-5xl font-black text-white leading-tight">
            Bienvenue sur<br />
            <span style={{ color: 'var(--fb-red)' }}>FamillyBill</span><br />
            HT.
          </h2>
          <div className="space-y-4">
            {[
              'Taux de change réel',
              'Envoyez dans 10+ pays',
              '50 000 familles haïtiennes',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--fb-red)' }}>
                  <Check className="w-3 h-3" style={{ color: 'var(--fb-ink)' }} />
                </div>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">
          © 2025 FamillyBill HT. Tous droits réservés.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <img src="/logo.png" alt="FamillyBill HT" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-black" style={{ color: 'var(--fb-ink)' }}>FamillyBill <span className="text-red-600">HT</span></span>
          </Link>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--fb-ink)' }}>Connexion</h1>
              <p className="text-muted-foreground text-sm">Bienvenue. Entrez vos informations pour continuer.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                <Label htmlFor="password" className="text-sm font-semibold">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
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
                style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link to="/register" className="font-semibold underline underline-offset-2" style={{ color: 'var(--fb-ink)' }}>
                  S'inscrire gratuitement
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
