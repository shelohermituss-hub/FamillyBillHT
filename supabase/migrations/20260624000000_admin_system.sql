-- Add role to wise_users
ALTER TABLE wise_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- Admin audit logs (immutable)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  admin_email  TEXT NOT NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  old_value    JSONB,
  new_value    JSONB,
  ip_address   TEXT,
  success      BOOLEAN DEFAULT TRUE,
  error_msg    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Admin settings (key/value store)
CREATE TABLE IF NOT EXISTS admin_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES wise_users(id)
);

-- Default settings
INSERT INTO admin_settings (key, value) VALUES
  ('platform', '{"name":"FamillyBill HT","currency_default":"HTG","lang_default":"fr","maintenance_mode":false}'::jsonb),
  ('fees', '{"transfer_pct":1.5,"bill_payment_flat":25,"min_fee":10}'::jsonb),
  ('limits', '{"per_transaction":50000,"daily":200000,"monthly":1000000}'::jsonb),
  ('notifications_cfg', '{"email_enabled":true,"sms_enabled":false,"channels":["email"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM wise_users WHERE id = auth.uid() AND role IN ('admin','super_admin'));
$$;

-- Admin policies on admin tables
CREATE POLICY "admin_audit_select" ON admin_audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admin_audit_insert" ON admin_audit_logs FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_settings_select" ON admin_settings FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admin_settings_upsert" ON admin_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Admin can read ALL rows on main tables (add alongside existing user policies)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wise_users' AND policyname='admin_all_users') THEN
    CREATE POLICY "admin_all_users" ON wise_users FOR ALL TO authenticated USING (auth.uid()=id OR is_admin()) WITH CHECK (auth.uid()=id OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='admin_all_tx') THEN
    CREATE POLICY "admin_all_tx" ON transactions FOR ALL TO authenticated USING (auth.uid()=user_id OR is_admin()) WITH CHECK (auth.uid()=user_id OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bill_payments' AND policyname='admin_all_bills') THEN
    CREATE POLICY "admin_all_bills" ON bill_payments FOR ALL TO authenticated USING (auth.uid()=user_id OR is_admin()) WITH CHECK (auth.uid()=user_id OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='admin_all_notif') THEN
    CREATE POLICY "admin_all_notif" ON notifications FOR ALL TO authenticated USING (auth.uid()=user_id OR is_admin()) WITH CHECK (auth.uid()=user_id OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='currency_accounts' AND policyname='admin_all_accounts') THEN
    CREATE POLICY "admin_all_accounts" ON currency_accounts FOR SELECT TO authenticated USING (auth.uid()=user_id OR is_admin());
  END IF;
END $$;

-- ── RPC: Dashboard metrics ─────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_dashboard_metrics()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE today TIMESTAMPTZ := date_trunc('day', NOW()); res JSON;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT json_build_object(
    'transactions_today',   (SELECT COUNT(*) FROM transactions WHERE created_at >= today),
    'amount_today',         (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE created_at >= today AND status='completed'),
    'transactions_completed',(SELECT COUNT(*) FROM transactions WHERE status='completed' AND created_at >= today),
    'transactions_pending', (SELECT COUNT(*) FROM transactions WHERE status='pending'),
    'transactions_failed',  (SELECT COUNT(*) FROM transactions WHERE status='failed' AND created_at >= today),
    'total_users',          (SELECT COUNT(*) FROM wise_users WHERE role='user'),
    'active_users_today',   (SELECT COUNT(DISTINCT user_id) FROM transactions WHERE created_at >= today),
    'bill_payments_today',  (SELECT COUNT(*) FROM bill_payments WHERE created_at >= today),
    'bill_amount_today',    (SELECT COALESCE(SUM(amount),0) FROM bill_payments WHERE created_at >= today AND status='completed'),
    'total_volume_30d',     (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE created_at >= NOW()-INTERVAL'30 days' AND status='completed'),
    'new_users_30d',        (SELECT COUNT(*) FROM wise_users WHERE created_at >= NOW()-INTERVAL'30 days'),
    'success_rate',         CASE WHEN (SELECT COUNT(*) FROM transactions WHERE created_at >= today)=0 THEN 0
      ELSE ROUND(100.0*(SELECT COUNT(*) FROM transactions WHERE status='completed' AND created_at >= today)/
           NULLIF((SELECT COUNT(*) FROM transactions WHERE created_at >= today),0),1) END
  ) INTO res;
  RETURN res;
END;
$$;

-- ── RPC: Get users (paginated) ─────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_users(
  p_page INT DEFAULT 1, p_limit INT DEFAULT 20,
  p_search TEXT DEFAULT NULL, p_role TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE off INT := (p_page-1)*p_limit; res JSON;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT json_build_object(
    'data', (SELECT COALESCE(json_agg(u),'[]'::json) FROM (
      SELECT wu.id,wu.email,wu.full_name,wu.avatar_url,wu.verified,wu.role,wu.created_at,wu.phone,wu.country,
        (SELECT COUNT(*) FROM transactions t WHERE t.user_id=wu.id) tx_count,
        (SELECT COALESCE(SUM(balance),0) FROM currency_accounts ca WHERE ca.user_id=wu.id AND ca.currency='HTG') htg_balance,
        (SELECT MAX(created_at) FROM transactions t2 WHERE t2.user_id=wu.id) last_tx_at
      FROM wise_users wu
      WHERE (p_search IS NULL OR wu.email ILIKE '%'||p_search||'%' OR wu.full_name ILIKE '%'||p_search||'%')
        AND (p_role IS NULL OR wu.role=p_role)
      ORDER BY wu.created_at DESC LIMIT p_limit OFFSET off) u),
    'total', (SELECT COUNT(*) FROM wise_users wu
      WHERE (p_search IS NULL OR wu.email ILIKE '%'||p_search||'%' OR wu.full_name ILIKE '%'||p_search||'%')
        AND (p_role IS NULL OR wu.role=p_role))
  ) INTO res;
  RETURN res;
END;
$$;

-- ── RPC: Update user ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_user(
  p_user_id UUID, p_role TEXT DEFAULT NULL, p_verified BOOLEAN DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE wise_users SET
    role=COALESCE(p_role,role), verified=COALESCE(p_verified,verified)
  WHERE id=p_user_id;
  INSERT INTO admin_audit_logs(admin_id,admin_email,action,entity_type,entity_id,new_value)
  SELECT auth.uid(),email,'update_user','user',p_user_id::TEXT,
    json_build_object('role',p_role,'verified',p_verified)::jsonb
  FROM wise_users WHERE id=auth.uid();
END;
$$;

-- ── RPC: Get transactions (paginated) ──────────────────────────
CREATE OR REPLACE FUNCTION admin_get_transactions(
  p_page INT DEFAULT 1, p_limit INT DEFAULT 20,
  p_status TEXT DEFAULT NULL, p_type TEXT DEFAULT NULL, p_user_id UUID DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE off INT := (p_page-1)*p_limit; res JSON;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT json_build_object(
    'data', (SELECT COALESCE(json_agg(r),'[]'::json) FROM (
      SELECT t.*,wu.email user_email,wu.full_name user_name
      FROM transactions t JOIN wise_users wu ON wu.id=t.user_id
      WHERE (p_status IS NULL OR t.status=p_status)
        AND (p_type IS NULL OR t.type=p_type)
        AND (p_user_id IS NULL OR t.user_id=p_user_id)
      ORDER BY t.created_at DESC LIMIT p_limit OFFSET off) r),
    'total', (SELECT COUNT(*) FROM transactions t
      WHERE (p_status IS NULL OR t.status=p_status)
        AND (p_type IS NULL OR t.type=p_type)
        AND (p_user_id IS NULL OR t.user_id=p_user_id))
  ) INTO res;
  RETURN res;
END;
$$;

-- ── RPC: Update transaction ─────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_transaction(
  p_tx_id UUID, p_status TEXT, p_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE old_status TEXT;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT status INTO old_status FROM transactions WHERE id=p_tx_id;
  UPDATE transactions SET status=p_status,note=COALESCE(p_note,note) WHERE id=p_tx_id;
  INSERT INTO admin_audit_logs(admin_id,admin_email,action,entity_type,entity_id,old_value,new_value)
  SELECT auth.uid(),wu.email,'update_transaction_status','transaction',p_tx_id::TEXT,
    json_build_object('status',old_status)::jsonb,
    json_build_object('status',p_status,'note',p_note)::jsonb
  FROM wise_users wu WHERE wu.id=auth.uid();
END;
$$;

-- ── RPC: Get bill payments ──────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_bill_payments(
  p_page INT DEFAULT 1, p_limit INT DEFAULT 20, p_status TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE off INT := (p_page-1)*p_limit; res JSON;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT json_build_object(
    'data', (SELECT COALESCE(json_agg(r),'[]'::json) FROM (
      SELECT bp.*,wu.email user_email,wu.full_name user_name
      FROM bill_payments bp JOIN wise_users wu ON wu.id=bp.user_id
      WHERE (p_status IS NULL OR bp.status=p_status)
      ORDER BY bp.created_at DESC LIMIT p_limit OFFSET off) r),
    'total', (SELECT COUNT(*) FROM bill_payments WHERE (p_status IS NULL OR status=p_status))
  ) INTO res;
  RETURN res;
END;
$$;

-- ── RPC: Get notifications (admin) ──────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_notifications(
  p_page INT DEFAULT 1, p_limit INT DEFAULT 30
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE off INT := (p_page-1)*p_limit; res JSON;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT json_build_object(
    'data', (SELECT COALESCE(json_agg(r),'[]'::json) FROM (
      SELECT n.*,wu.email user_email,wu.full_name user_name
      FROM notifications n JOIN wise_users wu ON wu.id=n.user_id
      ORDER BY n.created_at DESC LIMIT p_limit OFFSET off) r),
    'total', (SELECT COUNT(*) FROM notifications)
  ) INTO res;
  RETURN res;
END;
$$;

-- ── RPC: Audit logs ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_audit_logs(
  p_page INT DEFAULT 1, p_limit INT DEFAULT 50,
  p_action TEXT DEFAULT NULL, p_entity_type TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE off INT := (p_page-1)*p_limit; res JSON;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT json_build_object(
    'data', (SELECT COALESCE(json_agg(r),'[]'::json) FROM (
      SELECT * FROM admin_audit_logs
      WHERE (p_action IS NULL OR action=p_action)
        AND (p_entity_type IS NULL OR entity_type=p_entity_type)
      ORDER BY created_at DESC LIMIT p_limit OFFSET off) r),
    'total', (SELECT COUNT(*) FROM admin_audit_logs
      WHERE (p_action IS NULL OR action=p_action)
        AND (p_entity_type IS NULL OR entity_type=p_entity_type))
  ) INTO res;
  RETURN res;
END;
$$;

-- ── RPC: Settings ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_settings()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN (SELECT COALESCE(json_object_agg(key,value),'{}') FROM admin_settings);
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_setting(p_key TEXT, p_value JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  INSERT INTO admin_settings(key,value,updated_at,updated_by) VALUES(p_key,p_value,NOW(),auth.uid())
  ON CONFLICT(key) DO UPDATE SET value=p_value,updated_at=NOW(),updated_by=auth.uid();
  INSERT INTO admin_audit_logs(admin_id,admin_email,action,entity_type,entity_id,new_value)
  SELECT auth.uid(),wu.email,'update_setting','setting',p_key,p_value FROM wise_users wu WHERE wu.id=auth.uid();
END;
$$;

-- ── RPC: Reports summary ────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_reports_summary(
  p_from TIMESTAMPTZ DEFAULT NOW()-INTERVAL'30 days',
  p_to   TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE res JSON;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT json_build_object(
    'total_transactions', (SELECT COUNT(*) FROM transactions WHERE created_at BETWEEN p_from AND p_to),
    'completed_amount',   (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status='completed' AND created_at BETWEEN p_from AND p_to),
    'failed_count',       (SELECT COUNT(*) FROM transactions WHERE status='failed' AND created_at BETWEEN p_from AND p_to),
    'bill_payments_total',(SELECT COUNT(*) FROM bill_payments WHERE created_at BETWEEN p_from AND p_to),
    'bill_amount_total',  (SELECT COALESCE(SUM(amount),0) FROM bill_payments WHERE status='completed' AND created_at BETWEEN p_from AND p_to),
    'new_users',          (SELECT COUNT(*) FROM wise_users WHERE created_at BETWEEN p_from AND p_to),
    'by_provider',        (SELECT COALESCE(json_agg(r),'[]') FROM (
      SELECT provider_name,COUNT(*) cnt,COALESCE(SUM(amount),0) total
      FROM bill_payments WHERE created_at BETWEEN p_from AND p_to
      GROUP BY provider_name ORDER BY total DESC LIMIT 10) r),
    'by_type',            (SELECT COALESCE(json_agg(r),'[]') FROM (
      SELECT type,COUNT(*) cnt,COALESCE(SUM(amount),0) total
      FROM transactions WHERE created_at BETWEEN p_from AND p_to
      GROUP BY type ORDER BY total DESC) r)
  ) INTO res;
  RETURN res;
END;
$$;

-- ── RPC: Log action ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_log_action(
  p_action TEXT, p_entity_type TEXT DEFAULT NULL, p_entity_id TEXT DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL, p_new_value JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE, p_error_msg TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  INSERT INTO admin_audit_logs(admin_id,admin_email,action,entity_type,entity_id,old_value,new_value,success,error_msg)
  SELECT auth.uid(),wu.email,p_action,p_entity_type,p_entity_id,p_old_value,p_new_value,p_success,p_error_msg
  FROM wise_users wu WHERE wu.id=auth.uid();
END;
$$;
