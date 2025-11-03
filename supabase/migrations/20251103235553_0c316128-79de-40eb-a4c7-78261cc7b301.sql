-- Create sync_schedule table to track automatic syncs
CREATE TABLE IF NOT EXISTS sync_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT UNIQUE NOT NULL,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_sync_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  cars_synced INTEGER DEFAULT 0,
  cars_new INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_schedule_type ON sync_schedule(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_schedule_next_sync ON sync_schedule(next_sync_at);

-- Enable RLS
ALTER TABLE sync_schedule ENABLE ROW LEVEL SECURITY;

-- Allow public read access to see sync status
CREATE POLICY "Anyone can view sync schedule"
  ON sync_schedule
  FOR SELECT
  USING (true);

-- Only service role can modify sync schedule
CREATE POLICY "Service role can modify sync schedule"
  ON sync_schedule
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert initial sync schedule for 6-hour incremental syncs
INSERT INTO sync_schedule (sync_type, last_sync_at, next_sync_at, status)
VALUES ('cars_incremental', NOW() - INTERVAL '7 days', NOW() + INTERVAL '6 hours', 'pending')
ON CONFLICT (sync_type) DO NOTHING;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_sync_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_schedule_updated_at
  BEFORE UPDATE ON sync_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_schedule_updated_at();

-- Create index on cars_cache for recently added premium brands
CREATE INDEX IF NOT EXISTS idx_cars_cache_recent_premium 
  ON cars_cache(last_api_sync DESC)
  WHERE make IN ('BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen');
