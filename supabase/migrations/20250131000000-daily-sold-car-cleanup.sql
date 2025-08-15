-- Daily Sold Car Cleanup Migration
-- Changes sync from hourly to daily and implements 24-hour sold car display

-- First, unschedule the existing hourly cron job
SELECT cron.unschedule('hourly-api-sync');

-- Set up daily cron job instead (runs at 2 AM every day)
SELECT cron.schedule(
  'daily-api-sync',
  '0 2 * * *', -- Every day at 2 AM
  $$
  select
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=daily',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.VwWjCF3pl_ZDtD7BjV-h5__WXpMPWGlYjPAMUDH2TFw"}'::jsonb,
        body:='{"scheduled": true, "type": "daily"}'::jsonb
    ) as request_id;
  $$
);

-- Add a function to mark cars for removal after 24 hours of being sold
-- This will be called by the daily sync job
CREATE OR REPLACE FUNCTION remove_old_sold_cars()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  removed_count INTEGER := 0;
BEGIN
  -- Update cars that have been archived/sold for more than 24 hours
  -- Mark them as removed from website
  UPDATE cars 
  SET 
    is_active = false,
    status = 'removed_after_sold',
    updated_at = NOW()
  WHERE 
    is_archived = true 
    AND archived_at IS NOT NULL 
    AND archive_reason = 'sold'
    AND archived_at < NOW() - INTERVAL '24 hours'
    AND is_active = true;
  
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'removed_cars_count', removed_count,
    'removed_at', NOW()
  );
END;
$$;

-- Create a view that excludes cars removed after being sold for 24+ hours
-- This will be used by frontend queries to hide sold cars after 24 hours
CREATE OR REPLACE VIEW active_cars AS
SELECT * FROM cars 
WHERE 
  -- Show cars that are either:
  -- 1. Not archived/sold at all, OR
  -- 2. Archived/sold less than 24 hours ago
  (
    (is_archived = false OR archived_at IS NULL)
    OR 
    (is_archived = true AND archived_at IS NOT NULL AND archived_at >= NOW() - INTERVAL '24 hours')
  )
  AND is_active = true;

-- Create an index to optimize the 24-hour query
CREATE INDEX IF NOT EXISTS idx_cars_archived_24h ON cars(is_archived, archived_at, is_active) 
WHERE archived_at IS NOT NULL;

-- Grant permissions on the view
GRANT SELECT ON active_cars TO authenticated;
GRANT SELECT ON active_cars TO anon;

-- Schedule the removal function to run daily at 3 AM (after the sync)
SELECT cron.schedule(
  'daily-sold-car-cleanup',
  '0 3 * * *', -- Every day at 3 AM (1 hour after sync)
  $$
  SELECT remove_old_sold_cars();
  $$
);