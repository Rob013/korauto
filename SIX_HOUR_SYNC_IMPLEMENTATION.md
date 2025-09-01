# Six-Hour Car Sync Implementation

## Summary
Updated the car sync system to run every 6 hours instead of daily or hourly schedules, as requested. This implementation fetches new cars from the API and deletes sold/archived cars every 6 hours.

## Changes Made

### 1. Database Migration (20250901000000-update-sync-to-6-hours.sql)
- **Unscheduled all existing cron jobs** to prevent conflicts:
  - `daily-api-sync`, `daily-cars-sync`, `hourly-api-sync`
  - `daily-sold-car-cleanup`, `cleanup-sold-cars`
  - Various other auto-sync jobs
- **Created new 6-hour cron schedules**:
  - `six-hourly-car-sync`: Runs every 6 hours (`0 */6 * * *`) at 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM
  - `six-hourly-cleanup`: Runs 30 minutes after sync (`30 */6 * * *`) to ensure cleanup happens after data sync
- **Enhanced sync_status table** with 6-hour tracking fields

### 2. Edge Function Updates (encar-sync/index.ts)
- **Added 6hour sync type support**: Sets 360-minute time window for 6-hour sync
- **Extended cleanup logic**: Both daily and 6hour sync types now trigger cleanup of old sold cars
- **Maintained backward compatibility**: Existing sync types (daily, full, hourly) still work

### 3. Comprehensive Testing (six-hour-sync.test.ts)
- **Cron schedule validation**: Verifies correct timing for sync and cleanup
- **Sync type handling**: Tests 6-hour time window calculation
- **Data processing**: Validates new cars and archived cars handling
- **Migration verification**: Confirms old jobs are unscheduled and new ones created

## Schedule Details

### Sync Times (Every 6 Hours)
- **00:00** (Midnight)
- **06:00** (6 AM) 
- **12:00** (Noon)
- **18:00** (6 PM)

### Cleanup Times (30 Minutes After Sync)
- **00:30** (12:30 AM)
- **06:30** (6:30 AM)
- **12:30** (12:30 PM) 
- **18:30** (6:30 PM)

## API Endpoints
- **Sync Endpoint**: `/functions/v1/encar-sync?type=6hour`
- **Parameters**: `{"scheduled": true, "type": "6hour", "minutes": 360}`

## Functionality
1. **Fetches new cars** from the API every 6 hours
2. **Archives sold cars** by processing archived lots from the API
3. **Removes old sold cars** that have been archived for more than 24 hours
4. **Updates car status** to maintain accurate inventory
5. **Logs all operations** for monitoring and debugging

## Benefits
- **More frequent updates** than daily sync (4 times per day vs 1)
- **Less resource intensive** than hourly sync (4 times per day vs 24)
- **Automatic cleanup** of sold/archived cars maintains data accuracy
- **Minimal changes** to existing codebase ensures stability
- **Comprehensive testing** ensures reliability

## Verification
All tests pass and the build is successful, confirming the implementation works correctly without breaking existing functionality.