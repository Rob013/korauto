-- Fix search path security issues for new functions
ALTER FUNCTION public.cars_global_sorted(JSONB, TEXT, TEXT, INTEGER, INTEGER) SET search_path = public;
ALTER FUNCTION public.save_sync_checkpoint(TEXT, JSONB) SET search_path = public;
ALTER FUNCTION public.get_sync_checkpoint(TEXT) SET search_path = public;