import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

const BENEFITS = [
  'Gratuit à ouvrir, détenez 10+ devises',
  'Envoyez au taux de change réel',
  'Recevez en local dans 10 devises',
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
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setLoading(true)
    setError('')
    const { error } = await signUp(email, password, fullName)
    if (error) {
      const msg = error.message
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('Cet email est déjà utilisé. Connectez-vous à la place.')
      } else if (msg.includes('rate limit') || msg.includes('email rate limit exceeded')) {
        setError('Limite de vérification email atteinte. Désactivez la confirmation email dans Supabase ou réessayez dans 1h.')
      } else if (msg.includes('Password should be')) {
        setError('Le mot de passe doit contenir au moins 8 caractères.')
      } else {
        setError(msg)
      }
      setLoading(false)
    } else {
      navigate('/setup')
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
            FamillyBill <span className="px-1 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--lime)', color: '#ffffff' }}>HT</span>
          </span>
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Rejoignez 50 000<br />familles haïtiennes.
          </h2>
          <div className="space-y-3">
            {BENEFITS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--lime)' }}>
                  <Check className="w-3 h-3" style={{ color: '#ffffff' }} />
                </div>
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs relative z-10">Sans frais cachés. Sécurisé.</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 justify-center">
            <img src="/logo.png" alt="FamillyBill HT" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-[var(--ink)]">
              FamillyBill <span className="px-1 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--lime)', color: '#ffffff' }}>HT</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">Créer un compte</h1>
            <p className="text-sm text-[var(--ink-60)]">Gratuit. Sans frais cachés.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-[var(--ink)]">Nom complet</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Marie Jean"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>

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
                  placeholder="Au moins 8 caractères"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11 rounded-xl pr-11"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-60)] hover:text-[var(--ink)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-[var(--ink-60)]">8+ caractères avec lettres et chiffres</p>
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
              {loading ? 'Création en cours...' : 'Créer un compte'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-xs text-[var(--ink-60)] text-center">
              En vous inscrivant, vous acceptez nos{' '}
              <a href="#" className="underline text-[var(--ink)]">Conditions d'utilisation</a> et{' '}
              <a href="#" className="underline text-[var(--ink)]">Politique de confidentialité</a>.
            </p>
          </form>

          <p className="text-sm text-[var(--ink-60)] text-center mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-semibold text-[var(--ink)] underline underline-offset-2">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
