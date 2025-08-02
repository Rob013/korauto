import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchQuery {
  query: string;
  userBehavior?: any[];
}

interface CarFilter {
  manufacturer_id?: string;
  model?: string;
  year_from?: number;
  year_to?: number;
  mileage_from?: number;
  mileage_to?: number;
  price_from?: number;
  price_to?: number;
  fuel_type?: string;
  max_accidents?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, userBehavior }: SearchQuery = await req.json()
    
    console.log('🤖 AI Car Search called with:', { query, userBehavior })

    // For now, implement basic natural language parsing
    // In production, you'd use a more sophisticated AI service
    const filters = parseNaturalLanguageQuery(query);
    const suggestions = generateSuggestions(query, userBehavior);

    console.log('🔍 Parsed filters:', filters)
    console.log('💡 Generated suggestions:', suggestions)

    return new Response(
      JSON.stringify({ 
        filters,
        suggestions,
        processedQuery: query 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('❌ AI Car Search error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function parseNaturalLanguageQuery(query: string): CarFilter {
  const filters: CarFilter = {};
  const lowQuery = query.toLowerCase();

  // Extract brand/manufacturer
  const brands = ['audi', 'bmw', 'mercedes', 'volkswagen', 'toyota', 'honda', 'ford', 'opel', 'skoda', 'seat'];
  for (const brand of brands) {
    if (lowQuery.includes(brand)) {
      // Map brand names to manufacturer IDs (you'll need to adjust these based on your API)
      const brandMap: Record<string, string> = {
        'audi': '9',
        'bmw': '8',
        'mercedes': '7',
        'volkswagen': '6',
        'toyota': '5',
        'honda': '4',
        'ford': '3',
        'opel': '2',
        'skoda': '1',
        'seat': '10'
      };
      filters.manufacturer_id = brandMap[brand];
      break;
    }
  }

  // Extract model
  const modelMatch = lowQuery.match(/(?:audi\s+)?([a-z]\d+|[a-z]+\s*\d*)/i);
  if (modelMatch && modelMatch[1]) {
    filters.model = modelMatch[1].trim();
  }

  // Extract year
  const yearMatch = lowQuery.match(/(?:year\s+)?(\d{4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1990 && year <= new Date().getFullYear()) {
      filters.year_from = year;
      filters.year_to = year;
    }
  }

  // Extract year range
  const yearRangeMatch = lowQuery.match(/(\d{4})\s*-\s*(\d{4})/);
  if (yearRangeMatch) {
    filters.year_from = parseInt(yearRangeMatch[1]);
    filters.year_to = parseInt(yearRangeMatch[2]);
  }

  // Extract mileage preferences
  if (lowQuery.includes('low mileage') || lowQuery.includes('few kilometers')) {
    filters.mileage_to = 100000;
  }
  if (lowQuery.includes('high mileage')) {
    filters.mileage_from = 200000;
  }

  // Extract price preferences
  if (lowQuery.includes('cheap') || lowQuery.includes('budget')) {
    filters.price_to = 15000;
  }
  if (lowQuery.includes('expensive') || lowQuery.includes('luxury')) {
    filters.price_from = 30000;
  }

  // Extract fuel type
  if (lowQuery.includes('diesel')) filters.fuel_type = 'diesel';
  if (lowQuery.includes('petrol') || lowQuery.includes('gasoline')) filters.fuel_type = 'petrol';
  if (lowQuery.includes('electric') || lowQuery.includes('ev')) filters.fuel_type = 'electric';
  if (lowQuery.includes('hybrid')) filters.fuel_type = 'hybrid';

  // Extract accident history
  if (lowQuery.includes('no accident') || lowQuery.includes('accident free')) {
    filters.max_accidents = 0;
  }
  if (lowQuery.includes('few accident') || lowQuery.includes('minor accident')) {
    filters.max_accidents = 1;
  }

  return filters;
}

function generateSuggestions(query: string, userBehavior?: any[]): string[] {
  const suggestions = [
    "Audi A4 2018 with low mileage",
    "BMW 3 Series diesel under €25,000",
    "Mercedes C-Class 2019 automatic",
    "Volkswagen Golf 2020 petrol",
    "Toyota Corolla hybrid accident-free"
  ];

  // Add behavior-based suggestions if user behavior is provided
  if (userBehavior && userBehavior.length > 0) {
    suggestions.unshift(
      "Similar to your recent searches",
      "Popular in your price range",
      "Recommended based on your preferences"
    );
  }

  return suggestions.slice(0, 5);
}