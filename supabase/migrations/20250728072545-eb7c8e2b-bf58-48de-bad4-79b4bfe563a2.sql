-- Clear all existing sync metadata and cars to start fresh
DELETE FROM sync_metadata;
DELETE FROM cars;

-- Reset any indexes or sequences if needed
REINDEX TABLE cars;
REINDEX TABLE sync_metadata;

-- Trigger immediate full sync with improved edge function
SELECT 
  net.http_post(
    url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=full&batch_size=200',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
    body:='{"type": "full", "batch_size": 200}'::jsonb
  ) as sync_request_id;