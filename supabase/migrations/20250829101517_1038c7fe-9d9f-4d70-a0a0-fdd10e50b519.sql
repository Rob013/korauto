-- Fix stuck sync status and update with real car count
UPDATE sync_status 
SET 
  status = 'failed',
  records_processed = 4352,
  current_page = 44,  -- Based on 4352 cars / 100 cars per page
  error_message = 'Auto-fixed: Sync was stuck due to rate limiting. Updated with real car count.',
  completed_at = now(),
  last_activity_at = now()
WHERE id = 'cars-sync-main';