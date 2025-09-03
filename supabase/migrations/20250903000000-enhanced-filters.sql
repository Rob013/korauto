-- Enhanced filters for listings API - add missing filter support
-- Adds gearbox, drivetrain, city, mileageMax, and q filters

-- Update cars_cache_paginated function to support additional filters
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
  
  -- New filter: mileageMax
  IF p_filters ? 'mileageMax' THEN
    filter_conditions := filter_conditions || ' AND mileage_km <= ' || (p_filters->>'mileageMax')::INTEGER;
  END IF;
  
  IF p_filters ? 'fuel' THEN
    filter_conditions := filter_conditions || ' AND fuel = ' || quote_literal(p_filters->>'fuel');
  END IF;
  
  -- New filter: gearbox (transmission)
  IF p_filters ? 'gearbox' THEN
    filter_conditions := filter_conditions || ' AND transmission = ' || quote_literal(p_filters->>'gearbox');
  END IF;
  
  -- New filter: drivetrain (from car_data JSON)
  IF p_filters ? 'drivetrain' THEN
    filter_conditions := filter_conditions || ' AND car_data->>''drivetrain'' = ' || quote_literal(p_filters->>'drivetrain');
  END IF;
  
  -- New filter: city (from car_data JSON or location)
  IF p_filters ? 'city' THEN
    filter_conditions := filter_conditions || ' AND (location = ' || quote_literal(p_filters->>'city') || 
                         ' OR car_data->>''city'' = ' || quote_literal(p_filters->>'city') || ')';
  END IF;
  
  -- Enhanced search: support both 'search' and 'q' parameters
  IF p_filters ? 'search' THEN
    filter_conditions := filter_conditions || ' AND to_tsvector(''english'', make || '' '' || model || '' '' || COALESCE(color, '''')) @@ plainto_tsquery(''english'', ' || quote_literal(p_filters->>'search') || ')';
  END IF;
  
  IF p_filters ? 'q' THEN
    filter_conditions := filter_conditions || ' AND to_tsvector(''english'', make || '' '' || model || '' '' || COALESCE(color, '''')) @@ plainto_tsquery(''english'', ' || quote_literal(p_filters->>'q') || ')';
  END IF;

  -- Build order clause with nulls last and id tiebreaker for stable pagination
  order_clause := 'ORDER BY ' || p_sort_field || ' ' || p_sort_dir || ' NULLS LAST, id ASC';

  -- Build and execute query
  query_sql := 'SELECT c.id, c.api_id, c.make, c.model, c.year, c.price, c.price_cents, c.rank_score, ' ||
               'c.mileage_km, c.fuel, c.transmission, c.color, c.condition, c.vin, c.lot_number, ' ||
               'COALESCE(c.location, car_data->>''city'', '''') AS location, c.image_url, c.images, c.car_data, c.lot_data, ' ||
               'c.created_at, c.updated_at ' ||
               'FROM public.cars_cache c ' ||
               'WHERE c.is_active = true' ||
               filter_conditions || ' ' ||
               order_clause || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  RETURN QUERY EXECUTE query_sql;
END;
$$;

-- Update cars_cache_filtered_count function with same filters
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
  
  IF p_filters ? 'mileageMax' THEN
    filter_conditions := filter_conditions || ' AND mileage_km <= ' || (p_filters->>'mileageMax')::INTEGER;
  END IF;
  
  IF p_filters ? 'fuel' THEN
    filter_conditions := filter_conditions || ' AND fuel = ' || quote_literal(p_filters->>'fuel');
  END IF;
  
  IF p_filters ? 'gearbox' THEN
    filter_conditions := filter_conditions || ' AND transmission = ' || quote_literal(p_filters->>'gearbox');
  END IF;
  
  IF p_filters ? 'drivetrain' THEN
    filter_conditions := filter_conditions || ' AND car_data->>''drivetrain'' = ' || quote_literal(p_filters->>'drivetrain');
  END IF;
  
  IF p_filters ? 'city' THEN
    filter_conditions := filter_conditions || ' AND (location = ' || quote_literal(p_filters->>'city') || 
                         ' OR car_data->>''city'' = ' || quote_literal(p_filters->>'city') || ')';
  END IF;
  
  IF p_filters ? 'search' THEN
    filter_conditions := filter_conditions || ' AND to_tsvector(''english'', make || '' '' || model || '' '' || COALESCE(color, '''')) @@ plainto_tsquery(''english'', ' || quote_literal(p_filters->>'search') || ')';
  END IF;
  
  IF p_filters ? 'q' THEN
    filter_conditions := filter_conditions || ' AND to_tsvector(''english'', make || '' '' || model || '' '' || COALESCE(color, '''')) @@ plainto_tsquery(''english'', ' || quote_literal(p_filters->>'q') || ')';
  END IF;

  count_sql := 'SELECT COUNT(*) FROM public.cars_cache WHERE is_active = true' || filter_conditions;
  
  EXECUTE count_sql INTO result_count;
  RETURN result_count;
END;
$$;

-- Update facets function to include more facet types
CREATE OR REPLACE FUNCTION cars_cache_facets(
  p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (
  makes JSONB,
  models JSONB,
  fuels JSONB,
  gearboxes JSONB,
  cities JSONB,
  year_ranges JSONB,
  price_ranges JSONB,
  mileage_ranges JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  filter_conditions TEXT := '';
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
  
  IF p_filters ? 'mileageMax' THEN
    filter_conditions := filter_conditions || ' AND mileage_km <= ' || (p_filters->>'mileageMax')::INTEGER;
  END IF;
  
  IF p_filters ? 'search' OR p_filters ? 'q' THEN
    filter_conditions := filter_conditions || ' AND to_tsvector(''english'', make || '' '' || model || '' '' || COALESCE(color, '''')) @@ plainto_tsquery(''english'', ' || 
                         quote_literal(COALESCE(p_filters->>'search', p_filters->>'q')) || ')';
  END IF;

  RETURN QUERY
  WITH facet_data AS (
    SELECT 
      -- Makes facet
      (SELECT json_agg(json_build_object('value', make, 'count', count)) 
       FROM (
         SELECT make, COUNT(*) as count 
         FROM public.cars_cache 
         WHERE is_active = true 
           AND (NOT (p_filters ? 'make') OR make != (p_filters->>'make'))
         GROUP BY make 
         ORDER BY count DESC, make 
         LIMIT 20
       ) make_counts) as makes_result,
       
      -- Models facet
      (SELECT json_agg(json_build_object('value', model, 'count', count)) 
       FROM (
         SELECT model, COUNT(*) as count 
         FROM public.cars_cache 
         WHERE is_active = true 
           AND (NOT (p_filters ? 'model') OR model != (p_filters->>'model'))
         GROUP BY model 
         ORDER BY count DESC, model 
         LIMIT 20
       ) model_counts) as models_result,
       
      -- Fuels facet
      (SELECT json_agg(json_build_object('value', fuel, 'count', count)) 
       FROM (
         SELECT fuel, COUNT(*) as count 
         FROM public.cars_cache 
         WHERE is_active = true AND fuel IS NOT NULL
           AND (NOT (p_filters ? 'fuel') OR fuel != (p_filters->>'fuel'))
         GROUP BY fuel 
         ORDER BY count DESC, fuel 
         LIMIT 10
       ) fuel_counts) as fuels_result,
       
      -- Gearboxes facet (transmission)
      (SELECT json_agg(json_build_object('value', transmission, 'count', count)) 
       FROM (
         SELECT transmission, COUNT(*) as count 
         FROM public.cars_cache 
         WHERE is_active = true AND transmission IS NOT NULL
           AND (NOT (p_filters ? 'gearbox') OR transmission != (p_filters->>'gearbox'))
         GROUP BY transmission 
         ORDER BY count DESC, transmission 
         LIMIT 10
       ) gearbox_counts) as gearboxes_result,
       
      -- Cities facet
      (SELECT json_agg(json_build_object('value', city, 'count', count)) 
       FROM (
         SELECT 
           COALESCE(location, car_data->>'city') as city, 
           COUNT(*) as count 
         FROM public.cars_cache 
         WHERE is_active = true 
           AND COALESCE(location, car_data->>'city') IS NOT NULL
           AND (NOT (p_filters ? 'city') OR COALESCE(location, car_data->>'city') != (p_filters->>'city'))
         GROUP BY COALESCE(location, car_data->>'city')
         ORDER BY count DESC, city 
         LIMIT 20
       ) city_counts) as cities_result
  )
  SELECT 
    COALESCE(makes_result, '[]'::jsonb) as makes,
    COALESCE(models_result, '[]'::jsonb) as models,
    COALESCE(fuels_result, '[]'::jsonb) as fuels,
    COALESCE(gearboxes_result, '[]'::jsonb) as gearboxes,
    COALESCE(cities_result, '[]'::jsonb) as cities,
    json_build_object('min', 2015, 'max', 2024)::jsonb as year_ranges,
    json_build_object('min', 5000, 'max', 100000)::jsonb as price_ranges,
    json_build_array(
      json_build_object('label', '0-25k', 'min', 0, 'max', 25000),
      json_build_object('label', '25k-50k', 'min', 25000, 'max', 50000),
      json_build_object('label', '50k-100k', 'min', 50000, 'max', 100000),
      json_build_object('label', '100k+', 'min', 100000, 'max', 500000)
    )::jsonb as mileage_ranges
  FROM facet_data;
END;
$$;