-- Create RPC function to check cars search sorted functionality
CREATE OR REPLACE FUNCTION cars_search_sorted(req jsonb)
RETURNS jsonb
LANGUAGE plpgsql
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
  -- Extract parameters from request
  search_q := req->>'q';
  filters := req->'filters';
  sort_field := req->'sort'->>'field';
  sort_dir := req->'sort'->>'dir';
  page_num := COALESCE((req->>'page')::integer, 1);
  page_size := COALESCE((req->>'pageSize')::integer, 20);
  mode_val := COALESCE(req->>'mode', 'full');
  offset_val := (page_num - 1) * page_size;
  
  -- Default sort
  IF sort_field IS NULL THEN
    sort_field := 'listed_at';
    sort_dir := 'desc';
  END IF;
  
  -- Build where conditions
  where_conditions := ARRAY['price > 0', 'price IS NOT NULL'];
  
  -- Add text search
  IF search_q IS NOT NULL AND search_q != '' THEN
    where_conditions := where_conditions || ARRAY[format('(make ILIKE %L OR model ILIKE %L)', '%' || search_q || '%', '%' || search_q || '%')];
  END IF;
  
  -- Add filters
  IF filters->'make' IS NOT NULL THEN
    where_conditions := where_conditions || ARRAY[format('make = ANY(%L)', (SELECT array_agg(value) FROM jsonb_array_elements_text(filters->'make')))];
  END IF;
  
  IF filters->'model' IS NOT NULL THEN
    where_conditions := where_conditions || ARRAY[format('model = ANY(%L)', (SELECT array_agg(value) FROM jsonb_array_elements_text(filters->'model')))];
  END IF;
  
  -- Build order clause
  CASE sort_field
    WHEN 'price_eur' THEN order_clause := format('price %s', UPPER(sort_dir));
    WHEN 'year' THEN order_clause := format('year %s', UPPER(sort_dir));
    WHEN 'mileage_km' THEN order_clause := format('mileage %s', UPPER(sort_dir));
    ELSE order_clause := format('created_at %s', UPPER(sort_dir));
  END CASE;
  
  -- Get total count
  query_text := format('SELECT COUNT(*) FROM cars_cache WHERE %s', array_to_string(where_conditions, ' AND '));
  EXECUTE query_text INTO total_count;
  
  -- Get hits if requested
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
  
  -- Get facets if requested
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
  
  -- Build final result
  result := jsonb_build_object(
    'hits', hits,
    'total', total_count,
    'facets', facets
  );
  
  RETURN result;
END;
$$;