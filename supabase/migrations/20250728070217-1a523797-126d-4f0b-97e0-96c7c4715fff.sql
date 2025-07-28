-- Phase 1: Database Optimization

-- Clear sample data from cars table
DELETE FROM cars WHERE id IN ('sample_1', 'sample_2', 'sample_3', 'sample_4', 'sample_5', 'sample_6');

-- Add performance indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_cars_make ON cars(make);
CREATE INDEX IF NOT EXISTS idx_cars_model ON cars(model);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_mileage ON cars(mileage);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_domain_name ON cars(domain_name);
CREATE INDEX IF NOT EXISTS idx_cars_external_id ON cars(external_id);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_year_price ON cars(year, price);
CREATE INDEX IF NOT EXISTS idx_cars_status_domain ON cars(status, domain_name);

-- Text search index for title and description
CREATE INDEX IF NOT EXISTS idx_cars_text_search ON cars USING gin(to_tsvector('english', title || ' ' || make || ' ' || model));

-- Ensure sync_metadata table has proper indexes
CREATE INDEX IF NOT EXISTS idx_sync_metadata_status ON sync_metadata(status);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_sync_type ON sync_metadata(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_created_at ON sync_metadata(created_at DESC);

-- Update RLS policies for optimal public access
DROP POLICY IF EXISTS "Cars are publicly viewable" ON cars;
DROP POLICY IF EXISTS "Enable read access for all users" ON cars;

-- Create optimized public read policy
CREATE POLICY "Public read access for cars" ON cars
  FOR SELECT 
  USING (true);

-- Enable realtime for cars table
ALTER TABLE cars REPLICA IDENTITY FULL;
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime FOR TABLE cars, sync_metadata;