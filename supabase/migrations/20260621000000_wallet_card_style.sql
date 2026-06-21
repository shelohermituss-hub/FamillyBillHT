-- ============================================================
-- FamillyBill HT — Wallet card_style column + wallet_settings
-- ============================================================

-- Add card_style column to currency_accounts
-- Stores which gradient design the user chose for this wallet
ALTER TABLE currency_accounts
  ADD COLUMN IF NOT EXISTS card_style TEXT DEFAULT 'purple';

-- Add wallet_settings jsonb for per-wallet toggle states
-- Avoids cluttering localStorage; survives device changes
ALTER TABLE currency_accounts
  ADD COLUMN IF NOT EXISTS wallet_settings JSONB DEFAULT '{}'::jsonb;

-- Example wallet_settings keys:
--   { "frozen": false, "online_payment": true, "limit_enabled": false, "apple_pay": false }

-- Update RLS: existing policies already cover these new columns
-- (policies are at row level, not column level — no changes needed)

-- Refresh the updated_at for existing rows to trigger client re-fetch if needed
-- (no-op if updated_at column doesn't exist — safe to run)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'currency_accounts' AND column_name = 'updated_at'
  ) THEN
    UPDATE currency_accounts SET updated_at = NOW();
  END IF;
END $$;
