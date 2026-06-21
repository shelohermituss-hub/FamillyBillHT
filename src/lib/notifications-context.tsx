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
    id: '1',
    type: 'receive',
    title: 'You Received A Payment Of $300.00 From James',
    body: 'Paiement reçu de James via FamillyBill HT.',
    amount: 300,
    from: 'James',
    time: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
  },
  {
    id: '2',
    type: 'payment_request',
    title: 'Olivia Requested A Payment Of $200.00',
    body: 'Olivia vous demande un paiement de $200.00.',
    amount: 200,
    from: 'Olivia',
    avatarInitials: 'OL',
    time: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60 * 15),
    read: false,
  },
  {
    id: '3',
    type: 'receive',
    title: 'You Received A Payment Of $300.00 From Thomas',
    body: 'Paiement reçu de Thomas via FamillyBill HT.',
    amount: 300,
    from: 'Thomas',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 75),
    read: true,
  },
  {
    id: '4',
    type: 'alert',
    title: 'You Must Be Update Your Bank Information',
    body: 'Vos informations bancaires doivent être mises à jour.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48 + 1000 * 60 * 75),
    read: true,
  },
  {
    id: '5',
    type: 'info',
    title: 'Explore FamillyBill Updates',
    body: 'Découvrez les nouvelles fonctionnalités de FamillyBill HT.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48 + 1000 * 60 * 20),
    read: true,
  },
  {
    id: '6',
    type: 'info',
    title: 'New Gift Card Available',
    body: 'Une nouvelle carte cadeau est disponible pour vous.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48 + 1000 * 60 * 20),
    read: true,
  },
  {
    id: '7',
    type: 'receive',
    title: 'You Received A Payment Of $300.00 From James',
    body: 'Paiement reçu de James via FamillyBill HT.',
    amount: 300,
    from: 'James',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48 + 1000 * 60 * 5),
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
