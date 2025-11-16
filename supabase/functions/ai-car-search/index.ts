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

    // Call Lovable AI to interpret the search query using tool calling
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
            content: `You are a Korean car auction search assistant specializing in exact vehicle matching.

CRITICAL RULES:
1. Extract EXACT manufacturer and model names from user queries
2. For specific trims/grades (like "A4 35", "5 Series", "Golf GTI"), include the FULL designation in model_name
3. If user mentions a year, set both yearMin and yearMax to that year for precise matching
4. Always preserve specific model identifiers (numbers, letters) in the search field
5. For price ranges, convert to euros if needed

Common Korean auction brands: Hyundai, Kia, Genesis, BMW, Mercedes-Benz, Audi, Volkswagen, Toyota, Honda, Lexus

Examples:
- "Audi A4 35" → manufacturer: "Audi", model: "A4", search: "35"
- "BMW 5 series from 2020" → manufacturer: "BMW", model: "5 Series", yearMin: 2020, yearMax: 2020
- "Mercedes C class 2019" → manufacturer: "Mercedes-Benz", model: "C-Class", yearMin: 2019, yearMax: 2019
- "Golf GTI" → manufacturer: "Volkswagen", model: "Golf", search: "GTI"
- "Hyundai Sonata under 20000" → manufacturer: "Hyundai", model: "Sonata", priceMax: 20000`
          },
          {
            role: 'user',
            content: query
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_car_filters',
              description: 'Extract car search filters from natural language query',
              parameters: {
                type: 'object',
                properties: {
                  manufacturer_name: {
                    type: 'string',
                    description: 'Exact manufacturer/brand name (e.g., "BMW", "Audi", "Mercedes-Benz")'
                  },
                  model_name: {
                    type: 'string',
                    description: 'Exact model name without trim (e.g., "A4", "5 Series", "Golf")'
                  },
                  yearMin: {
                    type: 'number',
                    description: 'Minimum year for search'
                  },
                  yearMax: {
                    type: 'number',
                    description: 'Maximum year for search'
                  },
                  priceMin: {
                    type: 'number',
                    description: 'Minimum price in euros'
                  },
                  priceMax: {
                    type: 'number',
                    description: 'Maximum price in euros'
                  },
                  fuel: {
                    type: 'string',
                    enum: ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'LPG'],
                    description: 'Fuel type'
                  },
                  transmission: {
                    type: 'string',
                    enum: ['Automatic', 'Manual', 'Semi-Automatic'],
                    description: 'Transmission type'
                  },
                  mileageMax: {
                    type: 'number',
                    description: 'Maximum mileage in kilometers'
                  },
                  color: {
                    type: 'string',
                    description: 'Car color'
                  },
                  search: {
                    type: 'string',
                    description: 'Additional search keywords for trim levels, special editions (e.g., "35", "GTI", "M Sport")'
                  }
                },
                required: []
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_car_filters' } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    console.log('🤖 AI Tool Call:', JSON.stringify(toolCall, null, 2));

    // Extract filters from tool call
    let filters = {};
    if (toolCall?.function?.arguments) {
      try {
        filters = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
        filters = { search: query };
      }
    } else {
      // Fallback to using the query as search term
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});