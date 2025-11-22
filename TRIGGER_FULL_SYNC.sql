-- ========================================
-- TRIGGER FULL DATABASE SYNC
-- Run this AFTER the COMPLETE_MIGRATION.sql succeeds
-- This downloads ALL 50,000+ cars (takes 30-60 minutes)
-- ========================================

SELECT net.http_post(
  url := 'https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/full-db-sync',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
  ),
  body := jsonb_build_object('action', 'populate_all')
);
