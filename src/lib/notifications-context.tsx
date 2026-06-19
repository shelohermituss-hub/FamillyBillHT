import { createContext, useContext, useState, type ReactNode } from 'react'

export type AppNotification = {
  id: string
  type: 'receive' | 'send' | 'info' | 'alert' | 'rate'
  title: string
  body: string
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
    id: '1',
    type: 'receive',
    title: 'Virement reçu',
    body: 'Vous avez reçu $120.00 USD de Jean Pierre.',
    time: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
  },
  {
    id: '2',
    type: 'rate',
    title: 'Taux favorable',
    body: 'Le taux HTG/USD est au plus haut depuis 7 jours.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Compte EUR activé',
    body: 'Votre compte Euro est prêt à recevoir des virements SEPA.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
  {
    id: '4',
    type: 'alert',
    title: 'Nouvelle connexion détectée',
    body: 'Une connexion depuis un nouvel appareil a été effectuée.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
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
