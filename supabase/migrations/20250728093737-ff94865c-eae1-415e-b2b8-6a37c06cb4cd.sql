-- Clear stuck sync and add cleanup for old syncs
UPDATE sync_status 
SET status = 'failed', 
    error_message = 'Sync cleared - stuck for too long',
    completed_at = now()
WHERE status = 'running' AND created_at < now() - interval '1 hour';

-- Add index for better sync query performance
CREATE INDEX IF NOT EXISTS idx_sync_status_created_at ON sync_status(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_status_status ON sync_status(status);

-- Add indexes for cars table
CREATE INDEX IF NOT EXISTS idx_cars_external_id ON cars(external_id);
CREATE INDEX IF NOT EXISTS idx_cars_last_synced ON cars(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);