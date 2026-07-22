-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_val ON user_achievements(current_value DESC);

-- Global Leaderboard View
CREATE OR REPLACE VIEW global_leaderboard
WITH (security_invoker = true) AS
SELECT
    u.user_id,
    u.current_value,
    d.display_name
FROM user_achievements u
JOIN achievement_definitions d ON u.achievement_id = d.id
WHERE d.category = 'Global'
ORDER BY u.current_value DESC;

-- Category Leaderboard Function
CREATE OR REPLACE FUNCTION get_category_leaderboard(cat_name TEXT)
RETURNS TABLE (user_id UUID, score NUMERIC, achievement_name TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.user_id, u.current_value, d.display_name
    FROM user_achievements u
    JOIN achievement_definitions d ON u.achievement_id = d.id
    WHERE d.category = cat_name
    ORDER BY u.current_value DESC;
END;
$$;
