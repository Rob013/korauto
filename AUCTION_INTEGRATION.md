# SSancar Auction Integration

This system automatically scrapes and displays auction cars from SSancar website with full details, images, specs, and options.

## Features

- ✅ **Full Car Details**: All 500+ cars with complete specifications
- ✅ **Multiple Images**: All available images for each car
- ✅ **Auction Schedule**: Live countdown timer and schedule display
- ✅ **Auto-Refresh**: Automatically checks for updates 3-4 minutes after upload time
- ✅ **Excel Export**: Direct download link to SSancar's Excel file

## Manual Update

To manually update the auction data:

```bash
node scripts/scrape-ssancar.js
```

Or use the shell script:

```bash
./scripts/update-auctions.sh
```

## Automated Updates

### Option 1: Cron Job (Linux/Mac)

Add to your crontab (`crontab -e`):

```bash
# Update auction data every hour
0 * * * * cd /path/to/korauto && node scripts/scrape-ssancar.js

# Or use the shell script
0 * * * * cd /path/to/korauto && ./scripts/update-auctions.sh
```

### Option 2: GitHub Actions

The auto-refresh feature in the frontend will reload the page 3-4 minutes after the upload time shown in the auction schedule. This ensures users always see fresh data.

## How It Works

1. **Scraper** (`scripts/scrape-ssancar.js`):
   - Fetches auction schedule from SSancar main page
   - Gets ALL cars from the current week's auction (up to 500)
   - For each car, fetches:
     - All images
     - Complete specifications table
     - All options/features
   - Saves everything to `src/data/auctions.json`

2. **Frontend** (`src/pages/Auctions.tsx`):
   - Loads auction data and schedule
   - Displays live countdown timer
   - Shows all cars in a grid
   - Auto-refreshes 3-4 minutes after upload time
   - Provides Excel download button

3. **Detail Page** (`src/pages/AuctionCarDetails.tsx`):
   - Shows all images for a car
   - Displays complete specs table
   - Lists all options
   - No need to leave the site

## Data Structure

The `auctions.json` file has this structure:

```json
{
  "auctionSchedule": {
    "weekNo": "1",
    "uploadTime": "2025-11-24 7:00PM",
    "bidStartTime": "2025-11-25  1:00PM",
    "bidEndTime": "2025-11-25T17:00:00+09:00",
    "lastUpdated": "2025-11-24T09:50:00Z"
  },
  "cars": [
    {
      "id": "1643905",
      "stock_no": "0001",
      "name": "K3 (G) 1.6 Prestige",
      "price": 7818,
      "detail_url": "https://www.ssancar.com/page/car_view.php?car_no=1643905",
      "make": "K3",
      "model": "K3 (G) 1.6 Prestige",
      "images": ["https://imgmk.lotteautoauction.net/..."],
      "specs": {
        "Year": "2021",
        "Mileage": "89,123 Km",
        "Transmission": "Automatic",
        "Fuel": "Gasoline",
        ...
      },
      "options": ["Navigation", "Sunroof", ...],
      "auction_date": "2025-11-24"
    }
  ],
  "totalCars": 500,
  "lastUpdated": "2025-11-24T09:50:00Z"
}
```

## Tips

- **Performance**: The scraper fetches each car's detail page, so it takes time (about 2-3 seconds per car). For 500 cars, expect ~25-30 minutes.
- **Rate Limiting**: There's a 300ms delay between requests to be respectful to SSancar's servers.
- **Large File**: The JSON file with 500 cars is ~750KB, but gzips down to ~46KB for web delivery.
- **Auto-Refresh**: The page will automatically reload to show fresh data based on the auction schedule.

## Troubleshooting

If scraping fails:
1. Check your internet connection
2. Verify SSancar website is accessible
3. Check if SSancar changed their HTML structure (regex patterns may need updating)
4. Look at console logs for specific errors
