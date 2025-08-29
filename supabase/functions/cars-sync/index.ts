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
    let rateLimitRetries = 0;
    const maxErrors = 50; // Stop if too many errors
    const maxRateLimitRetries = 10; // Stop if too many rate limit issues
    
    console.log('📊 Starting full sync of all available cars from API...');
    
    while (hasMorePages) { // Remove page limit to sync all cars
      console.log(`📄 Fetching page ${page}...`);
      
      // Rate limiting: wait longer between requests to avoid overwhelming the API
      if (page > 1) {
        console.log(`⏰ Waiting 2 seconds before next API request...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      let retryCount = 0;
      let success = false;
      let response;
      
      // Retry logic with exponential backoff for rate limiting
      while (retryCount < 5 && !success) {
        try {
          response = await fetch(`${API_BASE_URL}/cars?per_page=50&page=${page}`, {
            headers: {
              'accept': '*/*',
              'x-api-key': API_KEY
            }
          });

          if (response.status === 429) {
            // Rate limited - wait with exponential backoff
            const waitTime = Math.min(30000, (2 ** retryCount) * 1000); // Max 30 seconds
            console.log(`⏰ Rate limited (429). Waiting ${waitTime}ms before retry ${retryCount + 1}/5...`);
            rateLimitRetries++;
            
            if (rateLimitRetries >= maxRateLimitRetries) {
              console.error('❌ Too many rate limit retries, stopping sync');
              hasMorePages = false;
              break;
            }
            
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            continue;
          }

          if (!response.ok) {
            console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
            errorCount++;
            if (errorCount >= maxErrors) {
              console.error('❌ Too many API errors, stopping sync');
              hasMorePages = false;
              break;
            }
            // Wait and retry for other errors
            await new Promise(resolve => setTimeout(resolve, 5000));
            retryCount++;
            continue;
          }
          
          success = true;
        } catch (fetchError) {
          console.error(`❌ Fetch error on attempt ${retryCount + 1}:`, fetchError);
          retryCount++;
          if (retryCount < 5) {
            const waitTime = Math.min(10000, (2 ** retryCount) * 1000); // Max 10 seconds
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!success || !response) {
        console.error(`❌ Failed to fetch page ${page} after 5 retries, stopping sync`);
        break;
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

      // Continue to next page - reduced per_page from 100 to 50 to be less aggressive
      // Check if we got fewer cars than requested (50)
      if (cars.length < 50) {
        console.log(`📊 Got ${cars.length} cars (less than 50), assuming last page`);
        hasMorePages = false;
      } else {
        hasMorePages = true;
      }
      
      page++;
      
      // Progress logging
      if (page % 20 === 0) {
        console.log(`📊 Progress: Page ${page}, Total synced: ${totalSynced}, DB errors: ${dbCapacityIssues}, Rate limit retries: ${rateLimitRetries}`);
      }
    }

    console.log(`✅ Sync completed! Total cars synced: ${totalSynced}`);
    console.log(`📊 Final stats: Pages processed: ${page-1}, DB errors: ${dbCapacityIssues}, API errors: ${errorCount}, Rate limit retries: ${rateLimitRetries}`);
    
    if (dbCapacityIssues > 0) {
      console.warn(`⚠️ Database capacity issues detected: ${dbCapacityIssues} errors`);
    }
    
    if (rateLimitRetries > 0) {
      console.warn(`⚠️ Rate limiting encountered: ${rateLimitRetries} retries needed`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} cars from ${page-1} pages`,
        totalSynced,
        pagesProcessed: page-1,
        dbCapacityIssues,
        apiErrors: errorCount,
        rateLimitRetries,
        warnings: [
          ...(dbCapacityIssues > 0 ? ['Database capacity issues detected'] : []),
          ...(rateLimitRetries > 0 ? ['Rate limiting encountered during sync'] : [])
        ]
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