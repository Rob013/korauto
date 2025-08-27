import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Extract pagination and sorting parameters
    const sort = searchParams.get('sort') || 'price_asc';
    const limit = parseInt(searchParams.get('limit') || '24');
    const cursor = searchParams.get('cursor') || null;

    // Validate sort parameter (extended to support new fields)
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

    // Validate limit parameter
    if (limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ 
          error: 'Limit must be between 1 and 100' 
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

    // Map sort option to database field and direction
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
          return { field: 'mileage', direction: 'ASC' };
        case 'mileage_desc':
          return { field: 'mileage', direction: 'DESC' };
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
      limit,
      cursor: cursor ? 'present' : 'none',
      sortField,
      sortDir
    });

    // Get total count first
    const { data: totalCount, error: countError } = await supabase
      .rpc('cars_filtered_count', { p_filters: filters });

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

    // Get paginated results using keyset pagination
    const { data: cars, error: carsError } = await supabase
      .rpc('cars_keyset_page', {
        p_filters: filters,
        p_sort_field: sortField,
        p_sort_dir: sortDir,
        p_cursor_value: cursorData?.value || null,
        p_cursor_id: cursorData?.id || null,
        p_limit: limit
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

    const items = cars || [];

    // Create next cursor if we have a full page (indicating more data)
    const createCursor = (sortField: string, sortValue: any, id: string): string => {
      const cursorValue = `${sortValue}|${id}`;
      return btoa(cursorValue);
    };

    let nextCursor: string | undefined;
    if (items.length === limit && items.length > 0) {
      const lastItem = items[items.length - 1];
      let sortValue;
      
      // Get the appropriate sort value based on the sort field
      switch (sortField) {
        case 'price_cents':
          sortValue = lastItem.price_cents;
          break;
        case 'rank_score':
          sortValue = lastItem.rank_score;
          break;
        case 'year':
          sortValue = lastItem.year;
          break;
        case 'mileage':
          sortValue = lastItem.mileage;
          break;
        case 'make':
          sortValue = lastItem.make;
          break;
        case 'created_at':
          sortValue = lastItem.created_at;
          break;
        default:
          sortValue = lastItem.price_cents;
      }
      
      nextCursor = createCursor(sortField, sortValue, lastItem.id);
    }

    const response = {
      items,
      nextCursor,
      total: totalCount || 0
    };

    console.log(`✅ Returning ${items.length} cars, total: ${totalCount}, nextCursor: ${nextCursor ? 'present' : 'none'}`);

    return new Response(
      JSON.stringify(response),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
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