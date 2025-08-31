-- Update sync status with accurate car count
UPDATE sync_status 
SET 
  records_processed = (SELECT COUNT(*) FROM cars_cache),
  last_activity_at = NOW()
WHERE id = 'cars-sync-main';

-- Create function to get real-time accurate sync progress
CREATE OR REPLACE FUNCTION get_real_time_sync_progress()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sync_info RECORD;
  actual_count INTEGER;
  new_cars_today INTEGER;
BEGIN
  -- Get actual count from cars_cache
  SELECT COUNT(*) INTO actual_count FROM cars_cache;
  
  -- Get new cars added today
  SELECT COUNT(*) INTO new_cars_today 
  FROM cars_cache 
  WHERE created_at::date = CURRENT_DATE;
  
  -- Get sync status
  SELECT * INTO sync_info
  FROM sync_status 
  WHERE id = 'cars-sync-main';
  
  RETURN jsonb_build_object(
    'total_cars', actual_count,
    'new_cars_today', new_cars_today,
    'sync_status', COALESCE(sync_info.status, 'unknown'),
    'current_page', COALESCE(sync_info.current_page, 0),
    'last_activity', COALESCE(sync_info.last_activity_at, NOW()),
    'records_processed_status', COALESCE(sync_info.records_processed, 0),
    'is_syncing', (sync_info.status = 'running')
  );
END;
$$;