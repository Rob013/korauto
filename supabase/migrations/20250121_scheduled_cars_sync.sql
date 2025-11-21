-- Enable pg_cron extension for scheduled tasks
create extension if not exists pg_cron with schema extensions;

-- Create a function to call the cars-sync edge function
create or replace function public.trigger_cars_sync()
returns void
language plpgsql
security definer
as $$
declare
  v_url text;
  v_service_role_key text;
  v_response text;
begin
  -- Get the Supabase project URL
  v_url := current_setting('app.settings.supabase_url', true);
  if v_url is null then
    v_url := 'https://qtyyiqimkysmjnaocswe.supabase.co';
  end if;

  -- Get the service role key from vault or use environment variable
  v_service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Call the edge function
  perform
    net.http_post(
      url := v_url || '/functions/v1/cars-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(v_service_role_key, '')
      ),
      body := jsonb_build_object(
        'action', 'status_refresh',
        'type', 'incremental'
      )
    );
    
  -- Log the sync trigger
  raise notice 'Cars sync triggered at %', now();
  
exception
  when others then
    raise warning 'Failed to trigger cars sync: %', sqlerrm;
end;
$$;

-- Create a function to archive sold cars
create or replace function public.archive_sold_cars()
returns integer
language plpgsql
security definer
as $$
declare
  v_archived_count integer;
begin
  -- Archive cars that have been sold or are in archived status
  with archived_cars as (
    update cars_cache
    set 
      sale_status = 'archived',
      updated_at = now()
    where 
      (sale_status = 'sold' or sale_status = 'archived')
      and updated_at < now() - interval '7 days' -- Only archive if sold for more than 7 days
    returning id
  )
  select count(*) into v_archived_count from archived_cars;
  
  raise notice 'Archived % sold cars', v_archived_count;
  return v_archived_count;
  
exception
  when others then
    raise warning 'Failed to archive sold cars: %', sqlerrm;
    return 0;
end;
$$;

-- Create a combined function that runs both sync and archive
create or replace function public.scheduled_cars_maintenance()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_archived_count integer;
  v_result jsonb;
begin
  -- First, trigger the cars sync to fetch new cars
  perform public.trigger_cars_sync();
  
  -- Wait a bit for the sync to complete (this is asynchronous)
  perform pg_sleep(2);
  
  -- Then archive sold cars
  v_archived_count := public.archive_sold_cars();
  
  v_result := jsonb_build_object(
    'success', true,
    'archived_count', v_archived_count,
    'triggered_at', now()
  );
  
  return v_result;
  
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm,
      'triggered_at', now()
    );
end;
$$;

-- Schedule the cars maintenance to run every 6 hours
-- This runs at: 00:00, 06:00, 12:00, 18:00 UTC daily
select cron.schedule(
  'cars-sync-every-6-hours',
  '0 */6 * * *', -- Every 6 hours
  $$select public.scheduled_cars_maintenance()$$
);

-- Create a table to log sync history
create table if not exists public.cars_sync_log (
  id uuid default gen_random_uuid() primary key,
  sync_type text not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  status text default 'running',
  cars_synced integer default 0,
  cars_archived integer default 0,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Add RLS policies for sync log
alter table public.cars_sync_log enable row level security;

create policy "Allow service role to manage sync logs"
  on public.cars_sync_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Allow authenticated users to view sync logs"
  on public.cars_sync_log
  for select
  using (auth.role() = 'authenticated');

-- Create an index on sync log for quick lookups
create index if not exists idx_cars_sync_log_started_at 
  on public.cars_sync_log(started_at desc);

-- Grant necessary permissions
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
grant execute on function public.trigger_cars_sync() to service_role;
grant execute on function public.archive_sold_cars() to service_role;
grant execute on function public.scheduled_cars_maintenance() to service_role;

-- Add a comment explaining the schedule
comment on function public.scheduled_cars_maintenance is 
'Runs every 6 hours to sync new cars from the API and archive sold cars. Schedule: 00:00, 06:00, 12:00, 18:00 UTC.';
