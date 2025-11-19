-- Add indexes to cars_cache for better query performance
CREATE INDEX IF NOT EXISTS idx_cars_cache_sale_status ON cars_cache(sale_status);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents ON cars_cache(price_cents) WHERE price_cents > 0;
CREATE INDEX IF NOT EXISTS idx_cars_cache_rank_score ON cars_cache(rank_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_cars_cache_make ON cars_cache(make);
CREATE INDEX IF NOT EXISTS idx_cars_cache_model ON cars_cache(model);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year ON cars_cache(year);
CREATE INDEX IF NOT EXISTS idx_cars_cache_updated_at ON cars_cache(updated_at DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_cars_cache_active_priced ON cars_cache(sale_status, price_cents, rank_score DESC) 
WHERE sale_status NOT IN ('sold', 'archived') AND price_cents > 0;

-- Index for make + model filtering
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_model ON cars_cache(make, model, year DESC);