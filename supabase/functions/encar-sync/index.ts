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
  manufacturer: {
    id: number;
    name: string;
  };
  model: {
    id: number;
    name: string;
    manufacturer_id: number;
  };
  color: {
    name: string;
    id: number;
  };
  transmission: {
    name: string;
    id: number;
  };
  fuel: {
    name: string;
    id: number;
  };
  lots: Array<{
    id: number;
    lot: string;
    odometer: {
      km: number;
      mi: number;
    };
    buy_now: number;
    images: {
      normal: string[];
      big: string[];
    };
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { searchParams } = new URL(req.url);
    const syncType = searchParams.get('type') || 'full';
    // Optimize batch size for better performance - larger batches for full sync, smaller for incremental
    const defaultBatchSize = syncType === 'full' ? 2000 : 500;
    const batchSize = parseInt(searchParams.get('batch_size') || defaultBatchSize.toString());

    console.log(`Starting ${syncType} sync with batch size ${batchSize}`);

    // Create sync metadata record
    const { data: syncRecord, error: syncError } = await supabaseClient
      .from('sync_metadata')
      .insert({
        sync_type: syncType,
        status: 'in_progress',
        total_records: 0,
        synced_records: 0
      })
      .select()
      .single();

    if (syncError) {
      console.error('Failed to create sync record:', syncError);
      throw syncError;
    }

    let totalSynced = 0;
    let totalRecords = 0;
    let page = 1;
    let hasMore = true;

    let nextUrl: string | null = null;
    
    while (hasMore) {
      try {
        console.log(`Fetching ${nextUrl ? 'next page' : 'page 1'} from AuctionAPIs...`);
        
        // Use either the next URL from pagination or construct initial URL
        let apiUrl: string;
        if (nextUrl) {
          apiUrl = nextUrl;
        } else {
          const baseUrl = new URL('https://auctionsapi.com/api/cars');
          baseUrl.searchParams.append('api_key', 'd00985c77981fe8d26be16735f932ed1');
          baseUrl.searchParams.append('limit', '50'); // API maximum is 50 per request
          
          if (syncType === 'incremental') {
            // Get last sync time for incremental updates
            const { data: lastSync } = await supabaseClient
              .from('sync_metadata')
              .select('last_updated')
              .eq('status', 'completed')
              .order('last_updated', { ascending: false })
              .limit(1)
              .single();
            
            if (lastSync?.last_updated) {
              const minutes = Math.floor((Date.now() - new Date(lastSync.last_updated).getTime()) / (1000 * 60));
              baseUrl.searchParams.append('minutes', minutes.toString());
            }
          }
          apiUrl = baseUrl.toString();
        }

        const response = await fetch(apiUrl.toString(), {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KORAUTO-WebApp/1.0',
            'x-api-key': 'd00985c77981fe8d26be16735f932ed1'
          }
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log(`Rate limited on page ${page}, waiting 10 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            continue; // Retry the same page
          }
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        let apiData: ApiResponse;
        try {
          apiData = await response.json();
          console.log(`API Response structure:`, Object.keys(apiData));
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError);
          throw new Error(`Invalid JSON response from API: ${parseError.message}`);
        }
        
        // Log pagination information for debugging
        console.log(`📊 API Pagination Info:`, {
          current_page: apiData.meta?.current_page,
          per_page: apiData.meta?.per_page,
          total: apiData.meta?.total,
          has_next: !!apiData.links?.next
        });
        
        // Handle the correct API response structure
        const carsArray = apiData.data || [];
        console.log(`Received ${carsArray.length} listings from API`);

        if (!carsArray || carsArray.length === 0) {
          console.log('No more cars found, ending pagination');
          hasMore = false;
          break;
        }

        // Transform API data to match our schema
        const transformedCars = carsArray.map((car: CarData) => {
          const primaryLot = car.lots?.[0];
          const imageUrls = primaryLot?.images?.normal || [];
          
          return {
            id: car.id.toString(),
            external_id: car.id.toString(),
            make: car.manufacturer?.name || 'Unknown',
            model: car.model?.name || 'Unknown',
            year: car.year || 2020,
            price: primaryLot?.buy_now || 0,
            mileage: primaryLot?.odometer?.km || 0,
            photo_urls: imageUrls,
            image: imageUrls.length > 0 ? imageUrls[0] : null,
            lot_number: primaryLot?.lot || null,
            location: 'South Korea',
            fuel: car.fuel?.name || null,
            transmission: car.transmission?.name || null,
            color: car.color?.name || null,
            condition: 'good',
            vin: car.vin || null,
            title: car.title || `${car.manufacturer?.name || ''} ${car.model?.name || ''} ${car.year || ''}`.trim(),
            domain_name: 'encar_com',
            source_api: 'auctionapis',
            status: 'active'
          };
        }).filter(car => car.id && car.make && car.model); // Filter out invalid entries

        // Upsert cars in batches (use 'id' as the conflict column)
        if (transformedCars.length > 0) {
          const { error: upsertError } = await supabaseClient
            .from('cars')
            .upsert(transformedCars, {
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.error('Failed to upsert cars:', upsertError);
            console.error('Sample car data:', transformedCars[0]);
            throw upsertError;
          }
        }

        totalSynced += transformedCars.length;
        totalRecords = apiData.meta?.total || totalSynced; // Use API's total count
        
        console.log(`Synced ${transformedCars.length} cars (Total: ${totalSynced}/${totalRecords})`);

        // Update sync progress
        await supabaseClient
          .from('sync_metadata')
          .update({
            synced_records: totalSynced,
            total_records: totalRecords
          })
          .eq('id', syncRecord.id);

        // ✅ CRITICAL FIX: Use API's pagination links instead of manual pagination
        if (apiData.links?.next) {
          nextUrl = apiData.links.next;
          hasMore = true;
          console.log(`📄 Next page URL found: ${nextUrl.substring(0, 100)}...`);
        } else {
          hasMore = false;
          console.log(`🏁 No next page URL - reached end of API results`);
        }

        // Optimized rate limiting - 2-3 seconds between requests for faster sync
        if (hasMore) {
          const waitTime = Math.random() * 1000 + 2000; // 2-3 seconds random wait
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Enhanced progress logging every 1,000 records for better monitoring
        if (totalSynced > 0 && totalSynced % 1000 === 0) {
          console.log(`🚗 Progress Update: ${totalSynced} cars processed successfully | Page: ${page} | Batch Size: ${batchSize}`);
        }

      } catch (error) {
        console.error(`Error on page ${page}:`, error);
        
        // Implement exponential backoff retry logic with max retries
        const maxRetries = 3;
        if (page <= maxRetries) {
          const waitTime = 5000 * Math.pow(2, page - 1); // 5s, 10s, 20s
          console.log(`Retrying page ${page} after error... (waiting ${waitTime}ms)`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Skip to next iteration to retry
        }
        
        // If we've exceeded retries, mark as failed but continue to next page
        console.log(`Max retries exceeded for page ${page}, continuing to next page...`);
        page++;
        continue;
      }
    }

    // Mark sync as completed
    await supabaseClient
      .from('sync_metadata')
      .update({
        status: 'completed',
        synced_records: totalSynced,
        total_records: totalRecords,
        last_updated: new Date().toISOString()
      })
      .eq('id', syncRecord.id);

    console.log(`Sync completed! Total synced: ${totalSynced} records`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} Encar listings`,
        sync_type: syncType,
        total_synced: totalSynced,
        total_records: totalRecords
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Sync function error:', error);
    console.error('Error stack:', error.stack);
    
    // Try to update sync metadata as failed if we have syncRecord
    try {
      if (typeof error === 'object' && error !== null) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('sync_metadata')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error occurred'
          })
          .eq('status', 'in_progress');
      }
    } catch (updateError) {
      console.error('Failed to update sync metadata:', updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error occurred',
        details: error?.stack || 'No stack trace available'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});