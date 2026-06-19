
-- Users table (extended profile)
CREATE TABLE IF NOT EXISTS wise_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Currency accounts (multi-currency balances)
CREATE TABLE IF NOT EXISTS currency_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance NUMERIC(20,4) DEFAULT 0,
  account_number TEXT,
  iban TEXT,
  sort_code TEXT,
  routing_number TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

-- Jars (savings pots)
CREATE TABLE IF NOT EXISTS jars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance NUMERIC(20,4) DEFAULT 0,
  goal NUMERIC(20,4),
  color TEXT DEFAULT '#9fe870',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'convert', 'deposit', 'withdraw')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  amount NUMERIC(20,4) NOT NULL,
  currency TEXT NOT NULL,
  target_amount NUMERIC(20,4),
  target_currency TEXT,
  exchange_rate NUMERIC(20,8),
  fee NUMERIC(20,4) DEFAULT 0,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_account TEXT,
  note TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE wise_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jars ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for wise_users
CREATE POLICY "select_own_user" ON wise_users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_user" ON wise_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_user" ON wise_users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_user" ON wise_users FOR DELETE TO authenticated USING (auth.uid() = id);

-- RLS policies for currency_accounts
CREATE POLICY "select_own_accounts" ON currency_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_accounts" ON currency_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_accounts" ON currency_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_accounts" ON currency_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS policies for jars
CREATE POLICY "select_own_jars" ON jars FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_jars" ON jars FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_jars" ON jars FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_jars" ON jars FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS policies for transactions
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
