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

