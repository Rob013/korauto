-- Clean up the specific stuck sync and trigger a fresh test
UPDATE sync_status 
SET 
  status = 'failed',
  error_message = 'Manually cleaned up stuck sync - testing new API integration',
  completed_at = NOW()
WHERE id = '3f3b584a-3f04-44a8-b5d8-469bbb5d2cac' AND status = 'running';

-- Trigger a fresh sync to test the new API configuration
SELECT 
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=incremental&minutes=60',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.VwWjCF3pl_ZDtD7BjV-h5__WXpMPWGlYjPAMUDH2TFw"}'::jsonb,
        body:='{"clean_test": true}'::jsonb
    ) as fresh_test_result;