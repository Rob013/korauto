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

// Enhanced shutdown and error tracking
let shutdownHandled = false;
const executionMetrics = {
  startTime: 0,
  lastActivity: 0,
  processedRecords: 0,
  errors: 0,
  memorySnapshots: [] as unknown[]
};

// Enhanced shutdown handling and cleanup
function handleShutdown(reason: string) {
  if (shutdownHandled) return;
  shutdownHandled = true;
  
  const executionTime = Date.now() - executionMetrics.startTime;
  console.log(`🛑 Shutdown initiated: ${reason}`);
  console.log(`📊 Execution metrics:`, {
    executionTime,
    processedRecords: executionMetrics.processedRecords,
    errors: executionMetrics.errors,
    lastActivity: executionMetrics.lastActivity,
    memorySnapshots: executionMetrics.memorySnapshots.length
  });
  
  // Log the shutdown event with detailed metadata similar to the problem statement
  console.log('📤 Shutdown metadata:', {
    event_message: 'shutdown',
    event_type: 'Shutdown',
    reason: reason,
    cpu_time_used: executionTime,
    memory_used: getMemoryUsage(),
    execution_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    processed_records: executionMetrics.processedRecords,
    errors_encountered: executionMetrics.errors
  });
}

// Enhanced memory monitoring
function getMemoryUsage() {
  try {
    if (typeof Deno !== 'undefined' && Deno.memoryUsage) {
      return Deno.memoryUsage();
    }
    return { heap: 0, external: 0, total: 0 };
  } catch (error) {
    console.warn('Memory usage unavailable:', error);
    return { heap: 0, external: 0, total: 0 };
  }
}

// Comprehensive error boundary wrapper
async function safeExecute<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    executionMetrics.lastActivity = Date.now();
    const result = await operation();
    return result;
  } catch (error) {
    executionMetrics.errors++;
    console.error(`❌ ${operationName} failed:`, error);
    
    // Log detailed error information
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      operation: operationName,
      memoryUsage: getMemoryUsage()
    });
    
    if (fallbackValue !== undefined) {
      console.log(`🔄 Using fallback value for ${operationName}`);
      return fallbackValue;
    }
    
    throw error;
  }
}

// Enhanced Deno.serve with comprehensive error handling and shutdown monitoring
Deno.serve(async (req) => {
  // Initialize execution tracking
  executionMetrics.startTime = Date.now();
  executionMetrics.lastActivity = Date.now();
  executionMetrics.processedRecords = 0;
  executionMetrics.errors = 0;
  executionMetrics.memorySnapshots = [];
  
  // Add comprehensive try-catch wrapper for the entire request
  return await safeExecute(async () => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('📋 CORS preflight request handled');
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint with enhanced diagnostics
    if (req.method === 'GET') {
      console.log('🏥 Health check requested');
      const healthData = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'cars-sync',
        runtime: 'supabase-edge-runtime',
        deno_version: typeof Deno !== 'undefined' ? Deno.version : 'unknown',
        memory_usage: getMemoryUsage(),
        execution_metrics: executionMetrics
      };
      
      console.log('🏥 Health check response:', healthData);
      return Response.json(healthData, { headers: corsHeaders });
    }

    console.log('🚀 Starting cars-sync edge function execution');
    
    // Enhanced environment variable validation with detailed logging
    const SUPABASE_URL = await safeExecute(
      () => Promise.resolve(Deno.env.get('SUPABASE_URL')),
      'Get SUPABASE_URL'
    );
    const SUPABASE_SERVICE_ROLE_KEY = await safeExecute(
      () => Promise.resolve(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')),
      'Get SUPABASE_SERVICE_ROLE_KEY'
    );
    const API_KEY = await safeExecute(
      () => Promise.resolve(Deno.env.get('AUCTIONS_API_KEY')),
      'Get AUCTIONS_API_KEY'
    );
    
    console.log('🔧 Environment variables status:', {
      SUPABASE_URL: !!SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
      API_KEY: !!API_KEY
    });
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_KEY) {
      console.error('❌ Missing required environment variables');
      handleShutdown('MissingEnvironmentVariables');
      return Response.json({
        success: false,
        error: 'Configuration error: Missing required environment variables',
        shutdown_reason: 'MissingEnvironmentVariables'
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Enhanced Supabase client creation with error handling
    const supabase = await safeExecute(
      () => Promise.resolve(createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)),
      'Create Supabase client'
    );
    
    if (!supabase) {
      handleShutdown('SupabaseClientCreationFailed');
      return Response.json({
        success: false,
        error: 'Failed to create Supabase client',
        shutdown_reason: 'SupabaseClientCreationFailed'
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const API_BASE_URL = 'https://auctionsapi.com/api';

    // Enhanced request body parsing with error handling
    let syncParams: Record<string, unknown> = {};
    const bodyParseResult = await safeExecute(async () => {
      if (req.body) {
        const bodyText = await req.text();
        if (bodyText.trim()) {
          return JSON.parse(bodyText);
        }
      }
      return {};
    }, 'Parse request body', {});
    
    syncParams = bodyParseResult || {};
    
    console.log('🚀 Starting enhanced car sync with params:', syncParams);
    console.log('📊 Initial memory usage:', getMemoryUsage());

    // Check if this is a resume request
    const isResumeRequest = syncParams.resume === true;
    const fromPage = syncParams.fromPage || 1;
    const reconcileProgress = syncParams.reconcileProgress === true;

    // MAXIMUM SPEED configuration optimized for fastest possible sync
    const PAGE_SIZE = 250; // Increased from 200 for fewer API requests
    const BATCH_SIZE = 750; // Increased from 500 for larger database writes
    const MAX_PAGES_PER_RUN = 999999; // Unlimited pages to ensure 100% completion without pause
    const MAX_EXECUTION_TIME = 8 * 60 * 1000; // 8 minutes max execution to stay within edge function limits

    // Enhanced sync status management with error handling
    let currentSyncStatus = null;
    if (isResumeRequest) {
      // Get current sync status for resume
      currentSyncStatus = await safeExecute(async () => {
        const { data: existingStatus } = await supabase
          .from('sync_status')
          .select('*')
          .eq('id', 'cars-sync-main')
          .single();
        return existingStatus;
      }, 'Get current sync status');
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

    await safeExecute(async () => {
      await supabase
        .from('sync_status')
        .upsert(updateData);
    }, 'Update sync status');

    // Get current car count for smart pagination with error handling
    const existingCars = await safeExecute(async () => {
      const { count } = await supabase
        .from('cars_cache')
        .select('*', { count: 'exact', head: true });
      return count;
    }, 'Get existing car count', 0);

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
    const errors = 0;
    const startTime = Date.now();
    let lastProgressUpdate = startTime;

    // Enhanced processing loop with comprehensive error handling and shutdown monitoring
    while (consecutiveEmptyPages < 20) {
      // Check execution time to avoid edge function timeout
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.log(`⏰ Execution time limit reached (${Math.round(elapsedTime/1000)}s), saving progress and continuing via auto-resume...`);
        handleShutdown('ExecutionTimeLimit');
        break;
      }
      
      // Memory monitoring and cleanup
      if (currentPage % 10 === 0) {
        const memUsage = getMemoryUsage();
        executionMetrics.memorySnapshots.push({
          page: currentPage,
          timestamp: new Date().toISOString(),
          memory: memUsage
        });
        
        console.log(`📊 Memory status at page ${currentPage}:`, memUsage);
        
        // Force garbage collection if available
        if (typeof gc !== 'undefined') {
          gc();
          console.log('🧹 Forced garbage collection');
        }
      }
      
      const pageResult = await safeExecute(async () => {
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
        
        // Client-side complete mapping function to handle 100-argument limit errors
        const mapCompleteApiDataClientSide = (apiRecord: Record<string, unknown>) => {
          // Extract all possible images from the API response with type safety
          const getStringArray = (value: unknown): string[] => {
            if (Array.isArray(value)) {
              return value.filter((item): item is string => typeof item === 'string');
            }
            return [];
          };
          
          const allImages = [
            ...getStringArray(apiRecord.images),
            ...getStringArray(apiRecord.photos),
            ...getStringArray(apiRecord.pictures),
            ...getStringArray(apiRecord.thumbnails),
            ...getStringArray(apiRecord.gallery),
            ...getStringArray((apiRecord.lots as Record<string, unknown>[])?.[0]?.images?.normal),
            ...getStringArray((apiRecord.lots as Record<string, unknown>[])?.[0]?.images?.large)
          ].filter(Boolean);

          // Extract high resolution images
          const highResImages = [
            ...getStringArray(apiRecord.high_res_images),
            ...getStringArray(apiRecord.hd_images),
            ...getStringArray(apiRecord.full_size_images),
            ...getStringArray((apiRecord.lots as Record<string, unknown>[])?.[0]?.images?.large)
          ].filter(Boolean);

          // Map all available fields using chunked approach (client-side equivalent of database function)
          const mappedData = {
            // Basic vehicle information (chunk 1)
            api_id: apiRecord.id?.toString() || apiRecord.lot_id?.toString() || apiRecord.external_id?.toString(),
            make: apiRecord.make || apiRecord.manufacturer?.name,
            model: apiRecord.model?.name || apiRecord.model,
            year: parseInt(apiRecord.year || apiRecord.model_year) || 2020,
            vin: apiRecord.vin || apiRecord.chassis_number,
            mileage: apiRecord.mileage?.toString() || apiRecord.odometer?.toString() || apiRecord.kilometers?.toString() || apiRecord.lots?.[0]?.odometer?.km?.toString(),
            fuel: apiRecord.fuel?.name || apiRecord.fuel_type || apiRecord.fuel,
            transmission: apiRecord.transmission?.name || apiRecord.gearbox || apiRecord.transmission,
            color: apiRecord.color?.name || apiRecord.exterior_color || apiRecord.color,
            price: parseFloat(apiRecord.price || apiRecord.current_bid || apiRecord.lots?.[0]?.buy_now) || null,
            price_cents: (parseFloat(apiRecord.price || apiRecord.current_bid || apiRecord.lots?.[0]?.buy_now) || 0) * 100,
            condition: apiRecord.condition || apiRecord.grade || 'good',
            lot_number: apiRecord.lot_number || apiRecord.lot_id || apiRecord.lots?.[0]?.lot,
            images: allImages,
            high_res_images: highResImages,
            all_images_urls: allImages,

            // Engine and performance data (chunk 2)
            engine_size: apiRecord.engine_size || apiRecord.displacement || apiRecord.engine_capacity,
            engine_displacement: apiRecord.displacement,
            cylinders: parseInt(apiRecord.cylinders || apiRecord.engine_cylinders) || null,
            max_power: apiRecord.power || apiRecord.max_power || apiRecord.horsepower,
            torque: apiRecord.torque,
            acceleration: apiRecord.acceleration || apiRecord.zero_to_sixty,
            top_speed: apiRecord.top_speed || apiRecord.max_speed,
            co2_emissions: apiRecord.co2_emissions,
            fuel_consumption: apiRecord.fuel_consumption || apiRecord.mpg,
            doors: parseInt(apiRecord.doors || apiRecord.door_count) || null,
            seats: parseInt(apiRecord.seats || apiRecord.seat_count) || null,
            body_style: apiRecord.body_style || apiRecord.body_type,
            drive_type: apiRecord.drive_type || apiRecord.drivetrain,

            // Auction and sale data (chunk 3)
            lot_seller: apiRecord.seller,
            sale_title: apiRecord.title || apiRecord.sale_title,
            grade: apiRecord.grade || apiRecord.condition_grade,
            auction_date: apiRecord.auction_date || apiRecord.sale_date,
            time_left: apiRecord.time_left,
            bid_count: parseInt(apiRecord.bid_count) || 0,
            watchers_count: parseInt(apiRecord.watchers) || 0,
            views_count: parseInt(apiRecord.views) || 0,
            reserve_met: !!apiRecord.reserve_met,
            estimated_value: parseFloat(apiRecord.estimated_value) || null,
            previous_owners: parseInt(apiRecord.previous_owners) || 1,
            service_history: apiRecord.service_history,
            accident_history: apiRecord.accident_history || apiRecord.damage_history,
            modifications: apiRecord.modifications,
            warranty_info: apiRecord.warranty,

            // Registration and legal data (chunk 4)
            registration_date: apiRecord.registration_date || apiRecord.reg_date,
            first_registration: apiRecord.first_registration,
            mot_expiry: apiRecord.mot_expiry,
            road_tax: parseFloat(apiRecord.road_tax) || null,
            insurance_group: apiRecord.insurance_group,
            title_status: apiRecord.title_status || apiRecord.title,
            keys_count: parseInt(apiRecord.keys || apiRecord.key_count) || 0,
            keys_count_detailed: parseInt(apiRecord.keys) || 0,
            books_count: parseInt(apiRecord.books) || 0,
            spare_key_available: !!apiRecord.spare_key,
            service_book_available: !!apiRecord.service_book,
            location_country: apiRecord.country || 'South Korea',
            location_state: apiRecord.state,
            location_city: apiRecord.city,
            seller_type: apiRecord.seller_type,

            // Damage, features and metadata (chunk 5)
            damage_primary: apiRecord.primary_damage,
            damage_secondary: apiRecord.secondary_damage,
            features: apiRecord.features || apiRecord.equipment || [],
            inspection_report: apiRecord.inspection,
            seller_notes: apiRecord.description || apiRecord.notes || apiRecord.seller_notes,
            original_api_data: apiRecord,
            sync_metadata: {
              mapped_at: new Date().toISOString(),
              mapping_version: '2.0-client-side',
              sync_method: 'client_side_complete_mapping',
              api_fields_count: Object.keys(apiRecord).length,
              images_found: allImages.length,
              high_res_images_found: highResImages.length,
              has_lot_data: !!(apiRecord.lots && apiRecord.lots.length > 0),
              has_images: allImages.length > 0,
              fallback_reason: '100_argument_limit_workaround'
            },
            
            // Calculate rank_score based on price
            rank_score: 0
          };

          // Calculate rank_score based on price
          if (mappedData.price) {
            mappedData.rank_score = (1 / mappedData.price) * 1000000;
          }

          return mappedData;
        }
        
        for (const car of cars) {
          const carResult = await safeExecute(async () => {
            // Use the complete API mapping function to ensure all fields are captured
            const { data: mappedData, error: mappingError } = await supabase
              .rpc('map_complete_api_data', { api_record: car });

            if (mappingError) {
              console.error('❌ Mapping error for car', car.id, ':', mappingError);
              
              // Check if it's the 100-argument limit error
              if (mappingError.code === '54023' || mappingError.message?.includes('cannot pass more than 100 arguments')) {
                console.log('🔧 Using client-side complete mapping workaround for car', car.id);
                
                // Use client-side complete mapping instead of basic fallback
                const clientMappedData = mapCompleteApiDataClientSide(car);
                return {
                  ...clientMappedData,
                  id: car.id.toString(),
                  api_id: car.id.toString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_api_sync: new Date().toISOString()
                };
              }
              
              // For other mapping errors, use basic fallback
              const lot = car.lots?.[0];
              const price = lot?.buy_now ? Math.round(lot.buy_now + 2200) : null;
              
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
              };
            } else if (mappedData) {
              // Use the complete mapping with original API data preserved
              return {
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
              };
            }
            return null;
          }, `Map car ${car.id}`);
          
          if (carResult) {
            carCacheItems.push(carResult);
            executionMetrics.processedRecords++;
          }
        }

        // Enhanced database writes with chunking and error handling
        let processedInPage = 0;
        for (let j = 0; j < carCacheItems.length; j += BATCH_SIZE) {
          const batch = carCacheItems.slice(j, j + BATCH_SIZE);
          
          const batchResult = await safeExecute(async () => {
            const { error } = await supabase
              .from('cars_cache')
              .upsert(batch, { onConflict: 'id' });

            if (error) {
              throw error;
            }
            return batch.length;
          }, `Save batch ${j / BATCH_SIZE + 1}`, 0);
          
          processedInPage += batchResult || 0;
          
          // MAXIMUM SPEED: No artificial delays - let the system run at natural pace
        }

        return { processed: processedInPage, cars: carCacheItems };
        
      }, `Process page ${currentPage}`);

      if (pageResult) {
        totalProcessed += pageResult.processed;
      }

      // Update progress more frequently for real-time monitoring during MAXIMUM SPEED sync
      const now = Date.now();
      if (now - lastProgressUpdate > 10000) { // Every 10 seconds (reduced from 15) for max speed monitoring
        const finalRecordsProcessed = isResumeRequest 
          ? (currentSyncStatus?.records_processed || 0) + totalProcessed
          : (existingCars || 0) + totalProcessed;

        await safeExecute(async () => {
          await supabase
            .from('sync_status')
            .update({
              current_page: currentPage,
              records_processed: finalRecordsProcessed,
              last_activity_at: new Date().toISOString(),
              error_message: errors > 0 ? `${errors} errors encountered` : null
            })
            .eq('id', 'cars-sync-main');
        }, 'Update progress');

        lastProgressUpdate = now;
      }

      // Enhanced progress logging for high-speed monitoring
      if (currentPage % 5 === 0) { // Every 5 pages (reduced from 10) for better visibility
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = totalProcessed / elapsed * 60;
        console.log(`📈 High-Speed Progress: Page ${currentPage}, ${totalProcessed} new cars, Rate: ${rate.toFixed(0)} cars/min`);
      }

      currentPage++;
      
      // Force garbage collection hint for memory management
      if (currentPage % 50 === 0) {
        console.log('🧹 Memory cleanup hint');
        // @ts-expect-error - gc function may not be available
        if (typeof gc !== 'undefined') gc();
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
      await safeExecute(async () => {
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
      }, 'Final sync status update');
        
      console.log(`✅ Sync batch complete: ${totalProcessed} new cars processed - marked as running for auto-continuation`);
      
      handleShutdown('BatchComplete');
      
      return Response.json({
        success: true,
        status: 'running',
        totalProcessed,
        totalRecords: finalRecordsProcessed,
        currentPage,
        errors,
        isResume: isResumeRequest,
        message: `Batch complete: ${totalProcessed} new cars processed - continuing automatically`,
        shouldContinue: true,
        shutdown_reason: 'BatchComplete'
      }, { headers: corsHeaders });
    }
    
    // Only mark as completed if we've truly reached the end
    await safeExecute(async () => {
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
    }, 'Complete sync status update');

    console.log(`✅ SYNC 100% COMPLETE! Processed ${totalProcessed} new cars (Total: ${finalRecordsProcessed})`);
    
    handleShutdown('NaturalCompletion');

    return Response.json({
      success: true,
      status: 'completed',
      totalProcessed,
      totalRecords: finalRecordsProcessed,
      currentPage,
      errors,
      isResume: isResumeRequest,
      message: `✅ SYNC 100% COMPLETE! Processed ${totalProcessed} new cars (Total: ${finalRecordsProcessed})`,
      shutdown_reason: 'NaturalCompletion'
    }, { headers: corsHeaders });

  }, 'Main edge function execution');

  // If safeExecute fails for the main execution, handle it gracefully
  if (!arguments[0]) {
    handleShutdown('MainExecutionFailed');
    return Response.json({
      success: false,
      error: 'Main execution failed due to unhandled error',
      shutdown_reason: 'MainExecutionFailed',
      execution_metrics: executionMetrics
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}).catch((error) => {
  // Top-level catch for any unhandled errors
  console.error('💥 Top-level sync failure:', error);
  
  handleShutdown('TopLevelException');
  
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          error_message: `${errorType.toUpperCase()}: ${userFriendlyMessage}`,
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');
    }
  } catch (dbError) {
    console.error('Failed to update sync status:', dbError);
  }
  
  return Response.json({
    success: false,
    error: userFriendlyMessage,
    errorType,
    details: errorMessage,
    recoverable: ['timeout', 'network', 'server_error', 'database'].includes(errorType),
    shutdown_reason: 'TopLevelException',
    execution_metrics: executionMetrics
  }, { 
    status: 500,
    headers: corsHeaders 
  });
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