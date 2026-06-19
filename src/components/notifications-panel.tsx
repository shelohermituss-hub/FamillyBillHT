import { useEffect, useRef } from 'react'
import { ArrowDownLeft, TrendingUp, Info, AlertTriangle, X, CheckCheck, ArrowUpRight, Bell } from 'lucide-react'
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
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease' }}
      />

      {/* Panel — slides in from right */}
      <div
        ref={panelRef}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm flex flex-col"
        style={{
          background: 'var(--card-bg)',
          boxShadow: '-8px 0 40px rgba(14,15,12,0.18)',
          animation: 'slideInRight 0.25s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--lime-light)' }}>
              <Bell className="w-4 h-4" style={{ color: 'var(--ink)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--ink)] leading-tight">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-[10px] text-[var(--ink-60)]">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-60)] hover:text-[var(--ink)] hover:bg-[var(--surface)] tr cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout lire
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[var(--surface)] tr cursor-pointer"
            >
              <X className="w-4 h-4 text-[var(--ink-60)]" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                <Bell className="w-6 h-6 text-[var(--ink-60)]" />
              </div>
              <div>
                <p className="font-medium text-sm text-[var(--ink)]">Aucune notification</p>
                <p className="text-xs text-[var(--ink-60)] mt-1">Vos alertes apparaîtront ici.</p>
              </div>
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
                    "flex gap-3 px-5 py-4 cursor-pointer hover:bg-[var(--surface)] tr",
                    !n.read && "bg-[var(--lime-light)]/20"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                    <Icon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-[var(--ink)] truncate">{n.title}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--lime)' }} />
                      )}
                    </div>
                    <p className="text-xs text-[var(--ink-60)] leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-[var(--ink-30)] mt-1.5">{timeAgo(n.time)}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </div>
  )
}
