import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronLeft, X, Check, Loader2,
  Building2, Phone, QrCode, Share2, Copy,
  ArrowRight, Send, Repeat2, Users, MoreHorizontal,
  Download, Percent,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notifications-context'
import { supabase, type CurrencyAccount, type WiseUser } from '@/lib/supabase'
import { getCurrency, formatCurrency, getRate } from '@/lib/currencies'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
type Screen =
  | 'hub' | 'send-money' | 'send-confirm' | 'send-success'
  | 'bank-form' | 'bank-confirm' | 'bank-success' | 'bank-receipt'
  | 'contacts' | 'contact-form' | 'contact-confirm' | 'contact-success'
  | 'phone-send' | 'wallet-id' | 'between-wallets'

type Contact = { id: string; name: string; initials: string; phone: string; isFav: boolean }

// ── Constants ─────────────────────────────────────────────────────────────────
const ACCENT = '#4F46E5'

const CARD_STYLES = [
  { id:'purple', g:'linear-gradient(135deg,#1a0070,#3b12cc,#6d28d9)' },
  { id:'green',  g:'linear-gradient(135deg,#064e3b,#059669,#34d399)' },
  { id:'blue',   g:'linear-gradient(135deg,#1e3a8a,#2563eb,#60a5fa)' },
  { id:'orange', g:'linear-gradient(135deg,#7c2d12,#ea580c,#fb923c)' },
  { id:'rose',   g:'linear-gradient(135deg,#831843,#e11d48,#fb7185)'  },
]
const CUR_STYLE: Record<string,string> = { HTG:'purple', USD:'green', EUR:'blue', CAD:'orange', BRL:'rose' }
const walletPin = (id: string) => `fb-w-pin-${id}`
function maskId(id: string) { const h=id.replace(/-/g,'').slice(-8).toUpperCase(); return h.slice(0,4)+' '+h.slice(4) }
function genRef() {
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({length:10},()=>c[Math.floor(Math.random()*c.length)]).join('')
}
function getGradient(acc: CurrencyAccount): string {
  const id = localStorage.getItem(`fb-card-style-${acc.id}`) ?? CUR_STYLE[acc.currency] ?? 'purple'
  return CARD_STYLES.find(s=>s.id===id)?.g ?? CARD_STYLES[0].g
}

// ── SVG Illustrations ─────────────────────────────────────────────────────────
function WalletSuccessIllustration() {
  return (
    <svg viewBox="0 0 240 180" className="w-52 h-40 mx-auto">
      <circle cx="120" cy="88" r="70" fill="#EEF2FF" opacity="0.6"/>
      <circle cx="120" cy="88" r="52" stroke="#C7D2FE" strokeWidth="1.5" strokeDasharray="5 4" fill="none" opacity="0.5"/>
      <polygon points="24,36 30,22 36,36" fill="none" stroke="#C7D2FE" strokeWidth="2"/>
      <polygon points="196,30 202,18 208,30" fill="none" stroke="#C7D2FE" strokeWidth="2"/>
      <polygon points="190,65 194,57 198,65" fill="none" stroke="#E0E7FF" strokeWidth="1.5"/>
      <rect x="22" y="48" width="48" height="32" rx="4" fill="#C7D2FE" transform="rotate(-18,46,64)"/>
      <rect x="16" y="54" width="48" height="32" rx="4" fill="#DDE5FF" transform="rotate(-18,40,70)"/>
      <rect x="158" y="42" width="48" height="32" rx="4" fill="#C7D2FE" transform="rotate(15,182,58)"/>
      <rect x="164" y="50" width="48" height="32" rx="4" fill="#DDE5FF" transform="rotate(15,188,66)"/>
      <rect x="70" y="82" width="100" height="66" rx="12" fill="#1C1C2E"/>
      <rect x="80" y="93" width="24" height="14" rx="5" fill={ACCENT}/>
      <rect x="80" y="112" width="55" height="5" rx="2.5" fill="#2D2D45"/>
      <rect x="80" y="122" width="38" height="5" rx="2.5" fill="#2D2D45"/>
      <rect x="118" y="74" width="52" height="32" rx="8" fill="#252535"/>
      <circle cx="164" cy="118" r="26" fill={ACCENT}/>
      <polyline points="153,118 160,125 175,110" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ProcessingIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-44 h-32 mx-auto">
      <rect x="25" y="25" width="130" height="82" rx="8" fill="#1C1C2E" stroke="#374151" strokeWidth="1.5"/>
      <rect x="30" y="30" width="120" height="72" rx="6" fill="#111827"/>
      <rect x="35" y="88" width="65" height="8" rx="4" fill="#F59E0B"/>
      <rect x="35" y="88" width="110" height="8" rx="4" fill="#374151" opacity="0.4"/>
      <circle cx="72" cy="58" r="17" fill="none" stroke="#6B7280" strokeWidth="3"/>
      <circle cx="72" cy="58" r="8" fill="#374151"/>
      <circle cx="104" cy="50" r="11" fill="none" stroke="#6B7280" strokeWidth="2.5"/>
      <circle cx="104" cy="50" r="5" fill="#374151"/>
      <circle cx="155" cy="52" r="12" fill="#4ADE80"/>
      <rect x="147" y="64" width="16" height="20" rx="5" fill="#22C55E"/>
      <rect x="138" y="72" width="10" height="22" rx="4" fill="#16A34A" transform="rotate(-15,143,83)"/>
      <rect x="156" y="70" width="10" height="24" rx="4" fill="#16A34A" transform="rotate(20,161,82)"/>
      <rect x="160" y="42" width="26" height="18" rx="3" fill={ACCENT} transform="rotate(-20,173,51)"/>
      <polyline points="164,52 168,56 177,48" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" transform="rotate(-20,170.5,52)"/>
    </svg>
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function QRIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M14 14h2M14 18h2M18 14v2M18 18v2" strokeLinecap="round"/>
    </svg>
  )
}

function BackBtn({ onBack, light=false }: { onBack:()=>void; light?:boolean }) {
  return (
    <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
      style={{ background: light ? 'rgba(255,255,255,0.18)' : '#F2F2F7' }}>
      <ChevronLeft className="w-5 h-5" style={{ color: light ? 'white' : '#1C1C1E' }}/>
    </button>
  )
}

function Hdr({ title, onBack, right, light=false }: { title:string; onBack:()=>void; right?:React.ReactNode; light?:boolean }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-3">
      <BackBtn onBack={onBack} light={light}/>
      <p className="flex-1 text-center text-[15px] font-bold" style={{ color: light?'white':'#1C1C1E' }}>{title}</p>
      <div className="w-9 h-9 flex items-center justify-center">{right}</div>
    </div>
  )
}

function Row({ label, value, green, blue, pill }: { label:string; value:string; green?:boolean; blue?:boolean; pill?:boolean }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <span className="text-sm" style={{ color:'#8E8E93' }}>{label}</span>
      {pill
        ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background:'#DCFCE7', color:'#16A34A' }}>{value}</span>
        : <span className="text-sm font-semibold" style={{ color: green?'#16A34A':blue?'#3B82F6':'#1C1C1E' }}>{value}</span>
      }
    </div>
  )
}

function NumPad({ onDigit, onBack, dot=false }: { onDigit:(d:string)=>void; onBack:()=>void; dot?:boolean }) {
  const rows=[['1','',''],['2','ABC',''],['3','DEF',''],['4','GHI',''],['5','JKL',''],['6','MNO',''],['7','PQRS',''],['8','TUV',''],['9','WXYZ','']]
  return (
    <div className="grid grid-cols-3">
      {[0,1,2].map(col=>(
        <div key={col} className="flex flex-col">
          {[0,1,2].map(row=>{
            const item=rows[row*3+col]; if(!item) return null
            return (
              <button key={item[0]} onClick={()=>onDigit(item[0])}
                className="h-[60px] flex flex-col items-center justify-center cursor-pointer active:bg-gray-100 tr select-none">
                <span className="text-[22px] font-light" style={{color:'#1C1C1E'}}>{item[0]}</span>
                {item[1]&&<span className="text-[9px] tracking-widest mt-px" style={{color:'#8E8E93'}}>{item[1]}</span>}
              </button>
            )
          })}
        </div>
      ))}
      {/* Last row */}
      <button onClick={()=>dot&&onDigit('.')} className="h-[60px] flex items-center justify-center cursor-pointer active:bg-gray-100 tr select-none">
        {dot&&<span className="text-[26px] font-light" style={{color:'#1C1C1E'}}>.</span>}
      </button>
      <button onClick={()=>onDigit('0')} className="h-[60px] flex items-center justify-center cursor-pointer active:bg-gray-100 tr select-none">
        <span className="text-[22px] font-light" style={{color:'#1C1C1E'}}>0</span>
      </button>
      <button onClick={onBack} className="h-[60px] flex items-center justify-center cursor-pointer active:bg-gray-100 tr select-none">
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#1C1C1E" strokeWidth="1.6" strokeLinecap="round">
          <path d="M20 5H8.5a2 2 0 00-1.6.8L2 12l4.9 6.2a2 2 0 001.6.8H20a2 2 0 002-2V7a2 2 0 00-2-2z"/>
          <path d="M15 9l-4 4M11 9l4 4"/>
        </svg>
      </button>
    </div>
  )
}

function PinBoxes({ value }: { value: string }) {
  return (
    <div className="flex gap-4 justify-center py-2">
      {[0,1,2,3].map(i=>(
        <div key={i} className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl"
          style={{ borderColor: i<value.length ? '#22C55E':'#E5E7EB' }}>
          {i<value.length && <span style={{color:'#1C1C1E'}}>●</span>}
        </div>
      ))}
    </div>
  )
}

function ContactCircle({ c, size=44 }: { c:Contact; size?:number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width:size, height:size, background:ACCENT, fontSize:size*0.28 }}>
      {c.initials}
    </div>
  )
}

function WalletPill({ acc, onTap }: { acc:CurrencyAccount; onTap:()=>void }) {
  const curr = getCurrency(acc.currency)
  return (
    <button onClick={onTap} className="flex items-center gap-2 px-3.5 py-2.5 rounded-full cursor-pointer tr"
      style={{ background:'#F2F2F7', border:'1px solid #E5E7EB' }}>
      <span className="text-base leading-none">{curr?.flag}</span>
      <span className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{maskId(acc.id)}</span>
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
      </svg>
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TransferPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()

  const [screens, setScreens] = useState<Screen[]>(['hub'])
  const screen = screens[screens.length-1]
  const push = (s: Screen) => setScreens(p=>[...p, s])
  const back = () => { if (screens.length<=1) navigate(-1); else setScreens(p=>p.slice(0,-1)) }

  // Overlays
  const [walletPickerOpen, setWalletPickerOpen] = useState(false)
  const [pinSheetOpen, setPinSheetOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transferError, setTransferError] = useState('')

  // Data
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [fromWallet, setFromWallet] = useState<CurrencyAccount|null>(null)
  const [, setToWallet] = useState<CurrencyAccount|null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact|null>(null)
  const [amountStr, setAmountStr] = useState('0')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [txRef, setTxRef] = useState('')
  const [copied, setCopied] = useState(false)

  // Bank transfer
  const [bankName, setBankName] = useState('Citibank')
  const [recipientName, setRecipientName] = useState('')
  const [recipientAccount, setRecipientAccount] = useState('')
  const [purpose, setPurpose] = useState('')

  // Wallet ID
  const [walletIdInput, setWalletIdInput] = useState('')
  const [walletIdFound, setWalletIdFound] = useState<{id:string;name:string;code:string}|null>(null)
  const [walletIdSearching, setWalletIdSearching] = useState(false)
  const [walletIdError, setWalletIdError] = useState('')
  const walletIdTimer = useRef<ReturnType<typeof setTimeout>|undefined>(undefined)

  // Contacts
  const [cTab, setCTab] = useState<'recent'|'contact'|'favorites'>('recent')
  const [cSearch, setCSearch] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Between wallets (same user)
  const [betweenFrom, setBetweenFrom] = useState<CurrencyAccount|null>(null)
  const [betweenTo, setBetweenTo] = useState<CurrencyAccount|null>(null)
  const [betweenPickerFor, setBetweenPickerFor] = useState<'from'|'to'>('from')

  // Real users / contacts
  const [appUsers, setAppUsers] = useState<WiseUser[]>([])
  const [favUserIds, setFavUserIds] = useState<string[]>(()=>{
    try { return JSON.parse(localStorage.getItem('fb-fav-contacts')?? '[]') } catch { return [] }
  })
  const [recipientWalletAcct, setRecipientWalletAcct] = useState<CurrencyAccount|null>(null)
  const [recipientMainWallet, setRecipientMainWallet] = useState<CurrencyAccount|null>(null)

  useEffect(()=>{
    if (!user) return
    supabase.from('currency_accounts').select('*').eq('user_id', user.id)
      .then(({data})=>{ if (data?.length) { setAccounts(data); setFromWallet(data.find(a=>a.is_main)??data[0]) }})
    supabase.from('wise_users').select('*').neq('id', user.id)
      .then(({data})=>{ if (data) setAppUsers(data) })
  },[user])

  // Re-check recipient wallet availability whenever the sender's wallet changes
  useEffect(()=>{
    if (!walletIdFound) return
    setRecipientWalletAcct(null); setRecipientMainWallet(null)
    const currency = fromWallet?.currency ?? 'USD'
    supabase.from('currency_accounts').select('*').eq('user_id', walletIdFound.id)
      .then(({data:accts})=>{
        if (!accts||accts.length===0) return
        const match = accts.find(a=>a.currency===currency)
        if (match) { setRecipientWalletAcct(match) }
        else {
          const main = accts.find(a=>a.is_main) ?? accts.find(a=>a.currency==='USD') ?? accts[0]
          setRecipientMainWallet(main ?? null)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[walletIdFound?.id, fromWallet?.id])

  const toContact = (u: WiseUser): Contact => ({
    id: u.id,
    name: u.full_name,
    initials: u.full_name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase(),
    phone: u.user_code ?? u.email,
    isFav: favUserIds.includes(u.id),
  })
  const allContacts = appUsers.map(toContact)
  const recentContacts = allContacts.slice(0, 6)

  function toggleFav(id: string) {
    setFavUserIds(prev => {
      const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
      localStorage.setItem('fb-fav-contacts', JSON.stringify(next))
      return next
    })
  }

  const sendAmount = parseFloat(amountStr)||0
  const minFee = fromWallet ? 1.2 * getRate('USD', fromWallet.currency) : 1.2
  const fee = sendAmount>0 ? Math.max(minFee, sendAmount*0.005) : 0
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})
  const timeLabel = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})

  function amtDigit(d:string){ setAmountStr(p=>{ if(d==='.'){ return p.includes('.')?p:p+'.' }; if(p==='0') return d; if(p.includes('.')&&p.split('.')[1].length>=2) return p; return p+d }) }
  function amtBack(){ setAmountStr(p=>p.length<=1?'0':p.slice(0,-1)) }

  function openPin(){ setPin(''); setPinError(''); setPinSheetOpen(true) }

  function pinDigit(d:string){
    setPinError('')
    if (pin.length>=4) return
    const next = pin+d
    setPin(next)
    if (next.length===4) setTimeout(()=>checkPin(next),120)
  }
  function pinBack(){ setPin(p=>p.slice(0,-1)) }

  function checkPin(p:string){
    if (!fromWallet) return
    const stored = localStorage.getItem(walletPin(fromWallet.id))
    if (!stored){ localStorage.setItem(walletPin(fromWallet.id), p); proceed() }
    else if (p===stored){ proceed() }
    else { setPinError('PIN incorrect. Réessayez.'); setPin('') }
  }

  function proceed(){
    setPinSheetOpen(false)
    const ref = genRef(); setTxRef(ref)
    if (screen==='send-money') push('send-confirm')
    else if (screen==='between-wallets'||screen==='wallet-id'||screen==='phone-send') push('send-confirm')
    else if (screen==='bank-form') push('bank-confirm')
    else if (screen==='contact-form') push('contact-confirm')
  }

  async function doTransfer(nextScreen: Screen){
    if (!user||!fromWallet) return
    setProcessing(true)
    setTransferError('')
    const recipName = selectedContact?.name ?? recipientName ?? null

    // Determine destination and credit amount
    let toAccountId: string|null = null
    let recipientUserId: string|null = null
    let creditAmount = sendAmount - fee

    if (betweenTo && betweenTo.user_id === user.id) {
      toAccountId = betweenTo.id
      creditAmount = betweenTo.currency !== fromWallet.currency
        ? (sendAmount - fee) * getRate(fromWallet.currency, betweenTo.currency)
        : sendAmount - fee
    } else if (recipientWalletAcct) {
      toAccountId = recipientWalletAcct.id
      recipientUserId = recipientWalletAcct.user_id
      creditAmount = sendAmount - fee
    } else if (recipientMainWallet) {
      toAccountId = recipientMainWallet.id
      recipientUserId = recipientMainWallet.user_id
      creditAmount = recipientMainWallet.currency !== fromWallet.currency
        ? (sendAmount - fee) * getRate(fromWallet.currency, recipientMainWallet.currency)
        : sendAmount - fee
    }

    // Single atomic RPC call — balance check + debit + credit + transaction records
    const { data: result, error } = await supabase.rpc('do_transfer', {
      p_from_account_id:   fromWallet.id,
      p_to_account_id:     toAccountId,
      p_recipient_user_id: recipientUserId,
      p_send_amount:       sendAmount,
      p_fee:               fee,
      p_credit_amount:     creditAmount,
      p_recipient_name:    recipName,
      p_note:              note || null,
      p_reference:         txRef,
    })

    if (error || !result?.success) {
      setTransferError(result?.error ?? error?.message ?? 'Erreur lors du transfert. Réessayez.')
      setProcessing(false)
      return
    }

    // Refresh sender's accounts with fresh balances
    const {data} = await supabase.from('currency_accounts').select('*').eq('user_id', user.id)
    if (data){ setAccounts(data); const f=data.find(a=>a.id===fromWallet.id); if(f) setFromWallet(f) }

    // Trigger in-app notification
    addNotification({
      type: 'send',
      title: `Transfert de ${formatCurrency(sendAmount, fromWallet.currency)} envoyé`,
      body: recipName ? `Envoyé à ${recipName} · Réf: ${txRef}` : `Réf: ${txRef}`,
      amount: sendAmount,
      from: recipName ?? undefined,
    })
    setProcessing(false)
    push(nextScreen)
  }

  function reset(){
    setScreens(['hub']); setAmountStr('0'); setNote(''); setPin(''); setTxRef('')
    setSelectedContact(null); setRecipientName(''); setRecipientAccount(''); setPurpose('')
    setWalletIdInput(''); setWalletIdFound(null); setWalletIdError(''); setRecipientWalletAcct(null); setRecipientMainWallet(null); setPhoneNumber('')
    setBetweenFrom(null); setBetweenTo(null)
    setWalletPickerOpen(false); setPinSheetOpen(false); setProcessing(false); setTransferError('')
  }

  function handleWalletIdChange(v: string) {
    const val = v.toUpperCase().slice(0, 8)
    setWalletIdInput(val); setWalletIdFound(null); setWalletIdError('')
    setRecipientWalletAcct(null); setRecipientMainWallet(null)
    clearTimeout(walletIdTimer.current)
    if (val.length >= 6) {
      setWalletIdSearching(true)
      walletIdTimer.current = setTimeout(async () => {
        const { data: wu } = await supabase.from('wise_users').select('id,full_name,user_code').eq('user_code', val).maybeSingle()
        setWalletIdSearching(false)
        if (!wu) { setWalletIdError('Aucun utilisateur trouvé.'); return }
        setWalletIdFound({ id: wu.id, name: wu.full_name, code: wu.user_code })
        // wallet availability is checked by useEffect watching [walletIdFound?.id, fromWallet?.id]
      }, 350)
    }
  }

  const filteredC = allContacts.filter(c=>{
    if (cSearch) return c.name.toLowerCase().includes(cSearch.toLowerCase())||c.phone.includes(cSearch)
    if (cTab==='recent') return recentContacts.some(r=>r.id===c.id)
    if (cTab==='favorites') return c.isFav
    return true
  })
  const grouped = filteredC.reduce<Record<string,Contact[]>>((acc,c)=>{
    const l=c.name[0].toUpperCase(); acc[l]=[...(acc[l]??[]),c]; return acc
  },{})

  // ── Wallet Picker Sheet ────────────────────────────────────────────────────
  const WalletSheet = ({ onSelect, current }: { onSelect:(a:CurrencyAccount)=>void; current:CurrencyAccount|null }) => (
    <div className="fixed inset-0 z-[75] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={()=>setWalletPickerOpen(false)}/>
      <div className="relative bg-white rounded-t-3xl pb-8" style={{boxShadow:'0 -8px 30px rgba(0,0,0,0.12)'}}>
        <div className="flex justify-center pt-3 pb-4"><div className="w-10 h-1 rounded-full bg-gray-200"/></div>
        <p className="text-base font-bold text-center mb-2 px-4" style={{color:'#1C1C1E'}}>Choisir le portefeuille</p>
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
          {accounts.map(a=>{
            const curr=getCurrency(a.currency); const isSel=current?.id===a.id
            return (
              <button key={a.id} onClick={()=>{onSelect(a);setWalletPickerOpen(false)}}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer tr">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{background:getGradient(a)}}>{curr?.flag}</div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate" style={{color:'#1C1C1E'}}>{curr?.name??a.currency}</p>
                  <p className="text-xs" style={{color:'#8E8E93'}}>Account {maskId(a.id)}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{borderColor:isSel?ACCENT:'#D1D5DB'}}>
                  {isSel&&<div className="w-2.5 h-2.5 rounded-full" style={{background:ACCENT}}/>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ── PIN Sheet ──────────────────────────────────────────────────────────────
  const PinSheet = () => (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>{setPinSheetOpen(false);setPin('')}}/>
      <div className="relative bg-white rounded-t-3xl" style={{boxShadow:'0 -8px 30px rgba(0,0,0,0.18)'}}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200"/></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          {selectedContact
            ? <div className="flex items-center gap-2"><ContactCircle c={selectedContact} size={32}/><p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{selectedContact.name}</p></div>
            : <p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{fromWallet?.currency} Portefeuille</p>
          }
          <p className="text-sm font-bold" style={{color:'#1C1C1E'}}>
            {fromWallet?`${getCurrency(fromWallet.currency)?.symbol}${parseFloat(amountStr).toFixed(2)}`:''}
          </p>
        </div>
        <div className="px-5 pt-5 pb-3 text-center">
          <h2 className="text-xl font-bold mb-1" style={{color:'#1C1C1E'}}>Entrer le code PIN</h2>
          <p className="text-[13px] mb-4" style={{color:'#8E8E93'}}>Confirmez avec le PIN de votre portefeuille</p>
          <PinBoxes value={pin}/>
          {pinError&&<p className="text-sm text-red-500 mt-2 mb-1">{pinError}</p>}
          <div className="flex items-center justify-center gap-1 text-sm mt-3 mb-4">
            <span style={{color:'#8E8E93'}}>Vous n'avez pas de code ?</span>
            <button className="font-semibold cursor-pointer" style={{color:ACCENT}}>Renvoyer</button>
          </div>
          <button onClick={()=>pin.length===4&&checkPin(pin)} disabled={pin.length<4}
            className="w-full h-12 rounded-2xl text-sm font-bold cursor-pointer disabled:opacity-40 mb-3"
            style={{background:ACCENT,color:'white'}}>
            Continuer
          </button>
        </div>
        <div className="border-t border-gray-100">
          <NumPad onDigit={pinDigit} onBack={pinBack}/>
        </div>
        <div className="h-6"/>
      </div>
    </div>
  )

  // Processing modal
  const ProcModal = () => (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white rounded-3xl mx-6 px-6 pt-4 pb-8 text-center" style={{maxWidth:320}}>
        <ProcessingIllustration/>
        <p className="text-xl font-bold mt-2" style={{color:'#1C1C1E'}}>Processing..</p>
        <p className="text-sm mt-1" style={{color:'#8E8E93'}}>Just hold a second, we are processing your transfer.</p>
      </div>
    </div>
  )

  // Reusable wallet dropdown trigger (used in between-wallets and wallet-id screens)
  const WalletDropdown = ({ label, selected, onOpen }: { label:string; selected:CurrencyAccount|null; onOpen:()=>void }) => {
    const curr = selected ? getCurrency(selected.currency) : null
    return (
      <div className="mb-4">
        <p className="text-xs font-medium mb-1.5" style={{color:'#8E8E93'}}>{label}</p>
        <button onClick={onOpen} className="w-full flex items-center gap-3 px-4 h-14 rounded-2xl cursor-pointer tr"
          style={{background:'#F8F8FA',border:'1px solid #E5E7EB'}}>
          {selected ? (
            <>
              <span className="text-2xl">{curr?.flag}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold" style={{color:'#1C1C1E'}}>{selected.currency}</p>
                <p className="text-xs" style={{color:'#8E8E93'}}>{formatCurrency(selected.balance, selected.currency)}</p>
              </div>
            </>
          ) : (
            <span className="flex-1 text-left text-sm" style={{color:'#C7C7CC'}}>Sélectionner un portefeuille</span>
          )}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5"><path strokeLinecap="round" d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HUB
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='hub') return (
    <div className="min-h-screen bg-white pb-28 overflow-x-hidden" style={{maxWidth:'100vw'}}>
      <div className="px-4 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <button onClick={()=>navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{background:'#F2F2F7'}}>
            <ChevronLeft className="w-5 h-5" style={{color:'#1C1C1E'}}/>
          </button>
          <p className="text-[15px] font-bold" style={{color:'#1C1C1E'}}>Transferts</p>
          <button className="w-9 h-9 flex items-center justify-center cursor-pointer"><QRIcon/></button>
        </div>

        {/* Main account balance */}
        <div className="mb-4">
          <p className="text-sm mb-0.5" style={{color:'#8E8E93'}}>Main Account</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold" style={{color:'#1C1C1E'}}>
              {fromWallet
                ? <>{getCurrency(fromWallet.currency)?.symbol}{Math.floor(fromWallet.balance).toLocaleString()}<span style={{color:ACCENT}}>.{String(fromWallet.balance.toFixed(2).split('.')[1])}</span></>
                : '—'}
            </p>
            {fromWallet&&(
              <button onClick={()=>setWalletPickerOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer" style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
                <span className="text-sm">{getCurrency(fromWallet.currency)?.flag}</span>
                <span className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{fromWallet.currency}</span>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5"><path strokeLinecap="round" d="M6 9l6 6 6-6"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <button onClick={()=>push('contacts')} className="w-full flex items-center gap-2 px-4 h-11 rounded-2xl mb-5 cursor-pointer"
          style={{background:'#F2F2F7'}}>
          <Search className="w-4 h-4 shrink-0" style={{color:'#8E8E93'}}/>
          <span className="text-sm" style={{color:'#C7C7CC'}}>Search</span>
        </button>

        {/* Recent */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-base font-bold" style={{color:'#1C1C1E'}}>Recent</p>
            <button className="cursor-pointer"><MoreHorizontal className="w-5 h-5" style={{color:'#8E8E93'}}/></button>
          </div>
          <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-1">
            {recentContacts.length===0
              ? <p className="text-xs py-2" style={{color:'#C7C7CC'}}>Aucun contact trouvé</p>
              : recentContacts.map(c=>(
              <button key={c.id} onClick={()=>{setSelectedContact(c);push('send-money')}}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                <ContactCircle c={c} size={50}/>
                <p className="text-xs font-medium" style={{color:'#8E8E93'}}>{c.name.split(' ')[0]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Transfer by Wallet ID */}
        <p className="text-sm font-semibold mb-2" style={{color:'#1C1C1E'}}>Transfer By Wallet ID</p>
        <button onClick={()=>push('wallet-id')} className="w-full flex items-center gap-3 px-4 h-13 rounded-2xl mb-6 cursor-pointer"
          style={{background:'#F2F2F7',height:52}}>
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.8">
            <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="6" cy="15" r="1" fill="#C7C7CC"/>
          </svg>
          <span className="flex-1 text-left text-sm" style={{color:'#C7C7CC'}}>Enter wallet ID</span>
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>

        {/* Transfer options */}
        <p className="text-base font-bold mb-3" style={{color:'#1C1C1E'}}>Transfers</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon:Building2, label:'Bank transfer',               action:()=>push('bank-form')      },
            { icon:Repeat2,   label:'Wallet to wallet',            action:()=>push('wallet-id')      },
            { icon:ArrowRight,label:'Between wallets',             action:()=>push('between-wallets')},
            { icon:Phone,     label:'Phone number',                action:()=>push('phone-send')     },
            { icon:Users,     label:'Contact transfer',            action:()=>push('contacts')       },
            { icon:QrCode,    label:'Scan QR',                     action:()=>push('wallet-id')      },
          ].map(({icon:Icon,label,action})=>(
            <button key={label} onClick={action}
              className="flex items-center gap-3 px-4 h-14 rounded-2xl cursor-pointer hover:bg-gray-50 tr"
              style={{background:'#F8F8FA',border:'1px solid #F0F0F5'}}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{background:'white',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
                <Icon className="w-4 h-4" style={{color:'#1C1C1E'}}/>
              </div>
              <span className="text-sm font-medium text-left leading-tight" style={{color:'#1C1C1E'}}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      {walletPickerOpen&&<WalletSheet onSelect={a=>setFromWallet(a)} current={fromWallet}/>}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // SEND MONEY (contact carousel)
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='send-money') {
    const displayList = selectedContact ? [
      ...recentContacts.filter(c=>c.id!==selectedContact.id).slice(0,2),
      selectedContact,
      ...recentContacts.filter(c=>c.id!==selectedContact.id).slice(2,4),
    ] : recentContacts
    const selIdx = displayList.findIndex(c=>c.id===selectedContact?.id)
    const canContinue = fromWallet && sendAmount>0 && sendAmount<=fromWallet.balance
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Send Money" onBack={back}/>

        {/* Contact carousel */}
        <div className="flex items-end justify-center gap-3 px-4 py-4">
          {displayList.map((c,i)=>{
            const isSel=i===selIdx
            return (
              <button key={c.id} onClick={()=>setSelectedContact(c)}
                className={cn('flex flex-col items-center gap-1.5 cursor-pointer tr shrink-0', isSel?'':'opacity-50')}>
                <div className={cn('rounded-full flex items-center justify-center font-bold text-white transition-all',isSel?'border-2':'border-0')}
                  style={{width:isSel?62:44,height:isSel?62:44,background:ACCENT,fontSize:isSel?18:14,borderColor:ACCENT,boxShadow:isSel?`0 0 0 3px ${ACCENT}33`:undefined}}>
                  {c.initials}
                </div>
                {isSel&&<p className="text-[13px] font-semibold" style={{color:'#1C1C1E'}}>{c.name}</p>}
              </button>
            )
          })}
        </div>

        {/* Wallet pill */}
        <div className="flex justify-center mb-5">
          {fromWallet&&<WalletPill acc={fromWallet} onTap={()=>setWalletPickerOpen(true)}/>}
        </div>

        {/* Amount display */}
        <div className="text-center px-8 mb-1">
          <p className="text-5xl font-light tabular-nums" style={{color:'#1C1C1E'}}>
            {fromWallet?getCurrency(fromWallet.currency)?.symbol:'$'}{amountStr==='0'?'0.00':amountStr}
          </p>
          <div className="w-40 h-px mx-auto mt-2 mb-1" style={{background:'#E5E7EB'}}/>
          {fromWallet&&sendAmount>fromWallet.balance&&<p className="text-xs text-red-500">Solde insuffisant</p>}
        </div>

        {/* What's this for */}
        <div className="px-6 mb-0.5">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm" style={{color:'#C7C7CC'}}>What's this for?</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div className="py-3">
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add A Note  (Optional)"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#C7C7CC]" style={{color:'#1C1C1E'}}/>
          </div>
        </div>

        {/* Numpad */}
        <div className="border-t border-gray-100 mt-1">
          <NumPad onDigit={amtDigit} onBack={amtBack} dot/>
        </div>
        <div className="px-4 pb-8 pt-2">
          <button onClick={openPin} disabled={!canContinue}
            className="w-full h-13 rounded-2xl font-bold text-sm cursor-pointer disabled:opacity-40"
            style={{background:ACCENT,color:'white',height:52}}>
            Continuer
          </button>
        </div>

        {walletPickerOpen&&<WalletSheet onSelect={a=>setFromWallet(a)} current={fromWallet}/>}
        {pinSheetOpen&&<PinSheet/>}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEND CONFIRM
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='send-confirm') {
    const c = selectedContact
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Send Money" onBack={back}/>
        {/* Contact + amount row */}
        {c&&(
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ContactCircle c={c} size={36}/>
              <p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{c.name}</p>
            </div>
            <p className="text-sm font-bold" style={{color:'#1C1C1E'}}>${parseFloat(amountStr).toFixed(2)}</p>
          </div>
        )}
        <div className="px-5 pt-4">
          {/* From wallet */}
          <p className="text-xs font-medium mb-1.5" style={{color:'#8E8E93'}}>From</p>
          {fromWallet&&(
            <button onClick={()=>setWalletPickerOpen(true)}
              className="w-full flex items-center gap-3 px-4 h-14 rounded-2xl mb-3 cursor-pointer"
              style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{background:ACCENT}}>{getCurrency(fromWallet.currency)?.flag}</div>
              <span className="flex-1 text-left text-sm font-semibold" style={{color:'#1C1C1E'}}>{maskId(fromWallet.id)}</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2"><path strokeLinecap="round" d="M6 9l6 6 6-6"/></svg>
            </button>
          )}
          {/* Swap icon */}
          <div className="flex justify-center mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:'#F2F2F7'}}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
                <path strokeLinecap="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </div>
          </div>
          {/* To */}
          <p className="text-xs font-medium mb-1.5" style={{color:'#8E8E93'}}>To</p>
          {c ? (
            <div className="flex items-center gap-3 px-4 h-14 rounded-2xl mb-5" style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
              <ContactCircle c={c} size={32}/>
              <span className="flex-1 text-sm font-semibold" style={{color:'#1C1C1E'}}>{c.name}</span>
            </div>
          ) : betweenTo ? (
            <div className="flex items-center gap-3 px-4 h-14 rounded-2xl mb-5" style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{background:getGradient(betweenTo)}}>{getCurrency(betweenTo.currency)?.flag}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{betweenTo.currency} — {maskId(betweenTo.id)}</p>
                {fromWallet && betweenTo.currency !== fromWallet.currency && sendAmount > 0 && (
                  <p className="text-xs font-semibold" style={{color:ACCENT}}>
                    ≈ {formatCurrency((sendAmount - fee) * getRate(fromWallet.currency, betweenTo.currency), betweenTo.currency)}
                  </p>
                )}
              </div>
            </div>
          ) : walletIdFound ? (
            <div className="flex items-center gap-3 px-4 h-14 rounded-2xl mb-5" style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0" style={{background:ACCENT}}>
                {walletIdFound.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-semibold" style={{color:'#1C1C1E'}}>{walletIdFound.name}</span>
            </div>
          ) : (
            <div className="flex items-center px-4 h-14 rounded-2xl mb-5" style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
              <span className="text-sm" style={{color:'#C7C7CC'}}>{recipientName || '—'}</span>
            </div>
          )}
          {/* Details */}
          <div className="border-t border-gray-100">
            <Row label="Amount will send" value={formatCurrency(sendAmount, fromWallet?.currency??'USD')}/>
            {betweenTo && fromWallet && betweenTo.currency !== fromWallet.currency && (
              <Row label="Amount to receive" value={formatCurrency((sendAmount - fee) * getRate(fromWallet.currency, betweenTo.currency), betweenTo.currency)} green/>
            )}
            <Row label="Reference number" value={txRef}/>
            <Row label="Date" value={new Date().toLocaleDateString('en-GB')}/>
            <Row label="Fees" value={formatCurrency(fee, fromWallet?.currency??'USD')}/>
          </div>
        </div>
        <div className="px-5 pt-4 pb-10">
          {transferError&&<p className="text-xs text-red-500 mb-3 text-center">{transferError}</p>}
          <button onClick={()=>doTransfer('send-success')} disabled={processing}
            className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            style={{background:ACCENT,color:'white',height:52}}>
            {processing?<Loader2 className="w-4 h-4 animate-spin"/>:<><Send className="w-4 h-4"/>Transfer</>}
          </button>
        </div>
        {walletPickerOpen&&<WalletSheet onSelect={a=>setFromWallet(a)} current={fromWallet}/>}
        {processing&&<ProcModal/>}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEND SUCCESS
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='send-success') {
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Send Money" onBack={reset}/>
        <div className="px-5 pt-2 pb-10">
          <WalletSuccessIllustration/>
          <p className="text-xl font-bold text-center mt-1 mb-5" style={{color:ACCENT}}>
            Congratulations Payment Success!!
          </p>
          <div className="border-t border-gray-100">
            <Row label="Amount will send" value={`$${parseFloat(amountStr).toFixed(2)}`}/>
            <Row label="Transaction status" value="Success" pill/>
            <Row label="Reference number" value={txRef}/>
            <Row label="Date" value={new Date().toLocaleDateString('en-GB')}/>
            <Row label="Time" value={timeLabel} blue/>
            <Row label="Fees" value={formatCurrency(fee, fromWallet?.currency??'USD')}/>
          </div>
          <div className="mt-6">
            <button onClick={reset} className="w-full h-13 rounded-2xl font-bold text-sm cursor-pointer" style={{background:ACCENT,color:'white',height:52}}>Back</button>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BANK FORM
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='bank-form') {
    const canContinue = bankName&&recipientName.trim()&&recipientAccount.trim()&&sendAmount>0&&fromWallet
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Bank transfer" onBack={back} right={<QRIcon/>}/>
        <div className="px-5 pb-10">
          {/* Beneficiaries */}
          <p className="text-lg font-bold mb-0.5" style={{color:'#1C1C1E'}}>Beneficiaries</p>
          <p className="text-sm mb-3" style={{color:'#8E8E93'}}>Recently saved Beneficiaries</p>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 mb-5">
            {recentContacts.map(c=>(
              <button key={c.id} onClick={()=>{setRecipientName(c.name)}}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-[13px] text-white"
                  style={{background:ACCENT}}>{c.initials}</div>
                <p className="text-[11px]" style={{color:'#8E8E93'}}>{c.name.split(' ')[0]}</p>
              </button>
            ))}
          </div>

          {/* Form */}
          {[
            { label:'Bank name', value:bankName, onChange:setBankName, placeholder:'ex. BNC, Unibank...', isSelect:true },
            { label:"Recipient's Name", value:recipientName, onChange:setRecipientName, placeholder:'Full name' },
            { label:'Account number', value:recipientAccount, onChange:setRecipientAccount, placeholder:'9000 0112 3456 78', mono:true },
            { label:'Purpose of Transfer', value:purpose, onChange:setPurpose, placeholder:'Reason for transfer' },
          ].map(({label,value,onChange,placeholder,mono,isSelect})=>(
            <div key={label} className="mb-3">
              <p className="text-sm font-medium mb-1.5" style={{color:'#1C1C1E'}}>{label}</p>
              {isSelect?(
                <select value={value} onChange={e=>onChange(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl text-sm outline-none cursor-pointer appearance-none"
                  style={{background:'#F2F2F7',border:'1px solid #F0F0F5',color:'#1C1C1E'}}>
                  {['Citibank','Chase','BNC','Unibank','Sogebank','BH','Capital One'].map(b=><option key={b}>{b}</option>)}
                </select>
              ):(
                <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
                  className={cn('w-full h-12 px-4 rounded-xl text-sm outline-none',mono&&'font-mono')}
                  style={{background:'#F2F2F7',border:'1px solid #F0F0F5',color:'#1C1C1E'}}/>
              )}
            </div>
          ))}

          {/* Amount row */}
          <div className="mb-5">
            <p className="text-sm font-medium mb-1.5" style={{color:'#1C1C1E'}}>Amount</p>
            <div className="flex items-center gap-2 px-4 h-12 rounded-xl" style={{background:'#F2F2F7',border:'1px solid #F0F0F5'}}>
              <button onClick={()=>setWalletPickerOpen(true)} className="flex items-center gap-1 cursor-pointer shrink-0">
                <span className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{fromWallet?.currency??'USD'}</span>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5"><path strokeLinecap="round" d="M6 9l6 6 6-6"/></svg>
              </button>
              <input type="number" value={amountStr==='0'?'':amountStr} onChange={e=>setAmountStr(e.target.value||'0')}
                placeholder="0.00" className="flex-1 bg-transparent text-sm font-semibold outline-none"
                style={{color:'#1C1C1E'}} min="0"/>
            </div>
          </div>

          <button onClick={()=>{ const ref=genRef();setTxRef(ref);setWalletPickerOpen(true) }} disabled={!canContinue}
            className="w-full h-13 rounded-2xl font-bold text-sm cursor-pointer disabled:opacity-40"
            style={{background:ACCENT,color:'white',height:52}}>
            Continue
          </button>
        </div>
        {walletPickerOpen&&<WalletSheet onSelect={a=>{setFromWallet(a);setWalletPickerOpen(false);push('bank-confirm')}} current={fromWallet}/>}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BANK CONFIRM
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='bank-confirm') return (
    <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
      <Hdr title="Bank transfer" onBack={back}/>
      <div className="px-5 pt-2 pb-10">
        <div className="border-t border-gray-100">
          <Row label="Amount will send" value={`${parseFloat(amountStr).toFixed(2)} ${fromWallet?.currency??'USD'}`}/>
          <Row label="From" value={`Account number ${fromWallet?maskId(fromWallet.id):'****'}`}/>
          <Row label="Transaction ID" value={txRef}/>
          <Row label="Account number" value={recipientAccount}/>
          <Row label="Send to" value={recipientName}/>
          <Row label="Fees" value={formatCurrency(fee, fromWallet?.currency??'USD')} green/>
        </div>
        <div className="mt-6">
          {transferError&&<p className="text-xs text-red-500 mb-3 text-center">{transferError}</p>}
          <button onClick={()=>doTransfer('bank-success')} disabled={processing}
            className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            style={{background:ACCENT,color:'white',height:52}}>
            {processing?<Loader2 className="w-4 h-4 animate-spin"/>:<><Send className="w-4 h-4"/>Transfer</>}
          </button>
        </div>
      </div>
      {processing&&<ProcModal/>}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // BANK SUCCESS
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='bank-success') return (
    <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
      <Hdr title="Confirm Transfer" onBack={reset}/>
      <div className="px-5 pt-2 pb-10 text-center">
        <WalletSuccessIllustration/>
        <p className="text-xl font-bold mt-1" style={{color:'#1C1C1E'}}>Transfer Successful!</p>
        <p className="text-sm mt-1 mb-5" style={{color:'#8E8E93'}}>Your money has been transferred</p>
        {/* Bank account card */}
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-3 text-left" style={{background:'#F8F8FA',border:'1px solid #F0F0F5'}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:'#F2F2F7'}}>
            <Building2 className="w-5 h-5" style={{color:'#1C1C1E'}}/>
          </div>
          <div>
            <p className="text-sm font-bold" style={{color:'#1C1C1E'}}>Bank Account</p>
            <p className="text-xs" style={{color:'#8E8E93'}}>Account number {recipientAccount.slice(0,16)}</p>
          </div>
        </div>
        {/* Amount card */}
        <div className="px-4 py-5 rounded-2xl" style={{background:'#F8F8FA',border:'1px solid #F0F0F5'}}>
          <p className="text-sm mb-1" style={{color:'#8E8E93'}}>Transfer amount</p>
          <p className="text-2xl font-bold" style={{color:'#1C1C1E'}}>${parseFloat(amountStr).toFixed(2)}</p>
          <p className="text-xs mt-1" style={{color:'#8E8E93'}}>{dateLabel}-{timeLabel}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={reset} className="flex-1 h-12 rounded-2xl text-sm font-bold cursor-pointer" style={{background:'#F2F2F7',color:'#1C1C1E'}}>Go Back</button>
          <button onClick={()=>push('bank-receipt')} className="flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" style={{background:ACCENT,color:'white'}}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 12h6M9 16h6M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z"/><path d="M14 3v5h5"/></svg>
            View Receipt
          </button>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // BANK RECEIPT
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='bank-receipt') return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{background:'linear-gradient(160deg,#3730A3 0%,#4F46E5 45%,#7C3AED 100%)'}}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <BackBtn onBack={back} light/>
        <p className="text-[15px] font-bold text-white">Transaction Receipt</p>
        <button className="w-9 h-9 flex items-center justify-center cursor-pointer"><Download className="w-5 h-5 text-white"/></button>
      </div>
      <div className="px-4 pb-10">
        <div className="bg-white rounded-3xl p-5">
          <p className="text-xl font-bold mb-3" style={{color:'#1C1C1E'}}>Transfer receipt</p>
          <div className="flex justify-between mb-3">
            <span className="text-xs" style={{color:'#8E8E93'}}>{new Date().toLocaleDateString('en-GB')}</span>
            <span className="text-xs" style={{color:'#8E8E93'}}>{timeLabel}</span>
          </div>
          <div className="border-t border-gray-100">
            <Row label="Amount will send" value={`${parseFloat(amountStr).toFixed(2)} ${fromWallet?.currency??'USD'}`}/>
            <Row label="Transaction status" value="Success" pill/>
            <Row label="Transaction type" value="Bank Transfer"/>
            <Row label="Transaction ID" value={txRef}/>
            <Row label="Account number" value={recipientAccount}/>
            <Row label="Send to" value={recipientName}/>
            <Row label="Time" value={timeLabel} blue/>
            <Row label="Issue Tracking" value={Date.now().toString().slice(-13)}/>
            <Row label="Fees" value={formatCurrency(fee, fromWallet?.currency??'USD')}/>
          </div>
          <button onClick={()=>{navigator.clipboard.writeText(txRef).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000)}}
            className="w-full mt-4 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer tr"
            style={{background:copied?'#F0FDF4':'#F2F2F7',color:copied?'#16A34A':'#1C1C1E',border:`1px solid ${copied?'#86EFAC':'#E5E7EB'}`}}>
            {copied?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}
            {copied?'Copied!':'Copy reference'}
          </button>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shrink-0" style={{background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.3)'}}>
            <Share2 className="w-5 h-5 text-white"/>
          </button>
          <button onClick={reset} className="flex-1 h-12 rounded-2xl text-sm font-bold cursor-pointer" style={{background:'rgba(255,255,255,0.15)',color:'white',border:'1px solid rgba(255,255,255,0.3)'}}>
            Home
          </button>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACTS LIST
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='contacts') return (
    <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
      <Hdr title="Contacts" onBack={back} right={<QRIcon/>}/>
      <div className="px-4 pb-10">
        {/* Search */}
        <div className="flex items-center gap-2 px-4 h-11 rounded-2xl mb-4" style={{background:'#F2F2F7'}}>
          <Search className="w-4 h-4 shrink-0" style={{color:'#C7C7CC'}}/>
          <input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#C7C7CC]" style={{color:'#1C1C1E'}}/>
          {cSearch&&<button onClick={()=>setCSearch('')} className="cursor-pointer"><X className="w-4 h-4" style={{color:'#C7C7CC'}}/></button>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-4" style={{background:'#F2F2F7'}}>
          {(['recent','contact','favorites'] as const).map(t=>(
            <button key={t} onClick={()=>setCTab(t)}
              className={cn('flex-1 h-8 rounded-lg text-xs font-semibold cursor-pointer tr capitalize',cTab===t?'text-[#1C1C1E]':'text-[#8E8E93]')}
              style={cTab===t?{background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}:{}}>
              {t==='recent'?'Recent':t==='contact'?'Contact':'Favorites'}
            </button>
          ))}
        </div>

        {/* Recent row when on recent tab */}
        {cTab==='recent'&&!cSearch&&(
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold" style={{color:'#1C1C1E'}}>Recent</p>
              <button className="cursor-pointer"><MoreHorizontal className="w-5 h-5" style={{color:'#8E8E93'}}/></button>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 mb-2">
              {recentContacts.length===0
                ? <p className="text-xs py-2" style={{color:'#C7C7CC'}}>Aucun contact récent</p>
                : recentContacts.map(c=>(
                <button key={c.id} onClick={()=>{setSelectedContact(c);push('contact-form')}}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                  <ContactCircle c={c} size={48}/>
                  <p className="text-[11px]" style={{color:'#8E8E93'}}>{c.name.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Alphabetical */}
        {Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([letter,cs])=>(
          <div key={letter}>
            <p className="text-sm font-bold px-1 py-2.5" style={{color:'#8E8E93'}}>{letter}</p>
            {cs.map(c=>(
              <div key={c.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 hover:bg-gray-50 tr"
                style={cSearch&&filteredC[0]?.id===c.id?{border:`2px solid ${ACCENT}`,background:`${ACCENT}08`}:{}}>
                <button onClick={()=>{setSelectedContact(c);push('contact-form')}} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                  <ContactCircle c={c} size={44}/>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate" style={{color:'#1C1C1E'}}>{c.name}</p>
                    <p className="text-xs truncate" style={{color:'#8E8E93'}}>{c.phone}</p>
                  </div>
                </button>
                <button onClick={()=>toggleFav(c.id)} className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill={c.isFav?ACCENT:'none'} stroke={ACCENT} strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACT FORM
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='contact-form'&&selectedContact) {
    const c = selectedContact
    const canSend = fromWallet && sendAmount>0 && sendAmount<=fromWallet.balance
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Transfer" onBack={back} right={<QRIcon/>}/>
        <div className="px-4 pb-10">
          {/* From */}
          <p className="text-xs font-medium mb-1.5" style={{color:'#8E8E93'}}>From</p>
          {fromWallet&&(
            <button onClick={()=>setWalletPickerOpen(true)}
              className="w-full flex items-center gap-3 px-4 h-14 rounded-2xl mb-4 cursor-pointer"
              style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{background:ACCENT}}>{getCurrency(fromWallet.currency)?.flag}</div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{getCurrency(fromWallet.currency)?.name}</p>
                <p className="text-xs font-mono" style={{color:'#8E8E93'}}>{maskId(fromWallet.id)}</p>
              </div>
              <span className="text-xs font-semibold cursor-pointer" style={{color:ACCENT}}>Change</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5"><path strokeLinecap="round" d="M6 9l6 6 6-6"/></svg>
            </button>
          )}
          {/* To */}
          <p className="text-xs font-medium mb-1.5" style={{color:'#8E8E93'}}>To</p>
          <button onClick={()=>push('contacts')}
            className="w-full flex items-center gap-3 px-4 h-14 rounded-2xl mb-4 cursor-pointer"
            style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
            <ContactCircle c={c} size={36}/>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold truncate" style={{color:'#1C1C1E'}}>{c.name}</p>
              <p className="text-xs" style={{color:'#8E8E93'}}>{c.phone}</p>
            </div>
            <span className="text-xs font-semibold cursor-pointer shrink-0" style={{color:ACCENT}}>Change</span>
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5"><path strokeLinecap="round" d="M6 9l6 6 6-6"/></svg>
          </button>
          {/* Amount */}
          <div className="flex items-center border-b border-gray-200 mb-1 pb-1">
            <span className="text-xl font-light mr-2" style={{color:'#1C1C1E'}}>$</span>
            <input type="number" value={amountStr==='0'?'':amountStr} onChange={e=>setAmountStr(e.target.value||'0')}
              placeholder="0.00" className="flex-1 bg-transparent text-xl font-light outline-none"
              style={{color:'#1C1C1E'}} min="0"/>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5">
              <path d="M7 16L17 8M17 16L7 8" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-xs mb-4" style={{color:'#C7C7CC'}}>From $0 to $50,000</p>
          {/* Quick amounts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[5,10,50,100,150,200,500,1000,2000].map(v=>(
              <button key={v} onClick={()=>setAmountStr(String(v))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer tr"
                style={{ background:Number(amountStr)===v?`${ACCENT}15`:'white', color:ACCENT, border:`1.5px solid ${ACCENT}30` }}>
                ${v}
              </button>
            ))}
          </div>
          {/* Notes */}
          <div className="flex items-center h-12 px-0 border-b border-gray-100 mb-6">
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add notes"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#C7C7CC]" style={{color:'#1C1C1E'}}/>
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div className="flex gap-3">
            <button onClick={back} className="flex-1 h-12 rounded-2xl text-sm font-bold cursor-pointer" style={{background:'#F2F2F7',color:'#1C1C1E'}}>Cancel</button>
            <button onClick={()=>{const ref=genRef();setTxRef(ref);push('contact-confirm')}} disabled={!canSend}
              className="flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              style={{background:ACCENT,color:'white'}}>
              <Send className="w-4 h-4"/>Send
            </button>
          </div>
        </div>
        {walletPickerOpen&&<WalletSheet onSelect={a=>{setFromWallet(a);setWalletPickerOpen(false)}} current={fromWallet}/>}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACT CONFIRM
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='contact-confirm'&&selectedContact) {
    const c = selectedContact
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Confirmation" onBack={back} right={<QRIcon/>}/>
        <div className="px-4 pb-10">
          {/* From wallet card */}
          <p className="text-xs font-medium mb-1.5" style={{color:'#8E8E93'}}>From</p>
          {fromWallet&&(
            <div className="flex items-center gap-3 px-4 h-14 rounded-2xl mb-5" style={{background:'#F2F2F7',border:'1px solid #E5E7EB'}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{background:ACCENT}}>{getCurrency(fromWallet.currency)?.flag}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{getCurrency(fromWallet.currency)?.name}</p>
                <p className="text-xs font-mono" style={{color:'#8E8E93'}}>{maskId(fromWallet.id)}</p>
              </div>
              <button onClick={()=>setWalletPickerOpen(true)} className="flex items-center gap-1 cursor-pointer">
                <span className="text-xs font-semibold" style={{color:ACCENT}}>Change</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5"><path strokeLinecap="round" d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>
          )}
          {/* Detail rows with icons */}
          {[
            { icon:<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#8E8E93" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>, label:'Receiver', value:c.name },
            { icon:<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#8E8E93" strokeWidth="1.5"><path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>, label:'Total amount', value:`$${parseFloat(amountStr).toFixed(2)}` },
            { icon:<Phone className="w-5 h-5" style={{color:'#8E8E93'}}/>, label:'Phone number', value:c.phone },
            { icon:<Percent className="w-5 h-5" style={{color:'#8E8E93'}}/>, label:'Commission', value:formatCurrency(fee, fromWallet?.currency??'USD') },
          ].map(({icon,label,value})=>(
            <div key={label} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:'#F2F2F7'}}>{icon}</div>
              <div className="flex-1">
                <p className="text-xs" style={{color:'#8E8E93'}}>{label}</p>
                <p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{value}</p>
              </div>
            </div>
          ))}
          <div className="mt-5">
            {transferError&&<p className="text-xs text-red-500 mb-3 text-center">{transferError}</p>}
            <button onClick={async()=>{
              if (!fromWallet||!selectedContact) return
              // Find recipient's wallet for this currency
              if (!recipientWalletAcct) {
                const {data}=await supabase.from('currency_accounts').select('*')
                  .eq('user_id', selectedContact.id).eq('currency', fromWallet.currency)
                if (data?.length) setRecipientWalletAcct(data[0])
              }
              doTransfer('contact-success')
            }} disabled={processing}
              className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              style={{background:ACCENT,color:'white',height:52}}>
              {processing?<Loader2 className="w-4 h-4 animate-spin"/>:<><Send className="w-4 h-4"/>Send</>}
            </button>
          </div>
        </div>
        {walletPickerOpen&&<WalletSheet onSelect={a=>{setFromWallet(a);setWalletPickerOpen(false)}} current={fromWallet}/>}
        {processing&&<ProcModal/>}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACT SUCCESS
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='contact-success'&&selectedContact) {
    const c = selectedContact
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Transfer" onBack={reset}/>
        <div className="px-5 pt-2 pb-10 text-center">
          <WalletSuccessIllustration/>
          <p className="text-xl font-bold mt-1" style={{color:'#1C1C1E'}}>Transfer Successful!</p>
          <p className="text-sm mt-1 mb-5" style={{color:'#8E8E93'}}>Your money has been transferred</p>
          {/* To contact card */}
          <p className="text-xs text-left font-medium mb-1.5" style={{color:'#8E8E93'}}>To</p>
          <div className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-3 text-left" style={{background:'#F8F8FA',border:'1px solid #F0F0F5'}}>
            <ContactCircle c={c} size={44}/>
            <div>
              <p className="text-sm font-bold" style={{color:'#1C1C1E'}}>{c.name}</p>
              <p className="text-xs" style={{color:'#8E8E93'}}>{c.phone}</p>
            </div>
          </div>
          {/* Amount card */}
          <div className="px-4 py-5 rounded-2xl" style={{background:'#F8F8FA',border:'1px solid #F0F0F5'}}>
            <p className="text-sm mb-1" style={{color:'#8E8E93'}}>Transfer amount</p>
            <p className="text-2xl font-bold" style={{color:'#1C1C1E'}}>${parseFloat(amountStr).toFixed(2)}</p>
            <p className="text-xs mt-1" style={{color:'#8E8E93'}}>{dateLabel}-{timeLabel}</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={reset} className="flex-1 h-12 rounded-2xl text-sm font-bold cursor-pointer" style={{background:'#F2F2F7',color:'#1C1C1E'}}>Go Back</button>
            <button onClick={()=>push('bank-receipt')} className="flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" style={{background:ACCENT,color:'white'}}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 12h6M9 16h6M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z"/><path d="M14 3v5h5"/></svg>
              View Receipt
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BETWEEN WALLETS (same user)
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='between-wallets') {
    const canGo = betweenFrom && betweenTo && betweenFrom.id!==betweenTo.id && sendAmount>0 && sendAmount<=betweenFrom.balance
    const betweenWalletSheet = (
      <div className="fixed inset-0 z-[75] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={()=>setWalletPickerOpen(false)}/>
        <div className="relative bg-white rounded-t-3xl pb-8" style={{boxShadow:'0 -8px 30px rgba(0,0,0,0.12)'}}>
          <div className="flex justify-center pt-3 pb-4"><div className="w-10 h-1 rounded-full bg-gray-200"/></div>
          <p className="text-base font-bold text-center mb-2 px-4" style={{color:'#1C1C1E'}}>
            {betweenPickerFor==='from' ? 'Portefeuille source' : 'Portefeuille destination'}
          </p>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {accounts
              .filter(a => betweenPickerFor==='to' ? a.id!==betweenFrom?.id : true)
              .map(a=>{
                const curr=getCurrency(a.currency)
                const isSel = betweenPickerFor==='from' ? betweenFrom?.id===a.id : betweenTo?.id===a.id
                return (
                  <button key={a.id} onClick={()=>{
                    if (betweenPickerFor==='from') setBetweenFrom(a); else { setBetweenTo(a); setToWallet(a) }
                    setWalletPickerOpen(false)
                  }} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer tr">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{background:getGradient(a)}}>{curr?.flag}</div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{curr?.name??a.currency}</p>
                      <p className="text-xs" style={{color:'#8E8E93'}}>{formatCurrency(a.balance,a.currency)}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{borderColor:isSel?ACCENT:'#D1D5DB'}}>
                      {isSel&&<div className="w-2.5 h-2.5 rounded-full" style={{background:ACCENT}}/>}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      </div>
    )
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Between Wallets" onBack={back}/>
        <div className="px-5 pb-10">
          <WalletDropdown label="From" selected={betweenFrom} onOpen={()=>{ setBetweenPickerFor('from'); setWalletPickerOpen(true) }}/>
          <WalletDropdown label="To" selected={betweenTo} onOpen={()=>{ setBetweenPickerFor('to'); setWalletPickerOpen(true) }}/>
          <div className="rounded-3xl py-5 text-center mb-4" style={{background:'#F8F8FA',border:'1px solid #F0F0F5'}}>
            <p className="text-xs mb-1" style={{color:'#8E8E93'}}>Amount</p>
            <p className="text-5xl font-light" style={{color:'#1C1C1E'}}>
              {betweenFrom?getCurrency(betweenFrom.currency)?.symbol:'$'}{amountStr==='0'?'0':amountStr}
            </p>
            {betweenFrom && betweenTo && betweenTo.currency !== betweenFrom.currency && sendAmount > 0 && (
              <div className="mt-3 mx-auto px-4 py-2 rounded-xl inline-flex items-center gap-2" style={{background:`${ACCENT}12`}}>
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5"><path strokeLinecap="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
                <span className="text-sm font-semibold" style={{color:ACCENT}}>
                  ≈ {formatCurrency((sendAmount - fee) * getRate(betweenFrom.currency, betweenTo.currency), betweenTo.currency)}
                </span>
                <span className="text-xs" style={{color:'#8E8E93'}}>après frais</span>
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 mb-2"><NumPad onDigit={amtDigit} onBack={amtBack} dot/></div>
          <button onClick={()=>{ if(betweenFrom) setFromWallet(betweenFrom); openPin() }} disabled={!canGo}
            className="w-full rounded-2xl font-bold text-sm cursor-pointer disabled:opacity-40"
            style={{background:ACCENT,color:'white',height:52}}>
            Continue
          </button>
        </div>
        {walletPickerOpen&&betweenWalletSheet}
        {pinSheetOpen&&<PinSheet/>}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHONE SEND
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='phone-send') {
    const found = allContacts.find(c=>c.phone===phoneNumber.trim()||c.name.toLowerCase().includes(phoneNumber.trim().toLowerCase()))
    const canContinue = fromWallet && sendAmount>0 && phoneNumber.length>=8
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Phone Transfer" onBack={back}/>
        <div className="px-5 pb-10">
          <p className="text-xs font-medium mb-1.5 mt-2" style={{color:'#8E8E93'}}>Phone number</p>
          <input type="tel" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} placeholder="+1 212 456 7890"
            className="w-full h-12 px-4 rounded-xl text-sm outline-none mb-1" style={{background:'#F2F2F7',border:'1px solid #E5E7EB',color:'#1C1C1E'}}/>
          {found&&<div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{background:`${ACCENT}10`,border:`1px solid ${ACCENT}30`}}>
            <Check className="w-4 h-4 shrink-0" style={{color:ACCENT}}/><p className="text-sm font-semibold" style={{color:'#1C1C1E'}}>{found.name}</p>
          </div>}
          <p className="text-xs mb-4" style={{color:'#8E8E93'}}>The recipient must have a FamillyBill HT account</p>
          <p className="text-xs font-medium mb-1.5" style={{color:'#8E8E93'}}>From wallet</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
            {accounts.map(a=>{const curr=getCurrency(a.currency);const sel=fromWallet?.id===a.id;return(
              <button key={a.id} onClick={()=>setFromWallet(a)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer tr shrink-0 border"
                style={{borderColor:sel?ACCENT:'#E5E7EB',background:sel?`${ACCENT}10`:'#F8F8FA'}}>
                <span className="text-lg">{curr?.flag}</span>
                <div className="text-left"><p className="text-xs font-bold" style={{color:'#1C1C1E'}}>{a.currency}</p><p className="text-[10px]" style={{color:'#8E8E93'}}>{formatCurrency(a.balance,a.currency)}</p></div>
                {sel&&<Check className="w-3.5 h-3.5" style={{color:ACCENT}}/>}
              </button>
            )})}
          </div>
          <div className="rounded-3xl py-6 text-center mb-4" style={{background:'#F8F8FA',border:'1px solid #F0F0F5'}}>
            <p className="text-5xl font-light" style={{color:'#1C1C1E'}}>
              {fromWallet?getCurrency(fromWallet.currency)?.symbol:'$'}{amountStr==='0'?'0':amountStr}
            </p>
          </div>
          <div className="border-t border-gray-100 mb-2"><NumPad onDigit={amtDigit} onBack={amtBack} dot/></div>
          <button onClick={()=>{if(found) setSelectedContact(found); setRecipientName(found?.name??phoneNumber); openPin()}}
            disabled={!canContinue} className="w-full h-13 rounded-2xl font-bold text-sm cursor-pointer disabled:opacity-40"
            style={{background:ACCENT,color:'white',height:52}}>
            Continue
          </button>
        </div>
        {pinSheetOpen&&<PinSheet/>}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WALLET ID
  // ─────────────────────────────────────────────────────────────────────────
  if (screen==='wallet-id') {
    const canContinue = fromWallet && sendAmount>0 && walletIdFound && (recipientWalletAcct || recipientMainWallet)
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
        <Hdr title="Transfer by ID" onBack={back} right={<QRIcon/>}/>
        <div className="px-5 pb-10">
          {/* Wallet ID input */}
          <p className="text-xs font-medium mb-1.5 mt-2" style={{color:'#8E8E93'}}>Wallet ID</p>
          <div className="relative mb-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {walletIdSearching
                ? <Loader2 className="w-4 h-4 animate-spin" style={{color:'#C7C7CC'}}/>
                : <Search className="w-4 h-4" style={{color:'#C7C7CC'}}/>}
            </div>
            <input value={walletIdInput} onChange={e=>handleWalletIdChange(e.target.value)} placeholder="FB2F4A1B" maxLength={8}
              className="w-full h-12 pl-10 pr-10 rounded-xl font-mono tracking-widest text-base uppercase outline-none"
              style={{background:'#F2F2F7',border:'1px solid #E5E7EB',color:'#1C1C1E'}}/>
            {walletIdInput&&(
              <button onClick={()=>{setWalletIdInput('');setWalletIdFound(null);setWalletIdError('');setRecipientWalletAcct(null);setRecipientMainWallet(null)}}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                <X className="w-4 h-4" style={{color:'#C7C7CC'}}/>
              </button>
            )}
          </div>
          {walletIdError&&<p className="text-xs text-red-500 mb-3">{walletIdError}</p>}

          {/* Found user card */}
          {walletIdFound&&(
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-3" style={{background:`${ACCENT}10`,border:`1.5px solid ${ACCENT}40`}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0" style={{background:ACCENT}}>
                {walletIdFound.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{color:'#1C1C1E'}}>{walletIdFound.name}</p>
                <p className="text-xs font-mono" style={{color:'#8E8E93'}}>{walletIdFound.code}</p>
              </div>
              <Check className="w-5 h-5 shrink-0" style={{color:ACCENT}}/>
            </div>
          )}

          {/* Fallback wallet warning — recipient has no matching currency wallet */}
          {walletIdFound && !recipientWalletAcct && recipientMainWallet && (
            <div className="flex items-start gap-3 px-3 py-3 rounded-xl mb-3" style={{background:'#FFF7ED',border:'1.5px solid #FED7AA'}}>
              <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{color:'#C2410C'}}>
                  Portefeuille {fromWallet?.currency} non disponible
                </p>
                <p className="text-xs mt-0.5" style={{color:'#9A3412'}}>
                  Le destinataire n'a pas de portefeuille {fromWallet?.currency}. Le montant sera converti et crédité dans son portefeuille {recipientMainWallet.currency}.
                </p>
                {sendAmount > 0 && fromWallet && (
                  <p className="text-sm font-bold mt-1.5" style={{color:'#C2410C'}}>
                    ≈ {formatCurrency((sendAmount - fee) * getRate(fromWallet.currency, recipientMainWallet.currency), recipientMainWallet.currency)} reçu
                  </p>
                )}
              </div>
            </div>
          )}

          {/* From wallet dropdown */}
          <WalletDropdown label="From" selected={fromWallet} onOpen={()=>setWalletPickerOpen(true)}/>

          {/* Amount display */}
          <div className="rounded-3xl py-6 text-center mb-4" style={{background:'#F8F8FA',border:'1px solid #F0F0F5'}}>
            <p className="text-5xl font-light" style={{color:'#1C1C1E'}}>
              {fromWallet?getCurrency(fromWallet.currency)?.symbol:'$'}{amountStr==='0'?'0':amountStr}
            </p>
            {recipientWalletAcct && sendAmount > 0 && (
              <p className="text-xs mt-2" style={{color:'#8E8E93'}}>
                Destinataire reçoit {formatCurrency(sendAmount - fee, recipientWalletAcct.currency)}
              </p>
            )}
          </div>
          <div className="border-t border-gray-100 mb-2"><NumPad onDigit={amtDigit} onBack={amtBack} dot/></div>
          <button onClick={()=>{setRecipientName(walletIdFound?.name??'');openPin()}} disabled={!canContinue}
            className="w-full rounded-2xl font-bold text-sm cursor-pointer disabled:opacity-40"
            style={{background:ACCENT,color:'white',height:52}}>
            Continue
          </button>
        </div>
        {walletPickerOpen&&<WalletSheet onSelect={a=>setFromWallet(a)} current={fromWallet}/>}
        {pinSheetOpen&&<PinSheet/>}
      </div>
    )
  }

  return null
}
