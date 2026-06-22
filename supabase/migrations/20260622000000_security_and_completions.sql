-- ============================================================
-- FamillyBill HT — Schéma complet, sécurité & performances
-- Migration 006 — 2026-06-22
-- ============================================================
-- Idempotent : peut être exécuté sur un projet vierge ou existant.
-- Copier l'intégralité dans : Supabase → SQL Editor → New query
-- ============================================================


-- ═══════════════════════════════════════════════════════════════
-- SECTION 1 — TABLES PRINCIPALES
-- ═══════════════════════════════════════════════════════════════

-- ── 1.1  Profils utilisateurs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS wise_users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        UNIQUE NOT NULL,
  full_name   TEXT        NOT NULL,
  phone       TEXT,
  address     TEXT,
  avatar_url  TEXT,
  verified    BOOLEAN     NOT NULL DEFAULT false,
  user_code   TEXT        UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colonnes manquantes sur installations existantes
ALTER TABLE wise_users ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE wise_users ADD COLUMN IF NOT EXISTS address    TEXT;
ALTER TABLE wise_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── 1.2  Comptes multi-devises ──────────────────────────────────
CREATE TABLE IF NOT EXISTS currency_accounts (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  currency        TEXT          NOT NULL,
  balance         NUMERIC(20,4) NOT NULL DEFAULT 0,
  account_number  TEXT,
  iban            TEXT,
  sort_code       TEXT,
  routing_number  TEXT,
  is_main         BOOLEAN       NOT NULL DEFAULT false,
  card_style      TEXT          NOT NULL DEFAULT 'purple',
  wallet_settings JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);

ALTER TABLE currency_accounts ADD COLUMN IF NOT EXISTS card_style      TEXT  NOT NULL DEFAULT 'purple';
ALTER TABLE currency_accounts ADD COLUMN IF NOT EXISTS wallet_settings JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE currency_accounts ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- Contrainte solde non-négatif
ALTER TABLE currency_accounts DROP CONSTRAINT IF EXISTS currency_accounts_balance_check;
ALTER TABLE currency_accounts ADD  CONSTRAINT currency_accounts_balance_check CHECK (balance >= 0);

-- ── 1.3  Transactions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  type              TEXT          NOT NULL,
  status            TEXT          NOT NULL DEFAULT 'completed',
  amount            NUMERIC(20,4) NOT NULL,
  currency          TEXT          NOT NULL,
  target_amount     NUMERIC(20,4),
  target_currency   TEXT,
  exchange_rate     NUMERIC(20,8),
  fee               NUMERIC(20,4) NOT NULL DEFAULT 0,
  recipient_name    TEXT,
  recipient_email   TEXT,
  recipient_account TEXT,
  note              TEXT,
  reference         TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT transactions_type_check
    CHECK (type   IN ('send','receive','convert','deposit','withdraw','bill_payment')),
  CONSTRAINT transactions_status_check
    CHECK (status IN ('pending','processing','completed','failed','cancelled'))
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- S'assurer que le CHECK sur type inclut 'bill_payment'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD  CONSTRAINT transactions_type_check
  CHECK (type IN ('send','receive','convert','deposit','withdraw','bill_payment'));

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD  CONSTRAINT transactions_status_check
  CHECK (status IN ('pending','processing','completed','failed','cancelled'));

-- ── 1.4  Portefeuilles familiaux ────────────────────────────────
CREATE TABLE IF NOT EXISTS family_wallets (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT          NOT NULL,
  balance     NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency    TEXT          NOT NULL DEFAULT 'HTG',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE family_wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE family_wallets DROP CONSTRAINT IF EXISTS family_wallets_balance_check;
ALTER TABLE family_wallets ADD  CONSTRAINT family_wallets_balance_check CHECK (balance >= 0);

-- ── 1.5  Membres des portefeuilles familiaux ────────────────────
CREATE TABLE IF NOT EXISTS family_wallet_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id    UUID        NOT NULL REFERENCES family_wallets(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  user_code    TEXT,
  display_name TEXT        NOT NULL DEFAULT '',
  view_balance BOOLEAN     NOT NULL DEFAULT true,
  pay_bills    BOOLEAN     NOT NULL DEFAULT false,
  withdraw     BOOLEAN     NOT NULL DEFAULT false,
  transfer     BOOLEAN     NOT NULL DEFAULT false,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet_id, user_id)
);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 2 — TABLES SUPPLÉMENTAIRES
-- ═══════════════════════════════════════════════════════════════

-- ── 2.1  Coffres d'épargne (Jars) ──────────────────────────────
CREATE TABLE IF NOT EXISTS jars (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID          NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  name       TEXT          NOT NULL,
  currency   TEXT          NOT NULL,
  balance    NUMERIC(20,4) NOT NULL DEFAULT 0,
  goal       NUMERIC(20,4),
  color      TEXT          NOT NULL DEFAULT '#dc1f1f',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE jars DROP CONSTRAINT IF EXISTS jars_balance_check;
ALTER TABLE jars ADD  CONSTRAINT jars_balance_check CHECK (balance >= 0);

-- ── 2.2  Bénéficiaires sauvegardés ─────────────────────────────
CREATE TABLE IF NOT EXISTS beneficiaries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  email           TEXT,
  phone           TEXT,
  account_number  TEXT,
  bank_name       TEXT,
  currency        TEXT        NOT NULL DEFAULT 'HTG',
  country         TEXT,
  is_favorite     BOOLEAN     NOT NULL DEFAULT false,
  avatar_url      TEXT,
  last_sent_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- ── 2.3  Paiements de factures ──────────────────────────────────
-- Détail enrichi pour chaque paiement de service (EDH, Natcom, etc.)
CREATE TABLE IF NOT EXISTS bill_payments (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  transaction_id  UUID          REFERENCES transactions(id) ON DELETE SET NULL,
  provider_id     TEXT          NOT NULL,
  provider_name   TEXT          NOT NULL,
  category        TEXT          NOT NULL,
  account_ref     TEXT,
  amount          NUMERIC(20,4) NOT NULL,
  currency        TEXT          NOT NULL DEFAULT 'HTG',
  status          TEXT          NOT NULL DEFAULT 'pending',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT bill_payments_status_check
    CHECK (status IN ('pending','processing','completed','failed'))
);

-- ── 2.4  Limites de transaction ─────────────────────────────────
-- Par défaut : 10 000 HTG par transaction, 50 000/jour, 200 000/mois
CREATE TABLE IF NOT EXISTS transaction_limits (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE UNIQUE,
  per_transaction  NUMERIC(20,4) NOT NULL DEFAULT 10000,
  daily_limit      NUMERIC(20,4) NOT NULL DEFAULT 50000,
  monthly_limit    NUMERIC(20,4) NOT NULL DEFAULT 200000,
  currency         TEXT          NOT NULL DEFAULT 'HTG',
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── 2.5  Notifications persistantes ────────────────────────────
-- Les notifications DB sont créées par les triggers et les fonctions
-- sécurisées; elles survivent aux rechargements de page.
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES wise_users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  data       JSONB,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_check
    CHECK (type IN (
      'transfer_sent','transfer_received','transfer_failed',
      'deposit','withdrawal','bill_paid','rate_alert',
      'security','system','promotion'
    ))
);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 3 — TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- ── 3.1  Mise à jour automatique de updated_at ─────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_wise_users_updated_at        ON wise_users;
CREATE TRIGGER tg_wise_users_updated_at
  BEFORE UPDATE ON wise_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tg_currency_accounts_updated_at ON currency_accounts;
CREATE TRIGGER tg_currency_accounts_updated_at
  BEFORE UPDATE ON currency_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tg_transactions_updated_at      ON transactions;
CREATE TRIGGER tg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tg_family_wallets_updated_at    ON family_wallets;
CREATE TRIGGER tg_family_wallets_updated_at
  BEFORE UPDATE ON family_wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3.2  Création automatique du profil à l'inscription ─────────
-- Génère également un user_code unique (FB + 6 alphanum. en maj.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Générer un code unique en boucle (collision très improbable)
  LOOP
    v_code := 'FB' || upper(substr(md5(random()::text || NEW.id::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.wise_users WHERE user_code = v_code);
  END LOOP;

  INSERT INTO public.wise_users (id, email, full_name, verified, user_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    FALSE,
    v_code
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3.3  Création automatique des limites par défaut ────────────
CREATE OR REPLACE FUNCTION public.handle_new_wise_user_limits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.transaction_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wise_user_created_limits ON wise_users;
CREATE TRIGGER on_wise_user_created_limits
  AFTER INSERT ON wise_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_wise_user_limits();


-- ═══════════════════════════════════════════════════════════════
-- SECTION 4 — FONCTIONS SÉCURISÉES (SECURITY DEFINER)
-- ═══════════════════════════════════════════════════════════════

-- ── 4.1  Transfert atomique ─────────────────────────────────────
--
-- Remplace les 4 appels directs du client par une seule transaction
-- SQL atomique avec :
--   • vérification du propriétaire du compte source
--   • vérification du solde en temps réel (évite les race conditions)
--   • débit du compte source
--   • crédit du compte destination (même user OU autre user)
--   • création des enregistrements de transaction pour les deux parties
--
-- Paramètres :
--   p_from_account_id   : UUID du compte source (obligatoire)
--   p_to_account_id     : UUID du compte destination (NULL = transfert externe)
--   p_recipient_user_id : UUID du destinataire (NULL = même user ou externe)
--   p_send_amount       : montant envoyé hors frais
--   p_fee               : frais de transaction
--   p_credit_amount     : montant crédité (peut différer après conversion de devise)
--   p_recipient_name    : nom du bénéficiaire (pour l'historique)
--   p_note              : note libre (optionnel)
--   p_reference         : référence unique générée côté client (optionnel)
--
-- Retourne : { "success": true, "tx_id": "..." }
--         ou { "success": false, "error": "..." }

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
  v_from_user_id  UUID;
  v_from_balance  NUMERIC;
  v_from_currency TEXT;
  v_total_debit   NUMERIC;
  v_tx_id         UUID;
BEGIN
  v_total_debit := p_send_amount + p_fee;

  -- 1. Verrouiller le compte source (FOR UPDATE évite les race conditions)
  SELECT user_id, balance, currency
  INTO   v_from_user_id, v_from_balance, v_from_currency
  FROM   currency_accounts
  WHERE  id = p_from_account_id
  FOR    UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Compte source introuvable.');
  END IF;

  -- 2. Vérifier la propriété
  IF v_from_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé.');
  END IF;

  -- 3. Vérifier le solde en temps réel
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

  -- 4. Débiter le compte source
  UPDATE currency_accounts
  SET    balance = balance - v_total_debit
  WHERE  id = p_from_account_id;

  -- 5. Créditer le compte destination (si non-externe)
  IF p_to_account_id IS NOT NULL THEN
    UPDATE currency_accounts
    SET    balance = balance + p_credit_amount
    WHERE  id = p_to_account_id;

    -- 6. Transaction de réception pour le destinataire (si autre utilisateur)
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
        p_credit_amount, ca.currency,
        0, p_recipient_name, p_note, p_reference, now()
      FROM currency_accounts ca
      WHERE ca.id = p_to_account_id;
    END IF;
  END IF;

  -- 7. Transaction d'envoi pour l'expéditeur
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

-- Accorder l'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.do_transfer TO authenticated;


-- ── 4.2  Helpers anti-récursion RLS (portefeuilles familiaux) ───
CREATE OR REPLACE FUNCTION public.fw_is_member(p_wallet_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_wallet_members
    WHERE  wallet_id = p_wallet_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.fw_get_creator(p_wallet_id UUID)
RETURNS UUID LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT creator_id FROM public.family_wallets WHERE id = p_wallet_id;
$$;


-- ═══════════════════════════════════════════════════════════════
-- SECTION 5 — ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Activer RLS sur toutes les tables
ALTER TABLE wise_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE jars                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_limits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_wallets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_wallet_members ENABLE ROW LEVEL SECURITY;

-- ── 5.1  wise_users ─────────────────────────────────────────────
-- SELECT ouvert à tous les utilisateurs authentifiés :
-- nécessaire pour la recherche de contacts et le transfert par ID.
DROP POLICY IF EXISTS "own_user_select"            ON wise_users;
DROP POLICY IF EXISTS "users_select_authenticated" ON wise_users;
DROP POLICY IF EXISTS "wise_users_select"          ON wise_users;
DROP POLICY IF EXISTS "wise_users_insert"          ON wise_users;
DROP POLICY IF EXISTS "own_user_insert"            ON wise_users;
DROP POLICY IF EXISTS "wise_users_update"          ON wise_users;
DROP POLICY IF EXISTS "own_user_update"            ON wise_users;
DROP POLICY IF EXISTS "wise_users_delete"          ON wise_users;
DROP POLICY IF EXISTS "own_user_delete"            ON wise_users;

CREATE POLICY "wise_users_select" ON wise_users
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "wise_users_insert" ON wise_users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "wise_users_update" ON wise_users
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "wise_users_delete" ON wise_users
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- ── 5.2  currency_accounts ──────────────────────────────────────
-- Les opérations cross-utilisateur (crédit du destinataire) sont
-- réalisées exclusivement par do_transfer() (SECURITY DEFINER).
DROP POLICY IF EXISTS "own_accounts_select"     ON currency_accounts;
DROP POLICY IF EXISTS "own_accounts_insert"     ON currency_accounts;
DROP POLICY IF EXISTS "own_accounts_update"     ON currency_accounts;
DROP POLICY IF EXISTS "own_accounts_delete"     ON currency_accounts;
DROP POLICY IF EXISTS "currency_accounts_select" ON currency_accounts;
DROP POLICY IF EXISTS "currency_accounts_insert" ON currency_accounts;
DROP POLICY IF EXISTS "currency_accounts_update" ON currency_accounts;
DROP POLICY IF EXISTS "currency_accounts_delete" ON currency_accounts;

CREATE POLICY "currency_accounts_select" ON currency_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "currency_accounts_insert" ON currency_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "currency_accounts_update" ON currency_accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "currency_accounts_delete" ON currency_accounts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 5.3  transactions ───────────────────────────────────────────
-- L'insertion des transactions du destinataire est gérée par do_transfer().
DROP POLICY IF EXISTS "own_tx_select"       ON transactions;
DROP POLICY IF EXISTS "own_tx_insert"       ON transactions;
DROP POLICY IF EXISTS "own_tx_update"       ON transactions;
DROP POLICY IF EXISTS "own_tx_delete"       ON transactions;
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

CREATE POLICY "transactions_select" ON transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 5.4  jars ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_jars_select" ON jars;
DROP POLICY IF EXISTS "own_jars_insert" ON jars;
DROP POLICY IF EXISTS "own_jars_update" ON jars;
DROP POLICY IF EXISTS "own_jars_delete" ON jars;
DROP POLICY IF EXISTS "jars_select"     ON jars;
DROP POLICY IF EXISTS "jars_insert"     ON jars;
DROP POLICY IF EXISTS "jars_update"     ON jars;
DROP POLICY IF EXISTS "jars_delete"     ON jars;

CREATE POLICY "jars_select" ON jars FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "jars_insert" ON jars FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jars_update" ON jars FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "jars_delete" ON jars FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 5.5  beneficiaries ──────────────────────────────────────────
DROP POLICY IF EXISTS "own_beneficiaries_select" ON beneficiaries;
DROP POLICY IF EXISTS "own_beneficiaries_insert" ON beneficiaries;
DROP POLICY IF EXISTS "own_beneficiaries_update" ON beneficiaries;
DROP POLICY IF EXISTS "own_beneficiaries_delete" ON beneficiaries;
DROP POLICY IF EXISTS "beneficiaries_select"     ON beneficiaries;
DROP POLICY IF EXISTS "beneficiaries_insert"     ON beneficiaries;
DROP POLICY IF EXISTS "beneficiaries_update"     ON beneficiaries;
DROP POLICY IF EXISTS "beneficiaries_delete"     ON beneficiaries;

CREATE POLICY "beneficiaries_select" ON beneficiaries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "beneficiaries_insert" ON beneficiaries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "beneficiaries_update" ON beneficiaries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "beneficiaries_delete" ON beneficiaries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 5.6  bill_payments ──────────────────────────────────────────
DROP POLICY IF EXISTS "own_bills_select"  ON bill_payments;
DROP POLICY IF EXISTS "own_bills_insert"  ON bill_payments;
DROP POLICY IF EXISTS "own_bills_update"  ON bill_payments;
DROP POLICY IF EXISTS "bill_payments_select" ON bill_payments;
DROP POLICY IF EXISTS "bill_payments_insert" ON bill_payments;
DROP POLICY IF EXISTS "bill_payments_update" ON bill_payments;

CREATE POLICY "bill_payments_select" ON bill_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bill_payments_insert" ON bill_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bill_payments_update" ON bill_payments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ── 5.7  transaction_limits ─────────────────────────────────────
DROP POLICY IF EXISTS "own_limits_select"        ON transaction_limits;
DROP POLICY IF EXISTS "own_limits_insert"        ON transaction_limits;
DROP POLICY IF EXISTS "own_limits_update"        ON transaction_limits;
DROP POLICY IF EXISTS "transaction_limits_select" ON transaction_limits;
DROP POLICY IF EXISTS "transaction_limits_insert" ON transaction_limits;
DROP POLICY IF EXISTS "transaction_limits_update" ON transaction_limits;

CREATE POLICY "transaction_limits_select" ON transaction_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transaction_limits_insert" ON transaction_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transaction_limits_update" ON transaction_limits FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ── 5.8  notifications ──────────────────────────────────────────
DROP POLICY IF EXISTS "own_notif_select"    ON notifications;
DROP POLICY IF EXISTS "own_notif_insert"    ON notifications;
DROP POLICY IF EXISTS "own_notif_update"    ON notifications;
DROP POLICY IF EXISTS "own_notif_delete"    ON notifications;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 5.9  family_wallets ─────────────────────────────────────────
DROP POLICY IF EXISTS "read own or member wallets" ON family_wallets;
DROP POLICY IF EXISTS "creator insert wallet"      ON family_wallets;
DROP POLICY IF EXISTS "creator update wallet"      ON family_wallets;
DROP POLICY IF EXISTS "creator delete wallet"      ON family_wallets;
DROP POLICY IF EXISTS "fw_select_as_creator"       ON family_wallets;
DROP POLICY IF EXISTS "fw_select_as_member"        ON family_wallets;
DROP POLICY IF EXISTS "fw_insert"                  ON family_wallets;
DROP POLICY IF EXISTS "fw_update"                  ON family_wallets;
DROP POLICY IF EXISTS "fw_delete"                  ON family_wallets;

-- Deux policies SELECT séparées (OR implicite entre policies)
CREATE POLICY "fw_select_as_creator" ON family_wallets FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "fw_select_as_member"  ON family_wallets FOR SELECT USING (public.fw_is_member(id));
CREATE POLICY "fw_insert"            ON family_wallets FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "fw_update"            ON family_wallets FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "fw_delete"            ON family_wallets FOR DELETE USING (creator_id = auth.uid());

-- ── 5.10 family_wallet_members ──────────────────────────────────
DROP POLICY IF EXISTS "read members"           ON family_wallet_members;
DROP POLICY IF EXISTS "creator manage members" ON family_wallet_members;
DROP POLICY IF EXISTS "creator update members" ON family_wallet_members;
DROP POLICY IF EXISTS "creator delete members" ON family_wallet_members;
DROP POLICY IF EXISTS "fwm_select_own"         ON family_wallet_members;
DROP POLICY IF EXISTS "fwm_select_as_creator"  ON family_wallet_members;
DROP POLICY IF EXISTS "fwm_insert_as_creator"  ON family_wallet_members;
DROP POLICY IF EXISTS "fwm_update_as_creator"  ON family_wallet_members;
DROP POLICY IF EXISTS "fwm_delete_as_creator"  ON family_wallet_members;

CREATE POLICY "fwm_select_own"        ON family_wallet_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fwm_select_as_creator" ON family_wallet_members FOR SELECT USING (public.fw_get_creator(wallet_id) = auth.uid());
CREATE POLICY "fwm_insert_as_creator" ON family_wallet_members FOR INSERT WITH CHECK (public.fw_get_creator(wallet_id) = auth.uid());
CREATE POLICY "fwm_update_as_creator" ON family_wallet_members FOR UPDATE USING (public.fw_get_creator(wallet_id) = auth.uid());
CREATE POLICY "fwm_delete_as_creator" ON family_wallet_members FOR DELETE USING (public.fw_get_creator(wallet_id) = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- SECTION 6 — INDEX DE PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

-- wise_users
CREATE UNIQUE INDEX IF NOT EXISTS wise_users_user_code_idx
  ON wise_users (user_code) WHERE user_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wise_users_email
  ON wise_users (email);

-- currency_accounts
CREATE INDEX IF NOT EXISTS idx_currency_accounts_user_id
  ON currency_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_currency_accounts_user_currency
  ON currency_accounts (user_id, currency);

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference
  ON transactions (reference) WHERE reference IS NOT NULL;

-- family_wallets / members
CREATE INDEX IF NOT EXISTS idx_family_wallets_creator
  ON family_wallets (creator_id);
CREATE INDEX IF NOT EXISTS idx_fwm_wallet_id
  ON family_wallet_members (wallet_id);
CREATE INDEX IF NOT EXISTS idx_fwm_user_id
  ON family_wallet_members (user_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, read) WHERE read = FALSE;

-- bill_payments / beneficiaries
CREATE INDEX IF NOT EXISTS idx_bill_payments_user_id
  ON bill_payments (user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id
  ON beneficiaries (user_id);


-- ═══════════════════════════════════════════════════════════════
-- SECTION 7 — CONTRAINTES DE VALIDATION
-- ═══════════════════════════════════════════════════════════════

-- Format user_code : "FB" + 6 caractères alphanumériques majuscules
ALTER TABLE wise_users DROP CONSTRAINT IF EXISTS wise_users_user_code_format;
ALTER TABLE wise_users ADD  CONSTRAINT wise_users_user_code_format
  CHECK (user_code IS NULL OR user_code ~ '^FB[A-Z0-9]{6}$');


-- ═══════════════════════════════════════════════════════════════
-- SECTION 8 — VUES UTILITAIRES
-- ═══════════════════════════════════════════════════════════════

-- Résumé des soldes par utilisateur et devise
-- Utilisée pour calculer le total en USD sur le dashboard
CREATE OR REPLACE VIEW user_balances_summary AS
SELECT
  ca.user_id,
  ca.currency,
  ca.balance,
  ca.is_main,
  ca.balance * CASE ca.currency
    WHEN 'USD' THEN 1.0
    WHEN 'HTG' THEN 0.0074
    WHEN 'EUR' THEN 1.08
    WHEN 'CAD' THEN 0.73
    WHEN 'BRL' THEN 0.19
    ELSE 1.0
  END AS balance_usd
FROM currency_accounts ca;

-- Décompte des notifications non lues par utilisateur
CREATE OR REPLACE VIEW unread_notification_counts AS
SELECT user_id, COUNT(*) AS unread_count
FROM   notifications
WHERE  read = FALSE
GROUP  BY user_id;


-- ═══════════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- ═══════════════════════════════════════════════════════════════
-- Récapitulatif des tables créées / modifiées :
--   wise_users            — profils (+phone, +address, +updated_at)
--   currency_accounts     — comptes devises (+updated_at, contrainte balance≥0)
--   transactions          — historique (+updated_at, type bill_payment)
--   family_wallets        — portefeuilles familiaux (+updated_at, contrainte balance≥0)
--   family_wallet_members — membres avec permissions granulaires
--   jars                  — coffres d'épargne
--   beneficiaries         — bénéficiaires sauvegardés
--   bill_payments         — détail des paiements de factures
--   transaction_limits    — limites par transaction / jour / mois
--   notifications         — notifications persistantes en base
--
-- Fonctions :
--   do_transfer()              — transfert atomique sécurisé (SECURITY DEFINER)
--   handle_new_user()          — création profil + user_code à l'inscription
--   handle_new_wise_user_limits() — limites par défaut à la création du profil
--   fw_is_member() / fw_get_creator() — helpers RLS anti-récursion
--   set_updated_at()           — trigger auto updated_at
-- ═══════════════════════════════════════════════════════════════
