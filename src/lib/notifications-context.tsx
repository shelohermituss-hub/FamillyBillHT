import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export type AppNotification = {
  id: string
  type: 'receive' | 'send' | 'info' | 'alert' | 'rate' | 'payment_request' | 'payment_received'
  title: string
  body: string
  amount?: number
  from?: string
  avatarInitials?: string
  time: Date
  read: boolean
}

type NotificationsCtx = {
  notifications: AppNotification[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'time'>) => void
}

const NotificationsContext = createContext<NotificationsCtx>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markRead: () => {},
  addNotification: () => {},
})

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const loadNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data.map(n => ({
        id: n.id,
        type: n.type as AppNotification['type'],
        title: n.title ?? '',
        body: n.body ?? '',
        time: new Date(n.created_at),
        read: n.read ?? false,
      })))
    }
  }, [user])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => loadNotifications()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => loadNotifications()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, loadNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = useCallback(async () => {
    if (!user) return
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }, [user])

  const markRead = useCallback(async (id: string) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
  }, [])

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'read' | 'time'>) => {
    setNotifications(ns => [{
      ...n,
      id: Date.now().toString(),
      read: false,
      time: new Date(),
    }, ...ns])
  }, [])

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
