-- Fix search_path for the new functions to address security warnings
DROP FUNCTION IF EXISTS public.get_models_by_manufacturer(TEXT);
DROP FUNCTION IF EXISTS public.get_grades_by_model(TEXT);
DROP FUNCTION IF EXISTS public.get_trims_by_model(TEXT);

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_models_by_manufacturer(p_manufacturer_id TEXT)
RETURNS TABLE(id TEXT, name TEXT, car_count INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, car_count
  FROM public.car_models
  WHERE manufacturer_id = p_manufacturer_id AND is_active = true
  ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION public.get_grades_by_model(p_model_id TEXT)
RETURNS TABLE(id TEXT, name TEXT, car_count INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, car_count
  FROM public.car_grades
  WHERE model_id = p_model_id AND is_active = true
  ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION public.get_trims_by_model(p_model_id TEXT)
RETURNS TABLE(id TEXT, name TEXT, car_count INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, car_count
  FROM public.car_trims
  WHERE model_id = p_model_id AND is_active = true
  ORDER BY name;
$$;