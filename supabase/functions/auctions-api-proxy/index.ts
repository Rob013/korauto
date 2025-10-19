import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrollId, limit = 1000, scrollTime = 10 } = await req.json();
    const apiKey = Deno.env.get('AUCTIONS_API_KEY');

    if (!apiKey) {
      console.error('❌ AUCTIONS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build API URL
    let apiUrl = `https://api.auctionsapi.com/cars?api_key=${apiKey}&limit=${limit}`;
    
    if (scrollId) {
      apiUrl += `&scroll_id=${scrollId}`;
    } else {
      apiUrl += `&scroll_time=${scrollTime}`;
    }

    console.log(`📡 Fetching from Auctions API: ${scrollId ? 'with scroll_id' : 'initial request'}`);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Auctions API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log(`✅ Auctions API returned ${data.data?.length || 0} cars, has next: ${!!data.next_url}`);

    return new Response(
      JSON.stringify({
        cars: data.data || [],
        scrollId: data.scroll_id,
        nextUrl: data.next_url,
        hasMore: !!data.next_url
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in auctions-api-proxy:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
