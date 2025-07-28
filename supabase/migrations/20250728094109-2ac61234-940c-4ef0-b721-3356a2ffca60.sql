-- Trigger a fresh sync with the improved system
SELECT 
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=incremental&minutes=120',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.VwWjCF3pl_ZDtD7BjV-h5__WXpMPWGlYjPAMUDH2TFw"}'::jsonb,
        body:='{"improved_system": true}'::jsonb
    ) as fresh_sync_result;