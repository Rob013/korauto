-- Store inspection requests in the database
-- Update the inspection_requests table to include car information
ALTER TABLE public.inspection_requests 
ADD COLUMN IF NOT EXISTS car_make TEXT,
ADD COLUMN IF NOT EXISTS car_model TEXT,
ADD COLUMN IF NOT EXISTS car_year INTEGER;