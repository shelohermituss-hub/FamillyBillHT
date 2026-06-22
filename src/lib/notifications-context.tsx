import { createContext, useContext, useState, type ReactNode } from 'react'

export type AppNotification = {
  id: string
  type: 'receive' | 'send' | 'info' | 'alert' | 'rate' | 'payment_request'
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

const INITIAL: AppNotification[] = [
  {
    id: 'welcome',
    type: 'info',
    title: 'Bienvenue sur FamillyBill HT',
    body: 'Votre compte est prêt. Envoyez et recevez de l\'argent en quelques secondes.',
    time: new Date(),
    read: false,
  },
]

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL)

  const unreadCount = notifications.filter(n => !n.read).length

  function markAllRead() {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function addNotification(n: Omit<AppNotification, 'id' | 'read' | 'time'>) {
    setNotifications(ns => [{
      ...n,
      id: Date.now().toString(),
      read: false,
      time: new Date(),
    }, ...ns])
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
