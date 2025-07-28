-- Force clear the stuck sync and start fresh
UPDATE sync_status 
SET status = 'failed', 
    error_message = 'Force cleared to test new system',
    completed_at = now()
WHERE status = 'running';

-- Check recent logs
SELECT id, status, sync_type, created_at, error_message, cars_processed
FROM sync_status 
ORDER BY created_at DESC 
LIMIT 5;