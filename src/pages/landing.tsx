import { Link } from 'react-router-dom'
import { ArrowRight, Globe, CreditCard, Shield, Star, Check, ChevronRight, Users, TrendingDown, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CurrencyConverter } from '@/components/currency-converter'

const TRUST_BADGES = [
  { value: '16M+', label: 'customers worldwide' },
  { value: '160+', label: 'countries supported' },
  { value: '40+', label: 'currencies supported' },
  { value: '£9B+', label: 'saved in fees' },
]

const FEATURES = [
  {
    icon: TrendingDown,
    title: 'Always the real rate',
    desc: 'We use the mid-market exchange rate — the one you see on Google. No markup, no hidden fees.',
    badge: 'Up to 8x cheaper',
  },
  {
    icon: Zap,
    title: 'Money moves fast',
    desc: '80% of transfers arrive in 24 hours. Track every step of your transfer in real time.',
    badge: 'Often instant',
  },
  {
    icon: Shield,
    title: 'Safe & regulated',
    desc: 'Licensed by financial authorities in 50+ countries. Your money is always protected.',
    badge: 'FCA regulated',
  },
]

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Freelancer', text: "I save hundreds every month compared to my bank. The transparency is incredible — I always know exactly what I'm paying.", rating: 5 },
  { name: 'Marco B.', role: 'Small business owner', text: 'Managing multiple currencies for my international team has never been easier. Wise is a game changer.', rating: 5 },
  { name: 'Priya M.', role: 'Digital nomad', text: 'The multi-currency card is perfect for traveling. I always get the best rate without thinking about it.', rating: 5 },
]

const COUNTRIES = ['🇺🇸', '🇬🇧', '🇪🇺', '🇨🇦', '🇦🇺', '🇯🇵', '🇮🇳', '🇧🇷', '🇸🇬', '🇲🇽']

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-28 pb-20 px-4" style={{ backgroundColor: 'var(--wise-sage)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}>
                <Star className="w-3 h-3 fill-current" />
                Rated #1 for international money transfers
              </div>

              <h1 className="font-black leading-none tracking-tight" style={{ fontSize: 'clamp(3rem, 8vw, 7.875rem)', color: 'var(--wise-ink)', fontWeight: 900, lineHeight: 1 }}>
                Money<br />
                <span style={{ color: 'var(--wise-ink)' }}>without</span><br />
                <span className="relative">
                  borders
                  <span className="absolute -bottom-2 left-0 right-0 h-1.5 rounded-full" style={{ backgroundColor: 'var(--wise-lime)' }} />
                </span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Send money abroad with the real exchange rate. 8× cheaper than banks, 16 million customers trust us worldwide.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="rounded-2xl font-semibold h-12 px-8 border-0"
                    style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}
                  >
                    Get started — it's free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-2xl font-semibold h-12 px-8"
                  >
                    Log in
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4">
                {TRUST_BADGES.map(b => (
                  <div key={b.label} className="text-center">
                    <p className="text-2xl font-black" style={{ color: 'var(--wise-ink)' }}>{b.value}</p>
                    <p className="text-xs text-muted-foreground">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: converter widget */}
            <div className="flex justify-center lg:justify-end">
              <CurrencyConverter />
            </div>
          </div>
        </div>
      </section>

      {/* Countries strip */}
      <section className="py-6 px-4 bg-white border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <p className="text-sm font-semibold text-muted-foreground shrink-0">We serve</p>
          <div className="flex items-center gap-3 flex-wrap">
            {COUNTRIES.map((flag, i) => (
              <span key={i} className="text-2xl hover:scale-110 transition-transform cursor-default">{flag}</span>
            ))}
            <span className="text-sm text-muted-foreground font-medium">160+ countries</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="rounded-full">Why Wise</Badge>
            <h2 className="text-5xl font-black tracking-tight" style={{ color: 'var(--wise-ink)' }}>
              Built different.<br />Built better.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-8 rounded-3xl border border-border hover:border-wise-ink/20 transition-all hover:shadow-lg group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--wise-lime)' }}>
                  <f.icon className="w-6 h-6" style={{ color: 'var(--wise-ink)' }} />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: 'var(--wise-sage)', color: 'var(--wise-ink)' }}>
                  {f.badge}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--wise-ink)' }}>{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-currency account */}
      <section className="py-24 px-4" style={{ backgroundColor: 'var(--wise-sage)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full">Multi-currency account</Badge>
              <h2 className="text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--wise-ink)' }}>
                Hold 40+ currencies.<br />Spend anywhere.
              </h2>
              <p className="text-lg text-muted-foreground">
                Open your Wise account and get local account details in 22 currencies — including USD, EUR, GBP, CAD, AUD and more.
              </p>
              <ul className="space-y-3">
                {[
                  'Receive payments like a local — no international fees',
                  'Real exchange rate when converting between currencies',
                  'Local account numbers for USD, EUR, GBP, AUD and more',
                  'Spend in 160+ countries with the Wise card',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'var(--wise-lime)' }}>
                      <Check className="w-3 h-3" style={{ color: 'var(--wise-ink)' }} />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button
                  size="lg"
                  className="rounded-2xl font-semibold h-12 px-8 border-0 mt-2"
                  style={{ backgroundColor: 'var(--wise-ink)', color: 'white' }}
                >
                  Open your account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            {/* Balance cards visual */}
            <div className="relative flex flex-col gap-4">
              {[
                { flag: '🇪🇺', currency: 'EUR', balance: '2,450.00', account: 'IBAN: BE71 0961 2345 6769' },
                { flag: '🇺🇸', currency: 'USD', balance: '1,820.50', account: 'Routing: 026073150' },
                { flag: '🇬🇧', currency: 'GBP', balance: '890.25', account: 'Sort code: 23-14-70' },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-5 shadow-md border border-border flex items-center gap-4"
                  style={{ transform: `translateX(${i * 8}px)` }}
                >
                  <span className="text-3xl">{card.flag}</span>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">{card.account}</p>
                    <p className="font-bold text-lg" style={{ color: 'var(--wise-ink)' }}>{card.currency} {card.balance}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--wise-lime)' }}>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--wise-ink)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Debit Card */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Card visual */}
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="w-80 h-48 rounded-3xl p-6 flex flex-col justify-between shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, var(--wise-ink) 0%, #2d2f2b 100%)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--wise-lime)' }} />
                      <span className="text-white font-black text-sm">Wise</span>
                    </div>
                    <Globe className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-1">Multi-currency</p>
                    <p className="text-white font-mono tracking-widest text-sm">•••• •••• •••• 4729</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-white/80 text-xs">J. SMITH</p>
                      <CreditCard className="w-6 h-6 text-white/60" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-64 h-40 rounded-3xl opacity-30" style={{ backgroundColor: 'var(--wise-lime)' }} />
              </div>
            </div>
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full">Wise Debit Card</Badge>
              <h2 className="text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--wise-ink)' }}>
                Pay in 160+<br />countries.
              </h2>
              <p className="text-lg text-muted-foreground">
                The Wise card automatically uses the best currency in your account. No foreign transaction fees. Always the real exchange rate.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, label: '160+ countries', desc: 'Use it worldwide' },
                  { icon: TrendingDown, label: 'No markup', desc: 'Mid-market rate always' },
                  { icon: Zap, label: '49 currencies', desc: 'Auto-select best balance' },
                  { icon: Shield, label: 'Freeze anytime', desc: 'Full card controls' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-border">
                    <item.icon className="w-5 h-5 mb-2" style={{ color: 'var(--wise-lime)' }} />
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link to="/register">
                <Button
                  size="lg"
                  className="rounded-2xl font-semibold h-12 px-8 border-0"
                  style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}
                >
                  Get your Wise card
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4" style={{ backgroundColor: 'var(--wise-sage)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" style={{ color: 'var(--wise-lime)' }} />
              ))}
              <span className="ml-2 text-sm font-semibold text-muted-foreground">4.9/5 from 180,000+ reviews</span>
            </div>
            <h2 className="text-5xl font-black tracking-tight" style={{ color: 'var(--wise-ink)' }}>
              Loved by millions
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-border">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: 'var(--wise-lime)' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'var(--wise-ink)', color: 'white' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4" style={{ backgroundColor: 'var(--wise-ink)' }}>
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-2">
            <Users className="w-5 h-5" style={{ color: 'var(--wise-lime)' }} />
            <span className="font-semibold text-white/80 text-sm">Join 16 million people</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight leading-tight">
            Start sending money<br />the wise way
          </h2>
          <p className="text-white/60 text-lg">No fees to open an account. No hidden costs. Ever.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="rounded-2xl font-semibold h-14 px-10 text-base border-0"
                style={{ backgroundColor: 'var(--wise-lime)', color: 'var(--wise-ink)' }}
              >
                Create your free account
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl font-semibold h-14 px-10 text-base border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Log in
              </Button>
            </Link>
          </div>
          <p className="text-white/40 text-xs">
            Wise is authorised by the Financial Conduct Authority. Protected up to €100,000.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { title: 'Personal', items: ['Send money', 'Receive money', 'Multi-currency account', 'Debit card', 'Mobile app'] },
              { title: 'Business', items: ['Business account', 'Payroll', 'API', 'Enterprise', 'Partner with us'] },
              { title: 'Company', items: ['About us', 'Newsroom', 'Careers', 'Mission', 'Investors'] },
              { title: 'Help', items: ['Help Center', 'Contact us', 'Community', 'Security', 'Accessibility'] },
            ].map(col => (
              <div key={col.title}>
                <p className="font-semibold text-sm mb-4">{col.title}</p>
                <ul className="space-y-2">
                  {col.items.map(item => (
                    <li key={item}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--wise-lime)' }}>
                <Globe className="w-3 h-3" style={{ color: 'var(--wise-ink)' }} />
              </div>
              <span className="font-black text-sm" style={{ color: 'var(--wise-ink)' }}>Wise</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              © 2024 Wise Payments Ltd. Authorised by the Financial Conduct Authority.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
