-- Add comprehensive API data fields to cars_cache table for complete 193,306 cars sync
-- This ensures all information from external API is captured and stored

-- Add missing core fields that are mapped in the sync function
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS price_cents BIGINT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS rank_score NUMERIC;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS high_res_images JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS all_images_urls TEXT[];

-- Engine and performance data
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS engine_size TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS engine_displacement TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS cylinders INTEGER;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS max_power TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS torque TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS acceleration TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS top_speed TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS fuel_consumption TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS co2_emissions TEXT;

-- Vehicle specifications
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS doors INTEGER;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS seats INTEGER;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS body_style TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS drive_type TEXT;

-- Auction and sale data
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS auction_date TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS time_left TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS bid_count INTEGER DEFAULT 0;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS watchers_count INTEGER DEFAULT 0;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS reserve_met BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS sale_title TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS lot_seller TEXT;

-- History and condition
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS previous_owners INTEGER DEFAULT 1;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS service_history TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS accident_history TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS modifications TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS warranty_info TEXT;

-- Registration and legal
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS registration_date TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS first_registration TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS mot_expiry TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS road_tax TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS insurance_group TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS title_status TEXT;

-- Keys and documentation
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS keys_count INTEGER DEFAULT 0;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS keys_count_detailed INTEGER DEFAULT 0;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS books_count INTEGER DEFAULT 0;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS spare_key_available BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS service_book_available BOOLEAN DEFAULT FALSE;

-- Location
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS location_country TEXT DEFAULT 'South Korea';
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS location_state TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS seller_type TEXT;

-- Damage information
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS damage_primary TEXT;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS damage_secondary TEXT;

-- Features and equipment
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS inspection_report TEXT;

-- Seller information
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS seller_notes TEXT;

-- Complete raw data preservation (enhance existing car_data)
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS original_api_data JSONB;

-- Sync tracking metadata  
ALTER TABLE public.cars_cache ADD COLUMN IF NOT EXISTS sync_metadata JSONB;

-- Add indexes for performance on new fields
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents ON public.cars_cache(price_cents) WHERE price_cents IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_cache_rank_score ON public.cars_cache(rank_score) WHERE rank_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_cache_engine_size ON public.cars_cache(engine_size) WHERE engine_size IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_cache_body_style ON public.cars_cache(body_style) WHERE body_style IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_cache_auction_date ON public.cars_cache(auction_date) WHERE auction_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_cache_grade ON public.cars_cache(grade) WHERE grade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_cache_location_city ON public.cars_cache(location_city) WHERE location_city IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.cars_cache.price_cents IS 'Price in cents for precise calculations';
COMMENT ON COLUMN public.cars_cache.rank_score IS 'Calculated ranking score for sorting';
COMMENT ON COLUMN public.cars_cache.original_api_data IS 'Complete original API response for data fidelity';
COMMENT ON COLUMN public.cars_cache.sync_metadata IS 'Sync tracking metadata including completeness info';
COMMENT ON COLUMN public.cars_cache.features IS 'Complete list of vehicle features and equipment';
COMMENT ON COLUMN public.cars_cache.high_res_images IS 'High resolution image URLs from API';
COMMENT ON COLUMN public.cars_cache.all_images_urls IS 'All image URLs from API (normal + high res)';

-- Update sync tracking comment
COMMENT ON TABLE public.cars_cache IS 'Comprehensive cache for 193,306 cars with complete API data preservation';