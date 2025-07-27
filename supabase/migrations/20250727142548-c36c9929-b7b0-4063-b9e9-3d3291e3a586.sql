-- Remove payment-related columns from inspection_requests table
ALTER TABLE public.inspection_requests 
DROP COLUMN IF EXISTS inspection_fee,
DROP COLUMN IF EXISTS payment_status;