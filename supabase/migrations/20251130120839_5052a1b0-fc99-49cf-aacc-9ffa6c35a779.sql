-- Remove cars with prices that result in ~2,502 EUR or less
-- EUR price = (KRW / 1400) + 2500
-- For final EUR <= 2,505: KRW <= 7,000
-- Remove all cars with KRW prices below realistic threshold (700,000 KRW = ~3,000 EUR)
DELETE FROM encar_cars_cache
WHERE buy_now_price IS NOT NULL 
  AND buy_now_price < 700000;