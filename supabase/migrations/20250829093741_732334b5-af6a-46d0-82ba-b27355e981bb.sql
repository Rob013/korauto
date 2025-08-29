-- Fix sync_status table to use TEXT id instead of UUID for better semantic identifiers
ALTER TABLE public.sync_status ALTER COLUMN id TYPE TEXT;

-- Insert a default sync status record with our expected ID
INSERT INTO public.sync_status (
  id, 
  sync_type, 
  status, 
  current_page, 
  records_processed,
  created_at,
  last_activity_at
) VALUES (
  'cars-sync-main',
  'cars',
  'idle',
  0,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;