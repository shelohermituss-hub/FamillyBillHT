import { Link } from 'react-router-dom'
import { ArrowRight, Globe, CreditCard, Shield, Star, Check, ChevronRight, Users, TrendingDown, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CurrencyConverter } from '@/components/currency-converter'

const TRUST_BADGES = [
  { value: '50K+', label: 'familles haïtiennes' },
  { value: '10+', label: 'devises supportées' },
  { value: '24/7', label: 'service disponible' },
  { value: '0%', label: 'frais cachés' },
]

const FEATURES = [
  {
    icon: TrendingDown,
    title: 'Taux de change réel',
    desc: 'Nous utilisons le taux officiel HTG/USD. Pas de majoration, pas de frais cachés sur chaque transfert.',
    badge: "Jusqu'à 8x moins cher",
  },
  {
    icon: Zap,
    title: 'Transferts rapides',
    desc: '80% des transferts arrivent dans les 24h. Suivez chaque étape de votre transfert en temps réel.',
    badge: 'Souvent instantané',
  },
  {
    icon: Shield,
    title: 'Sûr & sécurisé',
    desc: 'Vos données et votre argent sont protégés par un chiffrement de niveau bancaire. Votre famille est en sécurité.',
    badge: 'Sécurité bancaire',
  },
]

const TESTIMONIALS = [
  { name: 'Marie J.', role: 'Diaspora haïtienne', text: "J'envoie de l'argent à ma famille en Haïti chaque mois. FamillyBill HT me fait économiser des centaines de gourdes sur les frais.", rating: 5 },
  { name: 'Pierre D.', role: 'Chef de famille', text: "Gérer les finances de toute la famille n'a jamais été aussi simple. Je vois tout en un seul endroit.", rating: 5 },
  { name: 'Claudette M.', role: 'Mère au foyer', text: "La carte multi-devises est parfaite pour les achats en ligne et les voyages. Je reçois toujours le meilleur taux.", rating: 5 },
]

const COUNTRIES = ['🇺🇸', '🇬🇧', '🇪🇺', '🇨🇦', '🇦🇺', '🇯🇵', '🇮🇳', '🇧🇷', '🇸🇬', '🇲🇽']

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-28 pb-20 px-4" style={{ backgroundColor: 'var(--fb-light)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}>
                <Star className="w-3 h-3 fill-current" />
                N°1 pour les transferts en Haïti
              </div>

              <h1 className="font-black leading-none tracking-tight" style={{ fontSize: 'clamp(3rem, 8vw, 7.875rem)', color: 'var(--fb-ink)', fontWeight: 900, lineHeight: 1 }}>
                Famille<br />
                <span style={{ color: 'var(--fb-ink)' }}>sans</span><br />
                <span className="relative">
                  frontières
                  <span className="absolute -bottom-2 left-0 right-0 h-1.5 rounded-full" style={{ backgroundColor: 'var(--fb-red)' }} />
                </span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Envoyez de l'argent en Haïti au taux réel. 8× moins cher que les banques. Plus de 50 000 familles nous font confiance.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="rounded-2xl font-semibold h-12 px-8 border-0"
                    style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}
                  >
                    Commencer — c'est gratuit
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-2xl font-semibold h-12 px-8"
                  >
                    Se connecter
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4">
                {TRUST_BADGES.map(b => (
                  <div key={b.label} className="text-center">
                    <p className="text-2xl font-black" style={{ color: 'var(--fb-ink)' }}>{b.value}</p>
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
          <p className="text-sm font-semibold text-muted-foreground shrink-0">Nous desservons</p>
          <div className="flex items-center gap-3 flex-wrap">
            {COUNTRIES.map((flag, i) => (
              <span key={i} className="text-2xl hover:scale-110 transition-transform cursor-default">{flag}</span>
            ))}
            <span className="text-sm text-muted-foreground font-medium">10+ pays</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="rounded-full">Pourquoi FamillyBill HT</Badge>
            <h2 className="text-5xl font-black tracking-tight" style={{ color: 'var(--fb-ink)' }}>
              Conçu pour<br />votre famille.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-8 rounded-3xl border border-border hover:border-wise-ink/20 transition-all hover:shadow-lg group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--fb-red)' }}>
                  <f.icon className="w-6 h-6" style={{ color: 'var(--fb-ink)' }} />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: 'var(--fb-light)', color: 'var(--fb-ink)' }}>
                  {f.badge}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--fb-ink)' }}>{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-currency account */}
      <section className="py-24 px-4" style={{ backgroundColor: 'var(--fb-light)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full">Compte multi-devises</Badge>
              <h2 className="text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--fb-ink)' }}>
                10+ devises.<br />Dépensez partout.
              </h2>
              <p className="text-lg text-muted-foreground">
                Ouvrez votre compte FamillyBill HT et obtenez des coordonnées bancaires locales en HTG, USD, EUR et plus encore.
              </p>
              <ul className="space-y-3">
                {[
                  'Recevez des paiements comme un local — sans frais internationaux',
                  'Taux de change réel lors des conversions entre devises',
                  'Numéros de compte locaux pour HTG, USD, EUR et plus',
                  "Dépensez dans 10+ pays avec la carte FamillyBill HT",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'var(--fb-red)' }}>
                      <Check className="w-3 h-3" style={{ color: 'white' }} />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button
                  size="lg"
                  className="rounded-2xl font-semibold h-12 px-8 border-0 mt-2"
                  style={{ backgroundColor: 'var(--fb-ink)', color: 'white' }}
                >
                  Ouvrir votre compte
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            {/* Balance cards visual */}
            <div className="relative flex flex-col gap-4">
              {[
                { flag: '🇭🇹', currency: 'HTG', balance: '245,000.00', account: 'Numéro: HT71 0961 2345 6769' },
                { flag: '🇺🇸', currency: 'USD', balance: '1,820.50', account: 'Routing: 026073150' },
                { flag: '🇪🇺', currency: 'EUR', balance: '890.25', account: 'IBAN: FR76 3000 6000 0112' },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-5 shadow-md border border-border flex items-center gap-4"
                  style={{ transform: `translateX(${i * 8}px)` }}
                >
                  <span className="text-3xl">{card.flag}</span>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">{card.account}</p>
                    <p className="font-bold text-lg" style={{ color: 'var(--fb-ink)' }}>{card.currency} {card.balance}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--fb-red)' }}>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--fb-ink)' }} />
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
                  style={{ background: 'linear-gradient(135deg, var(--fb-ink) 0%, #2d2f2b 100%)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="FamillyBill HT" className="w-6 h-6 object-contain" />
                      <span className="text-white font-black text-sm">FamillyBill</span>
                    </div>
                    <Globe className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-1">Multi-devises</p>
                    <p className="text-white font-mono tracking-widest text-sm">•••• •••• •••• 4729</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-white/80 text-xs">J. PIERRE</p>
                      <CreditCard className="w-6 h-6 text-white/60" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-64 h-40 rounded-3xl opacity-30" style={{ backgroundColor: 'var(--fb-red)' }} />
              </div>
            </div>
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full">Carte FamillyBill HT</Badge>
              <h2 className="text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--fb-ink)' }}>
                Payez dans 10+<br />pays.
              </h2>
              <p className="text-lg text-muted-foreground">
                La carte FamillyBill HT utilise automatiquement la meilleure devise de votre compte. Sans frais de transaction étrangers. Toujours le taux réel.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, label: '10+ pays', desc: 'Utilisez-la partout' },
                  { icon: TrendingDown, label: 'Sans majoration', desc: 'Taux marché toujours' },
                  { icon: Zap, label: '10 devises', desc: 'Sélection auto du solde' },
                  { icon: Shield, label: 'Bloquer en tout temps', desc: 'Contrôle total' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-border">
                    <item.icon className="w-5 h-5 mb-2" style={{ color: 'var(--fb-red)' }} />
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link to="/register">
                <Button
                  size="lg"
                  className="rounded-2xl font-semibold h-12 px-8 border-0"
                  style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}
                >
                  Obtenez votre carte FamillyBill HT
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4" style={{ backgroundColor: 'var(--fb-light)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" style={{ color: 'var(--fb-red)' }} />
              ))}
              <span className="ml-2 text-sm font-semibold text-muted-foreground">4.9/5 de plus de 10 000 avis</span>
            </div>
            <h2 className="text-5xl font-black tracking-tight" style={{ color: 'var(--fb-ink)' }}>
              Aimé par des milliers
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-border">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: 'var(--fb-red)' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'var(--fb-ink)', color: 'white' }}>
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
      <section className="py-24 px-4" style={{ backgroundColor: 'var(--fb-ink)' }}>
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-2">
            <Users className="w-5 h-5" style={{ color: 'var(--fb-red)' }} />
            <span className="font-semibold text-white/80 text-sm">Rejoignez 50 000 familles</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight leading-tight">
            Commencez à envoyer<br />avec FamillyBill HT
          </h2>
          <p className="text-white/60 text-lg">Aucun frais pour ouvrir un compte. Aucun coût caché. Jamais.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="rounded-2xl font-semibold h-14 px-10 text-base border-0"
                style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}
              >
                Créer votre compte gratuit
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl font-semibold h-14 px-10 text-base border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Se connecter
              </Button>
            </Link>
          </div>
          <p className="text-white/40 text-xs">
            FamillyBill HT est sécurisé avec un chiffrement de niveau bancaire.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { title: 'Particuliers', items: ["Envoyer de l'argent", "Recevoir de l'argent", 'Compte multi-devises', 'Carte de débit', 'Application mobile'] },
              { title: 'Entreprises', items: ['Compte entreprise', 'Paie', 'API', 'Grandes entreprises', 'Partenariat'] },
              { title: 'Entreprise', items: ['À propos', 'Actualités', 'Carrières', 'Mission', 'Investisseurs'] },
              { title: 'Aide', items: ["Centre d'aide", 'Contactez-nous', 'Communauté', 'Sécurité', 'Accessibilité'] },
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
              <img src="/logo.png" alt="FamillyBill HT" className="w-6 h-6 object-contain" />
              <span className="font-black text-sm" style={{ color: 'var(--fb-ink)' }}>FamillyBill HT</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              © 2025 FamillyBill HT. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
