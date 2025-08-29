import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Car {
  id: string;
  manufacturer?: { id: number; name: string };
  model?: { id: number; name: string };
  generation?: { id: number; name: string; manufacturer_id: number; model_id: number };
  year: number;
  vin?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  color?: { id: number; name: string };
  body_type?: { id: number; name: string };
  engine?: { id: number; name: string };
  drive_wheel?: string;
  vehicle_type?: { id: number; name: string };
  cylinders?: string;
  lots?: {
    id: number;
    lot?: string;
    buy_now?: number;
    status?: number;
    sale_status?: string;
    final_price?: number;
    bid?: number;
    damage?: {
      main?: string;
      second?: string;
    };
    keys_available?: boolean;
    airbags?: string;
    grade_iaai?: string;
    seller?: string;
    seller_type?: string;
    sale_date?: string;
    odometer?: {
      km?: number;
      mi?: number;
    };
    images?: {
      normal?: string[];
      big?: string[];
    };
  }[];
}

interface SyncProgress {
  totalSynced: number;
  currentPage: number;
  errorCount: number;
  rateLimitRetries: number;
  dbCapacityIssues: number;
  lastSuccessfulPage: number;
  consecutiveEmptyPages: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: number;
}

// Ultra-fast sync function optimized for maximum throughput
async function performBackgroundSync(supabaseClient: any, progress: SyncProgress): Promise<SyncProgress> {
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';
  const API_BASE_URL = 'https://auctionsapi.com/api';
  
  // MAXIMUM SPEED MODE - 190,000 cars in 2 hours = ~1,583 cars/minute
  const MAX_PARALLEL_PAGES = 8; // Process 8 pages simultaneously
  const BATCH_SIZE = 50; // 50 cars per batch for speed
  const MIN_DELAY = 100; // 100ms delay - minimal but prevents overload
  const API_TIMEOUT = 30000; // 30 second timeout
  const RETRY_DELAY = 500; // Fast retry on errors
  
  console.log('🚀 Starting MAXIMUM SPEED sync - targeting 190,000+ cars in 2 hours...');
  
  // Update sync status with current database count
  const { data: currentCount } = await supabaseClient
    .from('cars_cache')
    .select('*', { count: 'exact', head: true })
    .not('price_cents', 'is', null);
  
  const actualSyncedCount = currentCount || 0;
  
  await updateSyncStatus(supabaseClient, {
    status: 'running',
    current_page: progress.currentPage,
    records_processed: actualSyncedCount,
    last_activity_at: new Date().toISOString()
  });

  // Single page processing optimized for speed
  const processPage = async (pageNum: number): Promise<number> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(
        `${API_BASE_URL}/cars?per_page=100&page=${pageNum}`,
        { 
          headers: { 'accept': '*/*', 'x-api-key': API_KEY },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Quick rate limit recovery
          return 0;
        }
        return 0;
      }

      const data = await response.json();
      const cars: Car[] = data.data || [];
      
      if (cars.length === 0) return 0;

      // Process cars in larger batches for speed
      let processedCount = 0;
      for (let i = 0; i < cars.length; i += BATCH_SIZE) {
        const chunk = cars.slice(i, i + BATCH_SIZE);
        const result = await processCarsChunk(supabaseClient, chunk);
        processedCount += result.success;
      }
      
      return processedCount;
      
    } catch (error) {
      return 0; // Fail fast, don't block other pages
    }
  };

  // Ultra-fast parallel page processing
  const processPageBatch = async (startPage: number): Promise<number> => {
    const pagePromises = [];
    
    // Process multiple pages in parallel
    for (let i = 0; i < MAX_PARALLEL_PAGES && (startPage + i) <= 3000; i++) {
      const pageNum = startPage + i;
      pagePromises.push(processPage(pageNum));
    }
    
    const results = await Promise.allSettled(pagePromises);
    let totalProcessed = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        totalProcessed += result.value;
      } else {
        console.error(`❌ Page ${startPage + index} failed:`, result.reason?.message);
      }
    });
    
    return totalProcessed;
  };

  // Ultra-fast parallel processing loop
  while (progress.currentPage <= 3000 && progress.status === 'running' && progress.consecutiveEmptyPages < 20) {
    const batchStarted = Date.now();
    
    // Process batch of pages in parallel
    const processedInBatch = await processPageBatch(progress.currentPage);
    
    if (processedInBatch === 0) {
      progress.consecutiveEmptyPages++;
    } else {
      progress.consecutiveEmptyPages = 0;
      progress.totalSynced += processedInBatch;
    }
    
    progress.currentPage += MAX_PARALLEL_PAGES;
    
    // Update progress every 3 batches (24 pages) for speed
    if (progress.currentPage % (MAX_PARALLEL_PAGES * 3) === 0) {
      const { data: dbCount } = await supabaseClient
        .from('cars_cache')
        .select('*', { count: 'exact', head: true })
        .not('price_cents', 'is', null);
      
      const actualCount = dbCount || progress.totalSynced;
      const syncRate = actualCount > 0 ? Math.round(actualCount / ((Date.now() - progress.startTime) / 60000)) : 0;
      const timeElapsed = ((Date.now() - progress.startTime) / 1000 / 60).toFixed(1); // minutes
      const estimatedTotal = syncRate > 0 ? Math.round(190000 / syncRate) : 0; // estimated total minutes
      const timeRemaining = estimatedTotal > timeElapsed ? (estimatedTotal - parseFloat(timeElapsed)).toFixed(0) : 0;
      
      await updateSyncStatus(supabaseClient, {
        current_page: progress.currentPage,
        records_processed: actualCount,
        last_activity_at: new Date().toISOString(),
        error_message: `🚀 MAXIMUM SPEED: ${syncRate} cars/min, ${actualCount} synced, ~${timeRemaining}min remaining for 190K cars`
      });
      
      console.log(`🚀 ULTRA-FAST: Page ${progress.currentPage}, Cars: ${actualCount}, Rate: ${syncRate}/min, ETA: ${timeRemaining}min`);
    }
    
    // Minimal delay for maximum speed but prevent overload
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY));
  }
  
  // Final status with speed optimization results
  const { data: finalCount } = await supabaseClient
    .from('cars_cache')
    .select('*', { count: 'exact', head: true })
    .not('price_cents', 'is', null);
  
  const actualFinalCount = finalCount || progress.totalSynced;
  const finalStatus = (progress.currentPage > 3000 || progress.consecutiveEmptyPages >= 20) ? 'completed' : 'paused';
  const finalRate = actualFinalCount > 0 ? Math.round(actualFinalCount / ((Date.now() - progress.startTime) / 60000)) : 0;
  
  await updateSyncStatus(supabaseClient, {
    status: finalStatus,
    completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
    current_page: progress.currentPage,
    records_processed: actualFinalCount,
    last_activity_at: new Date().toISOString(),
    error_message: `🚀 MAXIMUM SPEED ${finalStatus.toUpperCase()}: ${actualFinalCount} cars synced at ${finalRate} cars/min`
  });
  
  const totalTime = ((Date.now() - progress.startTime) / 1000 / 60).toFixed(1);
  console.log(`🏁 ULTRA-FAST sync ${finalStatus}: ${actualFinalCount} cars in ${totalTime} minutes (${finalRate} cars/min)`);
  
  progress.totalSynced = actualFinalCount;
  return progress;
}

// Simple sync runner with limited restarts
async function runSyncWithAutoRestart(supabaseClient: any, initialProgress: SyncProgress): Promise<void> {
  let restartCount = 0;
  const MAX_RESTARTS = 3; // Limited restarts to avoid loops
  const RESTART_DELAY = 30000; // 30 second delay between restarts
  
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
        console.log(`🔄 Restarting sync in 30 seconds (${restartCount + 1}/${MAX_RESTARTS})`);
        
        await updateSyncStatus(supabaseClient, {
          status: 'running',
          error_message: `🔄 Restarting sync (${restartCount + 1}/${MAX_RESTARTS})`,
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
      .eq('id', 'cars-sync-main')
      .single();
    
    // Get actual count from database
    const { data: actualCount } = await supabaseClient
      .from('cars_cache')
      .select('*', { count: 'exact', head: true })
      .not('price_cents', 'is', null);
    
    if (syncStatus) {
      return {
        totalSynced: actualCount || syncStatus.records_processed || 0,
        currentPage: syncStatus.current_page || 1,
        errorCount: 0,
        rateLimitRetries: 0,
        dbCapacityIssues: 0,
        lastSuccessfulPage: (syncStatus.current_page || 1) - 1,
        consecutiveEmptyPages: 0,
        status: 'running',
        startTime: Date.now()
      };
    }
  } catch (error) {
    console.error('❌ Failed to get sync progress:', error.message);
  }
  
  // Fallback to default progress with actual database count
  const { data: fallbackCount } = await supabaseClient
    .from('cars_cache')
    .select('*', { count: 'exact', head: true })
    .not('price_cents', 'is', null);
  
  return {
    totalSynced: fallbackCount || 0,
    currentPage: 1,
    errorCount: 0,
    rateLimitRetries: 0,
    dbCapacityIssues: 0,
    lastSuccessfulPage: 0,
    consecutiveEmptyPages: 0,
    status: 'running',
    startTime: Date.now()
  };
}

async function fetchWithRetry(url: string, options: any, maxRetries: number): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const waitTime = Math.min(10000, 1000 * Math.pow(2, i));
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

// Ultra-fast chunk processing optimized for maximum throughput
async function processCarsChunk(supabaseClient: any, cars: Car[]): Promise<{success: number, errors: number}> {
  try {
    const carCacheItems = cars.map(car => {
      const lot = car.lots?.[0];
      const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : null;
      const priceInCents = price ? price * 100 : null;
      const mileageKm = lot?.odometer?.km || null;
      
      return {
        id: car.id.toString(),
        api_id: car.id.toString(),
        make: car.manufacturer?.name || 'Unknown',
        model: car.model?.name || 'Unknown',
        year: car.year || 2020,
        price: price,
        price_cents: priceInCents,
        mileage: mileageKm?.toString() || null,
        rank_score: price ? (1 / price) * 1000000 : 0,
        vin: car.vin,
        fuel: car.fuel?.name,
        transmission: car.transmission?.name,
        color: car.color?.name,
        condition: lot?.condition?.name?.replace('run_and_drives', 'Good'),
        lot_number: lot?.lot,
        images: JSON.stringify(lot?.images?.normal || lot?.images?.big || []),
        car_data: JSON.stringify(car),
        lot_data: JSON.stringify(lot || {}),
        last_api_sync: new Date().toISOString()
      };
    });

    // Ultra-fast upsert optimized for maximum speed
    const { error, count } = await supabaseClient
      .from('cars_cache')
      .upsert(carCacheItems, { 
        onConflict: 'id',
        ignoreDuplicates: false,
        count: 'exact'
      });

    if (error) {
      console.error(`❌ Fast upsert error:`, error.message);
      return { success: 0, errors: cars.length };
    }

    return { success: count || cars.length, errors: 0 };
    
  } catch (err) {
    console.error(`❌ Fast chunk error:`, err.message);
    return { success: 0, errors: cars.length };
  }
}

async function updateSyncStatus(supabaseClient: any, updates: any) {
  try {
    const { error } = await supabaseClient
      .from('sync_status')
      .upsert({
        id: 'cars-sync-main',
        sync_type: 'full',
        ...updates
      }, { onConflict: 'id' });
      
    if (error) {
      console.error('Failed to update sync status:', error);
    }
  } catch (err) {
    console.error('Error updating sync status:', err);
  }
}

async function cleanupStuckSyncs(supabaseClient: any) {
  try {
    const { data: stuckSyncs } = await supabaseClient
      .from('sync_status')
      .select('*')
      .eq('status', 'running')
      .lt('last_activity_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // 1 hour ago

    if (stuckSyncs && stuckSyncs.length > 0) {
      console.log(`🧹 Cleaning up ${stuckSyncs.length} stuck sync(s)...`);
      
      for (const sync of stuckSyncs) {
        await supabaseClient
          .from('sync_status')
          .update({
            status: 'failed',
            error_message: 'Auto-cleaned: Edge Function timeout after 1 hour of inactivity',
            completed_at: new Date().toISOString()
          })
          .eq('id', sync.id);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup stuck syncs:', error);
  }
}

async function getRealCarCount(supabaseClient: any): Promise<number> {
  try {
    const { count } = await supabaseClient
      .from('cars_cache')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  } catch (error) {
    console.error('Failed to get real car count:', error);
    return 0;
  }
}

async function reconcileProgressPage(supabaseClient: any, reportedPage: number): Promise<number> {
  try {
    const realCarCount = await getRealCarCount(supabaseClient);
    const estimatedPage = Math.ceil(realCarCount / 100); // 100 cars per page
    
    // Use the higher of the two as a safety measure
    const reconciledPage = Math.max(estimatedPage, reportedPage - 2); // Start 2 pages back for safety
    
    console.log(`🔄 Progress reconciliation: Real cars: ${realCarCount}, Estimated page: ${estimatedPage}, Reported: ${reportedPage}, Using: ${reconciledPage}`);
    
    return Math.max(1, reconciledPage);
  } catch (error) {
    console.error('Failed to reconcile progress:', error);
    return reportedPage;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting smart cars sync function...');
    
    const supabaseUrl = 'https://qtyyiqimkysmjnaocswe.supabase.co';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    const { resume, fromPage, reconcileProgress } = await req.json().catch(() => ({}));

    // Clean up stuck syncs first (running for more than 1 hour without activity)
    await cleanupStuckSyncs(supabaseClient);

    // Check for existing running sync
    const { data: existingSync } = await supabaseClient
      .from('sync_status')
      .select('*')
      .eq('id', 'cars-sync-main')
      .eq('status', 'running')
      .single();

    if (existingSync && !resume) {
      console.log('⏰ Sync already running. Returning existing status.');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sync already in progress',
          status: 'running',
          currentPage: existingSync.current_page,
          totalSynced: existingSync.records_processed
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize or resume progress with MAXIMUM SPEED settings
    let progress: SyncProgress;
    
    if (resume && fromPage) {
      // Smart resume with progress reconciliation
      const realCarCount = await getRealCarCount(supabaseClient);
      const resumePage = reconcileProgress ? await reconcileProgressPage(supabaseClient, fromPage) : fromPage;
      
      console.log(`🚀 SPEED RESUME: Page ${resumePage}, Real cars: ${realCarCount}`);
      
      progress = {
        totalSynced: realCarCount,
        currentPage: resumePage,
        errorCount: 0,
        rateLimitRetries: 0,
        dbCapacityIssues: 0,
        lastSuccessfulPage: resumePage - 1,
        consecutiveEmptyPages: 0,
        status: 'running',
        startTime: Date.now()
      };
    } else {
      progress = {
        totalSynced: 0,
        currentPage: 1,
        errorCount: 0,
        rateLimitRetries: 0,
        dbCapacityIssues: 0,
        lastSuccessfulPage: 0,
        consecutiveEmptyPages: 0,
        status: 'running',
        startTime: Date.now()
      };
    }

    // Start background sync process with auto-restart on failure
    EdgeRuntime.waitUntil(
      runSyncWithAutoRestart(supabaseClient, progress)
    );

    // Return immediate response - MAXIMUM SPEED sync started
    return new Response(
      JSON.stringify({
        success: true,
        message: '🚀 MAXIMUM SPEED SYNC STARTED! Ultra-fast parallel processing for 2-hour target.',
        status: 'running',
        totalSynced: progress.totalSynced,
        pagesProcessed: 0,
        startedAt: new Date().toISOString(),
        features: [
          '🚀 8x parallel page processing',
          '📦 50-car batch writes', 
          '⚡ 100ms delays for maximum speed',
          '🎯 2-hour target for 190K cars',
          '📊 Real-time ETA tracking',
          '🔥 Ultra-fast error recovery'
        ],
        note: 'MAXIMUM SPEED sync running! 8x parallel processing, 50-car batches, 100ms delays. Targeting 190,000+ cars in 2 hours with real-time ETA.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cars sync initialization failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});