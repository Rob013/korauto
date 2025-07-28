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
        
        // Construct API URL for Encar listings
        const apiUrl = new URL('https://auctionsapi.com/api/cars');
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
            'User-Agent': 'KORAUTO-EncarSync/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const apiData = await response.json();
        console.log(`Received ${apiData.cars?.length || 0} listings from API`);

        if (!apiData.cars || apiData.cars.length === 0) {
          hasMore = false;
          break;
        }

        // Transform API data to match our schema
        const transformedCars = apiData.cars.map((car: any) => {
          return {
            id: car.id?.toString() || `encar_${Math.random().toString(36).substr(2, 9)}`,
            external_id: car.id?.toString(),
            make: car.make || 'Unknown',
            model: car.model || 'Unknown',
            year: parseInt(car.year) || 2020,
            price: parseFloat(car.price) || 0,
            mileage: parseInt(car.mileage) || 0,
            photo_urls: car.images ? [car.images] : [],
            image: car.images || null,
            lot_number: car.lot_number || null,
            location: car.location || 'South Korea',
            fuel: car.fuel || null,
            transmission: car.transmission || null,
            color: car.color || null,
            condition: car.condition || null,
            vin: car.vin || null,
            title: car.title || `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim(),
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

        // Rate limiting - wait 500ms between requests for faster processing
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Progress logging every 10,000 records
        if (totalSynced > 0 && totalSynced % 10000 === 0) {
          console.log(`Progress Update: ${totalSynced} cars processed successfully`);
        }

      } catch (error) {
        console.error(`Error on page ${page}:`, error);
        
        // Implement exponential backoff retry logic
        if (page <= 3) { // Retry first few pages
          console.log(`Retrying page ${page} after error...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, page - 1)));
          continue; // Skip to next iteration to retry
        }
        
        await supabaseClient
          .from('sync_metadata')
          .update({
            status: 'failed',
            error_message: `Error on page ${page}: ${error.message}`,
            synced_records: totalSynced,
            total_records: totalRecords
          })
          .eq('id', syncRecord.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed on page ${page}: ${error.message}`,
            synced_records: totalSynced,
            pages_processed: page - 1
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