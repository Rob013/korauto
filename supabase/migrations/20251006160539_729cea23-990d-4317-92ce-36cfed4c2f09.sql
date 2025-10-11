-- Fix security warning: Add search_path to remove_old_sold_cars function
-- This makes the function secure by explicitly setting the search path

DROP FUNCTION IF EXISTS public.remove_old_sold_cars();

CREATE OR REPLACE FUNCTION public.remove_old_sold_cars()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Delete cars that have been sold for more than 30 days
  DELETE FROM public.cars
  WHERE status = 'sold'
    AND is_archived = true
    AND sale_date < NOW() - INTERVAL '30 days';
  
  -- Also clean up from cars_cache
  DELETE FROM public.cars_cache
  WHERE (car_data->>'status' = 'sold' OR sale_status = 'sold')
    AND updated_at < NOW() - INTERVAL '30 days';
    
  RAISE NOTICE 'Cleaned up old sold cars';
END;
$$;