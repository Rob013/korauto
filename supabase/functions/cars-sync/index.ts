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
    let maxPages = 1000; // Allow up to 1000 pages to get all cars
    
    // Test multiple API endpoints to find working one
    console.log(`🔍 Testing API connection...`);
    
    const endpoints = [
      `${API_BASE_URL}/cars?per_page=50&page=1`,
      `${API_BASE_URL}/cars?per_page=100&page=1&minutes=60`,
      `${API_BASE_URL}/cars?per_page=30&simple_paginate=0&page=1`
    ];
    
    let testData = null;
    let workingEndpoint = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🧪 Testing endpoint: ${endpoint}`);
        const testResponse = await fetch(endpoint, {
          headers: {
            'accept': '*/*',
            'x-api-key': API_KEY
          }
        });
        
        console.log(`📡 Response Status: ${testResponse.status}`);
        
        if (testResponse.ok) {
          testData = await testResponse.json();
          console.log(`✅ Found working endpoint with ${testData.data?.length || 0} cars`);
          workingEndpoint = endpoint;
          break;
        } else if (testResponse.status === 429) {
          console.log(`⏰ Rate limited, trying next endpoint...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.log(`❌ Endpoint failed: ${err.message}`);
      }
    }
    
    if (!testData || !workingEndpoint) {
      throw new Error('All API endpoints failed or returned no data');
    }
    
    console.log(`📊 API Response Sample:`, JSON.stringify({
      total_items: testData.meta?.total || testData.total || 'unknown',
      cars_in_response: testData.data?.length || 0,
      has_pagination: !!testData.meta || !!testData.pagination
    }, null, 2));
    
    const totalCars = testData.meta?.total || testData.total || 200000; // Default estimate
    const availableCars = testData.data?.length || 0;
    
    console.log(`📊 Total cars available: ${totalCars}, cars in response: ${availableCars}`);
    
    if (availableCars === 0) {
      console.log(`⚠️ No cars found in API response. Trying alternative approach...`);
      // Instead of giving up, let's try to fetch with different parameters
      maxPages = 100; // Start with a reasonable number and increase if needed
    } else {
      maxPages = Math.ceil(totalCars / 50); // 50 cars per page
      if (maxPages > 5000) maxPages = 5000; // Cap at 5000 pages for safety
    }
    
    // Try multiple endpoint patterns with rate limiting and retry logic
    while (hasMorePages && page <= maxPages) {
      console.log(`📄 Fetching page ${page} of ${maxPages}...`);
      
      let cars: Car[] = [];
      let data: any = null;
      let success = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!success && retryCount < maxRetries) {
        try {
          // Try different endpoint patterns
          const endpoints = [
            `${API_BASE_URL}/cars?per_page=50&page=${page}`,
            `${API_BASE_URL}/cars?per_page=100&page=${page}&minutes=60`,
            `${API_BASE_URL}/cars?per_page=30&page=${page}&simple_paginate=0`
          ];
          
          for (const endpoint of endpoints) {
            try {
              console.log(`🔄 Trying: ${endpoint} (attempt ${retryCount + 1})`);
              
              const response = await fetch(endpoint, {
                headers: {
                  'accept': '*/*',
                  'x-api-key': API_KEY
                }
              });

              if (response.status === 429) {
                const waitTime = Math.min(2000 * Math.pow(2, retryCount), 30000);
                console.log(`⏰ Rate limited. Waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue; // Try next endpoint
              }

              if (!response.ok) {
                console.log(`❌ Response ${response.status}: ${response.statusText}`);
                continue; // Try next endpoint
              }

              const responseData = await response.json();
              cars = responseData.data || [];
              data = responseData; // Store for pagination check
              
              if (cars.length > 0) {
                console.log(`✅ Got ${cars.length} cars from page ${page}`);
                success = true;
                break; // Success, exit endpoint loop
              } else {
                console.log(`⚠️ Empty response from ${endpoint}`);
              }
            } catch (endpointErr) {
              console.log(`❌ Endpoint error: ${endpointErr.message}`);
            }
          }
          
          if (!success) {
            retryCount++;
            if (retryCount < maxRetries) {
              const waitTime = 5000 * retryCount;
              console.log(`🔄 Retrying page ${page} in ${waitTime}ms... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        } catch (err) {
          retryCount++;
          console.error(`❌ Error on page ${page}, attempt ${retryCount}: ${err.message}`);
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
          }
        }
      }
      
      if (!success || cars.length === 0) {
        console.log(`❌ Failed to get cars from page ${page} after ${maxRetries} attempts`);
        // Don't break completely, try a few more pages
        if (page - totalSynced > 10) {
          console.log('🛑 Too many consecutive failures, stopping sync');
          break;
        }
        page++;
        continue;
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
            
            // Calculate price_cents and rank_score for global sorting
            const price_cents = price ? price * 100 : null;
            const rank_score = price && car.year ? 
              ((2024 - car.year) * -10) + (price < 50000 ? 50 : 0) + Math.random() * 100 : 
              Math.random() * 100;

            const carCache = {
              id: car.id.toString(),
              api_id: car.id.toString(),
              make: car.manufacturer?.name || 'Unknown',
              model: car.model?.name || 'Unknown',
              year: car.year || 2020,
              price: price,
              price_cents: price_cents,
              rank_score: rank_score,
              vin: car.vin,
              fuel: car.fuel?.name,
              transmission: car.transmission?.name,
              color: car.color?.name,
              condition: lot?.condition?.name?.replace('run_and_drives', 'Good'),
              lot_number: lot?.lot,
              mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : null,
              images: JSON.stringify(lot?.images?.normal || lot?.images?.big || []),
              car_data: JSON.stringify(car),
              lot_data: JSON.stringify(lot || {}),
              last_api_sync: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
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
      
      // Progress logging
      if (page % 10 === 0) {
        console.log(`📊 Progress: ${page}/${maxPages} pages processed, ${totalSynced} cars synced`);
      }
      
      // Progressive rate limiting - faster for successful pages, slower after failures
      const delay = success ? 1000 : 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Update max pages if we discover more cars
      if (page % 100 === 0 && totalSynced > 0) {
        console.log(`🔄 Midpoint check: ${totalSynced} cars synced so far`);
        // If we're still finding cars, extend the search
        if (cars.length === 50 || cars.length === 100) {
          maxPages = Math.min(maxPages + 500, 5000);
          console.log(`📈 Extending search to ${maxPages} pages`);
        }
      }
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