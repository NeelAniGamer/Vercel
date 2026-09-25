-- Migration: 20260925_scope_authenticated_profile_columns.sql
-- Close the cross-user data leak found during the production-readiness review.
--
-- FINDING
--   `profiles_read_authenticated` and `user_profiles_read_authenticated` were
--   `USING (true)` policies scoped to `authenticated`, so any signed-in user
--   could SELECT every row of `profiles` and `user_profiles`, not just their
--   own. Combined with table-level column grants this exposed, to every
--   signed-in account:
--     * profiles.email              -> another learner's email address
--     * user_profiles.student_id    -> another learner's student id
--     * user_profiles.role          -> who is an admin
--     * user_profiles.age           -> another learner's age
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
--      signed-in user may call, containing only non-identifying display data.
--      Rankings need to read every learner, so this is SECURITY DEFINER; the
--      column list and the `authenticated`-only grant are the security
--      boundary, not a row policy.
--   4. Add `resolve_user_id_by_student_id` so the share-link flow can still
--      resolve a student id after `student_id` stopped being directly
--      selectable. It is `authenticated`-only on purpose: an anonymous caller
--      must not be able to enumerate the student-id to user-id mapping.
--
-- WHY A FUNCTION AND NOT A VIEW
--   A view that selects across an RLS-protected table is a SECURITY DEFINER
--   view. Postgres then evaluates the base table's policies as the view owner
--   rather than the caller, and the Supabase database linter raises an ERROR
--   for it (`security_definer_view`). A function makes the privilege
--   boundary explicit, lets the arguments be bounded, and keeps the advisor
--   clean. The earlier view-based attempt was removed for that reason.

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

GRANT SELECT (user_id, display_name, username, avatar_url, age, role,
              total_score, civic_score, badges_count, modules_completed,
              preferred_vehicle, language, student_id, profile_views,
              appearance, appearance_updated_at, created_at, updated_at)
  ON public.user_profiles TO authenticated;

-- Sensitive columns stay hidden from anonymous callers as well.
REVOKE SELECT (email) ON public.profiles FROM anon;
REVOKE SELECT (student_id, role, age, profile_views, appearance, appearance_updated_at)
  ON public.user_profiles FROM anon;

-- 3. Leaderboard-safe projection.
--    SECURITY DEFINER is required: rankings must read every learner while
--    `user_profiles` stays own-row only. `auth.uid() IS NOT NULL` is checked in
--    the body as a second gate behind the grant, and `p_limit` is clamped so a
--    caller cannot ask for the whole table unbounded.
DROP VIEW IF EXISTS public.public_profile_directory;

CREATE OR REPLACE FUNCTION public.public_profile_directory(
  p_search TEXT     DEFAULT NULL,
  p_limit  INTEGER  DEFAULT 100
)
RETURNS TABLE (
  user_id           UUID,
  display_name      TEXT,
  username          TEXT,
  avatar_url        TEXT,
  total_score       INTEGER,
  civic_score       INTEGER,
  badges_count      INTEGER,
  modules_completed INTEGER,
  preferred_vehicle TEXT,
  language          TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    up.user_id,
    up.display_name,
    up.username,
    up.avatar_url,
    up.total_score,
    up.civic_score,
    up.badges_count,
    up.modules_completed,
    up.preferred_vehicle,
    up.language
  FROM public.user_profiles up
  WHERE
    auth.uid() IS NOT NULL
    AND (
      p_search IS NULL
      OR up.username ILIKE '%' || p_search || '%'
      OR up.display_name ILIKE '%' || p_search || '%'
    )
  ORDER BY up.total_score DESC NULLS LAST, up.display_name ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
$$;

REVOKE ALL ON FUNCTION public.public_profile_directory(TEXT, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.public_profile_directory(TEXT, INTEGER)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.public_profile_directory(TEXT, INTEGER) IS
  'Leaderboard-safe projection. SECURITY DEFINER is required so rankings can read every learner while user_profiles stays own-row only. Authenticated callers only. Never return email, student_id, role, age or profile_views from here.';

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

REVOKE ALL ON FUNCTION public.resolve_user_id_by_student_id(TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_user_id_by_student_id(TEXT)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.resolve_user_id_by_student_id(TEXT) IS
  'Resolves a share-link student id to its owner. Authenticated only: an anonymous caller must not be able to enumerate the student-id to user-id mapping.';

COMMIT;
