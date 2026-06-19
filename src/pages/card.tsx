import { useState } from 'react'
import { Globe, CreditCard, Eye, EyeOff, Lock, Unlock, Smartphone, Shield, Check, ChevronRight, MapPin } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

const SPENDING = [
  { flag: '🇫🇷', country: 'France', amount: '€124.50', currency: 'EUR', date: 'Today' },
  { flag: '🇯🇵', country: 'Japan', amount: '¥8,400', currency: 'JPY', date: 'Yesterday' },
  { flag: '🇺🇸', country: 'United States', amount: '$45.00', currency: 'USD', date: '2 days ago' },
]

export function CardPage() {
  const { profile } = useAuth()
  const [frozen, setFrozen] = useState(false)
  const [showNumber, setShowNumber] = useState(false)
  const [online, setOnline] = useState(true)
  const [contactless, setContactless] = useState(true)
  const [atm, setAtm] = useState(true)
  const name = profile?.full_name ?? 'Your Name'

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--wise-sage)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--wise-ink)' }}>Wise Card</h1>
          <p className="text-sm text-muted-foreground">Spend in 160+ countries at the real exchange rate</p>
        </div>

        {/* Card visual */}
        <div className="flex justify-center py-4">
          <div className="relative">
            <div
              className="w-80 h-48 rounded-3xl p-6 flex flex-col justify-between shadow-2xl transition-all"
              style={{
                background: frozen
                  ? 'linear-gradient(135deg, #666 0%, #999 100%)'
                  : 'linear-gradient(135deg, var(--wise-ink) 0%, #2d2f2b 100%)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: frozen ? '#ccc' : 'var(--wise-lime)' }} />
                  <span className="text-white font-black text-sm">Wise</span>
                </div>
                <div className="flex items-center gap-1">
                  {frozen && <Lock className="w-4 h-4 text-white/60" />}
                  <Globe className="w-5 h-5 text-white/60" />
                </div>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">Multi-currency</p>
                <p className="text-white font-mono tracking-widest text-sm">
                  {showNumber ? '4729 1234 5678 9012' : '•••• •••• •••• 4729'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wide">Cardholder</p>
                    <p className="text-white/80 text-xs font-semibold">{name.toUpperCase().slice(0, 26)}</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-white/60" />
                </div>
              </div>
            </div>
            {frozen && (
              <div className="absolute inset-0 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div className="text-center">
                  <Lock className="w-8 h-8 text-white mx-auto mb-1" />
                  <p className="text-white font-semibold text-sm">Card frozen</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFrozen(!frozen)}
            className="bg-white rounded-2xl p-4 border border-border flex flex-col items-center gap-2 hover:shadow-sm transition-all"
          >
            {frozen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            <span className="text-xs font-semibold text-muted-foreground">{frozen ? 'Unfreeze' : 'Freeze'}</span>
          </button>
          <button
            onClick={() => setShowNumber(!showNumber)}
            className="bg-white rounded-2xl p-4 border border-border flex flex-col items-center gap-2 hover:shadow-sm transition-all"
          >
            {showNumber ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span className="text-xs font-semibold text-muted-foreground">{showNumber ? 'Hide' : 'Show'} details</span>
          </button>
          <button className="bg-white rounded-2xl p-4 border border-border flex flex-col items-center gap-2 hover:shadow-sm transition-all">
            <Smartphone className="w-5 h-5" />
            <span className="text-xs font-semibold text-muted-foreground">Add to wallet</span>
          </button>
        </div>

        {/* Card stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Spent this month', value: '€243.50' },
            { label: 'Currencies used', value: '3' },
            { label: 'Countries visited', value: '3' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-border text-center">
              <p className="text-xl font-black" style={{ color: 'var(--wise-ink)' }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Card controls */}
        <div className="bg-white rounded-3xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: 'var(--wise-ink)' }} />
              <h3 className="font-bold" style={{ color: 'var(--wise-ink)' }}>Card controls</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {[
              { label: 'Online payments', desc: 'Allow payments on websites', state: online, setState: setOnline },
              { label: 'Contactless payments', desc: 'Tap to pay', state: contactless, setState: setContactless },
              { label: 'ATM withdrawals', desc: 'Withdraw cash worldwide', state: atm, setState: setAtm },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={item.state} onCheckedChange={item.setState} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent spending */}
        <div className="bg-white rounded-3xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: 'var(--wise-ink)' }} />
              <h3 className="font-bold" style={{ color: 'var(--wise-ink)' }}>Recent spending</h3>
            </div>
            <Badge variant="outline" className="rounded-full text-xs">Card</Badge>
          </div>
          <div className="divide-y divide-border">
            {SPENDING.map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <span className="text-2xl">{item.flag}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.country}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: 'var(--wise-ink)' }}>{item.amount}</p>
                  <p className="text-xs text-muted-foreground">{item.currency}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="rounded-3xl p-6 border border-border" style={{ backgroundColor: 'var(--wise-ink)' }}>
          <h3 className="font-black text-white mb-4">Card benefits</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              'No foreign transaction fees',
              'Real mid-market exchange rate',
              'Freeze and unfreeze instantly',
              'Spend in 49 currencies',
              'Works in 160+ countries',
              'Add to Apple/Google Pay',
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--wise-lime)' }}>
                  <Check className="w-2.5 h-2.5" style={{ color: 'var(--wise-ink)' }} />
                </div>
                <span className="text-white/80 text-xs">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
