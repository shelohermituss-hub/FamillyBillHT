import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const ACCENT = '#4F46E5'

function NotFoundIllustration() {
  return (
    <svg viewBox="0 0 240 180" className="w-60 h-48 mx-auto">
      {/* Shadow */}
      <ellipse cx="90" cy="168" rx="62" ry="9" fill="#EEF2FF" opacity="0.9"/>
      {/* Megaphone body - cone */}
      <path d="M28,80 L28,110 L80,130 L80,60 Z" fill="#1565C0"/>
      <path d="M28,80 L28,110 L80,130 L80,60 Z" fill="url(#megaBlue)"/>
      {/* Megaphone main bell */}
      <ellipse cx="82" cy="95" rx="8" ry="36" fill="#1976D2"/>
      <path d="M80,59 Q130,40 148,55 L148,135 Q130,150 80,131 Z" fill="#42A5F5"/>
      <path d="M82,63 Q126,46 144,60 L144,130 Q126,144 82,127 Z" fill="#64B5F6"/>
      {/* Handle */}
      <rect x="18" y="78" width="14" height="34" rx="7" fill="#37474F"/>
      <rect x="20" y="80" width="10" height="30" rx="5" fill="#455A64"/>
      {/* Sound rings */}
      <path d="M152,70 Q162,95 152,120" fill="none" stroke="#90CAF9" strokeWidth="4" strokeLinecap="round"/>
      <path d="M158,62 Q172,95 158,128" fill="none" stroke="#64B5F6" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Highlight on megaphone */}
      <path d="M88,64 Q120,50 140,62 L140,78 Q118,66 88,78 Z" fill="white" opacity="0.2"/>
      {/* defs */}
      <defs>
        <linearGradient id="megaBlue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0D47A1"/>
          <stop offset="100%" stopColor="#1565C0"/>
        </linearGradient>
      </defs>
      {/* Red X */}
      <circle cx="182" cy="95" r="34" fill="#FFEBEE"/>
      <circle cx="182" cy="95" r="28" fill="#FFCDD2"/>
      {/* X strokes */}
      <line x1="168" y1="81" x2="196" y2="109" stroke="#E53935" strokeWidth="9" strokeLinecap="round"/>
      <line x1="196" y1="81" x2="168" y2="109" stroke="#E53935" strokeWidth="9" strokeLinecap="round"/>
      {/* X highlight */}
      <line x1="168" y1="81" x2="196" y2="109" stroke="#EF5350" strokeWidth="4" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <button onClick={()=>navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{background:'#F2F2F7'}}>
          <ChevronLeft className="w-5 h-5" style={{color:'#1C1C1E'}}/>
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
        <NotFoundIllustration/>

        <h1 className="text-2xl font-bold text-center mt-4 mb-0" style={{color:'#1C1C1E'}}>Error 404</h1>
        <h2 className="text-2xl font-bold text-center mb-4" style={{color:'#1C1C1E'}}>Page not found</h2>
        <p className="text-sm text-center leading-relaxed mb-10" style={{color:'#8E8E93',maxWidth:280}}>
          We apologize for any inconvenience this may have caused and appreciate your understanding. Your security and data are our top priority, and we're committed to ensuring that your online banking experience is safe and secure.
        </p>

        <button onClick={()=>navigate('/dashboard')}
          className="w-full max-w-xs h-13 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          style={{background:ACCENT,color:'white',height:52}}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l-4 4 4 4M5 15h11a4 4 0 000-8h-1"/>
          </svg>
          Back to home
        </button>
      </div>
    </div>
  )
}
