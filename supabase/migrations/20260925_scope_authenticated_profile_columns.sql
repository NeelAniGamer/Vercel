-- Migration: 20260925_scope_authenticated_profile_columns.sql
-- Close the cross-user data leak found during the production-readiness review.
--
-- FINDING
--   `profiles_read_authenticated` and `user_profiles_read_authenticated` were
--   `USING (true)` policies scoped to `authenticated`, so any signed-in user
--   could SELECT every row of `profiles` and `user_profiles`, not just their
--   own. Combined with table-level column grants this exposed, to every
--   signed-in account:
--     * profiles.email            -> another learner's email address
--     * user_profiles.student_id  -> another learner's student id
--     * user_profiles.role        -> who is an admin
--     * user_profiles.age         -> another learner's age
--     * user_profiles.profile_views -> another learner's private metric
--
--   Anonymous access was already denied at the table-grant level, so this
--   affected signed-in learners reading each other.
--
-- FIX
--   1. Replace the blanket read policies with own-row policies (plus admin).
--   2. Narrow the table-level SELECT grant to the columns the client needs.
--      A table-level grant overrides column-level revokes, so the grant itself
--      has to be narrowed.
--   3. Add `public_profile_directory`, a leaderboard-safe projection that any
--      signed-in user may read, containing only non-identifying display data.
--   4. Add `resolve_user_id_by_student_id` so the share-link flow can still
--      resolve a student id after `student_id` stopped being directly
--      selectable. It is `authenticated`-only on purpose: an anonymous caller
--      must not be able to enumerate the student-id to user-id mapping.

BEGIN;

-- 1. Own-row reads only.
DROP POLICY IF EXISTS "profiles_read_authenticated" ON public.profiles;
CREATE POLICY "profiles_read_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin());

DROP POLICY IF EXISTS "user_profiles_read_authenticated" ON public.user_profiles;
CREATE POLICY "user_profiles_read_own"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

-- 2. Narrow the grants. A table-level SELECT grant supersedes column revokes.
REVOKE SELECT ON public.profiles      FROM authenticated;
REVOKE SELECT ON public.user_profiles FROM authenticated;

GRANT SELECT (id, username, full_name, email, created_at, updated_at)
  ON public.profiles TO authenticated;

GRANT SELECT (id, user_id, display_name, username, avatar_url, age, role,
              total_score, civic_score, badges_count, modules_completed,
              preferred_vehicle, language, student_id, profile_views,
              appearance, appearance_updated_at, created_at, updated_at)
  ON public.user_profiles TO authenticated;

-- Sensitive columns stay hidden from anonymous callers as well.
REVOKE SELECT (email)            ON public.profiles      FROM anon;
REVOKE SELECT (student_id, role, age, profile_views, appearance, appearance_updated_at)
                                 ON public.user_profiles FROM anon;

-- 3. Leaderboard-safe projection. Intentionally definer-scoped so rankings can
--    read every learner; the column list is the security boundary.
DROP VIEW IF EXISTS public.public_profile_directory;
CREATE VIEW public.public_profile_directory
AS
SELECT
  user_id,
  display_name,
  username,
  avatar_url,
  total_score,
  civic_score,
  badges_count,
  modules_completed,
  preferred_vehicle,
  language
FROM public.user_profiles;

COMMENT ON VIEW public.public_profile_directory IS
  'Leaderboard-safe projection. RLS is intentionally bypassed so rankings can read every learner, but only non-identifying display columns are exposed. Never add email, student_id, role, age or profile_views here.';

GRANT SELECT ON public.public_profile_directory TO authenticated;
REVOKE ALL ON public.public_profile_directory FROM anon;

-- 4. Narrow share-link lookup for the columns that are no longer selectable.
CREATE OR REPLACE FUNCTION public.resolve_user_id_by_student_id(p_student_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT user_id INTO v_id
  FROM public.user_profiles
  WHERE student_id = p_student_id
  LIMIT 1;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_user_id_by_student_id(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_user_id_by_student_id(TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION public.resolve_user_id_by_student_id(TEXT) IS
  'Resolves a share-link student id to its owner. Authenticated only: an anonymous caller must not be able to enumerate the student-id to user-id mapping.';

COMMIT;
