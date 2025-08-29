// SIMPLIFIED Car Sync Function - removes complex priority logic causing timeouts
// This version focuses on stable, continuous sync from existing point

interface Car {
  id: number;
  year: number;
  title: string;
  vin: string;
  manufacturer: {
    id: number;
    name: string;
  };
  model: {
    id: number;
    name: string;
    manufacturer_id: number;
  };
  generation: {
    id: number;
    name: string;
    manufacturer_id: number;
    model_id: number;
  };
  body_type: {
    name: string;
    id: number;
  };
  color: {
    name: string;
    id: number;
  };
  engine: {
    id: number;
    name: string;
  };
  transmission: {
    name: string;
    id: number;
  };
  drive_wheel: {
    name: string;
    id: number;
  };
  vehicle_type: {
    name: string;
    id: number;
  };
  fuel: {
    name: string;
    id: number;
  };
  cylinders: number;
  lots: any[];
}

interface SyncProgress {
  totalSynced: number;
  currentPage: number;
  errorCount: number;
  rateLimitRetries: number;
  consecutiveEmptyPages: number;
  startTime: number;
  status: string;
}

// SIMPLE settings for reliable sync
const BATCH_SIZE = 10; // Reasonable batch size
const MIN_DELAY = 3000; // 3 second delay
const MAX_DELAY = 15000; // 15 seconds for retries

console.log('🚀 Starting simplified cars sync function...');

// Simplified sync function - removes priority brands complexity
async function performBackgroundSync(supabaseClient: any, progress: SyncProgress): Promise<SyncProgress> {
  const startTime = Date.now();
  progress.startTime = startTime;
  
  console.log('🚀 Starting simple sync from existing cars...');
  
  // Get actual current car count to resume properly
  const { data: currentCount } = await supabaseClient
    .from('cars_cache')
    .select('*', { count: 'exact', head: true })
    .not('price_cents', 'is', null);
  
  // Set baseline from existing cars
  const baselineCount = currentCount || 20955;
  progress.totalSynced = baselineCount;
  
  console.log(`📊 Starting from ${baselineCount} existing cars at page ${progress.currentPage}`);
  
  await updateSyncStatus(supabaseClient, {
    status: 'running',
    error_message: `🚀 Simple sync from ${baselineCount} existing cars`,
    records_processed: baselineCount,
    last_activity_at: new Date().toISOString()
  });

  // Main sync loop - simple page-by-page processing
  while (progress.currentPage <= 5000 && progress.consecutiveEmptyPages < 20) {
    const elapsed = Date.now() - startTime;
    if (elapsed > 50000) { // 50 second timeout
      console.log('⏰ Paused to avoid timeout - will auto-resume');
      await updateSyncStatus(supabaseClient, {
        status: 'paused',
        current_page: progress.currentPage,
        records_processed: progress.totalSynced,
        error_message: `⏰ Paused at page ${progress.currentPage} (${progress.totalSynced} total cars)`,
        last_activity_at: new Date().toISOString()
      });
      return progress;
    }

    try {
      const carsProcessed = await processPage(progress.currentPage);
      
      if (carsProcessed === 0) {
        progress.consecutiveEmptyPages++;
        console.log(`📄 Page ${progress.currentPage}: Empty (${progress.consecutiveEmptyPages}/20 empty pages)`);
      } else {
        progress.consecutiveEmptyPages = 0; 
        progress.totalSynced += carsProcessed;
        
        const currentRate = Math.round((progress.totalSynced - baselineCount) / ((Date.now() - progress.startTime) / 60000));
        console.log(`⚡ Page ${progress.currentPage}: +${carsProcessed} cars (${progress.totalSynced} total, ${currentRate}/min)`);
        
        // Update status every 5 pages
        if (progress.currentPage % 5 === 0) {
          await updateSyncStatus(supabaseClient, {
            current_page: progress.currentPage,
            records_processed: progress.totalSynced,
            error_message: `🚀 Syncing: ${progress.totalSynced} cars total (+${progress.totalSynced - baselineCount} new)`,
            last_activity_at: new Date().toISOString()
          });
        }
      }
      
      progress.currentPage++;
      await new Promise(resolve => setTimeout(resolve, MIN_DELAY));
      
    } catch (error) {
      progress.errorCount++;
      console.error(`❌ Page ${progress.currentPage} failed: ${error.message}`);
      
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        progress.rateLimitRetries++;
        const delay = Math.min(MAX_DELAY, MIN_DELAY * Math.pow(2, progress.rateLimitRetries));
        console.log(`🐌 API Rate limit (HTTP 429): waiting ${delay/1000}s`);
        
        // Update status with specific rate limit type
        await updateSyncStatus(supabaseClient, {
          error_message: `⏰ API Rate Limit (HTTP 429) - External API throttling requests. Auto-resuming in ${delay/1000}s. Page ${progress.currentPage}, ${progress.totalSynced} cars total.`,
          last_activity_at: new Date().toISOString()
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        await new Promise(resolve => setTimeout(resolve, MIN_DELAY));
      }
      
      progress.currentPage++;
    }
  }
  
  // Final status update
  const actualFinalCount = progress.totalSynced;
  const finalStatus = (progress.currentPage > 5000 || progress.consecutiveEmptyPages >= 20) ? 'completed' : 'paused';
  const finalRate = actualFinalCount > baselineCount ? Math.round((actualFinalCount - baselineCount) / ((Date.now() - progress.startTime) / 60000)) : 0;
  
  await updateSyncStatus(supabaseClient, {
    status: finalStatus,
    completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
    current_page: progress.currentPage,
    records_processed: actualFinalCount,
    last_activity_at: new Date().toISOString(),
    error_message: `🚀 SYNC ${finalStatus.toUpperCase()}: ${actualFinalCount} cars total (+${actualFinalCount - baselineCount} new at ${finalRate}/min)`
  });
  
  const totalTime = ((Date.now() - progress.startTime) / 1000 / 60).toFixed(1);
  console.log(`🏁 Simple sync ${finalStatus}: ${actualFinalCount} cars in ${totalTime} minutes`);
  
  progress.totalSynced = actualFinalCount;
  return progress;
}

// Simplified sync runner
async function runSyncWithAutoRestart(supabaseClient: any, initialProgress: SyncProgress): Promise<void> {
  let restartCount = 0;
  const MAX_RESTARTS = 3;
  const RESTART_DELAY = 10000; // 10 seconds
  
  while (restartCount < MAX_RESTARTS) {
    try {
      console.log(`🔄 Sync attempt ${restartCount + 1}/${MAX_RESTARTS}`);
      
      const result = await performBackgroundSync(supabaseClient, initialProgress);
      
      // Check if completed
      if (result.status === 'completed') {
        console.log('✅ SYNC COMPLETE: Cars successfully synced!');
        return;
      }
      
      // If not completed and we have restarts left, try again
      restartCount++;
      if (restartCount < MAX_RESTARTS) {
        console.log(`🔄 Restarting sync in 10 seconds (${restartCount + 1}/${MAX_RESTARTS})`);
        
        await updateSyncStatus(supabaseClient, {
          status: 'running',
          error_message: `🔄 Auto-restart (${restartCount + 1}/${MAX_RESTARTS})`,
          last_activity_at: new Date().toISOString()
        });
        
        await new Promise(resolve => setTimeout(resolve, RESTART_DELAY));
        
        // Get fresh progress
        const currentProgress = await getCurrentSyncProgress(supabaseClient);
        Object.assign(initialProgress, currentProgress);
      }
      
    } catch (error) {
      restartCount++;
      console.error(`❌ Sync failed: ${error.message}`);
      
      if (restartCount < MAX_RESTARTS) {
        await updateSyncStatus(supabaseClient, {
          status: 'running',
          error_message: `❌ Error: ${error.message}. Restarting (${restartCount + 1}/${MAX_RESTARTS})`,
          last_activity_at: new Date().toISOString()
        });
        
        await new Promise(resolve => setTimeout(resolve, RESTART_DELAY));
      }
    }
  }
  
  // If we reach here, we've exceeded max restarts
  console.error('❌ Sync failed after all attempts');
  await updateSyncStatus(supabaseClient, {
    status: 'failed',
    error_message: `❌ Sync failed after ${MAX_RESTARTS} attempts`,
    completed_at: new Date().toISOString()
  });
}

// Get current sync progress from database with actual car count
async function getCurrentSyncProgress(supabaseClient: any): Promise<SyncProgress> {
  try {
    const { data: syncStatus } = await supabaseClient
      .from('sync_status')
      .select('*')
      .eq('id', 'd2864188-e17a-41db-af76-71d7c2bdefe3')
      .single();
    
    // Get actual count from database
    const { data: actualCount } = await supabaseClient
      .from('cars_cache')
      .select('*', { count: 'exact', head: true })
      .not('price_cents', 'is', null);
    
    if (syncStatus) {
      return {
        totalSynced: actualCount || syncStatus.records_processed || 20955,
        currentPage: syncStatus.current_page || 210,
        errorCount: 0,
        rateLimitRetries: 0,
        consecutiveEmptyPages: 0,
        startTime: Date.now(),
        status: syncStatus.status || 'running'
      };
    }
  } catch (error) {
    console.error('Error getting sync progress:', error);
  }
  
  // Default fallback
  return {
    totalSynced: 20955,
    currentPage: 210,
    errorCount: 0,
    rateLimitRetries: 0,
    consecutiveEmptyPages: 0,
    startTime: Date.now(),
    status: 'running'
  };
}

// Simple page processing
async function processPage(pageNum: number): Promise<number> {
  const url = `https://auctionsapi.com/api/cars?page=${pageNum}&per_page=${BATCH_SIZE}`;
  
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Cars-Sync/1.0'
      }
    }, 3);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('429 - Rate limited');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const cars = data?.data || [];
    
    if (!Array.isArray(cars) || cars.length === 0) {
      return 0;
    }

    const supabaseClient = await getSupabaseClient();
    const result = await processCarsChunk(supabaseClient, cars);
    return result.success;
    
    } catch (error) {
      console.error(`❌ processPage ${pageNum} failed:`, error.message);
      
      // Provide specific error context for rate limiting
      if (error.message.includes('429')) {
        throw new Error(`API_RATE_LIMIT: External API returned HTTP 429 - ${error.message}`);
      } else if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
        throw new Error(`NETWORK_TIMEOUT: Network timeout or connection reset - ${error.message}`);
      } else {
        throw new Error(`PROCESSING_ERROR: ${error.message}`);
      }
    }
}

// Process cars chunk
async function processCarsChunk(supabaseClient: any, cars: Car[]): Promise<{success: number, errors: number}> {
  let successCount = 0;
  let errorCount = 0;

  for (const car of cars) {
    try {
      const transformedCar = {
        id: car.id?.toString(),
        api_id: car.id?.toString(),
        make: car.manufacturer?.name,
        model: car.model?.name,
        year: car.year,
        price: car.lots?.[0]?.buy_now || car.lots?.[0]?.bid || 0,
        price_cents: (car.lots?.[0]?.buy_now || car.lots?.[0]?.bid || 0) * 100,
        vin: car.vin,
        fuel: car.fuel?.name,
        transmission: car.transmission?.name,
        color: car.color?.name,
        condition: car.lots?.[0]?.condition?.name || 'unknown',
        lot_number: car.lots?.[0]?.lot,
        mileage: car.lots?.[0]?.odometer?.km?.toString(),
        images: JSON.stringify(car.lots?.[0]?.images?.normal || []),
        car_data: JSON.stringify(car),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rank_score: Math.random()
      };

      const { error } = await supabaseClient
        .from('cars_cache')
        .upsert(transformedCar, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`❌ Error upserting car ${car.id}:`, error);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing car ${car.id}:`, error);
      errorCount++;
    }
  }

  return { success: successCount, errors: errorCount };
}

// Fetch with retry
async function fetchWithRetry(url: string, options: any, maxRetries: number): Promise<Response> {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        const delay = Math.min(15000, 1000 * Math.pow(2, i));
        console.log(`🔄 Retry ${i + 1}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Update sync status
async function updateSyncStatus(supabaseClient: any, updates: any) {
  try {
    await supabaseClient
      .from('sync_status')
      .update(updates)
      .eq('id', 'd2864188-e17a-41db-af76-71d7c2bdefe3');
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
}

// Get Supabase client
async function getSupabaseClient() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main Deno server
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting smart cars sync function...');
    
    // Initialize Supabase client
    const supabaseClient = await getSupabaseClient();
    
    // Get or create sync progress
    let progress = await getCurrentSyncProgress(supabaseClient);
    
    console.log(`🔄 Progress reconciliation: Real cars: ${progress.totalSynced}, Page: ${progress.currentPage}`);
    console.log(`🚀 SIMPLE RESUME: Page ${progress.currentPage}, Real cars: ${progress.totalSynced}`);
    
    // Start background sync using EdgeRuntime.waitUntil
    EdgeRuntime.waitUntil(runSyncWithAutoRestart(supabaseClient, progress));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Simple sync started successfully',
        currentPage: progress.currentPage,
        totalSynced: progress.totalSynced
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Sync startup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});