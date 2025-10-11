-- Setup cron job for hourly car sync (incremental updates)
-- This follows the API integration guide: fetch cars updated in last 60 minutes

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly incremental sync
-- This runs every hour and fetches cars updated in the last 60 minutes
SELECT cron.schedule(
  'hourly-car-sync',
  '0 * * * *', -- Run at minute 0 of every hour (e.g., 1:00, 2:00, 3:00...)
  $$
  SELECT
    net.http_post(
      url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=incremental&minutes=60',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule daily full sync at 2 AM (optional, for comprehensive updates)
SELECT cron.schedule(
  'daily-car-sync',
  '0 2 * * *', -- Run at 2:00 AM every day
  $$
  SELECT
    net.http_post(
      url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=daily',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create function to clean up old sold cars (called by daily sync)
CREATE OR REPLACE FUNCTION public.remove_old_sold_cars()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete cars that have been sold for more than 30 days
  DELETE FROM cars
  WHERE status = 'sold'
    AND is_archived = true
    AND sale_date < NOW() - INTERVAL '30 days';
  
  -- Also clean up from cars_cache
  DELETE FROM cars_cache
  WHERE (car_data->>'status' = 'sold' OR sale_status = 'sold')
    AND updated_at < NOW() - INTERVAL '30 days';
    
  RAISE NOTICE 'Cleaned up old sold cars';
END;
$$;

-- View existing cron jobs
-- Run this to see all scheduled jobs:
-- SELECT * FROM cron.job;