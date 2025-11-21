#!/bin/bash

# Standalone Migration Deployment Script
# This script deploys all necessary components for standalone Supabase operation

set -e  # Exit on error

echo "🚀 Starting Standalone Migration Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Deploy database migrations
echo -e "${BLUE}📊 Step 1: Deploying database optimizations...${NC}"
supabase db push
echo -e "${GREEN}✅ Database migrations applied${NC}"
echo ""

# Step 2: Deploy Edge Functions
echo -e "${BLUE}🔧 Step 2: Deploying Edge Functions...${NC}"

echo "  Deploying full-db-sync..."
supabase functions deploy full-db-sync

echo "  Deploying supabase-cars-api..."
supabase functions deploy supabase-cars-api

echo -e "${GREEN}✅ Edge Functions deployed${NC}"
echo ""

# Step 3: List deployed functions
echo -e "${BLUE}📋 Step 3: Verifying deployments...${NC}"
supabase functions list
echo ""

# Step 4: Instructions for full sync
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1️⃣  Trigger the FULL DATABASE SYNC to download all cars:"
echo ""
echo "   Using Supabase Dashboard (SQL Editor):"
echo "   -------------------------------------"
echo "   Run this SQL command:"
echo ""
echo "   SELECT net.http_post("
echo "     url := 'https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/full-db-sync',"
echo "     headers := jsonb_build_object("
echo "       'Content-Type', 'application/json',"
echo "       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)"
echo "     ),"
echo "     body := jsonb_build_object('action', 'populate_all')"
echo "   );"
echo ""
echo "   OR using cURL:"
echo "   -------------"
echo "   curl -X POST \\"
echo "     https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/full-db-sync \\"
echo "     -H \"Authorization: Bearer YOUR_SERVICE_ROLE_KEY\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"action\": \"populate_all\"}'"
echo ""
echo "2️⃣  Monitor the sync progress:"
echo ""
echo "   SELECT sync_type, status, cars_synced, metadata"
echo "   FROM cars_sync_log"
echo "   WHERE sync_type = 'full_migration'"
echo "   ORDER BY started_at DESC LIMIT 1;"
echo ""
echo "3️⃣  Once complete, test the new API:"
echo ""
echo "   npm run dev"
echo ""
echo "4️⃣  Build and deploy the frontend:"
echo ""
echo "   npm run build"
echo ""
echo -e "${GREEN}✅ Deployment script completed!${NC}"
echo ""
echo "📖 For detailed instructions, see: MIGRATION_TO_STANDALONE.md"
echo ""
