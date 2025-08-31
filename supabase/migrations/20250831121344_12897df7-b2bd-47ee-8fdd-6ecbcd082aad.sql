-- Fix sync_status constraint issues and ensure proper data integrity

-- First, update any existing records that have null sync_type
UPDATE sync_status 
SET sync_type = 'enhanced_full' 
WHERE sync_type IS NULL;

-- Add a default value for sync_type to prevent future null constraint violations
ALTER TABLE sync_status 
ALTER COLUMN sync_type SET DEFAULT 'enhanced_full';

-- Update the current sync status to show real database count instead of misleading 0
UPDATE sync_status 
SET 
  records_processed = (SELECT COUNT(*) FROM cars_cache),
  error_message = 'Corrected: Showing real database count instead of sync progress',
  last_activity_at = NOW()
WHERE id = 'cars-sync-main';

-- Create a function to get accurate sync progress that always shows real database counts
CREATE OR REPLACE FUNCTION get_accurate_sync_progress()
RETURNS TABLE(
  sync_status_records integer,
  cache_count bigint,
  main_count bigint,
  display_count bigint,
  sync_page integer,
  sync_status text,
  correction_applied boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.records_processed, 0)::integer as sync_status_records,
    COALESCE((SELECT COUNT(*) FROM cars_cache), 0) as cache_count,
    COALESCE((SELECT COUNT(*) FROM cars), 0) as main_count,
    GREATEST(
      COALESCE(s.records_processed, 0),
      COALESCE((SELECT COUNT(*) FROM cars_cache), 0)
    ) as display_count,
    COALESCE(s.current_page, 0)::integer as sync_page,
    COALESCE(s.status, 'unknown') as sync_status,
    (COALESCE((SELECT COUNT(*) FROM cars_cache), 0) > COALESCE(s.records_processed, 0)) as correction_applied
  FROM sync_status s 
  WHERE s.id = 'cars-sync-main';
END;
$$;