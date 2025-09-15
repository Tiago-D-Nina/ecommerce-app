-- Fix RLS policies for users table
-- Allow authenticated users to insert their own profile and update own profile

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create new comprehensive policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Add comment to track this fix
COMMENT ON TABLE public.users IS 'RLS policies fixed to allow INSERT for authenticated users - 2025-08-12';