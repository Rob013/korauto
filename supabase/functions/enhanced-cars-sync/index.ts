import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Database } from '../_shared/database.types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced sync configuration for MAXIMUM SPEED with upgraded compute
const CONFIG = {
  MAX_CONCURRENT_REQUESTS: 75,          // Greatly increased for upgraded compute
  BATCH_SIZE: 3000,                     // Much larger batches (3x increase for new compute)
  REQUEST_DELAY_MS: 10,                 // Even faster delay (was 25ms)
  MAX_RETRIES: 25,                      // More retries for reliability
  RETRY_DELAY_MS: 250,                  // Faster retry (was 500ms)
  HEARTBEAT_INTERVAL_MS: 8000,          // More frequent heartbeats (8s)
  CHECKPOINT_FREQUENCY: 2,              // More frequent checkpoints (was 3)
  IMAGE_DOWNLOAD_CONCURRENCY: 75,       // Maximum image concurrency for new compute
  RESUME_FROM_116K: true,               // Special flag for resuming from 116k
  EXECUTION_TIME_LIMIT: 1200000,        // 20 minutes with upgraded compute
  DB_CHUNK_SIZE: 75,                    // Optimized DB chunks for speed
  TARGET_RECORDS: 250000                // Target all available API data (250k+)
};

interface APICarRecord {
  id?: string;
  lot_id?: string;
  external_id?: string;
  make?: string;
  model?: string;
  year?: number;
  model_year?: number;
  vin?: string;
  chassis_number?: string;
  mileage?: string;
  odometer?: string;
  kilometers?: string;
  fuel?: string;
  fuel_type?: string;
  transmission?: string;
  gearbox?: string;
  color?: string;
  exterior_color?: string;
  price?: number;
  current_bid?: number;
  condition?: string;
  grade?: string;
  lot_number?: string;
  images?: string[];
  photos?: string[];
  pictures?: string[];
  thumbnails?: string[];
  gallery?: string[];
  high_res_images?: string[];
  hd_images?: string[];
  full_size_images?: string[];
  engine_size?: string;
  displacement?: string;
  engine_capacity?: string;
  cylinders?: number;
  engine_cylinders?: number;
  power?: string;
  max_power?: string;
  horsepower?: string;
  torque?: string;
  acceleration?: string;
  zero_to_sixty?: string;
  top_speed?: string;
  max_speed?: string;
  co2_emissions?: string;
  fuel_consumption?: string;
  mpg?: string;
  doors?: number;
  door_count?: number;
  seats?: number;
  seat_count?: number;
  body_style?: string;
  body_type?: string;
  drive_type?: string;
  drivetrain?: string;
  seller?: string;
  title?: string;
  sale_title?: string;
  condition_grade?: string;
  auction_date?: string;
  sale_date?: string;
  time_left?: string;
  bid_count?: number;
  watchers?: number;
  views?: number;
  reserve_met?: boolean;
  estimated_value?: number;
  previous_owners?: number;
  service_history?: string;
  accident_history?: string;
  damage_history?: string;
  modifications?: string;
  warranty?: string;
  registration_date?: string;
  reg_date?: string;
  first_registration?: string;
  mot_expiry?: string;
  road_tax?: number;
  insurance_group?: string;
  title_status?: string;
  keys?: number;
  key_count?: number;
  books?: number;
  spare_key?: boolean;
  service_book?: boolean;
  country?: string;
  state?: string;
  city?: string;
  seller_type?: string;
  primary_damage?: string;
  secondary_damage?: string;
  features?: any[];
  equipment?: any[];
  inspection?: any;
  description?: string;
  notes?: string;
  seller_notes?: string;
  [key: string]: any; // Allow any additional fields from API
}

interface SyncState {
  isRunning: boolean;
  currentPage: number;
  totalProcessed: number;
  startTime: number;
  lastHeartbeat: number;
  errors: string[];
  successfulBatches: number;
  failedBatches: number;
  cursor?: string;
  lastRecordId?: string;
}

let syncState: SyncState = {
  isRunning: false,
  currentPage: 1,
  totalProcessed: 0,
  startTime: 0,
  lastHeartbeat: 0,
  errors: [],
  successfulBatches: 0,
  failedBatches: 0
};

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Complete API data mapping function
function mapCompleteAPIData(apiRecord: APICarRecord): any {
  // Extract ALL images from any possible field
  const allImages = [
    ...(apiRecord.images || []),
    ...(apiRecord.photos || []),
    ...(apiRecord.pictures || []),
    ...(apiRecord.thumbnails || []),
    ...(apiRecord.gallery || [])
  ].filter(Boolean);

  const highResImages = [
    ...(apiRecord.high_res_images || []),
    ...(apiRecord.hd_images || []),
    ...(apiRecord.full_size_images || [])
  ].filter(Boolean);

  // Map EVERY available field from API to database
  return {
    api_id: apiRecord.id || apiRecord.lot_id || apiRecord.external_id || `fallback-${Date.now()}`,
    make: apiRecord.make,
    model: apiRecord.model,
    year: apiRecord.year || apiRecord.model_year,
    vin: apiRecord.vin || apiRecord.chassis_number,
    mileage: apiRecord.mileage || apiRecord.odometer || apiRecord.kilometers,
    fuel: apiRecord.fuel || apiRecord.fuel_type,
    transmission: apiRecord.transmission || apiRecord.gearbox,
    color: apiRecord.color || apiRecord.exterior_color,
    price: apiRecord.price || apiRecord.current_bid,
    price_cents: (apiRecord.price || apiRecord.current_bid || 0) * 100,
    condition: apiRecord.condition || apiRecord.grade,
    lot_number: apiRecord.lot_number || apiRecord.lot_id,
    images: allImages,
    high_res_images: highResImages,
    all_images_urls: allImages,
    
    // Complete engine/performance data
    engine_size: apiRecord.engine_size || apiRecord.displacement || apiRecord.engine_capacity,
    engine_displacement: apiRecord.displacement,
    cylinders: apiRecord.cylinders || apiRecord.engine_cylinders,
    max_power: apiRecord.power || apiRecord.max_power || apiRecord.horsepower,
    torque: apiRecord.torque,
    acceleration: apiRecord.acceleration || apiRecord.zero_to_sixty,
    top_speed: apiRecord.top_speed || apiRecord.max_speed,
    co2_emissions: apiRecord.co2_emissions,
    fuel_consumption: apiRecord.fuel_consumption || apiRecord.mpg,
    
    // Complete vehicle details
    doors: apiRecord.doors || apiRecord.door_count,
    seats: apiRecord.seats || apiRecord.seat_count,
    body_style: apiRecord.body_style || apiRecord.body_type,
    drive_type: apiRecord.drive_type || apiRecord.drivetrain,
    
    // Auction/sale specific data
    lot_seller: apiRecord.seller,
    sale_title: apiRecord.title || apiRecord.sale_title,
    grade: apiRecord.grade || apiRecord.condition_grade,
    auction_date: apiRecord.auction_date || apiRecord.sale_date,
    time_left: apiRecord.time_left,
    bid_count: apiRecord.bid_count || 0,
    watchers_count: apiRecord.watchers || 0,
    views_count: apiRecord.views || 0,
    reserve_met: apiRecord.reserve_met || false,
    estimated_value: apiRecord.estimated_value,
    
    // History and documentation
    previous_owners: apiRecord.previous_owners || 1,
    service_history: apiRecord.service_history,
    accident_history: apiRecord.accident_history || apiRecord.damage_history,
    modifications: apiRecord.modifications,
    warranty_info: apiRecord.warranty,
    
    // Registration and legal
    registration_date: apiRecord.registration_date || apiRecord.reg_date,
    first_registration: apiRecord.first_registration,
    mot_expiry: apiRecord.mot_expiry,
    road_tax: apiRecord.road_tax,
    insurance_group: apiRecord.insurance_group,
    title_status: apiRecord.title_status || apiRecord.title,
    
    // Keys and documentation
    keys_count: apiRecord.keys || apiRecord.key_count || 0,
    keys_count_detailed: apiRecord.keys || 0,
    books_count: apiRecord.books || 0,
    spare_key_available: apiRecord.spare_key || false,
    service_book_available: apiRecord.service_book || false,
    
    // Location data
    location_country: apiRecord.country || 'South Korea',
    location_state: apiRecord.state,
    location_city: apiRecord.city,
    seller_type: apiRecord.seller_type,
    
    // Damage information
    damage_primary: apiRecord.primary_damage,
    damage_secondary: apiRecord.secondary_damage,
    
    // Features and equipment
    features: apiRecord.features || apiRecord.equipment || [],
    inspection_report: apiRecord.inspection,
    
    // Seller notes and descriptions
    seller_notes: apiRecord.description || apiRecord.notes || apiRecord.seller_notes,
    
    // Store complete original API data for future reference
    original_api_data: apiRecord,
    car_data: apiRecord, // Legacy field
    
    // Sync metadata
    api_version: '2.0',
    sync_metadata: {
      mapped_at: new Date().toISOString(),
      mapping_version: '2.0',
      fields_found: Object.keys(apiRecord).length,
      images_found: allImages.length,
      high_res_images_found: highResImages.length,
      sync_batch_id: crypto.randomUUID()
    },
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_api_sync: new Date().toISOString()
  };
}

// Get precise resume position
async function getResumePosition(): Promise<{ page: number; cursor?: string; recordId?: string; count: number }> {
  console.log('🔍 Determining precise resume position...');
  
  try {
    // Get current car count
    const { count } = await supabase
      .from('cars_cache')
      .select('*', { count: 'exact', head: true });
    
    const currentCount = count || 0;
    console.log(`📊 Current database count: ${currentCount.toLocaleString()}`);
    
    if (currentCount >= 116000) {
      // We have the stuck 116k records, calculate exact resume position
      const resumePage = Math.max(464, Math.floor(currentCount / 250) - 2); // Start 2 pages back for safety
      
      // Get the last processed record for cursor
      const { data: lastRecord } = await supabase
        .from('cars_cache')
        .select('api_id, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      console.log(`🎯 RESUMING FROM 116K: Page ${resumePage}, Last Record: ${lastRecord?.api_id}`);
      
      return {
        page: resumePage,
        cursor: lastRecord?.api_id,
        recordId: lastRecord?.api_id,
        count: currentCount
      };
    } else {
      // Fresh start or small resume
      return {
        page: 1,
        count: currentCount
      };
    }
  } catch (error) {
    console.error('❌ Error getting resume position:', error);
    return { page: 1, count: 0 };
  }
}

// Enhanced API fetch with complete error handling and correct endpoint
async function fetchAPIPage(page: number, cursor?: string): Promise<{ data: APICarRecord[]; nextCursor?: string; hasMore: boolean }> {
  const apiKey = Deno.env.get('AUCTIONS_API_KEY');
  if (!apiKey) {
    throw new Error('AUCTIONS_API_KEY environment variable is required');
  }

  // Use the correct working API endpoint 
  let url = `https://encar.com/dc/dc_cardetailapi.do?carid=${page}&method=kekd000002&version=v2&_callback=&per_page=${CONFIG.BATCH_SIZE}&include_images=true`;
  
  if (cursor) {
    url += `&cursor=${cursor}`;
  }

  console.log(`🌐 Fetching API page ${page} (cursor: ${cursor || 'none'})...`);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'KorAuto-MaxSpeed-Sync/2.0',
      'Accept': 'application/json',
      'Referer': 'https://www.encar.com/'
    },
    method: 'GET',
    // Add timeout to prevent hanging
    signal: AbortSignal.timeout(30000) // Increased for new compute upgrades
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const apiResponse = await response.json();
  const data = apiResponse.data || apiResponse.results || apiResponse.lots || [];
  
  // Enhanced logic to determine if more data is available
  const hasMore = (
    apiResponse.has_more !== false && 
    data.length > 0 && 
    data.length >= Math.min(CONFIG.BATCH_SIZE * 0.5, 100) // Continue if we got at least 50% of expected records
  );
  
  console.log(`📊 API Response: ${data.length} records, hasMore: ${hasMore}`);
  
  return {
    data,
    nextCursor: apiResponse.next_cursor || apiResponse.cursor,
    hasMore
  };
}

// Enhanced batch processing with timeout handling
async function processBatch(records: APICarRecord[], batchNumber: number): Promise<{ success: number; errors: number }> {
  if (!records.length) return { success: 0, errors: 0 };

  console.log(`📦 Processing batch ${batchNumber} with ${records.length} records...`);
  let success = 0;
  let errors = 0;

  try {
    // Map all records with complete API data
    const mappedRecords = records.map(record => {
      try {
        const mapped = mapCompleteAPIData(record);
        return mapped;
      } catch (error) {
        console.error(`❌ Error mapping record ${record.id}:`, error);
        errors++;
        return null;
      }
    }).filter(Boolean);

    if (mappedRecords.length === 0) {
      console.warn('⚠️ No valid records to insert in this batch');
      return { success: 0, errors: records.length };
    }

    // Process with timeout handling and retry logic
    const result = await processWithTimeoutHandling(mappedRecords, batchNumber);
    success = result.success;
    errors += result.errors;

    // Update sync metrics
    syncState.totalProcessed += success;
    if (success === mappedRecords.length) {
      syncState.successfulBatches++;
    } else {
      syncState.failedBatches++;
    }

  } catch (error) {
    console.error(`❌ Batch processing error:`, error);
    errors = records.length;
    syncState.failedBatches++;
    syncState.errors.push(`Batch ${batchNumber}: ${error.message}`);
  }

  return { success, errors };
}

// Process with timeout handling and automatic retry with smaller batches
async function processWithTimeoutHandling(records: any[], batchNumber: number): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  try {
    // Try full batch first
    const { data, error } = await supabase
      .from('cars_cache')
      .upsert(records, {
        onConflict: 'api_id',
        ignoreDuplicates: false
      });

    if (error) {
      // Check if it's a timeout error
      if (isTimeoutError(error)) {
        console.log(`⏱️ Timeout detected for batch ${batchNumber}, retrying with smaller chunks...`);
        return await retryWithSmallerBatches(records, batchNumber);
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
      return await retryWithSmallerBatches(records, batchNumber);
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
async function retryWithSmallerBatches(records: any[], originalBatchNumber: number): Promise<{ success: number; errors: number }> {
  const chunkSizes = [50, 25, 10, 5]; // Progressive size reduction
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
          // Add small delay between chunks to prevent overwhelming the database
          if (j > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const { data, error } = await supabase
            .from('cars_cache')
            .upsert(chunk, {
              onConflict: 'api_id',
              ignoreDuplicates: false
            });

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

// Save enhanced checkpoint
async function saveCheckpoint(page: number, cursor?: string, recordId?: string): Promise<void> {
  try {
    const checkpointData = {
      page,
      cursor,
      last_record: recordId,
      total_processed: syncState.totalProcessed,
      successful_batches: syncState.successfulBatches,
      failed_batches: syncState.failedBatches,
      timestamp: new Date().toISOString(),
      runtime_seconds: Math.floor((Date.now() - syncState.startTime) / 1000)
    };

    await supabase
      .from('sync_status')
      .update({
        current_page: page,
        records_processed: syncState.totalProcessed,
        api_endpoint_cursor: cursor,
        last_successful_record_id: recordId,
        checkpoint_data: checkpointData,
        last_activity_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        error_message: syncState.errors.length > 0 ? `${syncState.errors.length} errors encountered` : null
      })
      .eq('id', 'cars-sync-main');

    console.log(`💾 Checkpoint saved: Page ${page}, Processed ${syncState.totalProcessed.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Error saving checkpoint:', error);
  }
}

// Send heartbeat
async function sendHeartbeat(): Promise<void> {
  syncState.lastHeartbeat = Date.now();
  
  try {
    await supabase
      .from('sync_status')
      .update({
        last_heartbeat: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        records_processed: syncState.totalProcessed
      })
      .eq('id', 'cars-sync-main');
  } catch (error) {
    console.error('❌ Heartbeat error:', error);
  }
}

// Main sync function
async function runEnhancedSync(): Promise<{ success: boolean; message: string; stats: any }> {
  // Check both in-memory state and database status for accurate sync detection
  if (syncState.isRunning) {
    console.log('⚠️ In-memory sync state shows running, checking database status...');
  }

  // Check database sync status for comprehensive detection
  const { data: dbSyncStatus } = await supabase
    .from('sync_status')
    .select('status, last_activity_at, last_heartbeat')
    .eq('id', 'cars-sync-main')
    .single();

  const now = new Date();
  const lastActivity = dbSyncStatus?.last_activity_at ? new Date(dbSyncStatus.last_activity_at) : null;
  const lastHeartbeat = dbSyncStatus?.last_heartbeat ? new Date(dbSyncStatus.last_heartbeat) : null;
  
  // Consider sync stuck if no activity for 5 minutes (300 seconds)
  const isStuckSync = lastActivity && (now.getTime() - lastActivity.getTime()) > 300000;
  const isStuckHeartbeat = lastHeartbeat && (now.getTime() - lastHeartbeat.getTime()) > 300000;
  
  // Determine if sync is truly running or stuck
  const isTrulyRunning = dbSyncStatus?.status === 'running' && !isStuckSync && !isStuckHeartbeat;
  
  if (syncState.isRunning && isTrulyRunning) {
    console.log('⚠️ Sync already running, ignoring request');
    return { success: false, message: 'Sync already running', stats: null };
  }

  // If sync appears stuck, clear the stuck state and allow new sync
  if (dbSyncStatus?.status === 'running' && (isStuckSync || isStuckHeartbeat)) {
    console.log('🔄 Detected stuck sync, clearing and allowing new sync to start...');
    await supabase
      .from('sync_status')
      .update({
        status: 'failed',
        error_message: 'Previous sync was stuck/timed out',
        completed_at: now.toISOString()
      })
      .eq('id', 'cars-sync-main');
  }

  // Reset in-memory state to ensure clean start
  syncState.isRunning = false;

  console.log('🚀 Starting Enhanced Maximum Speed Sync with Complete API Mapping...');
  
  syncState = {
    isRunning: true,
    currentPage: 1,
    totalProcessed: 0,
    startTime: Date.now(),
    lastHeartbeat: Date.now(),
    errors: [],
    successfulBatches: 0,
    failedBatches: 0
  };

  try {
    // Update sync status to running
    await supabase
      .from('sync_status')
      .upsert({
        id: 'cars-sync-main',
        sync_type: 'enhanced_full',
        status: 'running',
        started_at: new Date().toISOString(),
        data_mapping_version: '2.0',
        max_concurrent_requests: CONFIG.MAX_CONCURRENT_REQUESTS,
        batch_size: CONFIG.BATCH_SIZE,
        records_processed: 0,
        error_message: null
      });

    // Get precise resume position
    const resumeInfo = await getResumePosition();
    syncState.currentPage = resumeInfo.page;
    syncState.cursor = resumeInfo.cursor;
    syncState.lastRecordId = resumeInfo.recordId;

    console.log(`📍 Starting sync from page ${syncState.currentPage} with ${resumeInfo.count.toLocaleString()} existing records`);

    // Set up heartbeat interval
    const heartbeatInterval = setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL_MS);

    let hasMore = true;
    let consecutiveErrors = 0;
    let batchNumber = 0;
    let totalApiRecordsProcessed = 0;

    while (hasMore && consecutiveErrors < 30 && totalApiRecordsProcessed < CONFIG.TARGET_RECORDS) { // Increased error tolerance for new compute
      try {
        batchNumber++;
        
        // Check execution time limit (upgraded compute allows 15 minutes)
        const runtime = Date.now() - syncState.startTime;
        if (runtime > CONFIG.EXECUTION_TIME_LIMIT) {
          console.log('⏰ Execution time limit reached, saving progress and exiting gracefully...');
          break;
        }
        
        // Fetch API page with complete data
        const apiResult = await fetchAPIPage(syncState.currentPage, syncState.cursor);
        
        if (!apiResult.data || apiResult.data.length === 0) {
          console.log(`📝 No more data available from API at page ${syncState.currentPage}`);
          hasMore = false;
          break;
        }

        console.log(`⚡ Processing ${apiResult.data.length} cars from page ${syncState.currentPage}...`);
        
        // Process batch with complete mapping
        const result = await processBatch(apiResult.data, batchNumber);
        totalApiRecordsProcessed += apiResult.data.length;
        
        if (result.success > 0) {
          consecutiveErrors = 0; // Reset error counter on success
          
          // Update cursor and record ID
          if (apiResult.nextCursor) {
            syncState.cursor = apiResult.nextCursor;
          }
          
          if (apiResult.data.length > 0) {
            const lastRecord = apiResult.data[apiResult.data.length - 1];
            syncState.lastRecordId = lastRecord.id || lastRecord.lot_id || lastRecord.external_id;
          }
          
          // Log progress every 500 records for monitoring
          if (totalApiRecordsProcessed % 500 === 0) {
            const rate = Math.round((totalApiRecordsProcessed / (runtime / 1000)) * 60); // cars per minute
            console.log(`📈 High-Speed Progress: Page ${syncState.currentPage}, ${totalApiRecordsProcessed} new cars, Rate: ${rate} cars/min`);
          }
        }

        // Save checkpoint every N batches
        if (batchNumber % CONFIG.CHECKPOINT_FREQUENCY === 0) {
          await saveCheckpoint(syncState.currentPage, syncState.cursor, syncState.lastRecordId);
        }

        // Update page for next iteration
        syncState.currentPage++;
        hasMore = apiResult.hasMore;

        // Minimal delay for maximum speed with upgraded compute
        await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY_MS));

      } catch (error) {
        consecutiveErrors++;
        console.error(`❌ Error in sync loop (attempt ${consecutiveErrors}/30):`, error); // Updated for new compute
        syncState.errors.push(`Page ${syncState.currentPage}: ${error.message}`);
        
        if (consecutiveErrors < 30) { // Updated for new compute
          // Progressive backoff delay optimized for new compute
          const delay = Math.min(CONFIG.RETRY_DELAY_MS * Math.pow(1.3, consecutiveErrors - 1), 5000); // Reduced max delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Clear heartbeat interval
    clearInterval(heartbeatInterval);

    // Final checkpoint
    await saveCheckpoint(syncState.currentPage, syncState.cursor, syncState.lastRecordId);

    // Final status determination
    const finalStatus = consecutiveErrors >= 30 ? 'failed' : // Updated for new compute 
                       totalApiRecordsProcessed >= CONFIG.TARGET_RECORDS ? 'completed' :
                       !hasMore ? 'completed' : 'paused';
                       
    const completionReason = consecutiveErrors >= 30 ? `Failed after ${consecutiveErrors} consecutive errors` : // Updated for new compute
                           totalApiRecordsProcessed >= CONFIG.TARGET_RECORDS ? `Target reached: ${totalApiRecordsProcessed.toLocaleString()} records` :
                           !hasMore ? 'All available API data processed' : 'Execution time limit reached';

    await supabase
      .from('sync_status')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        records_processed: syncState.totalProcessed,
        error_message: syncState.errors.length > 0 ? `${syncState.errors.length} errors, ${completionReason}` : completionReason
      })
      .eq('id', 'cars-sync-main');

    const stats = {
      totalProcessed: syncState.totalProcessed,
      totalApiRecords: totalApiRecordsProcessed,
      successfulBatches: syncState.successfulBatches,
      failedBatches: syncState.failedBatches,
      errorsCount: syncState.errors.length,
      runtimeSeconds: Math.floor((Date.now() - syncState.startTime) / 1000),
      finalPage: syncState.currentPage,
      finalStatus,
      completionReason,
      avgRate: Math.round((totalApiRecordsProcessed / ((Date.now() - syncState.startTime) / 1000)) * 60) // cars per minute
    };

    console.log(`🎉 Enhanced sync completed!`, stats);

    return {
      success: finalStatus === 'completed',
      message: finalStatus === 'completed' 
        ? `Successfully synced ${syncState.totalProcessed.toLocaleString()} records (${totalApiRecordsProcessed.toLocaleString()} from API) with complete mapping`
        : `Sync ${finalStatus}: ${completionReason}`,
      stats
    };

  } catch (error) {
    console.error('💥 Critical sync error:', error);
    
    // Mark as failed
    await supabase
      .from('sync_status')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: `Critical error: ${error.message}`
      })
      .eq('id', 'cars-sync-main');

    return {
      success: false,
      message: `Critical sync error: ${error.message}`,
      stats: {
        totalProcessed: syncState.totalProcessed,
        errorsCount: syncState.errors.length + 1,
        runtimeSeconds: Math.floor((Date.now() - syncState.startTime) / 1000)
      }
    };
  } finally {
    syncState.isRunning = false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case 'start':
      case 'resume':
        const result = await runEnhancedSync();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'status':
        return new Response(JSON.stringify({
          isRunning: syncState.isRunning,
          currentPage: syncState.currentPage,
          totalProcessed: syncState.totalProcessed,
          errors: syncState.errors.length,
          uptime: syncState.isRunning ? Math.floor((Date.now() - syncState.startTime) / 1000) : 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        // Default to starting sync
        const defaultResult = await runEnhancedSync();
        return new Response(JSON.stringify(defaultResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('🚨 Edge function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});