-- Fix the RLS issue with cars table
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read cars (since it's a public catalog)
CREATE POLICY "Anyone can view cars" 
ON public.cars 
FOR SELECT 
USING (true);

-- Only allow service role to manage cars (for API sync)
CREATE POLICY "Service role can manage cars" 
ON public.cars 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Fix the search path issue for the auto_assign_admin_role function
CREATE OR REPLACE FUNCTION auto_assign_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'admin@korauto.com' THEN
    -- Insert admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also ensure they have a profile
    INSERT INTO profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, 'Admin')
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';