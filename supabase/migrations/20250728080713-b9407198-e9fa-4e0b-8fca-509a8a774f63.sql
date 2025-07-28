-- Create optimized indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_source_status 
ON cars (source_api, status) 
WHERE source_api = 'auctionapis' AND status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_make_model 
ON cars (make, model) 
WHERE source_api = 'auctionapis';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_year_price 
ON cars (year, price) 
WHERE source_api = 'auctionapis' AND status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_metadata_status_type 
ON sync_metadata (status, sync_type, created_at DESC);

-- Add a function to clean up old sync records automatically
CREATE OR REPLACE FUNCTION cleanup_old_sync_records()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep only the latest 50 sync records
  DELETE FROM sync_metadata 
  WHERE id NOT IN (
    SELECT id FROM sync_metadata 
    ORDER BY created_at DESC 
    LIMIT 50
  );
  
  -- Clean up old failed syncs older than 24 hours
  DELETE FROM sync_metadata 
  WHERE status = 'failed' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;