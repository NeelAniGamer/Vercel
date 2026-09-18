-- Traffic Driving Simulator — Supabase Tables & Unified Account System
-- Run this SQL in your Supabase SQL Editor to create required tables

-- 0. Unified Accounts Table (Supports both Local PIN and Cloud Auth accounts)
CREATE TABLE IF NOT EXISTS accounts (
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
  appearance JSONB DEFAULT '{}',
  total_score INT DEFAULT 0,
  civic_score INT DEFAULT 0,
  wallet_balance BIGINT DEFAULT 50000,
  badges TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Wallet transactions (tracks all earn/deduct events)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'deduct')),
  source TEXT NOT NULL,
  balance_after BIGINT,
  level_id INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Civic score history
CREATE TABLE IF NOT EXISTS civic_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INT NOT NULL DEFAULT 0,
  level_id INT,
  violations INT DEFAULT 0,
  badges_earned TEXT[] DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Game sessions (for save/load state)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  level_id INT NOT NULL,
  wallet_balance BIGINT DEFAULT 50000,
  civic_score INT DEFAULT 0,
  total_score INT DEFAULT 0,
  play_time_seconds INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  session_data JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 4. Mission progress tracking
CREATE TABLE IF NOT EXISTS mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mission_id TEXT NOT NULL,
  level_id INT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'active', 'completed', 'failed')),
  progress INT DEFAULT 0,
  target INT DEFAULT 1,
  rewards_earned BIGINT DEFAULT 0,
  attempts INT DEFAULT 0,
  best_time INT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Player achievements/badges
CREATE TABLE IF NOT EXISTS player_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_scores_user ON civic_scores(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mission_progress_user ON mission_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_player_badges_user ON player_badges(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_read" ON accounts FOR SELECT USING (true);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_transactions" ON wallet_transactions FOR ALL USING (true);

ALTER TABLE civic_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_civic_write" ON civic_scores FOR ALL USING (true);
CREATE POLICY "civic_read" ON civic_scores FOR SELECT USING (true);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_sessions" ON game_sessions FOR ALL USING (true);

ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_missions" ON mission_progress FOR ALL USING (true);
CREATE POLICY "missions_read" ON mission_progress FOR SELECT USING (true);

ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_badges" ON player_badges FOR ALL USING (true);
CREATE POLICY "badges_read" ON player_badges FOR SELECT USING (true);

-- RPC function to upsert wallet balance atomically
CREATE OR REPLACE FUNCTION upsert_wallet_balance(
  p_user_id UUID,
  p_amount BIGINT,
  p_type TEXT,
  p_source TEXT,
  p_level_id INT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  current_balance BIGINT;
  new_balance BIGINT;
BEGIN
  -- Get or create wallet
  SELECT balance INTO current_balance FROM wallets WHERE user_id = p_user_id;
  
  IF current_balance IS NULL THEN
    current_balance := 50000; -- Starting balance
    INSERT INTO wallets (user_id, balance) VALUES (p_user_id, current_balance);
  END IF;
  
  -- Calculate new balance
  IF p_type = 'earn' THEN
    new_balance := current_balance + p_amount;
  ELSE
    new_balance := GREATEST(0, current_balance - p_amount);
  END IF;
  
  -- Update wallet
  UPDATE wallets SET balance = new_balance, updated_at = NOW() WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO wallet_transactions (user_id, amount, type, source, balance_after, level_id)
  VALUES (p_user_id, p_amount, p_type, p_source, new_balance, p_level_id);
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
