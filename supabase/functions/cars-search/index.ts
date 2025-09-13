import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, s-maxage=60',
};

// Zod schema for request validation
const SearchReqSchema = z.object({
  q: z.string().optional(),
  filters: z.object({
    country: z.array(z.string()).optional(),
    make: z.array(z.string()).optional(),
    model: z.array(z.string()).optional(),
    trim: z.array(z.string()).optional(),
    fuel: z.array(z.string()).optional(),
    transmission: z.array(z.string()).optional(),
    body: z.array(z.string()).optional(),
    drive: z.array(z.string()).optional(),
    owners: z.array(z.number()).optional(),
    accident: z.array(z.enum(['none', 'minor', 'accident'])).optional(),
    use_type: z.array(z.string()).optional(),
    exterior_color: z.array(z.string()).optional(),
    interior_color: z.array(z.string()).optional(),
    region: z.array(z.string()).optional(),
    seats: z.array(z.number()).optional(),
    options: z.array(z.string()).optional(),
    year: z.object({ min: z.number(), max: z.number() }).partial().optional(),
    price_eur: z.object({ min: z.number(), max: z.number() }).partial().optional(),
    mileage_km: z.object({ min: z.number(), max: z.number() }).partial().optional(),
    engine_cc: z.object({ min: z.number(), max: z.number() }).partial().optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(['listed_at', 'price_eur', 'mileage_km', 'year']),
    dir: z.enum(['asc', 'desc']),
  }).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  mode: z.enum(['full', 'results', 'facets']).default('full'),
  facets: z.array(z.string()).optional(),
});

const LISTING_FIELDS = ['id', 'make', 'model', 'year', 'price_eur', 'mileage_km', 'thumbnail', 'listed_at'];

const API_BASE_URL = 'https://auctionsapi.com/api';

function buildFilter(filters: any): Record<string, any> {
  if (!filters) return {};
  
  const apiFilters: Record<string, any> = {};
  
  // Map our filter format to the existing API format
  if (filters.make?.length) {
    // Assume we need to map make names to IDs
    apiFilters.manufacturer_id = filters.make[0]; // Simplified for now
  }
  
  if (filters.model?.length) {
    apiFilters.model_id = filters.model[0]; // Simplified for now
  }
  
  if (filters.fuel?.length) {
    apiFilters.fuel_type = filters.fuel[0];
  }
  
  if (filters.transmission?.length) {
    apiFilters.transmission = filters.transmission[0];
  }
  
  if (filters.year) {
    if (filters.year.min) apiFilters.from_year = filters.year.min.toString();
    if (filters.year.max) apiFilters.to_year = filters.year.max.toString();
  }
  
  if (filters.price_eur) {
    if (filters.price_eur.min) apiFilters.buy_now_price_from = filters.price_eur.min.toString();
    if (filters.price_eur.max) apiFilters.buy_now_price_to = filters.price_eur.max.toString();
  }
  
  if (filters.mileage_km) {
    if (filters.mileage_km.min) apiFilters.odometer_from_km = filters.mileage_km.min.toString();
    if (filters.mileage_km.max) apiFilters.odometer_to_km = filters.mileage_km.max.toString();
  }
  
  return apiFilters;
}

function transformCarData(car: any): any {
  // Transform the external API format to our listing format
  return {
    id: car.id?.toString() || car.lot_number || Math.random().toString(),
    make: car.manufacturer?.name || car.make || 'Unknown',
    model: car.model?.name || car.model || 'Unknown',
    year: car.year || 0,
    price_eur: car.buy_now || car.final_bid || car.price || 0,
    mileage_km: car.odometer?.km || car.mileage || 0,
    thumbnail: car.images?.normal?.[0] || car.image_url || '',
    listed_at: car.created_at || car.listed_at || new Date().toISOString(),
  };
}

function generateMockFacets(filters: any): Record<string, Record<string, number>> {
  // Generate mock facet data - in a real implementation this would come from the API
  return {
    make: {
      'BMW': 150,
      'Mercedes-Benz': 120,
      'Audi': 100,
      'Volkswagen': 80,
      'Porsche': 60,
    },
    model: {
      '3 Series': 45,
      'C-Class': 40,
      'A4': 35,
      'Golf': 30,
      '911': 25,
    },
    fuel: {
      'Gasoline': 200,
      'Diesel': 150,
      'Hybrid': 80,
      'Electric': 40,
    },
    transmission: {
      'Automatic': 300,
      'Manual': 120,
      'CVT': 50,
    },
    body: {
      'Sedan': 180,
      'SUV': 150,
      'Hatchback': 100,
      'Coupe': 80,
      'Convertible': 40,
    },
  };
}

async function fetchCarsData(req: any): Promise<any> {
  const apiKey = Deno.env.get('AUCTIONS_API_KEY');
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const apiFilters = buildFilter(req.filters);
  apiFilters.page = req.page.toString();
  apiFilters.per_page = req.pageSize.toString();
  
  if (req.q) {
    apiFilters.search = req.q;
  }

  const params = new URLSearchParams(apiFilters);
  const url = `${API_BASE_URL}/cars?${params}`;

  console.log('🌐 Fetching from:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'KORAUTO-WebApp/1.0',
      'X-API-Key': apiKey
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔍 Cars search API called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validatedReq = SearchReqSchema.parse(body);
    
    console.log('📋 Validated request:', {
      mode: validatedReq.mode,
      page: validatedReq.page,
      hasFilters: !!validatedReq.filters,
      facetsRequested: validatedReq.facets?.length || 0
    });

    // Generate cache key
    const filtersHash = validatedReq.filters ? 
      btoa(JSON.stringify(validatedReq.filters)).slice(0, 16) : 'empty';
    const cacheKey = `${filtersHash}-${validatedReq.page}-${JSON.stringify(validatedReq.sort)}-${validatedReq.mode}`;
    
    const responseHeaders = {
      ...corsHeaders,
      'Cache-Control': `public, s-maxage=60, stale-while-revalidate=300`,
      'Vary': 'Authorization, Content-Type',
      'X-Cache-Key': cacheKey,
    };

    const result: any = {};

    if (validatedReq.mode === 'facets') {
      // Return only facets
      result.facets = generateMockFacets(validatedReq.filters);
      console.log('📊 Returning facets only');
      
    } else if (validatedReq.mode === 'results') {
      // Return only results with listing fields
      const apiData = await fetchCarsData(validatedReq);
      
      result.hits = (apiData.data || []).map(transformCarData);
      result.total = apiData.meta?.total || result.hits.length;
      
      console.log(`📋 Returning ${result.hits.length} results (total: ${result.total})`);
      
    } else {
      // mode === 'full' - return both results and facets
      const apiData = await fetchCarsData(validatedReq);
      
      result.hits = (apiData.data || []).map(transformCarData);
      result.total = apiData.meta?.total || result.hits.length;
      result.facets = generateMockFacets(validatedReq.filters);
      
      console.log(`📋 Returning full data: ${result.hits.length} results + facets`);
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...responseHeaders }
    });

  } catch (error: any) {
    console.error('❌ Error in cars-search function:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: error.errors 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process search request',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);