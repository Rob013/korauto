import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sample car data for emergency population
const SAMPLE_CARS = [
  {
    id: 'sample-1',
    external_id: 'sample-1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    price: 28000,
    mileage: 15000,
    title: 'Toyota Camry 2022',
    color: 'Silver',
    fuel: 'Gasoline',
    transmission: 'Automatic',
    location: 'South Korea',
    condition: 'excellent',
    image_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sample-2',
    external_id: 'sample-2',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    price: 24000,
    mileage: 22000,
    title: 'Honda Civic 2021',
    color: 'Blue',
    fuel: 'Gasoline',
    transmission: 'Manual',
    location: 'South Korea',
    condition: 'good',
    image_url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sample-3',
    external_id: 'sample-3',
    make: 'BMW',
    model: '3 Series',
    year: 2023,
    price: 45000,
    mileage: 8000,
    title: 'BMW 3 Series 2023',
    color: 'Black',
    fuel: 'Gasoline',
    transmission: 'Automatic',
    location: 'South Korea',
    condition: 'excellent',
    image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sample-4',
    external_id: 'sample-4',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2022,
    price: 52000,
    mileage: 12000,
    title: 'Mercedes-Benz C-Class 2022',
    color: 'White',
    fuel: 'Gasoline',
    transmission: 'Automatic',
    location: 'South Korea',
    condition: 'excellent',
    image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sample-5',
    external_id: 'sample-5',
    make: 'Audi',
    model: 'A4',
    year: 2021,
    price: 48000,
    mileage: 18000,
    title: 'Audi A4 2021',
    color: 'Gray',
    fuel: 'Gasoline',
    transmission: 'Automatic',
    location: 'South Korea',
    condition: 'good',
    image_url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400',
    last_synced_at: new Date().toISOString()
  }
];

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
    const syncType = searchParams.get('type') || 'full';
    const seedMode = searchParams.get('seed') === 'true';
    
    console.log(`🚀 Starting ${syncType} sync${seedMode ? ' (seed mode)' : ''}`);

    // If seed mode, populate with sample data
    if (seedMode) {
      console.log('🌱 Seeding database with sample cars...');
      
      const { error: seedError } = await supabase
        .from('cars')
        .upsert(SAMPLE_CARS, { onConflict: 'id' });
        
      if (seedError) {
        throw new Error(`Seed error: ${seedError.message}`);
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Sample data seeded successfully',
        cars_added: SAMPLE_CARS.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    // Build API URL
    const baseUrl = new URL('https://auctionsapi.com/api/cars');
    baseUrl.searchParams.set('api_key', 'd00985c77981fe8d26be16735f932ed1');
    baseUrl.searchParams.set('limit', '100'); // Conservative limit
    
    if (syncType === 'incremental') {
      // Look for recent changes (last 24 hours)
      const { data: lastSync } = await supabase
        .from('sync_status')
        .select('completed_at')
        .eq('sync_type', 'full')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastSync?.completed_at) {
        const minutesAgo = Math.floor((Date.now() - new Date(lastSync.completed_at).getTime()) / (1000 * 60));
        baseUrl.searchParams.set('minutes', Math.min(minutesAgo, 1440).toString()); // Max 24h
        console.log(`📅 Incremental sync: checking last ${minutesAgo} minutes`);
      }
    }

    let currentUrl = baseUrl.toString();
    let totalProcessed = 0;
    let currentPage = 1;
    const maxPages = 50; // Conservative limit per execution

    while (currentUrl && currentPage <= maxPages) {
      console.log(`📡 Fetching page ${currentPage}...`);
      
      try {
        // Fetch from API with timeout
        const response = await fetch(currentUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KORAUTO-WebApp/1.0'
          },
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log(`⏳ Rate limited, waiting 60 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
            continue;
          }
          if (response.status >= 500) {
            console.log(`🔄 Server error ${response.status}, waiting 90 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 90000));
            continue;
          }
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const apiData: ApiResponse = await response.json();
        const carsArray = Array.isArray(apiData.data) ? apiData.data : [];
        
        console.log(`📦 Received ${carsArray.length} cars`);

        if (carsArray.length === 0) {
          console.log(`🏁 No more cars - sync complete`);
          break;
        }

        // Transform and save cars
        const transformedCars = carsArray
          .map((car: CarData) => {
            try {
              const primaryLot = car.lots?.[0];
              const images = primaryLot?.images?.normal || primaryLot?.images?.big || [];
              
              const carId = car.id?.toString();
              const make = car.manufacturer?.name?.trim();
              const model = car.model?.name?.trim();
              
              if (!carId || !make || !model) {
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
            throw new Error(`Database error: ${upsertError.message}`);
          }

          totalProcessed += transformedCars.length;
          console.log(`✅ Saved ${transformedCars.length} cars (total: ${totalProcessed})`);
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
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`🏁 No next URL - reached end`);
          break;
        }

      } catch (error) {
        console.error(`❌ Error on page ${currentPage}:`, error.message);
        
        // Update error in sync record
        await supabase
          .from('sync_status')
          .update({
            error_message: error.message,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', syncRecord.id);

        // Continue to next page on non-critical errors
        if (error.message.includes('timeout') || error.message.includes('fetch')) {
          currentPage++;
          continue;
        } else {
          throw error; // Re-throw critical errors
        }
      }
    }

    // Mark sync as completed or paused
    const finalStatus = currentPage > maxPages ? 'paused' : 'completed';
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

    console.log(`🎉 Sync ${finalStatus}! Processed ${totalProcessed} cars across ${currentPage-1} pages`);

    // If paused, schedule continuation
    if (finalStatus === 'paused') {
      EdgeRuntime.waitUntil((async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minute wait
          
          const continueResponse = await fetch(`${supabaseUrl}/functions/v1/encar-sync?type=${syncType}`, {
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
        message: `Sync ${finalStatus} successfully`
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