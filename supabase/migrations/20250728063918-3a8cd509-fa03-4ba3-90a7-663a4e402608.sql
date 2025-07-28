-- Update cars table for AuctionAPIs.com integration
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS lot_number text,
ADD COLUMN IF NOT EXISTS domain_name text DEFAULT 'encar_com',
ADD COLUMN IF NOT EXISTS photo_urls text[],
ADD COLUMN IF NOT EXISTS source_api text DEFAULT 'auctionapis',
ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone DEFAULT now();

-- Create index for external_id for upserts
CREATE INDEX IF NOT EXISTS idx_cars_external_id ON public.cars(external_id);
CREATE INDEX IF NOT EXISTS idx_cars_domain_source ON public.cars(domain_name, source_api);
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON public.cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_year_price ON public.cars(year, price);

-- Update sync_metadata table structure
DROP TABLE IF EXISTS public.sync_metadata;
CREATE TABLE public.sync_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL, -- 'full_sync', 'incremental_sync'
  last_updated timestamp with time zone DEFAULT now(),
  total_records integer DEFAULT 0,
  synced_records integer DEFAULT 0,
  status text DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on sync_metadata
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sync_metadata
CREATE POLICY "Service role can manage sync metadata" 
ON public.sync_metadata 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view sync metadata" 
ON public.sync_metadata 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update last_synced_at
CREATE OR REPLACE FUNCTION public.update_car_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_synced_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cars table
DROP TRIGGER IF EXISTS trigger_update_car_sync ON public.cars;
CREATE TRIGGER trigger_update_car_sync
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_car_sync_timestamp();