-- Add enhanced sync tracking fields for 100% completion monitoring
alter table sync_status 
add column if not exists api_total_records integer,
add column if not exists completion_percentage integer,
add column if not exists last_api_check timestamp with time zone;

-- Add comment for documentation
comment on column sync_status.api_total_records is 'Total records available from API for sync completion tracking';
comment on column sync_status.completion_percentage is 'Completion percentage based on API total records';
comment on column sync_status.last_api_check is 'Last time API total was checked';