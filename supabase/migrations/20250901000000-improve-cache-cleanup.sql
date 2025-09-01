-- Improve cache cleanup to be more intelligent about car removal
-- Only remove sold cars that are both old AND unlikely to be accessed

-- Drop the existing cleanup job
SELECT cron.unschedule('cleanup-sold-cars');

-- Create improved cleanup cron job to remove old sold cars (runs at 3 AM UTC daily)
-- This version is more conservative and only removes cars that are clearly no longer relevant
SELECT cron.schedule(
  'cleanup-sold-cars-improved',
  '0 3 * * *', -- 3 AM UTC daily
  $$
  DELETE FROM cars_cache 
  WHERE last_api_sync < now() - interval '14 days'  -- Extended from 7 to 14 days
  AND (
    -- Only remove if car is definitively sold and archival data exists
    (car_data::jsonb->'lots'->0->>'status' = 'sold' AND car_data::jsonb->'lots'->0->>'sale_date' IS NOT NULL) OR
    (car_data::jsonb->'lots'->0->>'sale_status' = 'sold' AND car_data::jsonb->'lots'->0->>'sale_date' IS NOT NULL) OR
    (lot_data::jsonb->>'status' = 'sold' AND lot_data::jsonb->>'sale_date' IS NOT NULL)
  );
  $$
);

-- Add index to improve cache lookup performance for the new query patterns
CREATE INDEX IF NOT EXISTS idx_cars_cache_lot_patterns ON cars_cache 
  USING gin ((lot_number::text) gin_trgm_ops);

-- Add index for fuzzy matching if the extension is available
-- This helps with the ilike searches in the improved useCarDetails hook
DO $$
BEGIN
  -- Try to create the trigram extension for better fuzzy matching
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION
  WHEN OTHERS THEN
    -- If extension can't be created, log it but continue
    RAISE NOTICE 'pg_trgm extension not available, skipping fuzzy search index';
END
$$;

-- Create additional index for ID-based lookups
CREATE INDEX IF NOT EXISTS idx_cars_cache_ids_combined ON cars_cache (id, api_id, lot_number);