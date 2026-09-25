-- Migration: 20260925_harden_qr_public_rpcs.sql
-- QR scans are intentionally available to anonymous visitors, but the RPCs
-- must not accept unbounded input or create scan rows for unknown/expired codes.

BEGIN;

CREATE OR REPLACE FUNCTION public.lookup_dynamic_qr(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_rec record;
  v_count integer;
BEGIN
  IF p_code IS NULL OR btrim(p_code) = '' OR length(p_code) > 128 THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT id, short_code, title, qr_type, destination_url, is_dynamic,
         (password_hash IS NOT NULL AND password_hash <> '') AS is_password_protected,
         (expires_at IS NOT NULL AND expires_at <= now()) AS is_expired,
         COALESCE(scans_count, 0) AS scans_count
    INTO v_rec
    FROM public.qr_codes
   WHERE short_code = p_code OR id::text = p_code
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  IF NOT v_rec.is_expired THEN
    UPDATE public.qr_codes
       SET scans_count = COALESCE(scans_count, 0) + 1
     WHERE id = v_rec.id
    RETURNING scans_count INTO v_count;
  ELSE
    v_count := v_rec.scans_count;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'id', v_rec.id,
    'short_code', v_rec.short_code,
    'title', v_rec.title,
    'type', v_rec.qr_type,
    'destination_url', v_rec.destination_url,
    'is_dynamic', v_rec.is_dynamic,
    'is_password_protected', v_rec.is_password_protected,
    'is_expired', v_rec.is_expired,
    'scans_count', v_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_qr_scan(
  p_code text,
  p_user_agent text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_os text DEFAULT NULL,
  p_referer text DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_qr_id uuid;
  v_expires_at timestamptz;
BEGIN
  IF p_code IS NULL OR btrim(p_code) = '' OR length(p_code) > 128 THEN
    RETURN false;
  END IF;

  SELECT id, expires_at
    INTO v_qr_id, v_expires_at
    FROM public.qr_codes
   WHERE short_code = p_code OR id::text = p_code;

  IF NOT FOUND OR (v_expires_at IS NOT NULL AND v_expires_at <= now()) THEN
    RETURN false;
  END IF;

  INSERT INTO public.qr_scans (
    qr_id, short_code, user_agent, ip_hash, device_type, browser, os,
    referer, country, scanned_at
  ) VALUES (
    v_qr_id,
    left(btrim(p_code), 128),
    left(coalesce(p_user_agent, ''), 512),
    left(coalesce(p_ip_hash, ''), 128),
    left(coalesce(p_device_type, ''), 64),
    left(coalesce(p_browser, ''), 64),
    left(coalesce(p_os, ''), 64),
    left(coalesce(p_referer, ''), 512),
    left(coalesce(p_country, ''), 64),
    now()
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.lookup_dynamic_qr(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_qr_scan(text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_dynamic_qr(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_qr_scan(text, text, text, text, text, text, text, text) TO anon, authenticated, service_role;

COMMIT;
