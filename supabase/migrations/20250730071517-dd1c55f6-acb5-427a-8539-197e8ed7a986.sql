-- Fix RLS policies for inspection_requests - ensure anonymous users can insert

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous to create inspection requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Admins can view all inspection requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Admins can update inspection requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Service role can manage all inspection requests" ON public.inspection_requests;

-- Create specific policy for anonymous inserts that takes precedence
CREATE POLICY "Enable insert for anonymous users" 
ON public.inspection_requests 
FOR INSERT 
TO anon, public
WITH CHECK (true);

-- Create policy for authenticated users to insert as well
CREATE POLICY "Enable insert for authenticated users" 
ON public.inspection_requests 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Admin policies for SELECT and UPDATE
CREATE POLICY "Admins can view all inspection requests" 
ON public.inspection_requests 
FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update inspection requests" 
ON public.inspection_requests 
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Service role policy (most permissive, applied last)
CREATE POLICY "Service role can manage all inspection requests" 
ON public.inspection_requests 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);