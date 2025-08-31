import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface APICarResponse {
  id: string;
  manufacturer?: { id: number; name: string };
  model?: { id: number; name: string };
  year: number;
  vin?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  color?: { id: number; name: string };
  body_type?: { id: number; name: string };
  drive?: { id: number; name: string };
  engine?: { 
    id: number; 
    name: string;
    capacity_cm3?: number;
    cylinders?: number;
  };
  doors?: number;
  seats?: number;
  created_at?: string;
  updated_at?: string;
  lots?: {
    id: number;
    lot?: string;
    bid?: number;
    buy_now?: number;
    current_bid?: number;
    reserve_met?: boolean;
    keys_available?: boolean;
    title_status?: string;
    condition?: string;
    damage?: {
      primary?: string;
      secondary?: string;
    };
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
    seller?: {
      type?: string;
      notes?: string;
    };
    auction?: {
      date?: string;
      time_left?: string;
      bid_count?: number;
      watchers_count?: number;
      views_count?: number;
    };
    odometer?: { 
      km?: number;
      miles?: number;
    };
    estimated_value?: number;
    features?: string[];
    inspection_report?: any;
    images?: { 
      normal?: string[];
      big?: string[];
      thumbnails?: string[];
    };
  }[];
}

// Enhanced retry function with exponential backoff and rate limiting
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries: number = 5,
  baseDelayMs: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : baseDelayMs * Math.pow(2, attempt);
        console.log(`⏳ Rate limited (429), waiting ${delayMs}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      // Handle server errors (5xx)
      if (response.status >= 500) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`🔄 Server error ${response.status}, retrying in ${delayMs}ms (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      if (response.ok) {
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`❌ Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// Complete field mapping function (1:1 with API)
function mapAPICarToDatabase(apiCar: APICarResponse): any {
  const lot = apiCar.lots?.[0] || {};
  const images = lot.images || {};
  const allImages = [
    ...(images.big || []),
    ...(images.normal || []),
    ...(images.thumbnails || [])
  ].filter((url, index, arr) => arr.indexOf(url) === index); // Remove duplicates
  
  const price = lot.buy_now || lot.current_bid || lot.bid || 0;
  const priceEur = Math.round(price + 2300); // Convert USD to EUR approximation
  
  return {
    id: apiCar.id.toString(),
    api_id: apiCar.id.toString(),
    make: apiCar.manufacturer?.name || 'Unknown',
    model: apiCar.model?.name || 'Unknown',
    year: apiCar.year || new Date().getFullYear(),
    price: priceEur,
    price_cents: priceEur * 100,
    price_usd: price,
    price_eur: priceEur,
    mileage: lot.odometer?.km?.toString() || lot.odometer?.miles?.toString() || null,
    vin: apiCar.vin,
    fuel: apiCar.fuel?.name,
    transmission: apiCar.transmission?.name,
    color: apiCar.color?.name,
    condition: lot.condition || 'unknown',
    lot_number: lot.lot?.toString(),
    engine_size: apiCar.engine?.name,
    cylinders: apiCar.engine?.cylinders,
    doors: apiCar.doors,
    seats: apiCar.seats,
    drive_type: apiCar.drive?.name,
    body_style: apiCar.body_type?.name,
    seller_type: lot.seller?.type,
    location_city: lot.location?.city,
    location_state: lot.location?.state,
    location_country: lot.location?.country || 'South Korea',
    auction_date: lot.auction?.date,
    sale_status: 'active',
    damage_primary: lot.damage?.primary,
    damage_secondary: lot.damage?.secondary,
    estimated_value: lot.estimated_value,
    reserve_met: lot.reserve_met,
    time_left: lot.auction?.time_left,
    bid_count: lot.auction?.bid_count || 0,
    watchers_count: lot.auction?.watchers_count || 0,
    views_count: lot.auction?.views_count || 0,
    title_status: lot.title_status,
    keys_count: lot.keys_available ? 2 : 0,
    image_count: allImages.length,
    image_url: allImages[0] || null,
    images: JSON.stringify(images.normal || []),
    high_res_images: JSON.stringify(images.big || []),
    thumbnail_url: images.thumbnails?.[0] || allImages[0] || null,
    external_url: `https://auctionsapi.com/lots/${lot.lot}`,
    source_site: 'auctionsapi.com',
    features: JSON.stringify(lot.features || []),
    inspection_report: lot.inspection_report || null,
    seller_notes: lot.seller?.notes,
    rank_score: price > 0 ? (1 / price) * 1000000 : 0,
    car_data: {
      buy_now: lot.buy_now,
      current_bid: lot.current_bid || lot.bid,
      keys_available: lot.keys_available !== false,
      has_images: allImages.length > 0,
      image_count: allImages.length
    },
    lot_data: lot,
    data_completeness_score: calculateCompletenessScore(apiCar),
    last_updated_source: apiCar.updated_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_api_sync: new Date().toISOString()
  };
}

// Calculate data completeness score (0-1)
function calculateCompletenessScore(car: APICarResponse): number {
  let score = 0;
  const maxFields = 25;
  
  if (car.manufacturer?.name) score++;
  if (car.model?.name) score++;
  if (car.year) score++;
  if (car.vin) score++;
  if (car.fuel?.name) score++;
  if (car.transmission?.name) score++;
  if (car.color?.name) score++;
  if (car.engine?.name) score++;
  if (car.doors) score++;
  if (car.seats) score++;
  
  const lot = car.lots?.[0];
  if (lot) {
    if (lot.buy_now || lot.bid) score++;
    if (lot.odometer?.km || lot.odometer?.miles) score++;
    if (lot.condition) score++;
    if (lot.images?.normal?.length) score++;
    if (lot.location?.city) score++;
    if (lot.auction?.date) score++;
    if (lot.damage) score++;
    if (lot.seller) score++;
    if (lot.features?.length) score++;
    if (lot.inspection_report) score++;
  }
  
  return Math.round((score / maxFields) * 100) / 100;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const API_KEY = Deno.env.get('AUCTIONS_API_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_KEY) {
      return Response.json({
        success: false,
        error: 'Missing required environment variables'
      }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const syncId = 'cars-sync-enhanced';
    const batchId = crypto.randomUUID();
    
    let syncParams: any = {};
    try {
      if (req.body) {
        syncParams = await req.json();
      }
    } catch (e) {
      console.log('Using default sync parameters');
    }

    const isResume = syncParams.resume === true;
    const API_BASE_URL = 'https://auctionsapi.com/api';
    
    console.log(`🚀 Starting enhanced sync (${isResume ? 'RESUME' : 'FRESH'}) with batch ID: ${batchId}`);

    // Get or create checkpoint
    const checkpoint = isResume ? await supabase.rpc('get_sync_checkpoint', { sync_id: syncId }) : null;
    const checkpointData = checkpoint?.data || {};
    
    const startPage = checkpointData.last_page || 1;
    const processedRecords = checkpointData.processed_records || 0;
    
    console.log(`📍 Starting from page ${startPage}, ${processedRecords} records already processed`);

    // Update sync status to running
    await supabase
      .from('sync_status')
      .upsert({
        id: syncId,
        sync_type: 'full',
        status: 'running',
        started_at: new Date().toISOString(),
        current_page: startPage,
        records_processed: processedRecords,
        batch_size: 1000,
        max_concurrent_requests: 3,
        rate_limit_delay_ms: 500,
        last_activity_at: new Date().toISOString()
      });

    // Get API total for completion tracking
    try {
      const metaResponse = await fetchWithRetry(
        `${API_BASE_URL}/cars?per_page=1&page=1`,
        {
          headers: {
            'accept': 'application/json',
            'x-api-key': API_KEY,
            'User-Agent': 'KorAuto-EnhancedSync/3.0'
          }
        },
        2
      );
      
      const metaData = await metaResponse.json();
      const totalApiRecords = metaData.total || metaData.meta?.total;
      
      if (totalApiRecords) {
        console.log(`📊 API reports ${totalApiRecords} total records`);
        await supabase
          .from('sync_status')
          .update({
            api_total_records: totalApiRecords,
            api_last_check: new Date().toISOString()
          })
          .eq('id', syncId);
      }
    } catch (error) {
      console.warn('⚠️ Could not get API total:', error);
    }

    const BATCH_SIZE = 1000;  // Process in batches of 1000
    const PAGE_SIZE = 500;    // API page size
    const CONCURRENT_LIMIT = 3; // Max concurrent requests
    
    let currentPage = startPage;
    let totalProcessed = processedRecords;
    let consecutiveEmptyPages = 0;
    let totalErrors = 0;
    const startTime = Date.now();

    // Main sync loop - continues until 100% complete
    while (consecutiveEmptyPages < 5) {
      try {
        console.log(`📄 Fetching page ${currentPage} (batch ${batchId})...`);
        
        const response = await fetchWithRetry(
          `${API_BASE_URL}/cars?per_page=${PAGE_SIZE}&page=${currentPage}&include_lots=1&include_images=1`,
          {
            headers: {
              'accept': 'application/json',
              'x-api-key': API_KEY,
              'User-Agent': 'KorAuto-EnhancedSync/3.0',
              'Accept-Encoding': 'gzip, deflate'
            },
            signal: AbortSignal.timeout(45000) // 45 second timeout
          },
          5, // 5 retries
          1000 // 1 second base delay
        );

        const data = await response.json();
        const cars: APICarResponse[] = data.data || data.cars || [];

        if (cars.length === 0) {
          consecutiveEmptyPages++;
          console.log(`📭 Empty page ${currentPage} (${consecutiveEmptyPages}/5)`);
          currentPage++;
          continue;
        }

        consecutiveEmptyPages = 0;
        console.log(`⚡ Processing ${cars.length} cars from page ${currentPage}...`);

        // Transform API data to database format with complete 1:1 mapping
        const transformedCars = cars.map(car => ({
          ...mapAPICarToDatabase(car),
          sync_batch_id: batchId,
          sync_retry_count: 0
        }));

        // Batch insert/update to cars_cache with enhanced error handling
        let batchSuccess = 0;
        for (let i = 0; i < transformedCars.length; i += BATCH_SIZE) {
          const batch = transformedCars.slice(i, i + BATCH_SIZE);
          
          try {
            const { data: result, error } = await supabase
              .from('cars_cache')
              .upsert(batch, { 
                onConflict: 'id',
                count: 'exact'
              });

            if (error) {
              console.error(`❌ Database error for batch ${i}-${i + batch.length}:`, error);
              totalErrors++;
              
              // Save error for debugging
              await supabase
                .from('sync_errors')
                .insert({
                  sync_run_id: batchId,
                  error_type: 'database_upsert',
                  error_message: error.message,
                  source_record_id: batch[0]?.id,
                  payload: { batch_size: batch.length, page: currentPage }
                });
            } else {
              batchSuccess += batch.length;
              console.log(`✅ Saved batch ${i}-${i + batch.length}: ${batch.length} cars`);
            }
          } catch (batchError) {
            console.error(`❌ Batch processing error:`, batchError);
            totalErrors++;
          }
        }

        totalProcessed += batchSuccess;

        // Save checkpoint every 10 pages for resumability
        if (currentPage % 10 === 0) {
          const checkpointData = {
            last_page: currentPage,
            processed_records: totalProcessed,
            last_batch_id: batchId,
            timestamp: new Date().toISOString(),
            performance_metrics: {
              pages_per_hour: ((currentPage - startPage) / ((Date.now() - startTime) / 1000 / 3600)).toFixed(2),
              records_per_minute: (totalProcessed / ((Date.now() - startTime) / 1000 / 60)).toFixed(2),
              error_rate: (totalErrors / totalProcessed * 100).toFixed(2)
            }
          };

          await supabase.rpc('save_sync_checkpoint', {
            sync_id: syncId,
            checkpoint_data: checkpointData
          });

          console.log(`💾 Checkpoint saved: Page ${currentPage}, ${totalProcessed} records`);
        }

        // Update sync status every page
        const completion = data.total ? (totalProcessed / data.total * 100) : 0;
        await supabase
          .from('sync_status')
          .update({
            current_page: currentPage,
            records_processed: totalProcessed,
            completion_percentage: Math.min(completion, 100),
            last_activity_at: new Date().toISOString(),
            performance_metrics: {
              current_batch: batchId,
              errors: totalErrors,
              pages_processed: currentPage - startPage + 1
            }
          })
          .eq('id', syncId);

        currentPage++;
        
        // Rate limiting to prevent API overload
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Page ${currentPage} failed:`, error);
        totalErrors++;
        
        // Save error for debugging
        await supabase
          .from('sync_errors')
          .insert({
            sync_run_id: batchId,
            error_type: 'api_fetch',
            error_message: error instanceof Error ? error.message : String(error),
            payload: { page: currentPage, url: `${API_BASE_URL}/cars?per_page=${PAGE_SIZE}&page=${currentPage}` }
          });

        currentPage++;
        
        // If too many errors, stop the sync
        if (totalErrors > 50) {
          console.error('❌ Too many errors, stopping sync');
          break;
        }
      }
    }

    // Determine final status
    const isComplete = consecutiveEmptyPages >= 5;
    const finalStatus = isComplete ? 'completed' : 'failed';
    
    console.log(`🏁 Sync ${finalStatus}: ${totalProcessed} records processed, ${totalErrors} errors`);

    // Update final sync status
    await supabase
      .from('sync_status')
      .update({
        status: finalStatus,
        completed_at: isComplete ? new Date().toISOString() : null,
        records_processed: totalProcessed,
        completion_percentage: 100,
        error_message: totalErrors > 0 ? `Completed with ${totalErrors} errors` : null,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', syncId);

    // Clear checkpoint on successful completion
    if (isComplete) {
      await supabase.rpc('save_sync_checkpoint', {
        sync_id: syncId,
        checkpoint_data: { completed: true, timestamp: new Date().toISOString() }
      });
    }

    return Response.json({
      success: true,
      status: finalStatus,
      totalProcessed,
      totalErrors,
      completionPercentage: 100,
      batchId
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Sync function error:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500, headers: corsHeaders });
  }
});