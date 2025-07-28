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
  total_count?: number;
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
    const batchSize = parseInt(searchParams.get('batch_size') || '1000');

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

    while (hasMore) {
      try {
        console.log(`Fetching page ${page} from AuctionAPIs...`);
        
        // Construct API URL for Encar listings with API key
        const apiUrl = new URL('https://auctionsapi.com/api/cars');
        apiUrl.searchParams.append('api_key', 'd00985c77981fe8d26be16735f932ed1');
        apiUrl.searchParams.append('limit', batchSize.toString());
        apiUrl.searchParams.append('offset', ((page - 1) * batchSize).toString());
        
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
            apiUrl.searchParams.append('minutes', minutes.toString());
          }
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
        
        // Handle the correct API response structure
        const carsArray = apiData.data || [];
        console.log(`Received ${carsArray.length} listings from API`);

        if (!carsArray || carsArray.length === 0) {
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
        totalRecords = apiData.total_count || totalSynced;
        
        console.log(`Synced ${transformedCars.length} cars (Total: ${totalSynced}/${totalRecords})`);

        // Update sync progress
        await supabaseClient
          .from('sync_metadata')
          .update({
            synced_records: totalSynced,
            total_records: totalRecords
          })
          .eq('id', syncRecord.id);

        // Check if we have more pages
        hasMore = transformedCars.length === batchSize && totalSynced < (apiData.total_count || 0);
        page++;

        // Rate limiting - wait 5 seconds between requests to avoid 429 errors
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Progress logging every 10,000 records
        if (totalSynced > 0 && totalSynced % 10000 === 0) {
          console.log(`Progress Update: ${totalSynced} cars processed successfully`);
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