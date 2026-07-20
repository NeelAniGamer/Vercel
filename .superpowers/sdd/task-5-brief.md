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

