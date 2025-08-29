-- Update the sync status with the correct car count
UPDATE sync_status 
SET records_processed = (
  SELECT COUNT(*) FROM cars_cache WHERE price_cents IS NOT NULL
),
last_activity_at = now(),
error_message = 'Fixed progress tracking: ' || (SELECT COUNT(*) FROM cars_cache WHERE price_cents IS NOT NULL) || ' cars synced and available'
WHERE id = 'cars-sync-main';