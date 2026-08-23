import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchTransactions } from '@/services/api'
import type { Transaction } from '@/types'

export function useTransactions(userId: string | undefined, limit = 20) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await fetchTransactions(userId, limit)
      setTransactions(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`transactions-${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        (payload) => {
          setTransactions(prev => [payload.new as Transaction, ...prev].slice(0, limit))
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        (payload) => {
          setTransactions(prev => prev.map(t => t.id === (payload.new as Transaction).id ? payload.new as Transaction : t))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, limit])

  return { transactions, loading, error, refresh }
}
