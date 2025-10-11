-- ============================================
-- CRITICAL SECURITY FIXES
-- ============================================

-- 1. Fix inspection_requests RLS - restrict SELECT to admins only
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own recent requests" ON public.inspection_requests;

-- Add admin-only SELECT policy
CREATE POLICY "Only admins can view all inspection requests"
  ON public.inspection_requests
  FOR SELECT
  USING (public.is_admin());

-- Keep existing secure INSERT policy (it's already good)
-- Keep existing admin update policy (it's already good)
-- Keep service role policy (it's already good)

-- 2. Fix rate_limits RLS - ensure no public access
-- The existing policy is already good, but let's add explicit deny for safety
DROP POLICY IF EXISTS "Public cannot access rate limits" ON public.rate_limits;
CREATE POLICY "Public cannot access rate limits"
  ON public.rate_limits
  FOR SELECT
  USING (false);

-- 3. Add search_path to SECURITY DEFINER functions to prevent search path hijacking
-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Update check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action text,
  _max_requests integer DEFAULT 5,
  _window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
BEGIN
  -- Calculate window start time
  window_start_time := now() - (_window_minutes || ' minutes')::interval;
  
  -- Clean up old rate limit entries
  DELETE FROM public.rate_limits 
  WHERE window_start < window_start_time;
  
  -- Get current count for this identifier/action combination
  SELECT COALESCE(SUM(count), 0) 
  INTO current_count
  FROM public.rate_limits 
  WHERE identifier = _identifier 
    AND action = _action 
    AND window_start >= window_start_time;
  
  -- Check if limit exceeded
  IF current_count >= _max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Add/update rate limit entry
  INSERT INTO public.rate_limits (identifier, action, count, window_start)
  VALUES (_identifier, _action, 1, now())
  ON CONFLICT (identifier, action) 
  DO UPDATE SET 
    count = rate_limits.count + 1,
    window_start = CASE 
      WHEN rate_limits.window_start < window_start_time THEN now()
      ELSE rate_limits.window_start
    END;
  
  RETURN TRUE;
END;
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Assign default user role only if no role exists yet
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update anonymize_old_inspection_requests function
CREATE OR REPLACE FUNCTION public.anonymize_old_inspection_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anonymized_count INTEGER;
BEGIN
  -- Anonymize personal data for records older than 1 year
  UPDATE public.inspection_requests 
  SET 
    customer_name = 'ANONYMIZED',
    customer_email = 'anonymized@example.com',
    customer_phone = 'ANONYMIZED',
    notes = 'Data anonymized for privacy'
  WHERE created_at < now() - INTERVAL '1 year'
    AND customer_name != 'ANONYMIZED';
  
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
  
  -- Delete records older than 2 years completely
  DELETE FROM public.inspection_requests 
  WHERE created_at < now() - INTERVAL '2 years';
  
  RETURN anonymized_count;
END;
$$;

-- Update auto_assign_admin_role function
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'admin@korauto.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also ensure they have a profile
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, 'Admin')
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Add comment for documentation
COMMENT ON POLICY "Only admins can view all inspection requests" ON public.inspection_requests IS 
  'Security fix: Restrict viewing of customer PII to admins only to prevent data harvesting';