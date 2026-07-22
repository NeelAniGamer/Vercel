-- Improve Public Verification RPC to include achievement description
CREATE OR REPLACE FUNCTION public.verify_certificate_token(token UUID, slug TEXT)
RETURNS TABLE (
    user_id UUID,
    user_display_name TEXT,
    achievement_display_name TEXT,
    achievement_description TEXT,
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
        ad.description as achievement_description,
        ua.completed_at
    FROM public.user_achievements ua
    JOIN public.achievement_definitions ad ON ua.achievement_id = ad.id
    LEFT JOIN public.profiles p ON ua.user_id = p.id
    WHERE ua.verification_token = token
      AND ad.slug = slug
      AND ua.is_completed = true;
END;
$$;
