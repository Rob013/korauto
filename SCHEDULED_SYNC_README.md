# Automated Cars Sync Schedule

This document explains the automated synchronization system for fetching new cars and archiving sold cars every 6 hours.

## Overview

The system automatically runs every 6 hours to:
1. **Fetch new cars** from the external API  
2. **Update existing cars** with the latest information
3. **Archive sold cars** that have been sold for more than 7 days

## Schedule

The sync runs at the following times (UTC):
- **00:00** (Midnight)
- **06:00** (6 AM)
- **12:00** (Noon)
- **18:00** (6 PM)

## Components

### 1. Database Migration (`supabase/migrations/20250121_scheduled_cars_sync.sql`)

This migration file sets up:
- **pg_cron extension** for scheduling tasks
- **trigger_cars_sync()** function to call the cars-sync edge function
- **archive_sold_cars()** function to archive cars sold for 7+ days
- **scheduled_cars_maintenance()** function that combines both operations
- **cars_sync_log** table to track sync history
- **Cron schedule** to run every 6 hours

### 2. Edge Function (`supabase/functions/cars-sync/index.ts`)

The updated edge function now includes:
- Logging support to track sync operations
- Support for scheduled vs manual sync differentiation
- Detailed metadata collection (Encar count, KB Chachacha count, etc.)
- Error tracking and reporting

### 3. Sync Log Table Structure

```sql
cars_sync_log (
  id uuid PRIMARY KEY,
  sync_type text NOT NULL,              -- 'incremental' or 'full'
  started_at timestamptz,
  completed_at timestamptz,
  status text DEFAULT 'running',         -- 'running', 'completed', 'failed'
  cars_synced integer DEFAULT 0,
  cars_archived integer DEFAULT 0,
  error_message text,
  metadata jsonb,                        -- Additional sync details
  created_at timestamptz
)
```

## How It Works

### Automatic Sync Flow

1. **Cron Trigger** (Every 6 hours)
   ```
   pg_cron schedules → scheduled_cars_maintenance()
   ```

2. **Cars Sync** (Function execution)
   ```
   scheduled_cars_maintenance() 
     → trigger_cars_sync()           # Fetches new/updated cars
     → archive_sold_cars()            # Archives old sold cars
   ```

3. **Logging** (Tracking)
   ```
   - Creates log entry with status='running'
   - Processes cars from API
   - Updates log with results
   - Records any errors if sync fails
   ```

### Manual Sync

You can also trigger a sync manually through the Supabase dashboard or API:

```bash
# Incremental sync (default)
curl -X POST https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "status_refresh", "type": "incremental"}'

# Full sync (processes more pages)
curl -X POST https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "status_refresh", "type": "full"}'
```

## Monitoring

### View Sync History

Query the sync log table to see recent syncs:

```sql
SELECT 
  id,
  sync_type,
  status,
  cars_synced,
  cars_archived,
  started_at,
  completed_at,
  (completed_at - started_at) as duration,
  error_message,
  metadata
FROM cars_sync_log
ORDER BY started_at DESC
LIMIT 20;
```

### Check Cron Schedule

```sql
SELECT * FROM cron.job WHERE jobname = 'cars-sync-every-6-hours';
```

### View Cron Logs

```sql
SELECT 
  jobname,
  runid,
  job_pid,
  status,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname = 'cars-sync-every-6-hours'
ORDER BY start_time DESC
LIMIT 10;
```

## Archive Policy

Cars are automatically archived when:
- Sale status is 'sold' or 'archived'
- AND the car has been in that status for more than 7 days

This keeps the active cars table clean while preserving historical data.

## Deployment

### Apply the Migration

```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard → Database → SQL Editor
```

### Deploy the Updated Edge Function

```bash
# Deploy the cars-sync function
supabase functions deploy cars-sync

# Verify it's working
supabase functions logs cars-sync
```

## Troubleshooting

### Check if Cron is Running

```sql
SELECT cron.schedule(
  'cars-sync-every-6-hours',
  '0 */6 * * *',
  $$SELECT public.scheduled_cars_maintenance()$$
);
```

### Manual Trigger for Testing

```sql
SELECT public.scheduled_cars_maintenance();
```

### Check Recent Errors

```sql
SELECT *
FROM cars_sync_log
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 5;
```

### Disable Auto-Sync (if needed)

```sql
SELECT cron.unschedule('cars-sync-every-6-hours');
```

### Re-enable Auto-Sync

```sql
SELECT cron.schedule(
  'cars-sync-every-6-hours',
  '0 */6 * * *',
  $$SELECT public.scheduled_cars_maintenance()$$
);
```

## Performance Considerations

- **Incremental sync** (default): Fetches only 1 page (~50 cars) - Fast, lightweight
- **Full sync**: Fetches up to 500 pages - Comprehensive but slower
- Rate limiting: Built-in delays to respect API limits
- Batching: Cars processed in batches to optimize database writes

## Security

- Edge function uses service role key for database access
- Sync log table has RLS policies enabled
- Only service role can write to sync logs
- Authenticated users can view sync history

## Support

For issues or questions, check:
- Supabase function logs: `supabase functions logs cars-sync`
- Database logs in Supabase Dashboard
- Sync history in `cars_sync_log` table
