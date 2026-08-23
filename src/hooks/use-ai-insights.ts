import { useCallback, useEffect, useState } from 'react'
import { fetchAIInsights } from '@/services/api'
import type { AIInsight, Transaction } from '@/types'

export function useAIInsights(transactions: Transaction[]) {
  const [insight, setInsight] = useState<AIInsight | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (transactions.length === 0) {
      setInsight(null)
      return
    }
    setLoading(true)
    try {
      setInsight(await fetchAIInsights(transactions))
    } finally {
      setLoading(false)
    }
  }, [transactions])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { insight, loading, refresh }
}
