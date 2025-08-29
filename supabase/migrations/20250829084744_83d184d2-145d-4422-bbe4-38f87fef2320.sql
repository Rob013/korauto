-- Fix search_path for the functions I just created
DROP FUNCTION IF EXISTS public.cars_filtered_count(JSONB);
DROP FUNCTION IF EXISTS public.cars_keyset_page(JSONB, TEXT, TEXT, TEXT, TEXT, INTEGER);

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION public.cars_filtered_count(p_filters JSONB DEFAULT '{}')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  where_clause TEXT := '';
  count_query TEXT;
  result_count INTEGER;
BEGIN
  -- Build base query
  count_query := 'SELECT COUNT(*) FROM cars_cache c WHERE 1=1';
  
  -- Add filters if provided
  IF p_filters IS NOT NULL AND p_filters != '{}' THEN
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
    
    -- Price range filters (convert from euros to cents)
    IF p_filters ? 'priceMin' AND (p_filters->>'priceMin') != '' THEN
      where_clause := where_clause || ' AND c.price_cents >= ' || ((p_filters->>'priceMin')::INTEGER * 100);
    END IF;
    
    IF p_filters ? 'priceMax' AND (p_filters->>'priceMax') != '' THEN
      where_clause := where_clause || ' AND c.price_cents <= ' || ((p_filters->>'priceMax')::INTEGER * 100);
    END IF;
    
    -- Fuel filter
    IF p_filters ? 'fuel' AND (p_filters->>'fuel') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.fuel) = LOWER(' || quote_literal(p_filters->>'fuel') || ')';
    END IF;
    
    -- Search filter
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        LOWER(c.make) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.model) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ')
      )';
    END IF;
  END IF;
  
  -- Execute count query
  count_query := count_query || where_clause;
  EXECUTE count_query INTO result_count;
  
  RETURN COALESCE(result_count, 0);
END;
$function$;

-- Create keyset pagination function for global sorting
CREATE OR REPLACE FUNCTION public.cars_keyset_page(
  p_filters JSONB DEFAULT '{}',
  p_sort_field TEXT DEFAULT 'price_cents',
  p_sort_dir TEXT DEFAULT 'ASC',
  p_cursor_value TEXT DEFAULT NULL,
  p_cursor_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 24
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
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_query TEXT;
  where_clause TEXT := '';
  cursor_clause TEXT := '';
  order_clause TEXT;
  final_query TEXT;
BEGIN
  -- Build base query with all required fields
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
      ''South Korea''::TEXT as location,
      NULL::TEXT as image_url,
      c.images,
      (c.make || '' '' || c.model || '' '' || c.year::TEXT) as title,
      c.created_at
    FROM cars_cache c
    WHERE 1=1
  ';
  
  -- Add filters if provided
  IF p_filters IS NOT NULL AND p_filters != '{}' THEN
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
    
    -- Price range filters
    IF p_filters ? 'priceMin' AND (p_filters->>'priceMin') != '' THEN
      where_clause := where_clause || ' AND c.price_cents >= ' || ((p_filters->>'priceMin')::INTEGER * 100);
    END IF;
    
    IF p_filters ? 'priceMax' AND (p_filters->>'priceMax') != '' THEN
      where_clause := where_clause || ' AND c.price_cents <= ' || ((p_filters->>'priceMax')::INTEGER * 100);
    END IF;
    
    -- Fuel filter
    IF p_filters ? 'fuel' AND (p_filters->>'fuel') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.fuel) = LOWER(' || quote_literal(p_filters->>'fuel') || ')';
    END IF;
    
    -- Search filter
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        LOWER(c.make) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.model) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ')
      )';
    END IF;
  END IF;
  
  -- Add cursor conditions for keyset pagination
  IF p_cursor_value IS NOT NULL AND p_cursor_id IS NOT NULL THEN
    CASE p_sort_field
      WHEN 'price_cents' THEN
        IF p_sort_dir = 'ASC' THEN
          cursor_clause := ' AND (c.price_cents > ' || p_cursor_value::BIGINT || ' OR (c.price_cents = ' || p_cursor_value::BIGINT || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        ELSE
          cursor_clause := ' AND (c.price_cents < ' || p_cursor_value::BIGINT || ' OR (c.price_cents = ' || p_cursor_value::BIGINT || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        END IF;
      WHEN 'rank_score' THEN
        IF p_sort_dir = 'ASC' THEN
          cursor_clause := ' AND (c.rank_score > ' || p_cursor_value::REAL || ' OR (c.rank_score = ' || p_cursor_value::REAL || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        ELSE
          cursor_clause := ' AND (c.rank_score < ' || p_cursor_value::REAL || ' OR (c.rank_score = ' || p_cursor_value::REAL || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        END IF;
      WHEN 'year' THEN
        IF p_sort_dir = 'ASC' THEN
          cursor_clause := ' AND (c.year > ' || p_cursor_value::INTEGER || ' OR (c.year = ' || p_cursor_value::INTEGER || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        ELSE
          cursor_clause := ' AND (c.year < ' || p_cursor_value::INTEGER || ' OR (c.year = ' || p_cursor_value::INTEGER || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        END IF;
      WHEN 'make' THEN
        IF p_sort_dir = 'ASC' THEN
          cursor_clause := ' AND (c.make > ' || quote_literal(p_cursor_value) || ' OR (c.make = ' || quote_literal(p_cursor_value) || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        ELSE
          cursor_clause := ' AND (c.make < ' || quote_literal(p_cursor_value) || ' OR (c.make = ' || quote_literal(p_cursor_value) || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        END IF;
      WHEN 'created_at' THEN
        IF p_sort_dir = 'ASC' THEN
          cursor_clause := ' AND (c.created_at > ' || quote_literal(p_cursor_value) || '::TIMESTAMP OR (c.created_at = ' || quote_literal(p_cursor_value) || '::TIMESTAMP AND c.id > ' || quote_literal(p_cursor_id) || '))';
        ELSE
          cursor_clause := ' AND (c.created_at < ' || quote_literal(p_cursor_value) || '::TIMESTAMP OR (c.created_at = ' || quote_literal(p_cursor_value) || '::TIMESTAMP AND c.id > ' || quote_literal(p_cursor_id) || '))';
        END IF;
      ELSE
        -- Default to price_cents
        IF p_sort_dir = 'ASC' THEN
          cursor_clause := ' AND (c.price_cents > ' || p_cursor_value::BIGINT || ' OR (c.price_cents = ' || p_cursor_value::BIGINT || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        ELSE
          cursor_clause := ' AND (c.price_cents < ' || p_cursor_value::BIGINT || ' OR (c.price_cents = ' || p_cursor_value::BIGINT || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        END IF;
    END CASE;
  END IF;
  
  -- Build ORDER BY clause for global sorting
  CASE p_sort_field
    WHEN 'price_cents' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'ORDER BY c.price_cents ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'ORDER BY c.price_cents DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'rank_score' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'ORDER BY c.rank_score ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'ORDER BY c.rank_score DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'year' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'ORDER BY c.year ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'ORDER BY c.year DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'mileage' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'ORDER BY c.mileage ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'ORDER BY c.mileage DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'make' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'ORDER BY c.make ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'ORDER BY c.make DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'created_at' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'ORDER BY c.created_at ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'ORDER BY c.created_at DESC NULLS LAST, c.id ASC';
      END IF;
    ELSE
      -- Default to price ascending for global sorting
      order_clause := 'ORDER BY c.price_cents ASC NULLS LAST, c.id ASC';
  END CASE;
  
  -- Combine all parts of the query
  final_query := base_query || where_clause || cursor_clause || ' ' || order_clause || ' LIMIT ' || p_limit;
  
  -- Execute and return results
  RETURN QUERY EXECUTE final_query;
END;
$function$;