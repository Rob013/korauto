-- Create tables for filter options with proper relationships
CREATE TABLE IF NOT EXISTS public.manufacturers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  car_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.car_models (
  id TEXT PRIMARY KEY,
  manufacturer_id TEXT NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  car_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.car_grades (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
  manufacturer_id TEXT NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  car_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.car_trims (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
  manufacturer_id TEXT NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  car_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_trims ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view manufacturers" ON public.manufacturers FOR SELECT USING (true);
CREATE POLICY "Public can view models" ON public.car_models FOR SELECT USING (true);
CREATE POLICY "Public can view grades" ON public.car_grades FOR SELECT USING (true);
CREATE POLICY "Public can view trims" ON public.car_trims FOR SELECT USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage manufacturers" ON public.manufacturers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage models" ON public.car_models FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage grades" ON public.car_grades FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage trims" ON public.car_trims FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_models_manufacturer ON public.car_models(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_car_grades_model ON public.car_grades(model_id);
CREATE INDEX IF NOT EXISTS idx_car_grades_manufacturer ON public.car_grades(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_car_trims_model ON public.car_trims(model_id);
CREATE INDEX IF NOT EXISTS idx_car_trims_manufacturer ON public.car_trims(manufacturer_id);

-- Create function to get models by manufacturer
CREATE OR REPLACE FUNCTION public.get_models_by_manufacturer(p_manufacturer_id TEXT)
RETURNS TABLE(id TEXT, name TEXT, car_count INTEGER)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, car_count
  FROM public.car_models
  WHERE manufacturer_id = p_manufacturer_id AND is_active = true
  ORDER BY name;
$$;

-- Create function to get grades by model
CREATE OR REPLACE FUNCTION public.get_grades_by_model(p_model_id TEXT)
RETURNS TABLE(id TEXT, name TEXT, car_count INTEGER)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, car_count
  FROM public.car_grades
  WHERE model_id = p_model_id AND is_active = true
  ORDER BY name;
$$;

-- Create function to get trims by model
CREATE OR REPLACE FUNCTION public.get_trims_by_model(p_model_id TEXT)
RETURNS TABLE(id TEXT, name TEXT, car_count INTEGER)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, car_count
  FROM public.car_trims
  WHERE model_id = p_model_id AND is_active = true
  ORDER BY name;
$$;