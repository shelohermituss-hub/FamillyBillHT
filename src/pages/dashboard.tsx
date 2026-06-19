import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownLeft, Repeat, Plus, Eye, EyeOff, ChevronRight, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount, type Jar, type Transaction } from '@/lib/supabase'
import { formatCurrency, getCurrency } from '@/lib/currencies'
import { CurrencyIcon } from '@/components/currency-icon'
import { cn } from '@/lib/utils'
import { BILL_CATEGORIES } from '@/lib/haiti-providers'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

const TX_LABEL: Record<string, string> = {
  send: 'Envoi', receive: 'Réception', convert: 'Conversion',
  deposit: 'Dépôt', withdraw: 'Retrait',
}
const TX_STATUS: Record<string, string> = {
  pending: 'En attente', processing: 'En cours',
  completed: 'Complété', failed: 'Échoué', cancelled: 'Annulé',
}

export function DashboardPage() {
  const { user, profile } = useAuth()
  const [accounts, setAccounts]     = useState<CurrencyAccount[]>([])
  const [jars, setJars]             = useState<Jar[]>([])
  const [transactions, setTx]       = useState<Transaction[]>([])
  const [loading, setLoading]       = useState(true)
  const [visible, setVisible]       = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('currency_accounts').select('*').eq('user_id', user.id).order('is_main', { ascending: false }),
      supabase.from('jars').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ]).then(([a, j, t]) => {
      if (a.data) setAccounts(a.data)
      if (j.data) setJars(j.data)
      if (t.data) setTx(t.data)
      setLoading(false)
    })
  }, [user])

  const htgRates: Record<string, number> = {
    HTG: 1, EUR: 148, USD: 134.5, GBP: 170, CAD: 99, AUD: 88, CHF: 153,
  }
  const totalHTG = accounts.reduce((s, a) => s + a.balance * (htgRates[a.currency] ?? 134.5), 0)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'là'

  return (
    <div className="min-h-screen pb-20 md:pb-8" style={{ background: 'var(--surface)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        {/* Greeting row */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <p className="text-sm text-[var(--ink-60)]">{greeting()},</p>
            <h1 className="text-xl font-semibold text-[var(--ink)] mt-0.5">{firstName}</h1>
          </div>
          <button
            onClick={() => setVisible(!visible)}
            aria-label={visible ? 'Masquer le solde' : 'Afficher le solde'}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--surface)] tr cursor-pointer border border-[var(--border)]"
            style={{ background: 'var(--card-bg)' }}
          >
            {visible
              ? <Eye className="w-4 h-4 text-[var(--ink-60)]" />
              : <EyeOff className="w-4 h-4 text-[var(--ink-60)]" />}
          </button>
        </div>

        {/* Balance card */}
        <div className="card-dark p-6 relative overflow-hidden animate-fade-in-up stagger-1" style={{ background: 'var(--ink)' }}>
          {/* Decorative circle */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'var(--lime)' }} />
          <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full opacity-5" style={{ background: 'var(--lime)' }} />

          <div className="relative z-10">
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--lime)' }}>
              Solde total
            </p>
            {loading ? (
              <Skeleton className="h-10 w-48 mb-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }} />
            ) : (
              <p className="text-4xl font-bold text-white tabular-nums leading-none mb-1">
                {visible
                  ? `G ${totalHTG.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`
                  : 'G ••• •••'}
              </p>
            )}
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {accounts.length} devise{accounts.length !== 1 ? 's' : ''} · en HTG
            </p>

            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: ArrowUpRight, label: 'Envoyer',   href: '/transfer',           lime: true  },
                { icon: ArrowDownLeft,label: 'Recevoir',  href: '/account',             lime: false },
                { icon: Repeat,       label: 'Convertir', href: '/transfer?mode=convert', lime: false },
                { icon: Plus,         label: 'Ajouter',   href: '/account',             lime: false },
              ].map(({ icon: Icon, label, href, lime }) => (
                <Link key={label} to={href}>
                  <div className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center tr",
                      lime ? "" : "bg-white/10 group-hover:bg-white/20"
                    )}
                      style={lime ? { background: 'var(--lime)' } : {}}
                    >
                      <Icon className="w-5 h-5" style={{ color: lime ? 'var(--ink)' : 'white' }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bill payment quick access */}
        <section className="animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Payer une facture</h2>
            <Link to="/bills" className="text-xs font-medium tr hover:opacity-70" style={{ color: 'var(--ink-60)' }}>
              Tout voir →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BILL_CATEGORIES.slice(0, 8).map(cat => (
              <Link key={cat.id} to={`/bills?category=${cat.id}`}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-[var(--border)] hover:border-[var(--ink-30)] tr cursor-pointer group" style={{ background: 'var(--card-bg)' }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl tr group-hover:scale-110"
                    style={{ background: cat.bg }}
                  >
                    {cat.emoji}
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--ink)] text-center leading-tight">{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Currencies */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Vos devises</h2>
            <Link to="/account" className="text-xs font-medium tr hover:opacity-70" style={{ color: 'var(--ink-60)' }}>
              Tout voir →
            </Link>
          </div>

          <div className="space-y-2">
            {loading
              ? [1,2,3].map(i => <Skeleton key={i} className="h-[68px] rounded-2xl" />)
              : accounts.length === 0
                ? (
                  <div className="card-flat p-6 text-center">
                    <p className="text-sm text-[var(--ink-60)] mb-3">Aucun compte devise.</p>
                    <Link to="/account">
                      <button className="btn-lime px-4 py-2 rounded-xl text-sm cursor-pointer">
                        Ouvrir un compte
                      </button>
                    </Link>
                  </div>
                )
                : accounts.map((acc, i) => {
                    const curr = getCurrency(acc.currency)
                    return (
                      <Link to="/account" key={acc.id}>
                        <div className={cn("card-flat card-hover flex items-center gap-3 px-4 py-3.5 tr cursor-pointer animate-fade-in-up")}
                          style={{ animationDelay: `${i * 60}ms` }}>
                          <CurrencyIcon code={acc.currency} className="w-10 h-10" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--ink)]">{acc.currency}
                              {acc.is_main && (
                                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>
                                  Principal
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-[var(--ink-60)] mt-0.5">{curr?.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-[var(--ink)] tabular-nums">
                              {visible ? formatCurrency(acc.balance, acc.currency) : `${curr?.symbol} ••••`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--ink-30)] shrink-0" />
                        </div>
                      </Link>
                    )
                  })
            }
          </div>
        </section>

        {/* Jars */}
        {(loading || jars.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--ink)]">Coffres d'épargne</h2>
              <button className="text-xs font-medium text-[var(--ink-60)] hover:opacity-70 tr cursor-pointer">
                + Nouveau
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {loading
                ? [1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)
                : jars.map(jar => {
                    const curr = getCurrency(jar.currency)
                    const pct = jar.goal ? Math.min((jar.balance / jar.goal) * 100, 100) : 0
                    return (
                      <div key={jar.id} className="card-flat p-4 cursor-pointer hover:bg-[var(--surface)] tr">
                        <p className="text-xs font-semibold text-[var(--ink)] truncate">{jar.name}</p>
                        <p className="text-xs text-[var(--ink-60)] mb-2">{curr?.flag} {jar.currency}</p>
                        <p className="text-base font-bold text-[var(--ink)] tabular-nums mb-2">
                          {visible ? formatCurrency(jar.balance, jar.currency) : '••••'}
                        </p>
                        {jar.goal && (
                          <>
                            <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                              <div className="h-full rounded-full tr" style={{ width: `${pct}%`, background: 'var(--lime)' }} />
                            </div>
                            <p className="text-[10px] text-[var(--ink-60)] mt-1">{pct.toFixed(0)}%</p>
                          </>
                        )}
                      </div>
                    )
                  })
              }
            </div>
          </section>
        )}

        {/* Recent transactions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Activité récente</h2>
            <Link to="/history" className="text-xs font-medium text-[var(--ink-60)] hover:opacity-70 tr">
              Tout voir →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="card-flat p-8 text-center">
              <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--lime-light)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--ink)' }} />
              </div>
              <p className="text-sm font-medium text-[var(--ink)]">Aucune transaction</p>
              <p className="text-xs text-[var(--ink-60)] mt-1 mb-4">Envoyez ou ajoutez des fonds pour commencer.</p>
              <Link to="/transfer">
                <button className="btn-lime px-4 py-2 rounded-xl text-sm cursor-pointer">Envoyer</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {transactions.map(tx => {
                const isSend    = tx.type === 'send' || tx.type === 'withdraw'
                const isReceive = tx.type === 'receive' || tx.type === 'deposit'
                const curr      = getCurrency(tx.currency)
                return (
                  <div key={tx.id} className="card-flat flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] tr cursor-pointer">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      isSend ? "bg-red-50" : isReceive ? "bg-[var(--lime-light)]" : "bg-[var(--surface)]"
                    )}>
                      {isSend
                        ? <ArrowUpRight className="w-4 h-4 text-red-500" />
                        : isReceive
                          ? <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--ink)' }} />
                          : <Repeat className="w-4 h-4 text-[var(--ink-60)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)] truncate">
                        {tx.type === 'convert'
                          ? `${tx.currency} → ${tx.target_currency}`
                          : (tx.recipient_name ?? 'Transfert')}
                      </p>
                      <p className="text-xs text-[var(--ink-60)]">
                        {TX_LABEL[tx.type]} · {TX_STATUS[tx.status] ?? tx.status}
                      </p>
                    </div>
                    <p className={cn("text-sm font-semibold tabular-nums shrink-0",
                      isSend ? "text-red-500" : isReceive ? "" : "text-[var(--ink-60)]"
                    )}
                      style={isReceive ? { color: 'var(--ink)' } : {}}>
                      {isSend ? '−' : isReceive ? '+' : ''}{curr?.symbol}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
