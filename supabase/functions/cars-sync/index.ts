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

// Enhanced retry function for reliable API calls
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
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
    
    // Parse request body for sync parameters with enhanced resume handling
    let syncParams: Record<string, unknown> = {};
    try {
      if (req.body) {
        syncParams = await req.json();
      }
    } catch (e) {
      console.log('No body parameters provided, using defaults');
    }

    // Handle connectivity test requests from AI Coordinator
    if (syncParams.test === true || syncParams.source === 'connectivity-test') {
      console.log('🔍 Connectivity test requested');
      return Response.json({
        success: true,
        status: 'connected',
        message: 'Edge function is accessible and ready for sync operations',
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    }
    const API_BASE_URL = 'https://auctionsapi.com/api';
    
    console.log('🚀 Starting enhanced car sync with params:', syncParams);

    // Enhanced API total data detection for 100% completion
    console.log('📊 Checking API total data availability...');
    try {
      const metaResponse = await fetchWithRetry(
        `${API_BASE_URL}/cars?per_page=1&page=1`,
        { 
          headers: { 
            'accept': 'application/json',
            'x-api-key': API_KEY,
            'User-Agent': 'KorAuto-EdgeSync/2.0-AI-Optimized'
          }
        },
        2
      );
      const metaData = await metaResponse.json();
      const totalApiRecords = metaData.total || metaData.meta?.total || null;
      
      if (totalApiRecords) {
        console.log(`📈 API reports ${totalApiRecords} total records available`);
        
        // Update sync status with API target
        await supabase
          .from('sync_status')
          .upsert({
            id: 'cars-sync-main',
            api_total_records: totalApiRecords,
            last_api_check: new Date().toISOString()
          });
      } else {
        console.log('⚠️ Could not determine total API records, will sync until natural completion');
      }
    } catch (error) {
      console.warn('⚠️ Failed to check API total:', error);
    }

    // Check if this is a resume request
    const isResumeRequest = syncParams.resume === true;
    const fromPage = syncParams.fromPage || 1;
    const reconcileProgress = syncParams.reconcileProgress === true;

    // MAXIMUM SPEED configuration optimized for fastest possible sync
    const PAGE_SIZE = 250; // Increased from 200 for fewer API requests
    const BATCH_SIZE = 750; // Increased from 500 for larger database writes
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
    const updateData: Record<string, unknown> = {
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

        // Memory-efficient car transformation with enhanced image handling
        const carCacheItems = cars.map(car => {
          const lot = car.lots?.[0];
          const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : null;
          
          // Enhanced image processing to ensure all pictures are captured
          const images = lot?.images?.normal || [];
          const primaryImage = images.length > 0 ? images[0] : null;
          
          return {
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
            image_url: primaryImage, // Primary image for display
            images: JSON.stringify(images), // All images as JSON array
            car_data: {
              buy_now: lot?.buy_now,
              current_bid: lot?.bid,
              keys_available: lot?.keys_available !== false,
              has_images: images.length > 0,
              image_count: images.length
            },
            lot_data: lot,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_api_sync: new Date().toISOString()
          };
        });

        // Enhanced database writes with chunking to both cache and main table
        for (let j = 0; j < carCacheItems.length; j += BATCH_SIZE) {
          const batch = carCacheItems.slice(j, j + BATCH_SIZE);
          
          // Write to cache table
          const { error: cacheError } = await supabase
            .from('cars_cache')
            .upsert(batch, { onConflict: 'id' });

          if (cacheError) {
            console.error('❌ Cache database error:', cacheError);
            errors++;
          } else {
            totalProcessed += batch.length;
          }
          
          // Also write to main cars table for global sorting
          const mainTableBatch = batch.map(car => ({
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            price_cents: car.price_cents,
            mileage: car.mileage ? parseInt(car.mileage) : null,
            fuel: car.fuel,
            transmission: car.transmission,
            color: car.color,
            image_url: car.image_url,
            images: car.images,
            rank_score: car.rank_score,
            created_at: car.created_at,
            updated_at: car.updated_at,
            external_id: car.api_id,
            source_api: 'auctions'
          }));
          
          const { error: mainError } = await supabase
            .from('cars')
            .upsert(mainTableBatch, { onConflict: 'id' });

          if (mainError) {
            console.warn('⚠️ Main table sync warning:', mainError);
            // Don't count this as an error that stops sync
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
          // @ts-expect-error gc is not in type definitions but available in Deno
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

    // Enhanced completion logic for 100% sync with API total verification
    const isNaturalCompletion = consecutiveEmptyPages >= 10;
    
    // Check if we've reached the API total (if available)
    const { data: statusData } = await supabase
      .from('sync_status')
      .select('api_total_records, records_processed')
      .eq('id', 'cars-sync-main')
      .single();
    
    const apiTotal = statusData?.api_total_records;
    const finalRecordsProcessed = isResumeRequest 
      ? (currentSyncStatus?.records_processed || 0) + totalProcessed
      : (existingCars || 0) + totalProcessed;
    
    // Enhanced completion detection
    let completionPercentage = 100;
    let finalStatus = 'completed';
    
    if (apiTotal && finalRecordsProcessed < apiTotal) {
      completionPercentage = Math.round((finalRecordsProcessed / apiTotal) * 100);
      if (completionPercentage < 99 && !isNaturalCompletion) {
        finalStatus = 'running'; // Continue syncing if we haven't reached near 100%
      }
    } else if (!isNaturalCompletion) {
      finalStatus = 'running'; // Continue if no natural completion yet
    }
    
    console.log(`📊 Sync finishing: ${totalProcessed} new cars processed, ${finalRecordsProcessed} total records`);
    if (apiTotal) {
      console.log(`📈 Progress: ${completionPercentage}% (${finalRecordsProcessed}/${apiTotal} from API)`);
    }
    
    await supabase
      .from('sync_status')
      .update({
        status: finalStatus,
        current_page: currentPage,
        records_processed: finalRecordsProcessed,
        completion_percentage: completionPercentage,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString(),
        error_message: finalStatus === 'completed' ? 
          `Sync completed: processed ${totalProcessed} new cars, ${errors} errors (${completionPercentage}%)` :
          `Processed ${totalProcessed} new cars, ${errors} errors - continuing to 100% (${completionPercentage}%)`
      })
      .eq('id', 'cars-sync-main');

    const completionMessage = finalStatus === 'completed'
      ? `✅ SYNC 100% COMPLETE! Processed ${totalProcessed} new cars (Total: ${finalRecordsProcessed})`
      : `✅ Sync continuing: ${totalProcessed} new cars processed - ${completionPercentage}% complete, continuing to 100%`;
    
    console.log(completionMessage);

    return Response.json({
      success: true,
      status: finalStatus,
      totalProcessed,
      totalRecords: finalRecordsProcessed,
      completionPercentage,
      apiTotal,
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

