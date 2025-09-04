-- Enhanced Sold Car Removal and Immediate Deletion Migration
-- Adds improved functions for immediate sold car removal with cascading cleanup

-- Create an enhanced sold car removal function with immediate delete option
CREATE OR REPLACE FUNCTION enhanced_remove_sold_cars(
  immediate_removal BOOLEAN DEFAULT FALSE,
  cleanup_related_data BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  removed_count INTEGER := 0;
  favorites_cleaned INTEGER := 0;
  views_cleaned INTEGER := 0;
  images_cleaned INTEGER := 0;
BEGIN
  -- Log the start of cleanup
  INSERT INTO sync_metadata (operation_type, details, started_at) 
  VALUES ('enhanced_sold_car_cleanup', 
          json_build_object(
            'immediate_removal', immediate_removal,
            'cleanup_related_data', cleanup_related_data
          ), 
          NOW());

  -- If immediate removal is requested, remove sold cars right away
  -- Otherwise use the 24-hour delay
  IF immediate_removal THEN
    -- Immediate removal: mark all sold cars as inactive
    UPDATE cars 
    SET 
      is_active = false,
      status = 'immediately_removed_after_sold',
      updated_at = NOW()
    WHERE 
      is_archived = true 
      AND archive_reason = 'sold'
      AND is_active = true;
  ELSE
    -- Standard 24-hour delay removal
    UPDATE cars 
    SET 
      is_active = false,
      status = 'removed_after_sold',
      updated_at = NOW()
    WHERE 
      is_archived = true 
      AND archived_at IS NOT NULL 
      AND archive_reason = 'sold'
      AND archived_at < NOW() - INTERVAL '24 hours'
      AND is_active = true;
  END IF;
  
  GET DIAGNOSTICS removed_count = ROW_COUNT;

  -- Clean up related data if requested
  IF cleanup_related_data AND removed_count > 0 THEN
    -- Clean up user favorites for removed cars
    WITH removed_cars AS (
      SELECT id FROM cars 
      WHERE status IN ('removed_after_sold', 'immediately_removed_after_sold')
      AND is_active = false
    )
    DELETE FROM user_favorites 
    WHERE car_id IN (SELECT id FROM removed_cars);
    
    GET DIAGNOSTICS favorites_cleaned = ROW_COUNT;

    -- Clean up view history for removed cars (if such table exists)
    BEGIN
      WITH removed_cars AS (
        SELECT id FROM cars 
        WHERE status IN ('removed_after_sold', 'immediately_removed_after_sold')
        AND is_active = false
      )
      DELETE FROM car_views 
      WHERE car_id IN (SELECT id FROM removed_cars);
      
      GET DIAGNOSTICS views_cleaned = ROW_COUNT;
    EXCEPTION
      WHEN undefined_table THEN
        -- Table doesn't exist, skip this cleanup
        views_cleaned := 0;
    END;

    -- Mark orphaned images for cleanup (don't delete immediately to avoid issues)
    WITH removed_cars AS (
      SELECT id, images FROM cars 
      WHERE status IN ('removed_after_sold', 'immediately_removed_after_sold')
      AND is_active = false
      AND images IS NOT NULL
    )
    INSERT INTO image_cleanup_queue (car_id, image_urls, queued_at)
    SELECT id, images, NOW()
    FROM removed_cars
    ON CONFLICT (car_id) DO UPDATE SET 
      image_urls = EXCLUDED.image_urls,
      queued_at = NOW();
    
    GET DIAGNOSTICS images_cleaned = ROW_COUNT;
  END IF;

  -- Update the metadata with completion
  UPDATE sync_metadata 
  SET 
    completed_at = NOW(),
    details = details || json_build_object(
      'cars_removed', removed_count,
      'favorites_cleaned', favorites_cleaned,
      'views_cleaned', views_cleaned,
      'images_queued_for_cleanup', images_cleaned
    )
  WHERE operation_type = 'enhanced_sold_car_cleanup'
  AND completed_at IS NULL;
  
  RETURN json_build_object(
    'success', true,
    'removed_cars_count', removed_count,
    'favorites_cleaned', favorites_cleaned,
    'views_cleaned', views_cleaned,
    'images_queued_for_cleanup', images_cleaned,
    'immediate_removal', immediate_removal,
    'removed_at', NOW()
  );
END;
$$;

-- Create image cleanup queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS image_cleanup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id TEXT NOT NULL UNIQUE,
  image_urls JSONB,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for the cleanup queue
CREATE INDEX IF NOT EXISTS idx_image_cleanup_queue_status ON image_cleanup_queue(status, queued_at);
CREATE INDEX IF NOT EXISTS idx_image_cleanup_queue_car_id ON image_cleanup_queue(car_id);

-- Create a function to process the image cleanup queue
CREATE OR REPLACE FUNCTION process_image_cleanup_queue(batch_size INTEGER DEFAULT 100)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  processed_count INTEGER := 0;
  failed_count INTEGER := 0;
  batch_record RECORD;
BEGIN
  -- Process pending image cleanup tasks in batches
  FOR batch_record IN
    SELECT id, car_id, image_urls
    FROM image_cleanup_queue
    WHERE status = 'pending'
    ORDER BY queued_at
    LIMIT batch_size
  LOOP
    BEGIN
      -- Mark as processing
      UPDATE image_cleanup_queue 
      SET status = 'processing', processed_at = NOW()
      WHERE id = batch_record.id;
      
      -- Here you would implement actual image deletion logic
      -- For now, we'll just mark as completed
      -- In a real implementation, you'd call an external service or storage API
      
      UPDATE image_cleanup_queue 
      SET status = 'completed'
      WHERE id = batch_record.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Mark as failed and continue
        UPDATE image_cleanup_queue 
        SET status = 'failed'
        WHERE id = batch_record.id;
        
        failed_count := failed_count + 1;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'processed_count', processed_count,
    'failed_count', failed_count,
    'processed_at', NOW()
  );
END;
$$;

-- Create a function for bulk car deletion (for admin use)
CREATE OR REPLACE FUNCTION bulk_delete_cars(
  car_ids TEXT[],
  delete_reason TEXT DEFAULT 'admin_bulk_delete'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  favorites_cleaned INTEGER := 0;
  error_count INTEGER := 0;
  car_id TEXT;
BEGIN
  -- Validate input
  IF array_length(car_ids, 1) IS NULL OR array_length(car_ids, 1) = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No car IDs provided'
    );
  END IF;
  
  -- Process each car ID
  FOREACH car_id IN ARRAY car_ids
  LOOP
    BEGIN
      -- Mark the car as deleted
      UPDATE cars 
      SET 
        is_active = false,
        status = delete_reason,
        updated_at = NOW(),
        is_archived = true,
        archived_at = NOW(),
        archive_reason = delete_reason
      WHERE id = car_id AND is_active = true;
      
      IF FOUND THEN
        deleted_count := deleted_count + 1;
        
        -- Clean up favorites
        DELETE FROM user_favorites WHERE car_id = car_id;
        GET DIAGNOSTICS favorites_cleaned = favorites_cleaned + ROW_COUNT;
        
        -- Queue images for cleanup
        INSERT INTO image_cleanup_queue (car_id, image_urls, queued_at)
        SELECT car_id, images, NOW()
        FROM cars WHERE id = car_id AND images IS NOT NULL
        ON CONFLICT (car_id) DO UPDATE SET 
          image_urls = EXCLUDED.image_urls,
          queued_at = NOW();
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'favorites_cleaned', favorites_cleaned,
    'error_count', error_count,
    'processed_at', NOW()
  );
END;
$$;

-- Update the active_cars view to handle the new statuses
DROP VIEW IF EXISTS active_cars;
CREATE OR REPLACE VIEW active_cars AS
SELECT * FROM cars 
WHERE 
  -- Show cars that are either:
  -- 1. Not archived/sold at all, OR
  -- 2. Archived/sold less than 24 hours ago (unless immediately removed)
  (
    (is_archived = false OR archived_at IS NULL)
    OR 
    (
      is_archived = true 
      AND archived_at IS NOT NULL 
      AND archived_at >= NOW() - INTERVAL '24 hours'
      AND status NOT IN ('immediately_removed_after_sold', 'admin_bulk_delete')
    )
  )
  AND is_active = true
  AND status NOT IN ('removed_after_sold', 'immediately_removed_after_sold', 'admin_bulk_delete');

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION enhanced_remove_sold_cars TO service_role;
GRANT EXECUTE ON FUNCTION process_image_cleanup_queue TO service_role;
GRANT EXECUTE ON FUNCTION bulk_delete_cars TO service_role;

-- Grant permissions on new table and view
GRANT ALL ON image_cleanup_queue TO service_role;
GRANT SELECT ON active_cars TO authenticated;
GRANT SELECT ON active_cars TO anon;

-- Update the daily cleanup job to use the enhanced function
SELECT cron.unschedule('daily-sold-car-cleanup');
SELECT cron.schedule(
  'enhanced-daily-sold-car-cleanup',
  '0 3 * * *', -- Every day at 3 AM (1 hour after sync)
  $$
  SELECT enhanced_remove_sold_cars(FALSE, TRUE);
  $$
);

-- Schedule image cleanup to run every 6 hours
SELECT cron.schedule(
  'image-cleanup-processor',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT process_image_cleanup_queue(200);
  $$
);

-- Create indexes for better performance on the new status values
CREATE INDEX IF NOT EXISTS idx_cars_enhanced_status ON cars(status, is_active) 
WHERE status IN ('removed_after_sold', 'immediately_removed_after_sold', 'admin_bulk_delete');

-- Create index for better performance on the enhanced active_cars view
CREATE INDEX IF NOT EXISTS idx_cars_active_enhanced ON cars(is_active, is_archived, archived_at, status) 
WHERE is_active = true OR (is_archived = true AND archived_at IS NOT NULL);