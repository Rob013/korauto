import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Car {
  id: number | string;
  title?: string;
  year?: number;
  manufacturer?: { name: string };
  model?: { name: string };
  vin?: string;
  lot_number?: string;
  lots?: Array<{
    buy_now?: number;
    images?: { normal?: string[] };
    odometer?: { km?: number };
  }>;
  fuel?: { name: string };
  transmission?: { name: string };
  color?: { name: string };
  location?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔄 API Auto-Save called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the external API key
    const auctionsApiKey = Deno.env.get('AUCTIONS_API_KEY');
    if (!auctionsApiKey) {
      throw new Error('AUCTIONS_API_KEY not found');
    }

    // Parse request body for API parameters
    const body = await req.json();
    const { endpoint, params = {}, method = 'GET' } = body;

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📡 Making API call to: ${endpoint}`);
    console.log(`📋 Parameters:`, params);

    // Build the external API URL
    const baseUrl = 'https://auctionsapi.com/api';
    const apiUrl = new URL(`${baseUrl}${endpoint}`);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        apiUrl.searchParams.append(key, String(value));
      }
    });

    // Add API key
    apiUrl.searchParams.append('key', auctionsApiKey);

    // Make the external API call
    const apiResponse = await fetch(apiUrl.toString(), {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`External API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();
    console.log(`✅ API call successful, received ${apiData?.data?.length || 0} items`);

    // Auto-save car data to database if it contains car information
    if (apiData?.data && Array.isArray(apiData.data) && apiData.data.length > 0) {
      console.log('💾 Auto-saving car data to database...');
      
      // Process and save each car
      const savedCars = [];
      const errors = [];
      
      for (const car of apiData.data) {
        try {
          // Extract car information
          const carData = extractCarData(car);
          
          if (carData) {
            // Save to cars_cache table with upsert (insert or update)
            const { data: savedCar, error: saveError } = await supabase
              .from('cars_cache')
              .upsert({
                id: String(carData.id),
                api_id: String(car.id),
                make: carData.make,
                model: carData.model,
                year: carData.year,
                price: carData.price,
                price_cents: carData.price ? Math.round(carData.price * 100) : null,
                mileage: carData.mileage ? String(carData.mileage) : null,
                fuel: carData.fuel,
                transmission: carData.transmission,
                color: carData.color,
                condition: carData.condition || 'unknown',
                lot_number: carData.lot_number,
                vin: carData.vin,
                image_url: carData.image_url,
                images: carData.images || [],
                car_data: car, // Store full API response
                lot_data: car.lots && car.lots.length > 0 ? car.lots[0] : null,
                rank_score: Math.random(), // Generate random rank for now
                last_api_sync: new Date().toISOString(),
              }, {
                onConflict: 'id', // Use id as the conflict resolution column
                ignoreDuplicates: false // Always update if exists
              });

            if (saveError) {
              console.error(`❌ Error saving car ${carData.id}:`, saveError);
              errors.push({ carId: carData.id, error: saveError.message });
            } else {
              savedCars.push(carData.id);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing car:`, error);
          errors.push({ carId: car.id || 'unknown', error: error.message });
        }
      }
      
      console.log(`💾 Auto-save completed: ${savedCars.length} cars saved, ${errors.length} errors`);
      
      if (errors.length > 0) {
        console.warn('⚠️ Auto-save errors:', errors);
      }
      
      // Add auto-save metadata to response
      apiData._autoSave = {
        saved: savedCars.length,
        errors: errors.length,
        timestamp: new Date().toISOString(),
      };
    }

    // Return the original API response with auto-save metadata
    return new Response(
      JSON.stringify(apiData),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Auto-Save': 'enabled',
        }
      }
    );

  } catch (error: any) {
    console.error('❌ Error in API auto-save:', error);

    return new Response(
      JSON.stringify({
        error: 'API proxy error',
        details: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

// Helper function to extract and normalize car data from API response
function extractCarData(car: Car): any | null {
  if (!car || !car.id) return null;

  const lot = car.lots && car.lots.length > 0 ? car.lots[0] : null;
  const images = lot?.images?.normal || [];
  
  return {
    id: String(car.id),
    make: car.manufacturer?.name || 'Unknown',
    model: car.model?.name || 'Unknown',
    year: car.year || null,
    price: lot?.buy_now || null,
    mileage: lot?.odometer?.km || null,
    fuel: car.fuel?.name || null,
    transmission: car.transmission?.name || null,
    color: car.color?.name || null,
    condition: 'good', // Default condition
    lot_number: car.lot_number || String(car.id),
    vin: car.vin || null,
    image_url: images.length > 0 ? images[0] : null,
    images: images,
  };
}

serve(handler);