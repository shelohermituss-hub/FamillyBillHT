-- ── User code column ──────────────────────────────────────────────────────────
ALTER TABLE wise_users
  ADD COLUMN IF NOT EXISTS user_code TEXT;

-- Unique index (not constraint to allow NULL for existing rows)
CREATE UNIQUE INDEX IF NOT EXISTS wise_users_user_code_idx
  ON wise_users (user_code)
  WHERE user_code IS NOT NULL;

-- Generate codes for existing users who don't have one
UPDATE wise_users
SET user_code = 'FB' || upper(substr(md5(random()::text || id::text), 1, 6))
WHERE user_code IS NULL;

-- ── Family wallet tables ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  balance     NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'HTG',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_wallet_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id    UUID NOT NULL REFERENCES family_wallets(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code    TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  view_balance BOOLEAN NOT NULL DEFAULT TRUE,
  pay_bills    BOOLEAN NOT NULL DEFAULT FALSE,
  withdraw     BOOLEAN NOT NULL DEFAULT FALSE,
  transfer     BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_id, user_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE family_wallets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_wallet_members  ENABLE ROW LEVEL SECURITY;

-- family_wallets: creators and members can read
CREATE POLICY "read own or member wallets" ON family_wallets
  FOR SELECT USING (
    creator_id = auth.uid()
    OR id IN (
      SELECT wallet_id FROM family_wallet_members WHERE user_id = auth.uid()
    )
  );

-- Only creator can insert/update/delete a wallet
CREATE POLICY "creator insert wallet" ON family_wallets
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "creator update wallet" ON family_wallets
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "creator delete wallet" ON family_wallets
  FOR DELETE USING (creator_id = auth.uid());

-- family_wallet_members: creator of wallet or the member themselves can read
CREATE POLICY "read members" ON family_wallet_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR wallet_id IN (
      SELECT id FROM family_wallets WHERE creator_id = auth.uid()
    )
  );

-- Only creator can insert/update/delete members
CREATE POLICY "creator manage members" ON family_wallet_members
  FOR INSERT WITH CHECK (
    wallet_id IN (SELECT id FROM family_wallets WHERE creator_id = auth.uid())
  );

CREATE POLICY "creator update members" ON family_wallet_members
  FOR UPDATE USING (
    wallet_id IN (SELECT id FROM family_wallets WHERE creator_id = auth.uid())
  );

CREATE POLICY "creator delete members" ON family_wallet_members
  FOR DELETE USING (
    wallet_id IN (SELECT id FROM family_wallets WHERE creator_id = auth.uid())
  );
