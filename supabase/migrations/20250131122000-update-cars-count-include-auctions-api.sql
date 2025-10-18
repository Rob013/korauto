-- Update cars_filtered_count function to include Auctions API cars
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

  -- Count from both active_cars view and cars table with auctions_api source
  count_sql := 'SELECT (SELECT COUNT(*) FROM public.active_cars WHERE true' || filter_conditions || ') + ' ||
               '(SELECT COUNT(*) FROM public.cars WHERE source_api = ''auctions_api'' AND is_archived = false AND is_active = true' || 
               CASE WHEN filter_conditions != '' THEN ' AND ' || REPLACE(filter_conditions, 'make =', 'make =') || 
                    REPLACE(REPLACE(filter_conditions, 'model =', 'model ='), 'year >=', 'year >=') ||
                    REPLACE(REPLACE(filter_conditions, 'year <=', 'year <='), 'price_cents >=', 'price >=') ||
                    REPLACE(REPLACE(filter_conditions, 'price_cents <=', 'price <='), 'fuel =', 'fuel =') ||
                    REPLACE(filter_conditions, 'make ILIKE', 'make ILIKE') || 
                    REPLACE(REPLACE(filter_conditions, 'model ILIKE', 'model ILIKE'), 'color ILIKE', 'color ILIKE')
               ELSE '' END || ')';
  
  EXECUTE count_sql INTO result_count;
  RETURN result_count;
END;
$$;

-- Update cars_keyset_page function to include Auctions API cars
CREATE OR REPLACE FUNCTION cars_keyset_page(
  p_filters JSONB DEFAULT '{}',
  p_sort_field TEXT DEFAULT 'created_at',
  p_sort_dir TEXT DEFAULT 'DESC',
  p_cursor_value TEXT DEFAULT NULL,
  p_cursor_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
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
  created_at TIMESTAMPTZ,
  source_api TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_sql TEXT;
  filter_conditions TEXT := '';
  cursor_condition TEXT := '';
  order_clause TEXT := '';
  union_query TEXT;
BEGIN
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
      cursor_condition := ' AND (' || p_sort_field || ', id) > (' || 
                         CASE 
                           WHEN p_sort_field = 'price_cents' THEN p_cursor_value::BIGINT::TEXT
                           ELSE p_cursor_value::NUMERIC::TEXT
                         END || ', ' || quote_literal(p_cursor_id) || ')';
    ELSE
      cursor_condition := ' AND (' || p_sort_field || ', id) < (' || 
                         CASE 
                           WHEN p_sort_field = 'price_cents' THEN p_cursor_value::BIGINT::TEXT
                           ELSE p_cursor_value::NUMERIC::TEXT
                         END || ', ' || quote_literal(p_cursor_id) || ')';
    END IF;
  END IF;

  -- Build order clause
  order_clause := 'ORDER BY ' || p_sort_field || ' ' || p_sort_dir || ' NULLS LAST, id ASC';

  -- Create union query to combine active_cars and auctions_api cars
  union_query := 'SELECT id, make, model, year, price, price_cents, rank_score, ' ||
                 'mileage, fuel, transmission, color, location, ' ||
                 'image_url, images, title, created_at, ''auctionapis'' as source_api ' ||
                 'FROM public.active_cars ' ||
                 'WHERE ' || p_sort_field || ' IS NOT NULL' ||
                 filter_conditions || cursor_condition || ' ' ||
                 'UNION ALL ' ||
                 'SELECT id, make, model, year, price, 0 as price_cents, 0 as rank_score, ' ||
                 'mileage, fuel, transmission, color, location, ' ||
                 'image_url, images, title, last_synced_at as created_at, ''auctions_api'' as source_api ' ||
                 'FROM public.cars ' ||
                 'WHERE source_api = ''auctions_api'' AND is_archived = false AND is_active = true ' ||
                 'AND ' || p_sort_field || ' IS NOT NULL' ||
                 CASE WHEN filter_conditions != '' THEN 
                   ' AND ' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                     filter_conditions, 
                     'price_cents >=', 'price >='), 
                     'price_cents <=', 'price <='), 
                     'make =', 'make ='), 
                     'model =', 'model ='), 
                     'year >=', 'year >='), 
                     'year <=', 'year <='), 
                     'fuel =', 'fuel =')
                 ELSE '' END || ' ' ||
                 order_clause || ' LIMIT ' || p_limit;

  RETURN QUERY EXECUTE union_query;
END;
$$;
