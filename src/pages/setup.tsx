import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Key, Check, ChevronLeft, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

type Step = 'welcome' | 'pin' | 'confirm' | 'done'

// ── PIN Pad ───────────────────────────────────────────────────────────────────
function PinPad({
  title,
  subtitle,
  error = '',
  onComplete,
  onBack,
}: {
  title: string
  subtitle: string
  error?: string
  onComplete: (pin: string) => void
  onBack?: () => void
}) {
  const [pin, setPin] = useState('')

  function press(d: string) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) { onComplete(next); setPin('') }
  }
  function del() { setPin(p => p.slice(0, -1)) }

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--lime)' }}
        >
          <Key className="w-8 h-8" style={{ color: '#ffffff' }} />
        </div>
        <h2 className="text-xl font-bold text-[var(--ink)]">{title}</h2>
        <p className="text-sm text-[var(--ink-60)] mt-1">{subtitle}</p>
      </div>

      <div className="flex gap-5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border-2 tr"
            style={{
              borderColor: i < pin.length ? 'var(--ink)' : 'var(--border)',
              background: i < pin.length ? 'var(--ink)' : 'transparent',
            }}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-500 -mt-4 text-center">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) =>
          k === '' ? <div key={i} /> : (
            <button
              key={i}
              onClick={() => k === '⌫' ? del() : press(k)}
              className="w-[72px] h-[72px] rounded-2xl font-semibold text-xl flex items-center justify-center tr cursor-pointer hover:bg-[var(--surface-2)]"
              style={{ background: 'var(--card-bg)', color: 'var(--ink)', boxShadow: '0 1px 3px rgba(14,15,12,0.08)' }}
            >
              {k}
            </button>
          )
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--ink-60)] hover:text-[var(--ink)] tr cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
      )}
    </div>
  )
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const labels = ['Sécurité', 'Code PIN', 'Confirmation']
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {labels.map((l, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={l} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold tr',
                )}
                style={
                  done   ? { background: 'var(--lime)', color: '#ffffff' }
                  : active ? { background: 'var(--ink)', color: 'white' }
                  : { background: 'var(--surface-2)', color: 'var(--ink-30)' }
                }
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-[10px] font-medium" style={{ color: active ? 'var(--ink)' : 'var(--ink-30)' }}>
                {l}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className="w-10 h-0.5 mb-4 mx-1 tr"
                style={{ background: done ? 'var(--lime)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SetupPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('welcome')
  const [pendingPin, setPendingPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const pin = localStorage.getItem(`fb-wallet-pin-${user.id}`)
    if (pin) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const stepIndex: Record<Step, number> = { welcome: 0, pin: 1, confirm: 2, done: 2 }

  function handlePin(pin: string) {
    setPendingPin(pin)
    setError('')
    setStep('confirm')
  }

  function handleConfirm(pin: string) {
    if (!user) return
    if (pin === pendingPin) {
      localStorage.setItem(`fb-wallet-pin-${user.id}`, pin)
      localStorage.setItem(`fb-wallet-locked-${user.id}`, 'false')
      setStep('done')
      setTimeout(() => navigate('/dashboard', { replace: true }), 1600)
    } else {
      setError('Les codes ne correspondent pas. Recommencez.')
      setPendingPin('')
      setStep('pin')
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'là'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div
        className="h-14 flex items-center px-6 border-b border-[var(--border)] shrink-0"
        style={{ background: 'var(--card-bg)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--ink)' }}>
            <img src="/logo.png" alt="" className="w-5 h-5 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
          <span className="font-bold text-sm text-[var(--ink)] tracking-tight">
            FamillyBill{' '}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--lime)', color: '#ffffff' }}>HT</span>
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">

          {step !== 'welcome' && step !== 'done' && (
            <Steps current={stepIndex[step]} />
          )}

          {/* ── Welcome ── */}
          {step === 'welcome' && (
            <div className="text-center space-y-6 animate-fade-in-up">
              <div
                className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center"
                style={{ background: 'var(--lime)', boxShadow: '0 12px 40px rgba(26,86,219,0.45)' }}
              >
                <Lock className="w-12 h-12" style={{ color: '#ffffff' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">
                  Sécurisez votre<br />portefeuille, {firstName} !
                </h1>
                <p className="text-sm text-[var(--ink-60)] leading-relaxed">
                  Créez votre code PIN personnel pour protéger l'accès à vos comptes et transactions.
                </p>
              </div>

              <div className="card-flat p-5 text-left space-y-3">
                {[
                  { icon: '🔐', text: 'Code PIN à 4 chiffres personnel' },
                  { icon: '💳', text: 'Accès sécurisé au portefeuille multi-devises' },
                  { icon: '⚡', text: 'Paiements rapides et sécurisés' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium text-[var(--ink)]">{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('pin')}
                className="btn-lime w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Créer mon code PIN
              </button>
              <button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="w-full text-sm text-[var(--ink-30)] hover:text-[var(--ink-60)] tr cursor-pointer py-1"
              >
                Ignorer pour l'instant
              </button>
            </div>
          )}

          {/* ── PIN ── */}
          {step === 'pin' && (
            <div className="animate-fade-in-up">
              <PinPad
                title="Créez votre PIN"
                subtitle="Choisissez un code à 4 chiffres"
                error={error}
                onComplete={handlePin}
                onBack={() => setStep('welcome')}
              />
            </div>
          )}

          {/* ── Confirm ── */}
          {step === 'confirm' && (
            <div className="animate-fade-in-up">
              <PinPad
                title="Confirmez le PIN"
                subtitle="Ressaisissez votre code secret"
                error={error}
                onComplete={handleConfirm}
                onBack={() => { setPendingPin(''); setError(''); setStep('pin') }}
              />
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="text-center space-y-5 animate-scale-in">
              <div
                className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center"
                style={{ background: 'var(--lime)', boxShadow: '0 12px 40px rgba(26,86,219,0.45)' }}
              >
                <Check className="w-12 h-12" style={{ color: '#ffffff' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--ink)] mb-2">Tout est prêt !</h2>
                <p className="text-sm text-[var(--ink-60)]">Votre portefeuille est sécurisé et activé.</p>
              </div>
              <div
                className="flex items-center justify-center gap-2 text-sm font-medium"
                style={{ color: 'var(--ink-60)' }}
              >
                <div className="w-4 h-4 rounded-full border-2 border-[var(--lime)] border-t-transparent animate-spin" />
                Redirection vers votre tableau de bord…
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
