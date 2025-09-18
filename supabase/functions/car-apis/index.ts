import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = 'https://api.carapis.com/api/vehicles_api';

interface CarAPIsFilters {
  make?: string;
  model?: string;
  year_from?: string;
  year_to?: string;
  price_from?: string;
  price_to?: string;
  mileage_from?: string;
  mileage_to?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  color?: string;
  page?: string;
  limit?: string;
  search?: string;
  endpoint?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔐 CarAPIs.com API called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('CAR_APIS_KEY');
    if (!apiKey) {
      console.error('❌ CAR_APIS_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { endpoint, filters = {}, vehicleId } = await req.json();
    
    // Default to vehicles endpoint if none specified
    const targetEndpoint = endpoint || 'vehicles';
    
    console.log('📋 Request params:', { endpoint: targetEndpoint, filters, vehicleId });

    // Validate endpoint to prevent injection
    const allowedEndpoints = [
      'vehicles',
      'vehicle',
      'makes',
      'models',
      'years',
      'body_types',
      'fuel_types',
      'transmissions',
      'colors'
    ];
    
    if (!allowedEndpoints.includes(targetEndpoint)) {
      console.error('❌ Invalid endpoint:', targetEndpoint);
      return new Response(
        JSON.stringify({ error: `Invalid endpoint: ${targetEndpoint}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Build URL
    let url: string;
    if (vehicleId && targetEndpoint === 'vehicle') {
      // Individual vehicle lookup
      url = `${API_BASE_URL}/vehicles/${encodeURIComponent(vehicleId)}`;
    } else {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('api_key', apiKey);
      
      // Add filters to params with validation
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          const sanitizedValue = value.trim().replace(/[^\w\-_.@\s]/g, '');
          if (sanitizedValue) {
            params.append(key, sanitizedValue);
          }
        }
      });

      url = `${API_BASE_URL}/${targetEndpoint}/?${params}`;
    }

    console.log('🌐 Making API request to:', url.replace(/api_key=[^&]+/, 'api_key=***'));

    // Make the API request with rate limiting
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/1.0',
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (response.status === 429) {
      console.log('⏳ Rate limited, returning appropriate error');
      return new Response(
        JSON.stringify({ 
          error: 'Rate limited',
          retryAfter: 2000 
        }), 
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    if (!response.ok) {
      console.error('❌ API error:', response.status, response.statusText, 'URL:', url.replace(/api_key=[^&]+/, 'api_key=***'));
      
      let errorMessage = `API request failed`;
      if (response.status === 400) {
        errorMessage = `Invalid request parameters. Please check your filter values.`;
      } else if (response.status === 401) {
        errorMessage = `Authentication failed. API key may be invalid.`;
      } else if (response.status === 404) {
        errorMessage = `No vehicles found matching your criteria.`;
      } else if (response.status === 429) {
        errorMessage = `Too many requests. Please wait a moment and try again.`;
      } else if (response.status >= 500) {
        errorMessage = `Server error. Please try again later.`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `${response.status}: ${response.statusText}`,
          endpoint: targetEndpoint
        }), 
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const data = await response.json();
    console.log('✅ CarAPIs response received, data length:', JSON.stringify(data).length);

    // Transform the data to match our internal structure
    const transformedData = transformCarAPIsData(data, targetEndpoint);

    return new Response(JSON.stringify(transformedData), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('❌ Error in car-apis function:', error);
    
    let errorMessage = 'Failed to process request';
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message?.includes('JSON')) {
      errorMessage = 'Invalid response format from API. Please try again.';
    } else if (error.message) {
      errorMessage = `Request failed: ${error.message}`;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        type: error.name || 'Unknown',
        details: error.message || 'Internal server error'
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

function transformCarAPIsData(data: any, endpoint: string) {
  // Handle different endpoint responses
  switch (endpoint) {
    case 'vehicles':
      return {
        data: data.results?.map(transformVehicle) || data.data?.map(transformVehicle) || [],
        total: data.count || data.total || 0,
        page: data.page || 1,
        per_page: data.per_page || 20
      };
    
    case 'vehicle':
      return transformVehicle(data);
    
    case 'makes':
    case 'models':  
    case 'years':
    case 'body_types':
    case 'fuel_types':
    case 'transmissions':
    case 'colors':
      return data;
    
    default:
      return data;
  }
}

function transformVehicle(vehicle: any) {
  if (!vehicle) return null;
  
  // Transform CarAPIs.com vehicle data to match our internal structure
  return {
    id: vehicle.id?.toString() || vehicle.vehicle_id?.toString(),
    year: vehicle.year || vehicle.model_year,
    title: vehicle.title || `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
    vin: vehicle.vin,
    manufacturer: {
      id: vehicle.make_id || 0,
      name: vehicle.make || vehicle.manufacturer
    },
    model: {
      id: vehicle.model_id || 0, 
      name: vehicle.model || vehicle.model_name
    },
    generation: {
      id: vehicle.generation_id || 0,
      name: vehicle.generation || vehicle.trim
    },
    body_type: vehicle.body_type || vehicle.body_style,
    color: {
      name: vehicle.color || vehicle.exterior_color,
      id: vehicle.color_id || 0
    },
    engine: {
      id: vehicle.engine_id || 0,
      name: vehicle.engine || vehicle.engine_type,
      size: vehicle.engine_size || vehicle.displacement,
      cylinders: vehicle.cylinders,
      horsepower: vehicle.horsepower || vehicle.power,
      torque: vehicle.torque
    },
    transmission: {
      name: vehicle.transmission || vehicle.transmission_type,
      id: vehicle.transmission_id || 0
    },
    drive_wheel: vehicle.drivetrain || vehicle.drive_type,
    vehicle_type: {
      name: vehicle.vehicle_type || 'automobile',
      id: 1
    },
    fuel: {
      name: vehicle.fuel_type || vehicle.fuel,
      id: vehicle.fuel_type_id || 0
    },
    
    // Lot/Sale information
    lots: [{
      id: vehicle.listing_id || vehicle.id,
      lot: vehicle.lot_number || vehicle.stock_number,
      domain: {
        name: vehicle.source || 'carapis',
        id: 1
      },
      external_id: vehicle.external_id,
      odometer: {
        km: vehicle.mileage_km || vehicle.kilometers,
        mi: vehicle.mileage || vehicle.miles,
        status: {
          name: vehicle.mileage_status || 'actual',
          id: 1
        }
      },
      estimate_repair_price: vehicle.estimated_repair_cost,
      pre_accident_price: vehicle.pre_accident_value,
      clean_wholesale_price: vehicle.wholesale_price,
      actual_cash_value: vehicle.market_value,
      sale_date: vehicle.sale_date || vehicle.listed_date,
      bid: vehicle.current_bid,
      buy_now: vehicle.price || vehicle.asking_price,
      final_bid: vehicle.final_price || vehicle.sold_price,
      status: {
        name: vehicle.status || vehicle.listing_status || 'sale',
        id: getStatusId(vehicle.status || vehicle.listing_status)
      },
      seller: vehicle.seller || vehicle.dealer_name,
      seller_type: vehicle.seller_type || vehicle.dealer_type,
      title: vehicle.title_status || vehicle.title_type,
      detailed_title: vehicle.detailed_title,
      
      // Damage information
      damage: {
        main: vehicle.primary_damage || vehicle.damage_type,
        second: vehicle.secondary_damage
      },
      
      // Vehicle condition
      keys_available: vehicle.keys_available !== false,
      airbags: vehicle.airbags_deployed,
      condition: {
        name: vehicle.condition || vehicle.vehicle_condition || 'unknown',
        id: getConditionId(vehicle.condition)
      },
      grade_iaai: vehicle.grade || vehicle.condition_grade,
      
      // Images
      images: {
        id: vehicle.image_id || 0,
        small: vehicle.thumbnail_images || vehicle.thumbnails || [],
        normal: vehicle.images || vehicle.photos || [],
        big: vehicle.high_res_images || vehicle.hd_images || vehicle.images || []
      },
      
      // Additional details
      features: vehicle.features || vehicle.options || [],
      inspection_report: vehicle.inspection_data,
      equipment: vehicle.equipment || vehicle.accessories,
      
      // Technical specifications
      doors: vehicle.doors,
      seats: vehicle.seating_capacity || vehicle.seats,
      cargo_capacity: vehicle.cargo_space,
      fuel_economy: {
        city: vehicle.mpg_city || vehicle.fuel_economy_city,
        highway: vehicle.mpg_highway || vehicle.fuel_economy_highway,
        combined: vehicle.mpg_combined || vehicle.fuel_economy_combined
      },
      
      // Safety and emissions
      safety_rating: vehicle.safety_rating,
      emissions_rating: vehicle.emissions_rating,
      co2_emissions: vehicle.co2_emissions,
      
      // Pricing and valuation
      msrp: vehicle.msrp || vehicle.original_price,
      book_value: vehicle.book_value || vehicle.kbb_value,
      trade_in_value: vehicle.trade_in_value,
      
      // History and documentation
      accident_history: vehicle.accident_history,
      service_records: vehicle.service_history,
      previous_owners: vehicle.owner_count || vehicle.previous_owners,
      warranty_info: vehicle.warranty,
      
      // Location and availability
      location: {
        city: vehicle.city || vehicle.location_city,
        state: vehicle.state || vehicle.location_state,
        country: vehicle.country || vehicle.location_country || 'United States',
        zip: vehicle.zip_code || vehicle.postal_code
      }
    }]
  };
}

function getStatusId(status: string): number {
  const statusMap: Record<string, number> = {
    'active': 1,
    'pending': 2, 
    'sale': 3,
    'sold': 4,
    'archived': 5
  };
  return statusMap[status?.toLowerCase()] || 1;
}

function getConditionId(condition: string): number {
  const conditionMap: Record<string, number> = {
    'excellent': 1,
    'very_good': 2,
    'good': 3,
    'fair': 4,
    'poor': 5,
    'run_and_drives': 0
  };
  return conditionMap[condition?.toLowerCase()] || 0;
}

serve(handler);