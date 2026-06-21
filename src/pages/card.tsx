import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowUpRight, ArrowDownLeft, Lock, Unlock, Eye, EyeOff, Zap, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const CURRENCY_CARDS = [
  {
    id: 'htg',
    code: 'HTG',
    name: 'Gourde haïtienne',
    symbol: 'G',
    amount: 45820.0,
    gradient: 'linear-gradient(135deg, #1a0070 0%, #3b12cc 45%, #6d28d9 100%)',
    last4: '4521',
    flag: '/icons/currencies/htg.png',
    glowColor: '#7c3aed',
    accent: 'rgba(167,139,250,0.3)',
  },
  {
    id: 'usd',
    code: 'USD',
    name: 'Dollar américain',
    symbol: '$',
    amount: 2450.0,
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 45%, #34d399 100%)',
    last4: '8832',
    flag: '/icons/currencies/usd.png',
    glowColor: '#10b981',
    accent: 'rgba(52,211,153,0.3)',
  },
  {
    id: 'eur',
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    amount: 1820.5,
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #60a5fa 100%)',
    last4: '2267',
    flag: '/icons/currencies/eur-new.png',
    glowColor: '#3b82f6',
    accent: 'rgba(96,165,250,0.3)',
  },
  {
    id: 'cad',
    code: 'CAD',
    name: 'Dollar canadien',
    symbol: 'C$',
    amount: 890.0,
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #fb923c 100%)',
    last4: '5519',
    flag: '/icons/currencies/cad.png',
    glowColor: '#f97316',
    accent: 'rgba(251,146,60,0.3)',
  },
  {
    id: 'brl',
    code: 'BRL',
    name: 'Real brésilien',
    symbol: 'R$',
    amount: 3200.0,
    gradient: 'linear-gradient(135deg, #831843 0%, #e11d48 45%, #fb7185 100%)',
    last4: '7743',
    flag: '/icons/currencies/brl.jpg',
    glowColor: '#f43f5e',
    accent: 'rgba(251,113,133,0.3)',
  },
]

const RECENT_TX = [
  { name: 'Jean Paul M.',    amount: '+G 1,200', positive: true,  date: "Aujourd'hui" },
  { name: 'Électricité EDH', amount: '-G 850',   positive: false, date: 'Hier'        },
  { name: 'Marie Dupont',    amount: '+$120',     positive: true,  date: '19 juin'     },
  { name: 'Digicel Haïti',  amount: '-G 450',    positive: false, date: '18 juin'     },
]

export function CardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [activeCard, setActiveCard] = useState(0)
  const [showAmount, setShowAmount] = useState(true)
  const [frozen, setFrozen] = useState(false)
  const ptrStart = useRef(0)

  const name = profile?.full_name ?? 'Votre Nom'
  function swipeLeft() { if (activeCard < CURRENCY_CARDS.length - 1) setActiveCard(a => a + 1) }
  function swipeRight() { if (activeCard > 0) setActiveCard(a => a - 1) }

  const ACTIONS = [
    { label: 'Ajouter',  Icon: Plus,                   onClick: () => navigate('/wallet')              },
    { label: 'Envoyer',  Icon: ArrowUpRight,            onClick: () => navigate('/transfer?mode=send')  },
    { label: 'Retirer',  Icon: ArrowDownLeft,           onClick: () => navigate('/transfer?mode=withdraw') },
    { label: frozen ? 'Débloquer' : 'Bloquer', Icon: frozen ? Unlock : Lock, onClick: () => setFrozen(f => !f) },
  ]

  return (
    <>
      {/* Full-screen dark backdrop */}
      <div className="fixed inset-0 -z-10" style={{ background: '#0a0a14' }} />
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full -z-10 blur-[120px]" style={{ background: 'rgba(109,40,217,0.12)' }} />
      <div className="fixed bottom-20 right-0 w-72 h-72 rounded-full -z-10 blur-[100px]" style={{ background: 'rgba(5,150,105,0.1)' }} />

      <div className="min-h-screen pb-36" style={{ background: 'transparent' }}>

        {/* ── Header ── */}
        <div className="px-5 pt-7 pb-4 flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-white" style={{ fontSize: 22, letterSpacing: '-0.03em' }}>Mes Cartes</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{CURRENCY_CARDS.length} comptes devises</p>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer tr hover:opacity-85"
            style={{
              background: `${CURRENCY_CARDS[activeCard].glowColor}22`,
              border: `1px solid ${CURRENCY_CARDS[activeCard].glowColor}44`,
            }}
          >
            <Plus className="w-4 h-4" style={{ color: CURRENCY_CARDS[activeCard].glowColor }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: CURRENCY_CARDS[activeCard].glowColor }}>Ajouter</span>
          </button>
        </div>

        {/* ── Card stack ── */}
        <div
          className="relative mx-5 select-none"
          style={{ height: 216 }}
          onPointerDown={e => { ptrStart.current = e.clientX }}
          onPointerUp={e => {
            const d = e.clientX - ptrStart.current
            if (d < -40) swipeLeft()
            else if (d > 40) swipeRight()
          }}
        >
          {CURRENCY_CARDS.map((c, i) => {
            const offset = i - activeCard
            if (Math.abs(offset) > 2) return null

            const scale = 1 - Math.abs(offset) * 0.04
            const translateY = Math.abs(offset) * 10
            const translateX = offset * 6
            const opacity = 1 - Math.abs(offset) * 0.22

            return (
              <div
                key={c.id}
                className="absolute inset-0 rounded-[2rem] overflow-hidden cursor-pointer"
                style={{
                  background: c.gradient,
                  transform: `translateX(${translateX}%) translateY(${translateY}px) scale(${scale})`,
                  zIndex: CURRENCY_CARDS.length - Math.abs(offset),
                  opacity,
                  boxShadow: offset === 0
                    ? `0 12px 40px ${c.glowColor}55, 0 0 0 1px rgba(255,255,255,0.1)`
                    : '0 4px 16px rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 320ms cubic-bezier(0.32,0.72,0,1)',
                }}
                onClick={() => { if (offset !== 0) setActiveCard(i) }}
              >
                {/* Shimmer */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%)' }} />
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl"
                  style={{ background: c.accent }} />

                {/* Card content — only fully rendered on active */}
                {offset === 0 && (
                  <div className="relative h-full p-6 flex flex-col justify-between">
                    {/* Top */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold tracking-[0.18em] uppercase text-white/45" style={{ fontSize: 9 }}>
                          {c.code}
                        </p>
                        <p className="text-white/65 mt-0.5" style={{ fontSize: 11 }}>{c.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={c.flag} alt={c.code}
                          className="w-8 h-8 rounded-full object-cover"
                          style={{ border: '1.5px solid rgba(255,255,255,0.2)' }}
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                        <button
                          onClick={e => { e.stopPropagation(); setShowAmount(v => !v) }}
                          className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                          style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                          {showAmount
                            ? <Eye className="w-3.5 h-3.5 text-white/70" />
                            : <EyeOff className="w-3.5 h-3.5 text-white/70" />}
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 500, marginBottom: 4 }}>
                        Solde disponible
                      </p>
                      <p className="text-white font-bold" style={{ fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {showAmount
                          ? `${c.symbol} ${c.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${c.symbol} ••••••`}
                      </p>
                    </div>

                    {/* Bottom */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-mono text-white/25" style={{ fontSize: 10, letterSpacing: '0.12em' }}>
                          •••• •••• •••• {c.last4}
                        </p>
                        <p className="text-white/40 mt-1" style={{ fontSize: 10 }}>
                          {name.toUpperCase().slice(0, 18)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {frozen && <Lock className="w-4 h-4 text-white/30" />}
                        <div className="w-7 h-7 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                          <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Dots ── */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {CURRENCY_CARDS.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveCard(i)}
              className="h-1.5 rounded-full tr cursor-pointer"
              style={{
                width: i === activeCard ? 24 : 6,
                background: i === activeCard ? CURRENCY_CARDS[activeCard].glowColor : 'rgba(255,255,255,0.15)',
                transition: 'all 250ms ease',
                boxShadow: i === activeCard ? `0 0 8px ${c.glowColor}88` : 'none',
              }}
            />
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="mx-5 mt-6 grid grid-cols-4 gap-2">
          {ACTIONS.map(({ label, Icon, onClick }, idx) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center tr group-hover:opacity-80"
                style={{
                  background: idx === 0 ? CURRENCY_CARDS[activeCard].glowColor : 'rgba(255,255,255,0.08)',
                  border: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: idx === 0 ? `0 4px 16px ${CURRENCY_CARDS[activeCard].glowColor}55` : 'none',
                }}
              >
                <Icon className="w-5 h-5" style={{ color: idx === 0 ? '#fff' : 'rgba(255,255,255,0.65)' }} />
              </div>
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Card settings ── */}
        <div className="mx-5 mt-5 space-y-2">
          <p className="font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.12em' }}>
            Contrôles de la carte
          </p>
          {[
            { label: 'Paiements en ligne',    Icon: Zap,           value: 'Activé', active: true },
            { label: 'Paiement sans contact', Icon: MoreHorizontal, value: 'Activé', active: true },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer tr hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${CURRENCY_CARDS[activeCard].glowColor}22` }}>
                  <item.Icon className="w-4 h-4" style={{ color: CURRENCY_CARDS[activeCard].glowColor }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 }}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>{item.value}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent transactions ── */}
        <div className="mx-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.12em' }}>
              Transactions récentes
            </p>
            <button onClick={() => navigate('/history')} style={{ fontSize: 11, fontWeight: 700, color: CURRENCY_CARDS[activeCard].glowColor }}>
              Tout voir →
            </button>
          </div>
          <div className="space-y-2">
            {RECENT_TX.map(tx => (
              <div
                key={tx.name}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer tr hover:bg-white/5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{
                      background: tx.positive ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)',
                      color: tx.positive ? '#34d399' : '#fb7185',
                    }}
                  >
                    {tx.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                      {tx.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 1 }}>{tx.date}</p>
                  </div>
                </div>
                <p className="font-bold tabular-nums" style={{
                  color: tx.positive ? '#34d399' : '#fb7185',
                  fontSize: 14,
                }}>
                  {tx.amount}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
