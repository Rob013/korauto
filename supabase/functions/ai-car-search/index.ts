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

  // Extract brand/manufacturer - Map to your actual API manufacturer IDs
  const brandMap: Record<string, string> = {
    'audi': '1',
    'bmw': '9', 
    'mercedes': '16',
    'volkswagen': '147',
    'toyota': '3',
    'honda': '2',
    'ford': '5',
    'opel': '41',
    'skoda': '72',
    'seat': '63',
    'nissan': '4',
    'mazda': '28',
    'peugeot': '46',
    'renault': '52',
    'citroen': '14',
    'fiat': '21',
    'volvo': '149',
    'mitsubishi': '35',
    'subaru': '74',
    'lexus': '27'
  };

  // Check for brand names in the query
  for (const [brand, id] of Object.entries(brandMap)) {
    if (lowQuery.includes(brand)) {
      filters.manufacturer_id = id;
      break;
    }
  }

  // Extract model (improved pattern matching)
  const modelPatterns = [
    /(?:audi\s+)?([a-z]\d+)/i,  // A4, A6, Q7, etc.
    /(?:bmw\s+)?([a-z]?\d+\s*series?)/i, // 3 Series, X5, etc.
    /(?:mercedes\s+)?([a-z]-class)/i, // C-Class, E-Class, etc.
    /golf|polo|passat|tiguan/i, // VW models
    /corolla|camry|prius|rav4/i, // Toyota models
    /civic|accord|cr-v/i, // Honda models
    /focus|fiesta|mondeo|kuga/i, // Ford models
  ];

  for (const pattern of modelPatterns) {
    const match = lowQuery.match(pattern);
    if (match) {
      filters.model = match[1] || match[0];
      break;
    }
  }

  // Extract year with better patterns
  const yearPatterns = [
    /(?:year\s+)?(\d{4})/,
    /(?:nga|from)\s+(\d{4})/,
    /(\d{4})\s*(?:model|year)?/
  ];

  for (const pattern of yearPatterns) {
    const match = lowQuery.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      if (year >= 1990 && year <= new Date().getFullYear()) {
        filters.year_from = year;
        filters.year_to = year;
      }
      break;
    }
  }

  // Extract mileage preferences
  if (lowQuery.includes('low mileage') || lowQuery.includes('pak kilometra') || lowQuery.includes('kilometrazh i ulët')) {
    filters.mileage_to = 100000;
  }
  if (lowQuery.includes('high mileage') || lowQuery.includes('shumë kilometra')) {
    filters.mileage_from = 150000;
  }

  // Extract price preferences with euro detection
  const priceMatch = lowQuery.match(/(?:under|below|nën)\s*[€$]?(\d+(?:,\d{3})*)/);
  if (priceMatch) {
    filters.price_to = parseInt(priceMatch[1].replace(',', ''));
  }

  const minPriceMatch = lowQuery.match(/(?:over|above|mbi)\s*[€$]?(\d+(?:,\d{3})*)/);
  if (minPriceMatch) {
    filters.price_from = parseInt(minPriceMatch[1].replace(',', ''));
  }

  if (lowQuery.includes('cheap') || lowQuery.includes('lirë') || lowQuery.includes('budget')) {
    filters.price_to = 15000;
  }
  if (lowQuery.includes('expensive') || lowQuery.includes('luksoz') || lowQuery.includes('luxury')) {
    filters.price_from = 30000;
  }

  // Extract fuel type
  if (lowQuery.includes('diesel')) filters.fuel_type = 'diesel';
  if (lowQuery.includes('petrol') || lowQuery.includes('gasoline') || lowQuery.includes('benzinë')) filters.fuel_type = 'petrol';
  if (lowQuery.includes('electric') || lowQuery.includes('elektrik')) filters.fuel_type = 'electric';
  if (lowQuery.includes('hybrid') || lowQuery.includes('hibrid')) filters.fuel_type = 'hybrid';

  // Extract accident history
  if (lowQuery.includes('no accident') || lowQuery.includes('pa aksidente') || lowQuery.includes('accident free')) {
    filters.max_accidents = 0;
  }
  if (lowQuery.includes('few accident') || lowQuery.includes('pak aksidente') || lowQuery.includes('minor accident')) {
    filters.max_accidents = 1;
  }

  return filters;
}

function generateSuggestions(query: string, userBehavior?: any[]): string[] {
  const suggestions = [
    "BMW Serie 3 diesel nën €25,000",
    "Audi A4 2018 me kilometrazh të ulët", 
    "Mercedes C-Class pa aksidente",
    "Volkswagen Golf automatik",
    "Toyota hybrid lirë"
  ];

  // Add behavior-based suggestions if user behavior is provided
  if (userBehavior && userBehavior.length > 0) {
    suggestions.unshift(
      "Të ngjashme me kërkesat e fundit",
      "Popullore në gamën tuaj të çmimeve",
      "Të rekomanduara për ju"
    );
  }

  return suggestions.slice(0, 5);
}