-- ============================================
-- FIX REMAINING FUNCTIONS WITHOUT search_path
-- ============================================

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update update_cars_cache_updated_at function
CREATE OR REPLACE FUNCTION public.update_cars_cache_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update update_favorite_cars_updated_at function
CREATE OR REPLACE FUNCTION public.update_favorite_cars_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update update_sold_car_status function
CREATE OR REPLACE FUNCTION public.update_sold_car_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark cars as sold if they haven't been updated in recent sync
  UPDATE cars_cache 
  SET 
    car_data = jsonb_set(
      COALESCE(car_data, '{}'::jsonb), 
      '{status}', 
      '"sold"'::jsonb
    ),
    updated_at = NOW()
  WHERE 
    last_api_sync < NOW() - INTERVAL '7 days'
    AND (car_data->>'status' IS NULL OR car_data->>'status' != 'sold');
  
  -- Also update main cars table
  UPDATE cars 
  SET 
    status = 'sold',
    is_active = false,
    updated_at = NOW()
  WHERE 
    last_synced_at < NOW() - INTERVAL '7 days'
    AND status != 'sold';
END;
$$;

-- Add search_path to all remaining database functions that process data
-- These are the high-value functions that handle data operations

CREATE OR REPLACE FUNCTION public.bulk_merge_from_staging()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    WHERE public.cars.data_hash IS DISTINCT FROM EXCLUDED.data_hash
    RETURNING 
      CASE WHEN public.cars.created_at = public.cars.updated_at THEN 'inserted' ELSE 'updated' END as operation
  )
  SELECT 
    COUNT(*) FILTER (WHERE operation = 'inserted'),
    COUNT(*) FILTER (WHERE operation = 'updated')
  INTO inserted_count, updated_count
  FROM upsert;
  
  SELECT COUNT(*)
  INTO unchanged_count
  FROM public.cars_staging s
  JOIN public.cars c ON c.id = s.id
  WHERE c.data_hash = s.data_hash;
  
  ANALYZE public.cars;
  
  RETURN jsonb_build_object(
    'inserted', inserted_count,
    'updated', updated_count,
    'unchanged', unchanged_count,
    'total_processed', inserted_count + updated_count + unchanged_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_missing_inactive()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  marked_count INTEGER := 0;
BEGIN
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