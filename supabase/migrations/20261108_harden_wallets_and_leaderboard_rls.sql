-- Migration: 20261108_harden_wallets_and_leaderboard_rls.sql
-- Description: Locks down the permissive "Allow read wallets" policy on public.wallets,
--              restricting direct table reads strictly to the wallet owner, while providing
--              a controlled security-definer function for the public top-wealth leaderboard.

BEGIN;

-- 1. Drop overly permissive public read policy on wallets
DROP POLICY IF EXISTS "Allow read wallets" ON public.wallets;
DROP POLICY IF EXISTS "wallets_read_public" ON public.wallets;
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;

-- 2. Restrict direct SELECT on wallets to the authenticated owner only
CREATE POLICY "wallets_select_own" ON public.wallets
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 3. Provide a secure, bounded function for public leaderboard retrieval
--    This prevents arbitrary SELECT queries on user_id and balances, only returning
--    the top anonymized leaderboard slice.
CREATE OR REPLACE FUNCTION public.get_leaderboard_wallets(p_limit INT DEFAULT 100)
RETURNS TABLE (
  user_id UUID,
  balance BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT user_id, balance
  FROM public.wallets
  ORDER BY balance DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard_wallets(INT) TO anon, authenticated;

COMMIT;
