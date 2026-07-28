-- Add appearance JSONB column to user_profiles for character customization sync
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS appearance jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS appearance_updated_at timestamptz DEFAULT NULL;

-- Index for quick appearance lookups on login
CREATE INDEX IF NOT EXISTS idx_user_profiles_appearance
  ON public.user_profiles (user_id)
  WHERE appearance IS NOT NULL;
