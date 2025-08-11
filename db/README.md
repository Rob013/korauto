# Database Initialization

This directory contains the database initialization script and related automation for the korauto project.

## Files

### `supabase-init.sql`
A comprehensive SQL script that creates all essential tables for the car sync system, including:

- **User Management**: `profiles`, `user_roles` with admin/moderator/user roles
- **Car Data**: `cars` (main table), `cars_cache` (raw API data)
- **Sync Management**: `sync_status` for tracking sync operations
- **User Features**: `favorite_cars`, `inspection_requests`
- **Analytics**: `website_analytics`, `rate_limits`

The script includes:
- Table creation with proper constraints and indexes
- Row Level Security (RLS) policies for data protection
- Essential functions for user management and rate limiting
- Triggers for automatic timestamp updates

## GitHub Action

The `.github/workflows/daily-db-init.yml` workflow runs daily at **03:00 Europe/Belgrade** time and:

1. **Maintains Database Schema**: Runs the initialization script to ensure all tables exist
2. **Verifies Database State**: Checks that essential tables are present
3. **Triggers Data Sync**: Calls the car sync function after initialization
4. **Cleanup**: Removes old sync records and analytics data

### Required Secrets

The GitHub Action requires these repository secrets:

- `SUPABASE_PROJECT_ID`: Your Supabase project ID
- `SUPABASE_DB_PASSWORD`: Database password for direct connections
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Anonymous key for public access
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

### Manual Trigger

The workflow can also be triggered manually from the GitHub Actions tab using the "workflow_dispatch" trigger.

## Safety Features

- The SQL script uses `CREATE TABLE IF NOT EXISTS` to avoid errors
- `DROP POLICY IF EXISTS` ensures policies can be safely recreated
- The workflow includes verification steps to confirm successful execution
- Cleanup operations only remove old data (30+ days for sync records)

## Usage

The system is designed to run automatically, but you can also:

1. **Run locally**: Execute `psql -f db/supabase-init.sql` against your database
2. **Manual trigger**: Use the GitHub Actions interface to run the workflow
3. **Custom schedule**: Modify the cron expression in the workflow file