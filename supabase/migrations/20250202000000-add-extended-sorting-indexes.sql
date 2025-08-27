-- Add indexes for extended sorting capabilities
-- This migration adds indexes for year, mileage, make, and created_at sorting

-- Year sorting indexes
CREATE INDEX IF NOT EXISTS cars_year_asc_idx ON public.cars (year ASC, id ASC)
WHERE year IS NOT NULL;

CREATE INDEX IF NOT EXISTS cars_year_desc_idx ON public.cars (year DESC, id ASC)
WHERE year IS NOT NULL;

-- Mileage sorting indexes
CREATE INDEX IF NOT EXISTS cars_mileage_asc_idx ON public.cars (mileage ASC, id ASC)
WHERE mileage IS NOT NULL;

CREATE INDEX IF NOT EXISTS cars_mileage_desc_idx ON public.cars (mileage DESC, id ASC)
WHERE mileage IS NOT NULL;

-- Make sorting indexes
CREATE INDEX IF NOT EXISTS cars_make_asc_idx ON public.cars (make ASC, id ASC)
WHERE make IS NOT NULL;

CREATE INDEX IF NOT EXISTS cars_make_desc_idx ON public.cars (make DESC, id ASC)
WHERE make IS NOT NULL;

-- Created_at sorting indexes (for recently_added/oldest_first)
CREATE INDEX IF NOT EXISTS cars_created_asc_idx ON public.cars (created_at ASC, id ASC)
WHERE created_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS cars_created_desc_idx ON public.cars (created_at DESC, id ASC)
WHERE created_at IS NOT NULL;

-- Composite indexes for common filter + sort combinations
-- Make + Price sorting (common use case)
CREATE INDEX IF NOT EXISTS cars_make_price_asc_idx ON public.cars (make, price_cents ASC, id ASC)
WHERE make IS NOT NULL AND price_cents IS NOT NULL;

CREATE INDEX IF NOT EXISTS cars_make_price_desc_idx ON public.cars (make, price_cents DESC, id ASC)
WHERE make IS NOT NULL AND price_cents IS NOT NULL;

-- Year range + Price sorting (common use case)
CREATE INDEX IF NOT EXISTS cars_year_price_asc_idx ON public.cars (year, price_cents ASC, id ASC)
WHERE year IS NOT NULL AND price_cents IS NOT NULL;

CREATE INDEX IF NOT EXISTS cars_year_price_desc_idx ON public.cars (year, price_cents DESC, id ASC)
WHERE year IS NOT NULL AND price_cents IS NOT NULL;