import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { payBillRPC } from '@/services/api'

export type Bill = {
  id: string
  user_id: string
  provider: string
  category: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'completed'
  account_ref: string
  reference: string
  created_at: string
  paid_at?: string | null
}

export function useBills(userId: string | undefined) {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (err) throw err
      setBills(data ?? [])
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
      .channel(`bills-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bill_payments', filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, refresh])

  const payBill = useCallback(async (params: {
    fromAccountId: string
    amount: number
    currency: string
    provider: string
    category: string
    accountRef: string
  }) => {
    if (!userId) return { error: 'Non authentifié' }
    const result = await payBillRPC({
      accountId: params.fromAccountId,
      amount: params.amount,
      currency: params.currency,
      provider: params.provider,
      category: params.category,
      accountRef: params.accountRef,
    })
    if (result.error) return { error: result.error }
    await refresh()
    return { error: null }
  }, [userId, refresh])

  return { bills, loading, error, refresh, payBill }
}
