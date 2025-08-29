-- Performance optimization: Add hash-based change detection to staging table
-- This enables efficient updates by only modifying records when business data actually changes

-- Add hash column to cars_staging table for change detection
ALTER TABLE public.cars_staging 
ADD COLUMN IF NOT EXISTS data_hash TEXT;

-- Add hash column to main cars table for change detection
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS data_hash TEXT;

-- Create index on hash column for fast lookups during merge
CREATE INDEX IF NOT EXISTS idx_cars_staging_data_hash ON public.cars_staging(data_hash);
CREATE INDEX IF NOT EXISTS idx_cars_data_hash ON public.cars(data_hash);

-- Enhanced bulk merge function with hash-based change detection
-- Only updates records when the hash has actually changed (massive performance boost)
CREATE OR REPLACE FUNCTION public.bulk_merge_from_staging()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inserted_count INTEGER := 0;
  updated_count INTEGER := 0;
  skipped_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Set higher maintenance_work_mem for this session to speed up merge operations
  SET LOCAL maintenance_work_mem = '256MB';
  
  -- Begin transaction for atomic operations
  BEGIN
    -- Insert new cars (cars that don't exist in main table)
    WITH new_cars AS (
      INSERT INTO public.cars (
        id, external_id, make, model, year, price, mileage,
        title, vin, color, fuel, transmission, condition, location,
        lot_number, current_bid, buy_now_price, final_bid, sale_date,
        image_url, images, source_api, domain_name, status, is_active,
        is_live, is_archived, keys_available, data_hash, created_at, updated_at, last_synced_at
      )
      SELECT 
        s.id, s.external_id, s.make, s.model, s.year, s.price, s.mileage,
        s.title, s.vin, s.color, s.fuel, s.transmission, s.condition, s.location,
        s.lot_number, s.current_bid, s.buy_now_price, s.final_bid, s.sale_date,
        s.image_url, s.images, s.source_api, s.domain_name, s.status, s.is_active,
        s.is_live, s.is_archived, s.keys_available, s.data_hash, s.created_at, s.updated_at, s.last_synced_at
      FROM public.cars_staging s
      LEFT JOIN public.cars c ON c.id = s.id
      WHERE c.id IS NULL
      RETURNING 1
    )
    SELECT COUNT(*) INTO inserted_count FROM new_cars;

    -- Update existing cars ONLY when hash has changed (huge performance improvement)
    WITH updated_cars AS (
      UPDATE public.cars 
      SET
        external_id = s.external_id,
        make = s.make,
        model = s.model,
        year = s.year,
        price = s.price,
        mileage = s.mileage,
        title = s.title,
        vin = s.vin,
        color = s.color,
        fuel = s.fuel,
        transmission = s.transmission,
        condition = s.condition,
        location = s.location,
        lot_number = s.lot_number,
        current_bid = s.current_bid,
        buy_now_price = s.buy_now_price,
        final_bid = s.final_bid,
        sale_date = s.sale_date,
        image_url = s.image_url,
        images = s.images,
        source_api = s.source_api,
        domain_name = s.domain_name,
        status = s.status,
        is_active = s.is_active,
        is_live = s.is_live,
        is_archived = s.is_archived,
        keys_available = s.keys_available,
        data_hash = s.data_hash,
        updated_at = s.updated_at,
        last_synced_at = s.last_synced_at
      FROM public.cars_staging s
      WHERE public.cars.id = s.id
        AND (public.cars.data_hash IS DISTINCT FROM s.data_hash) -- Only update when hash changed
      RETURNING 1
    )
    SELECT COUNT(*) INTO updated_count FROM updated_cars;

    -- Count skipped records (where hash matched - no update needed)
    SELECT COUNT(*) INTO skipped_count 
    FROM public.cars c
    INNER JOIN public.cars_staging s ON c.id = s.id
    WHERE c.data_hash = s.data_hash;

    -- Analyze the cars table after bulk operations for optimal query performance
    ANALYZE public.cars;

    -- Build comprehensive result
    result := jsonb_build_object(
      'success', true,
      'inserted_count', inserted_count,
      'updated_count', updated_count,
      'skipped_count', skipped_count,
      'total_processed', inserted_count + updated_count + skipped_count,
      'efficiency_ratio', CASE 
        WHEN (inserted_count + updated_count + skipped_count) > 0 
        THEN ROUND((skipped_count::decimal / (inserted_count + updated_count + skipped_count) * 100), 2)
        ELSE 0 
      END,
      'timestamp', NOW()
    );

    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on any error
    RAISE;
  END;
END;
$$;

-- Optimize staging table for fastest writes (remove heavy indexes during sync)
-- Note: This makes staging UNLOGGED for maximum write performance
DROP TABLE IF EXISTS public.cars_staging_fast;
CREATE UNLOGGED TABLE public.cars_staging_fast (
  LIKE public.cars_staging INCLUDING DEFAULTS
);

-- Copy RLS policies to new staging table
ALTER TABLE public.cars_staging_fast ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage cars staging fast" ON public.cars_staging_fast
  FOR ALL USING (auth.role() = 'service_role');

-- Only essential indexes for staging (no secondary indexes for maximum write speed)
CREATE INDEX IF NOT EXISTS idx_cars_staging_fast_id ON public.cars_staging_fast(id);
CREATE INDEX IF NOT EXISTS idx_cars_staging_fast_hash ON public.cars_staging_fast(data_hash);

-- Function to swap staging tables for zero-downtime updates
CREATE OR REPLACE FUNCTION public.swap_staging_tables()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- This would swap the staging tables if we want zero downtime
  -- For now, we'll use the existing cars_staging table
  SELECT 1;
$$;