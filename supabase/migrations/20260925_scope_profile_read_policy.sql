-- Migration: 20260925_scope_profile_read_policy.sql
-- Keep the RLS policy itself aligned with the table-level grants so a future
-- grant change cannot silently reopen anonymous profile reads.

BEGIN;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "profiles_read_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;
