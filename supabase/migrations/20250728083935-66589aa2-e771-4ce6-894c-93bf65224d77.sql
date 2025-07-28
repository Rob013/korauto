-- Clear stuck sync records and reset failed ones
UPDATE sync_status 
SET status = 'failed', 
    completed_at = now(),
    error_message = 'Reset by system cleanup'
WHERE status = 'running' 
   OR (status = 'failed' AND retry_count < 3);

-- Delete very old failed sync records to start fresh
DELETE FROM sync_status 
WHERE status = 'failed' 
  AND created_at < now() - interval '1 day';