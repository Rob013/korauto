-- Backend-only architecture migration: Enhanced cars_cache with proper sorting fields and indexes
-- This migration transforms KorAutoKS to use cars_cache as the primary denormalized read layer

-- Add missing columns to cars_cache for proper sorting and filtering
ALTER TABLE public.cars_cache 
ADD COLUMN IF NOT EXISTS price_cents BIGINT,
ADD COLUMN IF NOT EXISTS rank_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS mileage_km INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing data to populate new columns from car_data jsonb
UPDATE public.cars_cache 
SET 
  price_cents = CASE 
    WHEN price IS NOT NULL THEN (price * 100)::BIGINT
    WHEN car_data->>'price' IS NOT NULL THEN ((car_data->>'price')::NUMERIC * 100)::BIGINT
    ELSE NULL
  END,
  rank_score = COALESCE(
    (car_data->>'rank_score')::NUMERIC,
    (car_data->>'popularity_score')::NUMERIC,
    0
  ),
  mileage_km = CASE
    WHEN mileage ~ '^[0-9]+$' THEN mileage::INTEGER
    WHEN car_data->'odometer'->>'km' IS NOT NULL THEN (car_data->'odometer'->>'km')::INTEGER
    ELSE NULL
  END,
  image_url = COALESCE(
    (car_data->'images'->>'normal'->>0),
    (car_data->>'image_url'),
    (images->>0)
  )
WHERE price_cents IS NULL OR rank_score IS NULL OR mileage_km IS NULL;

-- Create comprehensive indexes for performance optimization
-- Primary sorting fields with nulls last support
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_price_cents_nulls_last_id 
ON public.cars_cache (price_cents ASC NULLS LAST, id ASC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_price_cents_desc_nulls_last_id 
ON public.cars_cache (price_cents DESC NULLS LAST, id ASC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_year_nulls_last_id 
ON public.cars_cache (year ASC NULLS LAST, id ASC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_year_desc_nulls_last_id 
ON public.cars_cache (year DESC NULLS LAST, id ASC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_mileage_nulls_last_id 
ON public.cars_cache (mileage_km ASC NULLS LAST, id ASC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_mileage_desc_nulls_last_id 
ON public.cars_cache (mileage_km DESC NULLS LAST, id ASC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_rank_score_nulls_last_id 
ON public.cars_cache (rank_score DESC NULLS LAST, id ASC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_created_at_nulls_last_id 
ON public.cars_cache (created_at DESC NULLS LAST, id ASC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_make_nulls_last_id 
ON public.cars_cache (make ASC NULLS LAST, id ASC) 
WHERE is_active = true;

-- Composite indexes for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_make_model_active 
ON public.cars_cache (make, model) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_fuel_active 
ON public.cars_cache (fuel) 
WHERE is_active = true AND fuel IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_year_range_active 
ON public.cars_cache (year) 
WHERE is_active = true AND year IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_price_range_active 
ON public.cars_cache (price_cents) 
WHERE is_active = true AND price_cents IS NOT NULL;

-- Full-text search index for search functionality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_cache_search_text 
ON public.cars_cache USING gin(to_tsvector('english', make || ' ' || model || ' ' || COALESCE(color, ''))) 
WHERE is_active = true;

-- Create new RPC functions for cars_cache with offset/limit pagination

-- Function to get cars from cars_cache with offset/limit pagination
CREATE OR REPLACE FUNCTION cars_cache_paginated(
  p_filters JSONB DEFAULT '{}',
  p_sort_field TEXT DEFAULT 'price_cents',
  p_sort_dir TEXT DEFAULT 'ASC',
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  api_id TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC,
  price_cents BIGINT,
  rank_score NUMERIC,
  mileage_km INTEGER,
  fuel TEXT,
  transmission TEXT,
  color TEXT,
  condition TEXT,
  vin TEXT,
  lot_number TEXT,
  location TEXT,
  image_url TEXT,
  images JSONB,
  car_data JSONB,
  lot_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_sql TEXT;
  filter_conditions TEXT := '';
  order_clause TEXT;
BEGIN
  -- Validate sort parameters
  IF p_sort_field NOT IN ('price_cents', 'rank_score', 'year', 'mileage_km', 'make', 'created_at') THEN
    RAISE EXCEPTION 'Invalid sort field: %', p_sort_field;
  END IF;
  
  IF p_sort_dir NOT IN ('ASC', 'DESC') THEN
    RAISE EXCEPTION 'Invalid sort direction: %', p_sort_dir;
  END IF;

  -- Build filter conditions
  IF p_filters ? 'make' THEN
    filter_conditions := filter_conditions || ' AND make = ' || quote_literal(p_filters->>'make');
  END IF;
  
  IF p_filters ? 'model' THEN
    filter_conditions := filter_conditions || ' AND model = ' || quote_literal(p_filters->>'model');
  END IF;
  
  IF p_filters ? 'yearMin' THEN
    filter_conditions := filter_conditions || ' AND year >= ' || (p_filters->>'yearMin')::INTEGER;
  END IF;
  
  IF p_filters ? 'yearMax' THEN
    filter_conditions := filter_conditions || ' AND year <= ' || (p_filters->>'yearMax')::INTEGER;
  END IF;
  
  IF p_filters ? 'priceMin' THEN
    filter_conditions := filter_conditions || ' AND price_cents >= ' || ((p_filters->>'priceMin')::NUMERIC * 100)::BIGINT;
  END IF;
  
  IF p_filters ? 'priceMax' THEN
    filter_conditions := filter_conditions || ' AND price_cents <= ' || ((p_filters->>'priceMax')::NUMERIC * 100)::BIGINT;
  END IF;
  
  IF p_filters ? 'fuel' THEN
    filter_conditions := filter_conditions || ' AND fuel = ' || quote_literal(p_filters->>'fuel');
  END IF;
  
  IF p_filters ? 'search' THEN
    filter_conditions := filter_conditions || ' AND to_tsvector(''english'', make || '' '' || model || '' '' || COALESCE(color, '''')) @@ plainto_tsquery(''english'', ' || quote_literal(p_filters->>'search') || ')';
  END IF;

  -- Build order clause with nulls last and id tiebreaker
  order_clause := 'ORDER BY ' || p_sort_field || ' ' || p_sort_dir || ' NULLS LAST, id ASC';

  -- Build and execute query
  query_sql := 'SELECT c.id, c.api_id, c.make, c.model, c.year, c.price, c.price_cents, c.rank_score, ' ||
               'c.mileage_km, c.fuel, c.transmission, c.color, c.condition, c.vin, c.lot_number, ' ||
               '''''' AS location, c.image_url, c.images, c.car_data, c.lot_data, ' ||
               'c.created_at, c.updated_at ' ||
               'FROM public.cars_cache c ' ||
               'WHERE c.is_active = true' ||
               filter_conditions || ' ' ||
               order_clause || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  RETURN QUERY EXECUTE query_sql;
END;
$$;

-- Function to get filtered car count from cars_cache
CREATE OR REPLACE FUNCTION cars_cache_filtered_count(
  p_filters JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count_sql TEXT;
  filter_conditions TEXT := '';
  result_count INTEGER;
BEGIN
  -- Build filter conditions (same as above)
  IF p_filters ? 'make' THEN
    filter_conditions := filter_conditions || ' AND make = ' || quote_literal(p_filters->>'make');
  END IF;
  
  IF p_filters ? 'model' THEN
    filter_conditions := filter_conditions || ' AND model = ' || quote_literal(p_filters->>'model');
  END IF;
  
  IF p_filters ? 'yearMin' THEN
    filter_conditions := filter_conditions || ' AND year >= ' || (p_filters->>'yearMin')::INTEGER;
  END IF;
  
  IF p_filters ? 'yearMax' THEN
    filter_conditions := filter_conditions || ' AND year <= ' || (p_filters->>'yearMax')::INTEGER;
  END IF;
  
  IF p_filters ? 'priceMin' THEN
    filter_conditions := filter_conditions || ' AND price_cents >= ' || ((p_filters->>'priceMin')::NUMERIC * 100)::BIGINT;
  END IF;
  
  IF p_filters ? 'priceMax' THEN
    filter_conditions := filter_conditions || ' AND price_cents <= ' || ((p_filters->>'priceMax')::NUMERIC * 100)::BIGINT;
  END IF;
  
  IF p_filters ? 'fuel' THEN
    filter_conditions := filter_conditions || ' AND fuel = ' || quote_literal(p_filters->>'fuel');
  END IF;
  
  IF p_filters ? 'search' THEN
    filter_conditions := filter_conditions || ' AND to_tsvector(''english'', make || '' '' || model || '' '' || COALESCE(color, '''')) @@ plainto_tsquery(''english'', ' || quote_literal(p_filters->>'search') || ')';
  END IF;

  count_sql := 'SELECT COUNT(*) FROM public.cars_cache WHERE is_active = true' || filter_conditions;
  
  EXECUTE count_sql INTO result_count;
  RETURN result_count;
END;
$$;

-- Function to get facets for filtering
CREATE OR REPLACE FUNCTION cars_cache_facets(
  p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (
  makes JSONB,
  models JSONB,
  fuels JSONB,
  year_range JSONB,
  price_range JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  filter_conditions TEXT := '';
  base_query TEXT;
BEGIN
  -- Build base filter conditions (excluding the facet we're calculating)
  IF p_filters ? 'yearMin' THEN
    filter_conditions := filter_conditions || ' AND year >= ' || (p_filters->>'yearMin')::INTEGER;
  END IF;
  
  IF p_filters ? 'yearMax' THEN
    filter_conditions := filter_conditions || ' AND year <= ' || (p_filters->>'yearMax')::INTEGER;
  END IF;
  
  IF p_filters ? 'priceMin' THEN
    filter_conditions := filter_conditions || ' AND price_cents >= ' || ((p_filters->>'priceMin')::NUMERIC * 100)::BIGINT;
  END IF;
  
  IF p_filters ? 'priceMax' THEN
    filter_conditions := filter_conditions || ' AND price_cents <= ' || ((p_filters->>'priceMax')::NUMERIC * 100)::BIGINT;
  END IF;
  
  IF p_filters ? 'search' THEN
    filter_conditions := filter_conditions || ' AND to_tsvector(''english'', make || '' '' || model || '' '' || COALESCE(color, '''')) @@ plainto_tsquery(''english'', ' || quote_literal(p_filters->>'search') || ')';
  END IF;

  base_query := 'FROM public.cars_cache WHERE is_active = true' || filter_conditions;

  RETURN QUERY
  WITH facet_data AS (
    -- Get makes (excluding current make filter)
    SELECT 
      json_agg(json_build_object('value', make, 'count', count)) FILTER (WHERE make IS NOT NULL) as makes_result
    FROM (
      SELECT make, COUNT(*) as count 
      FROM public.cars_cache 
      WHERE is_active = true 
        AND (NOT (p_filters ? 'make') OR make != (p_filters->>'make'))
        AND year >= COALESCE((p_filters->>'yearMin')::INTEGER, year)
        AND year <= COALESCE((p_filters->>'yearMax')::INTEGER, year)
        AND price_cents >= COALESCE(((p_filters->>'priceMin')::NUMERIC * 100)::BIGINT, price_cents)
        AND price_cents <= COALESCE(((p_filters->>'priceMax')::NUMERIC * 100)::BIGINT, price_cents)
        AND (NOT (p_filters ? 'fuel') OR fuel = (p_filters->>'fuel'))
        AND (NOT (p_filters ? 'search') OR to_tsvector('english', make || ' ' || model || ' ' || COALESCE(color, '')) @@ plainto_tsquery('english', p_filters->>'search'))
      GROUP BY make 
      ORDER BY count DESC, make 
      LIMIT 20
    ) make_counts
  )
  SELECT 
    COALESCE(makes_result, '[]'::jsonb) as makes,
    '[]'::jsonb as models, -- Simplified for now
    '[]'::jsonb as fuels,  -- Simplified for now
    json_build_object('min', 2000, 'max', 2024)::jsonb as year_range, -- Simplified for now
    json_build_object('min', 0, 'max', 1000000)::jsonb as price_range -- Simplified for now
  FROM facet_data;
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION cars_cache_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION cars_cache_paginated TO anon;
GRANT EXECUTE ON FUNCTION cars_cache_filtered_count TO authenticated;
GRANT EXECUTE ON FUNCTION cars_cache_filtered_count TO anon;
GRANT EXECUTE ON FUNCTION cars_cache_facets TO authenticated;
GRANT EXECUTE ON FUNCTION cars_cache_facets TO anon;