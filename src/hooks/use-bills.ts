import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type Bill = {
  id: string
  user_id: string
  provider_id: string
  category_id: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed'
  fields: Record<string, string>
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

  const payBill = useCallback(async (bill: Omit<Bill, 'id' | 'created_at' | 'user_id'> & { fromAccountId: string }) => {
    if (!userId) return { error: 'Non authentifié' }
    const ref = 'BL' + Date.now().toString(36).toUpperCase()
    const { error: txError } = await supabase.rpc('do_transfer', {
      p_from_account_id: bill.fromAccountId,
      p_to_account_id: null,
      p_recipient_user_id: null,
      p_send_amount: bill.amount,
      p_fee: 0,
      p_credit_amount: bill.amount,
      p_recipient_name: bill.reference || null,
      p_note: `Paiement facture: ${bill.provider_id}`,
      p_reference: ref,
    })
    if (txError) return { error: txError.message }

    const { error: billError } = await supabase.from('bill_payments').insert({
      user_id: userId,
      provider_id: bill.provider_id,
      category_id: bill.category_id,
      amount: bill.amount,
      currency: bill.currency,
      status: 'paid',
      fields: bill.fields,
      reference: ref,
      paid_at: new Date().toISOString(),
    })
    if (billError) return { error: billError.message }
    await refresh()
    return { error: null }
  }, [userId, refresh])

  return { bills, loading, error, refresh, payBill }
}
