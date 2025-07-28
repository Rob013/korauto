-- Add new fields to sync_metadata table for improved tracking
ALTER TABLE sync_metadata 
ADD COLUMN IF NOT EXISTS current_page INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_url TEXT DEFAULT NULL;

-- Update existing records to have proper defaults
UPDATE sync_metadata 
SET current_page = 1 
WHERE current_page IS NULL;

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_sync_metadata_type_status 
ON sync_metadata(sync_type, status);

-- Clean up any old stuck syncs
UPDATE sync_metadata 
SET status = 'failed', 
    error_message = 'Superseded by rewrite' 
WHERE status = 'in_progress';