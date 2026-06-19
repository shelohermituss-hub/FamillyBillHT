-- ============================================================
-- FamillyBill HT — Schéma complet de la base de données
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. Table des profils utilisateurs ──────────────────────
CREATE TABLE IF NOT EXISTS wise_users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Comptes multi-devises ────────────────────────────────
CREATE TABLE IF NOT EXISTS currency_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  currency       TEXT NOT NULL,
  balance        NUMERIC(20,4) DEFAULT 0,
  account_number TEXT,
  iban           TEXT,
  sort_code      TEXT,
  routing_number TEXT,
  is_main        BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

-- ── 3. Coffres d'épargne (Jars) ─────────────────────────────
CREATE TABLE IF NOT EXISTS jars (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  currency   TEXT NOT NULL,
  balance    NUMERIC(20,4) DEFAULT 0,
  goal       NUMERIC(20,4),
  color      TEXT DEFAULT '#dc1f1f',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('send','receive','convert','deposit','withdraw')),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  amount           NUMERIC(20,4) NOT NULL,
  currency         TEXT NOT NULL,
  target_amount    NUMERIC(20,4),
  target_currency  TEXT,
  exchange_rate    NUMERIC(20,8),
  fee              NUMERIC(20,4) DEFAULT 0,
  recipient_name   TEXT,
  recipient_email  TEXT,
  recipient_account TEXT,
  note             TEXT,
  reference        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

-- ── 5. Row Level Security ────────────────────────────────────
ALTER TABLE wise_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jars              ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions      ENABLE ROW LEVEL SECURITY;

-- wise_users
CREATE POLICY "own_user_select" ON wise_users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_user_insert" ON wise_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own_user_update" ON wise_users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_user_delete" ON wise_users FOR DELETE TO authenticated USING (auth.uid() = id);

-- currency_accounts
CREATE POLICY "own_accounts_select" ON currency_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_accounts_insert" ON currency_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_accounts_update" ON currency_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_accounts_delete" ON currency_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- jars
CREATE POLICY "own_jars_select" ON jars FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_jars_insert" ON jars FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_jars_update" ON jars FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_jars_delete" ON jars FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "own_tx_select" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_tx_insert" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_tx_update" ON transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_tx_delete" ON transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 6. Trigger : créer profil automatiquement à l'inscription ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wise_users (id, email, full_name, verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
