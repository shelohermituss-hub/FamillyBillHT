import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Send, Plus, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type Ticket = {
  id: string
  subject: string
  status: string
  created_at: string
  updated_at: string
}

type TicketMessage = {
  id: string
  message: string
  is_from_admin: boolean
  created_at: string
}

export function SupportPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [screen, setScreen] = useState<'list' | 'create' | 'view'>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadTickets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setTickets(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { loadTickets() }, [loadTickets])

  async function loadMessages(ticketId: string) {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  async function createTicket() {
    if (!user || !newSubject.trim() || !newMessage.trim()) return
    setSubmitting(true)
    const { data: ticket } = await supabase
      .from('support_tickets')
      .insert({ user_id: user.id, subject: newSubject.trim() })
      .select()
      .single()
    if (ticket) {
      await supabase
        .from('support_messages')
        .insert({ ticket_id: ticket.id, user_id: user.id, message: newMessage.trim(), is_from_admin: false })
      setNewSubject('')
      setNewMessage('')
      setScreen('list')
      loadTickets()
    }
    setSubmitting(false)
  }

  async function sendReply() {
    if (!selectedTicket || !user || !replyText.trim()) return
    setSubmitting(true)
    await supabase
      .from('support_messages')
      .insert({ ticket_id: selectedTicket.id, user_id: user.id, message: replyText.trim(), is_from_admin: false })
    setReplyText('')
    loadMessages(selectedTicket.id)
    setSubmitting(false)
  }

  function openTicket(t: Ticket) {
    setSelectedTicket(t)
    loadMessages(t.id)
    setScreen('view')
  }

  if (screen === 'create') {
    return (
      <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-white pb-28">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button onClick={() => setScreen('list')} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#F2F2F7' }}>
            <ChevronLeft className="w-5 h-5" style={{ color: '#1C1C1E' }} />
          </button>
          <p className="flex-1 text-center text-[15px] font-bold" style={{ color: '#1C1C1E' }}>Nouveau ticket</p>
          <div className="w-9 h-9" />
        </div>
        <div className="px-6 pt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#1C1C1E' }}>Sujet</label>
            <input
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              placeholder="Décrivez brièvement le problème"
              className="w-full h-12 px-4 rounded-xl text-sm outline-none"
              style={{ background: '#F8F9FA', color: '#1C1C1E' }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#1C1C1E' }}>Message</label>
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              rows={6}
              className="w-full p-4 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#F8F9FA', color: '#1C1C1E' }}
            />
          </div>
          <button
            onClick={createTicket}
            disabled={!newSubject.trim() || !newMessage.trim() || submitting}
            className="w-full h-12 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50"
            style={{ background: '#4F46E5', color: 'white' }}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Envoyer le ticket'}
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'view' && selectedTicket) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#F2F2F7' }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-white border-b border-gray-100">
          <button onClick={() => setScreen('list')} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#F2F2F7' }}>
            <ChevronLeft className="w-5 h-5" style={{ color: '#1C1C1E' }} />
          </button>
          <div className="flex-1">
            <p className="text-[15px] font-bold truncate" style={{ color: '#1C1C1E' }}>{selectedTicket.subject}</p>
            <p className="text-xs" style={{ color: '#8E8E93' }}>
              {selectedTicket.status === 'open' ? 'En attente' : selectedTicket.status === 'replied' ? 'Répondu' : 'Résolu'}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.is_from_admin ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[82%] px-4 py-3 rounded-2xl" style={{
                background: msg.is_from_admin ? 'white' : '#4F46E5',
                color: msg.is_from_admin ? '#1C1C1E' : 'white',
                borderRadius: msg.is_from_admin ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
              }}>
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <p className="text-[11px] mt-1 text-right" style={{ color: msg.is_from_admin ? '#C7C7CC' : 'rgba(255,255,255,0.7)' }}>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm" style={{ color: '#8E8E93' }}>Aucun message</p>
            </div>
          )}
        </div>
        <div className="px-3 py-3 flex items-center gap-2 bg-white border-t border-gray-100" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
          <div className="flex-1 flex items-center px-4 rounded-full" style={{ background: '#F2F2F7', minHeight: 40 }}>
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendReply() }}
              placeholder="Répondre..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#1C1C1E' }}
            />
          </div>
          {replyText.trim() && (
            <button onClick={sendReply} className="cursor-pointer ml-1">
              <Send className="w-5 h-5" style={{ color: '#4F46E5' }} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-white pb-28">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#F2F2F7' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#1C1C1E' }} />
        </button>
        <p className="flex-1 text-center text-[15px] font-bold" style={{ color: '#1C1C1E' }}>Support</p>
        <button onClick={() => setScreen('create')} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#4F46E5' }}>
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-6 pt-4">
        <div className="rounded-2xl p-4 mb-6" style={{ background: '#F8F9FA' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#1C1C1E' }}>Centre de support</p>
          <p className="text-xs leading-relaxed" style={{ color: '#8E8E93' }}>
            Soumettez un ticket et notre équipe vous répondra dans les plus brefs délais.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8E8E93' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="w-12 h-12 mb-3" style={{ color: '#D1D5DB' }} />
            <p className="text-sm" style={{ color: '#8E8E93' }}>Aucun ticket. Créez-en un nouveau.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => (
              <button key={t.id} onClick={() => openTicket(t)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left cursor-pointer"
                style={{ background: '#F8F9FA' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#4F46E518' }}>
                  {t.status === 'open' ? (
                    <MessageCircle className="w-5 h-5" style={{ color: '#4F46E5' }} />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#22C55E' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>{t.subject}</p>
                  <p className="text-xs" style={{ color: '#8E8E93' }}>
                    {new Date(t.created_at).toLocaleDateString('fr-FR')} · {t.status === 'open' ? 'En attente' : t.status === 'replied' ? 'Répondu' : 'Résolu'}
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 rotate-180 shrink-0" style={{ color: '#C7C7CC' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
