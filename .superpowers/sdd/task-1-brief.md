### Task 1: Database Schema Setup

**Files:**
- Modify: Supabase Dashboard / SQL Editor (via `execute_sql`)

**Interfaces:**
- Produces: `achievement_definitions` table, `user_achievements` table.

- [ ] **Step 1: Create `achievement_definitions` table**
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
```

- [ ] **Step 2: Create `user_achievements` table**
```sql
CREATE TABLE user_achievements (
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    achievement_id UUID REFERENCES achievement_definitions(id) NOT NULL,
    current_value NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    verification_token UUID DEFAULT gen_random_uuid(),
    PRIMARY KEY (user_id, achievement_id)
);
```

- [ ] **Step 3: Enable RLS and set policies**
```sql
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

- [ ] **Step 4: Commit and verify schema**
Run: `SELECT * FROM achievement_definitions;`
Expected: Empty table, no errors.

