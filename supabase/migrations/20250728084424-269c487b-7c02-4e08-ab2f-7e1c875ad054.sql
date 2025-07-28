-- Force stop any running syncs to allow fresh start with new rate limiting
UPDATE sync_status 
SET status = 'failed', 
    completed_at = now(),
    error_message = 'Stopped to apply new unlimited sync improvements'
WHERE status = 'running';