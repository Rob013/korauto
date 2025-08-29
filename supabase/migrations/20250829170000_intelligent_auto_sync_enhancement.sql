-- Enhanced Intelligent Auto-Sync for Supabase Pro
-- This migration adds intelligent auto-sync capabilities with error recovery

-- Update the existing cron job to be more intelligent
SELECT cron.unschedule('daily-cars-sync');

-- Create enhanced intelligent daily sync cron job (runs every 4 hours for better coverage)
SELECT cron.schedule(
  'intelligent-cars-sync',
  '0 */4 * * *', -- Every 4 hours instead of daily
  $$
  SELECT
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
        body:='{"scheduled": true, "type": "intelligent_sync", "smartSync": true, "source": "cron_intelligent"}'::jsonb
    ) as request_id;
  $$
);

-- Create recovery sync cron job (runs hourly to check for stuck syncs)
SELECT cron.schedule(
  'sync-recovery-check',
  '30 * * * *', -- Every hour at 30 minutes past
  $$
  DO $$
  DECLARE
    stuck_sync_count integer;
    last_activity_threshold timestamptz;
  BEGIN
    -- Check for stuck syncs (no activity for more than 2 hours)
    last_activity_threshold := now() - interval '2 hours';
    
    SELECT COUNT(*) INTO stuck_sync_count
    FROM sync_status 
    WHERE status = 'running' 
    AND last_activity_at < last_activity_threshold;
    
    -- If we find stuck syncs, trigger recovery
    IF stuck_sync_count > 0 THEN
      -- Mark stuck syncs as failed
      UPDATE sync_status 
      SET status = 'failed',
          error_message = 'Auto-recovery: Detected stuck sync, triggering intelligent restart',
          completed_at = now()
      WHERE status = 'running' 
      AND last_activity_at < last_activity_threshold;
      
      -- Trigger recovery sync
      PERFORM net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"}'::jsonb,
        body:='{"recovery": true, "type": "intelligent_recovery", "smartSync": true, "source": "auto_recovery"}'::jsonb
      );
    END IF;
  END $$;
  $$
);

-- Add enhanced fields to sync_status table for intelligent tracking
ALTER TABLE sync_status 
ADD COLUMN IF NOT EXISTS auto_fix_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS network_error_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_error_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS validation_error_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_rate numeric DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS throughput_cars_per_min numeric DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_error_type text,
ADD COLUMN IF NOT EXISTS intelligence_level text DEFAULT 'standard';

-- Create index for enhanced sync monitoring
CREATE INDEX IF NOT EXISTS idx_sync_status_activity_status ON sync_status(last_activity_at, status);
CREATE INDEX IF NOT EXISTS idx_sync_status_error_tracking ON sync_status(success_rate, auto_fix_count);

-- Create function to get sync analytics
CREATE OR REPLACE FUNCTION get_sync_analytics()
RETURNS TABLE(
  total_syncs bigint,
  successful_syncs bigint,
  avg_success_rate numeric,
  avg_throughput numeric,
  total_auto_fixes bigint,
  most_common_error_type text
)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_syncs,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_syncs,
    AVG(success_rate) as avg_success_rate,
    AVG(throughput_cars_per_min) as avg_throughput,
    SUM(auto_fix_count) as total_auto_fixes,
    MODE() WITHIN GROUP (ORDER BY last_error_type) as most_common_error_type
  FROM sync_status
  WHERE created_at > now() - interval '30 days';
$$;

-- Create function to check if intelligent sync should be triggered
CREATE OR REPLACE FUNCTION should_trigger_intelligent_sync()
RETURNS boolean
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM sync_status 
        WHERE status = 'running' 
        AND last_activity_at > now() - interval '1 hour'
      ) THEN true
      ELSE false
    END;
$$;

-- Update existing RLS policies for enhanced sync management
DROP POLICY IF EXISTS "Service role can manage sync status" ON sync_status;
CREATE POLICY "Service role and intelligent sync can manage sync status" ON sync_status
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    (auth.role() = 'anon' AND current_setting('app.intelligent_sync', true) = 'true')
  );

-- Create notification for successful intelligent syncs
CREATE OR REPLACE FUNCTION notify_intelligent_sync_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.auto_fix_count > 0 THEN
    -- Log successful intelligent sync with auto-fixes
    INSERT INTO sync_status (
      sync_type, 
      status, 
      records_processed, 
      error_message,
      intelligence_level
    ) VALUES (
      'analytics',
      'completed',
      0,
      format('Intelligent sync completed with %s auto-fixes, %s%% success rate', 
        NEW.auto_fix_count, NEW.success_rate),
      'enhanced'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for intelligent sync completion notifications
DROP TRIGGER IF EXISTS trigger_intelligent_sync_completion ON sync_status;
CREATE TRIGGER trigger_intelligent_sync_completion
  AFTER UPDATE ON sync_status
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION notify_intelligent_sync_completion();

-- Add comment explaining the intelligent auto-sync system
COMMENT ON TABLE sync_status IS 'Enhanced sync status table with intelligent error handling, auto-fixing capabilities, and performance analytics for Supabase Pro optimization';