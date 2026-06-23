import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────
export type AdminMetrics = {
  transactions_today: number
  amount_today: number
  transactions_completed: number
  transactions_pending: number
  transactions_failed: number
  total_users: number
  active_users_today: number
  bill_payments_today: number
  bill_amount_today: number
  total_volume_30d: number
  new_users_30d: number
  success_rate: number
}

export type AdminUser = {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  verified: boolean
  role: string
  phone?: string
  country?: string
  created_at: string
  tx_count: number
  htg_balance: number
  last_tx_at?: string
}

export type AdminTransaction = {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: string
  status: string
  amount: number
  currency: string
  target_amount?: number
  target_currency?: string
  fee: number
  recipient_name?: string
  recipient_email?: string
  note?: string
  reference?: string
  created_at: string
  completed_at?: string
}

export type AdminBillPayment = {
  id: string
  user_id: string
  user_email: string
  user_name: string
  transaction_id?: string
  provider_id: string
  provider_name: string
  category: string
  account_ref?: string
  amount: number
  currency: string
  status: string
  paid_at?: string
  created_at: string
}

export type AdminNotification = {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: string
  title: string
  body: string
  data?: unknown
  read: boolean
  created_at: string
}

export type AuditLog = {
  id: string
  admin_id: string
  admin_email: string
  action: string
  entity_type?: string
  entity_id?: string
  old_value?: unknown
  new_value?: unknown
  ip_address?: string
  success: boolean
  error_msg?: string
  created_at: string
}

export type AdminSettings = Record<string, Record<string, unknown>>

type PaginatedResult<T> = { data: T[]; total: number }

// ── Dashboard ─────────────────────────────────────────────────
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const { data, error } = await supabase.rpc('admin_get_dashboard_metrics')
  if (error) throw error
  return data as AdminMetrics
}

// ── Users ─────────────────────────────────────────────────────
export async function getAdminUsers(page = 1, limit = 20, search?: string, role?: string): Promise<PaginatedResult<AdminUser>> {
  const { data, error } = await supabase.rpc('admin_get_users', {
    p_page: page,
    p_limit: limit,
    p_search: search || null,
    p_role: role || null,
  })
  if (error) throw error
  return data as PaginatedResult<AdminUser>
}

export async function updateAdminUser(userId: string, updates: { role?: string; verified?: boolean }) {
  const { error } = await supabase.rpc('admin_update_user', {
    p_user_id: userId,
    p_role: updates.role ?? null,
    p_verified: updates.verified ?? null,
  })
  if (error) throw error
}

// ── Transactions ──────────────────────────────────────────────
export async function getAdminTransactions(page = 1, limit = 20, status?: string, type?: string): Promise<PaginatedResult<AdminTransaction>> {
  const { data, error } = await supabase.rpc('admin_get_transactions', {
    p_page: page,
    p_limit: limit,
    p_status: status || null,
    p_type: type || null,
    p_user_id: null,
  })
  if (error) throw error
  return data as PaginatedResult<AdminTransaction>
}

export async function updateAdminTransaction(txId: string, status: string, note?: string) {
  const { error } = await supabase.rpc('admin_update_transaction', {
    p_tx_id: txId,
    p_status: status,
    p_note: note || null,
  })
  if (error) throw error
}

// ── Bill Payments ─────────────────────────────────────────────
export async function getAdminBillPayments(page = 1, limit = 20, status?: string): Promise<PaginatedResult<AdminBillPayment>> {
  const { data, error } = await supabase.rpc('admin_get_bill_payments', {
    p_page: page,
    p_limit: limit,
    p_status: status || null,
  })
  if (error) throw error
  return data as PaginatedResult<AdminBillPayment>
}

// ── Notifications ─────────────────────────────────────────────
export async function getAdminNotifications(page = 1, limit = 30): Promise<PaginatedResult<AdminNotification>> {
  const { data, error } = await supabase.rpc('admin_get_notifications', {
    p_page: page,
    p_limit: limit,
  })
  if (error) throw error
  return data as PaginatedResult<AdminNotification>
}

// ── Audit Logs ────────────────────────────────────────────────
export async function getAuditLogs(page = 1, limit = 50, action?: string, entityType?: string): Promise<PaginatedResult<AuditLog>> {
  const { data, error } = await supabase.rpc('admin_get_audit_logs', {
    p_page: page,
    p_limit: limit,
    p_action: action || null,
    p_entity_type: entityType || null,
  })
  if (error) throw error
  return data as PaginatedResult<AuditLog>
}

// ── Settings ──────────────────────────────────────────────────
export async function getAdminSettings(): Promise<AdminSettings> {
  const { data, error } = await supabase.rpc('admin_get_settings')
  if (error) throw error
  return (data ?? {}) as AdminSettings
}

export async function updateAdminSetting(key: string, value: Record<string, unknown>) {
  const { error } = await supabase.rpc('admin_update_setting', {
    p_key: key,
    p_value: value,
  })
  if (error) throw error
}

// ── Reports ───────────────────────────────────────────────────
export async function getReportsSummary(from?: string, to?: string) {
  const { data, error } = await supabase.rpc('admin_get_reports_summary', {
    p_from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    p_to: to || new Date().toISOString(),
  })
  if (error) throw error
  return data
}

// ── Log action ────────────────────────────────────────────────
export async function logAdminAction(action: string, entityType?: string, entityId?: string, oldVal?: unknown, newVal?: unknown) {
  await supabase.rpc('admin_log_action', {
    p_action: action,
    p_entity_type: entityType || null,
    p_entity_id: entityId || null,
    p_old_value: oldVal ? JSON.stringify(oldVal) : null,
    p_new_value: newVal ? JSON.stringify(newVal) : null,
    p_success: true,
    p_error_msg: null,
  })
}
