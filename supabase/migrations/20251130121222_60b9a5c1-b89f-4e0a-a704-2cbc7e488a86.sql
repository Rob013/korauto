-- Clean up ALL cars with invalid/missing prices
-- Remove cars without buy_now_price or with unrealistic prices (below 1,000,000 KRW)
DELETE FROM encar_cars_cache
WHERE buy_now_price IS NULL 
   OR buy_now_price = 0 
   OR buy_now_price < 1000000;

-- Remove ALL sold/archived cars by status (immediate removal)
DELETE FROM encar_cars_cache
WHERE advertisement_status IN ('SOLD', 'ARCHIVED', 'COMPLETED', 'INACTIVE', 'CLOSED', 'FINISHED', '판매완료', '삭제됨');

-- Remove ALL inactive cars
DELETE FROM encar_cars_cache
WHERE is_active = false;