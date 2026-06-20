import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--surface)' }}
    >
      <div className="w-full max-w-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 tr hover:opacity-70 cursor-pointer"
          style={{ color: 'var(--ink-60)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        {sent ? (
          <div className="text-center space-y-5 animate-scale-in">
            <div
              className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
              style={{ background: 'var(--lime)', boxShadow: '0 12px 40px rgba(26,86,219,0.4)' }}
            >
              <Check className="w-10 h-10" style={{ color: 'var(--ink)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">Email envoyé</h1>
              <p className="text-sm text-[var(--ink-60)] leading-relaxed">
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                Vérifiez votre boîte mail (et les spams).
              </p>
            </div>
            <Link to="/login" className="block">
              <button className="btn-lime w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                Retour à la connexion
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'var(--lime-light)' }}
              >
                <Mail className="w-7 h-7" style={{ color: 'var(--ink)' }} />
              </div>
              <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">Mot de passe oublié</h1>
              <p className="text-sm text-[var(--ink-60)]">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-[var(--ink)]">
                  Adresse email
                </Label>
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

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-lime w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
