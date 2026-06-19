import { getCurrency } from '@/lib/currencies'
import { cn } from '@/lib/utils'

const CUSTOM_ICONS: Record<string, string> = {
  EUR: '/icons/currencies/eur.png',
  USD: '/icons/currencies/usd.jpg',
}

export function CurrencyIcon({
  code,
  className = 'w-10 h-10',
}: {
  code: string
  className?: string
}) {
  const curr = getCurrency(code)
  const icon = CUSTOM_ICONS[code]

  if (icon) {
    return (
      <img
        src={icon}
        alt={code}
        className={cn('rounded-full object-cover shrink-0 select-none', className)}
      />
    )
  }

  return (
    <div className={cn('rounded-full flex items-center justify-center bg-[var(--surface)] text-lg shrink-0 select-none', className)}>
      {curr?.flag}
    </div>
  )
}
