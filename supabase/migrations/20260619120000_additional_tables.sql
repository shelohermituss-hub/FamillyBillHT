-- ============================================================
-- FamillyBill HT — Tables supplémentaires
-- beneficiaries, transaction_limits, notifications, bill_payments
-- ============================================================

-- ── 1. Bénéficiaires ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beneficiaries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  account_number   TEXT,
  bank_name        TEXT,
  currency         TEXT NOT NULL DEFAULT 'HTG',
  country          TEXT,
  is_favorite      BOOLEAN DEFAULT FALSE,
  avatar_url       TEXT,
  last_sent_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT beneficiaries_user_id_name_key UNIQUE (user_id, name)
);

-- ── 2. Limites de transaction ────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_limits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE UNIQUE,
  per_transaction  NUMERIC(20,4) DEFAULT 10000,
  daily_limit      NUMERIC(20,4) DEFAULT 50000,
  monthly_limit    NUMERIC(20,4) DEFAULT 200000,
  currency         TEXT NOT NULL DEFAULT 'HTG',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
                'transfer_sent', 'transfer_received', 'transfer_failed',
                'deposit', 'withdrawal', 'bill_paid', 'rate_alert',
                'security', 'system', 'promotion'
              )),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON notifications (user_id, read) WHERE read = FALSE;

-- ── 4. Paiements de factures ────────────────────────────────
CREATE TABLE IF NOT EXISTS bill_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  transaction_id  UUID REFERENCES transactions(id),
  provider_id     TEXT NOT NULL,
  provider_name   TEXT NOT NULL,
  category        TEXT NOT NULL,
  account_ref     TEXT,
  amount          NUMERIC(20,4) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'HTG',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Mettre à jour le CHECK sur transactions.type ──────────
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('send','receive','convert','deposit','withdraw','bill_payment'));

-- ── 6. RLS ──────────────────────────────────────────────────
ALTER TABLE beneficiaries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_limits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments       ENABLE ROW LEVEL SECURITY;

-- beneficiaries
CREATE POLICY "own_beneficiaries_select" ON beneficiaries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_beneficiaries_insert" ON beneficiaries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_beneficiaries_update" ON beneficiaries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_beneficiaries_delete" ON beneficiaries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- transaction_limits
CREATE POLICY "own_limits_select" ON transaction_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_limits_insert" ON transaction_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_limits_update" ON transaction_limits FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- notifications
CREATE POLICY "own_notif_select" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_notif_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_notif_update" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_notif_delete" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- bill_payments
CREATE POLICY "own_bills_select" ON bill_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_bills_insert" ON bill_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_bills_update" ON bill_payments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ── 7. Trigger : insérer limites par défaut à l'inscription ──
CREATE OR REPLACE FUNCTION public.handle_new_user_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.transaction_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_wise_user_created_limits ON wise_users;
CREATE TRIGGER on_wise_user_created_limits
  AFTER INSERT ON wise_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_limits();

-- ── 8. Vue : notifications non lues par utilisateur ──────────
CREATE OR REPLACE VIEW unread_notification_counts AS
SELECT user_id, COUNT(*) AS unread_count
FROM notifications
WHERE read = FALSE
GROUP BY user_id;
