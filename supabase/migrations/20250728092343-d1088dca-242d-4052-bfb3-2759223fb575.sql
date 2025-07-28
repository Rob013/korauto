-- Clean up existing cron jobs (ignore errors if they don't exist)
DO $$
BEGIN
    PERFORM cron.unschedule('real-api-auto-sync');
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('real-api-auto-sync-slower');
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('encar-auto-sync');
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('car-sync-scheduler');
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

-- Add new fields to cars table for proper archiving and sync tracking
ALTER TABLE cars ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS sold_price NUMERIC DEFAULT NULL;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS archive_reason TEXT DEFAULT NULL;

-- Update sync_status table to track both endpoints
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS cars_processed INTEGER DEFAULT 0;
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS archived_lots_processed INTEGER DEFAULT 0;
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS last_cars_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS last_archived_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_archived ON cars(is_archived, archived_at);
CREATE INDEX IF NOT EXISTS idx_cars_external_id ON cars(external_id);

-- Set up proper hourly cron job as recommended in the API guide
SELECT cron.schedule(
  'hourly-api-sync',
  '0 * * * *', -- Every hour at minute 0
  $$
  select
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=hourly',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.VwWjCF3pl_ZDtD7BjV-h5__WXpMPWGlYjPAMUDH2TFw"}'::jsonb,
        body:='{"scheduled": true, "minutes": 60}'::jsonb
    ) as request_id;
  $$
);