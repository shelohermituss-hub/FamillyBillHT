import React from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(14,15,12,0.08)' }}
        >
          <span style={{ color: 'var(--ink-60)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
        </div>
      )}
      <p className="text-base font-bold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
      {description && (
        <p className="text-sm mb-5" style={{ color: 'var(--ink-60)' }}>{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="h-11 px-6 rounded-2xl text-sm font-semibold cursor-pointer tr"
          style={{ background: 'var(--lime)', color: '#0e0f0c' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
