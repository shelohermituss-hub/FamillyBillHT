import { supabase } from '@/lib/supabase'
import type { CurrencyAccount, Transaction, WiseUser, TransferParams, TransferResult, RecipientWalletInfo } from '@/types'

export async function fetchAccounts(userId: string): Promise<CurrencyAccount[]> {
  const { data, error } = await supabase
    .from('currency_accounts')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function fetchTransactions(userId: string, limit = 20): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function fetchAllTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchProfile(userId: string): Promise<WiseUser | null> {
  const { data } = await supabase
    .from('wise_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return data
}

export async function updateProfile(userId: string, updates: Partial<WiseUser>): Promise<void> {
  const { error } = await supabase
    .from('wise_users')
    .update(updates)
    .eq('id', userId)
  if (error) throw error
}

export async function fetchUsers(excludeId: string): Promise<WiseUser[]> {
  const { data, error } = await supabase
    .from('wise_users')
    .select('*')
    .neq('id', excludeId)
  if (error) throw error
  return data ?? []
}

export async function findUserByCode(code: string): Promise<WiseUser | null> {
  const { data } = await supabase
    .from('wise_users')
    .select('*')
    .eq('user_code', code)
    .maybeSingle()
  return data
}

export async function fetchRecipientWallet(userId: string, currency: string): Promise<RecipientWalletInfo | null> {
  const { data, error } = await supabase
    .rpc('get_recipient_wallet', { p_user_id: userId, p_currency: currency })
  if (error) return null
  return data
}

export async function doTransfer(params: TransferParams): Promise<TransferResult> {
  const { data, error } = await supabase.rpc('do_transfer', params)
  if (error) return { success: false, error: error.message }
  return data ?? { success: false, error: 'Erreur inconnue' }
}

export async function fetchAIInsights(transactions: Transaction[]): Promise<import('@/types').AIInsight> {
  const { data, error } = await supabase.functions.invoke('ai-spending-insights', {
    body: { transactions },
  })
  if (error || !data) {
    return {
      summary: 'Analyse indisponible pour le moment.',
      totalSpent: 0,
      topCategory: '—',
      insights: [],
      recommendations: ['Activez plus de transactions pour recevoir des recommandations personnalisées.'],
    }
  }
  return data
}
