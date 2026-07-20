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

