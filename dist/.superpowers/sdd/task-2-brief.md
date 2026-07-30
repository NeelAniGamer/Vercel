### Task 2: Global Identity Integration (`col-auth.js`)

**Files:**
- Modify: `col-auth.js`

**Interfaces:**
- Consumes: `supabaseClient`
- Produces: `window.colUser.uid` (The global ID from `profiles.id`)

- [ ] **Step 1: Update `initSupabase` auth listener to fetch/create profile**
Modify the `onAuthStateChange` block to:
1. Query `public.profiles` where `id === session.user.id`.
2. If profile exists: set `window.colUser.uid = profile.id`.
3. If profile doesn't exist: trigger a "username prompt" modal (using the existing `col-auth-md` style) to create the profile record.

- [ ] **Step 2: Implement `createProfile(username)` function**
```javascript
async function createProfile(username) {
  const { data, error } = await window.supabaseClient
    .from('profiles')
    .insert([{ 
      id: window.colUser.id, 
      username: username, 
      email: window.colUser.email 
    }]);
  if (error) throw error;
}
```

- [ ] **Step 3: Test on two different devices**
Log in with the same email on two browsers. Verify that `window.colUser.uid` is identical on both.

- [ ] **Step 4: Commit changes**
`git add col-auth.js`
`git commit -m "auth: synchronize user identity with cloud profiles"`

---

