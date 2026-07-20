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

