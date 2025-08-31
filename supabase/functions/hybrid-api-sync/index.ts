import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  cars: any[];
  source: string;
  batchSize?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { cars, source, batchSize = 100 }: SyncRequest = await req.json();

    if (!cars || !Array.isArray(cars)) {
      return new Response(
        JSON.stringify({ error: 'Invalid cars data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Starting hybrid sync of ${cars.length} cars from ${source}`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process cars in batches for better performance
    for (let i = 0; i < cars.length; i += batchSize) {
      const batch = cars.slice(i, i + batchSize);
      
      try {
        // Transform API data to database format
        const transformedCars = batch.map(car => ({
          id: car.id || `hybrid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          api_id: car.id || car.api_id,
          make: car.make || car.manufacturer?.name,
          model: car.model || car.model?.name,
          year: car.year || 2020,
          price: car.price_eur || car.price || car.lots?.[0]?.buy_now || 0,
          mileage: car.mileage_km?.toString() || car.mileage || car.lots?.[0]?.odometer?.km?.toString(),
          fuel: car.fuel || car.fuel?.name,
          transmission: car.transmission || car.transmission?.name,
          color: car.color || car.color?.name,
          lot_number: car.lot_number || car.lots?.[0]?.lot_number,
          vin: car.vin,
          condition: car.condition || 'unknown',
          images: car.images || car.lots?.[0]?.images?.normal || [],
          car_data: {
            original_data: car,
            source: source,
            synced_at: new Date().toISOString(),
            thumbnail: car.thumbnail || car.lots?.[0]?.images?.normal?.[0]
          },
          last_api_sync: new Date().toISOString(),
          created_at: car.created_at || new Date().toISOString()
        }));

        // Batch upsert to database
        const { data, error } = await supabase
          .from('cars_cache')
          .upsert(transformedCars, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ Batch sync error:`, error);
          errorCount += batch.length;
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          syncedCount += batch.length;
          console.log(`✅ Synced batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cars.length / batchSize)}`);
        }

      } catch (batchError) {
        console.error(`❌ Batch processing error:`, batchError);
        errorCount += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message}`);
      }
    }

    // Update sync statistics
    try {
      const { error: statsError } = await supabase
        .from('sync_status')
        .upsert({
          id: `hybrid-sync-${source}`,
          sync_type: 'hybrid',
          status: errorCount > 0 ? 'completed_with_errors' : 'completed',
          records_processed: syncedCount,
          total_records: cars.length,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: errors.length > 0 ? errors.join('; ') : null
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (statsError) {
        console.error('❌ Stats update error:', statsError);
      }
    } catch (statsErr) {
      console.error('❌ Stats update exception:', statsErr);
    }

    const result = {
      success: true,
      syncedCount,
      errorCount,
      totalCount: cars.length,
      source,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synced ${syncedCount}/${cars.length} cars from ${source}`
    };

    console.log(`🎉 Hybrid sync completed:`, result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Hybrid sync error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Sync failed', 
        details: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});