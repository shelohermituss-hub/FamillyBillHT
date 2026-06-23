import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifType =
  | 'transfer_sent'
  | 'transfer_received'
  | 'transfer_failed'
  | 'deposit'
  | 'withdrawal'
  | 'bill_paid'
  | 'rate_alert'
  | 'security'
  | 'system'
  | 'promotion'

export type Notification = {
  id: string
  user_id: string
  type: NotifType
  title: string
  body: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

export type InsertNotification = Omit<Notification, 'id' | 'created_at' | 'read'>

export type Beneficiary = {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  account_number?: string
  bank_name?: string
  currency: string
  country?: string
  is_favorite: boolean
  avatar_url?: string
  last_sent_at?: string
  created_at: string
}

export type InsertBeneficiary = Omit<Beneficiary, 'id' | 'created_at' | 'last_sent_at'>

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getUserNotifications(userId: string): Promise<{ data: Notification[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data as Notification[] | null, error: error ? error.message : null }
}

export async function markNotificationRead(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
  return { error: error ? error.message : null }
}

export async function markAllNotificationsRead(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  return { error: error ? error.message : null }
}

export async function insertNotification(n: InsertNotification): Promise<{ error: string | null }> {
  const { error } = await supabase.from('notifications').insert({ ...n, read: false })
  return { error: error ? error.message : null }
}

// ── Beneficiaries ─────────────────────────────────────────────────────────────

export async function getBeneficiaries(userId: string): Promise<{ data: Beneficiary[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('beneficiaries')
    .select('*')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('name', { ascending: true })
  return { data: data as Beneficiary[] | null, error: error ? error.message : null }
}

export async function addBeneficiary(b: InsertBeneficiary): Promise<{ data: Beneficiary | null; error: string | null }> {
  const { data, error } = await supabase.from('beneficiaries').insert(b).select().single()
  return { data: data as Beneficiary | null, error: error ? error.message : null }
}

export async function updateBeneficiary(id: string, b: Partial<InsertBeneficiary>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('beneficiaries').update(b).eq('id', id)
  return { error: error ? error.message : null }
}

export async function deleteBeneficiary(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('beneficiaries').delete().eq('id', id)
  return { error: error ? error.message : null }
}

export async function toggleFavorite(id: string, current: boolean): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('beneficiaries')
    .update({ is_favorite: !current })
    .eq('id', id)
  return { error: error ? error.message : null }
}
