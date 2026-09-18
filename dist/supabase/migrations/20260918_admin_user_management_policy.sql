-- ==============================================================================
-- Migration: Admin User Profile Management Policy
-- Allows administrators to update roles and profiles in public.user_profiles
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Admins can update all user profiles'
    ) THEN
        CREATE POLICY "Admins can update all user profiles" 
        ON public.user_profiles 
        FOR UPDATE 
        TO authenticated 
        USING (is_admin()) 
        WITH CHECK (is_admin());
    END IF;
END $$;
