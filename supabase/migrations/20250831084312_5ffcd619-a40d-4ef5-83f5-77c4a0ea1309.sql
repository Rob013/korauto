-- Set up automatic sync schedule using pg_cron for 6-hour updates
-- Enable required extensions for cron jobs  
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule sync every 6 hours (at 0, 6, 12, 18 hours)
SELECT cron.schedule(
  'cars-sync-auto-update',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.yGNdDn5Xop5FkLNbyKbmVZn6fTbOobYfDM8gHMBW86Q"}'::jsonb,
        body:='{"auto_sync": true, "sync_type": "update"}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to check for sold cars and update status
CREATE OR REPLACE FUNCTION update_sold_car_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark cars as sold if they haven't been updated in recent sync
  UPDATE cars_cache 
  SET 
    car_data = jsonb_set(
      COALESCE(car_data, '{}'::jsonb), 
      '{status}', 
      '"sold"'::jsonb
    ),
    updated_at = NOW()
  WHERE 
    last_api_sync < NOW() - INTERVAL '7 days'
    AND (car_data->>'status' IS NULL OR car_data->>'status' != 'sold');
  
  -- Also update main cars table
  UPDATE cars 
  SET 
    status = 'sold',
    is_active = false,
    updated_at = NOW()
  WHERE 
    last_synced_at < NOW() - INTERVAL '7 days'
    AND status != 'sold';
END;
$$;