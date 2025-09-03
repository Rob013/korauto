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

const handler = async (req: Request): Promise<Response> => {
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
    if (searchParams.has('fuel')) filters.fuel = searchParams.get('fuel');
    if (searchParams.has('search')) filters.search = searchParams.get('search');

    // Extract pagination and sorting parameters - BACKEND ONLY, NO CLIENT SORTING
    const sort = searchParams.get('sort') || 'price_asc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '24')));
    const offset = (page - 1) * pageSize;

    // Validate sort parameter (backend-only sorting with all options)
    const validSorts = ['price_asc', 'price_desc', 'rank_asc', 'rank_desc',
                       'year_asc', 'year_desc', 'mileage_asc', 'mileage_desc', 
                       'make_asc', 'make_desc', 'created_asc', 'created_desc',
                       // Frontend sort options for backwards compatibility
                       'price_low', 'price_high', 'year_new', 'year_old', 
                       'mileage_low', 'mileage_high', 'make_az', 'make_za', 
                       'recently_added', 'oldest_first', 'popular'];
    if (!validSorts.includes(sort)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid sort parameter. Must be one of: ${validSorts.join(', ')}` 
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

    // Map frontend sort options to backend sort options
    const mapFrontendSortToBackend = (sort: string): string => {
      // If it's already a backend sort option, return as-is
      if (['price_asc', 'price_desc', 'rank_asc', 'rank_desc', 'year_asc', 'year_desc', 
           'mileage_asc', 'mileage_desc', 'make_asc', 'make_desc', 'created_asc', 'created_desc'].includes(sort)) {
        return sort;
      }

      // Map frontend options to backend options
      switch (sort) {
        case 'price_low':
          return 'price_asc';
        case 'price_high':
          return 'price_desc';
        case 'year_new':
          return 'year_desc';
        case 'year_old':
          return 'year_asc';
        case 'mileage_low':
          return 'mileage_asc';
        case 'mileage_high':
          return 'mileage_desc';
        case 'make_az':
          return 'make_asc';
        case 'make_za':
          return 'make_desc';
        case 'recently_added':
          return 'created_desc';
        case 'oldest_first':
          return 'created_asc';
        case 'popular':
          return 'rank_desc';
        default:
          return 'price_asc';
      }
    };

    // Map sort option to database field and direction with NULLS LAST for global ordering
    const getSortParams = (sort: string): { field: string; direction: string } => {
      const backendSort = mapFrontendSortToBackend(sort);
      
      switch (backendSort) {
        case 'price_asc':
          return { field: 'price_cents', direction: 'ASC' };
        case 'price_desc':
          return { field: 'price_cents', direction: 'DESC' };
        case 'rank_asc':
          return { field: 'rank_score', direction: 'ASC' };
        case 'rank_desc':
          return { field: 'rank_score', direction: 'DESC' };
        case 'year_asc':
          return { field: 'year', direction: 'ASC' };
        case 'year_desc':
          return { field: 'year', direction: 'DESC' };
        case 'mileage_asc':
          return { field: 'mileage_km', direction: 'ASC' };
        case 'mileage_desc':
          return { field: 'mileage_km', direction: 'DESC' };
        case 'make_asc':
          return { field: 'make', direction: 'ASC' };
        case 'make_desc':
          return { field: 'make', direction: 'DESC' };
        case 'created_asc':
          return { field: 'created_at', direction: 'ASC' };
        case 'created_desc':
          return { field: 'created_at', direction: 'DESC' };
        default:
          return { field: 'price_cents', direction: 'ASC' };
      }
    };

    const { field: sortField, direction: sortDir } = getSortParams(sort);

    // Parse cursor
    const parseCursor = (cursor: string): { value: string; id: string } | null => {
      if (!cursor) return null;
      
      try {
        const decoded = atob(cursor);
        const [value, id] = decoded.split('|');
        if (!value || !id) return null;
        return { value, id };
      } catch {
        return null;
      }
    };

    const cursorData = cursor ? parseCursor(cursor) : null;

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

    // Map items to exact external API JSON shape (like Encar API)
    const mappedItems = items.map((car: any) => ({
      id: car.id,
      api_id: car.api_id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price_cents ? car.price_cents / 100 : null,
      price_cents: car.price_cents,
      rank_score: car.rank_score || 0,
      mileage: car.mileage_km,
      fuel: car.fuel,
      transmission: car.transmission,
      color: car.color,
      condition: car.condition,
      vin: car.vin,
      lot_number: car.lot_number,
      location: car.location || '',
      image_url: car.image_url,
      images: car.images || [],
      title: `${car.year} ${car.make} ${car.model}`,
      created_at: car.created_at,
      // Preserve exact structure from external API
      ...(car.car_data || {}),
      // Override with normalized data
      lots: car.lot_data ? [car.lot_data] : []
    }));

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