-- Migration: 20260920_security_advisors_fix.sql
-- Fixes Supabase Database Linter Advisories:
-- 1. function_search_path_mutable on is_admin, lookup_dynamic_qr, record_qr_scan
-- 2. anon_security_definer_function_executable on is_admin
-- 3. rls_policy_always_true on qr_scans, ati_user_profiles, ati_user_progress, ati_multiplayer_rooms

-- 1. Fix search_path on all three functions
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.lookup_dynamic_qr(text) SET search_path = public;
ALTER FUNCTION public.record_qr_scan(text, text, text, text, text, text, text, text) SET search_path = public;

-- 2. Restrict is_admin from public and anon
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Fix qr_scans overly permissive INSERT policy (record_qr_scan RPC handles inserts)
DROP POLICY IF EXISTS "Anyone can log a QR scan" ON public.qr_scans;

-- 4. Fix ati_user_profiles update policy
DROP POLICY IF EXISTS "ati_profiles_update" ON public.ati_user_profiles;
CREATE POLICY "ati_profiles_update" ON public.ati_user_profiles
  FOR UPDATE TO authenticated
  USING (((SELECT auth.uid())::text = id))
  WITH CHECK (((SELECT auth.uid())::text = id));

-- 5. Fix ati_user_progress update policy
DROP POLICY IF EXISTS "ati_progress_update" ON public.ati_user_progress;
CREATE POLICY "ati_progress_update" ON public.ati_user_progress
  FOR UPDATE TO authenticated
  USING (((SELECT auth.uid())::text = user_id))
  WITH CHECK (((SELECT auth.uid())::text = user_id));

-- 6. Fix ati_multiplayer_rooms delete and update policies
DROP POLICY IF EXISTS "ati_rooms_delete" ON public.ati_multiplayer_rooms;
CREATE POLICY "ati_rooms_delete" ON public.ati_multiplayer_rooms
  FOR DELETE TO authenticated
  USING (((SELECT auth.uid())::text = host_id) OR public.is_admin());

DROP POLICY IF EXISTS "ati_rooms_update" ON public.ati_multiplayer_rooms;
CREATE POLICY "ati_rooms_update" ON public.ati_multiplayer_rooms
  FOR UPDATE TO authenticated
  USING (((SELECT auth.uid())::text = host_id) OR public.is_admin())
  WITH CHECK (((SELECT auth.uid())::text = host_id) OR public.is_admin());
