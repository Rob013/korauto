import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`🔍 Testing API endpoint directly...`);
    
      const apiKey = Deno.env.get('AUCTIONS_API_KEY');
      if (!apiKey) {
        throw new Error('AUCTIONS_API_KEY not configured');
      }
    const testUrl = `https://auctionsapi.com/api/cars?api_key=${apiKey}&limit=5`;
    
    console.log(`📡 Making request to: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/1.0',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(30000)
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error response:`, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`📊 Response data structure:`, Object.keys(data));
    console.log(`📊 Data array length:`, data.data?.length);
    
    if (data.data && data.data.length > 0) {
      console.log(`📝 First car sample:`, {
        id: data.data[0]?.id,
        make: data.data[0]?.manufacturer?.name,
        model: data.data[0]?.model?.name,
        year: data.data[0]?.year,
        price: data.data[0]?.lots?.[0]?.buy_now
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        status: response.status,
        data_count: data.data?.length || 0,
        first_car: data.data?.[0] || null,
        message: 'API test successful'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ API test failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});