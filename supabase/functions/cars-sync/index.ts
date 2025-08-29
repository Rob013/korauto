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
    let errorCount = 0;
    let dbCapacityIssues = 0;
    const maxErrors = 50; // Stop if too many errors
    
    console.log('📊 Starting full sync of all available cars from API...');
    
    while (hasMorePages) { // Remove page limit to sync all cars
      console.log(`📄 Fetching page ${page}...`);
      
      const response = await fetch(`${API_BASE_URL}/cars?per_page=100&page=${page}`, {
        headers: {
          'accept': '*/*',
          'x-api-key': API_KEY
        }
      });

      if (!response.ok) {
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
        errorCount++;
        if (errorCount >= maxErrors) {
          console.error('❌ Too many API errors, stopping sync');
          break;
        }
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      const data = await response.json();
      const cars: Car[] = data.data || [];
      
      console.log(`📊 API Response: Page ${page}, Cars: ${cars.length}, Total Available: ${data.total || 'unknown'}`);
      
      if (cars.length === 0) {
        console.log('✅ No more cars to sync - empty response');
        hasMorePages = false;
        break;
      }

      console.log(`🔄 Processing ${cars.length} cars from page ${page}...`);

      // Process cars in batches
      const batchSize = 10;
      for (let i = 0; i < cars.length; i += batchSize) {
        const batch = cars.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (car) => {
          try {
            const lot = car.lots?.[0];
            const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : null;
            const priceInCents = price ? price * 100 : null; // For proper sorting
            const mileageKm = lot?.odometer?.km || null;
            
            const carCache = {
              id: car.id.toString(),
              api_id: car.id.toString(),
              make: car.manufacturer?.name || 'Unknown',
              model: car.model?.name || 'Unknown',
              year: car.year || 2020,
              price: price,
              price_cents: priceInCents, // Add for sorting
              mileage: mileageKm, // Store as number for sorting
              rank_score: price ? (1 / price) * 1000000 : 0, // Higher score for cheaper cars
              vin: car.vin,
              fuel: car.fuel?.name,
              transmission: car.transmission?.name,
              color: car.color?.name,
              condition: lot?.condition?.name?.replace('run_and_drives', 'Good'),
              lot_number: lot?.lot,
              images: JSON.stringify(lot?.images?.normal || lot?.images?.big || []),
              car_data: JSON.stringify(car),
              lot_data: JSON.stringify(lot || {}),
              last_api_sync: new Date().toISOString()
            };

            const { error } = await supabaseClient
              .from('cars_cache')
              .upsert(carCache, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });

            if (error) {
              console.error(`❌ Error upserting car ${car.id}:`, error);
              console.error('Error details:', error);
              dbCapacityIssues++;
              
              // Check if it's a database capacity issue
              if (error.message?.includes('insufficient_resources') || 
                  error.message?.includes('storage_full') ||
                  error.message?.includes('quota')) {
                console.error('🚨 Database capacity issue detected!');
              }
            } else {
              totalSynced++;
            }
          } catch (err) {
            console.error(`❌ Error processing car ${car.id}:`, err);
          }
        }));
      }

      // Continue to next page - the API seems to return data until no more cars
      // Instead of relying on pagination metadata, check if we got fewer cars than requested
      if (cars.length < 100) {
        console.log(`📊 Got ${cars.length} cars (less than 100), assuming last page`);
        hasMorePages = false;
      } else {
        hasMorePages = true;
      }
      
      page++;
      
      // Progress logging
      if (page % 10 === 0) {
        console.log(`📊 Progress: Page ${page}, Total synced: ${totalSynced}, DB errors: ${dbCapacityIssues}`);
      }
      
      // Rate limiting delay (shorter for efficiency)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Sync completed! Total cars synced: ${totalSynced}`);
    console.log(`📊 Final stats: Pages processed: ${page-1}, DB errors: ${dbCapacityIssues}, API errors: ${errorCount}`);
    
    if (dbCapacityIssues > 0) {
      console.warn(`⚠️ Database capacity issues detected: ${dbCapacityIssues} errors`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} cars from ${page-1} pages`,
        totalSynced,
        pagesProcessed: page-1,
        dbCapacityIssues,
        apiErrors: errorCount,
        warnings: dbCapacityIssues > 0 ? ['Database capacity issues detected'] : []
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