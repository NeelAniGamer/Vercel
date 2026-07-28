-- Step 1: Create the profiles table
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

-- Step 2: Create the dashboard_links table
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
