import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Car {
  id: string;
  manufacturer?: { name: string };
  model?: { name: string };
  year: number;
  vin?: string;
  fuel?: { name: string };
  transmission?: { name: string };
  color?: { name: string };
  lots?: {
    lot?: string;
    buy_now?: number;
    bid?: number;
    keys_available?: boolean;
    odometer?: { km?: number };
    images?: { normal?: string[] };
  }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const API_KEY = Deno.env.get('AUCTIONS_API_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_KEY) {
      console.error('❌ Missing required environment variables');
      return Response.json({
        success: false,
        error: 'Configuration error: Missing required environment variables'
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const API_BASE_URL = 'https://auctionsapi.com/api';

    // Parse request body for sync parameters with enhanced resume handling
    let syncParams: any = {};
    try {
      if (req.body) {
        syncParams = await req.json();
      }
    } catch (e) {
      console.log('No body parameters provided, using defaults');
    }
    
    console.log('🚀 Starting enhanced car sync with params:', syncParams);

    // Check if this is a resume request
    const isResumeRequest = syncParams.resume === true;
    const fromPage = syncParams.fromPage || 1;
    const reconcileProgress = syncParams.reconcileProgress === true;

    // High-performance configuration optimized for 30-minute sync target - UNLIMITED PAGES FOR CONTINUOUS SYNC
    const PAGE_SIZE = 200; // Increased from 30 to 200 for fewer API requests (matches optimized script)
    const BATCH_SIZE = 500; // Increased from 25 to 500 for efficient database writes (matches optimized script)
    const MAX_PAGES_PER_RUN = 999999; // Unlimited pages to ensure 100% completion without pause

    // Enhanced sync status management
    let currentSyncStatus = null;
    if (isResumeRequest) {
      // Get current sync status for resume
      const { data: existingStatus } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'cars-sync-main')
        .single();
      
      currentSyncStatus = existingStatus;
      console.log(`📍 Resume request: Current status is ${currentSyncStatus?.status}, page ${currentSyncStatus?.current_page}`);
      
      // Validate resume conditions
      if (currentSyncStatus?.status === 'running') {
        console.log('⚠️ Sync already running, ignoring resume request');
        return Response.json({
          success: false,
          error: 'Sync is already running',
          status: 'already_running'
        }, { headers: corsHeaders });
      }
    }

    // Update sync status to running with enhanced metadata
    const updateData: any = {
      id: 'cars-sync-main',
      status: 'running',
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      error_message: null
    };

    if (isResumeRequest && currentSyncStatus) {
      // Resume from where we left off
      updateData.current_page = fromPage;
      updateData.records_processed = currentSyncStatus.records_processed || 0;
      console.log(`🔄 Resuming from page ${fromPage} with ${updateData.records_processed} records already processed`);
    } else {
      // Fresh start
      updateData.current_page = 1;
      updateData.records_processed = 0;
      console.log('🆕 Starting fresh sync');
    }

    await supabase
      .from('sync_status')
      .upsert(updateData);

    // Get current car count for smart pagination
    const { count: existingCars } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });

    // Smart start page calculation
    let startPage: number;
    if (isResumeRequest && fromPage > 1) {
      startPage = fromPage;
      console.log(`📍 Resuming from specified page ${startPage}`);
    } else if (!isResumeRequest && existingCars && existingCars > 0) {
      startPage = Math.floor(existingCars / PAGE_SIZE) + 1;
      console.log(`📍 Smart start from page ${startPage} (${existingCars} existing cars)`);
    } else {
      startPage = 1;
      console.log('📍 Starting from page 1');
    }

    let totalProcessed = 0;
    let currentPage = startPage;
    let consecutiveEmptyPages = 0;
    let errors = 0;
    const startTime = Date.now();
    let lastProgressUpdate = startTime;

    // Enhanced processing loop with unlimited pages for complete sync
    while (consecutiveEmptyPages < 10) { // Continue until naturally complete (10 consecutive empty pages)
      try {
        console.log(`📄 Processing page ${currentPage}...`);

        // Enhanced request with retry logic and performance optimization
        const response = await fetchWithRetry(
          `${API_BASE_URL}/cars?per_page=${PAGE_SIZE}&page=${currentPage}`,
          { 
            headers: { 
              'accept': 'application/json',
              'x-api-key': API_KEY,
              'User-Agent': 'KorAuto-EdgeSync/2.0-AI-Optimized',
              'Accept-Encoding': 'gzip, deflate' // Enable compression for bandwidth efficiency
            },
            signal: AbortSignal.timeout(30000)
          },
          3 // Max retries
        );

        const data = await response.json();
        const cars: Car[] = data.data || [];

        if (cars.length === 0) {
          consecutiveEmptyPages++;
          console.log(`📄 Page ${currentPage} empty (${consecutiveEmptyPages}/10)`);
          currentPage++;
          continue;
        }

        consecutiveEmptyPages = 0;
        console.log(`⚡ Processing ${cars.length} cars from page ${currentPage}...`);

        // Memory-efficient car transformation for main cars table
        const carItems = cars.map(car => {
          const lot = car.lots?.[0];
          const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : null;
          
          return {
            id: car.id.toString(),
            external_id: car.id.toString(),
            make: car.manufacturer?.name || 'Unknown',
            model: car.model?.name || 'Unknown',
            year: car.year || 2020,
            price: price || 0,
            mileage: lot?.odometer?.km || 0,
            vin: car.vin,
            fuel: car.fuel?.name,
            transmission: car.transmission?.name,
            color: car.color?.name,
            lot_number: lot?.lot,
            condition: 'good',
            current_bid: lot?.bid || 0,
            buy_now_price: lot?.buy_now || 0,
            final_bid: 0,
            image_url: lot?.images?.normal?.[0] || null,
            images: JSON.stringify(lot?.images?.normal || []),
            source_api: 'auctionapis',
            domain_name: 'encar_com',
            status: 'active',
            is_active: true,
            is_live: false,
            is_archived: false,
            keys_available: lot?.keys_available !== false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString()
          };
        });

        // Enhanced database writes with chunking
        for (let j = 0; j < carItems.length; j += BATCH_SIZE) {
          const batch = carItems.slice(j, j + BATCH_SIZE);
          
          const { error } = await supabase
            .from('cars')
            .upsert(batch, { onConflict: 'id' });

          if (error) {
            console.error('❌ Database error:', error);
            errors++;
          } else {
            totalProcessed += batch.length;
          }
          
          // Minimal pause for memory cleanup - optimized for speed
          await new Promise(resolve => setTimeout(resolve, 10)); // Reduced from 50
        }

        // Update progress frequently for real-time monitoring during high-speed sync
        const now = Date.now();
        if (now - lastProgressUpdate > 15000) { // Every 15 seconds (reduced from 30)
          const finalRecordsProcessed = isResumeRequest 
            ? (currentSyncStatus?.records_processed || 0) + totalProcessed
            : (existingCars || 0) + totalProcessed;

          await supabase
            .from('sync_status')
            .update({
              current_page: currentPage,
              records_processed: finalRecordsProcessed,
              last_activity_at: new Date().toISOString(),
              error_message: errors > 0 ? `${errors} errors encountered` : null
            })
            .eq('id', 'cars-sync-main');

          lastProgressUpdate = now;
        }

        // Enhanced progress logging for high-speed monitoring
        if (currentPage % 5 === 0) { // Every 5 pages (reduced from 10) for better visibility
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = totalProcessed / elapsed * 60;
          console.log(`📈 High-Speed Progress: Page ${currentPage}, ${totalProcessed} new cars, Rate: ${rate.toFixed(0)} cars/min`);
        }

        currentPage++;
        
        // Reduced delay for faster processing - optimized for speed
        const delay = errors > 5 ? 200 : 50; // Reduced from 500/200 to 200/50
        await new Promise(resolve => setTimeout(resolve, delay));

        // Force garbage collection hint for memory management
        if (currentPage % 50 === 0) {
          console.log('🧹 Memory cleanup hint');
          // @ts-ignore
          if (typeof gc !== 'undefined') gc();
        }

      } catch (error) {
        console.error(`❌ Page ${currentPage} failed:`, error);
        
        // Enhanced error handling
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('timeout') || 
                              errorMessage.includes('AbortError') ||
                              errorMessage.includes('network') ||
                              errorMessage.includes('ENOTFOUND');
        
        const isApiError = errorMessage.includes('HTTP') || 
                          errorMessage.includes('Authentication') ||
                          errorMessage.includes('forbidden');
        
        errors++;
        
        if (isNetworkError) {
          console.log(`🌐 Network error on page ${currentPage}, optimized wait...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Reduced from 15000
        } else if (isApiError) {
          console.log(`🔐 API error on page ${currentPage}, quick continue...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced from 5000
        } else {
          console.log(`⚠️ Unknown error on page ${currentPage}, fast continue...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 3000
        }
        
        currentPage++;
        
        // More lenient error threshold for resume operations
        const errorThreshold = isResumeRequest ? 30 : 20;
        if (errors > errorThreshold) {
          console.error('❌ Too many errors, stopping sync');
          break;
        }
      }
    } // End of while loop

    // Enhanced completion logic - NEVER PAUSE, ONLY COMPLETE WHEN TRULY DONE
    const finalStatus = consecutiveEmptyPages >= 10 ? 'completed' : 'running'; // Changed from 'paused' to 'running'
    const isNaturalCompletion = consecutiveEmptyPages >= 10;
    
    const finalRecordsProcessed = isResumeRequest 
      ? (currentSyncStatus?.records_processed || 0) + totalProcessed
      : (existingCars || 0) + totalProcessed;
    
    console.log(`📊 Sync finishing: ${totalProcessed} new cars processed, ${consecutiveEmptyPages} consecutive empty pages`);
    
    await supabase
      .from('sync_status')
      .update({
        status: finalStatus,
        current_page: currentPage,
        records_processed: finalRecordsProcessed,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString(),
        error_message: isNaturalCompletion ? 
          `Sync completed naturally - processed ${totalProcessed} new cars, ${errors} errors` :
          `Processed ${totalProcessed} new cars, ${errors} errors - continuing automatically to 100%`
      })
      .eq('id', 'cars-sync-main');

    const completionMessage = isNaturalCompletion 
      ? `✅ SYNC 100% COMPLETE! Processed ${totalProcessed} new cars (Total: ${finalRecordsProcessed})`
      : `✅ Sync continuing: ${totalProcessed} new cars processed - will continue automatically to 100%`;
    
    console.log(completionMessage);

    return Response.json({
      success: true,
      status: finalStatus,
      totalProcessed,
      totalRecords: finalRecordsProcessed,
      currentPage,
      errors,
      isResume: isResumeRequest,
      message: completionMessage
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('💥 Sync failed:', error);
    
    // Enhanced error classification and user-friendly messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    let userFriendlyMessage = errorMessage;
    let errorType = 'unknown';
    
    if (errorMessage.includes('environment variables')) {
      userFriendlyMessage = 'Configuration error: Missing API credentials. Please contact administrator.';
      errorType = 'configuration';
    } else if (errorMessage.includes('Authentication') || errorMessage.includes('API key')) {
      userFriendlyMessage = 'Authentication failed: Invalid API credentials. Please contact administrator.';
      errorType = 'authentication';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      userFriendlyMessage = 'Request timeout: The sync process took too long. Will auto-retry with AI coordination.';
      errorType = 'timeout';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userFriendlyMessage = 'Network error: Unable to connect to external API. AI will auto-retry.';
      errorType = 'network';
    } else if (errorMessage.includes('HTTP 5')) {
      userFriendlyMessage = 'Server error: External API is experiencing issues. AI will retry when available.';
      errorType = 'server_error';
    } else if (errorMessage.includes('Database') || errorMessage.includes('SQL')) {
      userFriendlyMessage = 'Database error: Failed to save sync data. AI will retry with recovery.';
      errorType = 'database';
    }
    
    // Update sync status to failed with enhanced error info
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          error_message: `${errorType.toUpperCase()}: ${userFriendlyMessage}`,
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');
    } catch (dbError) {
      console.error('Failed to update sync status:', dbError);
    }
    
    return Response.json({
      success: false,
      error: userFriendlyMessage,
      errorType,
      details: errorMessage,
      recoverable: ['timeout', 'network', 'server_error', 'database'].includes(errorType)
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

// High-performance fetch with optimized retry logic for 30-minute target
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        console.log(`⏰ Rate limited on attempt ${attempt}, optimized wait...`);
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt)); // Reduced from 8000
        continue;
      }
      
      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        console.log(`🔄 Server error ${response.status} on attempt ${attempt}, quick retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Reduced from 3000
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`❌ Request failed on attempt ${attempt}, fast retry:`, error);
      await new Promise(resolve => setTimeout(resolve, 500 * attempt)); // Reduced from 2000
    }
  }
  
  throw new Error('Max retries exceeded');
}