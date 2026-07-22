-- Fix for Insecure Public Verification Policy
-- This migration replaces the broad 'is_completed = true' policy with a secure RPC-based lookup.

-- 1. Remove the insecure anon SELECT policy
DROP POLICY "Public verification of certificates" ON public.user_achievements;

-- 2. Implement secure RPC function for certificate verification
-- This function is SECURITY DEFINER to bypass RLS and perform the specific lookup.
CREATE OR REPLACE FUNCTION public.verify_certificate_token(token UUID, slug TEXT)
RETURNS TABLE (
    user_id UUID,
    user_display_name TEXT,
    achievement_display_name TEXT,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.user_id,
        p.display_name as user_display_name,
        ad.display_name as achievement_display_name,
        ua.completed_at
    FROM public.user_achievements ua
    JOIN public.achievement_definitions ad ON ua.achievement_id = ad.id
    LEFT JOIN public.profiles p ON ua.user_id = p.id
    WHERE ua.verification_token = token
      AND ad.slug = slug
      AND ua.is_completed = true;
END;
$$;

-- 3. Add restrictive RLS policy to prevent direct anon access
-- This ensures that anon users cannot list achievements via SELECT * FROM user_achievements.
CREATE POLICY "Anon has no direct access to user_achievements"
  ON public.user_achievements FOR SELECT
  TO anon
  USING (false);
