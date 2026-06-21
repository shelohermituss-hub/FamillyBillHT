import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'

// ── Card stack (vibrant Vortex-style cards) ───────────────────────────────────

function CardStack() {
  const CARDS = [
    {
      gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #fb923c 100%)',
      name: 'Jean Paul M.',
      number: '2507 5645 6685 5633',
      expires: '01/28',
      type: 'FamillyBill',
      chip: true,
    },
    {
      gradient: 'linear-gradient(135deg, #1a0070 0%, #3b12cc 45%, #6d28d9 100%)',
      name: 'Jean Paul M.',
      number: '',
      expires: '',
      type: '',
      chip: false,
    },
    {
      gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #34d399 100%)',
      name: '',
      number: '',
      expires: '',
      type: '',
      chip: false,
    },
  ]

  return (
    <div className="relative mx-auto select-none" style={{ width: 320, height: 240 }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{ background: '#ea580c', transform: 'scale(0.8) translateY(20px)' }} />

      {CARDS.map((card, i) => (
        <div
          key={i}
          className="absolute rounded-[2rem] overflow-hidden"
          style={{
            width: 280,
            height: 172,
            background: card.gradient,
            left: (320 - 280) / 2 + (i - 1) * 6,
            top: i * 14,
            zIndex: CARDS.length - i,
            transform: `rotate(${(i - 1) * -6}deg)`,
            boxShadow: i === 0
              ? '0 24px 60px rgba(234,88,12,0.35), 0 8px 24px rgba(0,0,0,0.2)'
              : `0 ${8 - i * 2}px ${20 - i * 4}px rgba(0,0,0,0.15)`,
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%)' }} />
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl" style={{ background: 'rgba(255,255,255,0.15)' }} />

          {i === 0 && (
            <div className="relative h-full px-6 py-5 flex flex-col justify-between">
              {/* Top row */}
              <div className="flex items-center justify-between">
                <p className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase">Credit Card</p>
                {/* Contactless icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                  <circle cx="12" cy="20" r="0.5" fill="rgba(255,255,255,0.5)" stroke="none"/>
                </svg>
              </div>

              {/* Chip */}
              <div className="w-10 h-7 rounded-md" style={{ background: 'linear-gradient(135deg, rgba(255,220,100,0.8) 0%, rgba(255,180,40,0.9) 100%)', border: '0.5px solid rgba(255,255,255,0.2)' }}>
                <div className="w-full h-full rounded-md grid grid-cols-2 p-0.5 gap-0.5">
                  {[0,1,2,3].map(j => <div key={j} className="rounded-sm" style={{ background: 'rgba(255,160,0,0.4)' }} />)}
                </div>
              </div>

              {/* Card number */}
              <p className="font-mono text-white/50 text-[11px] tracking-[0.18em]">{card.number}</p>

              {/* Bottom */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
                  <p className="text-white text-sm font-semibold">{card.name}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
                  <p className="text-white text-sm font-semibold">{card.expires}</p>
                </div>
                {/* FamillyBill HT logo circles */}
                <div className="flex -space-x-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[8px] font-black" style={{ background: 'rgba(255,255,255,0.85)', color: '#ea580c' }}>FB</div>
                  <div className="w-9 h-9 rounded-full border-2 border-white/20" style={{ background: 'rgba(255,255,255,0.25)' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Single featured card ──────────────────────────────────────────────────────

function FeaturedCard() {
  return (
    <div className="relative mx-auto select-none" style={{ width: 300, height: 220 }}>
      <div className="absolute inset-0 rounded-full blur-[60px] opacity-15 pointer-events-none"
        style={{ background: '#3b12cc', transform: 'translateY(30px)' }} />
      <div
        className="relative rounded-[2rem] overflow-hidden"
        style={{
          width: 280,
          height: 172,
          margin: '0 auto',
          background: 'linear-gradient(135deg, #1a0070 0%, #3b12cc 45%, #6d28d9 100%)',
          boxShadow: '0 24px 60px rgba(59,18,204,0.4), 0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl" style={{ background: 'rgba(167,139,250,0.3)' }} />
        <div className="relative h-full px-6 py-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase">Virtual Card</p>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <circle cx="12" cy="20" r="0.5" fill="rgba(255,255,255,0.5)" stroke="none"/>
            </svg>
          </div>
          <div className="w-10 h-7 rounded-md" style={{ background: 'linear-gradient(135deg, rgba(255,220,100,0.7) 0%, rgba(255,180,40,0.8) 100%)' }}>
            <div className="w-full h-full rounded-md grid grid-cols-2 p-0.5 gap-0.5">
              {[0,1,2,3].map(j => <div key={j} className="rounded-sm" style={{ background: 'rgba(255,160,0,0.4)' }} />)}
            </div>
          </div>
          <p className="font-mono text-white/50 text-[11px] tracking-[0.18em]">4521 •••• •••• ••••</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
              <p className="text-white text-sm font-semibold">Jean Paul M.</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
              <p className="text-white text-sm font-semibold">12/29</p>
            </div>
            <div className="flex -space-x-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[8px] font-black" style={{ background: 'rgba(255,255,255,0.85)', color: '#3b12cc' }}>FB</div>
              <div className="w-9 h-9 rounded-full border-2 border-white/20" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>
          </div>
        </div>
      </div>
      {/* Reflection card below */}
      <div
        className="absolute rounded-[1.6rem] opacity-25"
        style={{
          width: 250,
          height: 80,
          left: (300 - 250) / 2,
          top: 185,
          background: 'linear-gradient(135deg, #1a0070 0%, #3b12cc 100%)',
          filter: 'blur(1px)',
          transform: 'scaleY(-0.3)',
          transformOrigin: 'top',
        }}
      />
    </div>
  )
}

// ── Multi-currency illustration ────────────────────────────────────────────────

function MultiCurrencyIllustration() {
  const currencies = [
    { code: 'HTG', symbol: 'G', gradient: 'linear-gradient(135deg, #1a0070 0%, #6d28d9 100%)', amount: '45,820' },
    { code: 'USD', symbol: '$', gradient: 'linear-gradient(135deg, #064e3b 0%, #34d399 100%)', amount: '2,450' },
    { code: 'EUR', symbol: '€', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #60a5fa 100%)', amount: '1,820' },
    { code: 'CAD', symbol: 'C$', gradient: 'linear-gradient(135deg, #7c2d12 0%, #fb923c 100%)', amount: '890' },
  ]

  return (
    <div className="select-none px-4">
      {/* Floating coin */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', boxShadow: '0 8px 24px rgba(251,191,36,0.4)' }}>
          <span className="text-white font-black text-lg">$</span>
        </div>
      </div>
      {/* 2x2 currency grid */}
      <div className="grid grid-cols-2 gap-2.5 max-w-[280px] mx-auto">
        {currencies.map(c => (
          <div key={c.code} className="rounded-2xl p-3 relative overflow-hidden"
            style={{ background: c.gradient, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-30" style={{ background: 'white' }} />
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">{c.code}</p>
            <p className="text-white font-extrabold text-sm leading-none">{c.symbol} {c.amount}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Slides config ─────────────────────────────────────────────────────────────

const SLIDES = [
  {
    key: 'cards',
    Illustration: CardStack,
    title: 'La Banque\nJamais Si Simple !',
    titleAccent: 'Jamais Si Simple !',
    subtitle: 'Technologie de paiement sécurisée pour une protection maximale de vos fonds.',
  },
  {
    key: 'virtual',
    Illustration: FeaturedCard,
    title: 'Paiements Virtuels\nVia Carte',
    titleAccent: 'Via Carte',
    subtitle: 'Gérez vos cartes virtuelles multi-devises en toute simplicité, partout dans le monde.',
  },
  {
    key: 'global',
    Illustration: MultiCurrencyIllustration,
    title: 'Plusieurs Devises\nSans Effort',
    titleAccent: 'Sans Effort',
    subtitle: 'HTG, USD, EUR, CAD et plus — convertissez et envoyez au meilleur taux en temps réel.',
  },
]

// ── Landing page ──────────────────────────────────────────────────────────────

export function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const ptrStart = useRef(0)
  const current = SLIDES[slide]

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  function next() { if (slide < SLIDES.length - 1) setSlide(s => s + 1) }
  function prev() { if (slide > 0) setSlide(s => s - 1) }

  function renderTitle(title: string, accent: string) {
    const lines = title.split('\n')
    return lines.map((line, i) => {
      const isAccent = line === accent
      return (
        <span key={i} className={i > 0 ? 'block' : ''}>
          {isAccent
            ? <span style={{ color: 'var(--lime)' }}>{line}</span>
            : <span style={{ color: '#111' }}>{line}</span>}
          {i < lines.length - 1 && '\n'}
        </span>
      )
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-white overflow-hidden"
      onPointerDown={e => { ptrStart.current = e.clientX }}
      onPointerUp={e => {
        const d = e.clientX - ptrStart.current
        if (d < -40) next()
        else if (d > 40) prev()
      }}
    >
      {/* Status bar area + top progress dots */}
      <div className="px-6 pt-14 pb-2 flex items-center justify-between">
        {/* Progress segments */}
        <div className="flex gap-1.5 flex-1">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full flex-1 tr cursor-pointer"
              style={{
                background: i <= slide ? 'var(--lime)' : '#E5E7EB',
                transition: 'background 300ms ease',
              }}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>
        <button
          onClick={() => setSlide(SLIDES.length - 1)}
          className="ml-4 text-sm font-semibold cursor-pointer tr hover:opacity-70"
          style={{ color: '#9CA3AF' }}
        >
          Skip
        </button>
      </div>

      {/* Illustration area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative" style={{ minHeight: 300 }}>
        {/* Light background circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full blur-[80px] opacity-8"
            style={{ background: 'var(--lime)' }} />
        </div>
        <div key={current.key} className="relative w-full animate-scale-in" style={{ animationDuration: '0.3s' }}>
          <current.Illustration />
        </div>
      </div>

      {/* Text + CTA section */}
      <div className="px-6 pb-10 space-y-4">
        {/* Title */}
        <div key={current.key + '-title'} className="animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
          <h1
            className="font-extrabold leading-tight whitespace-pre-line"
            style={{ fontSize: 32, letterSpacing: '-0.025em', lineHeight: 1.15, color: '#111' }}
          >
            {renderTitle(current.title, current.titleAccent)}
          </h1>
          <p className="mt-3 leading-relaxed text-sm" style={{ color: '#9CA3AF' }}>
            {current.subtitle}
          </p>
        </div>

        {/* CTA row */}
        {slide < SLIDES.length - 1 ? (
          <div className="flex items-center justify-between pt-2 animate-fade-in-up stagger-1">
            {/* Circle forward button */}
            <button
              onClick={next}
              className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer tr hover:opacity-85 active:scale-95"
              style={{
                background: 'var(--lime)',
                boxShadow: '0 8px 24px rgba(26,86,219,0.35)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 12 12 5 19 12"/>
                <polyline points="5 17 12 10 19 17"/>
              </svg>
            </button>

            {/* Swipe text */}
            <button
              onClick={next}
              className="flex-1 ml-4 h-14 rounded-2xl flex items-center justify-center cursor-pointer tr hover:bg-gray-50 active:scale-98"
              style={{ border: '1.5px solid #E5E7EB' }}
            >
              <span className="font-semibold text-sm" style={{ color: '#374151' }}>
                Continuer →
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2 animate-fade-in-up stagger-1">
            <Link to="/register" className="block">
              <button
                className="w-full h-14 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer tr active:scale-98"
                style={{
                  background: 'var(--lime)',
                  boxShadow: '0 8px 24px rgba(26,86,219,0.3)',
                }}
              >
                Créer un compte
              </button>
            </Link>
            <Link to="/login" className="block">
              <button
                className="w-full h-14 rounded-2xl font-semibold text-sm flex items-center justify-center cursor-pointer tr hover:bg-gray-50"
                style={{ border: '1.5px solid #E5E7EB', color: '#374151' }}
              >
                Se connecter
              </button>
            </Link>
            <Link to="/login" className="block">
              <button
                className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer tr hover:bg-gray-50"
                style={{ color: '#6B7280' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
