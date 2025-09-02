-- Fix cars_global_sorted function to handle arrays correctly
CREATE OR REPLACE FUNCTION public.cars_global_sorted(
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
  price numeric, 
  price_cents bigint, 
  rank_score real, 
  mileage text, 
  fuel text, 
  transmission text, 
  color text, 
  location text, 
  image_url text, 
  images jsonb, 
  title text, 
  created_at timestamp with time zone, 
  row_number bigint
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
  -- Build base query
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
      COALESCE(c.location_city, c.location_state, ''South Korea'')::TEXT as location,
      c.image_url,
      CASE 
        WHEN c.images IS NOT NULL AND jsonb_typeof(c.images) = ''array'' AND jsonb_array_length(c.images) > 0 
        THEN c.images 
        WHEN c.high_res_images IS NOT NULL AND jsonb_typeof(c.high_res_images) = ''array'' AND jsonb_array_length(c.high_res_images) > 0
        THEN c.high_res_images
        ELSE ''[]''::jsonb
      END as images,
      (c.make || '' '' || c.model || '' '' || c.year::TEXT) as title,
      c.created_at,
      ROW_NUMBER() OVER (ORDER BY ';

  -- Add filters with proper type casting
  IF p_filters IS NOT NULL AND p_filters != '{}'::JSONB THEN
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
    
    -- Price range filters (ensure numeric comparison)
    IF p_filters ? 'priceMin' AND (p_filters->>'priceMin') != '' THEN
      where_clause := where_clause || ' AND c.price_cents >= ' || ((p_filters->>'priceMin')::NUMERIC * 100);
    END IF;
    
    IF p_filters ? 'priceMax' AND (p_filters->>'priceMax') != '' THEN
      where_clause := where_clause || ' AND c.price_cents <= ' || ((p_filters->>'priceMax')::NUMERIC * 100);
    END IF;
    
    -- Search filter
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        LOWER(c.make) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.model) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.color) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ')
      )';
    END IF;
  END IF;
  
  -- Build ORDER BY clause for global sorting (CRITICAL: always numeric for price)
  CASE p_sort_field
    WHEN 'price_cents' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'c.price_cents ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'c.price_cents DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'year' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'c.year ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'c.year DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'make' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'c.make ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'c.make DESC NULLS LAST, c.id ASC';
      END IF;
    WHEN 'created_at' THEN
      IF p_sort_dir = 'ASC' THEN
        order_clause := 'c.created_at ASC NULLS LAST, c.id ASC';
      ELSE
        order_clause := 'c.created_at DESC NULLS LAST, c.id ASC';
      END IF;
    ELSE
      -- Default to price ascending (CRITICAL: ensure numeric sorting)
      order_clause := 'c.price_cents ASC NULLS LAST, c.id ASC';
  END CASE;
  
  -- Complete the query with WHERE, ORDER BY, and pagination
  final_query := base_query || order_clause || ') as row_number
    FROM cars_cache c
    WHERE c.price_cents > 0 AND c.price_cents IS NOT NULL' || where_clause || '
    ORDER BY ' || order_clause || '
    LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  
  -- Execute and return results
  RETURN QUERY EXECUTE final_query;
END;
$function$;