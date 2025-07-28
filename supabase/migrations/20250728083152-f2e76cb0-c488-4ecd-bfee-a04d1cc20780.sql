-- Step 1: Clean up stuck sync records
UPDATE sync_status 
SET status = 'failed', 
    completed_at = now(),
    error_message = 'Manually reset - was stuck in running state'
WHERE status = 'running' 
  AND (last_activity_at < now() - interval '10 minutes' OR records_processed = 0);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_year_price ON cars(year, price);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_status_created_at ON sync_status(created_at DESC);

-- Add foreign key constraint for data integrity
ALTER TABLE favorite_cars 
ADD CONSTRAINT fk_favorite_cars_car_id 
FOREIGN KEY (car_id) REFERENCES cars(id);