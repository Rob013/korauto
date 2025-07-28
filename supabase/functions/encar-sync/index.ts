import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EncarListing {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  photo_urls: string[];
  lot_number?: string;
  location?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  vin?: string;
  title?: string;
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
    const batchSize = parseInt(searchParams.get('batch_size') || '500');

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
        
        // Construct API URL for Encar listings
        const apiUrl = new URL('https://api.auctionapis.com/v1/listings');
        apiUrl.searchParams.append('api_key', 'd00985c77981fe8d26be16735f932ed1');
        apiUrl.searchParams.append('source', 'encar');
        apiUrl.searchParams.append('limit', batchSize.toString());
        apiUrl.searchParams.append('page', page.toString());
        
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
            'User-Agent': 'KORAUTO-EncarSync/1.0',
            'X-API-Key': 'd00985c77981fe8d26be16735f932ed1'
          }
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const apiData = await response.json();
        console.log(`Received ${apiData.data?.length || 0} listings from API`);

        if (!apiData.data || apiData.data.length === 0) {
          hasMore = false;
          break;
        }

        // Transform API data to match our schema
        const transformedCars = apiData.data.map((car: any) => {
          // Extract first photo URL from lots array
          let photoUrls: string[] = [];
          let lotNumber = '';
          
          if (car.lots && car.lots.length > 0) {
            const lot = car.lots[0];
            lotNumber = lot.lot || '';
            
            if (lot.images?.normal && Array.isArray(lot.images.normal)) {
              photoUrls = lot.images.normal.slice(0, 10); // Limit to 10 images
            }
          }

          return {
            id: car.id?.toString() || `encar_${Math.random().toString(36).substr(2, 9)}`,
            external_id: car.id?.toString(),
            make: car.manufacturer?.name || 'Unknown',
            model: car.model?.name || 'Unknown',
            year: car.year || 2020,
            price: parseFloat(car.lots?.[0]?.buy_now || car.lots?.[0]?.final_bid || '0') || 0,
            mileage: car.lots?.[0]?.odometer?.km || 0,
            photo_urls: photoUrls,
            image: photoUrls[0] || null,
            lot_number: lotNumber,
            location: 'South Korea',
            fuel: car.fuel?.name || null,
            transmission: car.transmission?.name || null,
            color: car.color?.name || null,
            condition: car.lots?.[0]?.condition?.name || null,
            vin: car.vin || null,
            title: car.title || `${car.manufacturer?.name || ''} ${car.model?.name || ''} ${car.year || ''}`.trim(),
            domain_name: 'encar_com',
            source_api: 'auctionapis',
            status: 'active'
          };
        });

        // Upsert cars in batches
        const { error: upsertError } = await supabaseClient
          .from('cars')
          .upsert(transformedCars, {
            onConflict: 'external_id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          console.error('Failed to upsert cars:', upsertError);
          throw upsertError;
        }

        totalSynced += transformedCars.length;
        totalRecords = apiData.total || totalSynced;
        
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
        hasMore = apiData.has_more === true && transformedCars.length === batchSize;
        page++;

        // Rate limiting - wait 1 second between requests
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Error on page ${page}:`, error);
        
        await supabaseClient
          .from('sync_metadata')
          .update({
            status: 'failed',
            error_message: error.message,
            synced_records: totalSynced,
            total_records: totalRecords
          })
          .eq('id', syncRecord.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            synced_records: totalSynced
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
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
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});