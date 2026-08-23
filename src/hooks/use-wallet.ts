import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAccounts } from '@/services/api'
import type { CurrencyAccount } from '@/types'

export function useWallet(userId: string | undefined) {
  const [accounts, setAccounts] = useState<CurrencyAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await fetchAccounts(userId)
      setAccounts(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`wallet-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'currency_accounts', filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, refresh])

  return { accounts, loading, error, refresh }
}
