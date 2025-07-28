-- Clear emergency data and trigger real API sync
DELETE FROM cars WHERE id LIKE 'emergency-%';

-- Clear auto-sync and recreate with proper real API sync
SELECT cron.unschedule('auto-sync-cars');

-- Create new auto-sync for real API data every minute
SELECT cron.schedule(
  'real-api-auto-sync',
  '* * * * *', -- Every minute
  $$
  select
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=incremental',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.VwWjCF3pl_ZDtD7BjV-h5__WXpMPWGlYjPAMUDH2TFw"}'::jsonb,
        body:='{"auto_sync": true}'::jsonb
    ) as request_id;
  $$
);