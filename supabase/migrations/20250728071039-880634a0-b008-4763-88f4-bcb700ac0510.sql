-- Clear existing cars and reset auto-sync for fresh import
DELETE FROM cars WHERE source_api = 'auctionapis';

-- Reset sync metadata to clear any stuck processes
DELETE FROM sync_metadata WHERE sync_type IN ('full', 'incremental');

-- Add performance indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_year_price ON cars(year, price);
CREATE INDEX IF NOT EXISTS idx_cars_source_status ON cars(source_api, status);

-- Trigger immediate full sync to start importing all cars
INSERT INTO sync_metadata (sync_type, status, total_records, synced_records) 
VALUES ('full', 'pending', 0, 0);