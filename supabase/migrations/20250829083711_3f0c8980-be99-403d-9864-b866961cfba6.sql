-- Create function for global sorting with offset-based pagination
-- This ensures that page 1 has the cheapest cars, page 2 has the next cheapest, etc.

CREATE OR REPLACE FUNCTION cars_global_sort_page(
  p_filters JSONB DEFAULT '{}'::JSONB,
  p_sort_field TEXT DEFAULT 'price_cents',
  p_sort_dir TEXT DEFAULT 'ASC',
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  price INTEGER,
  price_cents BIGINT,
  rank_score REAL,
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
      c.location,
      c.image_url,
      c.images,
      c.title,
      c.created_at
    FROM cars_cache c
    WHERE c.price_cents > 0
  ';
  
  -- Add filters if provided
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
    
    -- Price range filters (convert from euros to cents)
    IF p_filters ? 'priceMin' AND (p_filters->>'priceMin') != '' THEN
      where_clause := where_clause || ' AND c.price_cents >= ' || ((p_filters->>'priceMin')::INTEGER * 100);
    END IF;
    
    IF p_filters ? 'priceMax' AND (p_filters->>'priceMax') != '' THEN
      where_clause := where_clause || ' AND c.price_cents <= ' || ((p_filters->>'priceMax')::INTEGER * 100);
    END IF;
    
    -- Mileage range filters
    IF p_filters ? 'mileageMin' AND (p_filters->>'mileageMin') != '' THEN
      where_clause := where_clause || ' AND c.mileage >= ' || (p_filters->>'mileageMin')::INTEGER;
    END IF;
    
    IF p_filters ? 'mileageMax' AND (p_filters->>'mileageMax') != '' THEN
      where_clause := where_clause || ' AND c.mileage <= ' || (p_filters->>'mileageMax')::INTEGER;
    END IF;
    
    -- Fuel filter
    IF p_filters ? 'fuel' AND (p_filters->>'fuel') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.fuel) = LOWER(' || quote_literal(p_filters->>'fuel') || ')';
    END IF;
    
    -- Search filter (searches across make, model, title)
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        LOWER(c.make) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.model) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.title) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ')
      )';
    END IF;
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
      -- Default to price ascending
      order_clause := 'ORDER BY c.price_cents ASC NULLS LAST, c.id ASC';
  END CASE;
  
  -- Combine query with pagination
  final_query := base_query || where_clause || ' ' || order_clause || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  
  -- Log the query for debugging
  RAISE NOTICE 'Global sort query: %', final_query;
  
  -- Execute and return results
  RETURN QUERY EXECUTE final_query;
END;
$$;