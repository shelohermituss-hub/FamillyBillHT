import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Camera, Mic, Pause, Send } from 'lucide-react'

// ── Accent ────────────────────────────────────────────────────────────────────
const ACCENT = '#4F46E5'

// ── SVG illustrations ─────────────────────────────────────────────────────────
function SupportIllustration() {
  return (
    <svg viewBox="0 0 220 180" className="w-52 h-44 mx-auto">
      {/* Shadow */}
      <ellipse cx="88" cy="158" rx="55" ry="8" fill="#E8F4FD" opacity="0.8"/>
      {/* Chat bubble body */}
      <rect x="18" y="28" width="140" height="96" rx="22" fill="#29B6F6"/>
      <rect x="22" y="32" width="132" height="88" rx="18" fill="#4FC3F7"/>
      {/* Tail */}
      <polygon points="42,122 68,122 52,146" fill="#29B6F6"/>
      {/* Inner highlight */}
      <rect x="28" y="36" width="126" height="40" rx="14" fill="white" opacity="0.15"/>
      {/* Three dots */}
      <circle cx="68" cy="76" r="9" fill="white"/>
      <circle cx="88" cy="76" r="9" fill="white"/>
      <circle cx="108" cy="76" r="9" fill="white"/>
      {/* Bell circle background */}
      <circle cx="145" cy="48" r="34" fill="#FFF8E1"/>
      <circle cx="145" cy="48" r="27" fill="#FFD740"/>
      <circle cx="145" cy="48" r="22" fill="#FFC107"/>
      {/* Bell shape */}
      <path d="M136,46 Q136,36 145,36 Q154,36 154,46 L156,56 H134 Z" fill="#E65100"/>
      <rect x="140" y="56" width="10" height="5" rx="1" fill="#BF360C"/>
      <ellipse cx="145" cy="62" rx="5" ry="3" fill="#BF360C"/>
      {/* Bell clapper */}
      <circle cx="145" cy="64" r="3" fill="#FF6D00"/>
      {/* Shine on bell */}
      <ellipse cx="141" cy="42" rx="3" ry="4" fill="white" opacity="0.4" transform="rotate(-20,141,42)"/>
    </svg>
  )
}

// ── Chat type ─────────────────────────────────────────────────────────────────
type Message = {
  id: string
  from: 'support' | 'user'
  type: 'text' | 'audio'
  text?: string
  duration?: string
  time: string
}

const INIT_MESSAGES: Message[] = [
  { id:'1', from:'support', type:'text', text:'Good morning, how can I help??', time:'08.45 PM' },
  { id:'2', from:'user',    type:'audio', duration:'0:19', time:'4:38 PM' },
  { id:'3', from:'support', type:'text',
    text:'To reset your password, go to our website and click on "Forgot Password" at the login screen. Then, enter your account number and social security number (or other required information) to verify your identity. You\'ll be prompted to create a new password and confirm it.',
    time:'08.45 PM' },
]

// ── Waveform SVG ──────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
export function SupportPage() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState<'hub'|'chat'>('hub')
  const [messages, setMessages] = useState<Message[]>(INIT_MESSAGES)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  function sendMessage() {
    if (!input.trim()) return
    const msg: Message = { id: Date.now().toString(), from:'user', type:'text', text:input.trim(),
      time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) }
    setMessages(p=>[...p, msg])
    setInput('')
    // Simulate support response
    setTimeout(()=>{
      setMessages(p=>[...p, {
        id: Date.now().toString(), from:'support', type:'text',
        text:'Merci pour votre message. Un agent va vous répondre dans les plus brefs délais.',
        time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
      }])
    }, 1200)
  }

  // ── Chat screen ────────────────────────────────────────────────────────────
  if (screen==='chat') return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{background:'#F2F2F7'}}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-white border-b border-gray-100">
        <button onClick={()=>setScreen('hub')} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{background:'#F2F2F7'}}>
          <ChevronLeft className="w-5 h-5" style={{color:'#1C1C1E'}}/>
        </button>
        <p className="flex-1 text-center text-[15px] font-bold" style={{color:'#1C1C1E'}}>Support Chat</p>
        <div className="w-9 h-9"/>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg=>{
          const isUser = msg.from==='user'
          return (
            <div key={msg.id} className={`flex ${isUser?'justify-end':'justify-start'}`}>
              <div className="max-w-[82%]">
                {msg.type==='audio' ? (
                  <div className="px-3 py-2.5 rounded-2xl" style={{background:'white',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                    <div className="flex items-center gap-2 mb-1">
                      <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{background:'#F2F2F7'}}>
                        <Pause className="w-3.5 h-3.5" style={{color:'#8E8E93'}}/>
                      </button>
                      <Waveform/>
                    </div>
                    <div className="flex justify-between px-1">
                      <span className="text-[11px]" style={{color:'#8E8E93'}}>{msg.duration}</span>
                      <span className="text-[11px]" style={{color:'#8E8E93'}}>{msg.time} ✓</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 rounded-2xl" style={{
                    background: isUser ? ACCENT : 'white',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    <p className="text-sm leading-relaxed" style={{color:isUser?'white':'#1C1C1E'}}>{msg.text}</p>
                    <p className={`text-[11px] mt-1 text-right`} style={{color:isUser?'rgba(255,255,255,0.7)':'#C7C7CC'}}>
                      {msg.time} {isUser?'✓':''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input bar */}
      <div className="px-3 py-3 flex items-center gap-2 bg-white border-t border-gray-100"
        style={{paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 12px)'}}>
        <button className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer">
          <Plus className="w-5 h-5" style={{color:'#8E8E93'}}/>
        </button>
        <div className="flex-1 flex items-center px-4 rounded-full" style={{background:'#F2F2F7',minHeight:40}}>
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') sendMessage() }}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#C7C7CC]"
            style={{color:'#1C1C1E'}}
          />
          {input.trim() && (
            <button onClick={sendMessage} className="cursor-pointer ml-1">
              <Send className="w-4 h-4" style={{color:ACCENT}}/>
            </button>
          )}
        </div>
        {!input.trim() && (
          <>
            <button className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer">
              <Camera className="w-5 h-5" style={{color:'#8E8E93'}}/>
            </button>
            <button className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer">
              <Mic className="w-5 h-5" style={{color:'#8E8E93'}}/>
            </button>
          </>
        )}
      </div>
    </div>
  )

  // ── Hub screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={()=>navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{background:'#F2F2F7'}}>
          <ChevronLeft className="w-5 h-5" style={{color:'#1C1C1E'}}/>
        </button>
        <p className="flex-1 text-center text-[15px] font-bold" style={{color:'#1C1C1E'}}>Support</p>
        <div className="w-9 h-9"/>
      </div>

      {/* Illustration */}
      <div className="flex justify-center mt-10 mb-8">
        <SupportIllustration/>
      </div>

      {/* Text */}
      <div className="px-8 text-center mb-10">
        <h1 className="text-2xl font-bold mb-3" style={{color:'#1C1C1E'}}>FamillyBill Support</h1>
        <p className="text-sm leading-relaxed" style={{color:'#8E8E93'}}>
          Thank you for giving us the opportunity to assist you. If you have any further questions or concerns, please don't hesitate to reach out.
        </p>
      </div>

      {/* Buttons */}
      <div className="px-6 space-y-3">
        <button className="w-full h-13 rounded-2xl text-sm font-semibold cursor-pointer tr hover:bg-gray-100"
          style={{background:'#F2F2F7',color:'#1C1C1E',height:52}}>
          View FAQ
        </button>
        <button onClick={()=>setScreen('chat')}
          className="w-full h-13 rounded-2xl text-sm font-bold cursor-pointer tr"
          style={{background:ACCENT,color:'white',height:52}}>
          Start chat
        </button>
      </div>
    </div>
  )
}
