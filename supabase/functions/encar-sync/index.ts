import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CarData {
  id: number;
  year: number;
  title: string;
  vin: string;
  manufacturer: { id: number; name: string; };
  model: { id: number; name: string; manufacturer_id: number; };
  color: { name: string; id: number; };
  transmission: { name: string; id: number; };
  fuel: { name: string; id: number; };
  lots: Array<{
    id: number;
    lot: string;
    odometer: { km: number; mi: number; };
    buy_now: number;
    images: { normal: string[]; big: string[]; };
  }>;
}

interface ApiResponse {
  data: CarData[];
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
  meta?: {
    current_page?: number;
    from?: number;
    last_page?: number;
    path?: string;
    per_page?: number;
    to?: number;
    total?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(req.url);
    const syncType = searchParams.get('type') || 'incremental';
    
    console.log(`🚀 Starting ${syncType} sync - REAL API DATA ONLY`);

    // Check for existing running sync
    const { data: existingSync } = await supabase
      .from('sync_status')
      .select('*')
      .eq('status', 'running')
      .maybeSingle();

    if (existingSync) {
      console.log(`⚠️ Sync already running, exiting to prevent conflicts`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `${existingSync.sync_type} sync already running`,
          existing_sync_id: existingSync.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new sync record
    const { data: syncRecord, error: syncError } = await supabase
      .from('sync_status')
      .insert({
        sync_type: syncType,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (syncError) {
      throw new Error(`Failed to create sync record: ${syncError.message}`);
    }

    console.log(`✅ Created sync record: ${syncRecord.id}`);

    // Build API URL - FORCE REAL API USAGE
    const apiKey = 'd00985c77981fe8d26be16735f932ed1';
    const baseUrl = new URL('https://auctionsapi.com/api/cars');
    baseUrl.searchParams.set('api_key', apiKey);
    baseUrl.searchParams.set('limit', '1000'); // Large batch for efficiency
    
    if (syncType === 'incremental') {
      // For incremental, fetch recent changes (last 10 minutes)
      baseUrl.searchParams.set('minutes', '10');
      console.log(`📅 Incremental sync: checking last 10 minutes`);
    }

    let currentUrl = baseUrl.toString();
    let totalProcessed = 0;
    let currentPage = 1;
    const maxPagesPerExecution = 100; // Process 100 pages at a time for efficiency
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    console.log(`🎯 REAL API SYNC: Fetching live data from ${currentUrl}`);

    while (currentUrl && currentPage <= maxPagesPerExecution && consecutiveErrors < maxConsecutiveErrors) {
      console.log(`📡 Fetching page ${currentPage} from real API...`);
      
      try {
        // Fetch from API with retries
        let response;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            response = await fetch(currentUrl, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'KORAUTO-WebApp/1.0',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              },
              signal: AbortSignal.timeout(60000) // 60 second timeout
            });
            break; // Success, exit retry loop
          } catch (fetchError) {
            retryCount++;
            console.log(`🔄 Fetch attempt ${retryCount}/${maxRetries} failed: ${fetchError.message}`);
            
            if (retryCount >= maxRetries) {
              throw fetchError;
            }
            
            // Exponential backoff: wait 2^retryCount seconds
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }

        if (!response.ok) {
          console.log(`⚠️ HTTP ${response.status}: ${response.statusText}`);
          
          if (response.status === 429) {
            // Rate limited - wait 2 minutes
            console.log(`⏳ Rate limited, waiting 2 minutes...`);
            await new Promise(resolve => setTimeout(resolve, 120000));
            continue;
          }
          
          if (response.status >= 500) {
            console.log(`🔄 Server error ${response.status}, waiting 1 minute...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
            continue;
          }
          
          if (response.status === 401) {
            throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
          }
          
          if (response.status === 404) {
            console.log(`🔍 Resource not found - reached end of data`);
            break;
          }
          
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const apiData: ApiResponse = await response.json();
        const carsArray = Array.isArray(apiData.data) ? apiData.data : [];
        
        console.log(`📦 Received ${carsArray.length} real cars from API`);

        if (carsArray.length === 0) {
          console.log(`🏁 No more cars - sync complete`);
          break;
        }

        // Transform real API data to our database format
        const transformedCars = carsArray
          .map((car: CarData) => {
            try {
              const primaryLot = car.lots?.[0];
              const images = primaryLot?.images?.normal || primaryLot?.images?.big || [];
              
              const carId = car.id?.toString();
              const make = car.manufacturer?.name?.trim();
              const model = car.model?.name?.trim();
              
              if (!carId || !make || !model) {
                console.warn(`⚠️ Skipping car with missing data: ID=${carId}, Make=${make}, Model=${model}`);
                return null;
              }

              return {
                id: carId,
                external_id: carId,
                make,
                model,
                year: car.year && car.year > 1900 ? car.year : 2020,
                price: Math.max(primaryLot?.buy_now || 0, 0),
                mileage: Math.max(primaryLot?.odometer?.km || 0, 0),
                title: car.title?.trim() || `${make} ${model} ${car.year || ''}`,
                vin: car.vin?.trim() || null,
                color: car.color?.name?.trim() || null,
                fuel: car.fuel?.name?.trim() || null,
                transmission: car.transmission?.name?.trim() || null,
                lot_number: primaryLot?.lot?.toString() || null,
                image_url: images[0] || null,
                images: JSON.stringify(images),
                source_api: 'auctionapis',
                domain_name: 'encar_com',
                location: 'South Korea',
                condition: 'good',
                status: 'active',
                last_synced_at: new Date().toISOString()
              };
            } catch (error) {
              console.warn(`⚠️ Error transforming car ${car.id}:`, error.message);
              return null;
            }
          })
          .filter(car => car !== null);

        // Save real cars to database
        if (transformedCars.length > 0) {
          const { error: upsertError } = await supabase
            .from('cars')
            .upsert(transformedCars, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (upsertError) {
            throw new Error(`Database error: ${upsertError.message}`);
          }

          totalProcessed += transformedCars.length;
          console.log(`✅ Saved ${transformedCars.length} real cars (total: ${totalProcessed})`);
        }

        // Update sync progress
        await supabase
          .from('sync_status')
          .update({
            current_page: currentPage,
            records_processed: totalProcessed,
            total_records: apiData.meta?.total || totalProcessed,
            last_activity_at: new Date().toISOString(),
            next_url: apiData.links?.next || null
          })
          .eq('id', syncRecord.id);

        // Check for next page
        if (apiData.links?.next) {
          currentUrl = apiData.links.next;
          currentPage++;
          
          // Small delay to be API-friendly
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        } else {
          console.log(`🏁 No next URL - reached end`);
          break;
        }

        // Reset consecutive errors on success
        consecutiveErrors = 0;

      } catch (error) {
        consecutiveErrors++;
        console.error(`❌ Error on page ${currentPage} (${consecutiveErrors}/${maxConsecutiveErrors}):`, error.message);
        
        // Update error in sync record
        await supabase
          .from('sync_status')
          .update({
            error_message: error.message,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', syncRecord.id);

        // Skip to next page on non-critical errors
        if (error.message.includes('timeout') || error.message.includes('fetch')) {
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second wait
          continue;
        } else if (consecutiveErrors >= maxConsecutiveErrors) {
          throw error; // Too many consecutive errors
        } else {
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
      }
    }

    // Mark sync as completed or paused
    const finalStatus = currentPage > maxPagesPerExecution ? 'paused' : 'completed';
    const completedAt = finalStatus === 'completed' ? new Date().toISOString() : null;

    await supabase
      .from('sync_status')
      .update({
        status: finalStatus,
        completed_at: completedAt,
        records_processed: totalProcessed,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', syncRecord.id);

    console.log(`🎉 Sync ${finalStatus}! Processed ${totalProcessed} REAL cars across ${currentPage-1} pages`);

    // If paused, schedule continuation for incremental syncs
    if (finalStatus === 'paused' && syncType === 'full') {
      EdgeRuntime.waitUntil((async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute wait
          
          const continueResponse = await fetch(`${supabaseUrl}/functions/v1/encar-sync?type=full`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (continueResponse.ok) {
            console.log(`🔄 Continuation triggered successfully`);
          }
        } catch (error) {
          console.warn(`⚠️ Continuation failed:`, error.message);
        }
      })());
    }

    return new Response(
      JSON.stringify({
        success: true,
        sync_id: syncRecord.id,
        status: finalStatus,
        records_processed: totalProcessed,
        pages_processed: currentPage - 1,
        sync_type: syncType,
        message: `${syncType} sync ${finalStatus} - ${totalProcessed} real cars processed`,
        real_data_only: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical sync error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});