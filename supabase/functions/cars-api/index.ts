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

    // Validate sort parameter
    const validSorts = ['price_asc', 'price_desc', 'rank_asc', 'rank_desc'];
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

    // Map sort option to database field and direction
    const getSortParams = (sort: string): { field: string; direction: string } => {
      switch (sort) {
        case 'price_asc':
          return { field: 'price_cents', direction: 'ASC' };
        case 'price_desc':
          return { field: 'price_cents', direction: 'DESC' };
        case 'rank_asc':
          return { field: 'rank_score', direction: 'ASC' };
        case 'rank_desc':
          return { field: 'rank_score', direction: 'DESC' };
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
      const sortValue = sortField === 'price_cents' ? lastItem.price_cents : lastItem.rank_score;
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