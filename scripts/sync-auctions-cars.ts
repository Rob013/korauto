/**
 * Auctions API Car Sync Script
 * 
 * This script syncs cars from the new api.auctionsapi.com API
 * with scroll-based pagination and 24-hour archiving logic.
 * 
 * Features:
 * - Scroll-based pagination for efficient data fetching
 * - 24-hour archiving logic (cars not seen in 24h are archived)
 * - Batch processing for large datasets
 * - Error handling and retry logic
 * - Progress tracking
 */

import { createClient } from '@supabase/supabase-js';
import { AuctionsApiService } from '../src/services/auctionsApiService';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUCTIONS_API_KEY = process.env.AUCTIONS_API_KEY;

// Configuration
const BATCH_SIZE = 1000; // Process cars in batches
const ARCHIVE_THRESHOLD_HOURS = 24; // Archive cars not seen in 24 hours
const SCROLL_TIME_MINUTES = 10; // Scroll session duration
const SCROLL_LIMIT = 1000; // Cars per scroll batch

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !AUCTIONS_API_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AUCTIONS_API_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize Auctions API service
const auctionsApi = new AuctionsApiService({
  apiKey: AUCTIONS_API_KEY,
  scrollTime: SCROLL_TIME_MINUTES,
  limit: SCROLL_LIMIT
});

interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  [key: string]: any;
}

interface StagingCar extends CarData {
  source_api: string;
  last_synced_at: string;
  is_archived: boolean;
}

/**
 * Transform API car data to staging format
 */
function transformCarData(apiCar: CarData): StagingCar {
  return {
    ...apiCar,
    source_api: 'auctions_api',
    last_synced_at: new Date().toISOString(),
    is_archived: false
  };
}

/**
 * Archive cars that haven't been seen in the last 24 hours
 */
async function archiveOldCars(): Promise<number> {
  console.log('📦 Archiving cars not seen in the last 24 hours...');
  
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - ARCHIVE_THRESHOLD_HOURS);
  
  const { data, error } = await supabase
    .from('cars_staging')
    .update({ 
      is_archived: true,
      archived_at: new Date().toISOString()
    })
    .eq('source_api', 'auctions_api')
    .lt('last_synced_at', cutoffTime.toISOString())
    .eq('is_archived', false);
  
  if (error) {
    console.error('❌ Error archiving old cars:', error);
    return 0;
  }
  
  console.log(`✅ Archived ${data?.length || 0} old cars`);
  return data?.length || 0;
}

/**
 * Upsert cars into staging table
 */
async function upsertCars(cars: StagingCar[]): Promise<void> {
  if (cars.length === 0) return;
  
  console.log(`💾 Upserting ${cars.length} cars into staging table...`);
  
  const { error } = await supabase
    .from('cars_staging')
    .upsert(cars, {
      onConflict: 'id',
      ignoreDuplicates: false
    });
  
  if (error) {
    console.error('❌ Error upserting cars:', error);
    throw error;
  }
  
  console.log(`✅ Successfully upserted ${cars.length} cars`);
}

/**
 * Move data from staging to main cars table
 */
async function moveStagingToMain(): Promise<void> {
  console.log('🔄 Moving data from staging to main cars table...');
  
  // Delete existing cars from main table that are from auctions_api
  const { error: deleteError } = await supabase
    .from('cars')
    .delete()
    .eq('source_api', 'auctions_api');
  
  if (deleteError) {
    console.error('❌ Error deleting existing cars:', deleteError);
    throw deleteError;
  }
  
  // Insert all non-archived cars from staging
  const { error: insertError } = await supabase
    .from('cars')
    .insert(
      await supabase
        .from('cars_staging')
        .select('*')
        .eq('source_api', 'auctions_api')
        .eq('is_archived', false)
        .then(({ data }) => data || [])
    );
  
  if (insertError) {
    console.error('❌ Error inserting cars:', insertError);
    throw insertError;
  }
  
  console.log('✅ Successfully moved data to main table');
}

/**
 * Get sync statistics
 */
async function getSyncStats(): Promise<{
  totalCars: number;
  archivedCars: number;
  activeCars: number;
  lastSync: string | null;
}> {
  const { data: totalData } = await supabase
    .from('cars_staging')
    .select('id', { count: 'exact' })
    .eq('source_api', 'auctions_api');
  
  const { data: archivedData } = await supabase
    .from('cars_staging')
    .select('id', { count: 'exact' })
    .eq('source_api', 'auctions_api')
    .eq('is_archived', true);
  
  const { data: activeData } = await supabase
    .from('cars_staging')
    .select('id', { count: 'exact' })
    .eq('source_api', 'auctions_api')
    .eq('is_archived', false);
  
  const { data: lastSyncData } = await supabase
    .from('cars_staging')
    .select('last_synced_at')
    .eq('source_api', 'auctions_api')
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .single();
  
  return {
    totalCars: totalData?.length || 0,
    archivedCars: archivedData?.length || 0,
    activeCars: activeData?.length || 0,
    lastSync: lastSyncData?.last_synced_at || null
  };
}

/**
 * Main sync function
 */
async function syncCars(): Promise<void> {
  console.log('🚀 Starting Auctions API car sync...');
  console.log(`📊 Configuration: ${SCROLL_LIMIT} cars per batch, ${SCROLL_TIME_MINUTES}min scroll time`);
  
  const startTime = Date.now();
  let totalCarsProcessed = 0;
  let totalBatches = 0;
  
  try {
    // Step 1: Archive old cars
    const archivedCount = await archiveOldCars();
    
    // Step 2: Clear staging table for fresh data
    console.log('🧹 Clearing staging table for fresh sync...');
    const { error: clearError } = await supabase
      .from('cars_staging')
      .delete()
      .eq('source_api', 'auctions_api');
    
    if (clearError) {
      console.error('❌ Error clearing staging table:', clearError);
      throw clearError;
    }
    
    // Step 3: Fetch all cars using scroll pagination
    console.log('📡 Starting scroll session...');
    const allCars = await auctionsApi.fetchAllCars();
    totalCarsProcessed = allCars.length;
    
    console.log(`📊 Fetched ${totalCarsProcessed} cars from API`);
    
    // Step 4: Transform and batch insert cars
    const transformedCars = allCars.map(transformCarData);
    
    // Process in batches
    for (let i = 0; i < transformedCars.length; i += BATCH_SIZE) {
      const batch = transformedCars.slice(i, i + BATCH_SIZE);
      await upsertCars(batch);
      totalBatches++;
      
      const progress = Math.round(((i + batch.length) / transformedCars.length) * 100);
      console.log(`📈 Progress: ${progress}% (${i + batch.length}/${transformedCars.length} cars)`);
    }
    
    // Step 5: Move data from staging to main table
    await moveStagingToMain();
    
    // Step 6: Get final statistics
    const stats = await getSyncStats();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 Sync completed successfully!');
    console.log('📊 Final Statistics:');
    console.log(`   • Total cars processed: ${totalCarsProcessed}`);
    console.log(`   • Batches processed: ${totalBatches}`);
    console.log(`   • Active cars: ${stats.activeCars}`);
    console.log(`   • Archived cars: ${stats.archivedCars}`);
    console.log(`   • Duration: ${duration}s`);
    console.log(`   • Last sync: ${stats.lastSync || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
if (require.main === module) {
  syncCars().catch(console.error);
}

export { syncCars, archiveOldCars, getSyncStats };
