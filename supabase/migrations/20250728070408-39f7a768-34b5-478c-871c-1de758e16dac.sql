-- Enable pg_cron extension for automated syncing
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job for automatic incremental sync every 5 minutes
SELECT cron.schedule(
  'encar-auto-sync',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=incremental&batch_size=500',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Clean up old sync metadata records (keep only last 100)
CREATE OR REPLACE FUNCTION clean_old_sync_metadata()
RETURNS void AS $$
BEGIN
  DELETE FROM sync_metadata 
  WHERE id NOT IN (
    SELECT id FROM sync_metadata 
    ORDER BY created_at DESC 
    LIMIT 100
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily at midnight
SELECT cron.schedule(
  'cleanup-sync-metadata',
  '0 0 * * *', -- Daily at midnight
  'SELECT clean_old_sync_metadata();'
);