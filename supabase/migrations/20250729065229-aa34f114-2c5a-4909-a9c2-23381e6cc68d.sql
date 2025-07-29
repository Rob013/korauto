-- Create cars cache table for reliable car data access
CREATE TABLE IF NOT EXISTS public.cars_cache (
  id text PRIMARY KEY,
  api_id text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  price numeric,
  vin text,
  fuel text,
  transmission text,
  color text,
  condition text,
  lot_number text,
  mileage text,
  images jsonb DEFAULT '[]'::jsonb,
  car_data jsonb NOT NULL,
  lot_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_api_sync timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cars_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for cars cache
CREATE POLICY "Anyone can view cached cars" 
ON public.cars_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage cars cache" 
ON public.cars_cache 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_cache_api_id ON public.cars_cache(api_id);
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_model ON public.cars_cache(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year ON public.cars_cache(year);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price ON public.cars_cache(price);
CREATE INDEX IF NOT EXISTS idx_cars_cache_updated_at ON public.cars_cache(updated_at);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_cars_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cars_cache_updated_at
  BEFORE UPDATE ON public.cars_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cars_cache_updated_at();