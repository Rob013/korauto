-- Force complete the stuck sync and trigger a new working sync
UPDATE sync_status SET 
  status = 'completed', 
  completed_at = now(),
  records_processed = 3,
  total_records = 3,
  error_message = 'Manually completed to test new function'
WHERE status = 'running';

-- Trigger another test sync
SELECT 
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=incremental',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.VwWjCF3pl_ZDtD7BjV-h5__WXpMPWGlYjPAMUDH2TFw"}'::jsonb,
        body:='{"force_new_sync": true}'::jsonb
    ) as force_new_sync;