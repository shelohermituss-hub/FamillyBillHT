/*
# Security Lockdown — RLS WITH CHECK, Column Privileges, PII Protection

## Summary
This migration fixes all critical security findings from the audit:
1. Adds WITH CHECK to every UPDATE policy (10 tables) to prevent privilege escalation
2. Revokes broad UPDATE on wise_users, currency_accounts, transactions, transaction_limits — only allow specific columns
3. Replaces wise_users SELECT (true) with owner-only access
4. Creates search_users_by_code SECURITY DEFINER function for contact search (returns only id, full_name, user_code, avatar_url)
5. Creates update_user_profile SECURITY DEFINER function with field allowlist
6. Fixes SECURITY DEFINER views (user_balances_summary, unread_notification_counts)
7. Fixes handle_new_user_limits search_path

## Security Changes
- All UPDATE policies now have WITH CHECK matching their USING clause
- wise_users: SELECT restricted to own row, UPDATE restricted to 5 columns via column privileges
- currency_accounts: balance column no longer client-writable
- transactions: amount/status/fee/recipient columns no longer client-writable
- transaction_limits: no client UPDATE at all
- New search_users_by_code function replaces direct wise_users SELECT for contact search
- New update_user_profile function replaces direct wise_users UPDATE for profile editing

## Important Notes
1. The frontend must be updated to call search_users_by_code() instead of selecting wise_users directly
2. The frontend must call update_user_profile() instead of updating wise_users directly
3. These changes may break existing frontend code until it is updated
*/

-- ============================================================
-- 1. ADD WITH CHECK TO ALL UPDATE POLICIES
-- ============================================================

-- wise_users
DROP POLICY IF EXISTS "wise_users_update" ON wise_users;
CREATE POLICY "wise_users_update" ON wise_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- currency_accounts
DROP POLICY IF EXISTS "currency_accounts_update" ON currency_accounts;
CREATE POLICY "currency_accounts_update" ON currency_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update" ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transaction_limits
DROP POLICY IF EXISTS "transaction_limits_update" ON transaction_limits;
CREATE POLICY "transaction_limits_update" ON transaction_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- beneficiaries
DROP POLICY IF EXISTS "beneficiaries_update" ON beneficiaries;
CREATE POLICY "beneficiaries_update" ON beneficiaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- bill_payments
DROP POLICY IF EXISTS "bill_payments_update" ON bill_payments;
CREATE POLICY "bill_payments_update" ON bill_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- jars
DROP POLICY IF EXISTS "jars_update" ON jars;
CREATE POLICY "jars_update" ON jars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- family_wallets
DROP POLICY IF EXISTS "fw_update" ON family_wallets;
CREATE POLICY "fw_update" ON family_wallets FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- family_wallet_members
DROP POLICY IF EXISTS "fwm_update_as_creator" ON family_wallet_members;
CREATE POLICY "fwm_update_as_creator" ON family_wallet_members FOR UPDATE
  TO authenticated
  USING (fw_get_creator(wallet_id) = auth.uid())
  WITH CHECK (fw_get_creator(wallet_id) = auth.uid());

-- ============================================================
-- 2. RESTRICT wise_users SELECT TO OWN ROW ONLY
-- ============================================================

DROP POLICY IF EXISTS "wise_users_select" ON wise_users;
CREATE POLICY "wise_users_select" ON wise_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- 3. COLUMN-LEVEL PRIVILEGES — Revoke broad UPDATE, grant only safe columns
-- ============================================================

-- wise_users: only allow updating profile fields, NOT verified/user_code/email/is_admin/kyc_status
REVOKE UPDATE ON wise_users FROM authenticated;
GRANT UPDATE (full_name, phone, country, address, avatar_url) ON wise_users TO authenticated;

-- currency_accounts: do NOT allow client to update balance
REVOKE UPDATE ON currency_accounts FROM authenticated;
GRANT UPDATE (is_main, card_style, wallet_settings) ON currency_accounts TO authenticated;

-- transactions: make history immutable from client (no UPDATE at all on financial columns)
REVOKE UPDATE ON transactions FROM authenticated;

-- transaction_limits: completely revoke client UPDATE
REVOKE UPDATE ON transaction_limits FROM authenticated;

-- ============================================================
-- 4. ADD is_frozen, kyc_status, is_admin, date_of_birth COLUMNS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currency_accounts' AND column_name = 'is_frozen') THEN
    ALTER TABLE currency_accounts ADD COLUMN is_frozen boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wise_users' AND column_name = 'kyc_status') THEN
    ALTER TABLE wise_users ADD COLUMN kyc_status text NOT NULL DEFAULT 'unverified';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wise_users' AND column_name = 'is_admin') THEN
    ALTER TABLE wise_users ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wise_users' AND column_name = 'date_of_birth') THEN
    ALTER TABLE wise_users ADD COLUMN date_of_birth date;
  END IF;
END $$;

-- ============================================================
-- 5. search_users_by_code — SECURITY DEFINER for contact search
-- ============================================================

CREATE OR REPLACE FUNCTION search_users_by_code(p_search text)
RETURNS TABLE (
  id uuid,
  full_name text,
  user_code text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only authenticated users can search
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Search by user_code (case-insensitive) or name (case-insensitive)
  -- Only return active users, never return self, limit to 20 results
  RETURN QUERY
  SELECT u.id, u.full_name, u.user_code, u.avatar_url
  FROM wise_users u
  WHERE u.id != auth.uid()
    AND (
      u.user_code ILIKE '%' || p_search || '%'
      OR u.full_name ILIKE '%' || p_search || '%'
    )
  LIMIT 20;
END;
$$;

REVOKE EXECUTE ON FUNCTION search_users_by_code FROM anon;
GRANT EXECUTE ON FUNCTION search_users_by_code TO authenticated;

-- ============================================================
-- 6. update_user_profile — SECURITY DEFINER with field allowlist
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_profile(
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updates jsonb := '{}'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Build update object with only non-null fields
  IF p_full_name IS NOT NULL THEN
    v_updates := v_updates || jsonb_build_object('full_name', p_full_name);
  END IF;
  IF p_phone IS NOT NULL THEN
    v_updates := v_updates || jsonb_build_object('phone', p_phone);
  END IF;
  IF p_country IS NOT NULL THEN
    v_updates := v_updates || jsonb_build_object('country', p_country);
  END IF;
  IF p_address IS NOT NULL THEN
    v_updates := v_updates || jsonb_build_object('address', p_address);
  END IF;
  IF p_avatar_url IS NOT NULL THEN
    v_updates := v_updates || jsonb_build_object('avatar_url', p_avatar_url);
  END IF;
  IF p_date_of_birth IS NOT NULL THEN
    v_updates := v_updates || jsonb_build_object('date_of_birth', p_date_of_birth);
  END IF;

  IF v_updates = '{}'::jsonb THEN
    RETURN jsonb_build_object('success', true, 'message', 'No changes');
  END IF;

  UPDATE wise_users SET updated_at = now() WHERE id = auth.uid();

  -- Apply updates using dynamic SQL with jsonb
  EXECUTE format('UPDATE wise_users SET %s WHERE id = $1', (
    SELECT string_agg(key || ' = $2.' || key, ', ')
    FROM jsonb_object_keys(v_updates) AS key
  ))
  USING auth.uid(), v_updates;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION update_user_profile FROM anon;
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;

-- ============================================================
-- 7. Fix SECURITY DEFINER views
-- ============================================================

-- Recreate user_balances_summary as SECURITY INVOKER
DROP VIEW IF EXISTS user_balances_summary;
CREATE VIEW user_balances_summary AS
SELECT
  ca.user_id,
  ca.currency,
  ca.balance,
  ca.is_main,
  ca.is_frozen,
  -- Convert balance to USD using static rates (will be replaced by exchange_rates table later)
  CASE
    WHEN ca.currency = 'USD' THEN ca.balance
    WHEN ca.currency = 'HTG' THEN ca.balance * 0.0074
    WHEN ca.currency = 'EUR' THEN ca.balance * 1.08
    WHEN ca.currency = 'CAD' THEN ca.balance * 0.72
    WHEN ca.currency = 'BRL' THEN ca.balance * 0.20
    ELSE ca.balance
  END AS balance_usd
FROM currency_accounts ca
WHERE ca.user_id = auth.uid();

ALTER TABLE user_balances_summary SET (security_invoker = true);

-- Recreate unread_notification_counts as SECURITY INVOKER
DROP VIEW IF EXISTS unread_notification_counts;
CREATE VIEW unread_notification_counts AS
SELECT
  user_id,
  COUNT(*)::int AS unread_count
FROM notifications
WHERE read = false
  AND user_id = auth.uid()
GROUP BY user_id;

ALTER TABLE unread_notification_counts SET (security_invoker = true);

-- ============================================================
-- 8. Fix handle_new_user_limits search_path
-- ============================================================

-- The function was created without SET search_path; we need to recreate it
-- First find its definition and recreate with search_path
CREATE OR REPLACE FUNCTION handle_new_user_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO transaction_limits (user_id, max_per_transaction, daily_limit, monthly_limit)
  VALUES (NEW.id, 50000, 100000, 500000);
  RETURN NEW;
END;
$$;

-- ============================================================
-- 9. Add is_frozen check to currency_accounts SELECT policy
-- (existing SELECT policy already uses auth.uid() = user_id, which is correct)
-- ============================================================

-- ============================================================
-- 10. Create exchange_rates table
-- ============================================================

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  rate numeric(18,8) NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_currency, quote_currency)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_rates_select" ON exchange_rates;
CREATE POLICY "exchange_rates_select" ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial static rates (will be updated by edge function)
INSERT INTO exchange_rates (base_currency, quote_currency, rate) VALUES
  ('USD', 'HTG', 135.00),
  ('HTG', 'USD', 0.00741),
  ('USD', 'EUR', 0.92),
  ('EUR', 'USD', 1.087),
  ('USD', 'CAD', 1.39),
  ('CAD', 'USD', 0.72),
  ('USD', 'BRL', 5.00),
  ('BRL', 'USD', 0.20),
  ('EUR', 'HTG', 146.7),
  ('HTG', 'EUR', 0.00682),
  ('CAD', 'HTG', 187.5),
  ('HTG', 'CAD', 0.00533),
  ('BRL', 'HTG', 27.0),
  ('HTG', 'BRL', 0.0370),
  ('EUR', 'CAD', 1.51),
  ('CAD', 'EUR', 0.662),
  ('EUR', 'BRL', 5.43),
  ('BRL', 'EUR', 0.184),
  ('CAD', 'BRL', 3.59),
  ('BRL', 'CAD', 0.279)
ON CONFLICT (base_currency, quote_currency) DO UPDATE SET rate = EXCLUDED.rate, fetched_at = now();

-- ============================================================
-- 11. get_server_rate function
-- ============================================================

CREATE OR REPLACE FUNCTION get_server_rate(p_from text, p_to text)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rate FROM exchange_rates
  WHERE base_currency = p_from AND quote_currency = p_to
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION get_server_rate FROM anon;
GRANT EXECUTE ON FUNCTION get_server_rate TO authenticated;

-- ============================================================
-- 12. Support tickets tables
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_select_own" ON support_tickets;
CREATE POLICY "support_tickets_select_own" ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "support_tickets_insert_own" ON support_tickets;
CREATE POLICY "support_tickets_insert_own" ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "support_tickets_update_own" ON support_tickets;
CREATE POLICY "support_tickets_update_own" ON support_tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_from_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages on their own tickets
DROP POLICY IF EXISTS "support_messages_select_own" ON support_messages;
CREATE POLICY "support_messages_select_own" ON support_messages FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
  );

-- Users can insert messages on their own tickets
DROP POLICY IF EXISTS "support_messages_insert_own" ON support_messages;
CREATE POLICY "support_messages_insert_own" ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    AND is_from_admin = false
  );

-- Admin can read all tickets and messages (via SECURITY DEFINER functions later)
-- For now, admin reads through a separate function

-- ============================================================
-- 13. Admin functions (SECURITY DEFINER, admin-only)
-- ============================================================

CREATE OR REPLACE FUNCTION admin_list_tickets()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  subject text,
  status text,
  priority text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM wise_users WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT t.id, t.user_id, u.full_name, t.subject, t.status, t.priority, t.created_at, t.updated_at
  FROM support_tickets t
  JOIN wise_users u ON u.id = t.user_id
  ORDER BY t.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_list_tickets FROM anon;
GRANT EXECUTE ON FUNCTION admin_list_tickets TO authenticated;

CREATE OR REPLACE FUNCTION admin_reply_ticket(p_ticket_id uuid, p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM wise_users WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO support_messages (ticket_id, user_id, message, is_from_admin)
  SELECT p_ticket_id, t.user_id, p_message, true
  FROM support_tickets t WHERE t.id = p_ticket_id;

  UPDATE support_tickets SET status = 'replied', updated_at = now() WHERE id = p_ticket_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_reply_ticket FROM anon;
GRANT EXECUTE ON FUNCTION admin_reply_ticket TO authenticated;

CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  user_code text,
  verified boolean,
  kyc_status text,
  is_admin boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM wise_users WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT id, full_name, email, user_code, verified, kyc_status, is_admin, created_at
  FROM wise_users
  ORDER BY created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_list_users FROM anon;
GRANT EXECUTE ON FUNCTION admin_list_users TO authenticated;

-- ============================================================
-- 14. create_user_account — atomic user creation
-- ============================================================

CREATE OR REPLACE FUNCTION create_user_account(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert wise_users row
  INSERT INTO wise_users (id, email, full_name, phone, country, date_of_birth, verified, kyc_status, is_admin)
  VALUES (p_user_id, p_email, p_full_name, p_phone, p_country, p_date_of_birth, false, 'unverified', false)
  ON CONFLICT (id) DO NOTHING;

  -- Insert default USD account
  INSERT INTO currency_accounts (user_id, currency, balance, is_main)
  VALUES (p_user_id, 'USD', 0, true)
  ON CONFLICT DO NOTHING;

  -- Insert default transaction limits
  INSERT INTO transaction_limits (user_id, max_per_transaction, daily_limit, monthly_limit)
  VALUES (p_user_id, 50000, 100000, 500000)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION create_user_account FROM anon;
GRANT EXECUTE ON FUNCTION create_user_account TO authenticated;

-- ============================================================
-- 15. process_deposit — server-side deposit validation
-- ============================================================

CREATE OR REPLACE FUNCTION process_deposit(
  p_account_id uuid,
  p_amount numeric,
  p_payment_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account currency_accounts%ROWTYPE;
  v_new_balance numeric;
  v_tx_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Invalid deposit amount';
  END IF;

  -- Get account and verify ownership
  SELECT * INTO v_account FROM currency_accounts WHERE id = p_account_id FOR UPDATE;

  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_account.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_account.is_frozen = true THEN
    RAISE EXCEPTION 'Account is frozen';
  END IF;

  -- Update balance
  v_new_balance := v_account.balance + p_amount;
  UPDATE currency_accounts SET balance = v_new_balance WHERE id = p_account_id;

  -- Record transaction
  INSERT INTO transactions (user_id, account_id, type, amount, currency, status, description, reference)
  VALUES (
    auth.uid(), p_account_id, 'deposit', p_amount, v_account.currency, 'completed',
    'Deposit', COALESCE(p_payment_reference, 'DEP-' || upper(encode(gen_random_bytes(4), 'hex')))
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'new_balance', v_new_balance);
END;
$$;

REVOKE EXECUTE ON FUNCTION process_deposit FROM anon;
GRANT EXECUTE ON FUNCTION process_deposit TO authenticated;

-- ============================================================
-- 16. pay_bill — atomic bill payment RPC
-- ============================================================

CREATE OR REPLACE FUNCTION pay_bill(
  p_user_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_currency text,
  p_provider text,
  p_category text,
  p_account_ref text,
  p_fields jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account currency_accounts%ROWTYPE;
  v_new_balance numeric;
  v_tx_id uuid;
  v_bill_id uuid;
  v_fee numeric := 0;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Get account and lock for update
  SELECT * INTO v_account FROM currency_accounts WHERE id = p_account_id FOR UPDATE;

  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_account.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_account.is_frozen = true THEN
    RAISE EXCEPTION 'Account is frozen';
  END IF;

  IF v_account.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Debit the wallet
  v_new_balance := v_account.balance - p_amount;
  UPDATE currency_accounts SET balance = v_new_balance WHERE id = p_account_id;

  -- Record transaction
  INSERT INTO transactions (
    user_id, account_id, type, amount, fee, currency, status,
    recipient_name, note, reference
  )
  VALUES (
    p_user_id, p_account_id, 'bill_payment', p_amount, v_fee, p_currency, 'completed',
    p_provider, p_category, 'BILL-' || upper(encode(gen_random_bytes(4), 'hex'))
  )
  RETURNING id INTO v_tx_id;

  -- Record bill payment
  INSERT INTO bill_payments (
    user_id, transaction_id, provider, category, account_ref, amount, currency, status
  )
  VALUES (
    p_user_id, v_tx_id, p_provider, p_category, p_account_ref, p_amount, p_currency, 'completed'
  )
  RETURNING id INTO v_bill_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'bill_payment_id', v_bill_id,
    'new_balance', v_new_balance
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION pay_bill FROM anon;
GRANT EXECUTE ON FUNCTION pay_bill TO authenticated;

-- ============================================================
-- 17. freeze_account / unfreeze_account
-- ============================================================

CREATE OR REPLACE FUNCTION freeze_account(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM currency_accounts WHERE id = p_account_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE currency_accounts SET is_frozen = true WHERE id = p_account_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION freeze_account FROM anon;
GRANT EXECUTE ON FUNCTION freeze_account TO authenticated;

CREATE OR REPLACE FUNCTION unfreeze_account(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM currency_accounts WHERE id = p_account_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF v_owner != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE currency_accounts SET is_frozen = false WHERE id = p_account_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION unfreeze_account FROM anon;
GRANT EXECUTE ON FUNCTION unfreeze_account TO authenticated;

-- ============================================================
-- 18. delete_user_account — real account deletion
-- ============================================================

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete family wallet memberships
  DELETE FROM family_wallet_members WHERE user_id = v_user_id;

  -- Delete family wallets created by user
  DELETE FROM family_wallets WHERE creator_id = v_user_id;

  -- Delete beneficiaries
  DELETE FROM beneficiaries WHERE user_id = v_user_id;

  -- Delete bill payments
  DELETE FROM bill_payments WHERE user_id = v_user_id;

  -- Delete support messages and tickets
  DELETE FROM support_messages WHERE user_id = v_user_id;
  DELETE FROM support_tickets WHERE user_id = v_user_id;

  -- Delete notifications
  DELETE FROM notifications WHERE user_id = v_user_id;

  -- Delete transactions
  DELETE FROM transactions WHERE user_id = v_user_id;

  -- Delete jars
  DELETE FROM jars WHERE user_id = v_user_id;

  -- Delete currency accounts
  DELETE FROM currency_accounts WHERE user_id = v_user_id;

  -- Delete transaction limits
  DELETE FROM transaction_limits WHERE user_id = v_user_id;

  -- Delete wise_users row
  DELETE FROM wise_users WHERE id = v_user_id;

  -- Delete auth user (this also invalidates the session)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION delete_user_account FROM anon;
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;

-- ============================================================
-- 19. set_transaction_pin / verify_transaction_pin
-- ============================================================

CREATE TABLE IF NOT EXISTS transaction_pins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transaction_pins ENABLE ROW LEVEL SECURITY;

-- No SELECT/UPDATE/DELETE policies — only SECURITY DEFINER functions can access
DROP POLICY IF EXISTS "transaction_pins_no_select" ON transaction_pins;
-- No policies at all = locked down

CREATE OR REPLACE FUNCTION set_transaction_pin(p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_pin IS NULL OR length(p_pin) < 4 OR length(p_pin) > 6 OR NOT p_pin ~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Invalid PIN format';
  END IF;

  -- Store a simple hash (in production, use bcrypt/argon2 via pg_crypto or a Supabase function)
  INSERT INTO transaction_pins (user_id, pin_hash, updated_at)
  VALUES (auth.uid(), crypt(p_pin, gen_salt('bf')), now())
  ON CONFLICT (user_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION set_transaction_pin FROM anon;
GRANT EXECUTE ON FUNCTION set_transaction_pin TO authenticated;

CREATE OR REPLACE FUNCTION verify_transaction_pin(p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT pin_hash INTO v_hash FROM transaction_pins WHERE user_id = auth.uid();

  IF v_hash IS NULL THEN
    -- No PIN set — return false (must set PIN first)
    RETURN false;
  END IF;

  RETURN crypt(p_pin, v_hash) = v_hash;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_transaction_pin FROM anon;
GRANT EXECUTE ON FUNCTION verify_transaction_pin TO authenticated;

CREATE OR REPLACE FUNCTION has_transaction_pin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COUNT(*) INTO v_count FROM transaction_pins WHERE user_id = auth.uid();
  RETURN v_count > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION has_transaction_pin FROM anon;
GRANT EXECUTE ON FUNCTION has_transaction_pin TO authenticated;
