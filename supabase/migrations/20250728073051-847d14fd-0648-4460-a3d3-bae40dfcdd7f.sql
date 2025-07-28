-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add indexes for better performance on cars table
CREATE INDEX IF NOT EXISTS idx_cars_source_api ON cars(source_api);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at);

-- Add indexes for sync_metadata table
CREATE INDEX IF NOT EXISTS idx_sync_metadata_status ON sync_metadata(status);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_created_at ON sync_metadata(created_at);

-- Set up cron job for incremental sync every 5 minutes
-- This will keep the car listings updated continuously
SELECT cron.schedule(
  'encar-incremental-sync',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=incremental&batch_size=500',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
        body:='{"type": "incremental", "batch_size": 500}'::jsonb
    ) as request_id;
  $$
);

-- Trigger immediate full sync to import all 130,000+ cars with optimized batch size
SELECT 
  net.http_post(
    url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=full&batch_size=2000',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
    body:='{"type": "full", "batch_size": 2000}'::jsonb
  ) as initial_sync_request_id;