# Achievement Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a unified system for global/category leaderboards and verifiable public certificates.

**Architecture:** A Supabase-backed achievement engine using a "Definition $\rightarrow$ Instance" model. High-security completions are handled via Postgres RPCs, and public verification is powered by unguessable UUID tokens.

**Tech Stack:** Supabase (Postgres, RLS, RPC), Vanilla JS, React 19, TypeScript.

## Global Constraints
- All new tables must have RLS enabled.
- Public verification links must use UUID tokens, not user IDs.
- Use the project design system variables: `--void`, `--signal`, `--ion`.
- All database changes must be performed via imperative SQL and verified before committing.

---

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

---

### Task 2: Leaderboard Views & Indexing

**Files:**
- Modify: Supabase Dashboard / SQL Editor

**Interfaces:**
- Consumes: `user_achievements`, `achievement_definitions`.
- Produces: `global_leaderboard` view, `category_leaderboard` function.

- [ ] **Step 1: Add indexes for performance**
```sql
CREATE INDEX idx_user_achievements_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_val ON user_achievements(current_value DESC);
```

- [ ] **Step 2: Create Global Leaderboard View**
```sql
CREATE OR REPLACE VIEW global_leaderboard AS
SELECT 
    u.user_id, 
    u.current_value, 
    d.display_name
FROM user_achievements u
JOIN achievement_definitions d ON u.achievement_id = d.id
WHERE d.category = 'Global'
ORDER BY u.current_value DESC;
```

- [ ] **Step 3: Create Category Leaderboard Function**
```sql
CREATE OR REPLACE FUNCTION get_category_leaderboard(cat_name TEXT)
RETURNS TABLE (user_id UUID, score NUMERIC, achievement_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.user_id, u.current_value, d.display_name
    FROM user_achievements u
    JOIN achievement_definitions d ON u.achievement_id = d.id
    WHERE d.category = cat_name
    ORDER BY u.current_value DESC;
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 4: Commit and verify views**
Run: `SELECT * FROM global_leaderboard LIMIT 5;`
Expected: Empty result, no errors.

---

### Task 3: Secure Achievement Completion RPC

**Files:**
- Modify: Supabase Dashboard / SQL Editor

**Interfaces:**
- Consumes: `user_achievements`, `achievement_definitions`.
- Produces: `complete_achievement` RPC function.

- [ ] **Step 1: Create the `complete_achievement` secure function**
```sql
CREATE OR REPLACE FUNCTION complete_achievement(target_achievement_slug TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    a_id UUID;
    u_id UUID := auth.uid();
BEGIN
    -- Get achievement ID
    SELECT id INTO a_id FROM achievement_definitions WHERE slug = target_achievement_slug;
    
    IF a_id IS NULL THEN RETURN FALSE; END IF;

    -- Securely mark as completed and generate token
    INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
    VALUES (u_id, a_id, true, now())
    ON CONFLICT (user_id, achievement_id) 
    DO UPDATE SET is_completed = true, completed_at = now();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

- [ ] **Step 2: Commit and verify RPC**
Try calling the function via Supabase Dashboard with a valid user session.
Expected: Returns `true` and row appears in `user_achievements`.

---

### Task 4: Public Verification Page

**Files:**
- Create: `verify.html`
- Create: `col-achievements.js` (Helper methods)

**Interfaces:**
- Consumes: `user_achievements` (via token), `achievement_definitions`.
- Produces: Public verification UI.

- [ ] **Step 1: Implement `col-achievements.js` fetcher**
```javascript
async function verifyCertificate(slug, token) {
    const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement_definitions(*)')
        .eq('achievement_definitions.slug', slug)
        .eq('verification_token', token)
        .single();
    return { data, error };
}
```

- [ ] **Step 2: Build `verify.html` UI**
Use the glassmorphism style with `--void` and `--signal`. Include:
- User name (from profile).
- Achievement name and description.
- Date of completion.
- "Verified" checkmark.

- [ ] **Step 3: Implement routing logic in `verify.html`**
Parse `URLSearchParams` for `cert` and `token`, call `verifyCertificate()`, and update DOM.

- [ ] **Step 4: Commit and test**
Manually insert a record into `user_achievements` with a token $\rightarrow$ visit `verify.html?cert=test&token=...`
Expected: Certificate renders correctly.

---

### Task 5: User Dashboard (Trophy Case & Leaderboard)

**Files:**
- Create: `dashboard.html`
- Modify: `col-achievements.js` (Add leaderboard fetchers)

**Interfaces:**
- Consumes: `global_leaderboard` view, `get_category_leaderboard` RPC.
- Produces: User Dashboard UI.

- [ ] **Step 1: Implement dashboard data fetching in `col-achievements.js`**
```javascript
async function getUserProgress() {
    return await supabase.from('user_achievements').select('*, achievement_definitions(*)');
}
async function getGlobalLeaderboard() {
    return await supabase.from('global_leaderboard').select('*').limit(10);
}
```

- [ ] **Step 2: Build `dashboard.html` UI**
- Create a "Trophy Case" grid:
    - If `is_completed == true` $\rightarrow$ Full color, "Share" button.
    - If `is_completed == false` $\rightarrow$ Grayscale, "Locked" icon.
- Create a Leaderboard section with a dropdown to switch between "Global" and "Category" (calls `get_category_leaderboard`).

- [ ] **Step 3: Implement "Share" functionality**
Generate link: `window.location.origin + '/verify?cert=' + slug + '&token=' + token`.

- [ ] **Step 4: Commit and test**
Login $\rightarrow$ Navigate to `/dashboard.html` $\rightarrow$ Verify trophies and leaderboard load.

---

### Task 6: Simulator Integration (HUD & Sync)

**Files:**
- Modify: `react-src/GamePage.tsx`
- Modify: `react-src/components/HUD.tsx` (Create if missing)

**Interfaces:**
- Consumes: `complete_achievement` RPC.
- Produces: HUD Notifications and score updates.

- [ ] **Step 1: Implement `AchievementToast` component in `HUD.tsx`**
A sliding glassmorphism panel that takes `title` and `message`.

- [ ] **Step 2: Add Achievement Trigger logic in `GamePage.tsx`**
```typescript
const triggerAchievement = async (slug: string) => {
    const { data, error } = await supabase.rpc('complete_achievement', { target_achievement_slug: slug });
    if (data) {
        setNotification(`Achievement Unlocked: ${slug}!`);
    }
}
```

- [ ] **Step 3: Integrate score syncing**
Call `supabase.from('user_achievements').upsert(...)` whenever the total score changes in the simulator.

- [ ] **Step 4: Commit and verify**
Drive in simulator $\rightarrow$ trigger a milestone $\rightarrow$ see HUD notification $\rightarrow$ check Dashboard.

---

### Task 7: Final End-to-End Verification

- [ ] **Step 1: Security Audit**
Try to visit `verify.html` with a random UUID token.
Expected: "Certificate not found" message.

- [ ] **Step 2: Full Loop Test**
User Login $\rightarrow$ Drive in Simulator $\rightarrow$ Earn Cert $\rightarrow$ View in Dashboard $\rightarrow$ Share Link $\rightarrow$ Verify as Anon.

- [ ] **Step 3: Commit and Finalize**
