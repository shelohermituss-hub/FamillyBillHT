import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Camera, Mic, Pause, Send, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const ACCENT = '#4F46E5'

function SupportIllustration() {
  return (
    <svg viewBox="0 0 220 180" className="w-52 h-44 mx-auto">
      <ellipse cx="88" cy="158" rx="55" ry="8" fill="#E8F4FD" opacity="0.8"/>
      <rect x="18" y="28" width="140" height="96" rx="22" fill="#29B6F6"/>
      <rect x="22" y="32" width="132" height="88" rx="18" fill="#4FC3F7"/>
      <polygon points="42,122 68,122 52,146" fill="#29B6F6"/>
      <rect x="28" y="36" width="126" height="40" rx="14" fill="white" opacity="0.15"/>
      <circle cx="68" cy="76" r="9" fill="white"/>
      <circle cx="88" cy="76" r="9" fill="white"/>
      <circle cx="108" cy="76" r="9" fill="white"/>
      <circle cx="145" cy="48" r="34" fill="#FFF8E1"/>
      <circle cx="145" cy="48" r="27" fill="#FFD740"/>
      <circle cx="145" cy="48" r="22" fill="#FFC107"/>
      <path d="M136,46 Q136,36 145,36 Q154,36 154,46 L156,56 H134 Z" fill="#E65100"/>
      <rect x="140" y="56" width="10" height="5" rx="1" fill="#BF360C"/>
      <ellipse cx="145" cy="62" rx="5" ry="3" fill="#BF360C"/>
      <circle cx="145" cy="64" r="3" fill="#FF6D00"/>
      <ellipse cx="141" cy="42" rx="3" ry="4" fill="white" opacity="0.4" transform="rotate(-20,141,42)"/>
    </svg>
  )
}

type Message = {
  id: string
  from_role: 'support' | 'user'
  text: string
  created_at: string
}

function Waveform() {
  const bars = [3,8,14,20,12,18,22,16,10,24,18,14,8,20,16,12,6,18,22,14,10,16,8,20,12,18,6,14,20,16,10,8]
  return (
    <svg viewBox={`0 0 ${bars.length*5} 28`} className="flex-1 h-7">
      {bars.map((h,i)=>(
        <rect key={i} x={i*5} y={(28-h)/2} width="3" height={h} rx="1.5"
          fill={i<14 ? ACCENT : '#D1D5DB'}/>
      ))}
    </svg>
  )
}

export function SupportPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [screen, setScreen] = useState<'hub'|'chat'>('hub')
  const [messages, setMessages] = useState<Message[]>([])
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function openChat() {
    if (!user) return
    setLoadingChat(true)
    setScreen('chat')

    // Get or create the open ticket
    const { data: tid, error } = await supabase.rpc('get_or_create_support_ticket')
    if (error || !tid) {
      setLoadingChat(false)
      return
    }
    setTicketId(tid as string)

    // Load existing messages
    const { data: msgs } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', tid)
      .order('created_at', { ascending: true })

    if (msgs) setMessages(msgs as Message[])
    setLoadingChat(false)

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`support_${tid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${tid}` },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function sendMessage() {
    if (!input.trim() || !ticketId || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      from_role: 'user',
      text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { error } = await supabase.from('support_messages').insert({
      ticket_id: ticketId,
      from_role: 'user',
      text,
    })
    setSending(false)

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      return
    }

    // Automated support reply (backend agent would override this in production)
    setTimeout(async () => {
      const reply = 'Merci pour votre message. Un agent va vous répondre dans les plus brefs délais.'
      await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        from_role: 'support',
        text: reply,
      })
    }, 1500)
  }

  if (screen === 'chat') return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#F2F2F7' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-white border-b border-gray-100">
        <button onClick={() => setScreen('hub')} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#F2F2F7' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#1C1C1E' }}/>
        </button>
        <p className="flex-1 text-center text-[15px] font-bold" style={{ color: '#1C1C1E' }}>Support Chat</p>
        <div className="w-9 h-9"/>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loadingChat ? (
          <div className="flex justify-center pt-10">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }}/>
          </div>
        ) : messages.map(msg => {
          const isUser = msg.from_role === 'user'
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[82%]">
                <div className="px-4 py-3 rounded-2xl" style={{
                  background: isUser ? ACCENT : 'white',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  opacity: msg.id.startsWith('opt-') ? 0.7 : 1,
                }}>
                  <p className="text-sm leading-relaxed" style={{ color: isUser ? 'white' : '#1C1C1E' }}>{msg.text}</p>
                  <p className="text-[11px] mt-1 text-right" style={{ color: isUser ? 'rgba(255,255,255,0.7)' : '#C7C7CC' }}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {isUser ? ' ✓' : ''}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Demo audio message (kept for UI completeness) */}
      {messages.length > 0 && false && (
        <div className="px-4 pb-2">
          <div className="px-3 py-2.5 rounded-2xl max-w-[70%]" style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-1">
              <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F2F2F7' }}>
                <Pause className="w-3.5 h-3.5" style={{ color: '#8E8E93' }}/>
              </button>
              <Waveform/>
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 py-3 flex items-center gap-2 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <button className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer">
          <Plus className="w-5 h-5" style={{ color: '#8E8E93' }}/>
        </button>
        <div className="flex-1 flex items-center px-4 rounded-full" style={{ background: '#F2F2F7', minHeight: 40 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#C7C7CC]"
            style={{ color: '#1C1C1E' }}
          />
          {input.trim() && (
            <button onClick={sendMessage} disabled={sending} className="cursor-pointer ml-1 disabled:opacity-50">
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT }}/>
                : <Send className="w-4 h-4" style={{ color: ACCENT }}/>}
            </button>
          )}
        </div>
        {!input.trim() && (
          <>
            <button className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer">
              <Camera className="w-5 h-5" style={{ color: '#8E8E93' }}/>
            </button>
            <button className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer">
              <Mic className="w-5 h-5" style={{ color: '#8E8E93' }}/>
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#F2F2F7' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#1C1C1E' }}/>
        </button>
        <p className="flex-1 text-center text-[15px] font-bold" style={{ color: '#1C1C1E' }}>Support</p>
        <div className="w-9 h-9"/>
      </div>

      <div className="flex justify-center mt-10 mb-8">
        <SupportIllustration/>
      </div>

      <div className="px-8 text-center mb-10">
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#1C1C1E' }}>FamillyBill Support</h1>
        <p className="text-sm leading-relaxed" style={{ color: '#8E8E93' }}>
          Notre équipe est disponible pour vous aider. N'hésitez pas à nous contacter pour toute question.
        </p>
      </div>

      <div className="px-6 space-y-3">
        <button className="w-full h-13 rounded-2xl text-sm font-semibold cursor-pointer tr hover:bg-gray-100"
          style={{ background: '#F2F2F7', color: '#1C1C1E', height: 52 }}>
          Voir la FAQ
        </button>
        <button
          onClick={openChat}
          className="w-full h-13 rounded-2xl text-sm font-bold cursor-pointer tr"
          style={{ background: ACCENT, color: 'white', height: 52 }}>
          Démarrer le chat
        </button>
      </div>
    </div>
  )
}
