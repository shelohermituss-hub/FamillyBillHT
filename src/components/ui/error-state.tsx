import { AlertCircle } from 'lucide-react'

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#FEF2F2' }}
      >
        <AlertCircle className="w-7 h-7" style={{ color: '#DC2626' }} />
      </div>
      <p className="text-base font-bold mb-1" style={{ color: '#0e0f0c' }}>
        Une erreur s'est produite
      </p>
      <p className="text-sm mb-5" style={{ color: '#DC2626', opacity: 0.8 }}>
        {message ?? 'Impossible de charger les données.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-11 px-6 rounded-2xl text-sm font-semibold cursor-pointer tr"
          style={{ background: 'var(--lime)', color: '#0e0f0c' }}
        >
          Réessayer
        </button>
      )}
    </div>
  )
}
