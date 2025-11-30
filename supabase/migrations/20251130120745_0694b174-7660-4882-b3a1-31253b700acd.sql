-- Remove cars with default/invalid price around 2502 EUR
-- This corresponds to very low KRW prices (~2800 KRW or less)
-- Any car priced below 5000 KRW is clearly invalid
DELETE FROM encar_cars_cache
WHERE buy_now_price IS NOT NULL 
  AND buy_now_price > 0 
  AND buy_now_price <= 5000;