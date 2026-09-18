-- Migration: 20260918_lockdown_accounts_and_ati_tables.sql
-- Description: Completely locks down public.accounts from direct PostgREST access to protect pin_hash,
--              and tightens permissive write policies on ati_ tables.

-- 1. Drop public viewable policy on accounts
DROP POLICY IF EXISTS "Public accounts viewable" ON public.accounts;

-- 2. Revoke all privileges from anon and authenticated on accounts
REVOKE ALL ON TABLE public.accounts FROM anon, authenticated, public;

-- 3. Ensure postgres and service_role retain full access
GRANT ALL ON TABLE public.accounts TO postgres, service_role;

-- 4. Enable RLS strictly
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 5. Tighten ati_ tables to prevent arbitrary anonymous deletes/updates
DROP POLICY IF EXISTS "ati_profiles_delete" ON public.ati_user_profiles;
DROP POLICY IF EXISTS "ati_profiles_update" ON public.ati_user_profiles;
DROP POLICY IF EXISTS "ati_progress_delete" ON public.ati_user_progress;
DROP POLICY IF EXISTS "ati_progress_update" ON public.ati_user_progress;
DROP POLICY IF EXISTS "ati_race_delete" ON public.ati_race_results;
DROP POLICY IF EXISTS "ati_rooms_delete" ON public.ati_multiplayer_rooms;
DROP POLICY IF EXISTS "ati_rooms_update" ON public.ati_multiplayer_rooms;

-- Recreate ati_ write policies with proper owner checks
CREATE POLICY "ati_profiles_update" ON public.ati_user_profiles 
FOR UPDATE USING ((SELECT auth.uid())::text = id)
WITH CHECK ((SELECT auth.uid())::text = id);

CREATE POLICY "ati_profiles_delete" ON public.ati_user_profiles 
FOR DELETE USING ((SELECT auth.uid())::text = id);

CREATE POLICY "ati_progress_update" ON public.ati_user_progress 
FOR UPDATE USING ((SELECT auth.uid())::text = user_id)
WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY "ati_progress_delete" ON public.ati_user_progress 
FOR DELETE USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY "ati_race_delete" ON public.ati_race_results 
FOR DELETE USING ((SELECT auth.uid())::text = player_id);

CREATE POLICY "ati_rooms_update" ON public.ati_multiplayer_rooms 
FOR UPDATE USING ((SELECT auth.uid())::text = host_id)
WITH CHECK ((SELECT auth.uid())::text = host_id);

CREATE POLICY "ati_rooms_delete" ON public.ati_multiplayer_rooms 
FOR DELETE USING ((SELECT auth.uid())::text = host_id);
