import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { type Notification, type InsertNotification } from '@/lib/api'

export type AppNotification = Notification & {
  time: Date
  avatarInitials?: string
}

type NotificationsCtx = {
  notifications: AppNotification[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void
  addNotification: (n: Omit<InsertNotification, 'user_id'> & { user_id: string }) => void
}

const NotificationsContext = createContext<NotificationsCtx>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markRead: () => {},
  addNotification: () => {},
})

function toApp(n: Notification): AppNotification {
  return { ...n, time: new Date(n.created_at) }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load notifications when userId is set
  const loadNotifications = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setNotifications((data as Notification[]).map(toApp))
  }, [])

  useEffect(() => {
    if (!userId) { setNotifications([]); return }
    loadNotifications(userId)
  }, [userId, loadNotifications])

  // Real-time subscription
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notif-ctx:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [toApp(payload.new as Notification), ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === (payload.new as Notification).id ? toApp(payload.new as Notification) : n)
          )
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  function markAllRead() {
    if (!userId) return
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .then(() => {})
  }

  function markRead(id: string) {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {})
  }

  function addNotification(n: InsertNotification & { user_id: string }) {
    supabase
      .from('notifications')
      .insert({ ...n, read: false })
      .select()
      .single()
      .then(({ data }) => {
        if (data) setNotifications(prev => [toApp(data as Notification), ...prev])
      })
  }

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
