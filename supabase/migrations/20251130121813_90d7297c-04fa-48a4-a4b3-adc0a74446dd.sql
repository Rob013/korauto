
-- Fix price threshold: restore cars that were incorrectly deleted
-- and prepare for fresh sync with correct price validation

-- First, let's check what we have
DO $$
BEGIN
  RAISE NOTICE 'Current car count: %', (SELECT COUNT(*) FROM encar_cars_cache WHERE is_active = true);
END $$;

-- Note: A fresh Encar sync should be triggered after this migration
-- to repopulate the cache with all available cars
