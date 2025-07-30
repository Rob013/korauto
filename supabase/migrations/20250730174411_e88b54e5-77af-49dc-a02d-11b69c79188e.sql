-- Add archived column to inspection_requests table
ALTER TABLE public.inspection_requests 
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

-- Add archived_at timestamp column to track when requests were archived
ALTER TABLE public.inspection_requests 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when filtering archived requests
CREATE INDEX idx_inspection_requests_archived ON public.inspection_requests(archived);
CREATE INDEX idx_inspection_requests_status_archived ON public.inspection_requests(status, archived);

-- Update RLS policies to handle archived requests
-- Admins can still view archived requests
-- No changes needed to existing policies as they already allow admin access