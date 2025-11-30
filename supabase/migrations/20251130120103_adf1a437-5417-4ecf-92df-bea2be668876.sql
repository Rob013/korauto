-- One-time data cleanup: Remove cars without buy_now_price
-- This will delete approximately 9,716 cars that don't have a valid buy_now_price
DELETE FROM encar_cars_cache 
WHERE is_active = true 
  AND (buy_now_price IS NULL OR buy_now_price <= 0);