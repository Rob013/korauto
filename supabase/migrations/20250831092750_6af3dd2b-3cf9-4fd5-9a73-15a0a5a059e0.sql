-- Enhanced database schema for complete sync system
-- Add missing columns for full 1:1 API mapping and resumable sync

-- Enhance cars_cache table with all possible fields from external API
ALTER TABLE cars_cache 
ADD COLUMN IF NOT EXISTS price_usd NUMERIC,
ADD COLUMN IF NOT EXISTS price_eur NUMERIC,
ADD COLUMN IF NOT EXISTS auction_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sale_status TEXT,
ADD COLUMN IF NOT EXISTS damage_primary TEXT,
ADD COLUMN IF NOT EXISTS damage_secondary TEXT,
ADD COLUMN IF NOT EXISTS engine_size TEXT,
ADD COLUMN IF NOT EXISTS cylinders INTEGER,
ADD COLUMN IF NOT EXISTS doors INTEGER,
ADD COLUMN IF NOT EXISTS seats INTEGER,
ADD COLUMN IF NOT EXISTS drive_type TEXT,
ADD COLUMN IF NOT EXISTS body_style TEXT,
ADD COLUMN IF NOT EXISTS seller_type TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_state TEXT,
ADD COLUMN IF NOT EXISTS location_country TEXT DEFAULT 'South Korea',
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC,
ADD COLUMN IF NOT EXISTS reserve_met BOOLEAN,
ADD COLUMN IF NOT EXISTS time_left TEXT,
ADD COLUMN IF NOT EXISTS bid_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS watchers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS inspection_report JSONB,
ADD COLUMN IF NOT EXISTS seller_notes TEXT,
ADD COLUMN IF NOT EXISTS title_status TEXT,
ADD COLUMN IF NOT EXISTS keys_count INTEGER,
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS high_res_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS source_site TEXT,
ADD COLUMN IF NOT EXISTS last_updated_source TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_completeness_score REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS sync_batch_id UUID,
ADD COLUMN IF NOT EXISTS sync_retry_count INTEGER DEFAULT 0;

-- Enhance sync_status table for better checkpoint management
ALTER TABLE sync_status 
ADD COLUMN IF NOT EXISTS api_total_records INTEGER,
ADD COLUMN IF NOT EXISTS api_last_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_percentage NUMERIC(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_cursor TEXT,
ADD COLUMN IF NOT EXISTS last_record_id TEXT,
ADD COLUMN IF NOT EXISTS batch_size INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS max_concurrent_requests INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS rate_limit_delay_ms INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS checkpoint_data JSONB,
ADD COLUMN IF NOT EXISTS performance_metrics JSONB,
ADD COLUMN IF NOT EXISTS source_endpoints JSONB,
ADD COLUMN IF NOT EXISTS resume_token TEXT,
ADD COLUMN IF NOT EXISTS data_quality_checks JSONB;

-- Create indexes for optimized global sorting
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents_id ON cars_cache (price_cents ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_desc_id ON cars_cache (price_cents DESC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year_asc_id ON cars_cache (year ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year_desc_id ON cars_cache (year DESC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_created_desc_id ON cars_cache (created_at DESC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_asc_id ON cars_cache (make ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_mileage_asc_id ON cars_cache (mileage ASC NULLS LAST, id ASC) WHERE mileage IS NOT NULL;

-- Global sorting function with enhanced performance
CREATE OR REPLACE FUNCTION public.cars_global_sorted(
  p_filters JSONB DEFAULT '{}'::JSONB,
  p_sort_field TEXT DEFAULT 'price_cents',
  p_sort_dir TEXT DEFAULT 'ASC',
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC,
  price_cents BIGINT,
  rank_score REAL,
  mileage TEXT,
  fuel TEXT,
  transmission TEXT,
  color TEXT,
  location TEXT,
  image_url TEXT,
  images JSONB,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  row_number BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_query TEXT;
  where_clause TEXT := '';
  order_clause TEXT;
  final_query TEXT;
BEGIN
  -- Build base query
  base_query := '
    SELECT 
      c.id::TEXT,
      c.make,
      c.model,
      c.year,
      c.price,
      c.price_cents,
      c.rank_score,
      c.mileage,
      c.fuel,
      c.transmission,
      c.color,
      COALESCE(c.location_city, c.location_state, ''South Korea'')::TEXT as location,
      c.image_url,
      CASE 
        WHEN c.images IS NOT NULL AND jsonb_array_length(c.images) > 0 
        THEN c.images 
        ELSE c.high_res_images 
      END as images,
      (c.make || '' '' || c.model || '' '' || c.year::TEXT) as title,
      c.created_at,
      ROW_NUMBER() OVER (ORDER BY ';

  -- Add filters with proper type casting
  IF p_filters IS NOT NULL AND p_filters != '{}'::JSONB THEN
    -- Make filter
    IF p_filters ? 'make' AND (p_filters->>'make') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.make) = LOWER(' || quote_literal(p_filters->>'make') || ')';
    END IF;
    
    -- Model filter  
    IF p_filters ? 'model' AND (p_filters->>'model') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.model) = LOWER(' || quote_literal(p_filters->>'model') || ')';
    END IF;
    
    -- Year range filters
    IF p_filters ? 'yearMin' AND (p_filters->>'yearMin') != '' THEN
      where_clause := where_clause || ' AND c.year >= ' || (p_filters->>'yearMin')::INTEGER;
    END IF;
    
    IF p_filters ? 'yearMax' AND (p_filters->>'yearMax') != '' THEN
      where_clause := where_clause || ' AND c.year <= ' || (p_filters->>'yearMax')::INTEGER;
    END IF;
    
    -- Price range filters (ensure numeric comparison)
    IF p_filters ? 'priceMin' AND (p_filters->>'priceMin') != '' THEN
      where_clause := where_clause || ' AND c.price_cents >= ' || ((p_filters->>'priceMin')::NUMERIC * 100);
    END IF;
    
    IF p_filters ? 'priceMax' AND (p_filters->>'priceMax') != '' THEN
      where_clause := where_clause || ' AND c.price_cents <= ' || ((p_filters->>'priceMax')::NUMERIC * 100);
    END IF;
    
    -- Search filter
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        LOWER(c.make) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.model) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.color) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ')
      )';
    END IF;
  END IF;
  
  -- Build ORDER BY clause for global sorting (CRITICAL: always numeric for price)
  CASE p_sort_field
    WHEN 'price_cents' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'c.price_cents ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'c.price_cents DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'year' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'c.year ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'c.year DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'make' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'c.make ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'c.make DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'created_at' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'c.created_at ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'c.created_at DESC NULLS LAST, c.id ASC';
      END IF;
    ELSE
      -- Default to price ascending (CRITICAL: ensure numeric sorting)
      order_clause := 'c.price_cents ASC NULLS LAST, c.id ASC';
  END CASE;
  
  -- Complete the query with WHERE, ORDER BY, and pagination
  final_query := base_query || order_clause || ') as row_number
    FROM cars_cache c
    WHERE c.price_cents > 0 AND c.price_cents IS NOT NULL' || where_clause || '
    ORDER BY ' || order_clause || '
    LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  
  -- Execute and return results
  RETURN QUERY EXECUTE final_query;
END;
$$;

-- Enhanced sync checkpoint functions
CREATE OR REPLACE FUNCTION public.save_sync_checkpoint(
  sync_id TEXT,
  checkpoint_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sync_status 
  SET 
    checkpoint_data = checkpoint_data,
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE id = sync_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sync_checkpoint(sync_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT checkpoint_data INTO result
  FROM sync_status 
  WHERE id = sync_id;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;