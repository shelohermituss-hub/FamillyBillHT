import { supabase } from '@/lib/supabase'
import type { CurrencyAccount, Transaction, WiseUser, TransferParams, TransferResult, RecipientWalletInfo, SearchResult } from '@/types'

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

export async function updateProfile(
  _userId: string,
  updates: Partial<WiseUser>
): Promise<void> {
  const { data, error } = await supabase.rpc('update_user_profile', {
    p_full_name: updates.full_name ?? null,
    p_phone: updates.phone ?? null,
    p_country: updates.country ?? null,
    p_address: updates.address ?? null,
    p_avatar_url: updates.avatar_url ?? null,
    p_date_of_birth: updates.date_of_birth ?? null,
  })
  if (error) throw error
  if (data && data.success === false) throw new Error('Échec de la mise à jour du profil')
}

export async function searchUsers(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 1) return []
  const { data, error } = await supabase.rpc('search_users_by_code', {
    p_search: query.trim(),
  })
  if (error) return []
  return data ?? []
}

export async function findUserByCode(code: string): Promise<SearchResult | null> {
  const { data, error } = await supabase.rpc('search_users_by_code', {
    p_search: code.trim(),
  })
  if (error || !data || data.length === 0) return null
  return data[0]
}

export async function fetchRecipientWallet(userId: string, currency: string): Promise<RecipientWalletInfo | null> {
  const { data, error } = await supabase.rpc('get_recipient_wallet', { p_user_id: userId, p_currency: currency })
  if (error) return null
  return data
}

export async function doTransfer(params: TransferParams): Promise<TransferResult> {
  const { data, error } = await supabase.rpc('do_transfer', params)
  if (error) return { success: false, error: error.message }
  return data ?? { success: false, error: 'Erreur inconnue' }
}

export async function processDeposit(accountId: string, amount: number, paymentReference?: string): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const { data, error } = await supabase.rpc('process_deposit', {
    p_account_id: accountId,
    p_amount: amount,
    p_payment_reference: paymentReference ?? null,
  })
  if (error) return { success: false, error: error.message }
  return data ?? { success: false, error: 'Erreur inconnue' }
}

export async function payBillRPC(params: {
  accountId: string
  amount: number
  currency: string
  provider: string
  category: string
  accountRef: string
}): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const { data, error } = await supabase.rpc('pay_bill', {
    p_user_id: (await supabase.auth.getUser()).data.user?.id ?? '',
    p_account_id: params.accountId,
    p_amount: params.amount,
    p_currency: params.currency,
    p_provider: params.provider,
    p_category: params.category,
    p_account_ref: params.accountRef,
  })
  if (error) return { success: false, error: error.message }
  return data ?? { success: false, error: 'Erreur inconnue' }
}

export async function freezeAccount(accountId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('freeze_account', { p_account_id: accountId })
  return { error: error?.message ?? null }
}

export async function unfreezeAccount(accountId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('unfreeze_account', { p_account_id: accountId })
  return { error: error?.message ?? null }
}

export async function deleteUserAccount(): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('delete_user_account')
  return { error: error?.message ?? null }
}

export async function setTransactionPin(pin: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('set_transaction_pin', { p_pin: pin })
  return { error: error?.message ?? null }
}

export async function verifyTransactionPin(pin: string): Promise<{ valid: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('verify_transaction_pin', { p_pin: pin })
  if (error) return { valid: false, error: error.message }
  return { valid: data ?? false }
}

export async function hasTransactionPin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_transaction_pin')
  if (error) return false
  return data ?? false
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
