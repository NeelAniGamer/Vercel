-- Migration: 20260918_optimize_rls_performance_and_policies.sql
-- Description: Eliminates multiple permissive RLS policies and optimizes auth.uid() initplan across all tables.

-- 1. Eliminate duplicate SELECT policies on certificates
DROP POLICY IF EXISTS "Allow read certificates" ON public.certificates;

-- 2. Eliminate duplicate SELECT policies on user_profiles & fix auth_rls_initplan
DROP POLICY IF EXISTS "Public read access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
FOR UPDATE USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Fix auth_rls_initplan on wallets
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
CREATE POLICY "wallets_insert_own" ON public.wallets
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;
CREATE POLICY "wallets_update_own" ON public.wallets
FOR UPDATE USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Fix auth_rls_initplan on game_progress
DROP POLICY IF EXISTS "game_progress_insert_own" ON public.game_progress;
CREATE POLICY "game_progress_insert_own" ON public.game_progress
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "game_progress_update_own" ON public.game_progress;
CREATE POLICY "game_progress_update_own" ON public.game_progress
FOR UPDATE USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5. Fix auth_rls_initplan on wallet_transactions
DROP POLICY IF EXISTS "own_transactions" ON public.wallet_transactions;
CREATE POLICY "own_transactions" ON public.wallet_transactions
FOR ALL USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- 6. Fix auth_rls_initplan on game_sessions
DROP POLICY IF EXISTS "own_sessions" ON public.game_sessions;
CREATE POLICY "own_sessions" ON public.game_sessions
FOR ALL USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- 7. Fix duplicate SELECT and auth_rls_initplan on civic_scores
DROP POLICY IF EXISTS "own_civic_write" ON public.civic_scores;
CREATE POLICY "own_civic_insert" ON public.civic_scores
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "own_civic_update" ON public.civic_scores
FOR UPDATE USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "own_civic_delete" ON public.civic_scores
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 8. Fix duplicate SELECT and auth_rls_initplan on mission_progress
DROP POLICY IF EXISTS "own_missions" ON public.mission_progress;
CREATE POLICY "own_missions_insert" ON public.mission_progress
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "own_missions_update" ON public.mission_progress
FOR UPDATE USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "own_missions_delete" ON public.mission_progress
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 9. Fix duplicate SELECT and auth_rls_initplan on player_badges
DROP POLICY IF EXISTS "own_badges" ON public.player_badges;
CREATE POLICY "own_badges_insert" ON public.player_badges
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "own_badges_update" ON public.player_badges
FOR UPDATE USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "own_badges_delete" ON public.player_badges
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 10. Fix auth_rls_initplan on user_achievements
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own achievements" ON public.user_achievements;
CREATE POLICY "Users can update their own achievements" ON public.user_achievements
FOR UPDATE USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
