-- Enable RLS and create policy for anonymous read access
-- This allows the frontend to read from encar_cars_cache

-- Enable RLS on the table
ALTER TABLE public.encar_cars_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous SELECT
CREATE POLICY "Allow anonymous read access" 
ON public.encar_cars_cache
FOR SELECT
TO anon
USING (true);

-- Also allow authenticated users
CREATE POLICY "Allow authenticated read access" 
ON public.encar_cars_cache
FOR SELECT
TO authenticated
USING (true);
