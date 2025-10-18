import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🚗 Auctions Cars API called:', req.method, req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const body = await req.json();
    const { 
      page = 1, 
      per_page = 50, 
      make, 
      model, 
      yearMin, 
      yearMax, 
      priceMin, 
      priceMax, 
      fuel, 
      transmission, 
      color, 
      search,
      sortBy = 'last_synced_at',
      sortOrder = 'desc'
    } = body;
    
    console.log('📝 Request params:', {
      page,
      per_page,
      make,
      model,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      fuel,
      transmission,
      color,
      search,
      sortBy,
      sortOrder
    });
    
    // Build query
    let query = supabase
      .from('cars')
      .select('*', { count: 'exact' })
      .eq('source_api', 'auctions_api')
      .eq('is_archived', false)
      .eq('is_active', true);
    
    // Apply filters
    if (make) {
      query = query.eq('make', make);
    }
    
    if (model) {
      query = query.eq('model', model);
    }
    
    if (yearMin) {
      query = query.gte('year', yearMin);
    }
    
    if (yearMax) {
      query = query.lte('year', yearMax);
    }
    
    if (priceMin) {
      query = query.gte('price', priceMin);
    }
    
    if (priceMax) {
      query = query.lte('price', priceMax);
    }
    
    if (fuel) {
      query = query.eq('fuel', fuel);
    }
    
    if (transmission) {
      query = query.eq('transmission', transmission);
    }
    
    if (color) {
      query = query.eq('color', color);
    }
    
    if (search) {
      query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,title.ilike.%${search}%,vin.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;
    query = query.range(from, to);
    
    console.log('🌐 Executing query...');
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    const total = count || 0;
    const totalPages = Math.ceil(total / per_page);
    const hasMore = page < totalPages;
    
    console.log(`✅ Query executed successfully: ${data?.length || 0} cars returned`);
    
    // Transform data to match expected format
    const transformedData = (data || []).map(car => ({
      id: car.id,
      title: car.title || `${car.year} ${car.make} ${car.model}`,
      year: car.year,
      manufacturer: { name: car.make },
      model: { name: car.model },
      vin: car.vin,
      lot_number: car.lot_number,
      status: car.is_live ? 1 : 2,
      sale_status: car.is_live ? 'active' : 'pending',
      lots: [{
        buy_now: car.buy_now_price || car.price || 0,
        images: {
          normal: car.image_url ? [car.image_url] : []
        },
        odometer: { km: car.mileage || 0 },
        status: car.is_live ? 1 : 2
      }],
      fuel: { name: car.fuel || 'Unknown' },
      transmission: { name: car.transmission || 'Unknown' },
      color: { name: car.color || 'Unknown' },
      location: car.location || 'South Korea',
      source_api: 'auctions_api',
      last_synced_at: car.last_synced_at,
      created_at: car.last_synced_at
    }));
    
    // Return response
    return new Response(
      JSON.stringify({
        data: transformedData,
        meta: {
          current_page: page,
          per_page,
          total,
          last_page: totalPages,
          has_more: hasMore
        },
        success: true
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200
      }
    );
    
  } catch (error: any) {
    console.error('❌ Error in auctions-cars-api function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch auctions cars',
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
