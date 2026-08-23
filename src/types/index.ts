export type { WiseUser, CurrencyAccount, Jar, Transaction } from '@/lib/supabase'
export type { Currency } from '@/lib/currencies'
export type { Provider, BillCategory, BillField, FieldType } from '@/lib/haiti-providers'
export type { AppNotification } from '@/lib/notifications-context'

export type TransferParams = {
  p_from_account_id: string
  p_to_account_id: string | null
  p_recipient_user_id: string | null
  p_send_amount: number
  p_fee: number
  p_credit_amount: number
  p_recipient_name: string | null
  p_note: string | null
  p_reference: string
}

export type TransferResult = {
  success: boolean
  error?: string
  transaction_id?: string
}

export type RecipientWalletInfo = {
  id: string
  user_id: string
  currency: string
  is_main: boolean
  exact_match: boolean
}

export type SpendingInsight = {
  category: string
  total: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  suggestion: string
}

export type AIInsight = {
  summary: string
  totalSpent: number
  topCategory: string
  insights: SpendingInsight[]
  recommendations: string[]
}
