#!/bin/bash

# Monitor Encar Cache Sync Progress

echo "📊 Checking sync progress..."
echo ""

# Run the debug script
npx tsx scripts/debug-cache.ts

echo ""
echo "💡 Tip: Run this command again to see updated progress"
echo "   Or watch continuously with: watch -n 10 'npx tsx scripts/debug-cache.ts'"
