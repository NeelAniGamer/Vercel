-- Migration: 20261102_leaderboard_and_verification_performance.sql
-- Description: Adds covering composite and partial indexes for leaderboard queries and certificate verification token lookups.

-- 1. Index achievement definitions by category and slug
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category 
  ON public.achievement_definitions (category);

CREATE INDEX IF NOT EXISTS idx_achievement_definitions_slug 
  ON public.achievement_definitions (slug);

-- 2. Index certificate verification tokens (partial index for completed/issued achievements)
CREATE INDEX IF NOT EXISTS idx_user_achievements_verification_token 
  ON public.user_achievements (verification_token) 
  WHERE verification_token IS NOT NULL;

-- 3. Composite index for fast category leaderboard sorting (achievement_id + current_value DESC)
CREATE INDEX IF NOT EXISTS idx_user_achievements_achieve_val_desc 
  ON public.user_achievements (achievement_id, current_value DESC);
