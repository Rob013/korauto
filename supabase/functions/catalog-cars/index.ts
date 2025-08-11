import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SortBy = 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'mileage_low' | 'mileage_high' | 'make_az' | 'make_za';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing environment configuration' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const {
      page = 1,
      per_page = 50,
      sort_by = 'price_low',
      filters = {}
    }: { page?: number; per_page?: number; sort_by?: SortBy; filters?: any } = body;

    const limit = Math.max(1, Math.min(200, Number(per_page) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const from = (pageNum - 1) * limit;
    const to = from + limit - 1;

    let query = sb.from('cars')
      .select('*', { count: 'exact' });

    // Apply filters
    const makeName = (filters.make_name || '').trim();
    const modelName = (filters.model_name || '').trim();
    const search = (filters.search || '').trim();

    if (makeName) query = query.eq('make', makeName);
    if (modelName) query = query.eq('model', modelName);

    // Year range
    const fromYear = Number(filters.from_year);
    const toYear = Number(filters.to_year);
    if (!Number.isNaN(fromYear) && fromYear > 0) query = query.gte('year', fromYear);
    if (!Number.isNaN(toYear) && toYear > 0) query = query.lte('year', toYear);

    // Price range
    const priceFrom = Number(filters.buy_now_price_from);
    const priceTo = Number(filters.buy_now_price_to);
    if (!Number.isNaN(priceFrom) && priceFrom > 0) query = query.gte('price', priceFrom);
    if (!Number.isNaN(priceTo) && priceTo > 0) query = query.lte('price', priceTo);

    // Mileage range
    const odFrom = Number(filters.odometer_from_km);
    const odTo = Number(filters.odometer_to_km);
    if (!Number.isNaN(odFrom) && odFrom >= 0) query = query.gte('mileage', odFrom);
    if (!Number.isNaN(odTo) && odTo > 0) query = query.lte('mileage', odTo);

    // Color/Fuel/Transmission (expect names)
    const colorName = (filters.color_name || '').trim();
    const fuelName = (filters.fuel_name || '').trim();
    const transmissionName = (filters.transmission_name || '').trim();
    if (colorName) query = query.eq('color', colorName);
    if (fuelName) query = query.eq('fuel', fuelName);
    if (transmissionName) query = query.eq('transmission', transmissionName);

    // Search by title/make/model
    if (search) {
      // Use ilike on title, make and model
      query = query.or(`title.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
    }

    // Sorting
    switch (sort_by as SortBy) {
      case 'price_high':
        query = query.order('price', { ascending: false, nullsFirst: false });
        break;
      case 'year_new':
        query = query.order('year', { ascending: false, nullsFirst: false });
        break;
      case 'year_old':
        query = query.order('year', { ascending: true, nullsFirst: true });
        break;
      case 'mileage_low':
        query = query.order('mileage', { ascending: true, nullsFirst: true });
        break;
      case 'mileage_high':
        query = query.order('mileage', { ascending: false, nullsFirst: false });
        break;
      case 'make_az':
        query = query.order('make', { ascending: true }).order('model', { ascending: true });
        break;
      case 'make_za':
        query = query.order('make', { ascending: false }).order('model', { ascending: false });
        break;
      case 'price_low':
      default:
        query = query.order('price', { ascending: true, nullsFirst: true });
        break;
    }

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    return new Response(
      JSON.stringify({
        data: data || [],
        meta: {
          total: count || 0,
          current_page: pageNum,
          last_page: Math.max(1, Math.ceil((count || 0) / limit)),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

