-- Part A: Fix and harden sync pipeline schema
-- Add sync_runs table for progress tracking
CREATE TABLE IF NOT EXISTS public.sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'paused')),
  total_fetched INTEGER DEFAULT 0,
  total_upserted INTEGER DEFAULT 0,
  total_skipped INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 1,
  last_checkpoint JSONB,
  error_message TEXT,
  source_api TEXT DEFAULT 'external',
  sync_type TEXT DEFAULT 'full' CHECK (sync_type IN ('full', 'incremental', 'resume')),
  completion_percentage NUMERIC(5,2) DEFAULT 0.0,
  estimated_total INTEGER,
  last_source_updated_at TIMESTAMP WITH TIME ZONE,
  last_processed_id TEXT
);

-- Add sync_errors table for poison records
CREATE TABLE IF NOT EXISTS public.sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES public.sync_runs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  source_record_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  payload JSONB,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE
);

-- Improve cars table schema with proper types and constraints
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS source_id TEXT,
ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS price_numeric NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS mileage_numeric INTEGER,
ADD COLUMN IF NOT EXISTS year_numeric INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS sync_run_id UUID REFERENCES public.sync_runs(id);

-- Create unique constraint on source_id for upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_cars_source_id ON public.cars(source_id) WHERE source_id IS NOT NULL;

-- Performance indexes for sync and querying
CREATE INDEX IF NOT EXISTS idx_cars_source_updated_at ON public.cars(source_updated_at) WHERE source_updated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cars_is_active ON public.cars(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cars_sync_run ON public.cars(sync_run_id) WHERE sync_run_id IS NOT NULL;

-- Part B: Global sorting indexes on cars_cache
-- Improve cars_cache table structure
ALTER TABLE public.cars_cache 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS source_id TEXT,
ADD COLUMN IF NOT EXISTS normalized_price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS normalized_mileage INTEGER,
ADD COLUMN IF NOT EXISTS normalized_year INTEGER;

-- Critical indexes for global sorting performance
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_asc ON public.cars_cache(normalized_price ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_desc ON public.cars_cache(normalized_price DESC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year_asc ON public.cars_cache(normalized_year ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year_desc ON public.cars_cache(normalized_year DESC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_mileage_asc ON public.cars_cache(normalized_mileage ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_mileage_desc ON public.cars_cache(normalized_mileage DESC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_created_asc ON public.cars_cache(created_at ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_created_desc ON public.cars_cache(created_at DESC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_asc ON public.cars_cache(make ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_desc ON public.cars_cache(make DESC NULLS LAST, id ASC);

-- Index for active cars filtering
CREATE INDEX IF NOT EXISTS idx_cars_cache_active ON public.cars_cache(is_active) WHERE is_active = TRUE;

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_price ON public.cars_cache(make, normalized_price ASC NULLS LAST, id ASC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_year ON public.cars_cache(make, normalized_year DESC NULLS LAST, id ASC) WHERE is_active = TRUE;

-- Function to update cars_cache from cars table (incremental)
CREATE OR REPLACE FUNCTION public.refresh_cars_cache_incremental(p_sync_run_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER := 0;
BEGIN
  -- Upsert cars that have changed
  WITH cars_to_update AS (
    SELECT 
      c.id,
      c.external_id as api_id,
      c.make,
      c.model,
      c.year as normalized_year,
      CASE 
        WHEN c.price_numeric IS NOT NULL THEN c.price_numeric
        WHEN c.price IS NOT NULL THEN c.price::NUMERIC
        ELSE NULL
      END as normalized_price,
      CASE 
        WHEN c.mileage_numeric IS NOT NULL THEN c.mileage_numeric
        WHEN c.mileage IS NOT NULL THEN c.mileage
        ELSE NULL
      END as normalized_mileage,
      c.fuel,
      c.transmission,
      c.color,
      c.images,
      c.condition as lot_data,
      c.vin,
      c.created_at,
      c.updated_at,
      c.last_synced_at as last_api_sync,
      c.is_active,
      c.source_id,
      c.price_numeric * 100 as price_cents, -- Convert to cents for precision
      1.0::real as rank_score -- Default rank score
    FROM public.cars c
    WHERE 
      c.is_active = TRUE
      AND (p_sync_run_id IS NULL OR c.sync_run_id = p_sync_run_id)
      AND c.id IS NOT NULL
      AND c.make IS NOT NULL
      AND c.model IS NOT NULL
      AND c.year IS NOT NULL
  )
  INSERT INTO public.cars_cache (
    id, api_id, make, model, normalized_year, normalized_price, normalized_mileage,
    fuel, transmission, color, images, lot_data, vin, created_at, updated_at,
    last_api_sync, is_active, source_id, price_cents, rank_score, year, price, mileage
  )
  SELECT 
    id, api_id, make, model, normalized_year, normalized_price, normalized_mileage,
    fuel, transmission, color, images, lot_data, vin, created_at, updated_at,
    last_api_sync, is_active, source_id, price_cents, rank_score,
    normalized_year, normalized_price, 
    CASE WHEN normalized_mileage IS NOT NULL THEN normalized_mileage::TEXT ELSE NULL END
  FROM cars_to_update
  ON CONFLICT (id) DO UPDATE SET
    api_id = EXCLUDED.api_id,
    make = EXCLUDED.make,
    model = EXCLUDED.model,
    normalized_year = EXCLUDED.normalized_year,
    normalized_price = EXCLUDED.normalized_price,
    normalized_mileage = EXCLUDED.normalized_mileage,
    fuel = EXCLUDED.fuel,
    transmission = EXCLUDED.transmission,
    color = EXCLUDED.color,
    images = EXCLUDED.images,
    lot_data = EXCLUDED.lot_data,
    vin = EXCLUDED.vin,
    updated_at = EXCLUDED.updated_at,
    last_api_sync = EXCLUDED.last_api_sync,
    is_active = EXCLUDED.is_active,
    source_id = EXCLUDED.source_id,
    price_cents = EXCLUDED.price_cents,
    rank_score = EXCLUDED.rank_score,
    year = EXCLUDED.year,
    price = EXCLUDED.price,
    mileage = EXCLUDED.mileage;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Remove inactive cars from cache
  DELETE FROM public.cars_cache 
  WHERE id IN (
    SELECT cc.id 
    FROM public.cars_cache cc
    LEFT JOIN public.cars c ON c.id = cc.id
    WHERE c.id IS NULL OR c.is_active = FALSE
  );
  
  RETURN affected_rows;
END;
$$;

-- Function for bulk upsert with conflict resolution
CREATE OR REPLACE FUNCTION public.bulk_upsert_cars(p_cars JSONB, p_sync_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INTEGER := 0;
  updated_count INTEGER := 0;
  skipped_count INTEGER := 0;
  car_record JSONB;
  result JSONB;
BEGIN
  -- Process each car record
  FOR car_record IN SELECT * FROM jsonb_array_elements(p_cars)
  LOOP
    BEGIN
      -- Normalize and validate data
      WITH normalized_car AS (
        SELECT 
          COALESCE(car_record->>'id', car_record->>'source_id', gen_random_uuid()::text) as id,
          car_record->>'source_id' as source_id,
          car_record->>'make' as make,
          car_record->>'model' as model,
          CASE 
            WHEN car_record->>'year' ~ '^\d+$' THEN (car_record->>'year')::INTEGER
            ELSE NULL
          END as year_numeric,
          CASE 
            WHEN car_record->>'price' ~ '^\d+(\.\d+)?$' THEN (car_record->>'price')::NUMERIC
            ELSE NULL
          END as price_numeric,
          CASE 
            WHEN car_record->>'mileage' ~ '^\d+$' THEN (car_record->>'mileage')::INTEGER
            ELSE NULL
          END as mileage_numeric,
          car_record->>'fuel' as fuel,
          car_record->>'transmission' as transmission,
          car_record->>'color' as color,
          car_record->>'vin' as vin,
          car_record->>'title' as title,
          car_record->>'condition' as condition,
          car_record->'images' as images,
          COALESCE((car_record->>'source_updated_at')::TIMESTAMP WITH TIME ZONE, NOW()) as source_updated_at,
          p_sync_run_id as sync_run_id
      )
      INSERT INTO public.cars (
        id, source_id, make, model, year, year_numeric, price_numeric, mileage_numeric,
        fuel, transmission, color, vin, title, condition, images, source_updated_at,
        sync_run_id, is_active, created_at, updated_at
      )
      SELECT 
        id, source_id, make, model, year_numeric, year_numeric, price_numeric, mileage_numeric,
        fuel, transmission, color, vin, title, condition, images, source_updated_at,
        sync_run_id, TRUE, NOW(), NOW()
      FROM normalized_car
      WHERE source_id IS NOT NULL AND make IS NOT NULL AND model IS NOT NULL
      ON CONFLICT (source_id) DO UPDATE SET
        make = EXCLUDED.make,
        model = EXCLUDED.model,
        year = EXCLUDED.year,
        year_numeric = EXCLUDED.year_numeric,
        price_numeric = EXCLUDED.price_numeric,
        mileage_numeric = EXCLUDED.mileage_numeric,
        fuel = EXCLUDED.fuel,
        transmission = EXCLUDED.transmission,
        color = EXCLUDED.color,
        vin = EXCLUDED.vin,
        title = EXCLUDED.title,
        condition = EXCLUDED.condition,
        images = EXCLUDED.images,
        source_updated_at = EXCLUDED.source_updated_at,
        sync_run_id = EXCLUDED.sync_run_id,
        is_active = TRUE,
        updated_at = NOW()
      WHERE 
        cars.source_updated_at < EXCLUDED.source_updated_at OR
        cars.source_updated_at IS NULL;
      
      -- Count operation type
      IF FOUND THEN
        IF (SELECT created_at = updated_at FROM public.cars WHERE source_id = car_record->>'source_id') THEN
          inserted_count := inserted_count + 1;
        ELSE
          updated_count := updated_count + 1;
        END IF;
      ELSE
        skipped_count := skipped_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue
      INSERT INTO public.sync_errors (sync_run_id, source_record_id, error_type, error_message, payload)
      VALUES (p_sync_run_id, car_record->>'source_id', 'upsert_error', SQLERRM, car_record);
      skipped_count := skipped_count + 1;
    END;
  END LOOP;
  
  -- Return summary
  result := jsonb_build_object(
    'inserted', inserted_count,
    'updated', updated_count,
    'skipped', skipped_count,
    'total_processed', inserted_count + updated_count + skipped_count
  );
  
  RETURN result;
END;
$$;

-- RLS policies for new tables
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_errors ENABLE ROW LEVEL SECURITY;

-- Admin can manage sync runs
CREATE POLICY "Admins can manage sync runs" ON public.sync_runs
  FOR ALL USING (is_admin());

CREATE POLICY "Service role can manage sync runs" ON public.sync_runs
  FOR ALL USING (auth.role() = 'service_role');

-- Admin can view sync errors
CREATE POLICY "Admins can view sync errors" ON public.sync_errors
  FOR SELECT USING (is_admin());

CREATE POLICY "Service role can manage sync errors" ON public.sync_errors
  FOR ALL USING (auth.role() = 'service_role');

-- Update cars_cache RLS
CREATE POLICY "Anyone can view active cars cache" ON public.cars_cache
  FOR SELECT USING (is_active = TRUE);

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION public.update_sync_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_runs_updated_at
  BEFORE UPDATE ON public.sync_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sync_runs_updated_at();