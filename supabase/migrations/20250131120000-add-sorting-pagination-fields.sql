-- Add normalized fields for global sorting and keyset pagination
-- Migration to fix sorting and pagination issues

-- 1. Add normalized price_cents and rank_score columns
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS price_cents BIGINT,
ADD COLUMN IF NOT EXISTS rank_score NUMERIC;

-- 2. Backfill price_cents from existing price field (converting to cents)
UPDATE public.cars 
SET price_cents = CASE 
  WHEN price IS NOT NULL THEN (price * 100)::BIGINT
  ELSE NULL
END
WHERE price_cents IS NULL;

-- 3. Backfill rank_score (using a combination of factors for demo)
-- Higher score = better ranking (newer cars, lower mileage, etc.)
UPDATE public.cars 
SET rank_score = CASE 
  WHEN year IS NOT NULL AND mileage IS NOT NULL THEN 
    (year - 2000) * 10 + GREATEST(0, (200000 - COALESCE(mileage, 100000)) / 10000.0)
  WHEN year IS NOT NULL THEN 
    (year - 2000) * 10
  ELSE 0
END
WHERE rank_score IS NULL;

-- 4. Create indexes for efficient keyset pagination
-- Price ascending with id tie-breaker
CREATE INDEX IF NOT EXISTS cars_price_asc_idx ON public.cars (price_cents ASC, id ASC)
WHERE price_cents IS NOT NULL;

-- Price descending with id tie-breaker  
CREATE INDEX IF NOT EXISTS cars_price_desc_idx ON public.cars (price_cents DESC, id ASC)
WHERE price_cents IS NOT NULL;

-- Rank ascending with id tie-breaker
CREATE INDEX IF NOT EXISTS cars_rank_asc_idx ON public.cars (rank_score ASC, id ASC)
WHERE rank_score IS NOT NULL;

-- Rank descending with id tie-breaker
CREATE INDEX IF NOT EXISTS cars_rank_desc_idx ON public.cars (rank_score DESC, id ASC)
WHERE rank_score IS NOT NULL;

-- 5. Filter indexes for common use cases
CREATE INDEX IF NOT EXISTS cars_make_idx ON public.cars (make) 
WHERE is_active = true AND is_archived = false;

CREATE INDEX IF NOT EXISTS cars_year_idx ON public.cars (year)
WHERE is_active = true AND is_archived = false;

CREATE INDEX IF NOT EXISTS cars_fuel_idx ON public.cars (fuel)
WHERE is_active = true AND is_archived = false;

-- 6. Composite index for frequently filtered fields
CREATE INDEX IF NOT EXISTS cars_active_filter_idx ON public.cars (is_active, is_archived, status, make, year)
WHERE is_active = true AND is_archived = false;

-- 7. Add the same columns to staging table for consistency
ALTER TABLE public.cars_staging 
ADD COLUMN IF NOT EXISTS price_cents BIGINT,
ADD COLUMN IF NOT EXISTS rank_score NUMERIC;