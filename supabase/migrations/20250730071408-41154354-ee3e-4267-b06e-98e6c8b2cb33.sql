-- Fix RLS policies for inspection_requests table to allow anonymous users to insert requests

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create inspection requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Admins can view all inspection requests" ON public.inspection_requests;
DROP POLICY IF EXISTS "Service role can manage inspection requests" ON public.inspection_requests;

-- Create new policies that allow anonymous insertions
CREATE POLICY "Allow anonymous to create inspection requests" 
ON public.inspection_requests 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view all inspection requests" 
ON public.inspection_requests 
FOR SELECT 
TO public
USING (public.is_admin());

CREATE POLICY "Admins can update inspection requests" 
ON public.inspection_requests 
FOR UPDATE 
TO public
USING (public.is_admin());

CREATE POLICY "Service role can manage all inspection requests" 
ON public.inspection_requests 
FOR ALL 
TO public
USING (auth.role() = 'service_role');