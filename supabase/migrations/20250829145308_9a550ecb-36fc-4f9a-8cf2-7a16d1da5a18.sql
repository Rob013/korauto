-- Reset the stuck sync status to allow fresh start
UPDATE sync_status 
SET 
  status = 'idle',
  error_message = 'Reset to fix stuck progress - ready for fresh sync',
  completed_at = now(),
  current_page = 1,
  records_processed = 0
WHERE id = 'd2864188-e17a-41db-af76-71d7c2bdefe3';