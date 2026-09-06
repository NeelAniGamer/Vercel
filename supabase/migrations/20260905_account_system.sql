-- Migration: Account System & Data Tables Optimization
-- Date: 2026-09-05
-- Description: Establishes a unified accounts table, fixes data table constraints, and adds secure RPC functions.

-- 1. Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT,
    pin_hash TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    student_id TEXT UNIQUE,
    preferred_vehicle TEXT DEFAULT 'Car',
    age INT DEFAULT 18,
    language TEXT DEFAULT 'en',
    avatar_url TEXT,
    appearance JSONB DEFAULT '{}'::jsonb,
    total_score INT DEFAULT 0,
    civic_score INT DEFAULT 0,
    wallet_balance BIGINT DEFAULT 50000,
    badges TEXT[] DEFAULT '{}'::text[],
    metadata JSONB DEFAULT '{}'::jsonb,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_username_lower ON public.accounts (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_accounts_email_lower ON public.accounts (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_accounts_student_id ON public.accounts (student_id);

-- 2. Relax rigid auth.users foreign key constraints on game data tables
ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_user_id_fkey;
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_user_id_fkey;
ALTER TABLE public.civic_scores DROP CONSTRAINT IF EXISTS civic_scores_user_id_fkey;
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;
ALTER TABLE public.game_progress DROP CONSTRAINT IF EXISTS game_progress_user_id_fkey;
ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_user_id_fkey;
ALTER TABLE public.mission_progress DROP CONSTRAINT IF EXISTS mission_progress_user_id_fkey;
ALTER TABLE public.player_badges DROP CONSTRAINT IF EXISTS player_badges_user_id_fkey;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey;
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;

-- 3. Fix user_profiles defaults and constraints
ALTER TABLE public.user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- 4. Secure RPC function to register or update an account
CREATE OR REPLACE FUNCTION public.register_account(
    p_username TEXT,
    p_pin TEXT,
    p_display_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'student',
    p_vehicle TEXT DEFAULT 'Car',
    p_age INT DEFAULT 18,
    p_language TEXT DEFAULT 'en',
    p_student_id TEXT DEFAULT NULL,
    p_appearance JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_username TEXT;
    v_clean_email TEXT;
    v_student_id TEXT;
    v_pin_hash TEXT;
    v_account public.accounts;
BEGIN
    v_clean_username := TRIM(p_username);
    IF v_clean_username NOT LIKE '@%' THEN
        v_clean_username := '@' || v_clean_username;
    END IF;

    v_clean_email := NULLIF(TRIM(p_email), '');
    v_student_id := COALESCE(NULLIF(TRIM(p_student_id), ''), 'STU-' || FLOOR(100000 + RANDOM() * 900000)::TEXT);
    v_pin_hash := extensions.crypt(p_pin, extensions.gen_salt('bf'));

    INSERT INTO public.accounts (
        username,
        display_name,
        email,
        pin_hash,
        role,
        student_id,
        preferred_vehicle,
        age,
        language,
        appearance,
        updated_at,
        last_login_at
    ) VALUES (
        v_clean_username,
        COALESCE(p_display_name, SUBSTRING(v_clean_username FROM 2)),
        v_clean_email,
        v_pin_hash,
        COALESCE(p_role, 'student'),
        v_student_id,
        COALESCE(p_vehicle, 'Car'),
        COALESCE(p_age, 18),
        COALESCE(p_language, 'en'),
        COALESCE(p_appearance, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (username) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, accounts.display_name),
        email = COALESCE(EXCLUDED.email, accounts.email),
        pin_hash = EXCLUDED.pin_hash,
        role = COALESCE(EXCLUDED.role, accounts.role),
        preferred_vehicle = COALESCE(EXCLUDED.preferred_vehicle, accounts.preferred_vehicle),
        age = COALESCE(EXCLUDED.age, accounts.age),
        language = COALESCE(EXCLUDED.language, accounts.language),
        appearance = COALESCE(EXCLUDED.appearance, accounts.appearance),
        updated_at = NOW(),
        last_login_at = NOW()
    RETURNING * INTO v_account;

    -- Upsert matching row into user_profiles
    INSERT INTO public.user_profiles (
        user_id,
        username,
        display_name,
        role,
        student_id,
        preferred_vehicle,
        age,
        language,
        appearance,
        total_score,
        civic_score,
        updated_at
    ) VALUES (
        v_account.id,
        v_account.username,
        v_account.display_name,
        v_account.role,
        v_account.student_id,
        v_account.preferred_vehicle,
        v_account.age,
        v_account.language,
        v_account.appearance,
        v_account.total_score,
        v_account.civic_score,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        student_id = EXCLUDED.student_id,
        preferred_vehicle = EXCLUDED.preferred_vehicle,
        age = EXCLUDED.age,
        language = EXCLUDED.language,
        appearance = EXCLUDED.appearance,
        updated_at = NOW();

    -- Ensure matching wallet exists
    INSERT INTO public.wallets (user_id, balance, updated_at)
    VALUES (v_account.id, 50000, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_account.id,
        'username', v_account.username,
        'display_name', v_account.display_name,
        'email', v_account.email,
        'role', v_account.role,
        'student_id', v_account.student_id,
        'preferred_vehicle', v_account.preferred_vehicle,
        'age', v_account.age,
        'language', v_account.language,
        'appearance', v_account.appearance,
        'total_score', v_account.total_score,
        'civic_score', v_account.civic_score,
        'wallet_balance', v_account.wallet_balance,
        'badges', v_account.badges,
        'created_at', v_account.created_at
    );
END;
$$;

-- 5. Secure RPC function to authenticate an account
CREATE OR REPLACE FUNCTION public.authenticate_account(
    p_identifier TEXT,
    p_pin TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_ident TEXT;
    v_account public.accounts;
    v_wallet_bal BIGINT;
BEGIN
    v_clean_ident := TRIM(p_identifier);

    SELECT * INTO v_account
    FROM public.accounts
    WHERE LOWER(username) = LOWER(v_clean_ident)
       OR LOWER(username) = LOWER('@' || v_clean_ident)
       OR (v_clean_ident LIKE '@%' AND LOWER(username) = LOWER(v_clean_ident))
       OR (email IS NOT NULL AND LOWER(email) = LOWER(v_clean_ident))
    LIMIT 1;

    IF v_account.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account not found');
    END IF;

    IF v_account.pin_hash != extensions.crypt(p_pin, v_account.pin_hash) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN or password');
    END IF;

    UPDATE public.accounts
    SET last_login_at = NOW()
    WHERE id = v_account.id;

    SELECT balance INTO v_wallet_bal
    FROM public.wallets
    WHERE user_id = v_account.id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_account.id,
        'username', v_account.username,
        'display_name', v_account.display_name,
        'email', v_account.email,
        'role', v_account.role,
        'student_id', v_account.student_id,
        'preferred_vehicle', v_account.preferred_vehicle,
        'age', v_account.age,
        'language', v_account.language,
        'appearance', v_account.appearance,
        'total_score', v_account.total_score,
        'civic_score', v_account.civic_score,
        'wallet_balance', COALESCE(v_wallet_bal, v_account.wallet_balance),
        'badges', v_account.badges,
        'created_at', v_account.created_at
    );
END;
$$;

-- 6. Secure RPC function to synchronize account progress
CREATE OR REPLACE FUNCTION public.sync_account_progress(
    p_account_id UUID,
    p_score INT DEFAULT NULL,
    p_civic_score INT DEFAULT NULL,
    p_wallet BIGINT DEFAULT NULL,
    p_badges TEXT[] DEFAULT NULL,
    p_modules_completed INT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_account public.accounts;
BEGIN
    SELECT * INTO v_account FROM public.accounts WHERE id = p_account_id;
    IF v_account.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account not found');
    END IF;

    UPDATE public.accounts
    SET
        total_score = COALESCE(p_score, total_score),
        civic_score = COALESCE(p_civic_score, civic_score),
        wallet_balance = COALESCE(p_wallet, wallet_balance),
        badges = COALESCE(p_badges, badges),
        updated_at = NOW()
    WHERE id = p_account_id;

    UPDATE public.user_profiles
    SET
        total_score = COALESCE(p_score, total_score),
        civic_score = COALESCE(p_civic_score, civic_score),
        modules_completed = COALESCE(p_modules_completed, modules_completed),
        badges_count = CASE WHEN p_badges IS NOT NULL THEN cardinality(p_badges) ELSE badges_count END,
        updated_at = NOW()
    WHERE user_id = p_account_id;

    IF p_wallet IS NOT NULL THEN
        INSERT INTO public.wallets (user_id, balance, updated_at)
        VALUES (p_account_id, p_wallet, NOW())
        ON CONFLICT (user_id) DO UPDATE SET balance = p_wallet, updated_at = NOW();
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 7. Grant execution privileges to anon and authenticated
GRANT EXECUTE ON FUNCTION public.register_account TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.authenticate_account TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_account_progress TO anon, authenticated, service_role;

-- 8. Row Level Security policies
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public accounts viewable" ON public.accounts;
CREATE POLICY "Public accounts viewable" ON public.accounts FOR SELECT USING (true);

-- Protect raw pin_hash from plain SELECT queries by anon/authenticated
REVOKE SELECT (pin_hash) ON public.accounts FROM anon, authenticated;

-- Policies for user_profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow read user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update user_profiles" ON public.user_profiles;

CREATE POLICY "Allow read user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert user_profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update user_profiles" ON public.user_profiles FOR UPDATE USING (true) WITH CHECK (true);

-- Policies for wallets
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Allow read wallets" ON public.wallets;
DROP POLICY IF EXISTS "Allow insert wallets" ON public.wallets;
DROP POLICY IF EXISTS "Allow update wallets" ON public.wallets;

CREATE POLICY "Allow read wallets" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Allow insert wallets" ON public.wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update wallets" ON public.wallets FOR UPDATE USING (true) WITH CHECK (true);

-- Policies for game_progress
DROP POLICY IF EXISTS "Users can view their own game progress" ON public.game_progress;
DROP POLICY IF EXISTS "Users can insert their own game progress" ON public.game_progress;
DROP POLICY IF EXISTS "Users can update their own game progress" ON public.game_progress;
DROP POLICY IF EXISTS "Allow read game_progress" ON public.game_progress;
DROP POLICY IF EXISTS "Allow insert game_progress" ON public.game_progress;
DROP POLICY IF EXISTS "Allow update game_progress" ON public.game_progress;

CREATE POLICY "Allow read game_progress" ON public.game_progress FOR SELECT USING (true);
CREATE POLICY "Allow insert game_progress" ON public.game_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update game_progress" ON public.game_progress FOR UPDATE USING (true) WITH CHECK (true);

-- Policies for badges
DROP POLICY IF EXISTS "Users can view their own badges" ON public.badges;
DROP POLICY IF EXISTS "Allow read badges" ON public.badges;
DROP POLICY IF EXISTS "Allow insert badges" ON public.badges;

CREATE POLICY "Allow read badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Allow insert badges" ON public.badges FOR INSERT WITH CHECK (true);

-- Policies for certificates
DROP POLICY IF EXISTS "certificates_select_policy" ON public.certificates;
DROP POLICY IF EXISTS "certificates_insert_policy" ON public.certificates;
DROP POLICY IF EXISTS "Allow read certificates" ON public.certificates;
DROP POLICY IF EXISTS "Allow insert certificates" ON public.certificates;
DROP POLICY IF EXISTS "Allow update certificates" ON public.certificates;

CREATE POLICY "Allow read certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Allow insert certificates" ON public.certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update certificates" ON public.certificates FOR UPDATE USING (true) WITH CHECK (true);
