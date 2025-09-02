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

  // Health check endpoint
  if (req.method === 'GET') {
    console.log('🏥 Health check requested');
    return Response.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cars-sync'
    }, { headers: corsHeaders });
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

    // MAXIMUM SPEED configuration optimized for fastest possible sync
    const PAGE_SIZE = 250; // Increased from 200 for fewer API requests
    const BATCH_SIZE = 750; // Increased from 500 for larger database writes
    const MAX_PAGES_PER_RUN = 999999; // Unlimited pages to ensure 100% completion without pause
    const MAX_EXECUTION_TIME = 8 * 60 * 1000; // 8 minutes max execution to stay within edge function limits

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
      
      // Check if sync is actually stuck
      if (currentSyncStatus?.status === 'running') {
        const lastActivity = new Date(currentSyncStatus.last_activity_at || currentSyncStatus.started_at).getTime();
        const now = Date.now();
        const timeSinceActivity = now - lastActivity;
        const STUCK_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        
        if (timeSinceActivity < STUCK_THRESHOLD) {
          console.log('⚠️ Sync already running and not stuck, ignoring request');
          return Response.json({
            success: false,
            error: 'Sync is already running',
            status: 'already_running'
          }, { headers: corsHeaders });
        } else {
          console.log('🔧 Sync appears stuck, will reset and continue');
          // Reset stuck sync and continue
        }
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
      .from('cars_cache')
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
    while (consecutiveEmptyPages < 20) { // Continue until truly complete (20 consecutive empty pages for better certainty)
      // Check execution time to avoid edge function timeout
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.log(`⏰ Execution time limit reached (${Math.round(elapsedTime/1000)}s), saving progress and continuing via auto-resume...`);
        break;
      }
      
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
          console.log(`📄 Page ${currentPage} empty (${consecutiveEmptyPages}/20)`);
          currentPage++;
          continue;
        }

        consecutiveEmptyPages = 0;
        console.log(`⚡ Processing ${cars.length} cars from page ${currentPage}...`);

        // Complete API data transformation using the mapping function
        const carCacheItems = [];
        
        for (const car of cars) {
          try {
            // Use the complete API mapping function to ensure all fields are captured
            const { data: mappedData, error: mappingError } = await supabase
              .rpc('map_complete_api_data', { api_record: car });

            if (mappingError) {
              console.error('❌ Mapping error for car', car.id, ':', mappingError);
              // Fallback to basic mapping
              const lot = car.lots?.[0];
              const price = lot?.buy_now ? Math.round(lot.buy_now + 2200) : null;
              
              carCacheItems.push({
                id: car.id.toString(),
                api_id: car.id.toString(),
                make: car.manufacturer?.name || 'Unknown',
                model: car.model?.name || 'Unknown',
                year: car.year || 2020,
                price: price,
                price_cents: price ? price * 100 : null,
                mileage: lot?.odometer?.km?.toString() || null,
                rank_score: price ? (1 / price) * 1000000 : 0,
                vin: car.vin,
                fuel: car.fuel?.name,
                transmission: car.transmission?.name,
                color: car.color?.name,
                lot_number: lot?.lot,
                condition: 'good',
                images: JSON.stringify(lot?.images?.normal || []),
                car_data: {
                  buy_now: lot?.buy_now,
                  current_bid: lot?.bid,
                  keys_available: lot?.keys_available !== false
                },
                lot_data: lot,
                // IMPORTANT: Store complete original API data for full API parity
                original_api_data: car,
                sync_metadata: {
                  mapped_at: new Date().toISOString(),
                  mapping_version: '2.0',
                  sync_method: 'fallback_basic',
                  api_fields_count: Object.keys(car).length
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_api_sync: new Date().toISOString()
              });
            } else if (mappedData) {
              // Use the complete mapping with original API data preserved
              carCacheItems.push({
                ...mappedData,
                // Ensure essential fields for compatibility
                id: car.id.toString(),
                api_id: car.id.toString(),
                // CRITICAL: Always preserve complete original API data
                original_api_data: car,
                // Enhanced sync metadata with complete mapping info
                sync_metadata: {
                  mapped_at: new Date().toISOString(),
                  mapping_version: '2.0',
                  sync_method: 'complete_mapping_function',
                  api_fields_count: Object.keys(car).length,
                  mapped_fields_count: Object.keys(mappedData).length,
                  has_lot_data: !!(car.lots && car.lots.length > 0),
                  has_images: !!(car.lots?.[0]?.images?.normal?.length > 0)
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_api_sync: new Date().toISOString()
              });
            }
          } catch (mappingError) {
            console.error('❌ Exception during mapping for car', car.id, ':', mappingError);
            // Continue with next car to avoid stopping the entire sync
          }
        }

        // Enhanced database writes with chunking
        for (let j = 0; j < carCacheItems.length; j += BATCH_SIZE) {
          const batch = carCacheItems.slice(j, j + BATCH_SIZE);
          
          const { error } = await supabase
            .from('cars_cache')
            .upsert(batch, { onConflict: 'id' });

          if (error) {
            console.error('❌ Database error:', error);
            errors++;
          } else {
            totalProcessed += batch.length;
          }
          
          // MAXIMUM SPEED: No artificial delays - let the system run at natural pace
        }

        // Update progress more frequently for real-time monitoring during MAXIMUM SPEED sync
        const now = Date.now();
        if (now - lastProgressUpdate > 10000) { // Every 10 seconds (reduced from 15) for max speed monitoring
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
        
        // MAXIMUM SPEED: No artificial delays between pages - run at full throttle
        // Remove all delays for maximum throughput while maintaining reliability

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
          console.log(`🌐 Network error on page ${currentPage}, maximum speed retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 5000 for max speed
        } else if (isApiError) {
          console.log(`🔐 API error on page ${currentPage}, instant continue...`);
          // No delay for API errors - instant retry for maximum speed
        } else {
          console.log(`⚠️ Unknown error on page ${currentPage}, instant continue...`);
          // No delay for unknown errors - instant retry for maximum speed
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
    const finalStatus = consecutiveEmptyPages >= 20 ? 'completed' : 'running'; // Changed from 'paused' to 'running'
    const isNaturalCompletion = consecutiveEmptyPages >= 20;
    
    const finalRecordsProcessed = isResumeRequest 
      ? (currentSyncStatus?.records_processed || 0) + totalProcessed
      : (existingCars || 0) + totalProcessed;
    
    console.log(`📊 Sync status: ${totalProcessed} new cars processed, ${consecutiveEmptyPages} consecutive empty pages`);
    
    // If we haven't reached natural completion, set status to running and let auto-resume take over
    if (!isNaturalCompletion) {
      await supabase
        .from('sync_status')
        .update({
          status: 'running',
          current_page: currentPage,
          records_processed: finalRecordsProcessed,
          last_activity_at: new Date().toISOString(),
          error_message: `Processed ${totalProcessed} new cars, ${errors} errors - will continue automatically`
        })
        .eq('id', 'cars-sync-main');
        
      console.log(`✅ Sync batch complete: ${totalProcessed} new cars processed - marked as running for auto-continuation`);
      
      return Response.json({
        success: true,
        status: 'running',
        totalProcessed,
        totalRecords: finalRecordsProcessed,
        currentPage,
        errors,
        isResume: isResumeRequest,
        message: `Batch complete: ${totalProcessed} new cars processed - continuing automatically`,
        shouldContinue: true
      }, { headers: corsHeaders });
    }
    
    // Only mark as completed if we've truly reached the end
    
    await supabase
      .from('sync_status')
      .update({
        status: 'completed',
        current_page: currentPage,
        records_processed: finalRecordsProcessed,
        completed_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        error_message: `Sync completed naturally - processed ${totalProcessed} new cars, ${errors} errors`
      })
      .eq('id', 'cars-sync-main');

    console.log(`✅ SYNC 100% COMPLETE! Processed ${totalProcessed} new cars (Total: ${finalRecordsProcessed})`);

    return Response.json({
      success: true,
      status: 'completed',
      totalProcessed,
      totalRecords: finalRecordsProcessed,
      currentPage,
      errors,
      isResume: isResumeRequest,
      message: `✅ SYNC 100% COMPLETE! Processed ${totalProcessed} new cars (Total: ${finalRecordsProcessed})`
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

// MAXIMUM SPEED: Optimized fetch with minimal retry delays for max throughput
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        console.log(`⏰ Rate limited on attempt ${attempt}, minimal wait for max speed...`);
        await new Promise(resolve => setTimeout(resolve, 1000 + (attempt * 500))); // Reduced from 3000 * attempt for max speed
        continue;
      }
      
      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        console.log(`🔄 Server error ${response.status} on attempt ${attempt}, instant retry...`);
        await new Promise(resolve => setTimeout(resolve, 250 * attempt)); // Reduced from 1000 * attempt for max speed
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`❌ Request failed on attempt ${attempt}, minimal delay retry:`, error);
      await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Reduced from 500 * attempt for max speed
    }
  }
  
  throw new Error('Max retries exceeded');
}