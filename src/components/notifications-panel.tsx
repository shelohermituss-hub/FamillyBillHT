import { useEffect, useRef } from 'react'
import { ArrowDownLeft, TrendingUp, Info, AlertTriangle, X, CheckCheck, ArrowUpRight } from 'lucide-react'
import { useNotifications, type AppNotification } from '@/lib/notifications-context'
import { cn } from '@/lib/utils'

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

const TYPE_CONFIG: Record<AppNotification['type'], {
  icon: typeof Info
  bg: string
  color: string
}> = {
  receive: { icon: ArrowDownLeft,  bg: 'bg-[var(--lime-light)]', color: 'text-[var(--ink)]' },
  send:    { icon: ArrowUpRight,   bg: 'bg-red-50',              color: 'text-red-500'       },
  info:    { icon: Info,           bg: 'bg-blue-50',             color: 'text-blue-500'      },
  alert:   { icon: AlertTriangle,  bg: 'bg-amber-50',            color: 'text-amber-500'     },
  rate:    { icon: TrendingUp,     bg: 'bg-[var(--lime-light)]', color: 'text-[var(--ink)]'  },
}

export function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
      style={{ animation: 'scaleIn 0.18s ease forwards', transformOrigin: 'top right' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-[var(--ink)]">Notifications</h3>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--ink)]"
              style={{ background: 'var(--lime)' }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--ink-60)] hover:text-[var(--ink)] hover:bg-[var(--surface)] tr cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout lire
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] tr cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-[var(--ink-60)]" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border)]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--ink-60)]">
            Aucune notification
          </div>
        ) : (
          notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type]
            const Icon = cfg.icon
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--surface)] tr",
                  !n.read && "bg-[var(--lime-light)]/30"
                )}
              >
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                  <Icon className={cn("w-4 h-4", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--ink)] truncate">{n.title}</p>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--lime)' }} />
                    )}
                  </div>
                  <p className="text-xs text-[var(--ink-60)] mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-[var(--ink-30)] mt-1">{timeAgo(n.time)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
