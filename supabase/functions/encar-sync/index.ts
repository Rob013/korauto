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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { searchParams } = new URL(req.url);
    const syncType = searchParams.get('type') || 'full';
    
    console.log(`🚀 Starting ${syncType} sync process`);

    // PHASE 1: Check for existing sync state or create new one
    let syncState: SyncState | null = null;
    
    // Look for existing paused sync to resume
    const { data: existingSync } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('sync_type', syncType)
      .eq('status', 'paused')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

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

      if (syncError) throw syncError;
      syncState = newSync;
      console.log(`✨ Created new sync state: ${syncState.id}`);
    }

    // PHASE 2: Build initial API URL
    let apiUrl: string;
    
    if (syncState.next_url) {
      // Resume from stored URL
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
        // Get last successful sync time
        const { data: lastSync } = await supabase
          .from('sync_metadata')
          .select('last_updated')
          .eq('sync_type', 'full')
          .eq('status', 'completed')
          .order('last_updated', { ascending: false })
          .limit(1)
          .single();
        
        if (lastSync?.last_updated) {
          const minutes = Math.floor((Date.now() - new Date(lastSync.last_updated).getTime()) / (1000 * 60));
          baseUrl.searchParams.set('minutes', minutes.toString());
          console.log(`⏰ Incremental sync: looking for cars updated in last ${minutes} minutes`);
        }
      }
      
      apiUrl = baseUrl.toString();
      console.log(`🆕 Built fresh URL for page ${syncState.current_page}`);
    }

    // PHASE 3: Process pages with chunked architecture
    const PAGES_PER_EXECUTION = 50; // Process 50 pages (2,500 cars) per execution
    let pagesProcessed = 0;
    let currentUrl = apiUrl;
    let hasMore = true;

    while (hasMore && pagesProcessed < PAGES_PER_EXECUTION) {
      console.log(`📡 Fetching page ${syncState.current_page} (${pagesProcessed + 1}/${PAGES_PER_EXECUTION})`);
      
      try {
        // Fetch from API
        const response = await fetch(currentUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KORAUTO-WebApp/1.0'
          },
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log(`⏳ Rate limited, waiting 15 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
            continue;
          }
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const apiData: ApiResponse = await response.json();
        const carsArray = apiData.data || [];
        
        console.log(`📦 Received ${carsArray.length} cars from API`);
        console.log(`🔗 Next URL: ${apiData.links?.next ? 'Available' : 'None'}`);

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

        // Save to database
        if (transformedCars.length > 0) {
          const { error: upsertError } = await supabase
            .from('cars')
            .upsert(transformedCars, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (upsertError) {
            console.error(`❌ Database error:`, upsertError.message);
            throw upsertError;
          }

          console.log(`✅ Saved ${transformedCars.length} cars to database`);
        }

        // Update sync state
        syncState.synced_records += transformedCars.length;
        syncState.total_records = apiData.meta?.total || syncState.synced_records;
        syncState.current_page++;
        syncState.next_url = apiData.links?.next || null;
        pagesProcessed++;

        // PHASE 4: Check pagination - use direct API links
        if (apiData.links?.next) {
          currentUrl = apiData.links.next;
          hasMore = true;
          console.log(`📄 Will continue with API's next URL`);
        } else {
          hasMore = false;
          console.log(`🏁 No next URL provided by API - reached end`);
        }

        // Update database state
        await supabase
          .from('sync_metadata')
          .update({
            current_page: syncState.current_page,
            next_url: syncState.next_url,
            synced_records: syncState.synced_records,
            total_records: syncState.total_records,
            last_updated: new Date().toISOString()
          })
          .eq('id', syncState.id);

        // Rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error processing page ${syncState.current_page}:`, error.message);
        
        // For timeouts and rate limits, wait and retry
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
          console.log(`⏰ Timeout - waiting 10 seconds before retry`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.log(`⏳ Rate limited - waiting 30 seconds`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          continue;
        }
        
        // For other errors, skip this page and continue
        console.log(`⚠️ Skipping page due to error, continuing...`);
        syncState.current_page++;
        currentUrl = null; // Will be reconstructed
        continue;
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
      
      // Trigger continuation
      EdgeRuntime.waitUntil((async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          await supabase.functions.invoke('encar-sync', {
            body: { type: syncType }
          });
          console.log(`🚀 Triggered continuation`);
        } catch (error) {
          console.error(`⚠️ Could not trigger continuation:`, error.message);
        }
      })());
    }

    // Update final status
    await supabase
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

    return new Response(
      JSON.stringify({
        success: true,
        message: `${finalStatus === 'completed' ? 'Completed' : 'Paused'} sync`,
        sync_type: syncType,
        total_synced: syncState.synced_records,
        total_records: syncState.total_records,
        pages_processed: pagesProcessed,
        status: finalStatus,
        will_continue: finalStatus === 'paused'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error:', error);
    
    // Update sync state to failed
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('sync_metadata')
        .update({
          status: 'failed',
          error_message: error.message.substring(0, 500),
          last_updated: new Date().toISOString()
        })
        .eq('status', 'in_progress');
    } catch (updateError) {
      console.error('Could not update sync status:', updateError);
    }
    
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