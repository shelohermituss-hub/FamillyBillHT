import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { X, RefreshCw, WifiOff, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

function isIosSafari() {
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) && !ua.includes('chrome') && !ua.includes('fxios')
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
}

const INSTALL_DISMISSED_KEY = 'fb_install_dismissed'

export function PwaPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineReady, setOfflineReadyState] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onOfflineReady() {
      setOfflineReadyState(true)
      setTimeout(() => setOfflineReadyState(false), 4000)
    },
  })

  // Capture Android/Chrome install prompt
  useEffect(() => {
    if (isStandalone()) return
    if (sessionStorage.getItem(INSTALL_DISMISSED_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowInstall(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // iOS hint
  useEffect(() => {
    if (!isIosSafari() || isStandalone()) return
    if (sessionStorage.getItem(INSTALL_DISMISSED_KEY)) return
    const timer = setTimeout(() => setShowIosHint(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Network status
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setShowInstall(false)
    }
  }

  const dismiss = () => {
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, '1')
    setShowInstall(false)
    setShowIosHint(false)
  }

  return (
    <>
      {/* ── Offline bar ──────────────────────────────── */}
      {!isOnline && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-white"
          style={{ background: '#111' }}
        >
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[12px] font-medium">Mode hors ligne — données en cache</span>
        </div>
      )}

      {/* ── Offline-ready toast ───────────────────────── */}
      {offlineReady && (
        <div
          className="fixed bottom-24 left-4 right-4 z-[90] rounded-2xl py-3 px-4 flex items-center gap-3"
          style={{ background: 'var(--ink)', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--lime)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium">Application prête hors ligne</span>
        </div>
      )}

      {/* ── Update notification ───────────────────────── */}
      {needRefresh && (
        <div
          className="fixed bottom-24 left-4 right-4 z-[90] rounded-2xl py-3 px-4 flex items-center gap-3"
          style={{ background: 'var(--ink)', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--lime)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-none mb-0.5">Mise à jour disponible</p>
            <p className="text-[11px] opacity-60">Une nouvelle version est prête</p>
          </div>
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
            style={{ background: 'var(--lime)', color: '#fff' }}
          >
            Mettre à jour
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center cursor-pointer opacity-60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Android install banner ────────────────────── */}
      {showInstall && installPrompt && (
        <div
          className="fixed bottom-20 left-4 right-4 z-[90] rounded-2xl p-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}
        >
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
            style={{ color: 'var(--ink-60)' }}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-6">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
              <img src="/icons/icon-192x192.png" alt="FamillyBill" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[var(--ink)] leading-none mb-1">Installer FamillyBill HT</p>
              <p className="text-[11px] text-[var(--ink-60)] leading-snug">
                Accès rapide, notifications, mode hors ligne
              </p>
            </div>
          </div>
          <button
            onClick={handleInstall}
            className="mt-3 w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: 'var(--lime)', color: '#fff' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Installer l'application
          </button>
        </div>
      )}

      {/* ── iOS Safari hint ───────────────────────────── */}
      {showIosHint && (
        <div
          className="fixed bottom-20 left-4 right-4 z-[90] rounded-2xl p-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}
        >
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
            style={{ color: 'var(--ink-60)' }}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-6">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
              <img src="/icons/icon-192x192.png" alt="FamillyBill" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[var(--ink)] leading-none mb-1">Installer FamillyBill HT</p>
              <p className="text-[11px] text-[var(--ink-60)] leading-snug">
                Ajoutez l'app à l'écran d'accueil
              </p>
            </div>
          </div>
          <div
            className="mt-3 rounded-xl py-2.5 px-3 flex items-center gap-2"
            style={{ background: 'var(--surface-2)' }}
          >
            <Share className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--lime)' }} />
            <p className="text-[12px] text-[var(--ink-60)]">
              Appuyez sur <span className="font-semibold text-[var(--ink)]">Partager</span> puis{' '}
              <span className="font-semibold text-[var(--ink)]">Sur l'écran d'accueil</span>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
