import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Starting real car sync...');

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
    
    console.log(`📡 Starting ${syncType} sync with REAL API data`);

    // Check for existing running sync
    const { data: existingSync } = await supabase
      .from('sync_status')
      .select('*')
      .eq('status', 'running')
      .maybeSingle();

    if (existingSync) {
      console.log(`⚠️ Sync already running: ${existingSync.id}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Sync already running: ${existingSync.id}`,
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
      console.error('❌ Failed to create sync record:', syncError);
      throw new Error(`Failed to create sync record: ${syncError.message}`);
    }

    console.log(`✅ Created sync record: ${syncRecord.id}`);

    // Build API URL
    const apiKey = 'd00985c77981fe8d26be16735f932ed1';
    const apiUrl = `https://auctionsapi.com/api/cars?api_key=${apiKey}&limit=100`;
    
    console.log(`📡 Fetching from API: ${apiUrl}`);

    // Fetch from API with timeout
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    console.log(`📊 API Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const apiData = await response.json();
    console.log(`📦 Received API data structure:`, Object.keys(apiData));
    
    const carsArray = Array.isArray(apiData.data) ? apiData.data : [];
    console.log(`🚗 Found ${carsArray.length} cars in API response`);

    if (carsArray.length === 0) {
      await supabase
        .from('sync_status')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_processed: 0,
          total_records: 0,
          error_message: 'No cars found in API response'
        })
        .eq('id', syncRecord.id);

      return new Response(
        JSON.stringify({
          success: true,
          sync_id: syncRecord.id,
          status: 'completed',
          records_processed: 0,
          message: 'No cars found in API response'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform cars to our database format
    const transformedCars = [];
    
    for (const car of carsArray) {
      try {
        const primaryLot = car.lots?.[0];
        const images = primaryLot?.images?.normal || primaryLot?.images?.big || [];
        
        const carId = car.id?.toString();
        const make = car.manufacturer?.name?.trim();
        const model = car.model?.name?.trim();
        
        if (!carId || !make || !model) {
          console.warn(`⚠️ Skipping car with missing data: ID=${carId}, Make=${make}, Model=${model}`);
          continue;
        }

        const transformedCar = {
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
        
        transformedCars.push(transformedCar);
        
      } catch (error) {
        console.warn(`⚠️ Error transforming car ${car.id}:`, error.message);
      }
    }

    console.log(`✅ Transformed ${transformedCars.length} cars for database`);

    // Save cars to database
    if (transformedCars.length > 0) {
      const { error: upsertError } = await supabase
        .from('cars')
        .upsert(transformedCars, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('❌ Database upsert error:', upsertError);
        throw new Error(`Database error: ${upsertError.message}`);
      }

      console.log(`✅ Successfully saved ${transformedCars.length} cars to database`);
    }

    // Update sync status to completed
    await supabase
      .from('sync_status')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_processed: transformedCars.length,
        total_records: transformedCars.length,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', syncRecord.id);

    console.log(`🎉 Sync completed! ${transformedCars.length} real cars processed`);

    return new Response(
      JSON.stringify({
        success: true,
        sync_id: syncRecord.id,
        status: 'completed',
        records_processed: transformedCars.length,
        sync_type: syncType,
        message: `${syncType} sync completed - ${transformedCars.length} real cars processed`,
        cars_sample: transformedCars.slice(0, 3).map(c => ({ id: c.id, make: c.make, model: c.model, price: c.price }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical sync error:', error);
    
    // Try to update sync status as failed
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          last_activity_at: new Date().toISOString()
        })
        .eq('status', 'running');
    } catch (updateError) {
      console.error('Failed to update sync status:', updateError);
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