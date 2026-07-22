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

