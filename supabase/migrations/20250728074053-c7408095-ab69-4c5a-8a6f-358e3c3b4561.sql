-- Clean up stuck sync metadata records
UPDATE sync_metadata 
SET status = 'failed', 
    error_message = 'Superseded by system optimization'
WHERE status = 'in_progress';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_source_api_status ON cars(source_api, status);
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_status ON sync_metadata(status);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_created_at ON sync_metadata(created_at DESC);