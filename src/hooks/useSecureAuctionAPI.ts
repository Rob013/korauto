import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { findGenerationYears } from "@/data/generationYears";

// Create fallback generation data for testing when API is not available
export const createFallbackGenerations = (manufacturerName: string): Generation[] => {
  const generationData: { [key: string]: Generation[] } = {
    'BMW': [
      { id: 1001, name: 'E90/E91/E92/E93', from_year: 2005, to_year: 2013, cars_qty: 45, manufacturer_id: 9, model_id: 101 },
      { id: 1002, name: 'F30/F31/F34/F35', from_year: 2012, to_year: 2019, cars_qty: 67, manufacturer_id: 9, model_id: 101 },
      { id: 1003, name: 'G20/G21', from_year: 2019, to_year: 2024, cars_qty: 89, manufacturer_id: 9, model_id: 101 },
      { id: 1004, name: 'E60/E61', from_year: 2003, to_year: 2010, cars_qty: 23, manufacturer_id: 9, model_id: 102 },
      { id: 1005, name: 'F10/F11/F07/F18', from_year: 2010, to_year: 2017, cars_qty: 56, manufacturer_id: 9, model_id: 102 },
      { id: 1006, name: 'G30/G31/G38', from_year: 2017, to_year: 2024, cars_qty: 78, manufacturer_id: 9, model_id: 102 }
    ],
    'Audi': [
      { id: 2001, name: 'C7', from_year: 2011, to_year: 2018, cars_qty: 45, manufacturer_id: 1, model_id: 201 },
      { id: 2002, name: 'C8', from_year: 2018, to_year: 2024, cars_qty: 67, manufacturer_id: 1, model_id: 201 },
      { id: 2003, name: 'B8', from_year: 2007, to_year: 2015, cars_qty: 34, manufacturer_id: 1, model_id: 202 },
      { id: 2004, name: 'B9', from_year: 2015, to_year: 2024, cars_qty: 56, manufacturer_id: 1, model_id: 202 }
    ],
    'Mercedes-Benz': [
      { id: 3001, name: 'W204', from_year: 2007, to_year: 2014, cars_qty: 45, manufacturer_id: 16, model_id: 301 },
      { id: 3002, name: 'W205', from_year: 2014, to_year: 2021, cars_qty: 67, manufacturer_id: 16, model_id: 301 },
      { id: 3003, name: 'W206', from_year: 2021, to_year: 2024, cars_qty: 23, manufacturer_id: 16, model_id: 301 }
    ]
  };

  return generationData[manufacturerName] || [];
};

// Create fallback model data for testing when API is not available
export const createFallbackModels = (manufacturerName: string): Model[] => {
  const modelData: { [key: string]: Model[] } = {
    'BMW': [
      { id: 101, name: '3 Series', cars_qty: 201 },
      { id: 102, name: '5 Series', cars_qty: 157 },
      { id: 103, name: '7 Series', cars_qty: 89 },
      { id: 104, name: 'X3', cars_qty: 145 },
      { id: 105, name: 'X5', cars_qty: 123 }
    ],
    'Audi': [
      { id: 201, name: 'A6', cars_qty: 112 },
      { id: 202, name: 'A4', cars_qty: 98 },
      { id: 203, name: 'A3', cars_qty: 76 },
      { id: 204, name: 'Q7', cars_qty: 45 }
    ],
    'Mercedes-Benz': [
      { id: 301, name: 'C-Class', cars_qty: 134 },
      { id: 302, name: 'E-Class', cars_qty: 98 },
      { id: 303, name: 'S-Class', cars_qty: 67 }
    ]
  };

  return modelData[manufacturerName] || [];
};

// Create fallback manufacturer data without logos
export const createFallbackManufacturers = () => {
  const fallbackData = [
    // German brands (priority)
    { id: 9, name: 'BMW', cars_qty: 245 },
    { id: 16, name: 'Mercedes-Benz', cars_qty: 189 },
    { id: 1, name: 'Audi', cars_qty: 167 },
    { id: 147, name: 'Volkswagen', cars_qty: 134 },
    { id: 13, name: 'Porsche', cars_qty: 27 },
    { id: 22, name: 'Opel', cars_qty: 45 },
    
    // Korean brands
    { id: 7, name: 'Hyundai', cars_qty: 112 },
    { id: 8, name: 'Kia', cars_qty: 95 },
    { id: 19, name: 'Genesis', cars_qty: 12 },
    
    // Japanese brands
    { id: 3, name: 'Toyota', cars_qty: 156 },
    { id: 2, name: 'Honda', cars_qty: 98 },
    { id: 4, name: 'Nissan', cars_qty: 87 },
    { id: 10, name: 'Mazda', cars_qty: 43 },
    { id: 11, name: 'Subaru', cars_qty: 29 },
    { id: 12, name: 'Lexus', cars_qty: 38 },
    { id: 17, name: 'Infiniti', cars_qty: 18 },
    { id: 18, name: 'Acura', cars_qty: 15 },
    { id: 23, name: 'Mitsubishi', cars_qty: 25 },
    
    // American brands
    { id: 5, name: 'Ford', cars_qty: 76 },
    { id: 6, name: 'Chevrolet', cars_qty: 54 },
    { id: 24, name: 'Cadillac', cars_qty: 18 },
    { id: 25, name: 'GMC', cars_qty: 15 },
    { id: 20, name: 'Tesla', cars_qty: 8 },
    { id: 26, name: 'Chrysler', cars_qty: 12 },
    { id: 27, name: 'Jeep', cars_qty: 22 },
    { id: 28, name: 'Dodge', cars_qty: 16 },
    
    // Luxury/European brands
    { id: 14, name: 'Land Rover', cars_qty: 22 },
    { id: 21, name: 'Jaguar', cars_qty: 9 },
    { id: 15, name: 'Volvo', cars_qty: 31 },
    { id: 29, name: 'Ferrari', cars_qty: 3 },
    { id: 30, name: 'Lamborghini', cars_qty: 2 },
    { id: 31, name: 'Maserati', cars_qty: 4 },
    { id: 32, name: 'Bentley', cars_qty: 2 },
    { id: 33, name: 'Rolls-Royce', cars_qty: 1 },
    { id: 34, name: 'Aston Martin', cars_qty: 2 },
    { id: 35, name: 'McLaren', cars_qty: 1 },
    { id: 43, name: 'Mini', cars_qty: 14 },
    
    // French brands
    { id: 36, name: 'Peugeot', cars_qty: 28 },
    { id: 37, name: 'Renault', cars_qty: 35 },
    { id: 38, name: 'Citroën', cars_qty: 18 },
    
    // Italian brands
    { id: 39, name: 'Fiat', cars_qty: 22 },
    { id: 40, name: 'Alfa Romeo', cars_qty: 11 },
    
    // Other European brands
    { id: 41, name: 'Skoda', cars_qty: 24 },
    { id: 42, name: 'Seat', cars_qty: 16 }
  ];
  
  return fallbackData.map(manufacturer => ({
    id: manufacturer.id,
    name: manufacturer.name,
    cars_qty: manufacturer.cars_qty,
    car_count: manufacturer.cars_qty
  }));
};


interface Lot {
  buy_now?: number;
  odometer?: { km?: number };
  popularity_score?: number;
  images?: { normal?: string[]; big?: string[] };
  bid?: number;
  lot?: string;
  status?: string;
  sale_status?: string;
  final_price?: number;
  estimate_repair_price?: number;
  pre_accident_price?: number;
  clean_wholesale_price?: number;
  actual_cash_value?: number;
  sale_date?: string;
  seller?: string;
  seller_type?: string;
  detailed_title?: string;
  damage?: { main?: string; second?: string };
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  domain?: { name: string };
  external_id?: string;
  // Enhanced data from your API response
  insurance?: {
    accident_history?: string;
    repair_count?: string;
    total_loss?: string;
    repair_cost?: string;
    flood_damage?: string;
    own_damage?: string;
    other_damage?: string;
    car_info?: {
      make?: string;
      accident_history?: string;
      repair_count?: string;
      total_loss?: string;
      repair_cost?: string;
      flood_damage?: string;
    };
    general_info?: {
      model?: string;
      year?: string;
      usage_type?: string;
      insurance_start_date?: string;
    };
    usage_history?: Array<{
      description: string;
      value: string;
    }>;
    owner_changes?: Array<{
      date: string;
      change_type: string;
      previous_number?: string;
      usage_type: string;
    }>;
    special_accident_history?: Array<{
      type: string;
      value: string;
    }>;
  };
  insurance_v2?: {
    regDate?: string;
    year?: number;
    maker?: string;
    displacement?: number;
    firstDate?: string;
    model?: string;
    myAccidentCnt?: number;
    otherAccidentCnt?: number;
    ownerChangeCnt?: number;
    robberCnt?: number;
    totalLossCnt?: number;
    floodTotalLossCnt?: number;
    government?: number;
    business?: number;
    loan?: number;
    carNoChangeCnt?: number;
    myAccidentCost?: number;
    otherAccidentCost?: number;
    carInfoChanges?: Array<{
      date: string;
      carNo: string;
    }>;
    carInfoUse1s?: string[];
    carInfoUse2s?: string[];
    ownerChanges?: any[];
    accidentCnt?: number;
    accidents?: any[];
  };
  location?: {
    country?: { name: string; iso: string };
    city?: { name: string };
    state?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string;
    is_offsite?: boolean;
    raw?: string;
    offsite?: string;
  };
  inspect?: {
    accident_summary?: {
      main_framework?: string;
      exterior1rank?: string;
      exterior2rank?: string;
      simple_repair?: string;
      accident?: string;
    };
    outer?: Record<string, string[]>;
    inner?: Record<string, string>;
  };
  details?: {
    engine_volume?: number;
    original_price?: number;
    year?: number;
    month?: number;
    first_registration?: {
      year: number;
      month: number;
      day: number;
    };
    badge?: string;
    comment?: string;
    description_ko?: string;
    description_en?: string;
    is_leasing?: boolean;
    sell_type?: string;
    equipment?: any;
    options?: {
      type?: string;
      standard?: string[];
      etc?: string[];
      choice?: string[];
      tuning?: string[];
    };
    inspect_outer?: Array<{
      type: { code: string; title: string };
      statusTypes: Array<{ code: string; title: string }>;
      attributes: string[];
    }>;
    seats_count?: number;
  };
}

interface Car {
  id: string;
  manufacturer: { id: number; name: string };
  model: { id: number; name: string };
  generation?: {
    id: number;
    name: string;
    manufacturer_id: number;
    model_id: number;
  };
  year: number;
  price?: string;
  mileage?: string;
  title?: string;
  vin?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  condition?: string;
  lot_number?: string;
  image_url?: string;
  color?: { id: number; name: string };
  status?: number;
  sale_status?: string;
  final_price?: number;
  body_type?: { id: number; name: string };
  engine?: { id: number; name: string };
  drive_wheel?: string;
  vehicle_type?: { id: number; name: string };
  cylinders?: number;
  lots?: Lot[];
}

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  image?: string;
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
}

interface Generation {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  from_year?: number;
  to_year?: number;
  manufacturer_id?: number;
  model_id?: number;
}

interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  seats_count?: string;
  search?: string;
  per_page?: string;
  sort_by?: string;
  sort_direction?: string;
}

interface APIResponse {
  data: Car[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
  error?: string;
  retryAfter?: number;
}

export const useSecureAuctionAPI = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [filters, setFilters] = useState<APIFilters>({});
  const [gradesCache, setGradesCache] = useState<{ [key: string]: { value: string; label: string; count?: number }[] }>({});

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const makeSecureAPICall = async (
    endpoint: string,
    filters: any = {},
    carId?: string
  ): Promise<any> => {
    try {
      console.log("🔐 Making secure API call:", { endpoint, filters, carId });

      // Add a minimal delay to prevent rapid successive calls
      const now = Date.now();
      if (now - lastFetchTime < 50) {
        // 50ms minimum between calls (optimized for faster loading)
        await delay(50 - (now - lastFetchTime));
      }
      setLastFetchTime(Date.now());

      console.log("🔐 Calling Supabase function with body:", { endpoint, filters, carId });
      const { data, error: functionError } = await supabase.functions.invoke(
        "secure-cars-api",
        {
          body: { endpoint, filters, carId },
        }
      );
      
      console.log("🔐 Supabase function response:", { data, error: functionError });

      if (functionError) {
        console.error("❌ Edge function error:", functionError);
        console.error("❌ Function error details:", {
          message: functionError.message,
          name: functionError.name,
          stack: functionError.stack,
          endpoint,
          filters,
          carId
        });
        throw new Error(functionError.message || "API call failed");
      }

      if (data?.error) {
        console.error("❌ API returned error:", data.error);
        console.error("❌ Error details:", {
          error: data.error,
          endpoint,
          filters,
          carId,
          data
        });
        
        if (data.retryAfter) {
          console.log("⏳ Rate limited, waiting...");
          await delay(data.retryAfter);
          throw new Error("RATE_LIMITED");
        }
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      console.error("❌ Secure API call error:", err);
      throw err;
    }
  };

  // Helper function to map frontend sort options to API parameters
  const mapSortToAPI = (sortBy: string): { sort_by?: string; sort_direction?: string } => {
    // Note: Many external APIs don't support these exact sorting parameters
    // We'll try to send them but fall back to client-side sorting if needed
    switch (sortBy) {
      case 'price_low':
        return { sort_by: 'price', sort_direction: 'asc' };
      case 'price_high':
        return { sort_by: 'price', sort_direction: 'desc' };
      case 'year_new':
        return { sort_by: 'year', sort_direction: 'desc' };
      case 'year_old':
        return { sort_by: 'year', sort_direction: 'asc' };
      case 'mileage_low':
        return { sort_by: 'mileage', sort_direction: 'asc' };
      case 'mileage_high':
        return { sort_by: 'mileage', sort_direction: 'desc' };
      case 'make_az':
        return { sort_by: 'manufacturer', sort_direction: 'asc' };
      case 'make_za':
        return { sort_by: 'manufacturer', sort_direction: 'desc' };
      case 'popular':
        return { sort_by: 'popularity', sort_direction: 'desc' };
      default:
        return {};
    }
  };

  const fetchCars = async (
    page: number = 1,
    newFilters: APIFilters = filters,
    resetList: boolean = true
  ): Promise<void> => {
    if (resetList) {
      setFilters(newFilters);
      setLoading(true);
      setCurrentPage(1);
    }
    setError(null);

    try {
      // Pass filters to the API - DO NOT send grade_iaai to server for filtering
      const apiFilters = {
        ...newFilters,
        page: page.toString(),
        per_page: newFilters.per_page || "50", // Show 50 cars per page
        simple_paginate: "0",
      };
      
      // IMPORTANT: Remove grade_iaai from server request - we'll do client-side filtering
      // This prevents backend errors and ensures we get all cars for client-side filtering
      const selectedVariant = newFilters.grade_iaai;
      delete apiFilters.grade_iaai;

      console.log(`🔄 Fetching cars - Page ${page} with filters:`, apiFilters);
      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);

      // Apply client-side variant filtering if a variant is selected
      let filteredCars = data.data || [];
      if (selectedVariant && selectedVariant !== 'all') {
        console.log(`🔍 Applying client-side variant filter: "${selectedVariant}"`);
        
        filteredCars = filteredCars.filter(car => {
          // Check if car has the selected variant in any of its lots
          if (car.lots && Array.isArray(car.lots)) {
            return car.lots.some(lot => {
              // Check grade_iaai field
              if (lot.grade_iaai && lot.grade_iaai.trim() === selectedVariant) {
                return true;
              }
              
              // Check badge field
              if (lot.details && lot.details.badge && lot.details.badge.trim() === selectedVariant) {
                return true;
              }
              
              // Check engine name
              if (car.engine && car.engine.name && car.engine.name.trim() === selectedVariant) {
                return true;
              }
              
              // Check title for variant
              if (car.title && car.title.toLowerCase().includes(selectedVariant.toLowerCase())) {
                return true;
              }
              
              return false;
            });
          }
          return false;
        });
        
        console.log(`✅ Variant filter "${selectedVariant}": ${filteredCars.length} cars match out of ${data.data?.length || 0} total`);
      }

      // Set metadata from response (but adjust total count for client-side filtering)
      const totalFiltered = selectedVariant && selectedVariant !== 'all' ? filteredCars.length : (data.meta?.total || 0);
      setTotalCount(totalFiltered);
      setHasMorePages(page < (data.meta?.last_page || 1));

      console.log(
        `✅ API Success - Fetched ${filteredCars.length} cars from page ${page}, total: ${totalFiltered}`
      );

      if (resetList || page === 1) {
        setCars(filteredCars);
        setCurrentPage(1);
      } else {
        setCars((prev) => [...prev, ...filteredCars]);
        setCurrentPage(page);
      }
    } catch (err: any) {
      console.error("❌ API Error:", err);
      
      // Clear any existing error first
      setError(null);
      
      if (err.message === "RATE_LIMITED") {
        // Retry once after rate limit
        try {
          await delay(2000);
          return fetchCars(page, newFilters, resetList);
        } catch (retryErr) {
          console.error("❌ Retry failed:", retryErr);
          setError("Rate limited - please try again later");
        }
      } else {
        console.error("❌ Fetch cars error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch cars");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturers = async (): Promise<Manufacturer[]> => {
    try {
      console.log(`🔍 Fetching all manufacturers`);
      
      // Try to get manufacturers from API first
      const data = await makeSecureAPICall("manufacturers/cars", {
        per_page: "1000", // Get all manufacturers
        simple_paginate: "0"
      });
      
      let manufacturers = data.data || [];
      
      // If we got manufacturers from API, normalize them
      if (manufacturers.length > 0) {
        console.log(`✅ Found ${manufacturers.length} manufacturers from API`);
        manufacturers = manufacturers.map(manufacturer => ({
          id: manufacturer.id,
          name: manufacturer.name,
          cars_qty: manufacturer.cars_qty || manufacturer.car_count || 0,
          car_count: manufacturer.car_count || manufacturer.cars_qty || 0
        }));
      } else {
        // No manufacturers from API, use fallback data
        console.log(`⚠️ No manufacturers from API, using fallback data`);
        manufacturers = createFallbackManufacturers();
      }
      
      console.log(`🏷️ Retrieved manufacturers:`, 
        manufacturers.slice(0, 5).map(m => `${m.name} (${m.cars_qty || 0} cars)`));
      
      return manufacturers;
    } catch (err) {
      console.error("❌ Error fetching manufacturers:", err);
      console.log(`🔄 Using fallback manufacturer data`);
      
      // Return fallback data when API fails
      return createFallbackManufacturers();
    }
  };

  const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
    try {
      // Always use the direct endpoint for reliability
      const fallbackData = await makeSecureAPICall(`models/${manufacturerId}/cars`, {
        per_page: "1000",
        simple_paginate: "0"
      });
      let fallbackModels = (fallbackData.data || []).filter((m: any) => m && m.id && m.name);

      // Filter models by manufacturer_id (in case API returns extra)
      fallbackModels = fallbackModels.filter((m: any) =>
        m.manufacturer_id?.toString() === manufacturerId ||
        m.manufacturer?.id?.toString() === manufacturerId
      );

      fallbackModels.sort((a: any, b: any) => a.name.localeCompare(b.name));
      return fallbackModels;
    } catch (err) {
      console.error("[fetchModels] Error:", err);
      console.log(`🔄 Using fallback model data for manufacturer ${manufacturerId}`);
      
      // Use fallback model data based on manufacturer name
      const manufacturers = await fetchManufacturers();
      const manufacturer = manufacturers.find(m => m.id.toString() === manufacturerId);
      if (manufacturer) {
        return createFallbackModels(manufacturer.name);
      }
      
      return [];
    }
  };

  const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
    try {
      // First try to fetch generations from a dedicated endpoint
      let generationsFromAPI: Generation[] = [];
      try {
        const generationResponse = await makeSecureAPICall(`generations/${modelId}`, {});
        if (generationResponse.data && Array.isArray(generationResponse.data)) {
          generationsFromAPI = generationResponse.data.filter(g => g && g.id && g.name);
          console.log(`🎯 Found ${generationsFromAPI.length} generations from dedicated API endpoint`);
        }
      } catch (err) {
        console.log('📍 No dedicated generations endpoint, falling back to car data extraction');
      }

      // If we have API generations with proper year data, use them
      if (generationsFromAPI.length > 0 && generationsFromAPI.some(g => g.from_year || g.to_year)) {
        console.log('✅ Using generations with real API year data');
        return generationsFromAPI.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Fallback: extract generations from car data but prioritize API generation data
      const carResponse = await makeSecureAPICall('cars', {
        model_id: modelId,
        per_page: '20',
        simple_paginate: '0'
      });
      const cars = carResponse.data || [];
      
      // Use API generations if available, otherwise extract from cars
      let generations: Generation[];
      if (generationsFromAPI.length > 0) {
        // We have API generations but no year data, so we'll enhance them with car year data
        console.log('📊 Enhancing API generations with car year data');
        generations = enhanceGenerationsWithCarYears(generationsFromAPI, cars);
      } else {
        // No API generations, extract everything from car data
        console.log('🔄 Extracting generations from car data');
        generations = extractGenerationsFromCars(cars);
      }
      
      const filteredGenerations = generations.filter(g => g && g.id && g.name);
      filteredGenerations.sort((a, b) => a.name.localeCompare(b.name));
      return filteredGenerations;
    } catch (err) {
      console.error('[fetchGenerations] Error:', err);
      console.log(`🔄 Using fallback generation data for model ${modelId}`);
      
      // Use fallback generation data based on manufacturer name
      const manufacturers = await fetchManufacturers();
      const models = await Promise.all(
        manufacturers.map(async m => ({ manufacturer: m, models: await fetchModels(m.id.toString()) }))
      );
      
      // Find the manufacturer for this model
      let manufacturerName = '';
      for (const { manufacturer, models: mModels } of models) {
        if (mModels.some(m => m.id.toString() === modelId)) {
          manufacturerName = manufacturer.name;
          break;
        }
      }
      
      if (manufacturerName) {
        return createFallbackGenerations(manufacturerName);
      }
      
      return [];
    }
  };

  // Helper function to enhance API generations with car year data
  const enhanceGenerationsWithCarYears = (apiGenerations: Generation[], cars: Car[]): Generation[] => {
    const yearDataMap = new Map<number, { from_year?: number; to_year?: number; car_count: number }>();
    const currentYear = new Date().getFullYear();
    
    // Extract year data from cars for each generation
    cars.forEach(car => {
      if (car.generation && car.generation.id && car.year) {
        // Fixed: Validate that car year is reasonable (between 1980 and current year + 1)
        if (car.year >= 1980 && car.year <= currentYear + 1) {
          const genId = car.generation.id;
          const existing = yearDataMap.get(genId);
          
          if (existing) {
            existing.car_count++;
            if (!existing.from_year || car.year < existing.from_year) {
              existing.from_year = car.year;
            }
            if (!existing.to_year || car.year > existing.to_year) {
              existing.to_year = car.year;
            }
          } else {
            yearDataMap.set(genId, {
              from_year: car.year,
              to_year: car.year,
              car_count: 1
            });
          }
        }
      }
    });

    // Enhance API generations with extracted year data and real generation year data as fallback
    return apiGenerations.map(gen => {
      const yearData = yearDataMap.get(gen.id);
      
      // Try to get real generation year data from our comprehensive database
      let realYearData: { from_year?: number; to_year?: number } | null = null;
      if (gen.manufacturer_id && gen.model_id) {
        // Get manufacturer and model names from car data or API
        const manufacturerName = cars.find(car => 
          car.manufacturer && car.manufacturer.id === gen.manufacturer_id
        )?.manufacturer?.name;
        const modelName = cars.find(car => 
          car.model && car.model.id === gen.model_id
        )?.model?.name;
        
        if (manufacturerName && modelName && gen.name) {
          realYearData = findGenerationYears(manufacturerName, modelName, gen.name);
          if (realYearData) {
            console.log(`🎯 Found real generation year data for ${manufacturerName} ${modelName} ${gen.name}: ${realYearData.from_year}-${realYearData.to_year}`);
          }
        }
      }
      
      return {
        ...gen,
        // Priority: 1. Valid API data, 2. Real generation data, 3. Car year data
        from_year: (gen.from_year && gen.from_year >= 1980) ? gen.from_year : 
                   (realYearData?.from_year || yearData?.from_year),
        to_year: (gen.to_year && gen.to_year <= currentYear + 1) ? gen.to_year : 
                 (realYearData?.to_year || yearData?.to_year),
        cars_qty: gen.cars_qty || yearData?.car_count || 0
      };
    });
  };

  const fetchFilterCounts = async (
    currentFilters: APIFilters = {},
    manufacturersList: any[] = []
  ) => {
    // Mock implementation for backward compatibility
    console.log("📊 fetchFilterCounts called with filters:", currentFilters);
    return {
      manufacturers: {},
      models: {},
      generations: {},
      colors: {},
      fuelTypes: {},
      transmissions: {},
      years: {},
    };
  };

  const fetchCarCounts = async (
    filters: APIFilters = {}
  ): Promise<{ [key: string]: number }> => {
    try {
      const apiFilters = {
        ...filters,
        per_page: "1",
        simple_paginate: "1",
      };

      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);
      return { total: data.meta?.total || 0 };
    } catch (err) {
      console.error("❌ Error fetching car counts:", err);
      return { total: 0 };
    }
  };

  const fetchCarById = async (carId: string): Promise<Car | null> => {
    try {
      const data = await makeSecureAPICall("cars", {}, carId);
      return data.data || null;
    } catch (err) {
      console.error("❌ Error fetching car by ID:", err);
      return null;
    }
  };

  const fetchKoreaDuplicates = async (
    minutes: number = 10,
    perPage: number = 1000
  ): Promise<any[]> => {
    try {
      const filters = {
        minutes: minutes.toString(),
        per_page: perPage.toString(),
      };
      const data = await makeSecureAPICall("korea-duplicates", filters);
      return data.data || [];
    } catch (err) {
      console.error("❌ Error fetching Korea duplicates:", err);
      return [];
    }
  };

  const fetchGrades = async (manufacturerId?: string, modelId?: string, generationId?: string): Promise<{ value: string; label: string; count?: number }[]> => {
    const cacheKey = `${manufacturerId || ''}-${modelId || ''}-${generationId || ''}`;
    
    // Always return fallback instantly for manufacturer-only filtering for speed
    if (!modelId && !generationId && manufacturerId) {
      const fallback = getFallbackGrades(manufacturerId);
      // Start async fetch to update cache but don't wait
      setTimeout(() => {
        if (!gradesCache[cacheKey]) {
          _fetchGradesAsync(manufacturerId, modelId, generationId, cacheKey);
        }
      }, 0);
      return fallback;
    }
    
    // Use cache if available
    if (gradesCache[cacheKey]) {
      return gradesCache[cacheKey];
    }

    // For specific model/generation, fetch directly
    return _fetchGradesAsync(manufacturerId, modelId, generationId, cacheKey);
  };

  const _fetchGradesAsync = async (manufacturerId?: string, modelId?: string, generationId?: string, cacheKey?: string): Promise<{ value: string; label: string; count?: number }[]> => {
    try {
      const key = cacheKey || `${manufacturerId || ''}-${modelId || ''}-${generationId || ''}`;
      
      // Build filters - only include valid values
      const filters: any = { per_page: '50' }; // Increased for better grade coverage
      if (manufacturerId) filters.manufacturer_id = manufacturerId;
      if (modelId) filters.model_id = modelId;
      if (generationId) filters.generation_id = generationId;

      console.log('🔍 Fetching grades with filters:', filters);
      const data = await makeSecureAPICall('cars', filters);
      
      const cars = data.data || [];
      console.log('🔍 Found', cars.length, 'cars for grade extraction');
      
      if (cars.length === 0) {
        const fallback = getFallbackGrades(manufacturerId);
        setGradesCache(prev => ({ ...prev, [key]: fallback }));
        return fallback;
      }
      
      // Extract unique grades from multiple sources (like encar.com approach)
      const gradesMap = new Map<string, number>();
      
      cars.forEach((car: any) => {
        // Primary source: lots array grade_iaai from API
        if (car.lots && Array.isArray(car.lots)) {
          car.lots.forEach((lot: any) => {
            if (lot.grade_iaai && typeof lot.grade_iaai === 'string' && lot.grade_iaai.trim()) {
              const cleanGrade = lot.grade_iaai.trim();
              gradesMap.set(cleanGrade, (gradesMap.get(cleanGrade) || 0) + 1);
            }
          });
        }
        
        // Secondary source: badge from lots details (like encar.com trim levels)
        if (car.lots && Array.isArray(car.lots)) {
          car.lots.forEach((lot: any) => {
            if (lot.details && lot.details.badge && typeof lot.details.badge === 'string' && lot.details.badge.trim()) {
              const badge = lot.details.badge.trim();
              gradesMap.set(badge, (gradesMap.get(badge) || 0) + 1);
            }
          });
        }
        
        // Tertiary source: engine name (only meaningful engine variants)
        if (car.engine && car.engine.name && typeof car.engine.name === 'string' && car.engine.name.trim()) {
          const engineName = car.engine.name.trim();
          // Only include meaningful engine variants (like 45 TDI, 35 TDI)
          // Exclude engine codes (like CSU, DBP) and pure numbers
          if (engineName.length > 2 && 
              !/^\d+\.?\d*$/.test(engineName) && // Not just numbers
              !/^[A-Z]{2,4}$/.test(engineName) && // Not engine codes like CSU, DBP
              /^(?:\d+\s*)?(?:TDI|TFSI|TSI|FSI|CDI|CGI|AMG|d|i|e|h|hybrid|electric|e-tron|phev)/i.test(engineName)) { // Must contain engine type
            gradesMap.set(engineName, (gradesMap.get(engineName) || 0) + 1);
          }
        }
        
        // Quaternary source: extract meaningful engine variants from title
        if (car.title && typeof car.title === 'string') {
          const title = car.title.toLowerCase();
          
          // Extract meaningful engine variants (like 45 TDI, 35 TDI)
          const engineVariantPatterns = [
            /\b(\d+\s*(?:tdi|tfsi|tsi|fsi|cdi|cgi))\b/gi, // 45 TDI, 35 TFSI, etc.
            /\b(amg|m|rs|s|gt|gts|gti|r|n|st)\b/gi, // Performance variants
            /\b(hybrid|electric|e-tron|phev|ev)\b/gi, // Electric/hybrid
            /\b(premium|luxury|sport|exclusive|elite|prestige|comfort|deluxe)\b/gi // Trim levels
          ];
          
          engineVariantPatterns.forEach(pattern => {
            const matches = title.match(pattern);
            if (matches) {
              matches.forEach(match => {
                const cleanMatch = match.trim();
                if (cleanMatch && cleanMatch.length > 0) {
                  gradesMap.set(cleanMatch, (gradesMap.get(cleanMatch) || 0) + 1);
                }
              });
            }
          });
        }
      });

      // Debug: Log what we found
      console.log('🔍 Raw variant values found:', Array.from(gradesMap.keys()));
      console.log('🔍 Total cars processed:', cars.length);
      console.log('🔍 Cars with lots:', cars.filter(car => car.lots && car.lots.length > 0).length);

      // Filter out engine codes and non-meaningful variants
      const invalidGrades = new Set(['unknown', 'n/a', 'none', '', 'null', 'undefined', 'basic', 'standard']);
      
      // Function to check if a variant is meaningful (not an engine code)
      const isMeaningfulVariant = (variant: string): boolean => {
        const lowerVariant = variant.toLowerCase();
        
        // Exclude if it's in invalid list
        if (invalidGrades.has(lowerVariant)) return false;
        
        // Exclude engine codes (2-4 letter codes like DLH, DPA, CSU, etc.)
        if (/^[A-Z]{2,4}$/i.test(variant)) return false;
        
        // Exclude combinations of engine codes (like "DLH DPA")
        if (/^[A-Z]{2,4}\s+[A-Z]{2,4}$/i.test(variant)) return false;
        
        // Exclude pure numbers
        if (/^\d+\.?\d*$/.test(variant)) return false;
        
        // Must contain meaningful content (engine types, trim levels, etc.)
        const meaningfulPatterns = [
          /tdi|tfsi|tsi|fsi|cdi|cgi/i, // Engine types
          /amg|m|rs|s|gt|gts|gti|r|n|st/i, // Performance variants
          /hybrid|electric|e-tron|phev|ev/i, // Electric/hybrid
          /premium|luxury|sport|exclusive|elite|prestige|comfort|deluxe/i, // Trim levels
          /\d+\s*(tdi|tfsi|tsi|fsi|cdi|cgi)/i // Number + engine type (like 45 TDI)
        ];
        
        return meaningfulPatterns.some(pattern => pattern.test(variant));
      };
      
      // Debug: Show what's being filtered out
      const allVariants = Array.from(gradesMap.keys());
      const filteredOut = allVariants.filter(variant => !isMeaningfulVariant(variant));
      if (filteredOut.length > 0) {
        console.log('🚫 Filtered out engine codes:', filteredOut);
      }
      
      const grades = Array.from(gradesMap.entries())
        .filter(([value]) => isMeaningfulVariant(value))
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }))
        .sort((a, b) => b.count - a.count); // Sort by popularity first

      console.log('📊 Extracted variants:', grades.length, 'unique variants:', grades.slice(0, 10).map(g => `${g.value}(${g.count})`));
      
      // If no variants found from API, try fallback
      if (grades.length === 0) {
        console.log('⚠️ No variants found from API, trying fallback...');
        const fallback = getFallbackGrades(manufacturerId);
        console.log('🔄 Fallback variants:', fallback);
        return fallback;
      }
      
      const result = grades;
      setGradesCache(prev => ({ ...prev, [key]: result }));
      return result;
    } catch (err) {
      console.error("❌ Error fetching grades:", err);
      const fallback = getFallbackGrades(manufacturerId);
      const key = cacheKey || `${manufacturerId || ''}-${modelId || ''}-${generationId || ''}`;
      setGradesCache(prev => ({ ...prev, [key]: fallback }));
      return fallback;
    }
  };



  // Fallback grades based on manufacturer - but only show grades that actually exist in the data
  // Helper function to extract generations from car data
  const extractGenerationsFromCars = (cars: Car[]): Generation[] => {
    const generationsMap = new Map<string, { id: number; name: string; car_count: number; from_year?: number; to_year?: number; manufacturer_name?: string; model_name?: string }>();
    let carsWithGenerations = 0;
    let carsWithoutGenerations = 0;
    const currentYear = new Date().getFullYear();
    
    cars.forEach(car => {
      // Only use generation if it exists in car data
      if (car.generation && car.generation.name && car.generation.id) {
        const generationName = car.generation.name.trim();
        const generationId = car.generation.id;
        
        if (generationName) {
          carsWithGenerations++;
          const key = generationName.toLowerCase();
          const existing = generationsMap.get(key);
          
          if (existing) {
            existing.car_count++;
            // Fixed: Validate that car year is reasonable before using it
            if (car.year && car.year >= 1980 && car.year <= currentYear + 1) {
              if (!existing.from_year || car.year < existing.from_year) {
                existing.from_year = car.year;
              }
              if (!existing.to_year || car.year > existing.to_year) {
                existing.to_year = car.year;
              }
            }
          } else {
            generationsMap.set(key, {
              id: generationId,
              name: generationName,
              car_count: 1,
              // Store manufacturer and model names for real year data lookup
              manufacturer_name: car.manufacturer?.name,
              model_name: car.model?.name,
              // Fixed: Only set year if it's valid
              from_year: car.year && car.year >= 1980 && car.year <= currentYear + 1 ? car.year : undefined,
              to_year: car.year && car.year >= 1980 && car.year <= currentYear + 1 ? car.year : undefined
            });
          }
        }
      } else {
        carsWithoutGenerations++;
      }
    });
    
    const generations = Array.from(generationsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`📊 Cars with generations: ${carsWithGenerations}, Cars without generations: ${carsWithoutGenerations}`);
    
    return generations.map(g => {
      // Try to enhance with real generation year data
      let realYearData: { from_year?: number; to_year?: number } | null = null;
      if (g.manufacturer_name && g.model_name) {
        realYearData = findGenerationYears(g.manufacturer_name, g.model_name, g.name);
        if (realYearData) {
          console.log(`🎯 Found real generation year data for ${g.manufacturer_name} ${g.model_name} ${g.name}: ${realYearData.from_year}-${realYearData.to_year}`);
        }
      }
      
      return {
        ...g,
        // Priority: 1. Car-derived years, 2. Real generation data
        from_year: g.from_year || realYearData?.from_year,
        to_year: g.to_year || realYearData?.to_year,
        cars_qty: g.car_count
      };
    });
  };

  const getFallbackGrades = (manufacturerId?: string): { value: string; label: string; count?: number }[] => {
    // Extract variants from multiple sources (like encar.com approach)
    const currentGrades = new Set<string>();
    
    cars.forEach(car => {
      // Primary source: lots array grade_iaai from API
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach(lot => {
          if (lot.grade_iaai && typeof lot.grade_iaai === 'string' && lot.grade_iaai.trim()) {
            currentGrades.add(lot.grade_iaai.trim());
          }
        });
      }
      
      // Secondary source: badge from lots details
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach((lot: any) => {
          if (lot.details && lot.details.badge && typeof lot.details.badge === 'string' && lot.details.badge.trim()) {
            currentGrades.add(lot.details.badge.trim());
          }
        });
      }
      
      // Tertiary source: engine name (only meaningful engine variants)
      if (car.engine && car.engine.name && typeof car.engine.name === 'string' && car.engine.name.trim()) {
        const engineName = car.engine.name.trim();
        // Only include meaningful engine variants (like 45 TDI, 35 TDI)
        // Exclude engine codes (like CSU, DBP) and pure numbers
        if (engineName.length > 2 && 
            !/^\d+\.?\d*$/.test(engineName) && // Not just numbers
            !/^[A-Z]{2,4}$/.test(engineName) && // Not engine codes like CSU, DBP
            /^(?:\d+\s*)?(?:TDI|TFSI|TSI|FSI|CDI|CGI|AMG|d|i|e|h|hybrid|electric|e-tron|phev)/i.test(engineName)) { // Must contain engine type
          currentGrades.add(engineName);
        }
      }
    });
    
    console.log('🔍 Actual variants found in current car data:', Array.from(currentGrades).sort());
    
    if (currentGrades.size > 0) {
      // Use actual variants from API data
      return Array.from(currentGrades)
        .sort()
        .map(grade => ({ value: grade, label: grade }));
    }
    
    // If no API data, provide comprehensive Korean-style fallback variants
    console.log('⚠️ No API variants found, providing Korean-style fallback variants');
    const koreanVariants = [
      { value: 'premium', label: 'Premium' },
      { value: 'luxury', label: 'Luxury' },
      { value: 'sport', label: 'Sport' },
      { value: 'exclusive', label: 'Exclusive' },
      { value: 'elite', label: 'Elite' },
      { value: 'prestige', label: 'Prestige' },
      { value: 'comfort', label: 'Comfort' },
      { value: 'deluxe', label: 'Deluxe' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'electric', label: 'Electric' }
    ];
    
    return koreanVariants;
  };

  // Function to get accurate car counts for a generation
  const getAccurateGenerationCount = async (generationId: string): Promise<number> => {
    try {
      console.log(`🔍 Getting count for generation ${generationId}...`);
      const data = await makeSecureAPICall("cars", {
        generation_id: generationId,
        per_page: "1",
        simple_paginate: "1"
      });
      const count = data.meta?.total || 0;
      console.log(`✅ Generation ${generationId} count: ${count}`);
      return count;
    } catch (err) {
      console.error(`❌ Error getting count for generation ${generationId}:`, err);
      
      // Fallback: try to get cars and count them manually
      try {
        console.log(`🔄 Trying fallback for generation ${generationId}...`);
        const carData = await makeSecureAPICall("cars", {
          generation_id: generationId,
          per_page: "1000"
        });
        const manualCount = carData.data?.length || 0;
        console.log(`✅ Fallback count for generation ${generationId}: ${manualCount}`);
        return manualCount;
      } catch (fallbackErr) {
        console.error(`❌ Fallback also failed for generation ${generationId}:`, fallbackErr);
        return 0;
      }
    }
  };

  // Function to get real-time count for any category combination
  const getCategoryCount = async (filters: {
    manufacturer_id?: string;
    model_id?: string;
    generation_id?: string;
    grade_iaai?: string;
    [key: string]: any;
  }): Promise<number> => {
    try {
      const data = await makeSecureAPICall("cars", {
        ...filters,
        per_page: "1",
        simple_paginate: "1"
      });
      return data.meta?.total || 0;
    } catch (err) {
      console.error(`❌ Error getting category count:`, err);
      return 0;
    }
  };

  // Function to get all generations for a manufacturer
  const fetchAllGenerationsForManufacturer = async (manufacturerId: string): Promise<Generation[]> => {
    try {
      console.log(`🔍 Fetching all generations for manufacturer ${manufacturerId}`);
      
      // First get all models for the manufacturer
      const models = await fetchModels(manufacturerId);
      console.log(`📊 Found ${models.length} models, fetching generations for each...`);
      
      const allGenerations: Generation[] = [];
      const generationMap = new Map<number, Generation>();
      
      // Fetch generations for each model
      for (const model of models) {
        try {
          const modelGenerations = await fetchGenerations(model.id.toString());
          modelGenerations.forEach(gen => {
            if (!generationMap.has(gen.id)) {
              generationMap.set(gen.id, gen);
              allGenerations.push(gen);
            }
          });
        } catch (err) {
          // Silent fallback
        }
      }
      
      // Get real counts by fetching cars for each generation
      const generationsWithRealCounts = await Promise.all(
        allGenerations.map(async (g) => {
          try {
            // Get cars for this specific generation with manufacturer filter
            const carData = await makeSecureAPICall("cars", {
              manufacturer_id: manufacturerId,
              generation_id: g.id.toString(),
              per_page: "1",
              simple_paginate: "1"
            });
            
            const realCount = carData.meta?.total || 0;
            
            return {
              ...g,
              car_count: realCount,
              cars_qty: realCount
            };
          } catch (err) {
            // Fallback to original count
            return {
              ...g,
              cars_qty: g.car_count || 0
            };
          }
        })
      );
      
      return generationsWithRealCounts.sort((a, b) => a.name.localeCompare(b.name));
      
    } catch (err) {
      return [];
    }
  };

  const loadMore = async () => {
    if (!hasMorePages || loading) return;

    setLoading(true);
    try {
      await fetchCars(currentPage + 1, filters, false);
    } catch (err) {
      console.error("❌ Load more error:", err);
      setError(err instanceof Error ? err.message : "Failed to load more cars");
    } finally {
      setLoading(false);
    }
  };
  return {
    cars,
    setCars, // ✅ Export setCars so it can be used in components
    loading,
    error,
    currentPage,
    totalCount,
    hasMorePages,
    fetchCars,
    filters,
    setFilters,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchAllGenerationsForManufacturer, // ✅ Export new function
    getCategoryCount, // ✅ Export new function for real-time counts
    fetchCarById,
    fetchCarCounts,
    fetchFilterCounts,
    fetchKoreaDuplicates,
    fetchGrades,
    loadMore,
  };
};
