-- Fix 1: Ensure country column exists (idempotent)
ALTER TABLE wise_users ADD COLUMN IF NOT EXISTS country TEXT;
CREATE INDEX IF NOT EXISTS wise_users_country_idx ON wise_users(country) WHERE country IS NOT NULL;

-- Fix 2: Re-create admin_get_users with safe country reference
CREATE OR REPLACE FUNCTION admin_get_users(
  p_page INT DEFAULT 1, p_limit INT DEFAULT 20,
  p_search TEXT DEFAULT NULL, p_role TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE off INT := (p_page-1)*p_limit; res JSON;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT json_build_object(
    'data', (SELECT COALESCE(json_agg(u),'[]'::json) FROM (
      SELECT wu.id, wu.email, wu.full_name, wu.avatar_url, wu.verified, wu.role, wu.created_at,
             wu.phone,
             (SELECT column_default FROM information_schema.columns
              WHERE table_name='wise_users' AND column_name='country' LIMIT 1
              ) IS NOT NULL AS _has_country,
             CASE WHEN EXISTS(
               SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='wise_users' AND column_name='country'
             ) THEN (SELECT country FROM wise_users wx WHERE wx.id=wu.id) ELSE NULL END AS country,
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

-- Fix 3: Notification trigger — auto-create when transaction completes
CREATE OR REPLACE FUNCTION notify_on_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  notif_title TEXT;
  notif_body TEXT;
  notif_type TEXT;
BEGIN
  -- Only fire on status becoming 'completed'
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status <> 'completed') THEN
    IF NEW.type = 'send' THEN
      notif_type  := 'transfer_sent';
      notif_title := 'Virement envoyé';
      notif_body  := 'Votre virement de ' || NEW.amount || ' ' || NEW.currency ||
        CASE WHEN NEW.recipient_name IS NOT NULL THEN ' à ' || NEW.recipient_name ELSE '' END || ' a été effectué.';
    ELSIF NEW.type = 'receive' THEN
      notif_type  := 'transfer_received';
      notif_title := 'Virement reçu';
      notif_body  := 'Vous avez reçu ' || NEW.amount || ' ' || NEW.currency || '.';
    ELSIF NEW.type IN ('bill_payment','send') AND NEW.note ILIKE '%paiement%' THEN
      notif_type  := 'bill_paid';
      notif_title := 'Facture payée';
      notif_body  := 'Paiement de ' || NEW.amount || ' ' || NEW.currency || ' effectué.';
    ELSIF NEW.type = 'deposit' THEN
      notif_type  := 'deposit';
      notif_title := 'Dépôt reçu';
      notif_body  := 'Dépôt de ' || NEW.amount || ' ' || NEW.currency || ' crédité sur votre compte.';
    ELSIF NEW.type IN ('withdraw','withdrawal') THEN
      notif_type  := 'withdrawal';
      notif_title := 'Retrait effectué';
      notif_body  := 'Retrait de ' || NEW.amount || ' ' || NEW.currency || ' débité de votre compte.';
    ELSE
      notif_type  := 'system';
      notif_title := 'Transaction';
      notif_body  := 'Transaction de ' || NEW.amount || ' ' || NEW.currency || ' traitée.';
    END IF;

    INSERT INTO notifications(user_id, type, title, body, data, read)
    VALUES (
      NEW.user_id,
      notif_type,
      notif_title,
      notif_body,
      jsonb_build_object('tx_id', NEW.id, 'amount', NEW.amount, 'currency', NEW.currency),
      FALSE
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_transaction ON transactions;
CREATE TRIGGER trg_notify_on_transaction
  AFTER INSERT OR UPDATE OF status ON transactions
  FOR EACH ROW EXECUTE FUNCTION notify_on_transaction();

-- Fix 4: Notification trigger for bill payments
CREATE OR REPLACE FUNCTION notify_on_bill_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status <> 'completed') THEN
    INSERT INTO notifications(user_id, type, title, body, data, read)
    VALUES (
      NEW.user_id,
      'bill_paid',
      'Facture payée — ' || NEW.provider_name,
      'Paiement de ' || NEW.amount || ' ' || NEW.currency || ' à ' || NEW.provider_name || ' effectué avec succès.',
      jsonb_build_object('bill_id', NEW.id, 'provider', NEW.provider_name, 'amount', NEW.amount),
      FALSE
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_bill ON bill_payments;
CREATE TRIGGER trg_notify_on_bill
  AFTER INSERT OR UPDATE OF status ON bill_payments
  FOR EACH ROW EXECUTE FUNCTION notify_on_bill_payment();

-- Fix 5: RPC to insert welcome notification for new users
CREATE OR REPLACE FUNCTION insert_welcome_notification(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications(user_id, type, title, body, data, read)
  VALUES (
    p_user_id,
    'system',
    'Bienvenue sur FamillyBill HT !',
    'Votre compte est prêt. Envoyez et recevez de l''argent en quelques secondes.',
    '{"action":"welcome"}'::jsonb,
    FALSE
  )
  ON CONFLICT DO NOTHING;
END;
$$;
