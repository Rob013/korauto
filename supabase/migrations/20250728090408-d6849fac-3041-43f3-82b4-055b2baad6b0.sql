-- Clear all sample/emergency data and setup for real API data only
DELETE FROM cars WHERE id LIKE 'emergency-%' OR id LIKE 'sample-%';

-- Reset all sync statuses to allow fresh start
UPDATE sync_status SET status = 'failed', completed_at = now(), error_message = 'Cleared for real API sync only';

-- Enable pg_cron extension for auto-sync every minute
SELECT cron.schedule(
  'auto-sync-cars',
  '* * * * *', -- Every minute
  $$
  select
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=incremental&force_api=true',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.VwWjCF3pl_ZDtD7BjV-h5__WXpMPWGlYjPAMUDH2TFw"}'::jsonb,
        body:='{"auto": true}'::jsonb
    ) as request_id;
  $$
);