#!/bin/bash

# SSancar Auction Auto-Update Script
# This script checks and updates auction data at the right time

echo "🔍 SSancar Auction Auto-Update"
echo "=============================="

# Run the scraper
echo "📡 Fetching latest auction data from SSan car..."
node scripts/scrape-ssancar.js

# Check if scraping was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully updated auction data"
    echo "📊 Data saved to src/data/auctions.json"
    
    # Optionally, trigger a build
    # echo "🔨 Building application..."
    # npm run build
    
    # Optionally, commit and push changes    # echo "📤 Committing changes..."
    # git add src/data/auctions.json
    # git commit -m "Auto-update auction data from SSancar"
    # git push
else
    echo "❌ Failed to update auction data"
    exit 1
fi
