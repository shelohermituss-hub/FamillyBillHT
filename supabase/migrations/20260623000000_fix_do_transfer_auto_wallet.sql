-- Fix do_transfer: auto-find recipient wallet when p_to_account_id is NULL
-- and p_recipient_user_id is provided. This makes transfers work even when
-- the get_recipient_wallet RPC has not been called (or failed silently).

CREATE OR REPLACE FUNCTION public.do_transfer(
  p_from_account_id   UUID,
  p_to_account_id     UUID          DEFAULT NULL,
  p_recipient_user_id UUID          DEFAULT NULL,
  p_send_amount       NUMERIC       DEFAULT 0,
  p_fee               NUMERIC       DEFAULT 0,
  p_credit_amount     NUMERIC       DEFAULT 0,
  p_recipient_name    TEXT          DEFAULT NULL,
  p_note              TEXT          DEFAULT NULL,
  p_reference         TEXT          DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_user_id   UUID;
  v_from_balance   NUMERIC;
  v_from_currency  TEXT;
  v_total_debit    NUMERIC;
  v_tx_id          UUID;
  v_to_account_id  UUID;
  v_credit_amount  NUMERIC;
BEGIN
  v_total_debit   := p_send_amount + p_fee;
  v_to_account_id := p_to_account_id;
  v_credit_amount := CASE WHEN p_credit_amount > 0 THEN p_credit_amount ELSE p_send_amount - p_fee END;

  -- 1. Lock source account (FOR UPDATE prevents race conditions)
  SELECT user_id, balance, currency
  INTO   v_from_user_id, v_from_balance, v_from_currency
  FROM   currency_accounts
  WHERE  id = p_from_account_id
  FOR    UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Compte source introuvable.');
  END IF;

  -- 2. Verify ownership
  IF v_from_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé.');
  END IF;

  -- 3. Check balance
  IF v_from_balance < v_total_debit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format(
        'Solde insuffisant. Disponible : %s %s, Requis : %s %s.',
        v_from_balance::text, v_from_currency,
        v_total_debit::text,  v_from_currency
      )
    );
  END IF;

  -- 3b. Auto-find recipient wallet when to_account_id is not provided
  IF v_to_account_id IS NULL
     AND p_recipient_user_id IS NOT NULL
     AND p_recipient_user_id IS DISTINCT FROM auth.uid()
  THEN
    -- Prefer exact currency match
    SELECT id INTO v_to_account_id
    FROM currency_accounts
    WHERE user_id = p_recipient_user_id AND currency = v_from_currency
    LIMIT 1;

    -- Fallback: main wallet, then USD, then any
    IF v_to_account_id IS NULL THEN
      SELECT id INTO v_to_account_id
      FROM currency_accounts
      WHERE user_id = p_recipient_user_id
      ORDER BY is_main DESC, (currency = 'USD') DESC
      LIMIT 1;
    END IF;
  END IF;

  -- 4. Debit source account
  UPDATE currency_accounts
  SET    balance = balance - v_total_debit
  WHERE  id = p_from_account_id;

  -- 5. Credit destination account
  IF v_to_account_id IS NOT NULL THEN
    UPDATE currency_accounts
    SET    balance = balance + v_credit_amount
    WHERE  id = v_to_account_id;

    -- 6. Insert receive transaction for the recipient (cross-user transfers only)
    IF p_recipient_user_id IS NOT NULL
       AND p_recipient_user_id IS DISTINCT FROM auth.uid()
    THEN
      INSERT INTO transactions (
        user_id, type, status,
        amount, currency,
        fee, recipient_name, note, reference, completed_at
      )
      SELECT
        p_recipient_user_id, 'receive', 'completed',
        v_credit_amount, ca.currency,
        0, p_recipient_name, p_note, p_reference, now()
      FROM currency_accounts ca
      WHERE ca.id = v_to_account_id;
    END IF;
  END IF;

  -- 7. Insert send transaction for the sender
  INSERT INTO transactions (
    user_id, type, status,
    amount, currency,
    fee, recipient_name, note, reference, completed_at
  )
  VALUES (
    auth.uid(), 'send', 'completed',
    p_send_amount, v_from_currency,
    p_fee, p_recipient_name, p_note, p_reference, now()
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'tx_id', v_tx_id::text);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.do_transfer TO authenticated;
