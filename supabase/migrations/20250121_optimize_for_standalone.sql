-- Migration to ensure all necessary data is ready for full Supabase-only operation

-- Add indexing for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_model ON cars_cache(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year ON cars_cache(year);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price ON cars_cache(price);
CREATE INDEX IF NOT EXISTS idx_cars_cache_sale_status ON cars_cache(sale_status);
CREATE INDEX IF NOT EXISTS idx_cars_cache_rank_score ON cars_cache(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_created_at ON cars_cache(created_at DESC);

-- Create a materialized view for faster manufacturer/model lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS cars_manufacturer_model_stats AS
SELECT 
  make as manufacturer_name,
  model as model_name,
  COUNT(*) as car_count,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price) as avg_price,
  MIN(year) as min_year,
  MAX(year) as max_year
FROM cars_cache
WHERE sale_status NOT IN ('sold', 'archived')
  AND price IS NOT NULL
  AND price > 0
GROUP BY make, model;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_cars_stats_make_model 
  ON cars_manufacturer_model_stats(manufacturer_name, model_name);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_car_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cars_manufacturer_model_stats;
  RAISE NOTICE 'Car statistics refreshed at %', now();
END;
$$;

-- Schedule the refresh every hour
SELECT cron.schedule(
  'refresh-car-stats-hourly',
  '0 * * * *', -- Every hour
  $$SELECT refresh_car_stats()$$
);

-- Add a comment
COMMENT ON MATERIALIZED VIEW cars_manufacturer_model_stats IS 
'Materialized view providing quick statistics for manufacturers and models. Refreshed hourly.';

-- Grant permissions
GRANT SELECT ON cars_manufacturer_model_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION refresh_car_stats() TO service_role;
