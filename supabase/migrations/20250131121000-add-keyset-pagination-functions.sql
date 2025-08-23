-- Supabase RPC functions for keyset pagination with global sorting

-- Function to get cars with keyset pagination
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
  -- Validate sort parameters
  IF p_sort_field NOT IN ('price_cents', 'rank_score') THEN
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

  -- Build cursor condition for keyset pagination
  IF p_cursor_value IS NOT NULL AND p_cursor_id IS NOT NULL THEN
    IF p_sort_dir = 'ASC' THEN
      cursor_condition := ' AND (' || p_sort_field || ', cars.id) > (' || 
                         CASE 
                           WHEN p_sort_field = 'price_cents' THEN p_cursor_value::BIGINT::TEXT
                           ELSE p_cursor_value::NUMERIC::TEXT
                         END || ', ' || quote_literal(p_cursor_id) || ')';
    ELSE
      cursor_condition := ' AND (' || p_sort_field || ', cars.id) < (' || 
                         CASE 
                           WHEN p_sort_field = 'price_cents' THEN p_cursor_value::BIGINT::TEXT
                           ELSE p_cursor_value::NUMERIC::TEXT
                         END || ', ' || quote_literal(p_cursor_id) || ')';
    END IF;
  END IF;

  -- Build order clause
  order_clause := 'ORDER BY ' || p_sort_field || ' ' || p_sort_dir || ' NULLS LAST, cars.id ASC';

  -- Build and execute query
  query_sql := 'SELECT cars.id, cars.make, cars.model, cars.year, cars.price, cars.price_cents, cars.rank_score, ' ||
               'cars.mileage, cars.fuel, cars.transmission, cars.color, cars.location, ' ||
               'cars.image_url, cars.images, cars.title, cars.created_at ' ||
               'FROM public.cars ' ||
               'WHERE is_active = true AND is_archived = false AND ' || p_sort_field || ' IS NOT NULL' ||
               filter_conditions || cursor_condition || ' ' ||
               order_clause || ' LIMIT ' || p_limit;

  RETURN QUERY EXECUTE query_sql;
END;
$$;

-- Function to get filtered car count
CREATE OR REPLACE FUNCTION cars_filtered_count(
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
    filter_conditions := filter_conditions || ' AND (make ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                             ' OR model ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                             ' OR color ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || ')';
  END IF;

  count_sql := 'SELECT COUNT(*) FROM public.cars WHERE is_active = true AND is_archived = false' || filter_conditions;
  
  EXECUTE count_sql INTO result_count;
  RETURN result_count;
END;
$$;