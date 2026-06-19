import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownLeft, Repeat, Plus, CreditCard, Eye, EyeOff, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount, type Jar, type Transaction } from '@/lib/supabase'
import { formatCurrency, getCurrency } from '@/lib/currencies'
import { cn } from '@/lib/utils'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function QuickAction({ icon: Icon, label, href, accent }: { icon: React.ElementType; label: string; href: string; accent?: boolean }) {
  return (
    <Link to={href}>
      <div className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer",
        accent ? "" : "bg-white/10 hover:bg-white/20"
      )}
        style={accent ? { backgroundColor: 'var(--fb-red)' } : {}}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          accent ? "bg-black/10" : "bg-white/15"
        )}>
          <Icon className="w-5 h-5" style={{ color: 'white' }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: 'white' }}>
          {label}
        </span>
      </div>
    </Link>
  )
}

export function DashboardPage() {
  const { user, profile } = useAuth()
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [jars, setJars] = useState<Jar[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [accRes, jarRes, txRes] = await Promise.all([
        supabase.from('currency_accounts').select('*').eq('user_id', user!.id).order('is_main', { ascending: false }),
        supabase.from('jars').select('*').eq('user_id', user!.id),
        supabase.from('transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
      ])
      if (accRes.data) setAccounts(accRes.data)
      if (jarRes.data) setJars(jarRes.data)
      if (txRes.data) setTransactions(txRes.data)
      setLoading(false)
    }
    load()
  }, [user])

  const totalInEur = accounts.reduce((sum, a) => {
    const rates: Record<string, number> = { EUR: 1, USD: 0.92, GBP: 1.16, CAD: 0.68, AUD: 0.60, JPY: 0.0062, CHF: 1.09 }
    return sum + a.balance * (rates[a.currency] ?? 0.92)
  }, 0)

  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'

  return (
    <div className="min-h-screen pb-16 md:pb-12" style={{ backgroundColor: 'var(--fb-light)' }}>
      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-6">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{getGreeting()},</p>
            <h1 className="text-2xl font-black" style={{ color: 'var(--fb-ink)' }}>
              {firstName} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {profile && !profile.verified && (
              <Badge variant="outline" className="rounded-full text-xs font-medium border-orange-300 text-orange-600 bg-orange-50">
                Verify identity
              </Badge>
            )}
            <Link to="/card">
              <Button variant="outline" size="sm" className="rounded-2xl font-semibold gap-1.5">
                <CreditCard className="w-4 h-4" />
                Card
              </Button>
            </Link>
          </div>
        </div>

        {/* Total balance hero */}
        <div className="rounded-3xl p-6" style={{ backgroundColor: 'var(--fb-ink)' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Total balance</p>
              <div className="flex items-center gap-3">
                {loading ? (
                  <Skeleton className="h-10 w-40 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                ) : (
                  <h2 className="text-4xl font-black text-white tabular-nums">
                    {balanceVisible
                      ? `€ ${totalInEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '€ •••,•••'}
                  </h2>
                )}
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-white/30 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-white/30 text-xs mt-1">
                {accounts.length} devise{accounts.length > 1 ? 's' : ''} · approx. en EUR
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--fb-red)' }}>
              <Sparkles className="w-6 h-6" style={{ color: 'white' }} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={ArrowUpRight} label="Envoyer" href="/transfer" accent />
            <QuickAction icon={ArrowDownLeft} label="Recevoir" href="/account" />
            <QuickAction icon={Repeat} label="Convertir" href="/transfer?mode=convert" />
            <QuickAction icon={Plus} label="Ajouter" href="/account" />
          </div>
        </div>

        {/* Currency accounts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--fb-ink)' }}>Vos devises</h2>
            <Link to="/account" className="text-sm font-semibold hover:underline" style={{ color: 'var(--fb-ink)' }}>
              See all
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)
            ) : accounts.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 border border-border text-center space-y-2">
                <p className="text-sm text-muted-foreground">No currency accounts yet.</p>
                <Link to="/account">
                  <Button size="sm" className="rounded-2xl border-0 font-semibold mt-1" style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}>
                    Open your first account
                  </Button>
                </Link>
              </div>
            ) : (
              accounts.map(acc => {
                const curr = getCurrency(acc.currency)
                return (
                  <Link to="/account" key={acc.id}>
                    <div className="bg-white rounded-2xl px-4 py-3.5 border border-border flex items-center gap-4 hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-muted shrink-0">
                        {curr?.flag ?? '💰'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{acc.currency}</p>
                          {acc.is_main && (
                            <Badge variant="secondary" className="text-xs rounded-full px-2 py-0 font-medium">Main</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{curr?.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--fb-ink)' }}>
                          {balanceVisible ? formatCurrency(acc.balance, acc.currency) : `${curr?.symbol ?? ''} ••••`}
                        </p>
                        {acc.iban && <p className="text-xs text-muted-foreground">IBAN</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Jars */}
        {(loading || jars.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg" style={{ color: 'var(--fb-ink)' }}>Coffres</h2>
              <button className="text-sm font-semibold hover:underline" style={{ color: 'var(--fb-ink)' }}>
                + New jar
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {loading ? (
                [1, 2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)
              ) : jars.map(jar => {
                const curr = getCurrency(jar.currency)
                const progress = jar.goal ? Math.min((jar.balance / jar.goal) * 100, 100) : 0
                return (
                  <div key={jar.id} className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--fb-ink)' }}>{jar.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{curr?.flag} {jar.currency}</p>
                      </div>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: jar.color + '30' }}>
                        🏺
                      </div>
                    </div>
                    <p className="font-black text-xl mb-2" style={{ color: 'var(--fb-ink)' }}>
                      {balanceVisible ? formatCurrency(jar.balance, jar.currency) : '••••'}
                    </p>
                    {jar.goal && (
                      <div className="space-y-1">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, backgroundColor: jar.color }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {progress.toFixed(0)}% de l'objectif {formatCurrency(jar.goal, jar.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--fb-ink)' }}>Activité récente</h2>
            <Link to="/history" className="text-sm font-semibold hover:underline" style={{ color: 'var(--fb-ink)' }}>
              All transactions
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-border text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--fb-light)' }}>
                <ArrowUpRight className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Send money or add funds to get started.</p>
              </div>
              <Link to="/transfer">
                <Button size="sm" className="rounded-2xl border-0 font-semibold" style={{ backgroundColor: 'var(--fb-red)', color: 'white' }}>
                  Send money
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const isSend = tx.type === 'send' || tx.type === 'withdraw'
                const curr = getCurrency(tx.currency)
                
                return (
                  <div key={tx.id} className="bg-white rounded-2xl px-4 py-3.5 border border-border flex items-center gap-3 hover:shadow-sm transition-all">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      isSend ? "bg-red-50" : tx.type === 'convert' ? "bg-blue-50" : "bg-green-50"
                    )}>
                      {tx.type === 'convert'
                        ? <Repeat className="w-5 h-5 text-blue-600" />
                        : isSend
                          ? <ArrowUpRight className="w-5 h-5 text-red-500" />
                          : <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {tx.type === 'convert'
                          ? `Convert ${tx.currency} → ${tx.target_currency}`
                          : tx.recipient_name ?? 'Transfer'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{tx.type} · {tx.status}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-bold text-sm", isSend ? "text-red-500" : tx.type === 'convert' ? "text-blue-600" : "text-green-600")}>
                        {isSend ? '−' : '+'}{curr?.symbol}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
