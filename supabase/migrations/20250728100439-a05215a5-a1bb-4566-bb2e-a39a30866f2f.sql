-- Phase 1: Database Cleanup & Reset
-- Clear stuck sync records that are blocking new syncs
DELETE FROM sync_status WHERE status = 'running' AND started_at < (NOW() - INTERVAL '30 minutes');

-- Clear any existing car data to start fresh
DELETE FROM cars WHERE source_api = 'auctionapis';

-- Add database indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_external_id ON cars(external_id);
CREATE INDEX IF NOT EXISTS idx_cars_source_api ON cars(source_api);
CREATE INDEX IF NOT EXISTS idx_cars_last_synced ON cars(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_sync_status_created ON sync_status(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_status_type ON sync_status(sync_type, status);