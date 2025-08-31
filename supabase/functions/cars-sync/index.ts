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
    console.log('🚀 Cars-sync function started');
    
    // Validate required environment variables FIRST
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

    console.log('✅ Environment variables validated');

    // Initialize Supabase client with error handling
    let supabase;
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      console.log('✅ Supabase client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      return Response.json({
        success: false,
        error: 'Database connection failed'
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const API_BASE_URL = 'https://auctionsapi.com/api';

    // Test API connectivity BEFORE starting sync
    try {
      console.log('🔍 Testing API connectivity...');
      const testResponse = await fetch(`${API_BASE_URL}/cars?per_page=1&page=1`, {
        headers: { 
          'accept': 'application/json',
          'x-api-key': API_KEY 
        },
        signal: AbortSignal.timeout(20000) // Increased for new compute upgrades
      });
      
      if (!testResponse.ok) {
        throw new Error(`API test failed: ${testResponse.status} ${testResponse.statusText}`);
      }
      console.log('✅ API connectivity confirmed');
    } catch (error) {
      console.error('❌ API connectivity test failed:', error);
      return Response.json({
        success: false,
        error: `API connectivity test failed: ${error.message}`
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }

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

    // Always check for existing sync status to auto-resume intelligently
    const { data: existingSyncStatus } = await supabase
      .from('sync_status')
      .select('*')
      .eq('id', 'cars-sync-main')
      .single();

    let currentSyncStatus = existingSyncStatus;
    
    // Check if sync is already running
    if (currentSyncStatus?.status === 'running') {
      console.log('⚠️ Sync already running, ignoring request');
      return Response.json({
        success: false,
        error: 'Sync is already running',
        status: 'already_running'
      }, { headers: corsHeaders });
    }

    // Smart resume logic: Auto-detect if we should resume from current progress
    const shouldAutoResume = currentSyncStatus && currentSyncStatus.current_page > 1;
    
    const isResumeRequest = syncParams.resume === true || shouldAutoResume;
    
    // CRITICAL: Always use the current page from database if it exists, regardless of sync status
    const fromPage = currentSyncStatus && currentSyncStatus.current_page > 1 
      ? currentSyncStatus.current_page 
      : (syncParams.fromPage || 1);
    
    if (shouldAutoResume) {
      console.log(`🎯 AUTO-RESUMING: Detected paused sync at page ${currentSyncStatus.current_page} with ${currentSyncStatus.records_processed} cars processed`);
    }

    // MAXIMUM SPEED configuration optimized for upgraded compute
    const PAGE_SIZE = 100;
    const BATCH_SIZE = 300;  // Increased for upgraded compute (was 200)
    const MAX_EXECUTION_TIME = 1200000; // 20 minutes with upgraded compute (was 15min)
    const MAX_PAGES_PER_RUN = 750; // Much larger chunks for upgraded compute (was 500)
    const MAX_CONCURRENT_REQUESTS = 75; // Greatly increased (was 50)
    const REQUEST_DELAY_MS = 10; // Even faster delay for upgraded compute
    const RETRY_DELAY_MS = 250; // Faster retries for upgraded compute

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
      console.log(`🚀 RESUMING MAXIMUM SPEED SYNC from page ${fromPage} with ${updateData.records_processed} cars already processed`);
    } else {
      // Fresh start
      updateData.current_page = 1;
      updateData.records_processed = 0;
      console.log('🆕 Starting fresh maximum speed sync');
    }

    await supabase
      .from('sync_status')
      .upsert(updateData);

    // Get current car count for smart pagination
    const { count: existingCars } = await supabase
      .from('cars_cache')
      .select('*', { count: 'exact', head: true });

    // CRITICAL: Calculate exact resume position from database
    let startPage: number;
    
    if (existingCars && existingCars > 0) {
      // Resume from where we actually left off based on car count
      startPage = Math.floor(existingCars / PAGE_SIZE) + 1;
      console.log(`🎯 RESUMING HIGH-SPEED SYNC from calculated page ${startPage} (${existingCars} cars in database)`);
      
      // Update the sync status to reflect the correct position
      updateData.current_page = startPage;
      updateData.records_processed = existingCars;
      
    } else if (isResumeRequest && fromPage > 1) {
      startPage = fromPage;
      console.log(`⚡ RESUMING from specified page ${startPage}`);
    } else {
      startPage = 1;
      console.log('📍 Starting fresh sync from page 1');
    }

    let totalProcessed = 0;
    let currentPage = startPage;
    let consecutiveEmptyPages = 0;
    let errors = 0;
    const startTime = Date.now();
    let lastProgressUpdate = startTime;

    // STABLE processing loop with proper execution time management
    while (consecutiveEmptyPages < 10 && (currentPage - startPage) < MAX_PAGES_PER_RUN) {
      try {
        // Check execution time to prevent EarlyDrop timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > MAX_EXECUTION_TIME) {
          console.log(`⏰ Approaching execution limit (${elapsed}ms), pausing for auto-resume...`);
          break;
        }

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
            signal: AbortSignal.timeout(45000) // Increased for new compute upgrades and larger batches
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

        // Memory-efficient car transformation
        const carCacheItems = cars.map(car => {
          const lot = car.lots?.[0];
          const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : null;
          
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
            images: JSON.stringify(lot?.images?.normal || []),
            car_data: {
              buy_now: lot?.buy_now,
              current_bid: lot?.bid,
              keys_available: lot?.keys_available !== false
            },
            lot_data: lot,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_api_sync: new Date().toISOString()
          };
        });

        // Enhanced database writes with timeout handling
        for (let j = 0; j < carCacheItems.length; j += BATCH_SIZE) {
          const batch = carCacheItems.slice(j, j + BATCH_SIZE);
          
          const result = await processWithTimeoutHandling(supabase, batch, j / BATCH_SIZE + 1);
          if (result.success > 0) {
            totalProcessed += result.success;
          }
          if (result.errors > 0) {
            errors += result.errors;
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
          console.log(`🌐 Network error on page ${currentPage}, minimal delay for new compute...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay for new compute
        } else if (isApiError) {
          console.log(`🔐 API error on page ${currentPage}, brief wait optimized for new compute...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced delay for new compute
        } else {
          console.log(`⚠️ Unknown error on page ${currentPage}, continue with minimal delay...`);
          await new Promise(resolve => setTimeout(resolve, 250)); // Very brief delay for new compute
        }
        
        currentPage++;
        
        // More lenient error threshold for upgraded compute performance
        const errorThreshold = isResumeRequest ? 50 : 35; // Increased thresholds for new compute
        if (errors > errorThreshold) {
          console.error('❌ Too many errors, stopping sync');
          break;
        }
      }
    } // End of while loop

    // STABLE completion logic with proper pause/resume handling
    const hitExecutionLimit = (Date.now() - startTime) > MAX_EXECUTION_TIME;
    const hitPageLimit = (currentPage - startPage) >= MAX_PAGES_PER_RUN;
    const finalStatus = consecutiveEmptyPages >= 10 ? 'completed' : 'paused'; // Pause for auto-resume
    const isNaturalCompletion = consecutiveEmptyPages >= 10;
    
    const finalRecordsProcessed = isResumeRequest 
      ? (currentSyncStatus?.records_processed || 0) + totalProcessed
      : (existingCars || 0) + totalProcessed;
    
    let completionMessage: string;
    if (isNaturalCompletion) {
      completionMessage = `✅ SYNC 100% COMPLETE! Processed ${totalProcessed} new cars (Total: ${finalRecordsProcessed})`;
    } else if (hitExecutionLimit) {
      completionMessage = `⏰ Time limit reached. Processed ${totalProcessed} new cars - will auto-resume`;
    } else if (hitPageLimit) {
      completionMessage = `📊 Page limit reached. Processed ${totalProcessed} new cars - will auto-resume for completion`;
    } else {
      completionMessage = `✅ Chunk complete: ${totalProcessed} new cars processed - continuing automatically`;
    }
    
    console.log(`📊 Stable Sync Result: ${completionMessage}`);
    
    await supabase
      .from('sync_status')
      .update({
        status: finalStatus,
        current_page: currentPage,
        records_processed: finalRecordsProcessed,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString(),
        error_message: isNaturalCompletion ? 
          `Sync completed - processed ${totalProcessed} new cars, ${errors} errors` :
          `Processed ${totalProcessed} new cars, ${errors} errors - ready for auto-resume from page ${currentPage}`
      })
      .eq('id', 'cars-sync-main');
    
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

// Process with timeout handling and automatic retry with smaller batches
async function processWithTimeoutHandling(supabase: any, records: any[], batchNumber: number): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  try {
    // Try full batch first
    const { error } = await supabase
      .from('cars_cache')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      // Check if it's a timeout error
      if (isTimeoutError(error)) {
        console.log(`⏱️ Timeout detected for batch ${batchNumber}, retrying with smaller chunks...`);
        return await retryWithSmallerBatches(supabase, records, batchNumber);
      } else {
        console.error(`❌ Database error for batch ${batchNumber}:`, error);
        return { success: 0, errors: records.length };
      }
    } else {
      success = records.length;
      console.log(`✅ Successfully processed ${success} records in batch ${batchNumber}`);
      return { success, errors: 0 };
    }

  } catch (error) {
    // Handle timeout at the client level
    if (isTimeoutError(error)) {
      console.log(`⏱️ Client timeout for batch ${batchNumber}, retrying with smaller chunks...`);
      return await retryWithSmallerBatches(supabase, records, batchNumber);
    } else {
      console.error(`❌ Unexpected error in batch ${batchNumber}:`, error);
      return { success: 0, errors: records.length };
    }
  }
}

// Check if error is a timeout error
function isTimeoutError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  const errorCode = error.code || '';
  
  return errorCode === '57014' || 
         errorMessage.includes('timeout') || 
         errorMessage.includes('canceling statement');
}

// Retry with progressively smaller batches when timeout occurs
async function retryWithSmallerBatches(supabase: any, records: any[], originalBatchNumber: number): Promise<{ success: number; errors: number }> {
  const chunkSizes = [100, 50, 25, 10]; // Larger initial chunks for new compute
  let totalSuccess = 0;
  let totalErrors = 0;

  for (const chunkSize of chunkSizes) {
    console.log(`🔄 Trying batch ${originalBatchNumber} with chunk size ${chunkSize}...`);
    
    try {
      // Split into smaller chunks
      const chunks = [];
      for (let i = 0; i < records.length; i += chunkSize) {
        chunks.push(records.slice(i, i + chunkSize));
      }

      let chunkSuccess = 0;
      let chunkErrors = 0;

      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j];
        
        try {
          // MAXIMUM SPEED: No delays between chunks for max throughput
          const { error } = await supabase
            .from('cars_cache')
            .upsert(chunk, { onConflict: 'id' });

          if (error) {
            if (isTimeoutError(error)) {
              console.log(`⏱️ Still timing out with chunk size ${chunkSize}, trying smaller...`);
              chunkErrors += chunk.length;
              break; // Try next smaller size
            } else {
              console.error(`❌ Non-timeout error in chunk:`, error);
              chunkErrors += chunk.length;
            }
          } else {
            chunkSuccess += chunk.length;
          }

        } catch (chunkError) {
          if (isTimeoutError(chunkError)) {
            console.log(`⏱️ Chunk timeout with size ${chunkSize}, trying smaller...`);
            chunkErrors += chunk.length;
            break; // Try next smaller size
          } else {
            console.error(`❌ Chunk processing error:`, chunkError);
            chunkErrors += chunk.length;
          }
        }
      }

      // If we successfully processed everything with this chunk size, return
      if (chunkSuccess > 0 && chunkErrors === 0) {
        console.log(`✅ Successfully processed ${chunkSuccess} records with chunk size ${chunkSize}`);
        return { success: chunkSuccess, errors: 0 };
      } else if (chunkSuccess > 0) {
        // Partial success
        console.log(`⚠️ Partial success: ${chunkSuccess} processed, ${chunkErrors} failed with chunk size ${chunkSize}`);
        totalSuccess = chunkSuccess;
        totalErrors = chunkErrors;
      }

    } catch (error) {
      console.error(`❌ Error with chunk size ${chunkSize}:`, error);
      continue; // Try next smaller size
    }
  }

  // If we get here, we've tried all chunk sizes
  if (totalSuccess > 0) {
    console.log(`⚠️ Best effort result: ${totalSuccess} processed, ${totalErrors} failed`);
    return { success: totalSuccess, errors: totalErrors };
  } else {
    console.error(`💥 All retry attempts failed for batch ${originalBatchNumber}`);
    return { success: 0, errors: records.length };
  }
}

// MAXIMUM SPEED: Optimized fetch with minimal retry delays for max throughput
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        console.log(`⏰ Rate limited on attempt ${attempt}, minimal wait for max speed...`);
        await new Promise(resolve => setTimeout(resolve, 500 + (attempt * 250))); // Reduced for new compute
        continue;
      }
      
      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        console.log(`🔄 Server error ${response.status} on attempt ${attempt}, instant retry...`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Reduced for new compute
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`❌ Request failed on attempt ${attempt}, minimal delay retry:`, error);
      await new Promise(resolve => setTimeout(resolve, 50 * attempt)); // Reduced for new compute
    }
  }
  
  throw new Error('Max retries exceeded');
}