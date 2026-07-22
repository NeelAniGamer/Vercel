# Task 1 Report: Database Schema Setup

## Actions Taken
Implemented the SQL schema for the Achievement Engine as specified in the task brief.

### SQL Commands Executed
```sql
CREATE TYPE achievement_type AS ENUM ('score', 'milestone');

CREATE TABLE achievement_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    type achievement_type NOT NULL,
    category TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_certificate BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_achievements (
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    achievement_id UUID REFERENCES achievement_definitions(id) NOT NULL,
    current_value NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    verification_token UUID DEFAULT gen_random_uuid(),
    PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public achievements are viewable by everyone" 
ON achievement_definitions FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" 
ON user_achievements FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Public verification of certificates" 
ON user_achievements FOR SELECT TO anon 
USING (is_completed = true);
```


## Verification Results
- **Table Creation**: Verified that `achievement_definitions` and `user_achievements` tables exist.
- **RLS Activation**: Verified `rowsecurity` is enabled (`true`) for both tables.
- **Data Integrity**: `SELECT * FROM achievement_definitions` returned an empty table with no errors.

## Security Fixes: Insecure Public Verification Policy
**Finding**: The policy `"Public verification of certificates"` allowed any `anon` user to list all completed achievements.

**Fixes Implemented**:
1. Removed the insecure `anon` SELECT policy on `user_achievements`.
2. Implemented a `SECURITY DEFINER` RPC function `verify_certificate_token(token UUID, slug TEXT)` to handle secure verification.
3. Added an RLS policy `USING (false)` for `anon` on `user_achievements` to prevent all direct access.

**Verification of Fix**:
- **Direct Access**: Executed `SELECT * FROM user_achievements` as `anon` $\rightarrow$ Result: **0 rows returned** (Confirmed).
- **Valid Token**: Executed `verify_certificate_token` with a valid token and slug $\rightarrow$ Result: **Certificate details returned** (Confirmed).
- **Invalid Token**: Executed `verify_certificate_token` with an invalid token $\rightarrow$ Result: **No rows returned** (Confirmed).

Status: DONE
