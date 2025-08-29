-- Resume sync from 13,000 cars for ultra-fast continuation
UPDATE sync_status 
SET 
  status = 'failed',
  records_processed = 13000,
  current_page = 130,  -- Based on 13000 cars / 100 cars per page
  error_message = 'Ready for ultra-fast resume from 13,000 cars',
  completed_at = now(),
  last_activity_at = now(),
  sync_type = 'smart_sync'
WHERE id = 'cars-sync-main';