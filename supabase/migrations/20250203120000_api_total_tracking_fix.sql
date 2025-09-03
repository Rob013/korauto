-- Fix sync_status table to support API total tracking and proper ID handling
-- This migration ensures the sync system can properly track API totals discovered during sync

-- Update sync_status table structure for better API total tracking
-- Add comment to existing columns to clarify their purpose
COMMENT ON COLUMN sync_status.total_records IS 'Real total from API metadata, discovered during sync';
COMMENT ON COLUMN sync_status.total_pages IS 'Real last page from API metadata, discovered during sync';

-- Ensure we have a consistent way to identify the main cars sync
-- Allow text IDs for easier management (cars-sync-main)
ALTER TABLE sync_status ALTER COLUMN id TYPE TEXT;

-- Create a specific index for the main sync status
CREATE INDEX IF NOT EXISTS idx_sync_status_main_id ON sync_status(id) WHERE id = 'cars-sync-main';

-- Add a check constraint to ensure valid sync status values
ALTER TABLE sync_status 
ADD CONSTRAINT chk_sync_status_valid 
CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused'));

-- Add a check constraint to ensure sensible record counts
ALTER TABLE sync_status 
ADD CONSTRAINT chk_sync_records_positive 
CHECK (records_processed >= 0 AND total_records >= 0);

-- Update the policy to allow anonymous read for sync status monitoring
-- This allows the frontend to check sync progress without authentication
DROP POLICY IF EXISTS "Anyone can view main sync status" ON sync_status;
CREATE POLICY "Anyone can view main sync status" ON sync_status
  FOR SELECT USING (id = 'cars-sync-main');

-- Function to safely upsert sync status with API totals
CREATE OR REPLACE FUNCTION upsert_sync_status(
  p_id TEXT,
  p_sync_type TEXT DEFAULT 'full',
  p_status TEXT DEFAULT 'pending',
  p_current_page INTEGER DEFAULT 1,
  p_total_pages INTEGER DEFAULT NULL,
  p_records_processed INTEGER DEFAULT 0,
  p_total_records INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_started_at TIMESTAMPTZ DEFAULT NOW(),
  p_completed_at TIMESTAMPTZ DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO sync_status (
    id, sync_type, status, current_page, total_pages, 
    records_processed, total_records, error_message,
    started_at, completed_at, last_activity_at, created_at
  ) VALUES (
    p_id, p_sync_type, p_status, p_current_page, p_total_pages,
    p_records_processed, p_total_records, p_error_message,
    p_started_at, p_completed_at, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    sync_type = EXCLUDED.sync_type,
    status = EXCLUDED.status,
    current_page = EXCLUDED.current_page,
    total_pages = COALESCE(EXCLUDED.total_pages, sync_status.total_pages),
    records_processed = EXCLUDED.records_processed,
    total_records = COALESCE(EXCLUDED.total_records, sync_status.total_records),
    error_message = EXCLUDED.error_message,
    started_at = EXCLUDED.started_at,
    completed_at = EXCLUDED.completed_at,
    last_activity_at = NOW();
END;
$$;