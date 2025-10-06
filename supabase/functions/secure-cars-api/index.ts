import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = 'https://auctionsapi.com/api';

// Rate limiting configuration matching integration guide
const RATE_LIMIT_DELAY = 15000; // 15 seconds between requests
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 3; // 15s, 45s, 135s
const REQUEST_TIMEOUT = 45000; // 45 seconds

// Helper function to make API requests with rate limiting and retry logic
async function makeApiRequest(url: string, apiKey: string, retryCount = 0): Promise<any> {
  console.log(`📡 API Request: ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/1.0',
        'X-API-Key': apiKey
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = RATE_LIMIT_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount);
        console.log(`⏰ Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return makeApiRequest(url, apiKey, retryCount + 1);
      }
      throw new Error(`Rate limit exceeded after ${MAX_RETRIES} retries`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`❌ Request timeout after ${REQUEST_TIMEOUT}ms`);
      throw new Error('Request timeout');
    }
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES && error.message !== 'Rate limit exceeded after 3 retries') {
      const waitTime = RATE_LIMIT_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount);
      console.log(`⚠️ Request failed, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return makeApiRequest(url, apiKey, retryCount + 1);
    }
    
    throw error;
  }
}

// Validation schema for car filters
const carFiltersSchema = z.object({
  manufacturer_id: z.string().max(50).optional(),
  model_id: z.string().max(50).optional(),
  generation_id: z.string().max(50).optional(),
  grade_iaai: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  fuel_type: z.string().max(30).optional(),
  transmission: z.string().max(30).optional(),
  odometer_from_km: z.string().regex(/^\d+$/).optional(),
  odometer_to_km: z.string().regex(/^\d+$/).optional(),
  from_year: z.string().regex(/^\d{4}$/).optional(),
  to_year: z.string().regex(/^\d{4}$/).optional(),
  buy_now_price_from: z.string().regex(/^\d+$/).optional(),
  buy_now_price_to: z.string().regex(/^\d+$/).optional(),
  seats_count: z.string().regex(/^\d+$/).optional(),
  search: z.string().max(200).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  per_page: z.string().regex(/^\d+$/).optional(),
  simple_paginate: z.string().optional(),
  minutes: z.string().regex(/^\d+$/).optional(), // For incremental updates
  sort_by: z.string().optional(),
  endpoint: z.string().optional()
});

const requestSchema = z.object({
  endpoint: z.string().min(1, "Endpoint is required"),
  filters: carFiltersSchema.optional(),
  carId: z.string().max(100).optional(),
  lotNumber: z.string().max(50).optional()
});

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
  minutes?: string;
  sort_by?: string;
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

    const requestBody = await req.json();
    
    // Validate request with zod
    const validationResult = requestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      console.error('❌ Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          details: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { endpoint, filters = {}, carId, lotNumber } = validationResult.data;
    
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
      
      // Set default per_page to 250 as per integration guide
      if (!filters.per_page) {
        params.append('per_page', '250');
      }
      
      // Add validated filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          params.append(key, value.trim());
        }
      });

      url = `${API_BASE_URL}/${endpoint}?${params}`;
    }

    console.log('🌐 Making API request to:', url);

    // Use the helper function with built-in rate limiting and retry logic
    const data = await makeApiRequest(url, apiKey);
    
    console.log('✅ API response received successfully');
    
    // Log pagination metadata if available
    if (data.meta) {
      console.log(`📊 Pagination: Page ${data.meta.current_page || 1} of ${data.meta.last_page || '?'}, Total: ${data.meta.total || 0}`);
    }

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