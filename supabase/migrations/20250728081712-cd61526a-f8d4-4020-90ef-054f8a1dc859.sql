-- COMPLETE DATABASE REBUILD FROM SCRATCH
-- Drop all existing tables and start fresh

-- Drop all existing tables in correct order (handling dependencies)
DROP TABLE IF EXISTS car_views CASCADE;
DROP TABLE IF EXISTS favorite_cars CASCADE;
DROP TABLE IF EXISTS inspection_requests CASCADE;
DROP TABLE IF EXISTS api_sync_status CASCADE;
DROP TABLE IF EXISTS sync_metadata CASCADE;
DROP TABLE IF EXISTS sync_status CASCADE;
DROP TABLE IF EXISTS api_cars CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS car_models CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS user_dashboard_settings CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_old_sync_records() CASCADE;
DROP FUNCTION IF EXISTS clean_old_sync_metadata() CASCADE;
DROP FUNCTION IF EXISTS update_car_sync_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS app_role CASCADE;

-- Recreate enum type
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- 1. PROFILES TABLE (User management)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER ROLES TABLE
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3. SIMPLIFIED CARS TABLE (Single source of truth)
CREATE TABLE cars (
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
  is_live BOOLEAN DEFAULT false,
  keys_available BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SIMPLIFIED SYNC MANAGEMENT TABLE
CREATE TABLE sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'full' or 'incremental'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'paused'
  
  -- Progress tracking
  current_page INTEGER DEFAULT 1,
  total_pages INTEGER DEFAULT 0,
  records_processed INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. USER FAVORITES
CREATE TABLE favorite_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);

-- 6. INSPECTION REQUESTS
CREATE TABLE inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id TEXT REFERENCES cars(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create essential indexes for performance
CREATE INDEX idx_cars_make_model ON cars(make, model);
CREATE INDEX idx_cars_year_price ON cars(year, price);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_source ON cars(source_api);
CREATE INDEX idx_cars_updated ON cars(last_synced_at);
CREATE INDEX idx_sync_status_type ON sync_status(sync_type, status);
CREATE INDEX idx_sync_status_activity ON sync_status(last_activity_at);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_requests ENABLE ROW LEVEL SECURITY;

-- Create essential functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT has_role(auth.uid(), 'admin'::app_role)
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_requests_updated_at
  BEFORE UPDATE ON inspection_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (is_admin());

-- Cars policies (public read access)
CREATE POLICY "Anyone can view cars" ON cars
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage cars" ON cars
  FOR ALL USING (auth.role() = 'service_role');

-- Sync status policies
CREATE POLICY "Admins can view sync status" ON sync_status
  FOR SELECT USING (is_admin());

CREATE POLICY "Service role can manage sync status" ON sync_status
  FOR ALL USING (auth.role() = 'service_role');

-- Favorites policies
CREATE POLICY "Users can manage their own favorites" ON favorite_cars
  FOR ALL USING (auth.uid() = user_id);

-- Inspection requests policies
CREATE POLICY "Anyone can create inspection requests" ON inspection_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all inspection requests" ON inspection_requests
  FOR SELECT USING (is_admin());

CREATE POLICY "Service role can manage inspection requests" ON inspection_requests
  FOR ALL USING (auth.role() = 'service_role');