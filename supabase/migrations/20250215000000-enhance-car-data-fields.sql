-- Enhance keyset pagination functions to return complete car data
-- This migration updates the RPC functions to return all database fields like external APIs

-- Update cars_keyset_page function to return comprehensive car data
CREATE OR REPLACE FUNCTION cars_keyset_page(
  p_filters JSONB DEFAULT '{}',
  p_sort_field TEXT DEFAULT 'price_cents',
  p_sort_dir TEXT DEFAULT 'ASC',
  p_cursor_value TEXT DEFAULT NULL,
  p_cursor_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 24
)
RETURNS TABLE (
  -- Core car identification
  id TEXT,
  external_id TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC,
  price_cents BIGINT,
  rank_score NUMERIC,
  mileage INTEGER,
  
  -- Basic car info
  title TEXT,
  vin TEXT,
  color TEXT,
  fuel TEXT,
  transmission TEXT,
  condition TEXT,
  location TEXT,
  
  -- Auction/Sale info
  lot_number TEXT,
  current_bid NUMERIC,
  buy_now_price NUMERIC,
  final_bid NUMERIC,
  sale_date TIMESTAMPTZ,
  
  -- Images and media
  image_url TEXT,
  images JSONB,
  
  -- Source tracking
  source_api TEXT,
  domain_name TEXT,
  
  -- Status and metadata
  status TEXT,
  is_live BOOLEAN,
  keys_available BOOLEAN,
  is_active BOOLEAN,
  is_archived BOOLEAN,
  
  -- Hash for change detection
  data_hash TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ
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

  -- Build cursor condition for keyset pagination (extended for new fields)
  IF p_cursor_value IS NOT NULL AND p_cursor_id IS NOT NULL THEN
    IF p_sort_dir = 'ASC' THEN
      cursor_condition := ' AND (' || p_sort_field || ', cars.id) > (' || 
                         CASE 
                           WHEN p_sort_field IN ('price_cents', 'mileage', 'year') THEN p_cursor_value::BIGINT::TEXT
                           WHEN p_sort_field = 'rank_score' THEN p_cursor_value::NUMERIC::TEXT
                           WHEN p_sort_field = 'created_at' THEN quote_literal(p_cursor_value::TIMESTAMPTZ::TEXT)
                           ELSE quote_literal(p_cursor_value)
                         END || ', ' || quote_literal(p_cursor_id) || ')';
    ELSE
      cursor_condition := ' AND (' || p_sort_field || ', cars.id) < (' || 
                         CASE 
                           WHEN p_sort_field IN ('price_cents', 'mileage', 'year') THEN p_cursor_value::BIGINT::TEXT
                           WHEN p_sort_field = 'rank_score' THEN p_cursor_value::NUMERIC::TEXT
                           WHEN p_sort_field = 'created_at' THEN quote_literal(p_cursor_value::TIMESTAMPTZ::TEXT)
                           ELSE quote_literal(p_cursor_value)
                         END || ', ' || quote_literal(p_cursor_id) || ')';
    END IF;
  END IF;

  -- Build order clause
  order_clause := 'ORDER BY ' || p_sort_field || ' ' || p_sort_dir || ' NULLS LAST, cars.id ASC';

  -- Build and execute query with complete car data
  query_sql := 'SELECT ' ||
               'cars.id, cars.external_id, cars.make, cars.model, cars.year, cars.price, cars.price_cents, cars.rank_score, ' ||
               'cars.mileage, cars.title, cars.vin, cars.color, cars.fuel, cars.transmission, cars.condition, cars.location, ' ||
               'cars.lot_number, cars.current_bid, cars.buy_now_price, cars.final_bid, cars.sale_date, ' ||
               'cars.image_url, cars.images, cars.source_api, cars.domain_name, ' ||
               'cars.status, cars.is_live, cars.keys_available, cars.is_active, cars.is_archived, ' ||
               'cars.data_hash, cars.created_at, cars.updated_at, cars.last_synced_at ' ||
               'FROM public.active_cars cars ' ||
               'WHERE ' || p_sort_field || ' IS NOT NULL' ||
               filter_conditions || cursor_condition || ' ' ||
               order_clause || ' LIMIT ' || p_limit;

  RETURN QUERY EXECUTE query_sql;
END;
$$;

-- Update comments to reflect enhanced functionality
COMMENT ON FUNCTION cars_keyset_page IS 'Enhanced keyset pagination function that returns complete car data including all fields available in external APIs';