import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Wallet, Globe, Receipt, Shield,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

type Slide = {
  key: string
  accent: string
  iconBg: string
  iconColor: string
  isLight: boolean
  Icon: React.FC<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
  title: string
  desc: string
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    accent: '#E42222',
    iconBg: '#0e0f0c',
    iconColor: '#E42222',
    isLight: true,
    Icon: Wallet,
    title: 'Bienvenue sur\nFamillyBill HT',
    desc: "Gérez l'argent de toute votre famille, partout dans le monde, au meilleur taux.",
  },
  {
    key: 'currencies',
    accent: '#0e0f0c',
    iconBg: '#E42222',
    iconColor: '#0e0f0c',
    isLight: false,
    Icon: Globe,
    title: '10+ devises,\nune seule app',
    desc: 'HTG, USD, EUR, CAD et plus. Convertissez au taux réel, sans frais cachés sur chaque transfert.',
  },
  {
    key: 'bills',
    accent: '#0c4a6e',
    iconBg: '#e0f2fe',
    iconColor: '#0c4a6e',
    isLight: false,
    Icon: Receipt,
    title: 'Payez toutes\nvos factures',
    desc: "Électricité, eau, internet, téléphone… Tout depuis votre téléphone en quelques secondes.",
  },
  {
    key: 'security',
    accent: '#f7f8f5',
    iconBg: '#0e0f0c',
    iconColor: '#E42222',
    isLight: true,
    Icon: Shield,
    title: 'Sécurisé &\nPersonnel',
    desc: 'Code PIN à 4 chiffres, chiffrement bancaire. Votre argent est entre de bonnes mains.',
  },
]

export function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const ptrStart = useRef(0)
  const current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  function next() { if (slide < SLIDES.length - 1) setSlide(s => s + 1) }
  function prev() { if (slide > 0) setSlide(s => s - 1) }

  const skipColor = current.isLight ? 'rgba(14,15,12,0.45)' : 'rgba(255,255,255,0.55)'
  const skipBg    = current.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{ background: current.accent, transition: 'background 350ms ease' }}
    >
      {/* ── Illustration area ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative px-8 pt-14 pb-8"
        onPointerDown={e => { ptrStart.current = e.clientX }}
        onPointerUp={e => {
          const d = e.clientX - ptrStart.current
          if (d < -50) next()
          else if (d > 50) prev()
        }}
      >
        {/* Logo */}
        <div className="absolute top-5 left-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
            <img
              src="/logo.png" alt=""
              className="w-full h-full object-cover"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </div>
          <span
            className="font-bold text-sm tracking-tight"
            style={{ color: current.isLight ? 'rgba(14,15,12,0.6)' : 'rgba(255,255,255,0.6)' }}
          >
            FamillyBill HT
          </span>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={() => setSlide(SLIDES.length - 1)}
            className="absolute top-5 right-5 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer tr"
            style={{ background: skipBg, color: skipColor }}
          >
            Passer →
          </button>
        )}

        {/* Large icon */}
        <div
          key={current.key}
          className="w-52 h-52 rounded-[3rem] flex items-center justify-center animate-scale-in shrink-0"
          style={{ background: current.iconBg, boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }}
        >
          <current.Icon
            strokeWidth={1.25}
            style={{ width: 96, height: 96, color: current.iconColor }}
          />
        </div>

        {/* Swipe hint */}
        <p className="mt-8 text-xs font-medium" style={{ color: current.isLight ? 'rgba(14,15,12,0.3)' : 'rgba(255,255,255,0.3)' }}>
          Glissez pour naviguer
        </p>
      </div>

      {/* ── Bottom sheet ── */}
      <div
        className="rounded-t-[2.5rem] px-7 pt-7 pb-10 space-y-5"
        style={{ background: 'var(--card-bg)', minHeight: 300 }}
      >
        {/* Dots */}
        <div className="flex items-center gap-2 justify-center">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className="h-1.5 rounded-full tr cursor-pointer"
              style={{
                width: i === slide ? 24 : 6,
                background: i === slide ? 'var(--ink)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Text */}
        <div key={current.key + '-text'} className="animate-fade-in-up">
          <h1 className="text-[1.6rem] font-bold text-[var(--ink)] leading-tight mb-2.5 whitespace-pre-line">
            {current.title}
          </h1>
          <p className="text-sm text-[var(--ink-60)] leading-relaxed">{current.desc}</p>
        </div>

        {/* Navigation */}
        {isLast ? (
          <div className="space-y-3 animate-fade-in-up stagger-1 pt-1">
            <Link to="/register" className="block">
              <button className="btn-lime w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                Créer mon compte gratuitement
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/login" className="block">
              <button className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center cursor-pointer tr hover:bg-[var(--surface)]"
                style={{ border: '1px solid var(--border)', color: 'var(--ink-60)' }}>
                J'ai déjà un compte
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between animate-fade-in-up stagger-1 pt-1">
            <button
              onClick={prev}
              disabled={slide === 0}
              className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer disabled:opacity-20 tr hover:bg-[var(--surface)]"
              style={{ border: '1px solid var(--border)' }}
            >
              <ChevronLeft className="w-5 h-5 text-[var(--ink)]" />
            </button>
            <button
              onClick={next}
              className="btn-lime h-12 px-8 rounded-2xl font-semibold text-sm flex items-center gap-2 cursor-pointer"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
