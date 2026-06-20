import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

// ── Slide 1: Phone mockup ─────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative mx-auto select-none" style={{ width: 200, height: 378 }}>
      <div className="absolute -inset-10 rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{ background: 'var(--lime)' }} />
      <div
        className="relative w-full h-full rounded-[2.8rem] overflow-hidden"
        style={{
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Dynamic island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center gap-1.5"
          style={{ width: 80, height: 18, background: '#000', borderRadius: 12 }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1a1a1a' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#111' }} />
        </div>

        {/* Screen */}
        <div className="absolute inset-0 pt-9 flex flex-col">
          {/* Header */}
          <div className="px-4 py-2 flex items-center justify-between">
            <div>
              <p className="text-[6px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Bonjour</p>
              <p className="text-xs font-bold text-white leading-none mt-0.5">Jean Paul</p>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'var(--lime)' }}>
              <span className="text-white font-bold" style={{ fontSize: 7 }}>JP</span>
            </div>
          </div>

          {/* Balance card */}
          <div className="mx-3 mt-1 rounded-2xl p-3 relative overflow-hidden flex flex-col justify-between"
            style={{
              height: 86,
              background: 'linear-gradient(135deg, var(--lime) 0%, #0f2a8c 100%)',
              boxShadow: '0 8px 24px rgba(26,86,219,0.45)',
            }}>
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20"
              style={{ background: 'white' }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 6, fontWeight: 500 }}>Solde total</p>
            <p className="text-white font-bold" style={{ fontSize: 15, lineHeight: 1 }}>G 45,820.00</p>
            <div className="flex gap-1.5 mt-auto">
              {['Envoyer', 'Recevoir', 'Payer'].map(a => (
                <div key={a} className="flex-1 py-0.5 rounded-md text-center"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <p className="text-white font-semibold" style={{ fontSize: 5.5 }}>{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rates */}
          <div className="px-3 mt-2.5">
            <p className="font-bold uppercase tracking-widest mb-1.5"
              style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.25)' }}>Taux en direct</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[{ c: 'USD/HTG', r: '147.5', up: true }, { c: 'EUR/HTG', r: '163.2', up: false }].map(r => (
                <div key={r.c} className="rounded-xl p-1.5"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{r.c}</p>
                  <p className="text-white font-bold mt-0.5" style={{ fontSize: 9 }}>G {r.r}</p>
                  <p style={{ fontSize: 5, color: r.up ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                    {r.up ? '↑' : '↓'} 0.3%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="px-3 mt-2.5 flex-1">
            <p className="font-bold uppercase tracking-widest mb-1.5"
              style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.25)' }}>Récentes</p>
            {[
              { n: 'Marie Dupont', a: '+G 500', c: '#4ade80' },
              { n: 'Électricité EDH', a: '-G 850', c: '#f87171' },
              { n: 'Jean Paul M.', a: '+$120', c: '#4ade80' },
            ].map(tx => (
              <div key={tx.n} className="flex items-center justify-between py-1"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 4.5, fontWeight: 700 }}>{tx.n[0]}</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 6 }}>{tx.n}</p>
                </div>
                <p style={{ color: tx.c, fontSize: 6.5, fontWeight: 700 }}>{tx.a}</p>
              </div>
            ))}
          </div>

          {/* Mini nav */}
          <div className="px-5 pb-3 pt-2">
            <div className="flex items-center justify-around py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {[true, false, false, false, false].map((active, i) => (
                <div key={i} className="rounded-lg"
                  style={{
                    width: active ? 18 : 10, height: 8,
                    background: active ? 'var(--lime)' : 'rgba(255,255,255,0.12)',
                    borderRadius: 4,
                    transition: 'all 200ms',
                  }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Slide 2: Currency card stack ──────────────────────────────────────────────

function CurrencyCards() {
  const CARDS = [
    { code: 'HTG', label: 'Gourde haïtienne', amount: 'G 45,820', last4: '4521', g: 'linear-gradient(135deg, #0d1b45 0%, #1A56DB 100%)' },
    { code: 'USD', label: 'Dollar américain',  amount: '$2,450',   last4: '8832', g: 'linear-gradient(135deg, #042f2e 0%, #047857 100%)' },
    { code: 'EUR', label: 'Euro',              amount: '€1,820',   last4: '2267', g: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)' },
  ]
  return (
    <div className="relative select-none mx-auto" style={{ width: 280, height: 210 }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 -m-6 rounded-full blur-[50px] opacity-25 pointer-events-none"
        style={{ background: '#1A56DB' }} />
      {CARDS.map((c, i) => (
        <div
          key={c.code}
          className="absolute rounded-[1.75rem] overflow-hidden"
          style={{
            width: 256,
            height: 150,
            background: c.g,
            left: (280 - 256) / 2 + (i - 1) * 5,
            top: i * 16 + 4,
            zIndex: CARDS.length - i,
            transform: `rotate(${(i - 1) * 4.5}deg)`,
            boxShadow: i === 0 ? '0 20px 56px rgba(0,0,0,0.55)' : '0 4px 20px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />

          {/* Card content (visible only on top card) */}
          {i === 0 && (
            <div className="relative h-full p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/50 font-bold tracking-widest uppercase" style={{ fontSize: 9 }}>{c.code}</p>
                  <p className="text-white/70 mt-0.5" style={{ fontSize: 9 }}>{c.label}</p>
                </div>
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/20">
                  <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <p className="text-white font-bold" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{c.amount}</p>
                <div className="flex items-end justify-between mt-1.5">
                  <p className="font-mono text-white/25" style={{ fontSize: 9, letterSpacing: '0.12em' }}>
                    •••• •••• •••• {c.last4}
                  </p>
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full border border-black/20" style={{ background: '#ef4444' }} />
                    <div className="w-5 h-5 rounded-full border border-black/20" style={{ background: '#f59e0b' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Slide 3: Security illustration ───────────────────────────────────────────

function SecurityIllustration() {
  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div className="relative">
        <div className="absolute -inset-6 rounded-full blur-[40px] opacity-25 pointer-events-none"
          style={{ background: 'var(--lime)' }} />
        <div
          className="relative flex items-center justify-center rounded-[2.2rem]"
          style={{
            width: 148, height: 148,
            background: 'linear-gradient(135deg, rgba(26,86,219,0.18) 0%, rgba(26,86,219,0.06) 100%)',
            border: '1px solid rgba(26,86,219,0.28)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <svg width="68" height="68" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.88)" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div
            className="absolute -bottom-2.5 -right-2.5 flex items-center justify-center rounded-full"
            style={{ width: 38, height: 38, background: 'var(--lime)', border: '2.5px solid #050914' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['PIN sécurisé', 'Chiffrement', 'Biométrie'].map(f => (
          <div key={f} className="px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            <p className="text-white/55 font-semibold" style={{ fontSize: 9 }}>{f}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Slides config ─────────────────────────────────────────────────────────────

const SLIDES = [
  {
    key: 'welcome',
    bg1: '#060d1e', bg2: '#0e2155',
    title: 'Gérez l\'argent\nde votre famille',
    subtitle: 'Envois, conversions et paiements de factures au meilleur taux.',
    Illustration: PhoneMockup,
  },
  {
    key: 'currencies',
    bg1: '#060a1a', bg2: '#121040',
    title: '10+ devises,\nzéro frais cachés',
    subtitle: 'HTG, USD, EUR, CAD et plus — convertissez au taux réel en temps réel.',
    Illustration: CurrencyCards,
  },
  {
    key: 'security',
    bg1: '#05091a', bg2: '#0a1c3f',
    title: 'Sécurisé &\nde confiance',
    subtitle: 'Code PIN, chiffrement bancaire. Votre argent est en de bonnes mains.',
    Illustration: SecurityIllustration,
  },
]

const STARS = [
  { l: '14%', t: '7%',  s: 2,   o: 0.45 },
  { l: '78%', t: '11%', s: 1.5, o: 0.3  },
  { l: '43%', t: '4%',  s: 1,   o: 0.25 },
  { l: '88%', t: '22%', s: 2,   o: 0.35 },
  { l: '9%',  t: '28%', s: 1.5, o: 0.2  },
  { l: '65%', t: '16%', s: 1,   o: 0.3  },
  { l: '32%', t: '2%',  s: 1.5, o: 0.22 },
  { l: '55%', t: '32%', s: 1,   o: 0.18 },
  { l: '92%', t: '38%', s: 1.5, o: 0.28 },
  { l: '22%', t: '18%', s: 1,   o: 0.2  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

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

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden relative"
      style={{
        background: `radial-gradient(ellipse at 55% 15%, ${current.bg2} 0%, ${current.bg1} 68%)`,
        transition: 'background 420ms ease',
      }}
    >
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: s.s, height: s.s, left: s.l, top: s.t, opacity: s.o }} />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 pt-14 pb-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
            <img src="/logo.png" alt="" className="w-full h-full object-cover"
              onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
          <span className="text-xs font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
            FamillyBill HT
          </span>
        </div>
        {!isLast && (
          <button
            onClick={() => setSlide(SLIDES.length - 1)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl cursor-pointer tr"
            style={{
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Passer
          </button>
        )}
      </div>

      {/* Illustration */}
      <div
        className="relative flex-1 flex items-center justify-center px-6 py-6 z-10"
        onPointerDown={e => { ptrStart.current = e.clientX }}
        onPointerUp={e => {
          const d = e.clientX - ptrStart.current
          if (d < -40) next()
          else if (d > 40) prev()
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 rounded-full blur-[90px] opacity-12"
            style={{ background: 'var(--lime)' }} />
        </div>
        <div key={current.key} className="relative animate-scale-in">
          <current.Illustration />
        </div>
      </div>

      {/* Bottom sheet */}
      <div
        className="relative z-10 px-6 pt-7 pb-10 space-y-5"
        style={{
          background: 'rgba(4,7,18,0.72)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '2.5rem 2.5rem 0 0',
        }}
      >
        {/* Dots */}
        <div className="flex items-center gap-2 justify-center">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className="h-1 rounded-full tr cursor-pointer"
              style={{
                width: i === slide ? 28 : 5,
                background: i === slide ? 'white' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* Text */}
        <div key={current.key + '-text'} className="animate-fade-in-up">
          <h1 className="text-[1.8rem] font-bold text-white leading-tight mb-3 whitespace-pre-line"
            style={{ letterSpacing: '-0.02em' }}>
            {current.title}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {current.subtitle}
          </p>
        </div>

        {/* CTA */}
        {isLast ? (
          <div className="space-y-3 animate-fade-in-up stagger-1">
            <Link to="/register" className="block">
              <button
                className="btn-lime w-full rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                style={{ height: 52 }}
              >
                Créer mon compte gratuitement
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/login" className="block">
              <button
                className="w-full rounded-2xl font-semibold text-sm flex items-center justify-center cursor-pointer tr"
                style={{
                  height: 52,
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.55)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                J'ai déjà un compte
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between animate-fade-in-up stagger-1">
            <button
              onClick={prev}
              disabled={slide === 0}
              className="flex items-center justify-center rounded-2xl cursor-pointer disabled:opacity-20 tr"
              style={{
                width: 44, height: 44,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
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
