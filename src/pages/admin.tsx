import { useState, useEffect } from 'react'
import { ShieldCheck, MessageSquare, ChevronRight, Loader2, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type AdminUser = {
  id: string
  full_name: string
  email: string
  user_code: string
  verified: boolean
  kyc_status: string
  is_admin: boolean
  created_at: string
}

type AdminTicket = {
  id: string
  user_id: string
  user_name: string
  subject: string
  status: string
  priority: string
  created_at: string
}

export function AdminPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<'users' | 'tickets'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (tab === 'users') {
        const { data } = await supabase.rpc('admin_list_users')
        setUsers(data ?? [])
      } else {
        const { data } = await supabase.rpc('admin_list_tickets')
        setTickets(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [tab])

  if (profile && !profile.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
          <p className="text-lg font-bold mb-2" style={{ color: '#1C1C1E' }}>Accès refusé</p>
          <p className="text-sm mb-6" style={{ color: '#8E8E93' }}>Vous n'avez pas les permissions administrateur.</p>
          <Link to="/dashboard" className="text-sm font-semibold" style={{ color: '#4F46E5' }}>Retour au tableau de bord</Link>
        </div>
      </div>
    )
  }

  if (selectedTicket) {
    return (
      <div className="min-h-screen w-full min-w-0 overflow-x-hidden px-4 py-6 max-w-2xl mx-auto">
        <button onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-2 mb-4 text-sm font-semibold cursor-pointer"
          style={{ color: '#8E8E93' }}>
          <ChevronRight className="w-4 h-4 rotate-180" />
          Retour
        </button>
        <h1 className="text-xl font-bold mb-1" style={{ color: '#1C1C1E' }}>{selectedTicket.subject}</h1>
        <p className="text-xs mb-6" style={{ color: '#8E8E93' }}>
          Par {selectedTicket.user_name} · {new Date(selectedTicket.created_at).toLocaleDateString('fr-FR')}
        </p>
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#F8F9FA' }}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Tapez votre réponse..."
            rows={4}
            className="w-full bg-transparent text-sm outline-none resize-none"
            style={{ color: '#1C1C1E' }}
          />
        </div>
        <button
          onClick={async () => {
            if (!replyText.trim()) return
            setReplying(true)
            await supabase.rpc('admin_reply_ticket', { p_ticket_id: selectedTicket.id, p_message: replyText.trim() })
            setReplyText('')
            setReplying(false)
            setSelectedTicket(null)
          }}
          disabled={!replyText.trim() || replying}
          className="w-full h-12 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: '#4F46E5', color: 'white' }}
        >
          {replying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Envoyer</>}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
          <ShieldCheck className="w-5 h-5" style={{ color: '#22C55E' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1C1C1E' }}>Administration</h1>
          <p className="text-xs" style={{ color: '#8E8E93' }}>Centre de contrôle FamillyBill HT</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('users')}
          className="flex-1 h-10 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: tab === 'users' ? '#4F46E5' : '#F8F9FA', color: tab === 'users' ? 'white' : '#8E8E93' }}>
          Utilisateurs
        </button>
        <button onClick={() => setTab('tickets')}
          className="flex-1 h-10 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: tab === 'tickets' ? '#4F46E5' : '#F8F9FA', color: tab === 'tickets' ? 'white' : '#8E8E93' }}>
          Tickets
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8E8E93' }} />
        </div>
      ) : tab === 'users' ? (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#F8F9FA' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: '#4F46E518', color: '#4F46E5' }}>
                {u.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>{u.full_name}</p>
                <p className="text-xs truncate" style={{ color: '#8E8E93' }}>{u.email}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: u.verified ? '#22C55E18' : '#F59E0B18', color: u.verified ? '#22C55E' : '#F59E0B' }}>
                  {u.verified ? 'Vérifié' : 'Non vérifié'}
                </span>
                <span className="text-[10px]" style={{ color: '#C7C7CC' }}>{u.user_code}</span>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-sm text-center py-8" style={{ color: '#8E8E93' }}>Aucun utilisateur</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => (
            <button key={t.id} onClick={() => setSelectedTicket(t)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left cursor-pointer"
              style={{ background: '#F8F9FA' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#4F46E518' }}>
                <MessageSquare className="w-5 h-5" style={{ color: '#4F46E5' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>{t.subject}</p>
                <p className="text-xs" style={{ color: '#8E8E93' }}>{t.user_name} · {new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: t.status === 'open' ? '#F59E0B18' : '#22C55E18', color: t.status === 'open' ? '#F59E0B' : '#22C55E' }}>
                {t.status === 'open' ? 'Ouvert' : 'Répondu'}
              </span>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-sm text-center py-8" style={{ color: '#8E8E93' }}>Aucun ticket</p>}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: '#8E8E93' }}>
          <ChevronRight className="w-4 h-4 rotate-180" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
