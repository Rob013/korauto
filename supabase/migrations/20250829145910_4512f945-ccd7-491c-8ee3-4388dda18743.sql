-- Update sync status to resume from current car count (20,955 cars ≈ page 210)
UPDATE sync_status 
SET 
  status = 'paused',
  current_page = 210,
  records_processed = 20955,
  error_message = 'Ready to resume sync and add more cars to existing collection',
  last_activity_at = now()
WHERE id = 'd2864188-e17a-41db-af76-71d7c2bdefe3';