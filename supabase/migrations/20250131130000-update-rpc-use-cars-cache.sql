-- Update RPC functions to use cars_cache table with synced data
-- This migration updates the keyset pagination functions to use the cars_cache table
-- which contains the most up-to-date synced car data from external APIs

-- Add price_cents column to cars_cache if not exists
ALTER TABLE public.cars_cache 
ADD COLUMN IF NOT EXISTS price_cents BIGINT,
ADD COLUMN IF NOT EXISTS rank_score NUMERIC;

-- Update price_cents from price field 
UPDATE public.cars_cache 
SET price_cents = CASE 
  WHEN price IS NOT NULL THEN (price * 100)::BIGINT
  ELSE NULL
END
WHERE price_cents IS NULL;

-- Update rank_score based on available data
UPDATE public.cars_cache 
SET rank_score = CASE 
  WHEN year IS NOT NULL AND price IS NOT NULL THEN 
    (year - 2000) * 10 + GREATEST(0, (50000 - COALESCE(price, 25000)) / 1000.0)
  WHEN year IS NOT NULL THEN 
    (year - 2000) * 10
  ELSE 0
END
WHERE rank_score IS NULL;

-- Update cars_keyset_page function to use cars_cache table
CREATE OR REPLACE FUNCTION cars_keyset_page(
  p_filters JSONB DEFAULT '{}',
  p_sort_field TEXT DEFAULT 'price_cents',
  p_sort_dir TEXT DEFAULT 'ASC',
  p_cursor_value TEXT DEFAULT NULL,
  p_cursor_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 24
)
RETURNS TABLE (
  id TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC,
  price_cents BIGINT,
  rank_score NUMERIC,
  mileage INTEGER,
  fuel TEXT,
  transmission TEXT,
  color TEXT,
  location TEXT,
  image_url TEXT,
  images JSONB,
  title TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_sql TEXT;
  filter_conditions TEXT := '';
  cursor_condition TEXT := '';
  order_clause TEXT;
BEGIN
  -- Validate sort parameters (extended to support new fields)
  IF p_sort_field NOT IN ('price_cents', 'rank_score', 'year', 'mileage', 'make', 'created_at') THEN
    RAISE EXCEPTION 'Invalid sort field: %', p_sort_field;
  END IF;
  
  IF p_sort_dir NOT IN ('ASC', 'DESC') THEN
    RAISE EXCEPTION 'Invalid sort direction: %', p_sort_dir;
  END IF;

  -- Build filter conditions
  IF p_filters ? 'make' THEN
    filter_conditions := filter_conditions || ' AND cars.make = ' || quote_literal(p_filters->>'make');
  END IF;
  
  IF p_filters ? 'model' THEN
    filter_conditions := filter_conditions || ' AND cars.model = ' || quote_literal(p_filters->>'model');
  END IF;
  
  IF p_filters ? 'yearMin' THEN
    filter_conditions := filter_conditions || ' AND cars.year >= ' || (p_filters->>'yearMin')::INTEGER;
  END IF;
  
  IF p_filters ? 'yearMax' THEN
    filter_conditions := filter_conditions || ' AND cars.year <= ' || (p_filters->>'yearMax')::INTEGER;
  END IF;
  
  IF p_filters ? 'priceMin' THEN
    filter_conditions := filter_conditions || ' AND cars.price_cents >= ' || ((p_filters->>'priceMin')::NUMERIC * 100)::BIGINT;
  END IF;
  
  IF p_filters ? 'priceMax' THEN
    filter_conditions := filter_conditions || ' AND cars.price_cents <= ' || ((p_filters->>'priceMax')::NUMERIC * 100)::BIGINT;
  END IF;
  
  IF p_filters ? 'fuel' THEN
    filter_conditions := filter_conditions || ' AND cars.fuel = ' || quote_literal(p_filters->>'fuel');
  END IF;
  
  IF p_filters ? 'search' THEN
    filter_conditions := filter_conditions || ' AND (cars.make ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                             ' OR cars.model ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                             ' OR cars.color ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || ')';
  END IF;

  -- Build cursor condition for keyset pagination (extended for new fields)
  IF p_cursor_value IS NOT NULL AND p_cursor_id IS NOT NULL THEN
    IF p_sort_field = 'mileage' THEN
      -- Special handling for mileage since it's stored as TEXT but used as INTEGER
      IF p_sort_dir = 'ASC' THEN
        cursor_condition := ' AND (COALESCE(NULLIF(cars.mileage, '''')::INTEGER, 0), cars.id) > (' || 
                           COALESCE(p_cursor_value::INTEGER::TEXT, '0') || ', ' || quote_literal(p_cursor_id) || ')';
      ELSE
        cursor_condition := ' AND (COALESCE(NULLIF(cars.mileage, '''')::INTEGER, 0), cars.id) < (' || 
                           COALESCE(p_cursor_value::INTEGER::TEXT, '999999') || ', ' || quote_literal(p_cursor_id) || ')';
      END IF;
    ELSE
      -- Standard handling for other fields
      IF p_sort_dir = 'ASC' THEN
        cursor_condition := ' AND (' || p_sort_field || ', cars.id) > (' || 
                           CASE 
                             WHEN p_sort_field IN ('price_cents', 'year') THEN p_cursor_value::BIGINT::TEXT
                             WHEN p_sort_field = 'rank_score' THEN p_cursor_value::NUMERIC::TEXT
                             WHEN p_sort_field = 'created_at' THEN quote_literal(p_cursor_value::TIMESTAMPTZ::TEXT)
                             ELSE quote_literal(p_cursor_value)
                           END || ', ' || quote_literal(p_cursor_id) || ')';
      ELSE
        cursor_condition := ' AND (' || p_sort_field || ', cars.id) < (' || 
                           CASE 
                             WHEN p_sort_field IN ('price_cents', 'year') THEN p_cursor_value::BIGINT::TEXT
                             WHEN p_sort_field = 'rank_score' THEN p_cursor_value::NUMERIC::TEXT
                             WHEN p_sort_field = 'created_at' THEN quote_literal(p_cursor_value::TIMESTAMPTZ::TEXT)
                             ELSE quote_literal(p_cursor_value)
                           END || ', ' || quote_literal(p_cursor_id) || ')';
      END IF;
    END IF;
  END IF;

  -- Build order clause with proper type conversion for mileage
  IF p_sort_field = 'mileage' THEN
    order_clause := 'ORDER BY COALESCE(NULLIF(cars.mileage, '''')::INTEGER, 0) ' || p_sort_dir || ' NULLS LAST, cars.id ASC';
  ELSE
    order_clause := 'ORDER BY ' || p_sort_field || ' ' || p_sort_dir || ' NULLS LAST, cars.id ASC';
  END IF;

  -- Build and execute query using cars_cache table with synced data
  -- Handle special WHERE condition for mileage since it's stored as TEXT
  IF p_sort_field = 'mileage' THEN
    query_sql := 'SELECT cars.id, cars.make, cars.model, cars.year, cars.price, cars.price_cents, cars.rank_score, ' ||
                 'COALESCE(NULLIF(cars.mileage, '''')::INTEGER, 0) as mileage, cars.fuel, cars.transmission, cars.color, ' ||
                 'COALESCE(cars.condition, '''') as location, ' ||
                 'COALESCE((cars.images->>0), '''') as image_url, cars.images, ' ||
                 'COALESCE(cars.make || '' '' || cars.model || '' '' || cars.year::TEXT, '''') as title, ' ||
                 'cars.created_at ' ||
                 'FROM public.cars_cache cars ' ||
                 'WHERE cars.mileage IS NOT NULL AND cars.mileage != '''' ' ||
                 filter_conditions || cursor_condition || ' ' ||
                 order_clause || ' LIMIT ' || p_limit;
  ELSE
    query_sql := 'SELECT cars.id, cars.make, cars.model, cars.year, cars.price, cars.price_cents, cars.rank_score, ' ||
                 'COALESCE(NULLIF(cars.mileage, '''')::INTEGER, 0) as mileage, cars.fuel, cars.transmission, cars.color, ' ||
                 'COALESCE(cars.condition, '''') as location, ' ||
                 'COALESCE((cars.images->>0), '''') as image_url, cars.images, ' ||
                 'COALESCE(cars.make || '' '' || cars.model || '' '' || cars.year::TEXT, '''') as title, ' ||
                 'cars.created_at ' ||
                 'FROM public.cars_cache cars ' ||
                 'WHERE ' || p_sort_field || ' IS NOT NULL' ||
                 filter_conditions || cursor_condition || ' ' ||
                 order_clause || ' LIMIT ' || p_limit;
  END IF;

  RETURN QUERY EXECUTE query_sql;
END;
$$;

-- Update cars_filtered_count function to use cars_cache table
CREATE OR REPLACE FUNCTION cars_filtered_count(
  p_filters JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  query_sql TEXT;
  filter_conditions TEXT := '';
  result_count INTEGER;
BEGIN
  -- Build filter conditions (same as keyset function)
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
    filter_conditions := filter_conditions || ' AND (make ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                             ' OR model ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                             ' OR color ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || ')';
  END IF;

  -- Build and execute count query using cars_cache table
  query_sql := 'SELECT COUNT(*) FROM public.cars_cache WHERE 1=1' || filter_conditions;
  
  EXECUTE query_sql INTO result_count;
  
  RETURN COALESCE(result_count, 0);
END;
$$;

-- Create indexes for cars_cache table for better performance
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents_id ON public.cars_cache (price_cents ASC, id ASC)
WHERE price_cents IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents_desc_id ON public.cars_cache (price_cents DESC, id ASC)
WHERE price_cents IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_cache_rank_score_id ON public.cars_cache (rank_score ASC, id ASC)
WHERE rank_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_cache_rank_score_desc_id ON public.cars_cache (rank_score DESC, id ASC)
WHERE rank_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_cache_year_id ON public.cars_cache (year ASC, id ASC)
WHERE year IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_cache_year_desc_id ON public.cars_cache (year DESC, id ASC)
WHERE year IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_cache_make_id ON public.cars_cache (make ASC, id ASC)
WHERE make IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_cache_created_at_id ON public.cars_cache (created_at DESC, id ASC)
WHERE created_at IS NOT NULL;