-- Migration: 20260918_harden_security_definer_rpc.sql
-- Description: Hardens register_account against account takeover & role escalation,
--              hardens authenticate_account with safe search_path and uniform errors,
--              converts increment_profile_views to SECURITY INVOKER with search_path,
--              and moves privileged auth routines to private schema with SECURITY INVOKER public proxies.

-- 1. increment_profile_views: switch to SECURITY INVOKER & safe search_path
CREATE OR REPLACE FUNCTION public.increment_profile_views(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.user_profiles
  SET profile_views = COALESCE(profile_views, 0) + 1,
      updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_profile_views(uuid) TO anon, authenticated, service_role;

-- 2. Create private schema for privileged internal routines (not exposed to PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- 3. Internal privileged authentication function (private schema)
CREATE OR REPLACE FUNCTION private.authenticate_account(
    p_identifier TEXT,
    p_pin TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
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

    -- Return uniform error to prevent user enumeration
    IF v_account.id IS NULL OR v_account.pin_hash != extensions.crypt(p_pin, v_account.pin_hash) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid username, email, or PIN');
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

GRANT EXECUTE ON FUNCTION private.authenticate_account(TEXT, TEXT) TO anon, authenticated, service_role;

-- 4. Public API wrapper for authenticate_account (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.authenticate_account(
    p_identifier TEXT,
    p_pin TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private, extensions, pg_temp
AS $$
BEGIN
    RETURN private.authenticate_account(p_identifier, p_pin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_account(TEXT, TEXT) TO anon, authenticated, service_role;

-- 5. Internal privileged registration function (private schema)
CREATE OR REPLACE FUNCTION private.register_account(
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
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE
    v_clean_username TEXT;
    v_clean_email TEXT;
    v_student_id TEXT;
    v_pin_hash TEXT;
    v_role TEXT;
    v_existing_account public.accounts;
    v_account public.accounts;
    v_wallet_bal BIGINT;
BEGIN
    v_clean_username := TRIM(p_username);
    IF v_clean_username NOT LIKE '@%' THEN
        v_clean_username := '@' || v_clean_username;
    END IF;

    v_clean_email := NULLIF(TRIM(p_email), '');

    -- Check if username already exists
    SELECT * INTO v_existing_account
    FROM public.accounts
    WHERE LOWER(username) = LOWER(v_clean_username)
    LIMIT 1;

    IF v_existing_account.id IS NOT NULL THEN
        -- Verify PIN to prevent hostile overwrite; allow legitimate owner updates
        IF v_existing_account.pin_hash != extensions.crypt(p_pin, v_existing_account.pin_hash) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Username is already taken');
        END IF;

        -- Legitimate owner updating their setup - preserve existing PIN and safe role
        UPDATE public.accounts SET
            display_name = COALESCE(p_display_name, v_existing_account.display_name),
            email = COALESCE(v_clean_email, v_existing_account.email),
            preferred_vehicle = COALESCE(p_vehicle, v_existing_account.preferred_vehicle),
            age = COALESCE(p_age, v_existing_account.age),
            language = COALESCE(p_language, v_existing_account.language),
            appearance = CASE 
                WHEN p_appearance IS NOT NULL AND p_appearance != '{}'::jsonb THEN p_appearance 
                ELSE v_existing_account.appearance 
            END,
            updated_at = NOW(),
            last_login_at = NOW()
        WHERE id = v_existing_account.id
        RETURNING * INTO v_account;

        UPDATE public.user_profiles SET
            display_name = v_account.display_name,
            preferred_vehicle = v_account.preferred_vehicle,
            age = v_account.age,
            language = v_account.language,
            appearance = v_account.appearance,
            updated_at = NOW()
        WHERE user_id = v_account.id;

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
    END IF;

    -- New Account Creation: enforce safe default role
    v_role := CASE 
        WHEN LOWER(TRIM(COALESCE(p_role, 'student'))) IN ('student', 'learner', 'driver') THEN LOWER(TRIM(p_role))
        ELSE 'student'
    END;

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
        v_role,
        v_student_id,
        COALESCE(p_vehicle, 'Car'),
        COALESCE(p_age, 18),
        COALESCE(p_language, 'en'),
        COALESCE(p_appearance, '{}'::jsonb),
        NOW(),
        NOW()
    )
    RETURNING * INTO v_account;

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

GRANT EXECUTE ON FUNCTION private.register_account TO anon, authenticated, service_role;

-- 6. Public API wrapper for register_account (SECURITY INVOKER)
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
SECURITY INVOKER
SET search_path = public, private, extensions, pg_temp
AS $$
BEGIN
    RETURN private.register_account(
        p_username,
        p_pin,
        p_display_name,
        p_email,
        p_role,
        p_vehicle,
        p_age,
        p_language,
        p_student_id,
        p_appearance
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_account TO anon, authenticated, service_role;
