# Global Identity & Parent/Teacher Dashboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a cloud-based identity system to fix device-specific UIDs and create secure monitoring dashboards for Parents and Teachers.

**Architecture:** Move from local `localStorage` UIDs to a Supabase `profiles` table. Use a secondary `dashboard_links` table to manage the verified relationship between an adult account and a student profile.

**Tech Stack:** Supabase (Auth & Postgres), Vanilla JavaScript, HTML/CSS.

## Global Constraints
- **Identity**: One email account = one global UID in `public.profiles`.
- **Security**: Linking requires a 6-digit verification code sent to the student's email.
- **UI**: Dashboards must follow the project's CSS variable system (`--void`, `--signal`, `--ion`).
- **UX**: Setup page must no longer generate random IDs locally.

---

### Task 1: Database Schema Setup

**Files:**
- SQL: Execute in Supabase SQL Editor

**Interfaces:**
- Produces: `public.profiles` table, `public.dashboard_links` table, and RLS policies.

- [ ] **Step 1: Run the SQL to create the `profiles` table**
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

- [ ] **Step 2: Run the SQL to create the `dashboard_links` table**
```sql
CREATE TABLE public.dashboard_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'verified')) DEFAULT 'pending',
    verification_code TEXT,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(parent_teacher_id, student_id)
);
ALTER TABLE public.dashboard_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults can view their own links" ON public.dashboard_links FOR SELECT USING (auth.uid() = parent_teacher_id);
CREATE POLICY "Adults can create link requests" ON public.dashboard_links FOR INSERT WITH CHECK (auth.uid() = parent_teacher_id);
CREATE POLICY "Adults can update their own link status" ON public.dashboard_links FOR UPDATE USING (auth.uid() = parent_teacher_id);
```

- [ ] **Step 3: Commit schema changes to a migration file in the repo for tracking**
`git add docs/db/migrations/2026-07-24-identity-setup.sql`
`git commit -m "db: add profiles and dashboard_links tables"`

---

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

### Task 3: Setup Page Overhaul (`TrafficSetup.html`)

**Files:**
- Modify: `Traffic/TrafficSetup.html`
- Modify: Associated JS in `Traffic/`

**Interfaces:**
- Consumes: `window.colUser.uid` from `col-auth.js`

- [ ] **Step 1: Find and remove all `localStorage.setItem('uid', ...)` and `Math.random()` ID generation**
Search for all instances of local ID assignment and replace them with a reference to `window.colUser.uid`.

- [ ] **Step 2: Update identity initialization**
Ensure the Setup page waits for the `col-auth-changed` event before initializing the game state.
```javascript
window.addEventListener('col-auth-changed', (e) => {
  const user = e.detail.user;
  if (user) {
    const globalUid = user.id; // This is now the source of truth
    // ... initialize game with globalUid
  }
});
```

- [ ] **Step 3: Verify that Setup page no longer creates new IDs on refresh**
Refresh the page after login and ensure the UID remains constant.

- [ ] **Step 4: Commit changes**
`git add Traffic/TrafficSetup.html`
`git commit -m "setup: remove local ID generation and implement global identity"`

---

### Task 4: Dashboard Logic & Linking (`dashboard-logic.js`)

**Files:**
- Create: `dashboard-logic.js`

**Interfaces:**
- Produces: `requestStudentLink(username)`, `verifyStudentLink(code)`, `getLinkedStudents()`

- [ ] **Step 1: Implement `requestStudentLink(username)`**
```javascript
async function requestStudentLink(username) {
  // 1. Find student_id from profiles where username = username
  // 2. Generate 6-digit random code
  // 3. Insert into dashboard_links (parent_teacher_id, student_id, status='pending', verification_code)
  // 4. (Optional) Trigger email via Supabase Edge Function or simple log for now
}
```

- [ ] **Step 2: Implement `verifyStudentLink(code)`**
```javascript
async function verifyStudentLink(code) {
  // 1. Find pending link for auth.uid() where verification_code = code
  // 2. Update status to 'verified'
}
```

- [ ] **Step 3: Implement `getLinkedStudents()`**
```javascript
async function getLinkedStudents() {
  // Query dashboard_links join profiles where status = 'verified'
  // Return array of { student_id, username, full_name }
}
```

- [ ] **Step 4: Commit changes**
`git add dashboard-logic.js`
`git commit -m "feat: implement student linking and verification logic"`

---

### Task 5: Parent & Teacher Dashboard UI

**Files:**
- Create: `ParentDashboard.html`
- Create: `TeacherDashboard.html`
- Modify: `col-router.js` (Add routes for dashboards)

**Interfaces:**
- Consumes: `dashboard-logic.js` functions

- [ ] **Step 1: Create HTML layout for Dashboards**
Use the `--panel` and `--void` variables. Include:
- Input field for Student Username.
- "Link Student" button $\rightarrow$ triggers `requestStudentLink`.
- Code input field (initially hidden) $\rightarrow$ triggers `verifyStudentLink`.
- Student Grid: Containers for linked student cards.

- [ ] **Step 2: Implement Dynamic Student List**
Call `getLinkedStudents()` on load and render a card for each verified student. Each card should link to the student's public progress page.

- [ ] **Step 3: Test the end-to-end flow**
1. Student signs up $\rightarrow$ Global UID created.
2. Parent signs in $\rightarrow$ Enters student username $\rightarrow$ Receives code.
3. Parent enters code $\rightarrow$ Link verified.
4. Parent sees student in their grid.

- [ ] **Step 4: Commit changes**
`git add ParentDashboard.html TeacherDashboard.html col-router.js`
`git commit -m "feat: add parent and teacher dashboards with linking flow"`
