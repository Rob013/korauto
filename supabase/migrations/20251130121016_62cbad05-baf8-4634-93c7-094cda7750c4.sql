-- Clean up cars with prices below 1,000,000 KRW (below realistic car prices)
-- This removes any remaining cars with default/invalid prices
DELETE FROM encar_cars_cache
WHERE buy_now_price IS NOT NULL 
  AND buy_now_price > 0 
  AND buy_now_price < 1000000;