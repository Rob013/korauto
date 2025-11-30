#!/bin/bash

# Load environment variables from .env if present
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Check for required variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
  echo "Please ensure these are set in your .env file"
  exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -E 's/https:\/\/([a-z0-9]+)\.supabase\.co.*/\1/')
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/encar-sync"

echo "🚀 Triggering Encar Sync..."
echo "URL: $FUNCTION_URL"

# Trigger the function
curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "incremental", "minutes": 60}'

echo -e "\n\n✅ Request sent. Check the Supabase dashboard for logs or run 'npm run verify-sync' to check status."
