-- Add security improvements to inspection_requests table

-- 1. Add session tracking for better security
ALTER TABLE public.inspection_requests 
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Add data retention policy (auto-delete after 2 years)
ALTER TABLE public.inspection_requests 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '2 years');

-- 3. Add privacy consent tracking
ALTER TABLE public.inspection_requests 
ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT false;

-- 4. Create function to auto-anonymize old records
CREATE OR REPLACE FUNCTION public.anonymize_old_inspection_requests()
RETURNS INTEGER AS $$
DECLARE
  anonymized_count INTEGER;
BEGIN
  -- Anonymize personal data for records older than 1 year
  UPDATE public.inspection_requests 
  SET 
    customer_name = 'ANONYMIZED',
    customer_email = 'anonymized@example.com',
    customer_phone = 'ANONYMIZED',
    notes = 'Data anonymized for privacy'
  WHERE created_at < now() - INTERVAL '1 year'
    AND customer_name != 'ANONYMIZED';
  
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
  
  -- Delete records older than 2 years completely
  DELETE FROM public.inspection_requests 
  WHERE created_at < now() - INTERVAL '2 years';
  
  RETURN anonymized_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Improved RLS policies for better security
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.inspection_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.inspection_requests;

-- New more secure insert policy
CREATE POLICY "Secure inspection request submission"
ON public.inspection_requests
FOR INSERT
TO public
WITH CHECK (
  -- Rate limit: Only allow if no more than 3 requests from same IP in last hour
  (
    SELECT COUNT(*) 
    FROM public.inspection_requests 
    WHERE ip_address = inet(current_setting('request.header.x-forwarded-for', true))
      AND created_at > now() - INTERVAL '1 hour'
  ) < 3
  AND privacy_consent = true
  AND data_processing_consent = true
);

-- Add policy for users to view their own recent requests (if they provide session_id)
CREATE POLICY "Users can view their own recent requests"
ON public.inspection_requests
FOR SELECT
TO public
USING (
  session_id IS NOT NULL 
  AND session_id = current_setting('app.session_id', true)
  AND created_at > now() - INTERVAL '24 hours'
);

-- Schedule daily cleanup of old data
SELECT cron.schedule(
  'anonymize-inspection-requests',
  '0 2 * * *', -- Run at 2 AM daily
  'SELECT public.anonymize_old_inspection_requests();'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspection_requests_ip_created 
ON public.inspection_requests(ip_address, created_at);

CREATE INDEX IF NOT EXISTS idx_inspection_requests_session_created 
ON public.inspection_requests(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_inspection_requests_expires 
ON public.inspection_requests(expires_at);