-- Add search_path to remaining 3 database functions for security
-- These are complex query functions but should still have search_path set

-- 1. Update cars_global_sorted function
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
SET search_path = public
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
    IF p_filters ? 'make' AND (p_filters->>'make') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.make) = LOWER(' || quote_literal(p_filters->>'make') || ')';
    END IF;
    
    IF p_filters ? 'model' AND (p_filters->>'model') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.model) = LOWER(' || quote_literal(p_filters->>'model') || ')';
    END IF;
    
    IF p_filters ? 'yearMin' AND (p_filters->>'yearMin') != '' THEN
      where_clause := where_clause || ' AND c.year >= ' || (p_filters->>'yearMin')::INTEGER;
    END IF;
    
    IF p_filters ? 'yearMax' AND (p_filters->>'yearMax') != '' THEN
      where_clause := where_clause || ' AND c.year <= ' || (p_filters->>'yearMax')::INTEGER;
    END IF;
    
    IF p_filters ? 'priceMin' AND (p_filters->>'priceMin') != '' THEN
      where_clause := where_clause || ' AND c.price_cents >= ' || ((p_filters->>'priceMin')::NUMERIC * 100);
    END IF;
    
    IF p_filters ? 'priceMax' AND (p_filters->>'priceMax') != '' THEN
      where_clause := where_clause || ' AND c.price_cents <= ' || ((p_filters->>'priceMax')::NUMERIC * 100);
    END IF;
    
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        LOWER(c.make) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.model) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.color) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ')
      )';
    END IF;
  END IF;
  
  -- Build ORDER BY clause for global sorting
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
      order_clause := 'c.price_cents ASC NULLS LAST, c.id ASC';
  END CASE;
  
  final_query := base_query || order_clause || ') as row_number
    FROM cars_cache c
    WHERE c.price_cents > 0 AND c.price_cents IS NOT NULL' || where_clause || '
    ORDER BY ' || order_clause || '
    LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  
  RETURN QUERY EXECUTE final_query;
END;
$$;

-- 2. Update cars_keyset_page function
CREATE OR REPLACE FUNCTION public.cars_keyset_page(
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_sort_field text DEFAULT 'price_cents'::text,
  p_sort_dir text DEFAULT 'ASC'::text,
  p_cursor_value text DEFAULT NULL::text,
  p_cursor_id text DEFAULT NULL::text,
  p_limit integer DEFAULT 24
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
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_query TEXT;
  where_clause TEXT := '';
  cursor_clause TEXT := '';
  order_clause TEXT;
  final_query TEXT;
BEGIN
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
  
  IF p_filters IS NOT NULL AND p_filters != '{}' THEN
    IF p_filters ? 'make' AND (p_filters->>'make') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.make) = LOWER(' || quote_literal(p_filters->>'make') || ')';
    END IF;
    
    IF p_filters ? 'model' AND (p_filters->>'model') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.model) = LOWER(' || quote_literal(p_filters->>'model') || ')';
    END IF;
    
    IF p_filters ? 'yearMin' AND (p_filters->>'yearMin') != '' THEN
      where_clause := where_clause || ' AND c.year >= ' || (p_filters->>'yearMin')::INTEGER;
    END IF;
    
    IF p_filters ? 'yearMax' AND (p_filters->>'yearMax') != '' THEN
      where_clause := where_clause || ' AND c.year <= ' || (p_filters->>'yearMax')::INTEGER;
    END IF;
    
    IF p_filters ? 'priceMin' AND (p_filters->>'priceMin') != '' THEN
      where_clause := where_clause || ' AND c.price_cents >= ' || ((p_filters->>'priceMin')::INTEGER * 100);
    END IF;
    
    IF p_filters ? 'priceMax' AND (p_filters->>'priceMax') != '' THEN
      where_clause := where_clause || ' AND c.price_cents <= ' || ((p_filters->>'priceMax')::INTEGER * 100);
    END IF;
    
    IF p_filters ? 'fuel' AND (p_filters->>'fuel') != '' THEN
      where_clause := where_clause || ' AND LOWER(c.fuel) = LOWER(' || quote_literal(p_filters->>'fuel') || ')';
    END IF;
    
    IF p_filters ? 'search' AND (p_filters->>'search') != '' THEN
      where_clause := where_clause || ' AND (
        LOWER(c.make) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ') OR
        LOWER(c.model) LIKE LOWER(' || quote_literal('%' || (p_filters->>'search') || '%') || ')
      )';
    END IF;
  END IF;
  
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
        IF p_sort_dir = 'ASC' THEN
          cursor_clause := ' AND (c.price_cents > ' || p_cursor_value::BIGINT || ' OR (c.price_cents = ' || p_cursor_value::BIGINT || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        ELSE
          cursor_clause := ' AND (c.price_cents < ' || p_cursor_value::BIGINT || ' OR (c.price_cents = ' || p_cursor_value::BIGINT || ' AND c.id > ' || quote_literal(p_cursor_id) || '))';
        END IF;
    END CASE;
  END IF;
  
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
      order_clause := 'ORDER BY c.price_cents ASC NULLS LAST, c.id ASC';
  END CASE;
  
  final_query := base_query || where_clause || cursor_clause || ' ' || order_clause || ' LIMIT ' || p_limit;
  
  RETURN QUERY EXECUTE final_query;
END;
$$;

-- 3. Update cars_search_sorted function
CREATE OR REPLACE FUNCTION public.cars_search_sorted(req jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result jsonb;
  hits jsonb[];
  facets jsonb;
  total_count integer;
  search_q text;
  filters jsonb;
  sort_field text;
  sort_dir text;
  page_num integer;
  page_size integer;
  mode_val text;
  offset_val integer;
  query_text text;
  where_conditions text[];
  order_clause text;
BEGIN
  search_q := req->>'q';
  filters := req->'filters';
  sort_field := req->'sort'->>'field';
  sort_dir := req->'sort'->>'dir';
  page_num := COALESCE((req->>'page')::integer, 1);
  page_size := COALESCE((req->>'pageSize')::integer, 20);
  mode_val := COALESCE(req->>'mode', 'full');
  offset_val := (page_num - 1) * page_size;
  
  IF sort_field IS NULL THEN
    sort_field := 'listed_at';
    sort_dir := 'desc';
  END IF;
  
  where_conditions := ARRAY['price > 0', 'price IS NOT NULL'];
  
  IF search_q IS NOT NULL AND search_q != '' THEN
    where_conditions := where_conditions || ARRAY[format('(make ILIKE %L OR model ILIKE %L)', '%' || search_q || '%', '%' || search_q || '%')];
  END IF;
  
  IF filters->'make' IS NOT NULL THEN
    where_conditions := where_conditions || ARRAY[format('make = ANY(%L)', (SELECT array_agg(value) FROM jsonb_array_elements_text(filters->'make')))];
  END IF;
  
  IF filters->'model' IS NOT NULL THEN
    where_conditions := where_conditions || ARRAY[format('model = ANY(%L)', (SELECT array_agg(value) FROM jsonb_array_elements_text(filters->'model')))];
  END IF;
  
  CASE sort_field
    WHEN 'price_eur' THEN order_clause := format('price %s', UPPER(sort_dir));
    WHEN 'year' THEN order_clause := format('year %s', UPPER(sort_dir));
    WHEN 'mileage_km' THEN order_clause := format('mileage %s', UPPER(sort_dir));
    ELSE order_clause := format('created_at %s', UPPER(sort_dir));
  END CASE;
  
  query_text := format('SELECT COUNT(*) FROM cars_cache WHERE %s', array_to_string(where_conditions, ' AND '));
  EXECUTE query_text INTO total_count;
  
  IF mode_val IN ('full', 'results') THEN
    query_text := format('
      SELECT jsonb_agg(
        jsonb_build_object(
          ''id'', id,
          ''make'', make,
          ''model'', model,
          ''year'', year,
          ''price_eur'', price,
          ''mileage_km'', mileage,
          ''thumbnail'', CASE 
            WHEN images IS NOT NULL AND jsonb_array_length(images) > 0 
            THEN images->0 
            ELSE ''"https://via.placeholder.com/400x300?text=No+Image"''::jsonb 
          END,
          ''listed_at'', created_at
        )
      )
      FROM cars_cache 
      WHERE %s
      ORDER BY %s
      LIMIT %s OFFSET %s',
      array_to_string(where_conditions, ' AND '),
      order_clause,
      page_size,
      offset_val
    );
    
    EXECUTE query_text INTO hits;
    hits := COALESCE(hits, '[]'::jsonb);
  ELSE
    hits := '[]'::jsonb;
  END IF;
  
  IF mode_val IN ('full', 'facets') THEN
    WITH make_counts AS (
      SELECT make, COUNT(*) as count
      FROM cars_cache 
      WHERE array_to_string(where_conditions, ' AND ') = array_to_string(where_conditions, ' AND ')
      GROUP BY make
      ORDER BY count DESC
    ),
    model_counts AS (
      SELECT model, COUNT(*) as count
      FROM cars_cache 
      WHERE array_to_string(where_conditions, ' AND ') = array_to_string(where_conditions, ' AND ')
      GROUP BY model
      ORDER BY count DESC
    )
    SELECT jsonb_build_object(
      'make', jsonb_object_agg(make, count),
      'model', jsonb_object_agg(model, count)
    ) INTO facets
    FROM (
      SELECT make, count FROM make_counts
      UNION ALL
      SELECT model as make, count FROM model_counts
    ) t;
    
    facets := COALESCE(facets, '{}'::jsonb);
  ELSE
    facets := '{}'::jsonb;
  END IF;
  
  result := jsonb_build_object(
    'hits', hits,
    'total', total_count,
    'facets', facets
  );
  
  RETURN result;
END;
$$;