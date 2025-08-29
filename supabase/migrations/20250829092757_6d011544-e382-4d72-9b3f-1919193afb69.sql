-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create daily cars sync cron job (runs at 2 AM UTC every day)
SELECT cron.schedule(
  'daily-cars-sync',
  '0 2 * * *', -- 2 AM UTC daily
  $$
  SELECT
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
        body:='{"scheduled": true, "type": "daily_update"}'::jsonb
    ) as request_id;
  $$
);

-- Create cleanup cron job to remove old sold cars (runs at 3 AM UTC daily)
SELECT cron.schedule(
  'cleanup-sold-cars',
  '0 3 * * *', -- 3 AM UTC daily
  $$
  DELETE FROM cars_cache 
  WHERE last_api_sync < now() - interval '7 days'
  AND (
    car_data::jsonb->'lots'->0->>'status' = 'sold' OR
    car_data::jsonb->'lots'->0->>'sale_status' = 'sold' OR
    lot_data::jsonb->>'status' = 'sold'
  );
  $$
);

-- Update sync_status table structure if needed
ALTER TABLE sync_status 
ADD COLUMN IF NOT EXISTS batch_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_pages integer DEFAULT 5000,
ADD COLUMN IF NOT EXISTS is_scheduled boolean DEFAULT false;

-- Create index for better performance on sync status queries
CREATE INDEX IF NOT EXISTS idx_sync_status_type_status ON sync_status(sync_type, status);
CREATE INDEX IF NOT EXISTS idx_cars_cache_last_sync ON cars_cache(last_api_sync);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents ON cars_cache(price_cents) WHERE price_cents IS NOT NULL;