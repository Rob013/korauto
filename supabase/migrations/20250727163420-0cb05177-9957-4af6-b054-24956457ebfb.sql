-- Create tables for storing comprehensive car data from API

-- Manufacturers table
CREATE TABLE IF NOT EXISTS public.manufacturers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  logo_url TEXT,
  models_count INTEGER DEFAULT 0,
  popular_models TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Models table
CREATE TABLE IF NOT EXISTS public.car_models (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer_id INTEGER REFERENCES public.manufacturers(id),
  manufacturer_name TEXT,
  body_types TEXT[],
  year_from INTEGER,
  year_to INTEGER,
  fuel_types TEXT[],
  engine_types TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id, manufacturer_id)
);

-- Comprehensive cars table for all API data
CREATE TABLE IF NOT EXISTS public.api_cars (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  vin TEXT,
  title TEXT,
  
  -- Basic car data
  mileage INTEGER,
  transmission TEXT,
  fuel TEXT,
  color TEXT,
  condition TEXT,
  lot_number TEXT,
  
  -- Auction/marketplace data
  current_bid NUMERIC,
  buy_now_price NUMERIC,
  final_bid NUMERIC,
  is_live BOOLEAN DEFAULT false,
  watchers INTEGER DEFAULT 0,
  end_time TEXT,
  location TEXT,
  
  -- Images and media
  image_url TEXT,
  images TEXT[],
  exterior_images TEXT[],
  interior_images TEXT[],
  video_urls TEXT[],
  
  -- Technical specifications
  cylinders INTEGER,
  displacement NUMERIC,
  horsepower NUMERIC,
  torque NUMERIC,
  top_speed NUMERIC,
  acceleration NUMERIC,
  
  -- Fuel consumption
  fuel_consumption_city NUMERIC,
  fuel_consumption_highway NUMERIC,
  fuel_consumption_combined NUMERIC,
  
  -- Emissions
  co2_emissions NUMERIC,
  euro_standard TEXT,
  
  -- Dimensions
  length_mm NUMERIC,
  width_mm NUMERIC,
  height_mm NUMERIC,
  wheelbase_mm NUMERIC,
  weight_kg NUMERIC,
  
  -- Safety ratings
  safety_rating_overall NUMERIC,
  safety_rating_frontal NUMERIC,
  safety_rating_side NUMERIC,
  safety_rating_rollover NUMERIC,
  
  -- Vehicle details
  body_type TEXT,
  drive_wheel TEXT,
  vehicle_type TEXT,
  damage_main TEXT,
  damage_second TEXT,
  keys_available BOOLEAN,
  airbags TEXT,
  grade_iaai TEXT,
  
  -- Seller information
  seller TEXT,
  seller_type TEXT,
  sale_date TIMESTAMP WITH TIME ZONE,
  
  -- API metadata
  domain_name TEXT,
  external_id TEXT,
  api_data JSONB, -- Store complete raw API response
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API sync status table
CREATE TABLE IF NOT EXISTS public.api_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'manufacturers', 'models', 'cars'
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  records_synced INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed', -- 'running', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User dashboard settings
CREATE TABLE IF NOT EXISTS public.user_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preferred_makes TEXT[],
  preferred_price_range NUMRANGE,
  preferred_year_range INT4RANGE,
  favorite_searches JSONB,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Car views tracking
CREATE TABLE IF NOT EXISTS public.car_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for public car data (everyone can view)
CREATE POLICY "Everyone can view manufacturers" ON public.manufacturers FOR SELECT USING (true);
CREATE POLICY "Everyone can view car models" ON public.car_models FOR SELECT USING (true);
CREATE POLICY "Everyone can view cars" ON public.api_cars FOR SELECT USING (true);

-- RLS policies for admin-only sync status
CREATE POLICY "Admins can manage sync status" ON public.api_sync_status FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user dashboard settings
CREATE POLICY "Users can manage their dashboard settings" ON public.user_dashboard_settings 
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for car views
CREATE POLICY "Anyone can create car views" ON public.car_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all car views" ON public.car_views FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for managing car data
CREATE POLICY "Service role can manage manufacturers" ON public.manufacturers FOR ALL USING (auth.role() = 'service_role'::text);
CREATE POLICY "Service role can manage car models" ON public.car_models FOR ALL USING (auth.role() = 'service_role'::text);
CREATE POLICY "Service role can manage cars" ON public.api_cars FOR ALL USING (auth.role() = 'service_role'::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manufacturers_name ON public.manufacturers(name);
CREATE INDEX IF NOT EXISTS idx_car_models_manufacturer_id ON public.car_models(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_car_models_name ON public.car_models(name);
CREATE INDEX IF NOT EXISTS idx_api_cars_make ON public.api_cars(make);
CREATE INDEX IF NOT EXISTS idx_api_cars_model ON public.api_cars(model);
CREATE INDEX IF NOT EXISTS idx_api_cars_year ON public.api_cars(year);
CREATE INDEX IF NOT EXISTS idx_api_cars_price ON public.api_cars(price);
CREATE INDEX IF NOT EXISTS idx_api_cars_mileage ON public.api_cars(mileage);
CREATE INDEX IF NOT EXISTS idx_api_cars_location ON public.api_cars(location);
CREATE INDEX IF NOT EXISTS idx_api_cars_created_at ON public.api_cars(created_at);
CREATE INDEX IF NOT EXISTS idx_car_views_car_id ON public.car_views(car_id);
CREATE INDEX IF NOT EXISTS idx_car_views_user_id ON public.car_views(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_manufacturers_updated_at
  BEFORE UPDATE ON public.manufacturers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_models_updated_at
  BEFORE UPDATE ON public.car_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_cars_updated_at
  BEFORE UPDATE ON public.api_cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_dashboard_settings_updated_at
  BEFORE UPDATE ON public.user_dashboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();