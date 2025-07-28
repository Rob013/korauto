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

interface SyncState {
  id: string;
  sync_type: string;
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed';
  current_page: number;
  next_url: string | null;
  synced_records: number;
  total_records: number;
  created_at: string;
  last_updated: string;
  error_message?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabase: any = null;
  let syncState: SyncState | null = null;

  try {
    // Initialize Supabase with validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(req.url);
    const syncType = searchParams.get('type') || 'full';
    
    console.log(`🚀 Starting ${syncType} sync process`);

    // PHASE 1: Check for existing sync state or create new one
    // Look for existing paused sync to resume
    const { data: existingSync, error: fetchError } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('sync_type', syncType)
      .eq('status', 'paused')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching existing sync:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (existingSync) {
      syncState = existingSync;
      console.log(`📍 Resuming existing sync from page ${syncState.current_page}`);
    } else {
      // Mark any in_progress syncs as failed
      await supabase
        .from('sync_metadata')
        .update({ status: 'failed', error_message: 'Superseded by new sync' })
        .eq('status', 'in_progress');

      // Create new sync state
      const { data: newSync, error: syncError } = await supabase
        .from('sync_metadata')
        .insert({
          sync_type: syncType,
          status: 'in_progress',
          current_page: 1,
          next_url: null,
          synced_records: 0,
          total_records: 0
        })
        .select()
        .single();

      if (syncError) {
        console.error('❌ Error creating sync state:', syncError);
        throw new Error(`Failed to create sync state: ${syncError.message}`);
      }
      
      syncState = newSync;
      console.log(`✨ Created new sync state: ${syncState.id}`);
    }

    // PHASE 2: Build initial API URL with validation
    let apiUrl: string;
    
    if (syncState.next_url) {
      // Resume from stored URL (most reliable method)
      apiUrl = syncState.next_url;
      console.log(`🔗 Using stored next URL: ${apiUrl.substring(0, 100)}...`);
    } else {
      // Build fresh URL
      const baseUrl = new URL('https://auctionsapi.com/api/cars');
      baseUrl.searchParams.set('api_key', 'd00985c77981fe8d26be16735f932ed1');
      baseUrl.searchParams.set('limit', '50');
      
      if (syncState.current_page > 1) {
        baseUrl.searchParams.set('page', syncState.current_page.toString());
      }
      
      if (syncType === 'incremental') {
        // Get last successful sync time with error handling
        const { data: lastSync, error: lastSyncError } = await supabase
          .from('sync_metadata')
          .select('last_updated')
          .eq('sync_type', 'full')
          .eq('status', 'completed')
          .order('last_updated', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (lastSyncError) {
          console.warn('⚠️ Could not get last sync time:', lastSyncError.message);
        }
        
        if (lastSync?.last_updated) {
          const minutes = Math.floor((Date.now() - new Date(lastSync.last_updated).getTime()) / (1000 * 60));
          baseUrl.searchParams.set('minutes', minutes.toString());
          console.log(`⏰ Incremental sync: looking for cars updated in last ${minutes} minutes`);
        } else {
          console.log(`⏰ No previous sync found - treating as full sync`);
        }
      }
      
      apiUrl = baseUrl.toString();
      console.log(`🆕 Built fresh URL for page ${syncState.current_page}`);
    }

    // PHASE 3: Process pages with optimized chunked architecture
    const PAGES_PER_EXECUTION = 30; // Process 30 pages (1,500 cars) per execution for better reliability
    let pagesProcessed = 0;
    let currentUrl = apiUrl;
    let hasMore = true;

    while (hasMore && pagesProcessed < PAGES_PER_EXECUTION) {
      console.log(`📡 Fetching page ${syncState.current_page} (${pagesProcessed + 1}/${PAGES_PER_EXECUTION})`);
      
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Validate URL before request
          if (!currentUrl || !currentUrl.startsWith('http')) {
            throw new Error(`Invalid API URL: ${currentUrl}`);
          }

          // Fetch from API with improved timeout and retry logic
          const response = await fetch(currentUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'KORAUTO-WebApp/1.0'
            },
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });

          if (!response.ok) {
            if (response.status === 429) {
              // Exponential backoff for rate limiting
              const waitTime = Math.min(15000 * Math.pow(2, retryCount), 60000); // Max 60s
              console.log(`⏳ Rate limited, waiting ${waitTime/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retryCount++; // Count rate limit as a retry
              continue;
            }
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          const responseText = await response.text();
          if (!responseText.trim()) {
            throw new Error('Empty response from API');
          }

          const apiData: ApiResponse = JSON.parse(responseText);
          
          // Validate API response structure
          if (!apiData || typeof apiData !== 'object') {
            throw new Error('Invalid API response format');
          }
          const carsArray = Array.isArray(apiData.data) ? apiData.data : [];
          
          console.log(`📦 Received ${carsArray.length} cars from API`);
          console.log(`🔗 Next URL: ${apiData.links?.next ? 'Available' : 'None'}`);
          console.log(`📊 Total records: ${apiData.meta?.total || 'Unknown'}`);

          // Check if we have data
          if (carsArray.length === 0) {
            console.log(`🏁 No more cars found - sync complete`);
            hasMore = false;
            break;
          }

        // Transform cars
        const transformedCars = carsArray
          .map((car: CarData) => {
            try {
              const primaryLot = car.lots?.[0];
              const images = primaryLot?.images?.normal || primaryLot?.images?.big || [];
              
              const carId = car.id?.toString();
              const make = car.manufacturer?.name?.trim();
              const model = car.model?.name?.trim();
              
              if (!carId || !make || !model) {
                console.warn(`⚠️ Skipping invalid car: ${carId} ${make} ${model}`);
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
                photo_urls: images.filter(url => url && typeof url === 'string'),
                image: images.find(url => url && typeof url === 'string') || null,
                lot_number: primaryLot?.lot?.toString() || null,
                location: 'South Korea',
                fuel: car.fuel?.name?.trim() || null,
                transmission: car.transmission?.name?.trim() || null,
                color: car.color?.name?.trim() || null,
                condition: 'good',
                vin: car.vin?.trim() || null,
                title: car.title?.trim() || `${make} ${model} ${car.year || ''}`.trim(),
                domain_name: 'encar_com',
                source_api: 'auctionapis',
                status: 'active',
                last_synced_at: new Date().toISOString()
              };
            } catch (error) {
              console.warn(`⚠️ Error transforming car ${car.id}:`, error.message);
              return null;
            }
          })
          .filter(car => car !== null);

          // Save to database with transaction safety
          if (transformedCars.length > 0) {
            const { error: upsertError } = await supabase
              .from('cars')
              .upsert(transformedCars, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });

            if (upsertError) {
              console.error(`❌ Database error:`, upsertError.message);
              throw new Error(`Database upsert failed: ${upsertError.message}`);
            }

            console.log(`✅ Saved ${transformedCars.length} cars to database`);
          } else {
            console.log(`⚠️ No valid cars to save from this batch`);
          }

          // Update sync state
          syncState.synced_records += transformedCars.length;
          syncState.total_records = apiData.meta?.total || syncState.synced_records;
          syncState.current_page++;
          syncState.next_url = apiData.links?.next || null;
          pagesProcessed++;

          // PHASE 4: Check pagination - use direct API links for reliability
          if (apiData.links?.next && typeof apiData.links.next === 'string') {
            currentUrl = apiData.links.next;
            hasMore = true;
            console.log(`📄 Will continue with API's next URL`);
          } else {
            hasMore = false;
            console.log(`🏁 No next URL provided by API - reached end`);
          }

          // Update database state with error handling
          const { error: updateError } = await supabase
            .from('sync_metadata')
            .update({
              current_page: syncState.current_page,
              next_url: syncState.next_url,
              synced_records: syncState.synced_records,
              total_records: syncState.total_records,
              last_updated: new Date().toISOString()
            })
            .eq('id', syncState.id);

          if (updateError) {
            console.error(`⚠️ Could not update sync metadata:`, updateError.message);
          }

          // Rate limiting with adaptive delay
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Success - break retry loop
          break;

        } catch (error) {
          retryCount++;
          console.error(`❌ Error on attempt ${retryCount}/${maxRetries}:`, error.message);
          
          if (retryCount >= maxRetries) {
            // Final attempt failed - skip this page
            console.log(`⚠️ Max retries reached, skipping page ${syncState.current_page}`);
            syncState.current_page++;
            
            // Try to build next URL manually if possible
            const baseUrl = new URL('https://auctionsapi.com/api/cars');
            baseUrl.searchParams.set('api_key', 'd00985c77981fe8d26be16735f932ed1');
            baseUrl.searchParams.set('limit', '50');
            baseUrl.searchParams.set('page', syncState.current_page.toString());
            currentUrl = baseUrl.toString();
            
            // Update state but continue
            await supabase
              .from('sync_metadata')
              .update({
                current_page: syncState.current_page,
                last_updated: new Date().toISOString(),
                error_message: `Skipped page due to: ${error.message}`
              })
              .eq('id', syncState.id);
            
            break;
          }
          
          // Wait before retry with exponential backoff
          const waitTime = 5000 * Math.pow(2, retryCount - 1);
          console.log(`⏰ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

    }

    // PHASE 5: Determine final status and handle continuation
    let finalStatus: string;
    
    if (!hasMore) {
      // Sync is complete
      finalStatus = 'completed';
      console.log(`🎉 Sync completed! Total: ${syncState.synced_records} cars`);
    } else {
      // Need to continue in next execution
      finalStatus = 'paused';
      console.log(`⏸️ Pausing after ${pagesProcessed} pages. Total so far: ${syncState.synced_records} cars`);
      
      // Trigger continuation with circuit breaker pattern
      EdgeRuntime.waitUntil((async () => {
        try {
          // Wait before continuation with jitter to prevent thundering herd
          const waitTime = 2000 + Math.random() * 3000; // 2-5 seconds
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Use direct HTTP call for more reliable continuation
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
          
          const continueResponse = await fetch(`${supabaseUrl}/functions/v1/encar-sync?type=${syncType}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: syncType }),
            signal: AbortSignal.timeout(10000) // 10 second timeout for continuation
          });
          
          if (!continueResponse.ok) {
            throw new Error(`HTTP ${continueResponse.status}: ${continueResponse.statusText}`);
          }
          
          const continueData = await continueResponse.json();
          console.log(`🚀 Triggered continuation successfully:`, continueData);
          
        } catch (error) {
          console.error(`⚠️ Critical error in continuation:`, error.message);
          // Mark sync as failed with robust error handling
          try {
            await supabase
              .from('sync_metadata')
              .update({
                status: 'failed',
                error_message: `Continuation failed: ${error.message}`.substring(0, 500),
                last_updated: new Date().toISOString()
              })
              .eq('id', syncState!.id);
          } catch (updateError) {
            console.error(`❌ Could not mark sync as failed:`, updateError.message);
          }
        }
      })());
    }

    // Update final status with error handling
    const { error: finalUpdateError } = await supabase
      .from('sync_metadata')
      .update({
        status: finalStatus,
        current_page: syncState.current_page,
        next_url: syncState.next_url,
        synced_records: syncState.synced_records,
        total_records: syncState.total_records,
        last_updated: new Date().toISOString()
      })
      .eq('id', syncState.id);

    if (finalUpdateError) {
      console.error(`⚠️ Could not update final status:`, finalUpdateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${finalStatus === 'completed' ? 'Completed' : 'Paused'} sync`,
        sync_type: syncType,
        synced_records: syncState.synced_records,
        total_records: syncState.total_records,
        pages_processed: pagesProcessed,
        status: finalStatus,
        current_page: syncState.current_page,
        next_url: syncState.next_url,
        will_continue: finalStatus === 'paused',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error:', error);
    
    // Update sync state to failed with robust error handling
    try {
      if (supabase && syncState?.id) {
        const { error: updateError } = await supabase
          .from('sync_metadata')
          .update({
            status: 'failed',
            error_message: error.message.substring(0, 500),
            last_updated: new Date().toISOString()
          })
          .eq('id', syncState.id);
          
        if (updateError) {
          console.error('❌ Could not update sync status:', updateError.message);
        }
      } else {
        // Try to mark any in-progress syncs as failed
        const fallbackSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await fallbackSupabase
          .from('sync_metadata')
          .update({
            status: 'failed',
            error_message: error.message.substring(0, 500),
            last_updated: new Date().toISOString()
          })
          .eq('status', 'in_progress');
      }
    } catch (updateError) {
      console.error('💥 Could not update sync status:', updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        sync_id: syncState?.id || null,
        timestamp: new Date().toISOString(),
        details: "Check edge function logs for more information"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});