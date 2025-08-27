-- Add LIMIT/OFFSET pagination function for global database sorting
-- This migration adds an alternative pagination function using LIMIT/OFFSET 
-- as requested in the problem statement alongside the existing cursor-based pagination

-- Function to get cars with LIMIT/OFFSET pagination and global sorting
CREATE OR REPLACE FUNCTION cars_limit_offset_page(
  p_filters JSONB DEFAULT '{}',
  p_sort_field TEXT DEFAULT 'price_cents',
  p_sort_dir TEXT DEFAULT 'ASC',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 24
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
  order_clause TEXT;
  offset_value INTEGER;
BEGIN
  -- Validate sort parameters
  IF p_sort_field NOT IN ('price_cents', 'rank_score', 'year', 'mileage', 'make', 'created_at') THEN
    RAISE EXCEPTION 'Invalid sort field: %', p_sort_field;
  END IF;
  
  IF p_sort_dir NOT IN ('ASC', 'DESC') THEN
    RAISE EXCEPTION 'Invalid sort direction: %', p_sort_dir;
  END IF;

  -- Validate pagination parameters
  IF p_page < 1 THEN
    RAISE EXCEPTION 'Page must be >= 1';
  END IF;
  
  IF p_page_size < 1 OR p_page_size > 100 THEN
    RAISE EXCEPTION 'Page size must be between 1 and 100';
  END IF;

  -- Build filter conditions (same as keyset function)
  IF p_filters ? 'make' THEN
    filter_conditions := filter_conditions || ' AND make ILIKE ' || quote_literal('%' || (p_filters->>'make') || '%');
  END IF;

  IF p_filters ? 'model' THEN
    filter_conditions := filter_conditions || ' AND model ILIKE ' || quote_literal('%' || (p_filters->>'model') || '%');
  END IF;

  IF p_filters ? 'yearMin' THEN
    filter_conditions := filter_conditions || ' AND year >= ' || (p_filters->>'yearMin')::INTEGER;
  END IF;

  IF p_filters ? 'yearMax' THEN
    filter_conditions := filter_conditions || ' AND year <= ' || (p_filters->>'yearMax')::INTEGER;
  END IF;

  IF p_filters ? 'priceMin' THEN
    filter_conditions := filter_conditions || ' AND price_cents >= ' || (p_filters->>'priceMin')::BIGINT * 100;
  END IF;

  IF p_filters ? 'priceMax' THEN
    filter_conditions := filter_conditions || ' AND price_cents <= ' || (p_filters->>'priceMax')::BIGINT * 100;
  END IF;

  IF p_filters ? 'fuel' THEN
    filter_conditions := filter_conditions || ' AND fuel ILIKE ' || quote_literal('%' || (p_filters->>'fuel') || '%');
  END IF;

  IF p_filters ? 'search' THEN
    filter_conditions := filter_conditions || ' AND (make ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                             ' OR model ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                             ' OR color ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || ')';
  END IF;

  -- Build order clause with NULLS LAST and stable secondary key (id ASC)
  order_clause := 'ORDER BY ' || p_sort_field || ' ' || p_sort_dir || ' NULLS LAST, cars.id ASC';

  -- Calculate offset for LIMIT/OFFSET pagination
  offset_value := (p_page - 1) * p_page_size;

  -- Build and execute query using active_cars view
  query_sql := 'SELECT cars.id, cars.make, cars.model, cars.year, cars.price, cars.price_cents, cars.rank_score, ' ||
               'cars.mileage, cars.fuel, cars.transmission, cars.color, cars.location, ' ||
               'cars.image_url, cars.images, cars.title, cars.created_at ' ||
               'FROM public.active_cars cars ' ||
               'WHERE ' || p_sort_field || ' IS NOT NULL' ||
               filter_conditions || ' ' ||
               order_clause || ' LIMIT ' || p_page_size || ' OFFSET ' || offset_value;

  RETURN QUERY EXECUTE query_sql;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION cars_limit_offset_page IS 'Returns paginated cars with global sorting using LIMIT/OFFSET pagination. Applies filters → ORDER BY (with NULLS LAST and stable ID secondary key) → LIMIT/OFFSET as requested in problem statement.';