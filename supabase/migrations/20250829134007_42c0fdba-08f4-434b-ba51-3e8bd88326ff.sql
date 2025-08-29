-- Add indexes to cars_cache table for better performance with large datasets
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents ON cars_cache(price_cents) WHERE price_cents IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_model ON cars_cache(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year ON cars_cache(year);
CREATE INDEX IF NOT EXISTS idx_cars_cache_created_at ON cars_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_cars_cache_api_id ON cars_cache(api_id);

-- Add composite index for common filtering scenarios
CREATE INDEX IF NOT EXISTS idx_cars_cache_filters ON cars_cache(make, year, price_cents) WHERE price_cents IS NOT NULL;

-- Optimize the cars_global_sort_page function for better performance
CREATE OR REPLACE FUNCTION public.cars_global_sort_page(
  p_filters jsonb DEFAULT '{}'::jsonb, 
  p_sort_field text DEFAULT 'price_cents'::text, 
  p_sort_dir text DEFAULT 'ASC'::text, 
  p_offset integer DEFAULT 0, 
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id text, 
  make text, 
  model text, 
  year integer, 
  price integer, 
  price_cents bigint, 
  rank_score real, 
  mileage integer, 
  fuel text, 
  transmission text, 
  color text, 
  location text, 
  image_url text, 
  images jsonb, 
  title text, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_query TEXT;
  where_clause TEXT := '';
  order_clause TEXT;
  final_query TEXT;
BEGIN
  -- Build base query with better performance
  base_query := '
    SELECT 
      c.id::TEXT,
      c.make,
      c.model,
      c.year,
      c.price::integer,
      c.price_cents,
      c.rank_score,
      COALESCE(c.mileage::integer, 0) as mileage,
      c.fuel,
      c.transmission,
      c.color,
      ''South Korea''::TEXT as location,
      NULL::TEXT as image_url,
      c.images,
      (c.make || '' '' || c.model || '' '' || c.year::TEXT) as title,
      c.created_at
    FROM cars_cache c
    WHERE c.price_cents > 0 AND c.price_cents IS NOT NULL
  ';
  
  -- Add filters with optimized conditions
  IF p_filters IS NOT NULL AND p_filters != '{}'::JSONB THEN
    -- Make filter
    IF p_filters ? 'make' AND (p_filters->>'make') != '' THEN
      where_clause := where_clause || ' AND c.make = ' || quote_literal(p_filters->>'make');
    END IF;
    
    -- Model filter
    IF p_filters ? 'model' AND (p_filters->>'model') != '' THEN
      where_clause := where_clause || ' AND c.model = ' || quote_literal(p_filters->>'model');
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
      where_clause := where_clause || ' AND c.fuel = ' || quote_literal(p_filters->>'fuel');
    END IF;
    
    -- Search filter (optimized with ILIKE for better performance)
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        c.make ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || ' OR
        c.model ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || '
      )';
    END IF;
  END IF;
  
  -- Build ORDER BY clause with optimized sorting
  CASE p_sort_field
    WHEN 'price_cents' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'ORDER BY c.price_cents ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'ORDER BY c.price_cents DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'year' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'ORDER BY c.year ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'ORDER BY c.year DESC NULLS LAST, c.id ASC';
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
      -- Default to price ascending
      order_clause := 'ORDER BY c.price_cents ASC NULLS LAST, c.id ASC';
  END CASE;
  
  -- Combine query with pagination
  final_query := base_query || where_clause || ' ' || order_clause || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  
  -- Execute and return results
  RETURN QUERY EXECUTE final_query;
END;
$function$;

-- Optimize the cars_filtered_count function for better performance
CREATE OR REPLACE FUNCTION public.cars_filtered_count(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  where_clause TEXT := '';
  count_query TEXT;
  result_count INTEGER;
BEGIN
  -- Build optimized count query
  count_query := 'SELECT COUNT(*) FROM cars_cache c WHERE c.price_cents > 0 AND c.price_cents IS NOT NULL';
  
  -- Add filters if provided (same logic as above but optimized for counting)
  IF p_filters IS NOT NULL AND p_filters != '{}' THEN
    -- Make filter
    IF p_filters ? 'make' AND (p_filters->>'make') != '' THEN
      where_clause := where_clause || ' AND c.make = ' || quote_literal(p_filters->>'make');
    END IF;
    
    -- Model filter
    IF p_filters ? 'model' AND (p_filters->>'model') != '' THEN
      where_clause := where_clause || ' AND c.model = ' || quote_literal(p_filters->>'model');
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
      where_clause := where_clause || ' AND c.fuel = ' || quote_literal(p_filters->>'fuel');
    END IF;
    
    -- Search filter
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        c.make ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || ' OR
        c.model ILIKE ' || quote_literal('%' || (p_filters->>'search') || '%') || '
      )';
    END IF;
  END IF;
  
  -- Execute count query
  count_query := count_query || where_clause;
  EXECUTE count_query INTO result_count;
  
  RETURN COALESCE(result_count, 0);
END;
$function$;