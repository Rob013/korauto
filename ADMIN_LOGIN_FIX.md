# Admin Login Setup Guide

This guide explains how to set up and fix admin login issues in the KORAUTO application.

## Quick Fix

If you can't log in as admin, follow these steps:

### Option 1: Create Admin User (Recommended)

```bash
# Create the default admin user
npm run admin-setup create

# Or create with custom credentials
npm run admin-setup create admin@korauto.com mypassword
```

### Option 2: Promote Existing User

If you already have a user account:

```bash
# Promote existing user to admin
npm run admin-setup promote your-email@example.com
```

### Option 3: Test Admin Login

```bash
# Test if admin login is working
npm run admin-setup test

# Or test with custom credentials
npm run admin-setup test admin@korauto.com mypassword
```

## Default Admin Credentials

- **Email**: `admin@korauto.com`
- **Password**: `KorAuto2024!`

## How Admin Authentication Works

1. **User Creation**: Admin users must be created through Supabase Auth (not directly in database)
2. **Role Assignment**: When a user with email `admin@korauto.com` signs up, they automatically get admin role
3. **Login Process**: 
   - User authenticates with Supabase
   - System checks if user has admin role using `is_admin()` function
   - If admin, user is redirected to dashboard; otherwise access is denied

## Troubleshooting

### "Invalid login credentials" error
- The user doesn't exist or password is wrong
- Solution: Create the admin user using the setup script

### "Access denied: Admin privileges required" error
- User exists but doesn't have admin role
- Solution: Promote the user to admin using the setup script

### "Failed to verify admin permissions" error
- There's an issue with the `is_admin()` database function
- Solution: Run the latest migration to fix database functions

### "Failed to fetch" error
- Network connectivity issue with Supabase
- Check your internet connection and Supabase service status
- Verify environment variables are correct

## Environment Setup

Make sure these environment variables are set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For admin setup script
```

## Manual Database Fix

If the automated script doesn't work, you can manually run these SQL commands in your Supabase dashboard:

```sql
-- Promote a user to admin (replace with actual user email)
SELECT promote_to_admin('your-email@example.com');

-- Check if user has admin role
SELECT has_role(auth.uid(), 'admin'::app_role);
```

## Getting Help

If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase project is active and accessible
3. Make sure you've run all database migrations
4. Contact support with the specific error message you're seeing