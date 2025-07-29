-- Update sample inspection requests with real car IDs from cars_cache
UPDATE public.inspection_requests 
SET car_id = '5076118', 
    notes = 'Car: 2016 Kia Sorento - Request for full inspection'
WHERE customer_name = 'John Doe';

UPDATE public.inspection_requests 
SET car_id = '5076091', 
    notes = 'Car: 2015 Kia K3 - Pre-purchase inspection needed'
WHERE customer_name = 'Maria Smith';

UPDATE public.inspection_requests 
SET car_id = '5076246', 
    notes = 'Car: 2021 Genesis G80 - Insurance inspection required'
WHERE customer_name = 'Elena Prifti';

UPDATE public.inspection_requests 
SET car_id = '5076354', 
    notes = 'Car: 2019 Kia K7 - Routine inspection'
WHERE customer_name = 'Arben Krasniqi';