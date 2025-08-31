import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
    
    // For cars endpoint, use database instead of external API to exclude deleted cars
    if (endpoint === 'cars' && !carId) {
      console.log('🗄️ Using database for cars endpoint to exclude filtered cars');
      
      // Build query from cars_cache table (which has deleted the problematic cars)
      let query = supabase
        .from('cars_cache')
        .select('*');
      
      // Apply filters
      if (filters.manufacturer_id && filters.manufacturer_id !== 'all') {
        query = query.eq('make', filters.manufacturer_id);
      }
      if (filters.model_id && filters.model_id !== 'all') {
        query = query.eq('model', filters.model_id);
      }
      if (filters.from_year) {
        query = query.gte('year', parseInt(filters.from_year));
      }
      if (filters.to_year) {
        query = query.lte('year', parseInt(filters.to_year));
      }
      if (filters.buy_now_price_from) {
        query = query.gte('price', parseFloat(filters.buy_now_price_from));
      }
      if (filters.buy_now_price_to) {
        query = query.lte('price', parseFloat(filters.buy_now_price_to));
      }
      if (filters.fuel_type) {
        query = query.eq('fuel', filters.fuel_type);
      }
      if (filters.transmission) {
        query = query.eq('transmission', filters.transmission);
      }
      if (filters.color) {
        query = query.eq('color', filters.color);
      }
      if (filters.search) {
        query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
      }
      
      // Apply pagination
      const page = parseInt(filters.page || '1');
      const perPage = parseInt(filters.per_page || '50');
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      
      // Exclude cars with no price (NULL) and ensure price > 0
      query = query.not('price', 'is', null).gt('price', 0);
      
      // Apply ordering - default by price ascending
      const sortBy = filters.sort_by || 'price';
      const sortDirection = filters.sort_direction || 'asc';
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });
      
      // Apply range for pagination
      query = query.range(from, to);
      
      const { data: cars, error, count } = await query;
      
      if (error) {
        console.error('❌ Database query error:', error);
        return new Response(
          JSON.stringify({ error: 'Database query failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Transform database cars to match API format
      const transformedCars = (cars || []).map(car => ({
        id: car.id,
        title: `${car.year} ${car.make} ${car.model}`,
        year: car.year,
        manufacturer: { name: car.make },
        model: { name: car.model },
        vin: car.vin,
        lots: [{
          buy_now: car.price,
          images: {
            normal: car.images ? JSON.parse(car.images) : []
          },
          odometer: car.mileage ? { km: parseInt(car.mileage) } : null
        }],
        fuel: car.fuel ? { name: car.fuel } : null,
        transmission: car.transmission ? { name: car.transmission } : null,
        color: car.color ? { name: car.color } : null,
        price: car.price?.toString(),
        lot_number: car.lot_number
      }));
      
      const response = {
        data: transformedCars,
        meta: {
          total: count || 0,
          current_page: page,
          last_page: Math.ceil((count || 0) / perPage)
        }
      };
      
      console.log(`✅ Database response: ${transformedCars.length} cars (filtered out problematic cars)`);
      
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
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
          const originalValue = value.trim();
          let sanitizedValue = originalValue;
          
          // Special handling for grade_iaai to preserve spaces and special characters common in car grades
          if (key === 'grade_iaai' || key === 'trim_level') {
            // Allow spaces, dots, parentheses, plus signs, and common grade characters
            // This preserves values like "M4(+)", "35 TDI", "AMG 63S+", "2.0 TDI", etc.
            sanitizedValue = originalValue.replace(/[^\w\-_.@\s()+]/g, '');
          } else {
            // Sanitize other parameter values more restrictively
            sanitizedValue = originalValue.replace(/[^\w\-_.@]/g, '');
          }
          
          // Log if value was changed during sanitization
          if (sanitizedValue !== originalValue) {
            console.log(`🔍 Sanitized ${key}: "${originalValue}" -> "${sanitizedValue}"`);
          }
          
          if (sanitizedValue) {
            params.append(key, sanitizedValue);
          } else {
            console.warn(`⚠️ Parameter ${key} was completely removed during sanitization: "${originalValue}"`);
          }
        }
      });

      url = `${API_BASE_URL}/${endpoint}?${params}`;
    }

    console.log('🌐 Making API request to:', url);
    
    // Log the constructed URL parameters for debugging
    if (filters.grade_iaai) {
      console.log('🔍 URL parameters for grade filter:', params.toString());
    }

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
      console.error('❌ API error:', response.status, response.statusText, 'URL:', url);
      
      // Provide more specific error messages based on status codes
      let errorMessage = `API request failed`;
      if (response.status === 400) {
        errorMessage = `Invalid request parameters. Please check your filter values.`;
      } else if (response.status === 401) {
        errorMessage = `Authentication failed. API key may be invalid.`;
      } else if (response.status === 404) {
        errorMessage = `No cars found matching your criteria.`;
      } else if (response.status === 429) {
        errorMessage = `Too many requests. Please wait a moment and try again.`;
      } else if (response.status >= 500) {
        errorMessage = `Server error. Please try again later.`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `${response.status}: ${response.statusText}`,
          endpoint,
          url: url.replace(/X-API-Key=[^&]+/, 'X-API-Key=***'), // Hide API key in logs
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

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('❌ Error in secure-cars-api function:', error);
    
    // Provide more helpful error messages based on error type
    let errorMessage = 'Failed to process request';
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message?.includes('JSON')) {
      errorMessage = 'Invalid response format from API. Please try again.';
    } else if (error.message) {
      errorMessage = `Request failed: ${error.message}`;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        type: error.name || 'Unknown',
        details: error.message || 'Internal server error'
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);