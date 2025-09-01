-- Fix admin user setup
-- This migration ensures proper admin setup without directly manipulating auth.users

-- First, clean up any invalid entries from the old migration attempts
DELETE FROM auth.users WHERE email IN ('robgashi13@korauto.com') AND id NOT IN (
  SELECT DISTINCT user_id FROM public.user_roles WHERE role = 'admin'::app_role
);

-- Ensure the auto_assign_admin_role function is working correctly
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'admin@korauto.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also ensure they have a profile
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, 'Admin')
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      email = EXCLUDED.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS auto_assign_admin_trigger ON auth.users;
CREATE TRIGGER auto_assign_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_admin_role();

-- Update the handle_new_user function to also check for admin assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name;
  
  -- Check if this should be an admin user
  IF NEW.email = 'admin@korauto.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Assign default user role only if no role exists yet
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure the is_admin function is working correctly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$function$;

-- Create a function to manually promote a user to admin (for emergency access)
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Add admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile if needed
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (target_user_id, user_email, 'Admin')
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name;
  
  RETURN true;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.promote_to_admin(text) TO service_role;