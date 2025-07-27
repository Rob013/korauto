-- First, let's update the existing cars table to match API data
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS mileage INTEGER,
ADD COLUMN IF NOT EXISTS vin TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS transmission TEXT,
ADD COLUMN IF NOT EXISTS fuel TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS condition TEXT,
ADD COLUMN IF NOT EXISTS lot_number TEXT,
ADD COLUMN IF NOT EXISTS body_type TEXT,
ADD COLUMN IF NOT EXISTS drive_wheel TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS damage_main TEXT,
ADD COLUMN IF NOT EXISTS damage_second TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS seller TEXT,
ADD COLUMN IF NOT EXISTS seller_type TEXT,
ADD COLUMN IF NOT EXISTS current_bid NUMERIC,
ADD COLUMN IF NOT EXISTS buy_now_price NUMERIC,
ADD COLUMN IF NOT EXISTS final_bid NUMERIC,
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS watchers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS exterior_images TEXT[],
ADD COLUMN IF NOT EXISTS interior_images TEXT[],
ADD COLUMN IF NOT EXISTS video_urls TEXT[],
ADD COLUMN IF NOT EXISTS keys_available BOOLEAN;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON public.cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_year ON public.cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_price ON public.cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_updated_at ON public.cars(updated_at);

-- Create a sync status table to track API syncing
CREATE TABLE IF NOT EXISTS public.sync_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  records_synced INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on sync_status
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_status
CREATE POLICY "Admins can manage sync status" 
ON public.sync_status 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view sync status" 
ON public.sync_status 
FOR SELECT 
USING (true);