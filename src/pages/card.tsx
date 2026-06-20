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
    gradient: 'linear-gradient(135deg, #0a1428 0%, #0d2260 50%, #1A56DB 100%)',
    last4: '4521',
    flag: '/icons/currencies/htg.png',
    glowColor: '#1A56DB',
  },
  {
    id: 'usd',
    code: 'USD',
    name: 'Dollar américain',
    symbol: '$',
    amount: 2450.0,
    gradient: 'linear-gradient(135deg, #021a12 0%, #04422e 50%, #047857 100%)',
    last4: '8832',
    flag: '/icons/currencies/usd.png',
    glowColor: '#10b981',
  },
  {
    id: 'eur',
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    amount: 1820.5,
    gradient: 'linear-gradient(135deg, #0e0c2a 0%, #1c1862 50%, #4338ca 100%)',
    last4: '2267',
    flag: '/icons/currencies/eur-new.png',
    glowColor: '#818cf8',
  },
  {
    id: 'cad',
    code: 'CAD',
    name: 'Dollar canadien',
    symbol: 'C$',
    amount: 890.0,
    gradient: 'linear-gradient(135deg, #1e0404 0%, #5a0e0e 50%, #991b1b 100%)',
    last4: '5519',
    flag: '/icons/currencies/cad.png',
    glowColor: '#f87171',
  },
  {
    id: 'brl',
    code: 'BRL',
    name: 'Real brésilien',
    symbol: 'R$',
    amount: 3200.0,
    gradient: 'linear-gradient(135deg, #1c0a00 0%, #5c2d06 50%, #92400e 100%)',
    last4: '7743',
    flag: '/icons/currencies/brl.jpg',
    glowColor: '#fbbf24',
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
      {/* Full-screen dark backdrop (covers nav area) */}
      <div className="fixed inset-0 -z-10" style={{ background: '#080e1c' }} />

      <div className="min-h-screen pb-36" style={{ background: '#080e1c' }}>

        {/* ── Header ── */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Mes Cartes</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{CURRENCY_CARDS.length} comptes devises</p>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer tr hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Plus className="w-4 h-4 text-white/70" />
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
                    ? `0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08), 0 0 60px ${c.glowColor}22`
                    : '0 4px 16px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 320ms cubic-bezier(0.32,0.72,0,1)',
                }}
                onClick={() => { if (offset !== 0) setActiveCard(i) }}
              >
                {/* Shimmer */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />

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
          {CURRENCY_CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveCard(i)}
              className="h-1 rounded-full tr cursor-pointer"
              style={{
                width: i === activeCard ? 22 : 5,
                background: i === activeCard ? 'white' : 'rgba(255,255,255,0.2)',
                transition: 'all 250ms ease',
              }}
            />
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="mx-5 mt-6 grid grid-cols-4 gap-2">
          {ACTIONS.map(({ label, Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center tr hover:opacity-75"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <Icon className="w-5 h-5 text-white/65" />
              </div>
              <span className="font-medium" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Card settings ── */}
        <div
          className="mx-5 mt-5 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {[
            { label: 'Paiements en ligne',    Icon: Zap,           value: 'Activé' },
            { label: 'Paiement sans contact', Icon: MoreHorizontal, value: 'Activé' },
          ].map((item, i) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-4 cursor-pointer tr hover:opacity-80"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div className="flex items-center gap-3">
                <item.Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500 }}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{item.value}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent transactions ── */}
        <div className="mx-5 mt-5">
          <p className="font-bold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
            Transactions récentes
          </p>
          <div className="space-y-2">
            {RECENT_TX.map(tx => (
              <div
                key={tx.name}
                className="flex items-center justify-between p-4 rounded-2xl cursor-pointer tr hover:opacity-80"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: tx.positive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                      color: tx.positive ? '#4ade80' : '#f87171',
                    }}
                  >
                    {tx.name[0]}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
                      {tx.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{tx.date}</p>
                  </div>
                </div>
                <p className="font-bold" style={{
                  color: tx.positive ? '#4ade80' : '#f87171',
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
