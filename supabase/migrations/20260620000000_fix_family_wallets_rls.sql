-- Fix infinite recursion in RLS policies for family_wallets / family_wallet_members
--
-- Root cause: the old SELECT policy on family_wallets queried family_wallet_members,
-- and the old SELECT policy on family_wallet_members queried family_wallets.
-- This created a circular dependency → "infinite recursion detected in policy".
--
-- Fix: use SECURITY DEFINER helper functions that bypass RLS on their inner queries,
-- breaking the cycle.

-- ── 1. Helper functions (SECURITY DEFINER = bypass RLS) ──────────────────────

CREATE OR REPLACE FUNCTION public.fw_is_member(p_wallet_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_wallet_members
    WHERE wallet_id = p_wallet_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.fw_get_creator(p_wallet_id UUID)
RETURNS UUID LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT creator_id FROM public.family_wallets WHERE id = p_wallet_id;
$$;

-- ── 2. Drop old recursive policies on family_wallets ─────────────────────────

DROP POLICY IF EXISTS "read own or member wallets" ON public.family_wallets;
DROP POLICY IF EXISTS "creator insert wallet"       ON public.family_wallets;
DROP POLICY IF EXISTS "creator update wallet"       ON public.family_wallets;
DROP POLICY IF EXISTS "creator delete wallet"       ON public.family_wallets;

-- ── 3. Drop old recursive policies on family_wallet_members ──────────────────

DROP POLICY IF EXISTS "read members"               ON public.family_wallet_members;
DROP POLICY IF EXISTS "creator manage members"     ON public.family_wallet_members;
DROP POLICY IF EXISTS "creator update members"     ON public.family_wallet_members;
DROP POLICY IF EXISTS "creator delete members"     ON public.family_wallet_members;

-- ── 4. New non-recursive policies for family_wallets ─────────────────────────

CREATE POLICY "fw_select_as_creator" ON public.family_wallets
  FOR SELECT USING (creator_id = auth.uid());

-- Uses fw_is_member() which queries family_wallet_members WITHOUT applying
-- family_wallet_members RLS (SECURITY DEFINER), so no recursion.
CREATE POLICY "fw_select_as_member" ON public.family_wallets
  FOR SELECT USING (public.fw_is_member(id));

CREATE POLICY "fw_insert" ON public.family_wallets
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "fw_update" ON public.family_wallets
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "fw_delete" ON public.family_wallets
  FOR DELETE USING (creator_id = auth.uid());

-- ── 5. New non-recursive policies for family_wallet_members ──────────────────

-- A member can see their own row
CREATE POLICY "fwm_select_own" ON public.family_wallet_members
  FOR SELECT USING (user_id = auth.uid());

-- Uses fw_get_creator() which queries family_wallets WITHOUT applying
-- family_wallets RLS (SECURITY DEFINER), so no recursion.
CREATE POLICY "fwm_select_as_creator" ON public.family_wallet_members
  FOR SELECT USING (public.fw_get_creator(wallet_id) = auth.uid());

CREATE POLICY "fwm_insert_as_creator" ON public.family_wallet_members
  FOR INSERT WITH CHECK (public.fw_get_creator(wallet_id) = auth.uid());

CREATE POLICY "fwm_update_as_creator" ON public.family_wallet_members
  FOR UPDATE USING (public.fw_get_creator(wallet_id) = auth.uid());

CREATE POLICY "fwm_delete_as_creator" ON public.family_wallet_members
  FOR DELETE USING (public.fw_get_creator(wallet_id) = auth.uid());
