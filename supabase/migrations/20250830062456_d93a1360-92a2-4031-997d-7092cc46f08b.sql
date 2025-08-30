-- Create high-performance staging table for car sync pipeline
-- UNLOGGED for maximum write speed (no WAL overhead)
CREATE UNLOGGED TABLE IF NOT EXISTS public.cars_staging (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  price NUMERIC,
  mileage INTEGER,
  title TEXT,
  vin TEXT,
  color TEXT,
  fuel TEXT,
  transmission TEXT,
  lot_number TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::JSONB,
  current_bid NUMERIC,
  buy_now_price NUMERIC,
  is_live BOOLEAN,
  keys_available BOOLEAN,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  condition TEXT,
  location TEXT DEFAULT 'South Korea',
  domain_name TEXT,
  source_api TEXT DEFAULT 'external',
  data_hash TEXT, -- MD5 hash for change detection
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add data_hash column to main cars table if it doesn't exist
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS data_hash TEXT;

-- Create optimized merge function with hash-based change detection
CREATE OR REPLACE FUNCTION public.bulk_merge_from_staging()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INTEGER := 0;
  updated_count INTEGER := 0;
  unchanged_count INTEGER := 0;
BEGIN
  -- Insert new records and update changed records (hash-based detection)
  WITH upsert AS (
    INSERT INTO public.cars (
      id, external_id, make, model, year, price, mileage, title, vin, color,
      fuel, transmission, lot_number, image_url, images, current_bid,
      buy_now_price, is_live, keys_available, status, is_active, is_archived,
      condition, location, domain_name, source_api, data_hash, last_synced_at
    )
    SELECT 
      s.id, s.external_id, s.make, s.model, s.year, s.price, s.mileage, s.title, 
      s.vin, s.color, s.fuel, s.transmission, s.lot_number, s.image_url, s.images,
      s.current_bid, s.buy_now_price, s.is_live, s.keys_available, s.status,
      s.is_active, s.is_archived, s.condition, s.location, s.domain_name,
      s.source_api, s.data_hash, s.last_synced_at
    FROM public.cars_staging s
    ON CONFLICT (id) DO UPDATE SET
      external_id = EXCLUDED.external_id,
      make = EXCLUDED.make,
      model = EXCLUDED.model,
      year = EXCLUDED.year,
      price = EXCLUDED.price,
      mileage = EXCLUDED.mileage,
      title = EXCLUDED.title,
      vin = EXCLUDED.vin,
      color = EXCLUDED.color,
      fuel = EXCLUDED.fuel,
      transmission = EXCLUDED.transmission,
      lot_number = EXCLUDED.lot_number,
      image_url = EXCLUDED.image_url,
      images = EXCLUDED.images,
      current_bid = EXCLUDED.current_bid,
      buy_now_price = EXCLUDED.buy_now_price,
      is_live = EXCLUDED.is_live,
      keys_available = EXCLUDED.keys_available,
      status = EXCLUDED.status,
      is_active = EXCLUDED.is_active,
      is_archived = EXCLUDED.is_archived,
      condition = EXCLUDED.condition,
      location = EXCLUDED.location,
      domain_name = EXCLUDED.domain_name,
      source_api = EXCLUDED.source_api,
      data_hash = EXCLUDED.data_hash,
      last_synced_at = EXCLUDED.last_synced_at,
      updated_at = NOW()
    -- Only update when hash has actually changed (performance optimization)
    WHERE public.cars.data_hash IS DISTINCT FROM EXCLUDED.data_hash
    RETURNING 
      CASE WHEN public.cars.created_at = public.cars.updated_at THEN 'inserted' ELSE 'updated' END as operation
  )
  SELECT 
    COUNT(*) FILTER (WHERE operation = 'inserted'),
    COUNT(*) FILTER (WHERE operation = 'updated')
  INTO inserted_count, updated_count
  FROM upsert;
  
  -- Count unchanged records (hash matched)
  SELECT COUNT(*)
  INTO unchanged_count
  FROM public.cars_staging s
  JOIN public.cars c ON c.id = s.id
  WHERE c.data_hash = s.data_hash;
  
  -- Update statistics for performance monitoring
  ANALYZE public.cars;
  
  RETURN jsonb_build_object(
    'inserted', inserted_count,
    'updated', updated_count,
    'unchanged', unchanged_count,
    'total_processed', inserted_count + updated_count + unchanged_count
  );
END;
$$;

-- Create function to mark missing cars as inactive
CREATE OR REPLACE FUNCTION public.mark_missing_inactive()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  marked_count INTEGER := 0;
BEGIN
  -- Mark cars as inactive if they weren't updated in this sync
  UPDATE public.cars 
  SET 
    is_active = false,
    status = 'inactive',
    updated_at = NOW()
  WHERE 
    is_active = true 
    AND last_synced_at < NOW() - INTERVAL '2 hours'
    AND source_api = 'external';
  
  GET DIAGNOSTICS marked_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'marked_inactive', marked_count
  );
END;
$$;

-- Create indexes for performance (only on main table, not staging)
CREATE INDEX IF NOT EXISTS idx_cars_data_hash ON public.cars (data_hash);
CREATE INDEX IF NOT EXISTS idx_cars_last_synced_at ON public.cars (last_synced_at);
CREATE INDEX IF NOT EXISTS idx_cars_source_api ON public.cars (source_api);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars_staging TO service_role;
GRANT EXECUTE ON FUNCTION public.bulk_merge_from_staging() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_missing_inactive() TO service_role;