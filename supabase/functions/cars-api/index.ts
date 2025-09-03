import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache helper functions
function generateCacheKey(url: URL): string {
  const searchParams = new URLSearchParams();
  
  // Sort query parameters for consistent cache keys
  const sortedParams = Array.from(url.searchParams.entries())
    .filter(([key]) => !['_', 'timestamp'].includes(key)) // Exclude cache busting params
    .sort(([a], [b]) => a.localeCompare(b));
  
  sortedParams.forEach(([key, value]) => {
    searchParams.append(key, value);
  });
  
  return `cars-api:${url.pathname}?${searchParams.toString()}`;
}

function getCacheHeaders(ttl: number = 180): HeadersInit {
  return {
    'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
    'Vary': 'Accept-Encoding',
  };
}

// SORT_MAP whitelist for safe dynamic ordering
const SORT_MAP: Record<string, { field: string; direction: string }> = {
  'price_asc': { field: 'price_cents', direction: 'ASC' },
  'price_desc': { field: 'price_cents', direction: 'DESC' },
  'year_asc': { field: 'year', direction: 'ASC' },
  'year_desc': { field: 'year', direction: 'DESC' },
  'mileage_asc': { field: 'mileage_km', direction: 'ASC' },
  'mileage_desc': { field: 'mileage_km', direction: 'DESC' },
  'rank_asc': { field: 'rank_score', direction: 'ASC' },
  'rank_desc': { field: 'rank_score', direction: 'DESC' },
  'make_asc': { field: 'make', direction: 'ASC' },
  'make_desc': { field: 'make', direction: 'DESC' },
  'created_asc': { field: 'created_at', direction: 'ASC' },
  'created_desc': { field: 'created_at', direction: 'DESC' },
  // Frontend mappings
  'price_low': { field: 'price_cents', direction: 'ASC' },
  'price_high': { field: 'price_cents', direction: 'DESC' },
  'year_new': { field: 'year', direction: 'DESC' },
  'year_old': { field: 'year', direction: 'ASC' },
  'mileage_low': { field: 'mileage_km', direction: 'ASC' },
  'mileage_high': { field: 'mileage_km', direction: 'DESC' },
  'make_az': { field: 'make', direction: 'ASC' },
  'make_za': { field: 'make', direction: 'DESC' },
  'recently_added': { field: 'created_at', direction: 'DESC' },
  'oldest_first': { field: 'created_at', direction: 'ASC' },
  'popular': { field: 'rank_score', direction: 'DESC' },
};

// mapDbToExternal: Maps database row to exact external API JSON shape
function mapDbToExternal(row: any): any {
  return {
    // Core identifiers
    id: row.id,
    api_id: row.api_id,
    
    // Basic car info - same keys as external API
    make: row.make,
    model: row.model,
    year: Number(row.year) || 0,
    price: row.price_cents ? Number(row.price_cents) / 100 : null,
    price_cents: Number(row.price_cents) || null,
    mileage: Number(row.mileage_km) || 0,
    fuel: row.fuel,
    transmission: row.transmission,
    color: row.color,
    condition: row.condition,
    vin: row.vin,
    
    // Location and images
    location: row.location || '',
    image_url: row.image_url,
    images: row.images || [],
    
    // Additional external API fields
    title: `${row.year} ${row.make} ${row.model}`,
    rank_score: Number(row.rank_score) || 0,
    lot_number: row.lot_number,
    created_at: row.created_at,
    
    // Preserve complete external API structure from stored raw data
    ...(row.car_data && typeof row.car_data === 'object' ? row.car_data : {}),
    
    // Include lot data as lots array (external API structure)
    lots: row.lot_data ? [row.lot_data] : [],
    
    // Override with our normalized/computed values
    make: row.make,
    model: row.model,
    year: Number(row.year) || 0,
    price: row.price_cents ? Number(row.price_cents) / 100 : null,
    mileage: Number(row.mileage_km) || 0,
  };
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = performance.now();
  console.log('🚗 Cars API called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse URL and query parameters
    const url = new URL(req.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // Check if this is a request for a specific car (e.g., /cars-api/car123)
    const pathMatch = pathname.match(/\/cars-api\/(.+)$/);
    if (pathMatch && pathMatch[1]) {
      const carId = pathMatch[1];
      console.log('🔍 Fetching individual car:', carId);
      
      // Get individual car data
      const { data: car, error: carError } = await supabase
        .from('cars_cache')
        .select('*')
        .eq('id', carId)
        .eq('is_active', true)
        .single();

      if (carError || !car) {
        console.error('❌ Car not found:', carId, carError);
        return new Response(
          JSON.stringify({ 
            error: 'Car not found',
            details: carError?.message || 'Car does not exist or is not active'
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Map individual car to external API format using the same mapping
      const mappedCar = mapDbToExternal(car);

      console.log('✅ Returning individual car:', carId);
      
      return new Response(
        JSON.stringify(mappedCar),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
          }
        }
      );
    }

    // Parse URL and query parameters
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Generate cache key for edge caching
    const cacheKey = generateCacheKey(url);
    console.log('🔑 Cache key:', cacheKey);

    // Extract parameters from URL
    const filters: Record<string, any> = {};
    
    // Extract filter parameters
    if (searchParams.has('make')) filters.make = searchParams.get('make');
    if (searchParams.has('model')) filters.model = searchParams.get('model');
    if (searchParams.has('yearMin')) filters.yearMin = searchParams.get('yearMin');
    if (searchParams.has('yearMax')) filters.yearMax = searchParams.get('yearMax');
    if (searchParams.has('priceMin')) filters.priceMin = searchParams.get('priceMin');
    if (searchParams.has('priceMax')) filters.priceMax = searchParams.get('priceMax');
    if (searchParams.has('mileageMax')) filters.mileageMax = searchParams.get('mileageMax');
    if (searchParams.has('fuel')) filters.fuel = searchParams.get('fuel');
    if (searchParams.has('gearbox')) filters.gearbox = searchParams.get('gearbox');
    if (searchParams.has('drivetrain')) filters.drivetrain = searchParams.get('drivetrain');
    if (searchParams.has('city')) filters.city = searchParams.get('city');
    if (searchParams.has('search')) filters.search = searchParams.get('search');
    if (searchParams.has('q')) filters.q = searchParams.get('q');

    // Extract pagination and sorting parameters - BACKEND ONLY, NO CLIENT SORTING
    const sort = searchParams.get('sort') || 'price_asc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '24')));
    const offset = (page - 1) * pageSize;

    // Validate sort parameter using SORT_MAP whitelist
    if (!SORT_MAP[sort]) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid sort parameter. Must be one of: ${Object.keys(SORT_MAP).join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate page and pageSize parameters  
    if (page < 1) {
      return new Response(
        JSON.stringify({ 
          error: 'Page must be >= 1' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      return new Response(
        JSON.stringify({ 
          error: 'PageSize must be between 1 and 100' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get sort parameters from SORT_MAP
    const { field: sortField, direction: sortDir } = SORT_MAP[sort];

    console.log('📊 Request params:', {
      filters,
      sort,
      page,
      pageSize,
      offset,
      sortField,
      sortDir,
      cacheKey
    });

    // Get total count first using cars_cache_filtered_count
    const { data: totalCount, error: countError } = await supabase
      .rpc('cars_cache_filtered_count', { p_filters: filters });

    if (countError) {
      console.error('❌ Error getting car count:', countError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get car count',
          details: countError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get paginated results using new cars_cache_paginated function
    const { data: cars, error: carsError } = await supabase
      .rpc('cars_cache_paginated', {
        p_filters: filters,
        p_sort_field: sortField,
        p_sort_dir: sortDir,
        p_limit: pageSize,
        p_offset: offset
      });

    if (carsError) {
      console.error('❌ Error fetching cars:', carsError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch cars',
          details: carsError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get facets for filtering
    const { data: facetsData, error: facetsError } = await supabase
      .rpc('cars_cache_facets', { p_filters: filters });

    if (facetsError) {
      console.warn('⚠️ Error getting facets (non-critical):', facetsError);
    }

    const facets = facetsData && facetsData.length > 0 ? facetsData[0] : {
      makes: [],
      models: [],
      fuels: [],
      year_range: { min: 2000, max: 2024 },
      price_range: { min: 0, max: 1000000 }
    };

    const items = cars || [];

    // Map items to exact external API JSON shape using mapDbToExternal
    const mappedItems = items.map(mapDbToExternal);

    // Calculate pagination info for new response format
    const total = totalCount || 0;
    const totalPages = Math.ceil(total / pageSize);
    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    // New response format: {items,total,page,pageSize,totalPages,hasPrev,hasNext,facets}
    const response = {
      items: mappedItems,
      total,
      page,
      pageSize,
      totalPages,
      hasPrev,
      hasNext,
      facets
    };

    console.log(`✅ Returning ${items.length} cars, total: ${total}, page: ${page}/${totalPages}, facets: ${Object.keys(facets).length} types`);

    // Add telemetry logging as required
    const endTime = performance.now();
    const duration_ms = Math.round(endTime - startTime);
    const telemetryLog = {
      source: 'db',
      duration_ms,
      rows: items.length,
      sort,
      pageSize,
      page,
      total,
      filters: Object.keys(filters).length,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Cars API Telemetry:', JSON.stringify(telemetryLog));

    // Edge caching with route + sorted querystring keys and stale-while-revalidate
    const cacheHeaders = getCacheHeaders(180); // 3 min TTL with 6 min stale-while-revalidate

    return new Response(
      JSON.stringify(response),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          ...cacheHeaders,
          'X-Cache-Key': cacheKey,
          'X-Response-Time': `${Date.now() - performance.now()}ms`
        }
      }
    );

  } catch (error: any) {
    console.error('❌ Error in cars-api function:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);