-- Migration: Add covering indexes for unindexed foreign keys
-- Resolves Supabase linter 0001_unindexed_foreign_keys

CREATE INDEX IF NOT EXISTS idx_accounts_auth_user_id 
  ON public.accounts(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_links_student_id 
  ON public.dashboard_links(student_id);

CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id 
  ON public.qr_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_id 
  ON public.qr_scans(qr_id);

CREATE INDEX IF NOT EXISTS idx_search_logs_found_uid 
  ON public.search_logs(found_uid);

CREATE INDEX IF NOT EXISTS idx_search_logs_searcher_uid 
  ON public.search_logs(searcher_uid);

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id 
  ON public.user_achievements(achievement_id);
