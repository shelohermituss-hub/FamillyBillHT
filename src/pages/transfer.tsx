import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronLeft, X, Check, Loader2,
  Building2, Phone, QrCode, Copy, Share2,
  ArrowRight, Send, Repeat2, Users, Wallet,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase, type CurrencyAccount } from '@/lib/supabase'
import { getCurrency, formatCurrency, calculateTransfer } from '@/lib/currencies'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────
type Screen =
  | 'hub'
  | 'wallet-to-wallet'
  | 'bank-transfer'
  | 'contacts-list'
  | 'contact-send'
  | 'phone-send'
  | 'wallet-id'
  | 'pin'
  | 'processing'
  | 'success'
  | 'receipt'

type Contact = {
  id: string
  name: string
  initials: string
  phone?: string
  color: string
  isFav?: boolean
}

// ── Mock contacts ──────────────────────────────────────────────────────────────
const CONTACTS: Contact[] = [
  { id: 'c1', name: 'James Martin',   initials: 'JM', phone: '+1 305 555 0101', color: '#4F46E5', isFav: true },
  { id: 'c2', name: 'Olivia Chen',    initials: 'OC', phone: '+1 305 555 0202', color: '#E11D48', isFav: true },
  { id: 'c3', name: 'Thomas Dupont',  initials: 'TD', phone: '+1 305 555 0303', color: '#059669', isFav: false },
  { id: 'c4', name: 'Sophia Laurent', initials: 'SL', phone: '+1 305 555 0404', color: '#D97706', isFav: false },
  { id: 'c5', name: 'Marcus Rivera',  initials: 'MR', phone: '+1 305 555 0505', color: '#7C3AED', isFav: false },
  { id: 'c6', name: 'Amara Diallo',   initials: 'AD', phone: '+1 305 555 0606', color: '#0891B2', isFav: false },
  { id: 'c7', name: 'Kevin Blanc',    initials: 'KB', phone: '+1 305 555 0707', color: '#BE185D', isFav: false },
  { id: 'c8', name: 'Léa Fontaine',   initials: 'LF', phone: '+1 305 555 0808', color: '#15803D', isFav: false },
]
const RECENT_CONTACTS = CONTACTS.slice(0, 5)

// ── Card styles (same as wallet.tsx) ──────────────────────────────────────────
const CARD_STYLES = [
  { id: 'purple', gradient: 'linear-gradient(135deg,#1a0070 0%,#3b12cc 45%,#6d28d9 100%)' },
  { id: 'green',  gradient: 'linear-gradient(135deg,#064e3b 0%,#059669 45%,#34d399 100%)' },
  { id: 'blue',   gradient: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 45%,#60a5fa 100%)' },
  { id: 'orange', gradient: 'linear-gradient(135deg,#7c2d12 0%,#ea580c 45%,#fb923c 100%)' },
  { id: 'rose',   gradient: 'linear-gradient(135deg,#831843 0%,#e11d48 45%,#fb7185 100%)' },
]
const CURRENCY_DEFAULT_STYLE: Record<string, string> = { HTG: 'purple', USD: 'green', EUR: 'blue', CAD: 'orange', BRL: 'rose' }
function getCardGradient(acc: CurrencyAccount) {
  const id = localStorage.getItem(`fb-card-style-${acc.id}`) ?? CURRENCY_DEFAULT_STYLE[acc.currency] ?? 'purple'
  return CARD_STYLES.find(s => s.id === id)?.gradient ?? CARD_STYLES[0].gradient
}
const walletPinKey = (id: string) => `fb-w-pin-${id}`

// ── Sub-components ─────────────────────────────────────────────────────────────
function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="w-9 h-9 rounded-full flex items-center justify-center tr cursor-pointer shrink-0"
      style={{ background: 'var(--surface-2)' }}
    >
      <ChevronLeft className="w-5 h-5" style={{ color: 'var(--ink)' }} />
    </button>
  )
}

function ContactAvatar({ c, size = 44 }: { c: Contact; size?: number }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: c.color, fontSize: size * 0.3 }}
    >
      {c.initials}
    </div>
  )
}

function WalletChip({ acc, selected, onClick }: { acc: CurrencyAccount; selected: boolean; onClick: () => void }) {
  const curr = getCurrency(acc.currency)
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border tr cursor-pointer', selected ? 'border-[var(--lime)]' : 'border-[var(--border)]')}
      style={{ background: selected ? 'var(--lime-light)' : 'var(--surface)' }}
    >
      <span className="text-base leading-none">{curr?.flag}</span>
      <div className="text-left">
        <p className="text-xs font-bold text-[var(--ink)] leading-tight">{acc.currency}</p>
        <p className="text-[10px] text-[var(--ink-60)]">{formatCurrency(acc.balance, acc.currency)}</p>
      </div>
      {selected && <Check className="w-3.5 h-3.5 ml-0.5 shrink-0" style={{ color: 'var(--lime)' }} />}
    </button>
  )
}

function NumPad({ onDigit, onBack, onDot }: { onDigit: (d: string) => void; onBack: () => void; onDot?: () => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9', onDot ? '.' : '', '0', '⌫']
  return (
    <div className="grid grid-cols-3 gap-3 px-4 pt-2 pb-4">
      {keys.map((k, i) => {
        if (!k) return <div key={i} />
        return (
          <button
            key={k + i}
            onClick={() => k === '⌫' ? onBack() : k === '.' ? onDot?.() : onDigit(k)}
            className="h-14 rounded-2xl text-xl font-semibold tr cursor-pointer flex items-center justify-center"
            style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}
          >
            {k}
          </button>
        )
      })}
    </div>
  )
}

function PinDots({ value, length = 4 }: { value: string; length?: number }) {
  return (
    <div className="flex items-center gap-4 justify-center py-4">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full border-2 tr"
          style={{
            borderColor: i < value.length ? 'var(--lime)' : 'var(--border)',
            background: i < value.length ? 'var(--lime)' : 'transparent',
          }}
        />
      ))}
    </div>
  )
}

function ProcessingModal() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(14,15,12,0.65)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-3xl px-8 py-10 flex flex-col items-center gap-5 mx-6 text-center" style={{ maxWidth: 320 }}>
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full border-4 border-[var(--lime-light)]" />
          <div
            className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-[var(--lime)] animate-spin"
            style={{ borderTopColor: 'var(--lime)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Send className="w-7 h-7" style={{ color: 'var(--lime)' }} />
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--ink)]">Traitement en cours</p>
          <p className="text-sm text-[var(--ink-60)] mt-1">Votre transfert est en cours de traitement…</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function TransferPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [screens, setScreens] = useState<Screen[]>(['hub'])
  const screen = screens[screens.length - 1]
  const push = (s: Screen) => setScreens(prev => [...prev, s])
  const back = () => {
    if (screens.length <= 1) navigate(-1)
    else setScreens(prev => prev.slice(0, -1))
  }

  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  // Shared state across flows
  const [fromWallet, setFromWallet] = useState<CurrencyAccount | null>(null)
  const [toWallet, setToWallet] = useState<CurrencyAccount | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [amountStr, setAmountStr] = useState('0')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [txRef, setTxRef] = useState('')
  const [copied, setCopied] = useState(false)
  const [contactsTab, setContactsTab] = useState<'recent' | 'all' | 'favorites'>('recent')
  const [contactSearch, setContactSearch] = useState('')

  // Bank transfer specific
  const [bankName, setBankName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientAccount, setRecipientAccount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [bankCurrency, setBankCurrency] = useState('USD')

  // Wallet ID flow specific
  const [walletIdInput, setWalletIdInput] = useState('')
  const [walletIdFound, setWalletIdFound] = useState<{ id: string; name: string; code: string } | null>(null)
  const [walletIdSearching, setWalletIdSearching] = useState(false)
  const [walletIdError, setWalletIdError] = useState('')
  const walletIdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Phone transfer
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneFound, setPhoneFound] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('currency_accounts').select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setAccounts(data)
          const main = data.find(a => a.is_main) ?? data[0]
          if (main) setFromWallet(main)
        }
        setLoadingAccounts(false)
      })
  }, [user])

  const sendAmount = parseFloat(amountStr) || 0

  function resetFlow() {
    setAmountStr('0')
    setNote('')
    setPin('')
    setPinError('')
    setFromWallet(accounts.find(a => a.is_main) ?? accounts[0] ?? null)
    setToWallet(null)
    setSelectedContact(null)
    setBankName('')
    setRecipientName('')
    setRecipientAccount('')
    setPurpose('')
    setWalletIdInput('')
    setWalletIdFound(null)
    setWalletIdError('')
    setPhoneNumber('')
    setPhoneFound(null)
    setTxRef('')
    setScreens(['hub'])
  }

  // ── Amount keypad helpers ──────────────────────────────────────────────────
  function handleAmountDigit(d: string) {
    setAmountStr(prev => {
      if (prev === '0') return d
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev
      return prev + d
    })
  }
  function handleAmountBack() {
    setAmountStr(prev => (prev.length <= 1 ? '0' : prev.slice(0, -1)))
  }
  function handleAmountDot() {
    setAmountStr(prev => prev.includes('.') ? prev : prev + '.')
  }

  // ── PIN logic ──────────────────────────────────────────────────────────────
  function handlePinDigit(d: string) {
    setPinError('')
    setPin(prev => prev.length < 4 ? prev + d : prev)
  }
  function handlePinBack() { setPin(prev => prev.slice(0, -1)) }

  useEffect(() => {
    if (pin.length === 4 && screen === 'pin') {
      const stored = fromWallet ? localStorage.getItem(walletPinKey(fromWallet.id)) : null
      if (!stored) {
        // No PIN set — accept any 4-digit pin and set it
        if (fromWallet) localStorage.setItem(walletPinKey(fromWallet.id), pin)
        submitTransfer()
      } else if (pin === stored) {
        submitTransfer()
      } else {
        setPinError('PIN incorrect. Réessayez.')
        setPin('')
      }
    }
  }, [pin, screen])

  // ── Submit transfer ────────────────────────────────────────────────────────
  async function submitTransfer() {
    if (!user || !fromWallet) return
    setProcessing(true)
    push('processing')

    const ref = `TRF-${Date.now()}`
    const fee = sendAmount * 0.005
    const net = sendAmount - fee

    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'send',
      status: 'completed',
      amount: sendAmount,
      currency: fromWallet.currency,
      target_amount: net,
      target_currency: toWallet?.currency ?? fromWallet.currency,
      fee,
      recipient_name: selectedContact?.name ?? recipientName ?? walletIdFound?.name ?? phoneFound?.name ?? null,
      note: note || null,
      reference: ref,
    })

    // Deduct from wallet
    await supabase.from('currency_accounts')
      .update({ balance: Math.max(0, fromWallet.balance - sendAmount) })
      .eq('id', fromWallet.id)

    // Credit toWallet if same user (wallet-to-wallet flow)
    if (toWallet && toWallet.user_id === user.id) {
      await supabase.from('currency_accounts')
        .update({ balance: toWallet.balance + net })
        .eq('id', toWallet.id)
    }

    setTxRef(ref)
    setProcessing(false)

    // Reload accounts
    const { data } = await supabase.from('currency_accounts').select('*').eq('user_id', user.id)
    if (data) setAccounts(data)

    // Replace 'processing' with 'success'
    setScreens(prev => [...prev.slice(0, -1), 'success'])
  }

  // ── Wallet ID search ───────────────────────────────────────────────────────
  function handleWalletIdChange(v: string) {
    const val = v.toUpperCase().slice(0, 8)
    setWalletIdInput(val)
    setWalletIdFound(null)
    setWalletIdError('')
    clearTimeout(walletIdTimer.current)
    if (val.length === 8) {
      setWalletIdSearching(true)
      walletIdTimer.current = setTimeout(async () => {
        const { data } = await supabase
          .from('wise_users')
          .select('id, full_name, user_code')
          .eq('user_code', val)
          .maybeSingle()
        setWalletIdSearching(false)
        if (data) {
          setWalletIdFound({ id: data.id, name: data.full_name, code: data.user_code })
          setRecipientName(data.full_name)
        } else {
          setWalletIdError('Aucun portefeuille trouvé avec cet ID.')
        }
      }, 350)
    }
  }

  // ── Filtered contacts ──────────────────────────────────────────────────────
  const filteredContacts = CONTACTS.filter(c => {
    if (contactSearch) return c.name.toLowerCase().includes(contactSearch.toLowerCase())
    if (contactsTab === 'recent') return RECENT_CONTACTS.some(r => r.id === c.id)
    if (contactsTab === 'favorites') return c.isFav
    return true
  })

  const grouped = filteredContacts.reduce<Record<string, Contact[]>>((acc, c) => {
    const letter = c.name[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(c)
    return acc
  }, {})

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER SCREENS
  // ──────────────────────────────────────────────────────────────────────────

  // ── HUB ───────────────────────────────────────────────────────────────────
  if (screen === 'hub') {
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)', maxWidth: '100vw' }}>
        <div className="px-4 pt-3 pb-28">

          {/* Balance card */}
          <div
            className="rounded-3xl p-5 mb-5"
            style={{ background: fromWallet ? getCardGradient(fromWallet) : 'linear-gradient(135deg,#1a0070,#6d28d9)' }}
          >
            <p className="text-white/70 text-xs font-medium mb-1">Solde total</p>
            <p className="text-white text-3xl font-bold mb-3">
              {fromWallet ? formatCurrency(fromWallet.balance, fromWallet.currency) : '—'}
            </p>
            <div className="flex items-center gap-2">
              {accounts.slice(0, 4).map(a => {
                const curr = getCurrency(a.currency)
                return (
                  <button
                    key={a.id}
                    onClick={() => setFromWallet(a)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold tr cursor-pointer"
                    style={{
                      background: fromWallet?.id === a.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: fromWallet?.id === a.id ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                    }}
                  >
                    {curr?.flag} {a.currency}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 h-11 rounded-2xl mb-5"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-30)' }} />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-30)]"
              style={{ color: 'var(--ink)' }}
              placeholder="Rechercher un contact ou un ID..."
              readOnly
              onClick={() => push('contacts-list')}
            />
          </div>

          {/* Recent contacts */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[var(--ink)]">Récents</p>
              <button
                onClick={() => push('contacts-list')}
                className="text-xs font-semibold cursor-pointer"
                style={{ color: 'var(--lime)' }}
              >
                Voir tous
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {RECENT_CONTACTS.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedContact(c); push('contact-send') }}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <ContactAvatar c={c} size={48} />
                  <p className="text-[11px] font-medium text-[var(--ink-60)] text-center w-12 truncate">{c.name.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Transfer by Wallet ID */}
          <div
            className="rounded-2xl p-4 mb-5"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-bold text-[var(--ink-60)] uppercase tracking-widest mb-2">Transfert par ID portefeuille</p>
            <div
              className="flex items-center gap-2 px-3 h-11 rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <Wallet className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-30)' }} />
              <input
                className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-[var(--ink-30)] uppercase tracking-widest"
                style={{ color: 'var(--ink)' }}
                placeholder="FB2F4A1B"
                maxLength={8}
                readOnly
                onClick={() => push('wallet-id')}
              />
              <button
                onClick={() => push('wallet-id')}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                style={{ background: 'var(--lime)' }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Transfer type buttons */}
          <p className="text-xs font-bold text-[var(--ink-60)] uppercase tracking-widest mb-3">Options de transfert</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Building2, label: 'Virement bancaire', screen: 'bank-transfer' as Screen, color: '#4F46E5' },
              { icon: Repeat2,   label: 'Portefeuille à portefeuille', screen: 'wallet-to-wallet' as Screen, color: '#059669' },
              { icon: Wallet,    label: 'Entre portefeuilles', screen: 'wallet-to-wallet' as Screen, color: '#D97706' },
              { icon: Phone,     label: 'Par numéro de téléphone', screen: 'phone-send' as Screen, color: '#DB2777' },
              { icon: Users,     label: 'Par contact', screen: 'contacts-list' as Screen, color: '#7C3AED' },
              { icon: QrCode,    label: 'Scanner QR', screen: 'wallet-id' as Screen, color: '#0891B2' },
            ].map(({ icon: Icon, label, screen: s, color }) => (
              <button
                key={label}
                onClick={() => push(s)}
                className="flex flex-col items-center gap-2 rounded-2xl p-3 tr cursor-pointer"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '15' }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <p className="text-[11px] font-semibold text-[var(--ink)] text-center leading-tight">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── WALLET TO WALLET ───────────────────────────────────────────────────────
  if (screen === 'wallet-to-wallet') {
    const canContinue = fromWallet && toWallet && fromWallet.id !== toWallet.id && sendAmount > 0 && sendAmount <= fromWallet.balance
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)', maxWidth: '100vw' }}>
        <div className="px-4 pt-4 pb-28">
          <div className="flex items-center gap-3 mb-6">
            <BackBtn onBack={back} />
            <div>
              <h1 className="text-lg font-bold text-[var(--ink)]">Portefeuille à portefeuille</h1>
              <p className="text-xs text-[var(--ink-60)]">Transférer entre vos portefeuilles</p>
            </div>
          </div>

          {/* From wallet */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--ink-60)] mb-2 uppercase tracking-wider">De</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {accounts.map(a => (
                <WalletChip key={a.id} acc={a} selected={fromWallet?.id === a.id} onClick={() => setFromWallet(a)} />
              ))}
            </div>
          </div>

          {/* To wallet */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-[var(--ink-60)] mb-2 uppercase tracking-wider">Vers</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {accounts.filter(a => a.id !== fromWallet?.id).map(a => (
                <WalletChip key={a.id} acc={a} selected={toWallet?.id === a.id} onClick={() => setToWallet(a)} />
              ))}
            </div>
            {accounts.length <= 1 && (
              <p className="text-xs text-[var(--ink-60)] mt-2">Vous n'avez qu'un seul portefeuille. Créez-en un autre pour transférer.</p>
            )}
          </div>

          {/* Amount display */}
          <div
            className="rounded-3xl p-6 mb-4 text-center"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs text-[var(--ink-60)] mb-2">Montant</p>
            <p className="text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {fromWallet ? getCurrency(fromWallet.currency)?.symbol : '$'}{amountStr === '0' ? '0' : amountStr}
            </p>
            {fromWallet && (
              <p className="text-xs mt-2" style={{ color: 'var(--ink-60)' }}>
                Disponible: {formatCurrency(fromWallet.balance, fromWallet.currency)}
              </p>
            )}
            {toWallet && toWallet.currency !== fromWallet?.currency && sendAmount > 0 && fromWallet && (
              <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--lime)' }}>
                ≈ {formatCurrency(calculateTransfer(sendAmount, fromWallet.currency, toWallet.currency).received, toWallet.currency)}
              </p>
            )}
          </div>

          {/* Note */}
          <div
            className="flex items-center gap-2 px-4 h-11 rounded-2xl mb-4"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-30)]"
              style={{ color: 'var(--ink)' }}
              placeholder="Ajouter une note (optionnel)"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <NumPad onDigit={handleAmountDigit} onBack={handleAmountBack} onDot={handleAmountDot} />

          <button
            onClick={() => { setPin(''); setPinError(''); push('pin') }}
            disabled={!canContinue}
            className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 mt-2"
            style={{ background: 'var(--lime)', color: 'white', height: 52 }}
          >
            Continuer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── BANK TRANSFER ──────────────────────────────────────────────────────────
  if (screen === 'bank-transfer') {
    const bankCanContinue = fromWallet && bankName.trim() && recipientName.trim() && recipientAccount.trim() && sendAmount >= 50
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)', maxWidth: '100vw' }}>
        <div className="px-4 pt-4 pb-28">
          <div className="flex items-center gap-3 mb-6">
            <BackBtn onBack={back} />
            <div>
              <h1 className="text-lg font-bold text-[var(--ink)]">Virement bancaire</h1>
              <p className="text-xs text-[var(--ink-60)]">Transférer vers un compte bancaire</p>
            </div>
          </div>

          {/* From wallet */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--ink-60)] mb-2 uppercase tracking-wider">Depuis le portefeuille</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {accounts.map(a => (
                <WalletChip key={a.id} acc={a} selected={fromWallet?.id === a.id} onClick={() => setFromWallet(a)} />
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3 mb-5">
            <div>
              <p className="text-xs font-semibold text-[var(--ink-60)] mb-1.5 uppercase tracking-wider">Banque destinataire</p>
              <input
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                placeholder="ex. BNC, Unibank, Sogebank..."
                value={bankName}
                onChange={e => setBankName(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--ink-60)] mb-1.5 uppercase tracking-wider">Nom du bénéficiaire</p>
              <input
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                placeholder="Nom complet"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--ink-60)] mb-1.5 uppercase tracking-wider">Numéro de compte</p>
              <input
                className="w-full h-11 px-4 rounded-xl text-sm font-mono outline-none"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                placeholder="IBAN ou numéro de compte"
                value={recipientAccount}
                onChange={e => setRecipientAccount(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--ink-60)] mb-1.5 uppercase tracking-wider">Motif du virement</p>
              <input
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                placeholder="ex. Loyer, Facture, Personnel..."
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
              />
            </div>
          </div>

          {/* Amount */}
          <div
            className="rounded-3xl p-5 mb-4 text-center"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs text-[var(--ink-60)] mb-2">Montant (min. $50)</p>
            <p className="text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {getCurrency(bankCurrency)?.symbol}{amountStr === '0' ? '0' : amountStr}
            </p>
            {fromWallet && (
              <p className="text-xs mt-2" style={{ color: 'var(--ink-60)' }}>
                Disponible: {formatCurrency(fromWallet.balance, fromWallet.currency)}
              </p>
            )}
            {sendAmount > 0 && sendAmount < 50 && (
              <p className="text-xs mt-1 text-red-500">Minimum $50 requis</p>
            )}
          </div>

          <NumPad onDigit={handleAmountDigit} onBack={handleAmountBack} onDot={handleAmountDot} />

          <button
            onClick={() => { setPin(''); setPinError(''); push('pin') }}
            disabled={!bankCanContinue}
            className="w-full rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 mt-2"
            style={{ background: 'var(--lime)', color: 'white', height: 52 }}
          >
            Continuer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── CONTACTS LIST ──────────────────────────────────────────────────────────
  if (screen === 'contacts-list') {
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)', maxWidth: '100vw' }}>
        <div className="px-4 pt-4 pb-28">
          <div className="flex items-center gap-3 mb-4">
            <BackBtn onBack={back} />
            <h1 className="text-lg font-bold text-[var(--ink)]">Contacts</h1>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 h-11 rounded-2xl mb-4"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-30)' }} />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-30)]"
              style={{ color: 'var(--ink)' }}
              placeholder="Rechercher un contact..."
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
            />
            {contactSearch && (
              <button onClick={() => setContactSearch('')} className="cursor-pointer">
                <X className="w-4 h-4" style={{ color: 'var(--ink-30)' }} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--surface-2)' }}>
            {(['recent', 'all', 'favorites'] as const).map(t => (
              <button
                key={t}
                onClick={() => setContactsTab(t)}
                className={cn('flex-1 h-9 rounded-lg text-xs font-semibold tr cursor-pointer', contactsTab === t ? 'text-[var(--ink)]' : 'text-[var(--ink-60)]')}
                style={contactsTab === t ? { background: 'var(--card-bg)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : {}}
              >
                {t === 'recent' ? 'Récents' : t === 'all' ? 'Tous' : 'Favoris'}
              </button>
            ))}
          </div>

          {/* Recent avatars row */}
          {contactsTab === 'recent' && !contactSearch && (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 mb-3">
              {RECENT_CONTACTS.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedContact(c); push('contact-send') }}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <ContactAvatar c={c} size={48} />
                  <p className="text-[11px] font-medium text-[var(--ink-60)] w-12 text-center truncate">{c.name.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          )}

          {/* Alphabetical list */}
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([letter, contacts]) => (
            <div key={letter}>
              <p className="text-xs font-bold text-[var(--ink-60)] px-1 py-2">{letter}</p>
              {contacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedContact(c); push('contact-send') }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 tr cursor-pointer hover:bg-[var(--card-bg)]"
                >
                  <ContactAvatar c={c} size={42} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate">{c.name}</p>
                    <p className="text-xs text-[var(--ink-60)]">{c.phone}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 rotate-180 shrink-0" style={{ color: 'var(--ink-30)' }} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── CONTACT SEND ───────────────────────────────────────────────────────────
  if (screen === 'contact-send' && selectedContact) {
    const c = selectedContact
    const canSend = fromWallet && sendAmount > 0 && sendAmount <= fromWallet.balance
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)', maxWidth: '100vw' }}>
        <div className="pt-4 pb-28">
          <div className="flex items-center gap-3 px-4 mb-5">
            <BackBtn onBack={back} />
            <div className="flex items-center gap-2.5 flex-1">
              <ContactAvatar c={c} size={36} />
              <div>
                <p className="text-sm font-bold text-[var(--ink)]">{c.name}</p>
                <p className="text-xs text-[var(--ink-60)]">{c.phone}</p>
              </div>
            </div>
          </div>

          {/* From wallet selector */}
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-[var(--ink-60)] mb-2 uppercase tracking-wider">Depuis</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {accounts.map(a => (
                <WalletChip key={a.id} acc={a} selected={fromWallet?.id === a.id} onClick={() => setFromWallet(a)} />
              ))}
            </div>
          </div>

          {/* Amount display */}
          <div className="px-4 mb-4 text-center">
            <p className="text-6xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {fromWallet ? getCurrency(fromWallet.currency)?.symbol : '$'}{amountStr === '0' ? '0' : amountStr}
            </p>
            {fromWallet && (
              <p className="text-xs mt-2" style={{ color: 'var(--ink-60)' }}>
                Disponible: {formatCurrency(fromWallet.balance, fromWallet.currency)}
              </p>
            )}
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1 mb-4">
            {[5, 10, 50, 100, 500, 1000, 2000].map(v => (
              <button
                key={v}
                onClick={() => setAmountStr(String(v))}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer tr"
                style={{ background: Number(amountStr) === v ? 'var(--lime)' : 'var(--card-bg)', color: Number(amountStr) === v ? 'white' : 'var(--ink)', border: '1px solid var(--border)' }}
              >
                ${v}
              </button>
            ))}
          </div>

          {/* Note */}
          <div className="px-4 mb-4">
            <div
              className="flex items-center gap-2 px-4 h-11 rounded-2xl"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-30)]"
                style={{ color: 'var(--ink)' }}
                placeholder="Pour quoi ? (optionnel)"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          <NumPad onDigit={handleAmountDigit} onBack={handleAmountBack} onDot={handleAmountDot} />

          <div className="px-4 mt-2">
            <button
              onClick={() => { setPin(''); setPinError(''); push('pin') }}
              disabled={!canSend}
              className="w-full rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              style={{ background: 'var(--lime)', color: 'white', height: 52 }}
            >
              Envoyer {fromWallet && sendAmount > 0 ? formatCurrency(sendAmount, fromWallet.currency) : ''} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PHONE SEND ─────────────────────────────────────────────────────────────
  if (screen === 'phone-send') {
    const canContinue = fromWallet && sendAmount > 0 && sendAmount <= fromWallet.balance && (phoneFound || phoneNumber.length >= 8)
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)', maxWidth: '100vw' }}>
        <div className="px-4 pt-4 pb-28">
          <div className="flex items-center gap-3 mb-6">
            <BackBtn onBack={back} />
            <div>
              <h1 className="text-lg font-bold text-[var(--ink)]">Par numéro de téléphone</h1>
              <p className="text-xs text-[var(--ink-60)]">Le destinataire doit avoir un compte FamillyBill</p>
            </div>
          </div>

          {/* Phone input */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--ink-60)] mb-1.5 uppercase tracking-wider">Numéro de téléphone</p>
            <input
              className="w-full h-12 px-4 rounded-xl text-base font-semibold outline-none"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
              type="tel"
              placeholder="+1 305 555 0000"
              value={phoneNumber}
              onChange={e => {
                setPhoneNumber(e.target.value)
                const found = CONTACTS.find(c => c.phone === e.target.value.trim())
                setPhoneFound(found ? { id: found.id, name: found.name } : null)
              }}
            />
            {phoneFound && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background: 'var(--lime-light)' }}>
                <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--lime)' }} />
                <p className="text-sm font-semibold text-[var(--ink)]">{phoneFound.name}</p>
              </div>
            )}
          </div>

          {/* From wallet */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--ink-60)] mb-2 uppercase tracking-wider">Depuis</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {accounts.map(a => (
                <WalletChip key={a.id} acc={a} selected={fromWallet?.id === a.id} onClick={() => setFromWallet(a)} />
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="rounded-3xl p-5 mb-4 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <p className="text-xs text-[var(--ink-60)] mb-2">Montant</p>
            <p className="text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {fromWallet ? getCurrency(fromWallet.currency)?.symbol : '$'}{amountStr === '0' ? '0' : amountStr}
            </p>
          </div>

          <NumPad onDigit={handleAmountDigit} onBack={handleAmountBack} onDot={handleAmountDot} />

          <button
            onClick={() => { setPin(''); setPinError(''); push('pin') }}
            disabled={!canContinue}
            className="w-full rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 mt-2"
            style={{ background: 'var(--lime)', color: 'white', height: 52 }}
          >
            Continuer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── WALLET ID ──────────────────────────────────────────────────────────────
  if (screen === 'wallet-id') {
    const canContinue = fromWallet && sendAmount > 0 && sendAmount <= fromWallet.balance && walletIdFound
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)', maxWidth: '100vw' }}>
        <div className="px-4 pt-4 pb-28">
          <div className="flex items-center gap-3 mb-6">
            <BackBtn onBack={back} />
            <div>
              <h1 className="text-lg font-bold text-[var(--ink)]">Transfert par ID</h1>
              <p className="text-xs text-[var(--ink-60)]">Entrez l'ID du portefeuille destinataire</p>
            </div>
          </div>

          {/* Wallet ID input */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--ink-60)] mb-1.5 uppercase tracking-wider">ID Portefeuille</p>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {walletIdSearching
                  ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--ink-30)' }} />
                  : <Search className="w-4 h-4" style={{ color: 'var(--ink-30)' }} />}
              </div>
              <input
                className="w-full h-12 pl-10 pr-10 rounded-xl font-mono tracking-widest text-base uppercase outline-none"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                placeholder="FB2F4A1B"
                maxLength={8}
                value={walletIdInput}
                onChange={e => handleWalletIdChange(e.target.value)}
              />
              {walletIdInput && (
                <button
                  onClick={() => { setWalletIdInput(''); setWalletIdFound(null); setWalletIdError('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--ink-30)' }} />
                </button>
              )}
            </div>
            {walletIdError && <p className="text-xs text-red-500 mt-1">{walletIdError}</p>}
            {walletIdFound && (
              <div className="flex items-center gap-3 mt-2 px-3 py-3 rounded-xl" style={{ background: 'var(--lime-light)', border: '1.5px solid var(--lime)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ background: '#4F46E5' }}>
                  {walletIdFound.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">{walletIdFound.name}</p>
                  <p className="text-xs font-mono text-[var(--ink-60)]">{walletIdFound.code}</p>
                </div>
                <Check className="w-5 h-5 shrink-0" style={{ color: 'var(--lime)' }} />
              </div>
            )}
          </div>

          {/* From wallet */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--ink-60)] mb-2 uppercase tracking-wider">Depuis</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {accounts.map(a => (
                <WalletChip key={a.id} acc={a} selected={fromWallet?.id === a.id} onClick={() => setFromWallet(a)} />
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="rounded-3xl p-5 mb-4 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <p className="text-xs text-[var(--ink-60)] mb-2">Montant</p>
            <p className="text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {fromWallet ? getCurrency(fromWallet.currency)?.symbol : '$'}{amountStr === '0' ? '0' : amountStr}
            </p>
            {fromWallet && (
              <p className="text-xs mt-2" style={{ color: 'var(--ink-60)' }}>
                Disponible: {formatCurrency(fromWallet.balance, fromWallet.currency)}
              </p>
            )}
          </div>

          <NumPad onDigit={handleAmountDigit} onBack={handleAmountBack} onDot={handleAmountDot} />

          <button
            onClick={() => { setPin(''); setPinError(''); push('pin') }}
            disabled={!canContinue}
            className="w-full rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 mt-2"
            style={{ background: 'var(--lime)', color: 'white', height: 52 }}
          >
            Continuer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── PIN ────────────────────────────────────────────────────────────────────
  if (screen === 'pin') {
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--surface)', maxWidth: '100vw' }}>
        <div className="pt-4 pb-28">
          <div className="flex items-center gap-3 px-4 mb-8">
            <BackBtn onBack={back} />
            <div>
              <h1 className="text-lg font-bold text-[var(--ink)]">Confirmer avec le PIN</h1>
              <p className="text-xs text-[var(--ink-60)]">Entrez le PIN de votre portefeuille</p>
            </div>
          </div>

          {fromWallet && (
            <div className="px-4 mb-6 text-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              >
                <span className="text-base">{getCurrency(fromWallet.currency)?.flag}</span>
                <span className="text-sm font-semibold text-[var(--ink)]">{fromWallet.currency} — {formatCurrency(sendAmount, fromWallet.currency)}</span>
              </div>
            </div>
          )}

          <PinDots value={pin} length={4} />

          {pinError && (
            <p className="text-center text-xs text-red-500 mb-2">{pinError}</p>
          )}

          {!localStorage.getItem(fromWallet ? walletPinKey(fromWallet.id) : '') && (
            <p className="text-center text-xs text-[var(--ink-60)] mb-2 px-8">
              Aucun PIN configuré — créez-en un en saisissant 4 chiffres.
            </p>
          )}

          <NumPad onDigit={handlePinDigit} onBack={handlePinBack} />

          <div className="px-4">
            <button className="w-full text-xs text-center cursor-pointer" style={{ color: 'var(--lime)' }}>
              PIN oublié ? Réinitialiser
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PROCESSING ─────────────────────────────────────────────────────────────
  if (screen === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface)' }}>
        <ProcessingModal />
      </div>
    )
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (screen === 'success') {
    const recipient = selectedContact?.name ?? recipientName ?? walletIdFound?.name ?? phoneFound?.name ?? 'Destinataire'
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#1a0070 0%,#4F46E5 50%,#7C3AED 100%)' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          {/* Check animation */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)' }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--lime)' }}>
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Transfert réussi !</h1>
          <p className="text-white/70 text-sm mb-6">
            Vous avez envoyé {fromWallet ? formatCurrency(sendAmount, fromWallet.currency) : ''} à {recipient}
          </p>

          {/* Receipt card */}
          <div className="w-full bg-white rounded-3xl p-5 text-left mb-6" style={{ maxWidth: 340 }}>
            {[
              { label: 'Montant envoyé', value: fromWallet ? formatCurrency(sendAmount, fromWallet.currency) : '—' },
              { label: 'Destinataire', value: recipient },
              { label: 'Référence', value: txRef ? txRef.slice(0, 12).toUpperCase() : '—', mono: true },
              { label: 'Statut', value: 'Complété', green: true },
              { label: 'Date', value: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
            ].map((row, i) => (
              <div key={i} className={cn('flex items-center justify-between py-3', i < 4 && 'border-b border-gray-100')}>
                <span className="text-xs text-gray-500">{row.label}</span>
                <span className={cn('text-sm font-semibold', row.mono && 'font-mono text-xs', row.green ? 'text-emerald-600' : 'text-gray-900')}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 w-full" style={{ maxWidth: 340 }}>
            <button
              onClick={() => push('receipt')}
              className="flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Share2 className="w-4 h-4" />
              Reçu
            </button>
            <button
              onClick={resetFlow}
              className="flex-1 h-12 rounded-2xl text-sm font-bold cursor-pointer"
              style={{ background: 'var(--lime)', color: 'white' }}
            >
              Accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RECEIPT ────────────────────────────────────────────────────────────────
  if (screen === 'receipt') {
    const recipient = selectedContact?.name ?? recipientName ?? walletIdFound?.name ?? phoneFound?.name ?? 'Destinataire'
    function copyRef() {
      navigator.clipboard.writeText(txRef).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#1a0070 0%,#4F46E5 50%,#7C3AED 100%)' }}>
        <div className="px-4 pt-4 pb-28">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={back}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">Reçu de transfert</h1>
          </div>

          <div className="bg-white rounded-3xl p-6 mb-4">
            {/* Top */}
            <div className="text-center mb-5 pb-5 border-b border-gray-100">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--lime)' }}>
                <Send className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {fromWallet ? formatCurrency(sendAmount, fromWallet.currency) : '—'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Envoyé à {recipient}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {[
                { label: 'Référence', value: txRef.slice(0, 12).toUpperCase(), mono: true },
                { label: 'De', value: profile?.full_name ?? 'Moi' },
                { label: 'À', value: recipient },
                { label: 'Portefeuille source', value: fromWallet ? `${getCurrency(fromWallet.currency)?.flag} ${fromWallet.currency}` : '—' },
                { label: 'Date & heure', value: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                { label: 'Statut', value: 'Complété ✓', green: true },
                ...(note ? [{ label: 'Note', value: note, italic: true }] : []),
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{row.label}</span>
                  <span className={cn('text-sm font-semibold text-gray-900', row.mono && 'font-mono text-xs', row.italic && 'italic text-gray-500', (row as any).green && 'text-emerald-600')}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Copy ref */}
            <button
              onClick={copyRef}
              className="w-full mt-5 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer tr"
              style={{ background: copied ? 'var(--lime-light)' : 'var(--surface)', color: copied ? 'var(--lime)' : 'var(--ink-60)', border: '1px solid var(--border)' }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier la référence'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetFlow}
              className="flex-1 h-12 rounded-2xl text-sm font-bold cursor-pointer"
              style={{ background: 'var(--lime)', color: 'white' }}
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
