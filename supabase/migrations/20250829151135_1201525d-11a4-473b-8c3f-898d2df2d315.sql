-- Fix sync status ID and reset to proper resume state
UPDATE sync_status 
SET 
  id = 'd2864188-e17a-41db-af76-71d7c2bdefe3',
  status = 'paused',
  current_page = 210,
  records_processed = 20955,
  error_message = 'Ready to resume - fixed sync issues',
  last_activity_at = now(),
  retry_count = 0
WHERE id = 'cars-sync-main' OR id = 'd2864188-e17a-41db-af76-71d7c2bdefe3';