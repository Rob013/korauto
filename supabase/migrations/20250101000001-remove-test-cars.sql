-- Remove all emergency/test cars and disable sample car generation
-- This addresses the "18 test cars" issue mentioned in the problem statement

-- First, delete all existing test/emergency cars
DELETE FROM public.cars 
WHERE 
  id LIKE 'emergency-%' OR 
  id LIKE 'test-%' OR 
  id LIKE 'sample-%' OR 
  id LIKE 'mock-%' OR
  external_id LIKE 'emergency-%' OR 
  external_id LIKE 'test-%' OR 
  external_id LIKE 'sample-%' OR 
  external_id LIKE 'mock-%' OR
  -- Also remove cars that have generic unsplash images with no VIN (likely test data)
  (image_url LIKE '%unsplash.com%' AND (vin IS NULL OR length(vin) < 10));

-- Drop the sample car generation function to prevent future test car creation
DROP FUNCTION IF EXISTS generate_sample_cars(INTEGER);

-- Add a comment to track this cleanup
COMMENT ON TABLE public.cars IS 'Emergency/test cars removed on 2025-01-01 to fix brand filtering issue';