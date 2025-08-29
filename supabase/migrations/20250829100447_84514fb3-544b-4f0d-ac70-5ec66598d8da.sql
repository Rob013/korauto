-- Fix stuck sync at 1900 cars (but database actually has 3826 cars)
-- This sync got stuck due to Edge Function timeout but didn't update status properly

UPDATE sync_status 
SET 
  status = 'failed',
  error_message = 'Auto-cleaned: Sync was stuck at 1900 but database has 3826 cars. Edge Function timed out without updating status.',
  completed_at = NOW(),
  records_processed = 3826,
  last_activity_at = NOW()
WHERE id = 'cars-sync-main' AND status = 'running';

-- Add a helpful comment about what happened
INSERT INTO sync_status (id, sync_type, status, records_processed, error_message, started_at, completed_at)
VALUES (
  'cars-sync-main-corrected', 
  'correction', 
  'completed', 
  3826, 
  'Correction: Found 3826 cars in database after stuck sync cleanup', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;