import { useEffect, useState, useCallback } from 'react'
import {
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Wallet,
  TrendingUp,
  Shield,
  Info,
  CheckCheck,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
  type NotifType,
} from '@/lib/api'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `Il y a ${Math.floor(diff / 86400)}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

type TypeConfig = {
  icon: typeof Bell
  iconBg: string
  iconColor: string
}

const TYPE_CONFIG: Record<NotifType, TypeConfig> = {
  transfer_sent:     { icon: ArrowUpRight,  iconBg: '#FFF1F2', iconColor: '#F43F5E' },
  transfer_received: { icon: ArrowDownLeft, iconBg: '#F0FDF4', iconColor: '#22C55E' },
  transfer_failed:   { icon: ArrowUpRight,  iconBg: '#FFF1F2', iconColor: '#F43F5E' },
  bill_paid:         { icon: Receipt,       iconBg: '#EFF6FF', iconColor: '#2563EB' },
  deposit:           { icon: Wallet,        iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  withdrawal:        { icon: Wallet,        iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  rate_alert:        { icon: TrendingUp,    iconBg: '#f0fce8', iconColor: '#4a8a1e' },
  security:          { icon: Shield,        iconBg: '#FFFBEB', iconColor: '#D97706' },
  system:            { icon: Info,          iconBg: '#F9FAFB', iconColor: '#6B7280' },
  promotion:         { icon: Info,          iconBg: '#F9FAFB', iconColor: '#6B7280' },
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: '#F3F4F6' }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded-lg w-3/4" style={{ background: '#F3F4F6' }} />
        <div className="h-3 rounded-lg w-full" style={{ background: '#F3F4F6' }} />
        <div className="h-3 rounded-lg w-1/3" style={{ background: '#F3F4F6' }} />
      </div>
    </div>
  )
}

// ── Notification Item ─────────────────────────────────────────────────────────

function NotifItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system
  const Icon = cfg.icon

  function handleClick() {
    if (!n.read) onRead(n.id)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex gap-3 px-4 py-4 text-left cursor-pointer tr"
      style={{
        background: n.read ? 'transparent' : 'rgba(159,232,112,0.06)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: cfg.iconBg }}
      >
        <Icon className="w-4 h-4" style={{ color: cfg.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {n.title}
          </p>
          {!n.read && (
            <span
              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
              style={{ background: 'var(--lime)' }}
            />
          )}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-60)' }}>
          {n.body}
        </p>
        <p className="text-[10px] mt-1.5" style={{ color: 'var(--ink-30)' }}>
          {timeAgo(n.created_at)}
        </p>
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread'

export function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await getUserNotifications(user.id)
    if (err) {
      setError(err)
    } else {
      setNotifications(data ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  async function handleRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await markNotificationRead(id)
  }

  async function handleMarkAll() {
    if (!user) return
    setMarkingAll(true)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await markAllNotificationsRead(user.id)
    setMarkingAll(false)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const displayed = tab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>

      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-4 pt-5 pb-0"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-xl font-extrabold"
              style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
            >
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-60)' }}>
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold cursor-pointer tr"
              style={{ background: 'var(--lime)', color: '#0e0f0c' }}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout lire
            </button>
          )}
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 rounded-xl p-1 mb-0"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setTab('all')}
            className="flex-1 h-9 rounded-lg text-sm font-semibold cursor-pointer tr"
            style={
              tab === 'all'
                ? { background: 'var(--lime)', color: '#0e0f0c' }
                : { color: 'var(--ink-60)' }
            }
          >
            Toutes
          </button>
          <button
            onClick={() => setTab('unread')}
            className="flex-1 h-9 rounded-lg text-sm font-semibold cursor-pointer tr flex items-center justify-center gap-1.5"
            style={
              tab === 'unread'
                ? { background: 'var(--lime)', color: '#0e0f0c' }
                : { color: 'var(--ink-60)' }
            }
          >
            Non lues
            {unreadCount > 0 && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={
                  tab === 'unread'
                    ? { background: 'rgba(0,0,0,0.15)', color: '#0e0f0c' }
                    : { background: 'var(--lime)', color: '#0e0f0c' }
                }
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-2">
        {loading ? (
          <div
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <NotifSkeleton />
            <NotifSkeleton />
            <NotifSkeleton />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-7 h-7" />}
            title="Aucune notification"
            description={
              tab === 'unread'
                ? 'Vous avez lu toutes vos notifications.'
                : 'Vos alertes et mises à jour apparaîtront ici.'
            }
          />
        ) : (
          <div
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            {displayed.map(n => (
              <NotifItem key={n.id} n={n} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
