-- SECURITY DEFINER function so authenticated users can look up another user's
-- wallet info without needing direct SELECT access on currency_accounts.
-- Returns the best wallet to credit for a given recipient + currency,
-- or their main wallet if no exact match exists.

CREATE OR REPLACE FUNCTION get_recipient_wallet(p_user_id uuid, p_currency text)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_row currency_accounts%ROWTYPE;
BEGIN
  -- Try exact currency match first
  SELECT * INTO v_row
  FROM currency_accounts
  WHERE user_id = p_user_id AND currency = p_currency
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id',          v_row.id,
      'user_id',     v_row.user_id,
      'currency',    v_row.currency,
      'is_main',     v_row.is_main,
      'exact_match', true
    );
  END IF;

  -- Fallback: main wallet first, then USD, then any wallet
  SELECT * INTO v_row
  FROM currency_accounts
  WHERE user_id = p_user_id
  ORDER BY is_main DESC, (currency = 'USD') DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id',          v_row.id,
      'user_id',     v_row.user_id,
      'currency',    v_row.currency,
      'is_main',     v_row.is_main,
      'exact_match', false
    );
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_recipient_wallet(uuid, text) TO authenticated;
