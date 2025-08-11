import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = 'https://auctionsapi.com/api';

interface CarFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  seats_count?: string;
  search?: string;
  page?: string;
  per_page?: string;
  simple_paginate?: string;
  endpoint?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔐 Secure Cars API called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('AUCTIONS_API_KEY');
    if (!apiKey) {
      console.error('❌ AUCTIONS_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { endpoint, filters = {}, carId, lotNumber } = await req.json();
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    console.log('📋 Request params:', { endpoint, filters, carId, lotNumber });
    
    // Add specific logging for grade filter
    if (filters.grade_iaai) {
      console.log('🔍 Grade filter detected:', filters.grade_iaai);
    }

    // Validate endpoint to prevent injection
    const allowedEndpoints = [
      'cars',
      'car',
      'search-lot',
      'manufacturers/cars',
      'models',
      'generations',
      'grades',
      'korea-duplicates'
    ];
    
    const isValidEndpoint = allowedEndpoints.some(allowed => 
      endpoint === allowed || 
      endpoint.startsWith('models/') && endpoint.endsWith('/cars') ||
      endpoint.startsWith('models/') && endpoint.endsWith('/generations') ||
      endpoint.startsWith('generations/') && endpoint.endsWith('/cars') ||
      endpoint.startsWith('cars/')
    );

    if (!isValidEndpoint) {
      console.error('❌ Invalid endpoint:', endpoint);
      return new Response(
        JSON.stringify({ error: `Invalid endpoint: ${endpoint}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Build URL
    let url: string;
    if (carId && (endpoint === 'cars' || endpoint === 'car')) {
      // Individual car lookup
      url = `${API_BASE_URL}/cars/${encodeURIComponent(carId)}`;
    } else if (lotNumber && endpoint === 'search-lot') {
      // Lot number search - try both IAAI and Copart
      url = `${API_BASE_URL}/search-lot/${encodeURIComponent(lotNumber)}/iaai`;
    } else if (endpoint.includes('/')) {
      // Endpoints like models/{id}/cars or generations/{id}/cars
      url = `${API_BASE_URL}/${endpoint}`;
    } else {
      // Regular endpoints with filters
      const params = new URLSearchParams();
      
      // Add filters to params with validation
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          let sanitizedValue = value.trim();
          
          // Special handling for grade_iaai to preserve spaces and special characters
          if (key === 'grade_iaai') {
            // Allow spaces, dots, and common grade characters
            sanitizedValue = value.trim().replace(/[^\w\-_.@\s]/g, '');
          } else {
            // Sanitize other parameter values
            sanitizedValue = value.trim().replace(/[^\w\-_.@]/g, '');
          }
          
          if (sanitizedValue) {
            params.append(key, sanitizedValue);
          }
        }
      });

      url = `${API_BASE_URL}/${endpoint}?${params}`;
    }

    console.log('🌐 Making API request to:', url);

    // Make the API request with rate limiting
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/1.0',
        'X-API-Key': apiKey
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (response.status === 429) {
      console.log('⏳ Rate limited, returning appropriate error');
      return new Response(
        JSON.stringify({ 
          error: 'Rate limited',
          retryAfter: 2000 
        }), 
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    if (!response.ok) {
      console.error('❌ API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: `Upstream API returned ${response.status}: ${response.statusText}`,
          endpoint,
          url,
          filters
        }), 
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const data = await response.json();
    console.log('✅ API response received, data length:', JSON.stringify(data).length);

    // Background upsert into Supabase for caching/persistence
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && serviceKey) {
        const sb = createClient(supabaseUrl, serviceKey);

        // Normalize cars list from response by endpoint shape
        const carsArray: any[] = Array.isArray(data?.data)
          ? data.data
          : (endpoint.startsWith('cars/') || endpoint === 'car' || carId)
            ? (data?.data ? [data.data] : [data])
            : endpoint === 'search-lot' || lotNumber
              ? [data]
              : [];

        if (carsArray.length > 0) {
          const upserts = carsArray.map((car: any) => {
            const lot = car?.lots?.[0] || car?.lot || car?.lots?.length ? car.lots[0] : null;
            const images = lot?.images?.normal || lot?.images?.big || [];
            const carIdStr = (car?.id ?? lot?.id ?? lot?.external_id ?? '').toString();
            const payload = {
              id: carIdStr,
              api_id: carIdStr,
              make: car?.manufacturer?.name || car?.make || 'Unknown',
              model: car?.model?.name || car?.model || 'Unknown',
              year: car?.year || new Date().getFullYear(),
              price: typeof lot?.buy_now === 'number' ? Math.round(lot.buy_now + 2200) : null,
              vin: car?.vin || null,
              fuel: car?.fuel?.name || null,
              transmission: car?.transmission?.name || null,
              color: car?.color?.name || null,
              condition: lot?.condition?.name || null,
              lot_number: (lot?.lot ?? '').toString(),
              mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : null,
              images: images,
              car_data: car,
              lot_data: lot || null,
              last_api_sync: new Date().toISOString(),
            } as any;

            return payload;
          });

          // Upsert in small batches
          const batchSize = 25;
          for (let i = 0; i < upserts.length; i += batchSize) {
            const batch = upserts.slice(i, i + batchSize);
            await sb.from('cars_cache').upsert(batch as any[], { onConflict: 'id', ignoreDuplicates: false });
          }
        }
      }
    } catch (persistError) {
      console.error('⚠️ Failed to persist API data to cars_cache:', persistError);
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('❌ Error in secure-cars-api function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack || null
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);