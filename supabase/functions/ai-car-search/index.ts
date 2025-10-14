import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('🔍 AI Search Query:', query);

    // Call Lovable AI to interpret the search query
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a car search assistant. Extract filter parameters from user queries.
Return ONLY a JSON object with these fields (use null if not mentioned):
{
  "manufacturer_id": string or null,
  "model_id": string or null,
  "yearMin": number or null,
  "yearMax": number or null,
  "priceMin": number or null,
  "priceMax": number or null,
  "fuel": string or null,
  "transmission": string or null,
  "mileageMax": number or null,
  "search": string or null
}

Examples:
"BMW from 2020" -> {"manufacturer_id": "BMW", "yearMin": 2020, "search": "BMW"}
"red sedan under 30000 euros" -> {"priceMax": 30000, "search": "sedan red"}
"automatic transmission hybrid" -> {"transmission": "Automatic", "fuel": "Hybrid"}`
          },
          {
            role: 'user',
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('🤖 AI Response:', aiResponse);

    // Parse AI response to extract filters
    let filters = {};
    try {
      // Remove markdown code blocks if present
      const cleanResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      filters = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback: use query as search term
      filters = { search: query };
    }

    console.log('✅ Extracted filters:', filters);

    return new Response(
      JSON.stringify({ filters }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in AI search:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});