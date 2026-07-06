-- =============================================
-- SUPABASE ROW LEVEL SECURITY (RLS) SETUP
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- Step 1: Enable RLS on ALL your tables (add your table names)
-- Replace 'profiles' with your actual table names

-- Example for profiles table:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Step 2: Create policies for each table
-- Run this for profiles:

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =============================================
-- INSTRUCTIONS:
-- 1. List all your tables with user data
-- 2. Run "ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;" for each
-- 3. Create SELECT/INSERT/UPDATE policies for each
-- 4. Replace 'user_id' with your actual user ID column name
-- =============================================