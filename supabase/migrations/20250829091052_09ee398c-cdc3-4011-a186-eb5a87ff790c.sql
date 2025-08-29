-- Ensure cars_cache table has all necessary fields for proper sorting
-- Add price_cents and rank_score columns if they don't exist
ALTER TABLE cars_cache 
ADD COLUMN IF NOT EXISTS price_cents BIGINT,
ADD COLUMN IF NOT EXISTS rank_score REAL DEFAULT 0;

-- Update existing records to have price_cents if price exists
UPDATE cars_cache 
SET price_cents = price * 100 
WHERE price IS NOT NULL AND price_cents IS NULL;

-- Update existing records to have rank_score based on price
UPDATE cars_cache 
SET rank_score = CASE 
  WHEN price IS NOT NULL AND price > 0 THEN (1.0 / price) * 1000000 
  ELSE 0 
END
WHERE rank_score IS NULL OR rank_score = 0;

-- Ensure mileage is stored as integer for proper sorting
-- First, try to convert existing string mileage to integer km values
UPDATE cars_cache 
SET mileage = CASE 
  WHEN mileage IS NOT NULL AND mileage LIKE '%km' THEN 
    CAST(REPLACE(REPLACE(mileage, ',', ''), ' km', '') AS INTEGER)
  WHEN mileage IS NOT NULL AND mileage LIKE '%mi' THEN 
    CAST(REPLACE(REPLACE(mileage, ',', ''), ' mi', '') AS INTEGER) * 1.60934
  ELSE NULL
END::INTEGER
WHERE mileage IS NOT NULL AND mileage ~ '^[0-9,]+ (km|mi)$';

-- Create indexes for efficient sorting on large dataset
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents_id ON cars_cache (price_cents ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_rank_score_id ON cars_cache (rank_score DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year_id ON cars_cache (year ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_id ON cars_cache (make ASC, id ASC);

-- Add compound indexes for filtered sorting
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_price ON cars_cache (make, price_cents ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_fuel_price ON cars_cache (fuel, price_cents ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year_range_price ON cars_cache (year, price_cents ASC, id ASC);