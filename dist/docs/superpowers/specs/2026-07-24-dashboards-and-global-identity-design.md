# Design Spec: Global Identity & Parent/Teacher Dashboards
Date: 2026-07-24
Status: Draft

## 1. Overview
The goal is to implement a robust identity system that eliminates device-specific UIDs and provides a secure way for Parents and Teachers to monitor Student progress.

### Core Objectives
- **Global Identity**: Move from `localStorage`-based UIDs to a Supabase-backed `profiles` table. One email = one global UID.
- **Secure Linking**: Use a verification code sent to the student's email to authorize Parent/Teacher access.
- **Dashboards**: Create specialized views for Parents/Teachers to monitor linked students.
- **Setup Page Fix**: Update the `TrafficSetup.html` flow to prioritize cloud-based identity.

---

## 2. Data Architecture

### 2.1 Database Schema (Supabase SQL)
We will implement two new tables and a trigger to ensure every authenticated user has a profile.

```sql
-- 1. Profiles Table: The source of truth for Student/User identity
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Dashboard Links Table: Securely connects Adults to Students
CREATE TABLE public.dashboard_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'verified')) DEFAULT 'pending',
    verification_code TEXT,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- Prevent duplicate links between the same adult and student
    UNIQUE(parent_teacher_id, student_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_links ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, others can read public info (username)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Links: Adults can manage their own links
CREATE POLICY "Adults can view their own links" ON public.dashboard_links
    FOR SELECT USING (auth.uid() = parent_teacher_id);

CREATE POLICY "Adults can create link requests" ON public.dashboard_links
    FOR INSERT WITH CHECK (auth.uid() = parent_teacher_id);

CREATE POLICY "Adults can update their own link status" ON public.dashboard_links
    FOR UPDATE USING (auth.uid() = parent_teacher_id);
```

### 2.2 Identity Flow
1. **Auth Event**: `col-auth.js` triggers on sign-in.
2. **Profile Check**: The app queries `public.profiles` using `auth.uid()`.
3. **Creation**: If no profile exists, the app prompts for a `username` and creates the record.
4. **Consistency**: The `id` from the `profiles` table is now used as the global UID across all devices.

---

## 3. Feature Implementation

### 3.1 Parent/Teacher Dashboard
- **Adding a Student**:
    - Input: `student_username`.
    - Action: Query `profiles` to get `student_id`.
    - Process: Insert into `dashboard_links` with a random 6-digit `verification_code` and status `'pending'`.
- **Linking**:
    - Verification: Parent enters the code received by the student.
    - Validation: System checks if code matches the `pending` record for that `parent_teacher_id` and `student_id`.
    - Completion: Update status to `'verified'`.
- **Monitoring**:
    - Fetch all `student_id`s where `status = 'verified'`.
    - Fetch progress data for those IDs from the game's data tables.

### 3.2 Setup Page Fix (`TrafficSetup.html`)
- **Identity Shift**: Remove any logic that generates a random UID and stores it in `localStorage`.
- **Synchronization**: Ensure the Setup page calls the new profile-loading logic to retrieve the global UID before initializing game settings.

---

## 4. Success Criteria
- [ ] One email account yields the same UID on laptop and phone.
- [ ] Parent can enter a username and a verification code to link a student.
- [ ] Parent dashboard correctly displays progress for all linked students.
- [ ] Students cannot be linked without a valid email verification code.
