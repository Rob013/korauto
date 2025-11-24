-- Migration: Create Encar Cache Tables
-- Description: Create tables for caching Encar API data to reduce API dependency

-- Table: encar_cars_cache
-- Stores cached car data from Encar API
create table if not exists public.encar_cars_cache (
  id bigserial primary key,
  
  -- Core identifiers
  vehicle_id bigint unique not null,
  lot_number text,
  vin text,
  
  -- Category info
  manufacturer_id int,
  manufacturer_name text,
  model_id int,
  model_name text,
  generation_id int,
  generation_name text,
  grade_name text,
  form_year text,
  year_month text,
  
  -- Specs
  mileage int,
  displacement int,
  fuel_type text,
  fuel_code text,
  transmission text,
  color_name text,
  body_type text,
  seat_count int,
  
  -- Pricing
  buy_now_price int,
  original_price int,
  
  -- Status
  advertisement_status text,
  vehicle_type text,
  
  -- Images (JSON array)
  photos jsonb default '[]'::jsonb,
  
  -- Options (JSON)
  options jsonb default '{}'::jsonb,
  
  -- Management info
  registered_date timestamptz,
  first_advertised_date timestamptz,
  modified_date timestamptz,
  view_count int default 0,
  subscribe_count int default 0,
  
  -- Condition flags
  has_accident boolean default false,
  inspection_available boolean default false,
  
  -- Dealer info
  dealer_name text,
  dealer_firm text,
  contact_address text,
  
  -- Cache metadata
  synced_at timestamptz default now(),
  data_hash text, -- For change detection
  is_active boolean default true,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_encar_cars_vehicle_id on encar_cars_cache(vehicle_id);
create index if not exists idx_encar_cars_manufacturer on encar_cars_cache(manufacturer_id);
create index if not exists idx_encar_cars_model on encar_cars_cache(model_id);
create index if not exists idx_encar_cars_generation on encar_cars_cache(generation_id);
create index if not exists idx_encar_cars_year on encar_cars_cache(form_year);
create index if not exists idx_encar_cars_fuel on encar_cars_cache(fuel_type);
create index if not exists idx_encar_cars_price on encar_cars_cache(buy_now_price);
create index if not exists idx_encar_cars_status on encar_cars_cache(advertisement_status) where is_active = true;
create index if not exists idx_encar_cars_synced on encar_cars_cache(synced_at);
create index if not exists idx_encar_cars_active on encar_cars_cache(is_active) where is_active = true;

-- Full-text search index
create index if not exists idx_encar_cars_search on encar_cars_cache 
  using gin(to_tsvector('english', 
    coalesce(manufacturer_name, '') || ' ' || 
    coalesce(model_name, '') || ' ' || 
    coalesce(grade_name, '')
  ));

-- Table: encar_sync_status
-- Tracks sync job status and history
create table if not exists public.encar_sync_status (
  id bigserial primary key,
  sync_started_at timestamptz not null,
  sync_completed_at timestamptz,
  status text not null check (status in ('running', 'completed', 'failed')),
  cars_processed int default 0,
  cars_added int default 0,
  cars_updated int default 0,
  cars_removed int default 0,
  error_message text,
  duration_seconds int,
  created_at timestamptz default now()
);

create index if not exists idx_sync_status_started on encar_sync_status(sync_started_at desc);
create index if not exists idx_sync_status_status on encar_sync_status(status);

-- Table: encar_filter_metadata
-- Stores filter counts for better performance
create table if not exists public.encar_filter_metadata (
  id bigserial primary key,
  filter_type text not null,
  filter_value text not null,
  car_count int default 0,
  parent_filter text default '',
  updated_at timestamptz default now()
);

-- Unique constraint (parent_filter defaults to empty string to avoid null issues)
create unique index if not exists idx_filter_meta_unique 
  on encar_filter_metadata(filter_type, filter_value, parent_filter);

create index if not exists idx_filter_meta_type on encar_filter_metadata(filter_type);
create index if not exists idx_filter_meta_value on encar_filter_metadata(filter_value);

-- Enable Row Level Security
alter table public.encar_cars_cache enable row level security;
alter table public.encar_sync_status enable row level security;
alter table public.encar_filter_metadata enable row level security;

-- RLS Policies: Allow public read access
create policy "Allow public read access to encar_cars_cache"
  on public.encar_cars_cache
  for select
  using (true);

create policy "Allow public read access to encar_sync_status"
  on public.encar_sync_status
  for select
  using (true);

create policy "Allow public read access to encar_filter_metadata"
  on public.encar_filter_metadata
  for select
  using (true);

-- RLS Policies: Allow service role full access (for sync script)
create policy "Allow service role full access to encar_cars_cache"
  on public.encar_cars_cache
  for all
  using (auth.role() = 'service_role');

create policy "Allow service role full access to encar_sync_status"
  on public.encar_sync_status
  for all
  using (auth.role() = 'service_role');

create policy "Allow service role full access to encar_filter_metadata"
  on public.encar_filter_metadata
  for all
  using (auth.role() = 'service_role');

-- Function: Update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger: Auto-update updated_at for encar_cars_cache
create trigger update_encar_cars_cache_updated_at
  before update on encar_cars_cache
  for each row
  execute function update_updated_at_column();

-- Comment on tables
comment on table public.encar_cars_cache is 'Cached car data from Encar API for improved performance';
comment on table public.encar_sync_status is 'Tracks Encar data synchronization job status and history';
comment on table public.encar_filter_metadata is 'Pre-computed filter counts for faster catalog filtering';
