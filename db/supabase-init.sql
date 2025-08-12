-- Supabase Database Initialization Script
-- This script creates all essential tables for the korauto car sync system
-- Based on the database schema from migrations

-- Create enum type for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 1. PROFILES TABLE (User management)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3. MAIN CARS TABLE (Single source of truth)
CREATE TABLE IF NOT EXISTS public.cars (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  mileage INTEGER DEFAULT 0,
  
  -- Basic car info
  title TEXT,
  vin TEXT,
  color TEXT,
  fuel TEXT,
  transmission TEXT,
  condition TEXT DEFAULT 'good',
  location TEXT DEFAULT 'South Korea',
  
  -- Auction/Sale info
  lot_number TEXT,
  current_bid NUMERIC DEFAULT 0,
  buy_now_price NUMERIC DEFAULT 0,
  final_bid NUMERIC DEFAULT 0,
  sale_date TIMESTAMPTZ,
  
  -- Images and media
  image_url TEXT,
  images JSONB DEFAULT '[]',
  
  -- Source tracking
  source_api TEXT DEFAULT 'auctionapis',
  domain_name TEXT DEFAULT 'encar_com',
  
  -- Status and metadata
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  is_live BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  keys_available BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CARS STAGING TABLE (For new API data before merging)
CREATE TABLE IF NOT EXISTS public.cars_staging (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  mileage INTEGER DEFAULT 0,
  
  -- Basic car info
  title TEXT,
  vin TEXT,
  color TEXT,
  fuel TEXT,
  transmission TEXT,
  condition TEXT DEFAULT 'good',
  location TEXT DEFAULT 'South Korea',
  
  -- Auction/Sale info
  lot_number TEXT,
  current_bid NUMERIC DEFAULT 0,
  buy_now_price NUMERIC DEFAULT 0,
  final_bid NUMERIC DEFAULT 0,
  sale_date TIMESTAMPTZ,
  
  -- Images and media
  image_url TEXT,
  images JSONB DEFAULT '[]',
  
  -- Source tracking
  source_api TEXT DEFAULT 'external',
  domain_name TEXT DEFAULT 'external_api',
  
  -- Status and metadata
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  is_live BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  keys_available BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CARS CACHE TABLE (For raw API data)
CREATE TABLE IF NOT EXISTS public.cars_cache (
  id TEXT PRIMARY KEY,
  api_id TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC,
  vin TEXT,
  fuel TEXT,
  transmission TEXT,
  color TEXT,
  condition TEXT,
  lot_number TEXT,
  mileage TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  car_data JSONB NOT NULL,
  lot_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_api_sync TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SYNC STATUS TABLE (Track sync operations)
CREATE TABLE IF NOT EXISTS public.sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'full' or 'incremental'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'paused'
  
  -- Progress tracking
  current_page INTEGER DEFAULT 1,
  total_pages INTEGER DEFAULT 0,
  records_processed INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  cars_processed INTEGER DEFAULT 0,
  archived_lots_processed INTEGER DEFAULT 0,
  
  -- URLs and continuation
  next_url TEXT,
  last_successful_url TEXT,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_cars_sync_at TIMESTAMPTZ,
  last_archived_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. USER FAVORITES
CREATE TABLE IF NOT EXISTS public.favorite_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  car_id TEXT NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);

-- 7. INSPECTION REQUESTS
CREATE TABLE IF NOT EXISTS public.inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id TEXT REFERENCES public.cars(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. RATE LIMITS TABLE (For API throttling)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WEBSITE ANALYTICS TABLE (For tracking)
CREATE TABLE IF NOT EXISTS public.website_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  action_type TEXT NOT NULL,
  car_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON public.cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_year_price ON public.cars(year, price);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_source ON public.cars(source_api);
CREATE INDEX IF NOT EXISTS idx_cars_updated ON public.cars(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_cars_external_id ON public.cars(external_id);
CREATE INDEX IF NOT EXISTS idx_cars_is_archived ON public.cars(is_archived);
CREATE INDEX IF NOT EXISTS idx_cars_is_active ON public.cars(is_active);

CREATE INDEX IF NOT EXISTS idx_cars_staging_make_model ON public.cars_staging(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_staging_year_price ON public.cars_staging(year, price);
CREATE INDEX IF NOT EXISTS idx_cars_staging_external_id ON public.cars_staging(external_id);
CREATE INDEX IF NOT EXISTS idx_cars_staging_updated ON public.cars_staging(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_cars_cache_api_id ON public.cars_cache(api_id);
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_model ON public.cars_cache(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year ON public.cars_cache(year);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price ON public.cars_cache(price);
CREATE INDEX IF NOT EXISTS idx_cars_cache_updated_at ON public.cars_cache(updated_at);

CREATE INDEX IF NOT EXISTS idx_sync_status_type ON public.sync_status(sync_type, status);
CREATE INDEX IF NOT EXISTS idx_sync_status_activity ON public.sync_status(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_website_analytics_session ON public.website_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_user ON public.website_analytics(user_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- Create essential functions

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier TEXT,
  _action TEXT,
  _max_requests INTEGER DEFAULT 100,
  _window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _window_start TIMESTAMPTZ;
  _current_count INTEGER;
BEGIN
  _window_start := NOW() - INTERVAL '1 minute' * _window_minutes;
  
  -- Clean up old records
  DELETE FROM public.rate_limits 
  WHERE window_start < _window_start;
  
  -- Get current count for this identifier/action
  SELECT COALESCE(SUM(count), 0) INTO _current_count
  FROM public.rate_limits
  WHERE identifier = _identifier 
    AND action = _action 
    AND window_start >= _window_start;
  
  -- Check if under limit
  IF _current_count >= _max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO public.rate_limits (identifier, action, count, window_start)
  VALUES (_identifier, _action, 1, NOW())
  ON CONFLICT (identifier, action) 
  DO UPDATE SET 
    count = public.rate_limits.count + 1,
    window_start = GREATEST(public.rate_limits.window_start, NOW() - INTERVAL '1 minute' * _window_minutes);
  
  RETURN TRUE;
END;
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_cars_cache_updated_at
  BEFORE UPDATE ON public.cars_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_favorite_cars_updated_at
  BEFORE UPDATE ON public.favorite_cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_inspection_requests_updated_at
  BEFORE UPDATE ON public.inspection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create RLS policies

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Cars policies (public read access)
DROP POLICY IF EXISTS "Anyone can view cars" ON public.cars;
CREATE POLICY "Anyone can view cars" ON public.cars
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage cars" ON public.cars;
CREATE POLICY "Service role can manage cars" ON public.cars
  FOR ALL USING (auth.role() = 'service_role');

-- Cars cache policies
DROP POLICY IF EXISTS "Anyone can view cached cars" ON public.cars_cache;
CREATE POLICY "Anyone can view cached cars" ON public.cars_cache
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage cars cache" ON public.cars_cache;
CREATE POLICY "Service role can manage cars cache" ON public.cars_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Sync status policies
DROP POLICY IF EXISTS "Admins can view sync status" ON public.sync_status;
CREATE POLICY "Admins can view sync status" ON public.sync_status
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage sync status" ON public.sync_status;
CREATE POLICY "Service role can manage sync status" ON public.sync_status
  FOR ALL USING (auth.role() = 'service_role');

-- Favorites policies
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorite_cars;
CREATE POLICY "Users can manage their own favorites" ON public.favorite_cars
  FOR ALL USING (auth.uid() = user_id);

-- Inspection requests policies
DROP POLICY IF EXISTS "Anyone can create inspection requests" ON public.inspection_requests;
CREATE POLICY "Anyone can create inspection requests" ON public.inspection_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all inspection requests" ON public.inspection_requests;
CREATE POLICY "Admins can view all inspection requests" ON public.inspection_requests
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage inspection requests" ON public.inspection_requests;
CREATE POLICY "Service role can manage inspection requests" ON public.inspection_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Rate limits policies  
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Website analytics policies
DROP POLICY IF EXISTS "Service role can manage analytics" ON public.website_analytics;
CREATE POLICY "Service role can manage analytics" ON public.website_analytics
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view analytics" ON public.website_analytics;
CREATE POLICY "Admins can view analytics" ON public.website_analytics
  FOR SELECT USING (public.is_admin());

-- Cars staging policies
DROP POLICY IF EXISTS "Service role can manage cars staging" ON public.cars_staging;
CREATE POLICY "Service role can manage cars staging" ON public.cars_staging
  FOR ALL USING (auth.role() = 'service_role');

-- RPC FUNCTIONS FOR CAR SYNC

-- Function to bulk merge cars from staging to main table
CREATE OR REPLACE FUNCTION public.bulk_merge_from_staging()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inserted_count INTEGER := 0;
  updated_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Insert new cars (cars that don't exist in main table)
  WITH new_cars AS (
    INSERT INTO public.cars (
      id, external_id, make, model, year, price, mileage,
      title, vin, color, fuel, transmission, condition, location,
      lot_number, current_bid, buy_now_price, final_bid, sale_date,
      image_url, images, source_api, domain_name, status, is_active,
      is_live, is_archived, keys_available, created_at, updated_at, last_synced_at
    )
    SELECT 
      s.id, s.external_id, s.make, s.model, s.year, s.price, s.mileage,
      s.title, s.vin, s.color, s.fuel, s.transmission, s.condition, s.location,
      s.lot_number, s.current_bid, s.buy_now_price, s.final_bid, s.sale_date,
      s.image_url, s.images, s.source_api, s.domain_name, s.status, s.is_active,
      s.is_live, s.is_archived, s.keys_available, s.created_at, s.updated_at, s.last_synced_at
    FROM public.cars_staging s
    LEFT JOIN public.cars c ON c.id = s.id
    WHERE c.id IS NULL
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM new_cars;

  -- Update existing cars
  WITH updated_cars AS (
    UPDATE public.cars SET
      external_id = s.external_id,
      make = s.make,
      model = s.model,
      year = s.year,
      price = s.price,
      mileage = s.mileage,
      title = s.title,
      vin = s.vin,
      color = s.color,
      fuel = s.fuel,
      transmission = s.transmission,
      condition = s.condition,
      location = s.location,
      lot_number = s.lot_number,
      current_bid = s.current_bid,
      buy_now_price = s.buy_now_price,
      final_bid = s.final_bid,
      sale_date = s.sale_date,
      image_url = s.image_url,
      images = s.images,
      source_api = s.source_api,
      domain_name = s.domain_name,
      status = s.status,
      is_active = s.is_active,
      is_live = s.is_live,
      is_archived = s.is_archived,
      keys_available = s.keys_available,
      updated_at = s.updated_at,
      last_synced_at = s.last_synced_at
    FROM public.cars_staging s
    WHERE public.cars.id = s.id
    RETURNING 1
  )
  SELECT COUNT(*) INTO updated_count FROM updated_cars;

  -- Build result
  result := jsonb_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'updated_count', updated_count,
    'total_processed', inserted_count + updated_count,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Function to mark cars as inactive if they're missing from staging
CREATE OR REPLACE FUNCTION public.mark_missing_inactive()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inactive_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Mark cars as inactive if they don't exist in staging and are currently active
  WITH marked_inactive AS (
    UPDATE public.cars SET
      is_active = false,
      status = 'inactive',
      updated_at = NOW()
    WHERE 
      is_active = true 
      AND id NOT IN (SELECT id FROM public.cars_staging)
      AND source_api = 'external'  -- Only mark external API cars as inactive
    RETURNING 1
  )
  SELECT COUNT(*) INTO inactive_count FROM marked_inactive;

  -- Build result
  result := jsonb_build_object(
    'success', true,
    'marked_inactive_count', inactive_count,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Advanced search function for cars with sorting and filtering
CREATE OR REPLACE FUNCTION public.cars_search_sorted(req jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  total_count integer;
  cars_data jsonb[];
  facets_data jsonb;
  query_text text := '';
  where_clause text := 'WHERE is_active = true';
  sort_clause text := 'ORDER BY created_at DESC';
  limit_clause text := 'LIMIT 20';
  offset_clause text := 'OFFSET 0';
  page_num integer := 1;
  page_size integer := 20;
  mode text := 'results';
BEGIN
  -- Extract parameters from request
  IF req ? 'page' THEN
    page_num := (req->>'page')::integer;
  END IF;
  
  IF req ? 'pageSize' THEN
    page_size := (req->>'pageSize')::integer;
  END IF;
  
  IF req ? 'mode' THEN
    mode := req->>'mode';
  END IF;

  -- Build search query
  IF req ? 'q' AND req->>'q' != '' THEN
    query_text := req->>'q';
    where_clause := where_clause || ' AND (make ILIKE ''%' || query_text || '%'' OR model ILIKE ''%' || query_text || '%'' OR title ILIKE ''%' || query_text || '%'')';
  END IF;

  -- Build filters
  IF req ? 'filters' THEN
    -- Make filter
    IF req->'filters' ? 'make' AND jsonb_array_length(req->'filters'->'make') > 0 THEN
      where_clause := where_clause || ' AND make = ANY(ARRAY[' || 
        (SELECT string_agg('''' || (jsonb_array_elements_text(req->'filters'->'make')) || '''', ',')) || '])';
    END IF;
    
    -- Model filter
    IF req->'filters' ? 'model' AND jsonb_array_length(req->'filters'->'model') > 0 THEN
      where_clause := where_clause || ' AND model = ANY(ARRAY[' || 
        (SELECT string_agg('''' || (jsonb_array_elements_text(req->'filters'->'model')) || '''', ',')) || '])';
    END IF;
    
    -- Fuel filter
    IF req->'filters' ? 'fuel' AND jsonb_array_length(req->'filters'->'fuel') > 0 THEN
      where_clause := where_clause || ' AND fuel = ANY(ARRAY[' || 
        (SELECT string_agg('''' || (jsonb_array_elements_text(req->'filters'->'fuel')) || '''', ',')) || '])';
    END IF;
    
    -- Transmission filter
    IF req->'filters' ? 'transmission' AND jsonb_array_length(req->'filters'->'transmission') > 0 THEN
      where_clause := where_clause || ' AND transmission = ANY(ARRAY[' || 
        (SELECT string_agg('''' || (jsonb_array_elements_text(req->'filters'->'transmission')) || '''', ',')) || '])';
    END IF;
    
    -- Color filter
    IF req->'filters' ? 'exterior_color' AND jsonb_array_length(req->'filters'->'exterior_color') > 0 THEN
      where_clause := where_clause || ' AND color = ANY(ARRAY[' || 
        (SELECT string_agg('''' || (jsonb_array_elements_text(req->'filters'->'exterior_color')) || '''', ',')) || '])';
    END IF;
    
    -- Year range filter
    IF req->'filters' ? 'year' THEN
      IF req->'filters'->'year' ? 'min' THEN
        where_clause := where_clause || ' AND year >= ' || (req->'filters'->'year'->>'min')::integer;
      END IF;
      IF req->'filters'->'year' ? 'max' THEN
        where_clause := where_clause || ' AND year <= ' || (req->'filters'->'year'->>'max')::integer;
      END IF;
    END IF;
    
    -- Price range filter (using price as price_eur equivalent)
    IF req->'filters' ? 'price_eur' THEN
      IF req->'filters'->'price_eur' ? 'min' THEN
        where_clause := where_clause || ' AND price >= ' || (req->'filters'->'price_eur'->>'min')::numeric;
      END IF;
      IF req->'filters'->'price_eur' ? 'max' THEN
        where_clause := where_clause || ' AND price <= ' || (req->'filters'->'price_eur'->>'max')::numeric;
      END IF;
    END IF;
    
    -- Mileage range filter (using mileage as mileage_km equivalent)
    IF req->'filters' ? 'mileage_km' THEN
      IF req->'filters'->'mileage_km' ? 'min' THEN
        where_clause := where_clause || ' AND mileage >= ' || (req->'filters'->'mileage_km'->>'min')::integer;
      END IF;
      IF req->'filters'->'mileage_km' ? 'max' THEN
        where_clause := where_clause || ' AND mileage <= ' || (req->'filters'->'mileage_km'->>'max')::integer;
      END IF;
    END IF;
  END IF;

  -- Build sort clause
  IF req ? 'sort' THEN
    CASE req->'sort'->>'field'
      WHEN 'price_eur' THEN
        sort_clause := 'ORDER BY price ' || COALESCE(req->'sort'->>'dir', 'desc');
      WHEN 'year' THEN
        sort_clause := 'ORDER BY year ' || COALESCE(req->'sort'->>'dir', 'desc');
      WHEN 'mileage_km' THEN
        sort_clause := 'ORDER BY mileage ' || COALESCE(req->'sort'->>'dir', 'asc');
      WHEN 'listed_at' THEN
        sort_clause := 'ORDER BY created_at ' || COALESCE(req->'sort'->>'dir', 'desc');
      ELSE
        sort_clause := 'ORDER BY created_at DESC';
    END CASE;
  END IF;

  -- Build pagination
  limit_clause := 'LIMIT ' || page_size;
  offset_clause := 'OFFSET ' || ((page_num - 1) * page_size);

  -- Get total count
  EXECUTE 'SELECT COUNT(*) FROM cars ' || where_clause INTO total_count;

  -- Get cars data if mode includes results
  IF mode IN ('results', 'full') THEN
    EXECUTE '
      SELECT array_agg(
        jsonb_build_object(
          ''id'', id,
          ''make'', make,
          ''model'', model,
          ''year'', year,
          ''price_eur'', price,
          ''mileage_km'', mileage,
          ''fuel'', fuel,
          ''transmission'', transmission,
          ''exterior_color'', color,
          ''thumbnail'', image_url,
          ''images'', images,
          ''title'', title,
          ''condition'', condition,
          ''location'', location,
          ''listed_at'', created_at
        )
      )
      FROM cars ' || where_clause || ' ' || sort_clause || ' ' || limit_clause || ' ' || offset_clause
    INTO cars_data;
  END IF;

  -- Get facets if mode includes facets
  IF mode IN ('facets', 'full') THEN
    -- Build facets for filtering
    facets_data := jsonb_build_object(
      'make', (
        SELECT jsonb_object_agg(make, cnt) 
        FROM (
          SELECT make, COUNT(*) as cnt 
          FROM cars 
          WHERE is_active = true 
          GROUP BY make 
          ORDER BY cnt DESC 
          LIMIT 50
        ) t
      ),
      'model', (
        SELECT jsonb_object_agg(model, cnt) 
        FROM (
          SELECT model, COUNT(*) as cnt 
          FROM cars 
          WHERE is_active = true 
          GROUP BY model 
          ORDER BY cnt DESC 
          LIMIT 100
        ) t
      ),
      'fuel', (
        SELECT jsonb_object_agg(fuel, cnt) 
        FROM (
          SELECT fuel, COUNT(*) as cnt 
          FROM cars 
          WHERE is_active = true AND fuel IS NOT NULL 
          GROUP BY fuel 
          ORDER BY cnt DESC
        ) t
      ),
      'transmission', (
        SELECT jsonb_object_agg(transmission, cnt) 
        FROM (
          SELECT transmission, COUNT(*) as cnt 
          FROM cars 
          WHERE is_active = true AND transmission IS NOT NULL 
          GROUP BY transmission 
          ORDER BY cnt DESC
        ) t
      )
    );
  END IF;

  -- Build final result
  result := jsonb_build_object(
    'total', total_count,
    'page', page_num,
    'pageSize', page_size,
    'hits', COALESCE(cars_data, '[]'::jsonb),
    'facets', COALESCE(facets_data, '{}'::jsonb)
  );

  RETURN result;
END;
$$;

-- Keyset pagination search function for better performance on large datasets
CREATE OR REPLACE FUNCTION public.cars_search_keyset(req jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- For now, use the same logic as sorted search
  -- This can be optimized later with cursor-based pagination
  RETURN public.cars_search_sorted(req);
END;
$$;