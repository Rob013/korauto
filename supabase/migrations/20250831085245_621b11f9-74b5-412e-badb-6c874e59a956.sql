-- Fix schema issues and optimize for 100% completion sync

-- Add missing columns to cars_cache table if they don't exist  
ALTER TABLE public.cars_cache
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update cars_cache table price_cents from price if needed
UPDATE public.cars_cache 
SET price_cents = (price * 100)::BIGINT 
WHERE price_cents IS NULL AND price IS NOT NULL;

-- Create optimized indexes for better sync performance using api_id (not external_id)
CREATE INDEX IF NOT EXISTS idx_cars_cache_api_id ON public.cars_cache(api_id);
CREATE INDEX IF NOT EXISTS idx_cars_cache_last_sync ON public.cars_cache(last_api_sync);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents ON public.cars_cache(price_cents);

-- Function to handle sync completion tracking
CREATE OR REPLACE FUNCTION public.get_sync_progress()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_pages INTEGER;
  current_page INTEGER;
  total_cars INTEGER;
  completion_percentage REAL;
  sync_status RECORD;
BEGIN
  -- Get current sync status
  SELECT * INTO sync_status
  FROM public.sync_status 
  WHERE id = 'cars-sync-main'
  LIMIT 1;
  
  -- Calculate progress metrics
  SELECT 
    COALESCE(sync_status.current_page, 0),
    COALESCE(sync_status.records_processed, 0)
  INTO current_page, total_cars;
  
  -- Estimate total pages (API typically has ~500 pages)
  total_pages := GREATEST(500, current_page);
  
  -- Calculate completion percentage
  completion_percentage := CASE 
    WHEN total_pages > 0 THEN (current_page::REAL / total_pages::REAL) * 100
    ELSE 0
  END;
  
  RETURN jsonb_build_object(
    'current_page', current_page,
    'estimated_total_pages', total_pages,
    'total_cars_processed', total_cars,
    'completion_percentage', ROUND(completion_percentage, 2),
    'status', COALESCE(sync_status.status, 'unknown'),
    'last_updated', COALESCE(sync_status.updated_at, NOW())
  );
END;
$$;

-- Function to resume sync from last known position
CREATE OR REPLACE FUNCTION public.get_resume_position()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_page INTEGER := 0;
  total_records INTEGER := 0;
  sync_status RECORD;
BEGIN
  -- Get last sync position
  SELECT * INTO sync_status
  FROM public.sync_status 
  WHERE id = 'cars-sync-main'
  LIMIT 1;
  
  IF sync_status.status = 'running' OR sync_status.status = 'paused' THEN
    -- Resume from current page minus a few for safety
    last_page := GREATEST(0, COALESCE(sync_status.current_page, 0) - 5);
    total_records := COALESCE(sync_status.records_processed, 0);
  ELSE 
    -- Start from beginning or resume smart position
    SELECT COUNT(*) INTO total_records FROM public.cars_cache;
    last_page := GREATEST(0, (total_records / 250) - 10); -- Start 10 pages back for safety
  END IF;
  
  RETURN jsonb_build_object(
    'resume_page', last_page,
    'existing_records', total_records,
    'should_resume', true
  );
END;
$$;