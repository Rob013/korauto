-- Fix RLS issues for website_analytics table
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policy for website_analytics
CREATE POLICY "Allow anonymous and authenticated users to insert analytics"
ON public.website_analytics
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

-- Ensure cars table has proper public access
DROP POLICY IF EXISTS "Anyone can view cars" ON public.cars;
CREATE POLICY "Public read access to cars"
ON public.cars
FOR SELECT
TO public, anon, authenticated
USING (true);