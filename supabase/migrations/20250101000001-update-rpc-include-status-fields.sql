-- Update keyset pagination functions to include status and sale_status fields
-- This enables the status badge functionality in the frontend

-- Update cars_keyset_page function to return status fields
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
  status TEXT,
  sale_status TEXT,
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
    filter_conditions := filter_conditions || ' AND price_cents >= ' || (p_filters->>'priceMin')::BIGINT * 100;
  END IF;
  
  IF p_filters ? 'priceMax' THEN
    filter_conditions := filter_conditions || ' AND price_cents <= ' || (p_filters->>'priceMax')::BIGINT * 100;
  END IF;
  
  IF p_filters ? 'fuel' THEN
    filter_conditions := filter_conditions || ' AND fuel = ' || quote_literal(p_filters->>'fuel');
  END IF;
  
  IF p_filters ? 'search' THEN
    filter_conditions := filter_conditions || ' AND (make ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                                ' OR model ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') ||
                                                ' OR title ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || ')';
  END IF;

  -- Build order clause (extended to support new fields)
  order_clause := p_sort_field || ' ' || p_sort_dir || ', id ' || p_sort_dir;

  -- Build cursor condition for pagination
  IF p_cursor_value IS NOT NULL AND p_cursor_id IS NOT NULL THEN
    IF p_sort_dir = 'ASC' THEN
      CASE p_sort_field
        WHEN 'price_cents' THEN
          cursor_condition := ' AND (price_cents > ' || quote_literal(p_cursor_value) || 
                             ' OR (price_cents = ' || quote_literal(p_cursor_value) || ' AND id > ' || quote_literal(p_cursor_id) || '))';
        WHEN 'rank_score' THEN
          cursor_condition := ' AND (rank_score > ' || quote_literal(p_cursor_value) || 
                             ' OR (rank_score = ' || quote_literal(p_cursor_value) || ' AND id > ' || quote_literal(p_cursor_id) || '))';
        WHEN 'year' THEN
          cursor_condition := ' AND (year > ' || quote_literal(p_cursor_value) || 
                             ' OR (year = ' || quote_literal(p_cursor_value) || ' AND id > ' || quote_literal(p_cursor_id) || '))';
        WHEN 'mileage' THEN
          cursor_condition := ' AND (mileage > ' || quote_literal(p_cursor_value) || 
                             ' OR (mileage = ' || quote_literal(p_cursor_value) || ' AND id > ' || quote_literal(p_cursor_id) || '))';
        WHEN 'make' THEN
          cursor_condition := ' AND (make > ' || quote_literal(p_cursor_value) || 
                             ' OR (make = ' || quote_literal(p_cursor_value) || ' AND id > ' || quote_literal(p_cursor_id) || '))';
        WHEN 'created_at' THEN
          cursor_condition := ' AND (created_at > ' || quote_literal(p_cursor_value) || 
                             ' OR (created_at = ' || quote_literal(p_cursor_value) || ' AND id > ' || quote_literal(p_cursor_id) || '))';
      END CASE;
    ELSE -- DESC
      CASE p_sort_field
        WHEN 'price_cents' THEN
          cursor_condition := ' AND (price_cents < ' || quote_literal(p_cursor_value) || 
                             ' OR (price_cents = ' || quote_literal(p_cursor_value) || ' AND id < ' || quote_literal(p_cursor_id) || '))';
        WHEN 'rank_score' THEN
          cursor_condition := ' AND (rank_score < ' || quote_literal(p_cursor_value) || 
                             ' OR (rank_score = ' || quote_literal(p_cursor_value) || ' AND id < ' || quote_literal(p_cursor_id) || '))';
        WHEN 'year' THEN
          cursor_condition := ' AND (year < ' || quote_literal(p_cursor_value) || 
                             ' OR (year = ' || quote_literal(p_cursor_value) || ' AND id < ' || quote_literal(p_cursor_id) || '))';
        WHEN 'mileage' THEN
          cursor_condition := ' AND (mileage < ' || quote_literal(p_cursor_value) || 
                             ' OR (mileage = ' || quote_literal(p_cursor_value) || ' AND id < ' || quote_literal(p_cursor_id) || '))';
        WHEN 'make' THEN
          cursor_condition := ' AND (make < ' || quote_literal(p_cursor_value) || 
                             ' OR (make = ' || quote_literal(p_cursor_value) || ' AND id < ' || quote_literal(p_cursor_id) || '))';
        WHEN 'created_at' THEN
          cursor_condition := ' AND (created_at < ' || quote_literal(p_cursor_value) || 
                             ' OR (created_at = ' || quote_literal(p_cursor_value) || ' AND id < ' || quote_literal(p_cursor_id) || '))';
      END CASE;
    END IF;
  END IF;

  -- Build and execute query
  query_sql := 'SELECT id, make, model, year, price, price_cents, rank_score, mileage, fuel, transmission, color, location, image_url, images, title, status, sale_status, created_at
                FROM active_cars 
                WHERE 1=1' || filter_conditions || cursor_condition || 
                ' ORDER BY ' || order_clause || 
                ' LIMIT ' || p_limit;

  RETURN QUERY EXECUTE query_sql;
END;
$$;