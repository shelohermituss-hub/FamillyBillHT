import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
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
        setError("Votre email n'est pas encore confirmé.")
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
    <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>

      {/* Left panel — desktop */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden" style={{ background: 'var(--ink)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'var(--lime)' }} />
        <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full opacity-5" style={{ background: 'var(--lime)' }} />

        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <img src="/logo.png" alt="FamillyBill HT" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-white tracking-tight">
            FamillyBill <span className="px-1 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>HT</span>
          </span>
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Bienvenue<br />sur FamillyBill HT.
          </h2>
          <div className="space-y-3">
            {[
              'Taux de change réel, sans frais cachés',
              'Envoyez dans 10+ pays',
              '50 000 familles haïtiennes nous font confiance',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--lime)' }} />
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs relative z-10">© 2025 FamillyBill HT. Tous droits réservés.</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <img src="/logo.png" alt="FamillyBill HT" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-[var(--ink)]">
              FamillyBill <span className="px-1 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>HT</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">Connexion</h1>
            <p className="text-sm text-[var(--ink-60)]">Entrez vos informations pour continuer.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[var(--ink)]">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--ink)]">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11 rounded-xl pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-60)] hover:text-[var(--ink)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-lime w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link to="/forgot-password" className="block text-sm font-medium tr hover:opacity-70" style={{ color: 'var(--ink-60)' }}>
              Mot de passe oublié ?
            </Link>
            <p className="text-sm text-[var(--ink-60)]">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-semibold text-[var(--ink)] underline underline-offset-2">
                S'inscrire gratuitement
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
