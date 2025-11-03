import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Premium brands to fetch
const PREMIUM_BRANDS = ['BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen'];

interface Car {
  id: string;
  manufacturer?: { id: number; name: string };
  model?: { id: number; name: string };
  year: number;
  vin?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  color?: { id: number; name: string };
  lots?: {
    id: number;
    lot?: string;
    buy_now?: number;
    status?: number;
    sale_status?: string;
    odometer?: {
      km?: number;
      mi?: number;
    };
    images?: {
      normal?: string[];
      big?: string[];
    };
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔄 Starting scheduled cars sync (every 6 hours)...');
    
    const API_KEY = 'd00985c77981fe8d26be16735f932ed1';
    const API_BASE_URL = 'https://auctionsapi.com/api';

    // Get last sync timestamp
    const { data: lastSync } = await supabaseClient
      .from('sync_schedule')
      .select('last_sync_at')
      .eq('sync_type', 'cars_incremental')
      .single();

    const lastSyncTime = lastSync?.last_sync_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Default: 7 days ago
    
    console.log(`📅 Last sync: ${lastSyncTime}`);
    console.log(`🎯 Fetching premium brands: ${PREMIUM_BRANDS.join(', ')}`);

    let totalSynced = 0;
    let totalNew = 0;

    // Background task for syncing
    const syncTask = async () => {
      try {
        // Fetch cars for each premium brand
        for (const brand of PREMIUM_BRANDS) {
          console.log(`\n📦 Fetching ${brand} cars...`);
          
          let page = 1;
          let hasMore = true;
          let brandCount = 0;

          while (hasMore && page <= 10) { // Limit to 10 pages per brand
            const response = await fetch(
              `${API_BASE_URL}/cars?per_page=50&page=${page}&sort=created_at&order=desc&manufacturer=${encodeURIComponent(brand)}`,
              {
                headers: {
                  'accept': 'application/json',
                  'x-api-key': API_KEY
                }
              }
            );

            if (!response.ok) {
              console.error(`❌ Failed to fetch ${brand} cars: ${response.status}`);
              break;
            }

            const data = await response.json();
            const cars: Car[] = data.data || [];

            if (cars.length === 0) {
              hasMore = false;
              break;
            }

            // Filter for recently updated cars
            const recentCars = cars.filter(car => {
              const carTimestamp = car.lots?.[0]?.created_at || new Date().toISOString();
              return new Date(carTimestamp) > new Date(lastSyncTime);
            });

            console.log(`  Found ${recentCars.length} new/updated ${brand} cars on page ${page}`);

            // Process cars
            for (const car of recentCars) {
              try {
                const lot = car.lots?.[0];
                const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : null;
                
                const carCache = {
                  id: car.id.toString(),
                  api_id: car.id.toString(),
                  make: car.manufacturer?.name || brand,
                  model: car.model?.name || 'Unknown',
                  year: car.year || 2020,
                  price: price,
                  price_cents: price ? price * 100 : null,
                  vin: car.vin,
                  fuel: car.fuel?.name,
                  transmission: car.transmission?.name,
                  color: car.color?.name,
                  lot_number: lot?.lot,
                  mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : null,
                  images: lot?.images?.normal || lot?.images?.big || [],
                  source_site: 'auctionsapi',
                  location_country: 'South Korea',
                  car_data: car,
                  lot_data: lot || {},
                  last_api_sync: new Date().toISOString(),
                  sale_status: lot?.status === 3 ? 'sold' : lot?.status === 2 ? 'pending' : 'active'
                };

                // Check if car exists
                const { data: existing } = await supabaseClient
                  .from('cars_cache')
                  .select('id')
                  .eq('id', car.id.toString())
                  .single();

                const { error } = await supabaseClient
                  .from('cars_cache')
                  .upsert(carCache, { 
                    onConflict: 'id',
                    ignoreDuplicates: false 
                  });

                if (!error) {
                  totalSynced++;
                  brandCount++;
                  if (!existing) {
                    totalNew++;
                  }
                }
              } catch (err) {
                console.error(`❌ Error processing car ${car.id}:`, err);
              }
            }

            // If no recent cars on this page, stop pagination for this brand
            if (recentCars.length === 0) {
              console.log(`  ⏭️  No more recent cars for ${brand}, moving to next brand`);
              hasMore = false;
              break;
            }

            page++;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          console.log(`✅ ${brand}: ${brandCount} cars processed`);
        }

        // Update last sync timestamp
        await supabaseClient
          .from('sync_schedule')
          .upsert({
            sync_type: 'cars_incremental',
            last_sync_at: new Date().toISOString(),
            next_sync_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
            status: 'completed',
            cars_synced: totalSynced,
            cars_new: totalNew
          }, {
            onConflict: 'sync_type'
          });

        console.log(`\n✅ Scheduled sync complete!`);
        console.log(`   Total synced: ${totalSynced}`);
        console.log(`   New cars: ${totalNew}`);
        console.log(`   Next sync: ${new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()}`);

      } catch (err) {
        console.error('❌ Background sync failed:', err);
        
        // Log error in sync_schedule
        await supabaseClient
          .from('sync_schedule')
          .upsert({
            sync_type: 'cars_incremental',
            last_sync_at: new Date().toISOString(),
            next_sync_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            status: 'failed',
            error_message: err.message
          }, {
            onConflict: 'sync_type'
          });
      }
    };

    // Start background sync
    // @ts-ignore - EdgeRuntime is available in Deno
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(syncTask());
    } else {
      // Fallback for local testing
      syncTask();
    }

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled sync started in background',
        lastSync: lastSyncTime,
        nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        premiumBrands: PREMIUM_BRANDS
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Scheduled sync failed:', error);
    
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
