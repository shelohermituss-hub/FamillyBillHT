import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans votre fichier .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type WiseUser = {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  verified: boolean
  created_at: string
}

export type CurrencyAccount = {
  id: string
  user_id: string
  currency: string
  balance: number
  account_number?: string
  iban?: string
  sort_code?: string
  routing_number?: string
  is_main: boolean
  created_at: string
}

export type Jar = {
  id: string
  user_id: string
  name: string
  currency: string
  balance: number
  goal?: number
  color: string
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  type: 'send' | 'receive' | 'convert' | 'deposit' | 'withdraw'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  amount: number
  currency: string
  target_amount?: number
  target_currency?: string
  exchange_rate?: number
  fee: number
  recipient_name?: string
  recipient_email?: string
  recipient_account?: string
  note?: string
  reference?: string
  created_at: string
  completed_at?: string
}
