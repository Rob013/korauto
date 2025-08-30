# Edge Function Deployment Guide

## Quick Fix for "AI Coordinator Failed" Issue

If you're seeing the error: **"Edge Function not accessible - the cars-sync function may not be deployed to Supabase"**, follow these steps:

### Prerequisites
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

### Deploy Edge Functions

1. **Link your project** (if not already done):
   ```bash
   supabase link --project-ref qtyyiqimkysmjnaocswe
   ```

2. **Set required environment variables** in Supabase dashboard:
   - Go to Settings > Edge Functions > Environment Variables
   - Add these variables:
     - `SUPABASE_URL`: `https://qtyyiqimkysmjnaocswe.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
     - `AUCTIONS_API_KEY`: Your auctions API key

3. **Deploy the cars-sync function**:
   ```bash
   supabase functions deploy cars-sync
   ```

4. **Verify deployment**:
   ```bash
   supabase functions list
   ```

### Performance-Optimized cars-sync Function

The cars-sync function has been optimized for maximum speed targeting **30-minute sync completion**:

#### Performance Parameters
- **PAGE_SIZE**: 200 (6.7x larger than before)
- **BATCH_SIZE**: 500 (20x larger than before) 
- **Retry delays**: Reduced by 60-80% for faster recovery
- **Progress updates**: Every 15 seconds for real-time monitoring
- **Processing pauses**: Minimized to 10ms between batches

#### Expected Performance
- **Target**: Complete sync in ≤30 minutes
- **Throughput**: ~25,000+ cars/minute in optimal conditions
- **API efficiency**: 6.7x fewer API requests
- **Database efficiency**: 20x larger batch writes

### Troubleshooting

#### Common Issues

1. **Environment Variables Missing**
   - Error: "Configuration error: Missing required environment variables"
   - Solution: Set all three environment variables in Supabase dashboard

2. **Authentication Errors**
   - Error: "Authentication failed: Invalid API credentials"
   - Solution: Check your `AUCTIONS_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`

3. **Function Not Found**
   - Error: "Edge Function not found - cars-sync function may not be deployed"
   - Solution: Run `supabase functions deploy cars-sync`

4. **Timeout Issues**
   - Error: "Connection test timed out"
   - Solution: Function is not responding, check deployment and environment variables

### Alternative Deployment Methods

If you can't use Supabase CLI, you can:

1. **Use Supabase Dashboard**:
   - Go to Edge Functions in your Supabase dashboard
   - Create new function named `cars-sync`
   - Copy the content from `supabase/functions/cars-sync/index.ts`

2. **Use GitHub Actions** (if configured):
   - Functions will auto-deploy on push to main branch

### Verification

After deployment, the AI Coordinator should:
1. Successfully connect to the edge function
2. Show "✅ AI Coordinator: Sync initiated successfully"
3. Begin high-speed sync processing with real-time progress updates

### Performance Monitoring

Monitor sync performance in real-time:
- Progress updates every 15 seconds
- Rate displayed as cars/minute
- Page processing every 5 pages
- Optimized error recovery with minimal delays

The optimized function targets completing all remaining cars within 30 minutes through aggressive performance tuning while maintaining reliability.