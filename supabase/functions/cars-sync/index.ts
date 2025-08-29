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
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: number;
}

// Background sync function that can handle long operations with timeout handling
async function performBackgroundSync(supabaseClient: any, progress: SyncProgress): Promise<SyncProgress> {
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';
  const API_BASE_URL = 'https://auctionsapi.com/api';
  const maxErrors = 100;
  const maxRateLimitRetries = 50;
  const maxPages = 5000; // Reasonable limit to prevent infinite loops
  
  console.log('🔄 Starting background sync process...');
  
  // Update sync status in database
  await updateSyncStatus(supabaseClient, {
    status: 'running',
    current_page: progress.currentPage,
    records_processed: progress.totalSynced,
    last_activity_at: new Date().toISOString()
  });

  while (progress.currentPage <= maxPages && progress.status === 'running') {
    try {
      console.log(`📄 Processing page ${progress.currentPage}...`);
      
      // Rate limiting with exponential backoff
      const baseDelay = Math.min(5000, 1000 * Math.pow(1.5, Math.min(progress.rateLimitRetries, 10)));
      await new Promise(resolve => setTimeout(resolve, baseDelay));
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/cars?per_page=100&page=${progress.currentPage}`,
        { headers: { 'accept': '*/*', 'x-api-key': API_KEY } },
        5
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          progress.rateLimitRetries++;
          console.log(`⏰ Rate limited. Retry ${progress.rateLimitRetries}/${maxRateLimitRetries}`);
          
          if (progress.rateLimitRetries >= maxRateLimitRetries) {
            console.log('❌ Too many rate limit retries. Pausing sync.');
            progress.status = 'paused';
            break;
          }
          
          // Exponential backoff for rate limits
          const waitTime = Math.min(60000, 5000 * Math.pow(2, Math.min(progress.rateLimitRetries, 6)));
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          progress.errorCount++;
          console.error(`❌ API error ${response.status}: ${response.statusText}`);
          
          if (progress.errorCount >= maxErrors) {
            console.log('❌ Too many API errors. Stopping sync.');
            progress.status = 'failed';
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          progress.currentPage++;
          continue;
        }
      }

      const data = await response.json();
      const cars: Car[] = data.data || [];
      
      if (cars.length === 0) {
        console.log('✅ No more cars available. Sync complete.');
        progress.status = 'completed';
        break;
      }

      console.log(`🔄 Processing ${cars.length} cars from page ${progress.currentPage}...`);

      // Process cars in optimized batches for maximum throughput
      const batchSize = 20; // Increased from 5 to 20
      for (let i = 0; i < cars.length; i += batchSize) {
        const batch = cars.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(car => processSingleCar(supabaseClient, car))
        );
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            progress.totalSynced++;
          } else {
            progress.dbCapacityIssues++;
            console.error(`❌ Failed to process car ${batch[index].id}:`, 
              result.status === 'rejected' ? result.reason : result.value.error);
          }
        });
        
        // Reduced delay for faster processing
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      progress.lastSuccessfulPage = progress.currentPage;
      progress.currentPage++;
      
      // Update progress every 5 pages for more frequent updates + heartbeat
      if (progress.currentPage % 5 === 0) {
        const syncRate = Math.round(progress.totalSynced / ((Date.now() - progress.startTime) / 60000));
        await updateSyncStatus(supabaseClient, {
          current_page: progress.currentPage,
          records_processed: progress.totalSynced,
          last_activity_at: new Date().toISOString(),  // Heartbeat
          error_message: `Rate: ${syncRate} cars/min, Errors: ${progress.errorCount}, Rate limits: ${progress.rateLimitRetries}`
        });
        
        console.log(`📊 Progress: Page ${progress.currentPage}, Synced: ${progress.totalSynced}, Rate: ${syncRate} cars/min, Errors: ${progress.errorCount}`);
      }
      
      // Heartbeat every 30 seconds for active monitoring
      if (progress.currentPage % 2 === 0) {
        await updateSyncStatus(supabaseClient, {
          last_activity_at: new Date().toISOString()
        });
      }

      // Check if we got fewer cars than expected (likely last page)
      if (cars.length < 100) {
        console.log(`📊 Got ${cars.length} cars (less than 100). Likely last page.`);
        progress.status = 'completed';
        break;
      }
      
    } catch (error) {
      progress.errorCount++;
      console.error(`❌ Error processing page ${progress.currentPage}:`, error);
      
      if (progress.errorCount >= maxErrors) {
        progress.status = 'failed';
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      progress.currentPage++;
    }
  }
  
  // Final status update
  await updateSyncStatus(supabaseClient, {
    status: progress.status === 'running' ? 'completed' : progress.status,
    completed_at: progress.status !== 'running' ? new Date().toISOString() : null,
    current_page: progress.currentPage,
    records_processed: progress.totalSynced,
    last_activity_at: new Date().toISOString()
  });
  
  console.log(`✅ Background sync ${progress.status}. Total synced: ${progress.totalSynced}`);
  return progress;
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

async function processSingleCar(supabaseClient: any, car: Car): Promise<{success: boolean, error?: string}> {
  try {
    const lot = car.lots?.[0];
    const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : null;
    const priceInCents = price ? price * 100 : null;
    const mileageKm = lot?.odometer?.km || null;
    
    const carCache = {
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

    const { error } = await supabaseClient
      .from('cars_cache')
      .upsert(carCache, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    return { success: !error, error: error?.message };
  } catch (err) {
    return { success: false, error: err.message };
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

    // Initialize or resume progress
    let progress: SyncProgress;
    
    if (resume && fromPage) {
      // Smart resume with progress reconciliation
      const realCarCount = await getRealCarCount(supabaseClient);
      const resumePage = reconcileProgress ? await reconcileProgressPage(supabaseClient, fromPage) : fromPage;
      
      console.log(`🔄 Smart resume: Page ${resumePage}, Real cars: ${realCarCount}`);
      
      progress = {
        totalSynced: realCarCount,
        currentPage: resumePage,
        errorCount: 0,
        rateLimitRetries: 0,
        dbCapacityIssues: 0,
        lastSuccessfulPage: resumePage - 1,
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
        status: 'running',
        startTime: Date.now()
      };
    }

    // Start background sync process
    EdgeRuntime.waitUntil(
      performBackgroundSync(supabaseClient, progress)
        .catch(error => {
          console.error('❌ Background sync failed:', error);
          return updateSyncStatus(supabaseClient, {
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          });
        })
    );

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Smart sync started in background',
        status: 'running',
        totalSynced: 0,
        pagesProcessed: 0,
        startedAt: new Date().toISOString(),
        note: 'Sync is running in background. Check sync_status table for progress.'
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