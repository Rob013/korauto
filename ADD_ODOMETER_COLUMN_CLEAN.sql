-- ==============================================================
-- ADD ODOMETER COLUMN TO cars_cache
-- This migration adds a JSONB column `odometer` (with a `km` field)
-- and backfills it from any existing `odometer_km` column if present.
-- ==============================================================

-- Add the column if it does not exist
ALTER TABLE public.cars_cache
ADD COLUMN IF NOT EXISTS odometer jsonb;

-- Backfill from an existing numeric column (optional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'cars_cache' AND column_name = 'odometer_km') THEN
    UPDATE public.cars_cache
    SET odometer = jsonb_build_object('km', odometer_km)
    WHERE odometer_km IS NOT NULL;
  END IF;
END $$;

-- Migration complete.
-- ==============================================================
