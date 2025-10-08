import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Car {
  id: string;
  manufacturer?: { id: number; name: string };
  model?: { id: number; name: string };
  generation?: { id: number; name: string; manufacturer_id: number; model_id: number };
  year: number;
  vin?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  color?: { id: number; name: string };
  body_type?: { id: number; name: string };
  engine?: { id: number; name: string };
  drive_wheel?: string;
  vehicle_type?: { id: number; name: string };
  cylinders?: string;
  lots?: {
    id: number;
    lot?: string;
    buy_now?: number;
    status?: number;
    sale_status?: string;
    final_price?: number;
    bid?: number;
    damage?: {
      main?: string;
      second?: string;
    };
    keys_available?: boolean;
    airbags?: string;
    grade_iaai?: string;
    seller?: string;
    seller_type?: string;
    sale_date?: string;
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
      'https://qtyyiqimkysmjnaocswe.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🚀 Starting cars sync...');
    
    const API_KEY = 'd00985c77981fe8d26be16735f932ed1';
    const API_BASE_URL = 'https://auctionsapi.com/api';
    
    let page = 1;
    let totalSynced = 0;
    let hasMorePages = true;
    
    while (hasMorePages && page <= 10) { // Limit to 10 pages for safety
      console.log(`📄 Fetching page ${page}...`);
      
      const response = await fetch(`${API_BASE_URL}/cars?per_page=50&page=${page}`, {
        headers: {
          'accept': '*/*',
          'x-api-key': API_KEY
        }
      });

      if (!response.ok) {
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const cars: Car[] = data.data || [];
      
      if (cars.length === 0) {
        console.log('✅ No more cars to sync');
        hasMorePages = false;
        break;
      }

      console.log(`🔄 Processing ${cars.length} cars from page ${page}...`);

      // Process cars in batches - Use complete API mapping
      const batchSize = 10;
      for (let i = 0; i < cars.length; i += batchSize) {
        const batch = cars.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (car) => {
          try {
            // Use the database function to map ALL API fields
            const { data: mappedData, error: mappingError } = await supabaseClient
              .rpc('map_complete_api_data', { api_record: car });

            if (mappingError) {
              console.error(`❌ Error mapping car ${car.id}:`, mappingError);
              return;
            }

            // Extract core fields from mapped data
            const lot = car.lots?.[0];
            const images = lot?.images?.normal || lot?.images?.big || [];
            const highResImages = lot?.images?.big || [];
            
            const carCache = {
              // IDs
              id: mappedData.api_id || car.id.toString(),
              api_id: mappedData.api_id || car.id.toString(),
              
              // Basic info
              make: mappedData.make || car.manufacturer?.name || 'Unknown',
              model: mappedData.model || car.model?.name || 'Unknown',
              year: mappedData.year || car.year || 2020,
              vin: mappedData.vin || car.vin,
              
              // Pricing
              price: mappedData.price ? Number(mappedData.price) : null,
              price_cents: mappedData.price_cents || null,
              price_usd: lot?.buy_now ? Math.round(lot.buy_now) : null,
              price_eur: lot?.buy_now ? Math.round(lot.buy_now * 0.92) : null,
              
              // Vehicle details
              fuel: mappedData.fuel || car.fuel?.name,
              transmission: mappedData.transmission || car.transmission?.name,
              color: mappedData.color || car.color?.name,
              condition: mappedData.condition || lot?.condition?.name?.replace('run_and_drives', 'Good'),
              mileage: mappedData.mileage || (lot?.odometer?.km ? `${lot.odometer.km} km` : null),
              
              // Engine/Performance
              engine_size: mappedData.engine_size || car.engine?.name,
              engine_displacement: mappedData.engine_displacement,
              cylinders: mappedData.cylinders || Number(car.cylinders),
              max_power: mappedData.max_power,
              torque: mappedData.torque,
              body_style: mappedData.body_style || car.body_type?.name,
              drive_type: mappedData.drive_type || car.drive_wheel,
              doors: mappedData.doors,
              seats: mappedData.seats,
              
              // Lot/Auction info
              lot_number: mappedData.lot_number || lot?.lot,
              lot_seller: mappedData.lot_seller || lot?.seller,
              grade: mappedData.grade || lot?.grade_iaai,
              sale_status: lot?.sale_status,
              auction_date: mappedData.auction_date || lot?.sale_date,
              bid_count: mappedData.bid_count || 0,
              
              // Images - Store ALL available images
              images: images.length > 0 ? JSON.stringify(images) : '[]',
              high_res_images: highResImages.length > 0 ? JSON.stringify(highResImages) : '[]',
              all_images_urls: [...images, ...highResImages],
              image_url: images[0] || highResImages[0] || null,
              image_count: images.length + highResImages.length,
              
              // Keys and documentation
              keys_count: mappedData.keys_count || (lot?.keys_available ? 1 : 0),
              keys_count_detailed: lot?.keys_available ? 1 : 0,
              
              // Damage info
              damage_primary: mappedData.damage_primary || lot?.damage?.main,
              damage_secondary: mappedData.damage_secondary || lot?.damage?.second,
              
              // Location
              location_country: 'South Korea',
              location_city: mappedData.location_city,
              location_state: mappedData.location_state,
              seller_type: mappedData.seller_type || lot?.seller_type,
              
              // Raw data storage (preserve ALL API data)
              car_data: JSON.stringify(car),
              lot_data: JSON.stringify(lot || {}),
              original_api_data: JSON.stringify(car),
              sync_metadata: JSON.stringify({
                synced_at: new Date().toISOString(),
                sync_version: '3.0',
                data_mapping_used: true,
                fields_captured: Object.keys(car).length
              }),
              
              // Metadata
              last_api_sync: new Date().toISOString(),
              data_completeness_score: Object.keys(car).length / 50, // Rough score
              api_version: '1.0',
              source_site: 'auctionsapi'
            };

            const { error } = await supabaseClient
              .from('cars_cache')
              .upsert(carCache, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });

            if (error) {
              console.error(`❌ Error upserting car ${car.id}:`, error);
            } else {
              totalSynced++;
              if (totalSynced % 10 === 0) {
                console.log(`✅ Synced ${totalSynced} cars with complete data mapping...`);
              }
            }
          } catch (err) {
            console.error(`❌ Error processing car ${car.id}:`, err);
          }
        }));
      }

      // Check if there are more pages
      const hasNext = data.meta?.current_page < data.meta?.last_page;
      hasMorePages = hasNext;
      page++;
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Sync completed! Total cars synced: ${totalSynced}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} cars`,
        totalSynced
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Cars sync failed:', error);
    
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