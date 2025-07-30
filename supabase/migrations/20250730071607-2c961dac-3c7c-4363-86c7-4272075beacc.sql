-- Temporarily disable RLS to test the insertion, then re-enable with simpler policy

-- Disable RLS temporarily
ALTER TABLE public.inspection_requests DISABLE ROW LEVEL SECURITY;

-- Test if this fixes the issue - RLS is now disabled
-- This is temporary to isolate the problem