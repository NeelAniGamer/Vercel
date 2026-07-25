-- ============================================================
-- Migration: user_profiles table
-- Run this in Supabase SQL Editor to create/update the table
-- ============================================================

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  student_id TEXT UNIQUE,
  total_score INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 0,
  preferred_vehicle TEXT DEFAULT 'Car',
  age INTEGER,
  language TEXT DEFAULT 'en',
  role TEXT DEFAULT 'student',
  profile_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists (idempotent)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS modules_completed INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS badges_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_vehicle TEXT DEFAULT 'Car';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraints if not present
DO $$ BEGIN
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_username_unique UNIQUE (username);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_student_id_unique UNIQUE (student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create index for username lookups (for availability check and profile sharing)
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles (username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_student_id ON user_profiles (student_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_score ON user_profiles (total_score DESC);

-- Create a function to increment profile views atomically
CREATE OR REPLACE FUNCTION increment_profile_views(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET profile_views = COALESCE(profile_views, 0) + 1,
      updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check username availability
CREATE OR REPLACE FUNCTION check_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE LOWER(username) = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for leaderboard and profile sharing)
CREATE POLICY "Public read access" ON user_profiles
  FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow the increment function to update any profile (security definer handles this)
