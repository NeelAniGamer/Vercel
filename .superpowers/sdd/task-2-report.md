# Task 2 Report: Leaderboard Views & Indexing

## Implementation Details

### 1. Performance Indexes
Implemented the following indexes on `user_achievements` to optimize leaderboard queries:
- `idx_user_achievements_id` on `achievement_id`
- `idx_user_achievements_val` on `current_value DESC`

**SQL Script:** `supabase/migrations/20260720_leaderboards.sql`

### 2. Global Leaderboard View
Created the `global_leaderboard` view. 
- **Security**: Configured with `security_invoker = true` to ensure RLS is respected.
- **Logic**: Joins `user_achievements` and `achievement_definitions`, filters for 'Global' category, and sorts by value descending.

### 3. Category Leaderboard Function
Created the `get_category_leaderboard(cat_name TEXT)` function.
- **Security**: Configured as `SECURITY INVOKER`.
- **Logic**: Returns a table of user IDs, scores, and achievement names for a given category, sorted by value descending.

## Verification Results
- Executed `SELECT * FROM global_leaderboard LIMIT 5;` $\rightarrow$ Returned empty result (Expected for initial state), no errors.
- Executed `SELECT * FROM get_category_leaderboard('Global') LIMIT 5;` $\rightarrow$ Returned empty result, no errors.

**Status:** DONE
