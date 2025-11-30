-- Migration: Enhance Encar Cache with Full API Data
-- Description: Add all missing fields to capture complete car data from API

-- Price fields (all as integer for KRW)
ALTER TABLE public.encar_cars_cache
  ADD COLUMN IF NOT EXISTS bid_price integer,
  ADD COLUMN IF NOT EXISTS final_bid_price integer,
  ADD COLUMN IF NOT EXISTS estimate_repair_price integer,
  ADD COLUMN IF NOT EXISTS pre_accident_price integer,
  ADD COLUMN IF NOT EXISTS clean_wholesale_price integer,
  ADD COLUMN IF NOT EXISTS actual_cash_value integer;

-- Detailed odometer
ALTER TABLE public.encar_cars_cache
  ADD COLUMN IF NOT EXISTS mileage_mi integer,
  ADD COLUMN IF NOT EXISTS odometer_status text;

-- Lot & sale tracking
ALTER TABLE public.encar_cars_cache
  ADD COLUMN IF NOT EXISTS lot_external_id text,
  ADD COLUMN IF NOT EXISTS lot_status text,
  ADD COLUMN IF NOT EXISTS sale_date timestamptz,
  ADD COLUMN IF NOT EXISTS sale_date_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS bid_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS buy_now_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS final_bid_updated_at timestamptz;

-- Damage & condition
ALTER TABLE public.encar_cars_cache
  ADD COLUMN IF NOT EXISTS damage_main text,
  ADD COLUMN IF NOT EXISTS damage_second text,
  ADD COLUMN IF NOT EXISTS airbags_status text,
  ADD COLUMN IF NOT EXISTS grade_iaai text,
  ADD COLUMN IF NOT EXISTS detailed_title text,
  ADD COLUMN IF NOT EXISTS condition_name text;

-- Seller
ALTER TABLE public.encar_cars_cache
  ADD COLUMN IF NOT EXISTS seller_name text,
  ADD COLUMN IF NOT EXISTS seller_type text;

-- Images metadata
ALTER TABLE public.encar_cars_cache
  ADD COLUMN IF NOT EXISTS images_id bigint,
  ADD COLUMN IF NOT EXISTS photos_small jsonb;

-- Engine details
ALTER TABLE public.encar_cars_cache
  ADD COLUMN IF NOT EXISTS engine_id integer,
  ADD COLUMN IF NOT EXISTS engine_name text,
  ADD COLUMN IF NOT EXISTS drive_wheel text;

-- Indexes for new queryable fields
CREATE INDEX IF NOT EXISTS idx_encar_lot_status ON public.encar_cars_cache(lot_status) WHERE lot_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_encar_sale_date ON public.encar_cars_cache(sale_date) WHERE sale_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_encar_condition ON public.encar_cars_cache(condition_name) WHERE condition_name IS NOT NULL;

-- Comment on new columns
COMMENT ON COLUMN public.encar_cars_cache.bid_price IS 'Current bid price in KRW';
COMMENT ON COLUMN public.encar_cars_cache.final_bid_price IS 'Final bid price in KRW (after sale)';
COMMENT ON COLUMN public.encar_cars_cache.odometer_status IS 'Odometer status: actual, exempt, TMU';
COMMENT ON COLUMN public.encar_cars_cache.lot_status IS 'Lot status: sale, sold, etc.';
