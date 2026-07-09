import { useEffect, useState } from 'react'
import { getAdminMetrics, getAdminTransactions, type AdminMetrics, type AdminTransaction } from '@/lib/admin-api'
import {
  AlertCircle, RefreshCw, TrendingUp, Users, ArrowLeftRight,
  CheckCircle, XCircle, FileText, Activity, UserPlus,
} from 'lucide-react'

// ── Badges ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:    { bg: '#FEF3C7', color: '#D97706', label: 'En attente' },
    processing: { bg: '#DBEAFE', color: '#2563EB', label: 'En cours'   },
    completed:  { bg: '#D1FAE5', color: '#059669', label: 'Complétée'  },
    failed:     { bg: '#FEE2E2', color: '#DC2626', label: 'Échouée'    },
    cancelled:  { bg: '#F3F4F6', color: '#6B7280', label: 'Annulée'    },
  }
  const s = map[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    send: 'Envoi', receive: 'Réception', convert: 'Conversion',
    deposit: 'Dépôt', withdraw: 'Retrait', bill_payment: 'Facture',
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#F3F4F8', color: '#6B7280' }}>
      {map[type] ?? type}
    </span>
  )
}

// ── Skeleton tiles ─────────────────────────────────────────────────────────────
function SkeletonTile({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl animate-pulse ${className ?? ''}`}
      style={{ background: '#E8EBF4', minHeight: 140 }}
    />
  )
}

// ── Bento tile primitives ──────────────────────────────────────────────────────
interface TileProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.FC<{ className?: string; style?: React.CSSProperties }>
  dark?: boolean
  accent?: boolean
  red?: boolean
  amber?: boolean
  className?: string
  style?: React.CSSProperties
}

function Tile({ label, value, sub, icon: Icon, dark, accent, red, amber, className, style }: TileProps) {
  const bg    = dark   ? '#0D1B4B'
              : accent ? '#1A56DB'
              : red    ? '#FEF2F2'
              : amber  ? '#FFFBEB'
              : '#ffffff'
  const textPrimary   = (dark || accent) ? '#ffffff'  : red ? '#DC2626' : amber ? '#D97706' : '#0D1B4B'
  const textSecondary = (dark || accent) ? 'rgba(255,255,255,0.45)' : '#94A3B8'
  const iconBg  = dark   ? 'rgba(255,255,255,0.10)'
                : accent ? 'rgba(255,255,255,0.15)'
                : red    ? '#FEE2E2'
                : amber  ? '#FEF3C7'
                : 'var(--surface)'
  const iconColor = (dark || accent) ? '#fff' : textPrimary
  const borderColor = (dark || accent || red || amber) ? 'transparent' : 'var(--border)'

  return (
    <div
      className={`rounded-3xl p-5 flex flex-col justify-between ${className ?? ''}`}
      style={{ background: bg, border: `1px solid ${borderColor}`, minHeight: 140, ...style }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest leading-snug" style={{ color: textSecondary }}>
          {label}
        </p>
        {Icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-black tabular-nums leading-none" style={{ color: textPrimary, letterSpacing: '-0.03em' }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1.5 font-medium" style={{ color: textSecondary }}>{sub}</p>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const [metrics, setMetrics]   = useState<AdminMetrics | null>(null)
  const [txs, setTxs]           = useState<AdminTransaction[]>([])
  const [loading, setLoading]   = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  async function loadData() {
    setLoading(true); setError(null)
    try { setMetrics(await getAdminMetrics()) }
    catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  async function loadTxs() {
    setTxLoading(true)
    try { setTxs((await getAdminTransactions(1, 10)).data) }
    catch { /* silent */ }
    finally { setTxLoading(false) }
  }

  useEffect(() => { loadData(); loadTxs() }, [])

  const m = metrics

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#0D1B4B' }}>Tableau de bord</h2>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>Vue d'ensemble en temps réel</p>
        </div>
        <button
          onClick={() => { loadData(); loadTxs() }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer tr hover:opacity-80"
          style={{ background: '#0D1B4B', color: 'white' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-5" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Erreur de chargement</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button onClick={loadData} className="text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer" style={{ background: '#DC2626', color: 'white' }}>
            Réessayer
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          BENTO GRID
          Mobile:  2 columns
          Desktop: 4 columns
      ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

        {loading ? (
          <>
            <SkeletonTile className="col-span-2 md:col-span-3" />
            <SkeletonTile className="col-span-2 md:col-span-1" />
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile className="col-span-2" />
            <SkeletonTile />
            <SkeletonTile />
          </>
        ) : (
          <>
            {/* ── Row 1 ── */}

            {/* HERO: Volume 30j — 3 cols wide on desktop */}
            <Tile
              className="col-span-2 md:col-span-3 animate-slide-up"
              style={{ animationDelay: '0ms' }}
              label="Volume des 30 derniers jours"
              value={m ? `${m.total_volume_30d.toLocaleString('fr-HT')} HTG` : '—'}
              sub={m ? `${m.new_users_30d} nouveaux utilisateurs ce mois` : undefined}
              icon={TrendingUp}
              dark
            />

            {/* Active today — 1 col */}
            <Tile
              className="col-span-2 md:col-span-1 animate-slide-up"
              style={{ animationDelay: '60ms' }}
              label="Utilisateurs actifs"
              value={m?.active_users_today ?? '—'}
              sub="aujourd'hui"
              icon={Activity}
              accent
            />

            {/* ── Row 2 — 4 tuiles 1x1 ── */}

            <Tile
              className="animate-slide-up"
              style={{ animationDelay: '120ms' }}
              label="Transactions"
              value={m?.transactions_today ?? '—'}
              sub="aujourd'hui"
              icon={ArrowLeftRight}
            />

            <Tile
              className="animate-slide-up"
              style={{ animationDelay: '150ms' }}
              label="Montant traité"
              value={m ? `${m.amount_today.toLocaleString('fr-HT')}` : '—'}
              sub="HTG aujourd'hui"
              icon={TrendingUp}
            />

            <Tile
              className="animate-slide-up"
              style={{ animationDelay: '180ms' }}
              label="Taux de succès"
              value={m ? `${m.success_rate}%` : '—'}
              sub="des transactions"
              icon={CheckCircle}
            />

            <Tile
              className="animate-slide-up"
              style={{ animationDelay: '210ms' }}
              label="Nouveaux inscrits"
              value={m?.new_users_30d ?? '—'}
              sub="ce mois-ci"
              icon={UserPlus}
            />

            {/* ── Row 3 ── */}

            {/* Users total — 2 cols wide */}
            <Tile
              className="col-span-2 animate-slide-up"
              style={{ animationDelay: '270ms' }}
              label="Utilisateurs enregistrés"
              value={m?.total_users ?? '—'}
              sub="comptes actifs sur la plateforme"
              icon={Users}
            />

            {/* Failures — 1 col, red tint */}
            <Tile
              className="animate-slide-up"
              style={{ animationDelay: '300ms' }}
              label="Échecs"
              value={m?.transactions_failed ?? '—'}
              sub="aujourd'hui"
              icon={XCircle}
              red
            />

            {/* Bills — 1 col, amber tint */}
            <Tile
              className="animate-slide-up"
              style={{ animationDelay: '330ms' }}
              label="Factures payées"
              value={m?.bill_payments_today ?? '—'}
              sub="aujourd'hui"
              icon={FileText}
              amber
            />
          </>
        )}

        {/* ── Recent transactions — full width ── */}
        <div
          className="col-span-2 md:col-span-4 rounded-3xl overflow-hidden"
          style={{ background: 'white', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold" style={{ color: '#0D1B4B' }}>Transactions récentes</h3>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--surface)', color: '#94A3B8' }}>
              10 dernières
            </span>
          </div>

          {txLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: '#F3F4F8' }} />
              ))}
            </div>
          ) : txs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowLeftRight className="w-10 h-10 mb-3" style={{ color: '#CBD5E1' }} />
              <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>Aucune transaction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Utilisateur', 'Type', 'Montant', 'Statut', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className="tr hover:bg-[var(--surface)]"
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: '#94A3B8' }}>{tx.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold" style={{ color: '#0D1B4B' }}>{tx.user_name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>{tx.user_email}</p>
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                      <td className="px-4 py-3 text-sm font-bold tabular-nums" style={{ color: '#0D1B4B' }}>
                        {tx.amount.toLocaleString('fr-HT')} {tx.currency}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>
                        {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
