-- Unified Player Cloud Sync, Private RLS Enforcement, and Full Leaderboard RPC
-- Ensures:
--   1. Every player has private JSONB `player_state` on `public.user_profiles` (own-row RLS only).
--   2. Every registered auth user automatically receives a `user_profiles` row (and existing users are backfilled).
--   3. `get_full_leaderboard` returns all registered learners across XP, Modules, Civic Wallet, and Badges without PII leakage.

-- 1. Add private `player_state` JSONB column for cross-device Academy/Settings sync
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS player_state JSONB DEFAULT '{}'::jsonb;

-- 2. Harden RLS on private player tables so other users can never read/overwrite another player's state
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

CREATE POLICY "user_profiles_select_own" ON public.user_profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER TABLE IF EXISTS public.game_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read game_progress" ON public.game_progress;
DROP POLICY IF EXISTS "Allow insert game_progress" ON public.game_progress;
DROP POLICY IF EXISTS "Allow update game_progress" ON public.game_progress;
DROP POLICY IF EXISTS "game_progress_select_own" ON public.game_progress;
DROP POLICY IF EXISTS "game_progress_insert_own" ON public.game_progress;
DROP POLICY IF EXISTS "game_progress_update_own" ON public.game_progress;

CREATE POLICY "game_progress_select_own" ON public.game_progress
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "game_progress_insert_own" ON public.game_progress
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "game_progress_update_own" ON public.game_progress
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER TABLE IF EXISTS public.badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read badges" ON public.badges;
DROP POLICY IF EXISTS "Allow insert badges" ON public.badges;
DROP POLICY IF EXISTS "badges_select_own" ON public.badges;
DROP POLICY IF EXISTS "badges_insert_own" ON public.badges;

CREATE POLICY "badges_select_own" ON public.badges
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "badges_insert_own" ON public.badges
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Auto-provision `user_profiles` on signup so new learners immediately appear on leaderboards
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_handle TEXT;
  v_avatar TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(COALESCE(NEW.email, 'driver'), '@', 1),
    'Driver'
  );
  v_handle := '@' || REGEXP_REPLACE(LOWER(v_name), '[^a-z0-9_]+', '_', 'g');
  IF LENGTH(v_handle) < 4 THEN
    v_handle := '@driver_' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6);
  END IF;
  v_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', ''),
    NULL
  );

  INSERT INTO public.user_profiles (
    user_id, display_name, full_name, email, username, avatar_url,
    preferred_vehicle, age, language, total_score, modules_completed, badges_count,
    updated_at
  )
  VALUES (
    NEW.id, v_name, v_name, NEW.email, v_handle, v_avatar,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_vehicle', ''), 'Car'),
    18, 'en', 0, 0, 0, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(NULLIF(public.user_profiles.display_name, ''), EXCLUDED.display_name),
    full_name = COALESCE(NULLIF(public.user_profiles.full_name, ''), EXCLUDED.full_name),
    avatar_url = COALESCE(public.user_profiles.avatar_url, EXCLUDED.avatar_url),
    email = COALESCE(public.user_profiles.email, EXCLUDED.email);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_col_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_col_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. One-time backfill for existing `auth.users` missing `user_profiles`
INSERT INTO public.user_profiles (
  user_id, display_name, full_name, email, username, avatar_url,
  preferred_vehicle, age, language, total_score, modules_completed, badges_count, updated_at
)
SELECT
  au.id,
  COALESCE(
    NULLIF(TRIM(p.full_name), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(COALESCE(au.email, 'driver'), '@', 1)
  ),
  COALESCE(NULLIF(TRIM(p.full_name), ''), NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), '')),
  au.email,
  COALESCE(NULLIF(TRIM(p.username), ''), '@' || SUBSTRING(REPLACE(au.id::text, '-', ''), 1, 8)),
  COALESCE(p.avatar_url, NULLIF(au.raw_user_meta_data->>'avatar_url', '')),
  COALESCE(NULLIF(au.raw_user_meta_data->>'preferred_vehicle', ''), 'Car'),
  18, 'en', 0, 0, 0, NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ON CONFLICT (user_id) DO NOTHING;

-- 5. Unified Leaderboard RPC (non-PII columns only, requires authenticated session)
CREATE OR REPLACE FUNCTION public.get_full_leaderboard(p_limit INT DEFAULT 200)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  total_score BIGINT,
  modules_completed INT,
  wallet_balance BIGINT,
  badges_count INT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH gp_stats AS (
    SELECT
      gp.user_id,
      COALESCE(MAX(gp.total_score), 0)::BIGINT AS gp_score,
      COALESCE(MAX(gp.modules_completed), 0)::INT AS gp_modules
    FROM public.game_progress gp
    GROUP BY gp.user_id
  ),
  cert_stats AS (
    SELECT
      c.user_id,
      COALESCE(MAX(c.score), 0)::BIGINT AS cert_score,
      COALESCE(MAX(c.modules_completed), 0)::INT AS cert_modules,
      MAX(c.display_name) AS cert_name,
      MAX(c.avatar_url) AS cert_avatar
    FROM public.certificates c
    WHERE c.user_id IS NOT NULL
    GROUP BY c.user_id
  ),
  badge_stats AS (
    SELECT
      b.user_id,
      COUNT(DISTINCT b.badge_id)::INT AS badge_total
    FROM public.badges b
    GROUP BY b.user_id
  )
  SELECT
    up.user_id,
    COALESCE(
      NULLIF(TRIM(up.display_name), ''),
      NULLIF(TRIM(up.full_name), ''),
      NULLIF(TRIM(cs.cert_name), ''),
      NULLIF(REPLACE(up.username, '@', ''), ''),
      'Learner'
    ) AS display_name,
    up.username,
    COALESCE(up.avatar_url, cs.cert_avatar) AS avatar_url,
    GREATEST(COALESCE(up.total_score, 0)::BIGINT, COALESCE(gps.gp_score, 0), COALESCE(cs.cert_score, 0)) AS total_score,
    GREATEST(COALESCE(up.modules_completed, 0), COALESCE(gps.gp_modules, 0), COALESCE(cs.cert_modules, 0)) AS modules_completed,
    COALESCE(w.balance, 0)::BIGINT AS wallet_balance,
    GREATEST(COALESCE(up.badges_count, 0), COALESCE(bs.badge_total, 0)) AS badges_count,
    COALESCE(up.updated_at, w.updated_at, NOW()) AS updated_at
  FROM public.user_profiles up
  LEFT JOIN gp_stats gps ON gps.user_id = up.user_id
  LEFT JOIN cert_stats cs ON cs.user_id = up.user_id
  LEFT JOIN public.wallets w ON w.user_id = up.user_id
  LEFT JOIN badge_stats bs ON bs.user_id = up.user_id
  ORDER BY total_score DESC, modules_completed DESC, wallet_balance DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500);
END;
$$;

REVOKE ALL ON FUNCTION public.get_full_leaderboard(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_full_leaderboard(INT) TO authenticated;

-- 6. Harden wallet & wallet_transactions RLS + atomic session-verified RPC
ALTER TABLE IF EXISTS public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_transactions_select_own" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_transactions_insert_own" ON public.wallet_transactions;

CREATE POLICY "wallet_transactions_select_own" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "wallet_transactions_insert_own" ON public.wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.upsert_wallet_balance(
  p_user_id UUID,
  p_amount BIGINT,
  p_type TEXT,
  p_source TEXT,
  p_level_id INT DEFAULT NULL
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
  current_balance BIGINT;
  new_balance BIGINT;
  safe_amount BIGINT := ABS(COALESCE(p_amount, 0));
BEGIN
  IF caller_id IS NULL OR caller_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized wallet operation' USING ERRCODE = '42501';
  END IF;

  SELECT balance INTO current_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF current_balance IS NULL THEN
    current_balance := 50000;
    INSERT INTO public.wallets (user_id, balance, updated_at)
    VALUES (p_user_id, current_balance, NOW())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  IF p_type = 'earn' THEN
    new_balance := current_balance + safe_amount;
  ELSIF p_type = 'deduct' THEN
    new_balance := GREATEST(0, current_balance - safe_amount);
  ELSE
    RAISE EXCEPTION 'Invalid wallet transaction type: %', p_type USING ERRCODE = '22023';
  END IF;

  UPDATE public.wallets
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_transactions') THEN
    INSERT INTO public.wallet_transactions (user_id, amount, type, source, balance_after, level_id)
    VALUES (p_user_id, safe_amount, p_type, COALESCE(NULLIF(p_source, ''), 'game_event'), new_balance, p_level_id);
  END IF;

  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_wallet_balance(UUID, BIGINT, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_wallet_balance(UUID, BIGINT, TEXT, TEXT, INT) TO authenticated;
