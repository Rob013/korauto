-- Update Car Sync to 6-Hour Schedule
-- Changes sync from daily/hourly to every 6 hours
-- Fetches new cars and deletes sold/archived cars every 6 hours

-- First, unschedule all existing sync-related cron jobs
SELECT cron.unschedule('daily-api-sync');
SELECT cron.unschedule('daily-cars-sync');
SELECT cron.unschedule('hourly-api-sync');
SELECT cron.unschedule('daily-sold-car-cleanup');
SELECT cron.unschedule('cleanup-sold-cars');
SELECT cron.unschedule('encar-auto-sync');
SELECT cron.unschedule('real-api-auto-sync');
SELECT cron.unschedule('real-api-auto-sync-slower');
SELECT cron.unschedule('car-sync-scheduler');

-- Create 6-hour car sync job (runs every 6 hours starting at 12:00 AM)
-- This will fetch new cars and handle sold/archived cars
SELECT cron.schedule(
  'six-hourly-car-sync',
  '0 */6 * * *', -- Every 6 hours (12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM)
  $$
  SELECT
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?type=6hour',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTEzNCwiZXhwIjoyMDY5MDE1MTM0fQ.VwWjCF3pl_ZDtD7BjV-h5__WXpMPWGlYjPAMUDH2TFw"}'::jsonb,
        body:='{"scheduled": true, "type": "6hour", "minutes": 360}'::jsonb
    ) as request_id;
  $$
);

-- Create 6-hour cleanup job (runs 30 minutes after sync to ensure cleanup happens after sync)
-- This ensures sold cars are removed after the sync completes
SELECT cron.schedule(
  'six-hourly-cleanup',
  '30 */6 * * *', -- Every 6 hours at 30 minutes past (12:30 AM, 6:30 AM, 12:30 PM, 6:30 PM)
  $$
  SELECT remove_old_sold_cars();
  $$
);

-- Update sync_status table to track 6-hour sync intervals
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS sync_interval_hours INTEGER DEFAULT 6;
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS last_6hour_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for performance on 6-hour sync tracking
CREATE INDEX IF NOT EXISTS idx_sync_status_6hour ON sync_status(last_6hour_sync_at, sync_interval_hours);

-- Log the schedule change
INSERT INTO sync_status (id, sync_type, status, created_at, sync_interval_hours, notes)
VALUES (
  'six-hourly-sync-config',
  '6hour',
  'configured',
  NOW(),
  6,
  'Updated sync schedule to run every 6 hours - fetches new cars and removes sold/archived cars'
) ON CONFLICT (id) DO UPDATE SET
  sync_type = EXCLUDED.sync_type,
  status = EXCLUDED.status,
  updated_at = NOW(),
  sync_interval_hours = EXCLUDED.sync_interval_hours,
  notes = EXCLUDED.notes;