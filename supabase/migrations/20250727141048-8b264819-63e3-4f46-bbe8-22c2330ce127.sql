-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create an admin user with the specified credentials
-- Note: This creates a user that can login, but you'll need to set the password via Supabase Auth
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  email_change_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'robgashi13@korauto.com',
  crypt('robertoo13', gen_salt('bf')),
  now(),
  now(),
  now(),
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "Rob Gashi"}',
  false,
  'authenticated'
);