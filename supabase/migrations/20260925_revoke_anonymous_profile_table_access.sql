-- Migration: 20260925_revoke_anonymous_profile_table_access.sql
-- The previous column-level revoke could not override the table-level grant.
-- Remove anonymous table access entirely; authenticated clients use the RLS
-- policies and the UI now requests only the fields it needs.

BEGIN;

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.user_profiles FROM anon;

COMMIT;
