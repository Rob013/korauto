import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced Zod schema with better validation and coercion
const SearchReqSchema = z.object({
  q: z.string().trim().optional(),
  filters: z.object({
    // Categorical filters - ensure arrays
    country: z.array(z.string().trim()).min(0).optional(),
    make: z.array(z.string().trim()).min(0).optional(),
    model: z.array(z.string().trim()).min(0).optional(),
    trim: z.array(z.string().trim()).min(0).optional(),
    fuel: z.array(z.string().trim()).min(0).optional(),
    transmission: z.array(z.string().trim()).min(0).optional(),
    body: z.array(z.string().trim()).min(0).optional(),
    drive: z.array(z.string().trim()).min(0).optional(),
    use_type: z.array(z.string().trim()).min(0).optional(),
    exterior_color: z.array(z.string().trim()).min(0).optional(),
    interior_color: z.array(z.string().trim()).min(0).optional(),
    region: z.array(z.string().trim()).min(0).optional(),
    options: z.array(z.string().trim()).min(0).optional(),
    
    // Numeric array filters - coerce strings to numbers
    owners: z.array(z.coerce.number().int().min(0)).min(0).optional(),
    seats: z.array(z.coerce.number().int().min(1)).min(0).optional(),
    
    // Enum array filters
    accident: z.array(z.enum(['none', 'minor', 'accident'])).min(0).optional(),
    
    // Range filters with coercion and validation
    year: z.object({ 
      min: z.coerce.number().int().min(1900).max(2030).optional(), 
      max: z.coerce.number().int().min(1900).max(2030).optional() 
    }).refine(data => !data.min || !data.max || data.min <= data.max, {
      message: "Year min must be less than or equal to max"
    }).optional(),
    
    price_eur: z.object({ 
      min: z.coerce.number().min(0).optional(), 
      max: z.coerce.number().min(0).optional() 
    }).refine(data => !data.min || !data.max || data.min <= data.max, {
      message: "Price min must be less than or equal to max"
    }).optional(),
    
    mileage_km: z.object({ 
      min: z.coerce.number().min(0).optional(), 
      max: z.coerce.number().min(0).optional() 
    }).refine(data => !data.min || !data.max || data.min <= data.max, {
      message: "Mileage min must be less than or equal to max"
    }).optional(),
    
    engine_cc: z.object({ 
      min: z.coerce.number().min(0).optional(), 
      max: z.coerce.number().min(0).optional() 
    }).refine(data => !data.min || !data.max || data.min <= data.max, {
      message: "Engine CC min must be less than or equal to max"
    }).optional(),
  }).strict().optional(), // Reject unknown filter keys
  
  sort: z.object({
    field: z.enum(['listed_at', 'price_eur', 'mileage_km', 'year']),
    dir: z.enum(['asc', 'desc']),
  }).optional(),
  
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  mode: z.enum(['full', 'results', 'facets']).default('full'),
  facets: z.array(z.string().trim()).min(0).optional(),
}).strict(); // Reject unknown top-level keys

const LISTING_FIELDS = ['id', 'make', 'model', 'year', 'price_eur', 'mileage_km', 'thumbnail', 'listed_at'];

const API_BASE_URL = 'https://auctionsapi.com/api';

// Create optimized filters hash for cache key
function createFiltersHash(filters: any): string {
  if (!filters || Object.keys(filters).length === 0) return 'empty';
  
  // Sort keys for consistent hashing
  const sortedKeys = Object.keys(filters).sort();
  const pairs = sortedKeys.map(key => `${key}:${JSON.stringify(filters[key])}`);
  const hashString = pairs.join('|');
  
  // Create a simple hash (in production, consider using crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36).slice(0, 16);
}

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

function transformCarData(car: any, listingFieldsOnly: boolean = false): any {
  // Transform the external API format to our listing format
  const transformed = {
    id: car.id?.toString() || car.lot_number || Math.random().toString(),
    make: car.manufacturer?.name || car.make || 'Unknown',
    model: car.model?.name || car.model || 'Unknown',
    year: car.year || 0,
    price_eur: car.buy_now || car.final_bid || car.price || 0,
    mileage_km: car.odometer?.km || car.mileage || 0,
    thumbnail: car.images?.normal?.[0] || car.image_url || '',
    listed_at: car.created_at || car.listed_at || new Date().toISOString(),
  };

  // For results-only mode, return minimal data for performance
  if (listingFieldsOnly) {
    return transformed;
  }

  // For full mode, include additional fields if needed
  return {
    ...transformed,
    // Add any additional fields for full car details
    // These would only be included in full mode or detail views
  };
}

function generateMockFacets(filters: any, facetsToCompute?: string[]): Record<string, Record<string, number>> {
  // Generate mock facet data - in a real implementation this would come from the API
  // Only compute requested facets for performance
  
  const allFacets = {
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
    trim: {
      'Base': 80,
      'Sport': 60,
      'Luxury': 45,
      'Premium': 40,
      'Performance': 30,
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
    drive: {
      'FWD': 200,
      'RWD': 150,
      'AWD': 120,
    },
    region: {
      'North': 150,
      'South': 120,
      'East': 100,
      'West': 80,
      'Central': 60,
    },
  };

  // If specific facets are requested, return only those
  if (facetsToCompute && facetsToCompute.length > 0) {
    const result: Record<string, Record<string, number>> = {};
    facetsToCompute.forEach(facet => {
      if (allFacets[facet]) {
        result[facet] = allFacets[facet];
      }
    });
    return result;
  }

  return allFacets;
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

    // Generate optimized cache key
    const filtersHash = createFiltersHash(validatedReq.filters);
    const sortKey = validatedReq.sort ? `${validatedReq.sort.field}:${validatedReq.sort.dir}` : 'default';
    const cacheKey = `${filtersHash}-${validatedReq.page}-${sortKey}-${validatedReq.mode}`;
    
    // Determine cache duration based on data type
    const cacheDuration = validatedReq.mode === 'facets' ? 300 : 60; // Facets can be cached longer
    
    const responseHeaders = {
      ...corsHeaders,
      'Cache-Control': `public, s-maxage=${cacheDuration}, stale-while-revalidate=900`,
      'Vary': 'Authorization, Content-Type',
      'X-Cache-Key': cacheKey,
      'X-Filters-Hash': filtersHash,
    };

    let result: any = {};

    if (validatedReq.mode === 'facets') {
      // Return only facets - optimized for filter UI updates
      const facetsToCompute = validatedReq.facets || ['model', 'trim', 'fuel', 'transmission', 'body', 'drive', 'region'];
      result.facets = generateMockFacets(validatedReq.filters, facetsToCompute);
      console.log(`📊 Returning facets only: ${facetsToCompute.join(', ')}`);
      
    } else if (validatedReq.mode === 'results') {
      // Return only results with listing fields - optimized for fast pagination/filtering
      const apiData = await fetchCarsData(validatedReq);
      
      result.hits = (apiData.data || []).map(car => transformCarData(car, true)); // true = listing fields only
      result.total = apiData.meta?.total || result.hits.length;
      
      console.log(`📋 Returning ${result.hits.length} results only (total: ${result.total})`);
      
    } else {
      // mode === 'full' - return both results and facets (initial page load)
      const apiData = await fetchCarsData(validatedReq);
      
      result.hits = (apiData.data || []).map(car => transformCarData(car, true));
      result.total = apiData.meta?.total || result.hits.length;
      
      // Include all facets for initial load
      const allFacets = ['model', 'trim', 'fuel', 'transmission', 'body', 'drive', 'region'];
      result.facets = generateMockFacets(validatedReq.filters, allFacets);
      
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
          message: 'Request validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            received: e.received
          }))
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
        message: error.message || 'Internal server error'
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);