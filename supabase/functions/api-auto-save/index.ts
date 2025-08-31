import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface APICarResponse {
  id: string;
  manufacturer?: { id: number; name: string };
  model?: { id: number; name: string };
  year: number;
  lots?: {
    id: number;
    lot?: string;
    buy_now?: number;
    current_bid?: number;
    bid?: number;
    odometer?: { km?: number };
    images?: { normal?: string[]; big?: string[] };
  }[];
  [key: string]: any; // Allow any additional fields from API
}

// Auto-save function to cache all API data
async function autoSaveToDatabase(
  supabase: any,
  apiData: any,
  endpoint: string,
  params: any
): Promise<void> {
  try {
    console.log('💾 Auto-saving API data to database...');
    
    if (endpoint === '/cars' && apiData.data && Array.isArray(apiData.data)) {
      const cars: APICarResponse[] = apiData.data;
      
      const transformedCars = cars.map(car => {
        const lot = car.lots?.[0] || {};
        const price = lot.buy_now || lot.current_bid || lot.bid || 0;
        const priceEur = Math.round(price + 2300);
        const images = lot.images || {};
        const allImages = [...(images.normal || []), ...(images.big || [])];
        
        return {
          id: car.id.toString(),
          api_id: car.id.toString(),
          make: car.manufacturer?.name || 'Unknown',
          model: car.model?.name || 'Unknown',
          year: car.year || new Date().getFullYear(),
          price: priceEur,
          price_cents: priceEur * 100,
          mileage: lot.odometer?.km?.toString() || null,
          vin: car.vin,
          fuel: car.fuel?.name,
          transmission: car.transmission?.name,
          color: car.color?.name,
          lot_number: lot.lot?.toString(),
          condition: 'good',
          image_url: allImages[0] || null,
          images: JSON.stringify(images.normal || []),
          high_res_images: JSON.stringify(images.big || []),
          image_count: allImages.length,
          car_data: {
            buy_now: lot.buy_now,
            current_bid: lot.current_bid || lot.bid,
            keys_available: true,
            has_images: allImages.length > 0,
            image_count: allImages.length,
            api_endpoint: endpoint,
            api_params: params
          },
          lot_data: lot,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_api_sync: new Date().toISOString(),
          data_completeness_score: 0.8, // Good score for API calls
          sync_batch_id: crypto.randomUUID()
        };
      });

      // Save to database in batches
      const BATCH_SIZE = 500;
      for (let i = 0; i < transformedCars.length; i += BATCH_SIZE) {
        const batch = transformedCars.slice(i, i + BATCH_SIZE);
        
        const { error } = await supabase
          .from('cars_cache')
          .upsert(batch, { onConflict: 'id' });

        if (error) {
          console.error('❌ Auto-save error:', error);
        } else {
          console.log(`✅ Auto-saved batch: ${batch.length} cars`);
        }
      }
      
      console.log(`💾 Auto-saved ${transformedCars.length} cars to database`);
    }
  } catch (error) {
    console.error('❌ Auto-save failed:', error);
    // Don't throw - auto-save should not break the main API call
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const API_KEY = Deno.env.get('AUCTIONS_API_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_KEY) {
      return Response.json({
        success: false,
        error: 'Missing environment variables'
      }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Parse request
    const { endpoint, params, method = 'GET' } = await req.json();
    
    if (!endpoint) {
      return Response.json({
        success: false,
        error: 'Missing endpoint parameter'
      }, { status: 400, headers: corsHeaders });
    }

    console.log(`🌐 API Auto-Save: ${method} ${endpoint}`, params);

    // Build API URL
    const API_BASE_URL = 'https://auctionsapi.com/api';
    const queryParams = new URLSearchParams(params || {});
    const apiUrl = `${API_BASE_URL}${endpoint}?${queryParams}`;

    // Make API call with retry logic
    const response = await fetchWithRetry(
      apiUrl,
      {
        method,
        headers: {
          'accept': 'application/json',
          'x-api-key': API_KEY,
          'User-Agent': 'KorAuto-AutoSave/3.0'
        }
      },
      3,
      1000
    );

    const apiData = await response.json();
    
    // Auto-save to database in background (non-blocking)
    if (apiData && (apiData.data || apiData.cars)) {
      EdgeRuntime.waitUntil(autoSaveToDatabase(supabase, apiData, endpoint, params));
    }

    // Return original API response
    return Response.json(apiData, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API Auto-Save error:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500, headers: corsHeaders });
  }
});