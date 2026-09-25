-- Migration: 20260925_harden_profile_privacy.sql
-- Keep public profile reads useful for signed-in experiences without exposing
-- anonymous clients to account email or student-profile data.

BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- The legacy profiles table is used by the signed-in profile editor. Do not
-- expose its email column to anonymous API clients.
REVOKE SELECT (email) ON public.profiles FROM anon;

-- Profile rows are not needed by anonymous visitors. Require a live Supabase
-- session before reading the extended profile table.
DROP POLICY IF EXISTS "Allow read user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_public_read" ON public.user_profiles;
CREATE POLICY "user_profiles_read_authenticated"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;
