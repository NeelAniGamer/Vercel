-- Migration: 20260918_qr_studio_and_admin_security.sql
-- Description: Enhances QR codes and QR scans tables, implements atomic dynamic QR lookup,
-- and configures admin role-based access control and RLS.

-- 1. ENHANCE public.qr_codes
ALTER TABLE public.qr_codes 
  ADD COLUMN IF NOT EXISTS short_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS title text DEFAULT 'Untitled QR',
  ADD COLUMN IF NOT EXISTS qr_type text DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS destination_url text,
  ADD COLUMN IF NOT EXISTS is_dynamic boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS scans_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS design_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON public.qr_codes(short_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_dynamic ON public.qr_codes(is_dynamic);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON public.qr_codes(created_at DESC);

-- 2. ENHANCE public.qr_scans
ALTER TABLE public.qr_scans
  ADD COLUMN IF NOT EXISTS short_code text,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS os text,
  ADD COLUMN IF NOT EXISTS referer text,
  ADD COLUMN IF NOT EXISTS country text;

CREATE INDEX IF NOT EXISTS idx_qr_scans_short_code ON public.qr_scans(short_code);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON public.qr_scans(scanned_at DESC);

-- 3. ENHANCE public.feedback
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS urgency integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- 4. ADMIN ACCESS HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN ('subscriptionfound@gmail.com', 'neelgbadri@gmail.com')
    OR
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE (auth_user_id = auth.uid() OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
        AND role = 'admin'
    )
  );
$$;

UPDATE public.accounts 
SET role = 'admin' 
WHERE LOWER(email) IN ('subscriptionfound@gmail.com', 'neelgbadri@gmail.com');

-- 5. RLS POLICIES FOR QR_CODES & QR_SCANS & FEEDBACK
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can create their own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can update their own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can delete their own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admins have full access to QR codes" ON public.qr_codes;

DROP POLICY IF EXISTS "QR owners can view their scans" ON public.qr_scans;
DROP POLICY IF EXISTS "Anyone can log a QR scan" ON public.qr_scans;
DROP POLICY IF EXISTS "Admins have full access to QR scans" ON public.qr_scans;
DROP POLICY IF EXISTS "QR owners and admins can view scans" ON public.qr_scans;

DROP POLICY IF EXISTS "Admins can view and manage all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;

CREATE POLICY "Users can view their own QR codes" ON public.qr_codes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create their own QR codes" ON public.qr_codes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update their own QR codes" ON public.qr_codes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete their own QR codes" ON public.qr_codes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Anyone can log a QR scan" ON public.qr_scans
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "QR owners and admins can view scans" ON public.qr_scans
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    qr_id IN (SELECT id FROM public.qr_codes WHERE user_id = auth.uid()) OR
    short_code IN (SELECT short_code FROM public.qr_codes WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view and manage all feedback" ON public.feedback
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR COALESCE(email, user_email) = (auth.jwt() ->> 'email'));

-- 6. ATOMIC DYNAMIC QR LOOKUP RPC
CREATE OR REPLACE FUNCTION public.lookup_dynamic_qr(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec record;
BEGIN
  SELECT id, short_code, title, qr_type, destination_url, is_dynamic, 
         (password_hash IS NOT NULL AND password_hash <> '') AS is_password_protected,
         (expires_at IS NOT NULL AND expires_at < now()) AS is_expired,
         scans_count
  INTO v_rec
  FROM public.qr_codes
  WHERE short_code = p_code OR id::text = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  UPDATE public.qr_codes SET scans_count = scans_count + 1 WHERE id = v_rec.id;

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
    'scans_count', v_rec.scans_count + 1
  );
END;
$$;

-- 7. RECORD DETAILED QR SCAN RPC
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
AS $$
DECLARE
  v_qr_id uuid;
BEGIN
  SELECT id INTO v_qr_id FROM public.qr_codes WHERE short_code = p_code OR id::text = p_code;
  
  INSERT INTO public.qr_scans (
    qr_id,
    short_code,
    user_agent,
    ip_hash,
    device_type,
    browser,
    os,
    referer,
    country,
    scanned_at
  ) VALUES (
    v_qr_id,
    p_code,
    p_user_agent,
    p_ip_hash,
    p_device_type,
    p_browser,
    p_os,
    p_referer,
    p_country,
    now()
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
