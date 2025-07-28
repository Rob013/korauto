-- Create admin user with email and password
-- Note: This will create the user in auth.users automatically when they first sign up

-- First, let's check if we have proper admin setup
-- Insert admin role for a specific user (you'll need to sign up first with this email)
-- The email you should use to sign up: admin@korauto.com
-- The password you should use: KorAuto2024!

-- Create a function to automatically assign admin role to the first user with admin email
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign admin role
CREATE TRIGGER auto_assign_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_admin_role();

-- Also update the existing handle_new_user function to work with admin assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name;
  
  -- Assign default user role only if no role exists yet
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;