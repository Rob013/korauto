-- ========================================
-- COMPLETE STANDALONE MIGRATION
-- Copy this ENTIRE file and paste it into Supabase SQL Editor
-- Then click RUN once
-- ========================================

-- Step 1: Enable pg_cron
create extension if not exists pg_cron with schema extensions;

-- Step 2: Create sync functions
create or replace function public.trigger_cars_sync()
returns void as $$
declare
  v_url text := 'https://qtyyiqimkysmjnaocswe.supabase.co';
  v_key text := current_setting('app.settings.service_role_key', true);
begin
  perform net.http_post(
    url := v_url || '/functions/v1/cars-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || coalesce(v_key, '')),
    body := jsonb_build_object('action', 'status_refresh', 'type', 'incremental')
  );
end;
$$ language plpgsql security definer;

create or replace function public.archive_sold_cars()
returns integer as $$
declare
  v_count integer;
begin
  with archived as (
    update cars_cache set sale_status = 'archived', updated_at = now()
    where (sale_status = 'sold' or sale_status = 'archived') and updated_at < now() - interval '7 days'
    returning id
  )
  select count(*) into v_count from archived;
  return v_count;
end;
$$ language plpgsql security definer;

create or replace function public.scheduled_cars_maintenance()
returns jsonb as $$
declare
  v_count integer;
begin
  perform public.trigger_cars_sync();
  v_count := public.archive_sold_cars();
  return jsonb_build_object('success', true, 'archived_count', v_count);
end;
$$ language plpgsql security definer;

-- Step 3: Schedule 6-hour sync
select cron.schedule('cars-sync-every-6-hours', '0 */6 * * *', $$select public.scheduled_cars_maintenance()$$);

-- Step 4: Create sync log table
create table if not exists public.cars_sync_log (
  id uuid default gen_random_uuid() primary key,
  sync_type text not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  status text default 'running',
  cars_synced integer default 0,
  error_message text,
  metadata jsonb default '{}'::jsonb
);

alter table public.cars_sync_log enable row level security;
create index if not exists idx_cars_sync_log_started_at on public.cars_sync_log(started_at desc);

-- Step 5: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_model ON cars_cache(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year ON cars_cache(year);
CREATE INDEX IF NOT EXISTS idx_cars_cache_price ON cars_cache(price);
CREATE INDEX IF NOT EXISTS idx_cars_cache_sale_status ON cars_cache(sale_status);

-- Step 6: Create materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS cars_manufacturer_model_stats AS
SELECT 
  make as manufacturer_name,
  model as model_name,
  COUNT(*) as car_count,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price) as avg_price
FROM cars_cache
WHERE sale_status NOT IN ('sold', 'archived') 
  AND price IS NOT NULL 
  AND price > 0
GROUP BY make, model;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cars_stats_make_model 
  ON cars_manufacturer_model_stats(manufacturer_name, model_name);

create or replace function refresh_car_stats()
returns void as $$
begin
  REFRESH MATERIALIZED VIEW CONCURRENTLY cars_manufacturer_model_stats;
end;
$$ language plpgsql security definer;

-- Step 7: Schedule hourly stats refresh
SELECT cron.schedule('refresh-car-stats-hourly', '0 * * * *', $$SELECT refresh_car_stats()$$);

-- Step 8: Grant permissions
grant execute on function public.trigger_cars_sync() to service_role;
grant execute on function public.archive_sold_cars() to service_role;
grant execute on function public.scheduled_cars_maintenance() to service_role;
grant execute on function refresh_car_stats() to service_role;
GRANT SELECT ON cars_manufacturer_model_stats TO authenticated, anon;

-- ========================================
-- DONE! Now run the full sync trigger below
-- ========================================
