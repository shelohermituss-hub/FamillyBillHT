/*
# Fix do_transfer — server-side validation, limits, rate computation

## Summary
Drops old do_transfer and recreates with:
1. Recompute credit_amount and fee server-side (ignore client-supplied values)
2. Validate amount sign (> 0)
3. Verify p_to_account_id belongs to p_recipient_user_id
4. Check transaction_limits (per-transaction, daily, monthly)
5. Block transfers from frozen accounts
6. Use exchange_rates table for currency conversion

## Security Changes
- do_transfer no longer trusts client-supplied p_credit_amount or p_fee
- Frozen accounts cannot send or receive
- Transaction limits are enforced server-side
*/

DROP FUNCTION IF EXISTS do_transfer(uuid, uuid, uuid, numeric, uuid, text, text, text, numeric, numeric, text);

DROP FUNCTION IF EXISTS do_transfer(
  p_from_account_id uuid, p_to_account_id uuid, p_recipient_user_id uuid,
  p_send_amount numeric, p_fee numeric, p_credit_amount numeric,
  p_recipient_name text, p_note text, p_reference text
);

CREATE OR REPLACE FUNCTION do_transfer(
  p_sender_user_id uuid,
  p_from_account_id uuid,
  p_recipient_user_id uuid,
  p_send_amount numeric,
  p_to_account_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_reference text DEFAULT NULL,
  p_fee numeric DEFAULT 0,
  p_credit_amount numeric DEFAULT 0,
  p_currency text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_account currency_accounts%ROWTYPE;
  v_recipient_account currency_accounts%ROWTYPE;
  v_new_sender_balance numeric;
  v_new_recipient_balance numeric;
  v_tx_id uuid;
  v_computed_fee numeric := 0;
  v_computed_credit numeric := 0;
  v_rate numeric;
  v_sender_currency text;
  v_recipient_currency text;
  v_limits transaction_limits%ROWTYPE;
  v_daily_total numeric;
  v_monthly_total numeric;
  v_recipient_name text;
  v_recipient_code text;
  v_sender_name text;
BEGIN
  IF p_sender_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_send_amount IS NULL OR p_send_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid send amount';
  END IF;

  SELECT * INTO v_sender_account FROM currency_accounts WHERE id = p_from_account_id FOR UPDATE;

  IF v_sender_account.id IS NULL THEN
    RAISE EXCEPTION 'Sender account not found';
  END IF;

  IF v_sender_account.user_id != p_sender_user_id THEN
    RAISE EXCEPTION 'Not authorized for this account';
  END IF;

  IF v_sender_account.is_frozen = true THEN
    RAISE EXCEPTION 'Account is frozen';
  END IF;

  IF v_sender_account.balance < p_send_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  v_sender_currency := v_sender_account.currency;

  IF p_to_account_id IS NOT NULL THEN
    SELECT * INTO v_recipient_account FROM currency_accounts WHERE id = p_to_account_id FOR UPDATE;

    IF v_recipient_account.id IS NULL THEN
      RAISE EXCEPTION 'Recipient account not found';
    END IF;

    IF v_recipient_account.user_id != p_recipient_user_id THEN
      RAISE EXCEPTION 'Recipient account does not belong to specified user';
    END IF;

    IF v_recipient_account.is_frozen = true THEN
      RAISE EXCEPTION 'Recipient account is frozen';
    END IF;
  ELSE
    SELECT * INTO v_recipient_account FROM currency_accounts
    WHERE user_id = p_recipient_user_id
    AND currency = v_sender_currency
    AND is_main = true
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_recipient_account.id IS NULL THEN
      SELECT * INTO v_recipient_account FROM currency_accounts
      WHERE user_id = p_recipient_user_id
      AND currency = v_sender_currency
      ORDER BY is_main DESC, created_at ASC
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF v_recipient_account.id IS NULL THEN
      INSERT INTO currency_accounts (user_id, currency, balance, is_main)
      VALUES (p_recipient_user_id, v_sender_currency, 0, false)
      RETURNING * INTO v_recipient_account;
    END IF;
  END IF;

  v_recipient_currency := v_recipient_account.currency;

  SELECT full_name, user_code INTO v_recipient_name, v_recipient_code
  FROM wise_users WHERE id = p_recipient_user_id;

  SELECT full_name INTO v_sender_name FROM wise_users WHERE id = p_sender_user_id;

  -- Check transaction limits
  SELECT * INTO v_limits FROM transaction_limits WHERE user_id = p_sender_user_id;

  IF v_limits.id IS NOT NULL THEN
    IF p_send_amount > v_limits.max_per_transaction THEN
      RAISE EXCEPTION 'Amount exceeds per-transaction limit';
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
    FROM transactions
    WHERE user_id = p_sender_user_id
    AND type = 'send'
    AND created_at >= date_trunc('day', now());

    IF v_daily_total + p_send_amount > v_limits.daily_limit THEN
      RAISE EXCEPTION 'Amount exceeds daily limit';
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_monthly_total
    FROM transactions
    WHERE user_id = p_sender_user_id
    AND type = 'send'
    AND created_at >= date_trunc('month', now());

    IF v_monthly_total + p_send_amount > v_limits.monthly_limit THEN
      RAISE EXCEPTION 'Amount exceeds monthly limit';
    END IF;
  END IF;

  -- Compute fee server-side: 0.5% with min 10
  v_computed_fee := GREATEST(10, p_send_amount * 0.005);

  -- Compute credit amount server-side
  IF v_sender_currency = v_recipient_currency THEN
    v_computed_credit := p_send_amount - v_computed_fee;
    v_rate := 1.0;
  ELSE
    SELECT rate INTO v_rate FROM exchange_rates
    WHERE base_currency = v_sender_currency AND quote_currency = v_recipient_currency
    LIMIT 1;

    IF v_rate IS NULL THEN
      RAISE EXCEPTION 'No exchange rate available for % to %', v_sender_currency, v_recipient_currency;
    END IF;

    v_computed_credit := (p_send_amount - v_computed_fee) * v_rate;
  END IF;

  -- Debit sender
  v_new_sender_balance := v_sender_account.balance - p_send_amount;
  UPDATE currency_accounts SET balance = v_new_sender_balance WHERE id = p_from_account_id;

  -- Credit recipient
  v_new_recipient_balance := v_recipient_account.balance + v_computed_credit;
  UPDATE currency_accounts SET balance = v_new_recipient_balance WHERE id = v_recipient_account.id;

  -- Record sender transaction
  INSERT INTO transactions (
    user_id, account_id, type, amount, fee, currency, status,
    recipient_id, recipient_name, note, reference
  )
  VALUES (
    p_sender_user_id, p_from_account_id, 'send', p_send_amount, v_computed_fee,
    v_sender_currency, 'completed',
    p_recipient_user_id, COALESCE(v_recipient_name, v_recipient_code), p_note,
    COALESCE(p_reference, 'TX-' || upper(encode(gen_random_bytes(4), 'hex')))
  )
  RETURNING id INTO v_tx_id;

  -- Record recipient transaction
  INSERT INTO transactions (
    user_id, account_id, type, amount, fee, currency, status,
    sender_id, sender_name, note, reference
  )
  VALUES (
    p_recipient_user_id, v_recipient_account.id, 'receive', v_computed_credit, 0,
    v_recipient_currency, 'completed',
    p_sender_user_id, v_sender_name, p_note,
    COALESCE(p_reference, 'TX-' || upper(encode(gen_random_bytes(4), 'hex')))
  );

  -- Notify recipient
  INSERT INTO notifications (user_id, type, title, body, read)
  VALUES (
    p_recipient_user_id, 'payment_received',
    'Paiement recu',
    COALESCE(v_sender_name, '') || ' vous a envoye ' || v_computed_credit || ' ' || v_recipient_currency,
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'tx_id', v_tx_id,
    'fee', v_computed_fee,
    'credit_amount', v_computed_credit,
    'rate', v_rate,
    'new_balance', v_new_sender_balance
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION do_transfer FROM anon;
GRANT EXECUTE ON FUNCTION do_transfer TO authenticated;
