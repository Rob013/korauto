import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Request validation schema
const UnifiedCarsRequestSchema = z.object({
  make: z.array(z.string()).optional(),
  model: z.array(z.string()).optional(),
  yearMin: z.number().optional(),
  yearMax: z.number().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  fuel: z.array(z.string()).optional(),
  transmission: z.array(z.string()).optional(),
  color: z.array(z.string()).optional(),
  condition: z.array(z.string()).optional(),
  location: z.array(z.string()).optional(),
  source_api: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
});

const handler = async (req: Request): Promise<Response> => {
  console.log('🔐 Unified Cars API called:', req.method, req.url);
  
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
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = UnifiedCarsRequestSchema.parse(body);
    
    console.log('📝 Request data:', JSON.stringify(validatedData, null, 2));
    
    // Build query
    let query = supabase
      .from('cars')
      .select('*', { count: 'exact' })
      .eq('is_archived', false)
      .eq('is_active', true);
    
    // Apply filters
    if (validatedData.make && validatedData.make.length > 0) {
      query = query.in('make', validatedData.make);
    }
    
    if (validatedData.model && validatedData.model.length > 0) {
      query = query.in('model', validatedData.model);
    }
    
    if (validatedData.yearMin) {
      query = query.gte('year', validatedData.yearMin);
    }
    
    if (validatedData.yearMax) {
      query = query.lte('year', validatedData.yearMax);
    }
    
    if (validatedData.priceMin) {
      query = query.gte('price', validatedData.priceMin);
    }
    
    if (validatedData.priceMax) {
      query = query.lte('price', validatedData.priceMax);
    }
    
    if (validatedData.fuel && validatedData.fuel.length > 0) {
      query = query.in('fuel', validatedData.fuel);
    }
    
    if (validatedData.transmission && validatedData.transmission.length > 0) {
      query = query.in('transmission', validatedData.transmission);
    }
    
    if (validatedData.color && validatedData.color.length > 0) {
      query = query.in('color', validatedData.color);
    }
    
    if (validatedData.condition && validatedData.condition.length > 0) {
      query = query.in('condition', validatedData.condition);
    }
    
    if (validatedData.location && validatedData.location.length > 0) {
      query = query.in('location', validatedData.location);
    }
    
    if (validatedData.source_api && validatedData.source_api.length > 0) {
      query = query.in('source_api', validatedData.source_api);
    }
    
    if (validatedData.search) {
      query = query.or(`make.ilike.%${validatedData.search}%,model.ilike.%${validatedData.search}%,title.ilike.%${validatedData.search}%,vin.ilike.%${validatedData.search}%`);
    }
    
    // Apply sorting
    const sortBy = validatedData.sortBy || 'last_synced_at';
    const sortOrder = validatedData.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    const page = validatedData.page || 1;
    const pageSize = validatedData.pageSize || 24;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    console.log('🌐 Executing query...');
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;
    
    console.log(`✅ Query executed successfully: ${data?.length || 0} cars returned`);
    
    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          cars: data || [],
          total,
          page,
          totalPages,
          hasMore,
          nextCursor: hasMore ? `page_${page + 1}` : null
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        } 
      }
    );
    
  } catch (error) {
    console.error('❌ Error in Unified Cars API:', error);
    
    let errorMessage = 'An unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof z.ZodError) {
      errorMessage = `Validation error: ${error.errors.map(e => e.message).join(', ')}`;
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode, 
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        } 
      }
    );
  }
};

serve(handler);
