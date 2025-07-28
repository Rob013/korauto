-- Update the cleanup function to keep 500 records instead of 50
CREATE OR REPLACE FUNCTION cleanup_old_sync_records()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep only the latest 500 sync records instead of 50
  DELETE FROM sync_metadata 
  WHERE id NOT IN (
    SELECT id FROM sync_metadata 
    ORDER BY created_at DESC 
    LIMIT 500
  );
  
  -- Clean up old failed syncs older than 24 hours
  DELETE FROM sync_metadata 
  WHERE status = 'failed' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;