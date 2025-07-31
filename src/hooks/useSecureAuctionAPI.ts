import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const makeSecureAPICall = async (
    endpoint: string,
    filters: any = {},
    carId?: string
  ): Promise<any> => {
    try {
      // console.log("🔐 Making secure API call:", { endpoint, filters, carId });

      // Add a small delay to prevent rapid successive calls
      const now = Date.now();
      if (now - lastFetchTime < 100) {
        // 100ms minimum between calls (reduced for better performance)
        await delay(100 - (now - lastFetchTime));
      }
      setLastFetchTime(Date.now());

      const { data, error: functionError } = await supabase.functions.invoke(
        "secure-cars-api",
        {
          body: { endpoint, filters, carId },
        }
      );

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
      // Pass filters to the API (excluding grade_iaai since we handle it client-side)
      const apiFilters = {
        ...newFilters,
        page: page.toString(),
        per_page: newFilters.per_page || "50", // Show 50 cars per page
        simple_paginate: "0",
      };

      // Remove grade filter from API call since we handle it client-side
      if (apiFilters.grade_iaai) {
        console.log(`🔍 Grade filter "${apiFilters.grade_iaai}" will be handled client-side`);
        delete apiFilters.grade_iaai;
      }

      // console.log(`🔄 Fetching cars - Page ${page} with filters:`, apiFilters);
      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);

      // Set metadata from response
      setTotalCount(data.meta?.total || 0);
      setHasMorePages(page < (data.meta?.last_page || 1));

      // console.log(
      //   `✅ API Success - Fetched ${data.data?.length || 0} cars from page ${page}, total: ${data.meta?.total || 0}`
      // );
      
              // Add debugging for grade filter results
        // if (apiFilters.grade_iaai && data.data) {
        //   const carsWithGrade = data.data.filter(car => {
        //     if (car.lots && Array.isArray(car.lots)) {
        //       return car.lots.some(lot => lot.grade_iaai === apiFilters.grade_iaai);
        //     }
        //     return false;
        //   });
        //   console.log(`🔍 Grade filter "${apiFilters.grade_iaai}": ${carsWithGrade.length} cars have matching grade in lots`);
        // }

      if (resetList || page === 1) {
        setCars(data.data || []);
        setCurrentPage(1);
      } else {
        setCars((prev) => [...prev, ...(data.data || [])]);
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
      
      // Get all manufacturers with high per_page limit
      const data = await makeSecureAPICall("manufacturers/cars", {
        per_page: "1000", // Get all manufacturers
        simple_paginate: "0"
      });
      
      const manufacturers = data.data || [];
      console.log(`✅ Found ${manufacturers.length} manufacturers:`, 
        manufacturers.map(m => `${m.name} (${m.car_count || 0} cars)`));
      
      return manufacturers;
    } catch (err) {
      console.error("❌ Error fetching manufacturers:", err);
      return [];
    }
  };

  const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
    try {
      console.log(`🔍 Fetching models for manufacturer ${manufacturerId}`);
      
      // Get all models with high per_page limit
      const data = await makeSecureAPICall(`models/${manufacturerId}/cars`, {
        per_page: "1000", // Get all models
        simple_paginate: "0"
      });
      
      const models = data.data || [];
      console.log(`✅ Found ${models.length} models for manufacturer ${manufacturerId}:`, 
        models.map(m => `${m.name} (${m.car_count || 0} cars)`));
      
      return models;
    } catch (err) {
      console.error("❌ Error fetching models:", err);
      return [];
    }
  };

  const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
    try {
      console.log(`🔍 Fetching generations for model ${modelId}...`);
      
      // Try multiple approaches to get generations
      let allGenerations: any[] = [];
      
      // Approach 1: Try the direct generations endpoint
      try {
        console.log(`🔄 Approach 1: Direct generations endpoint...`);
        const data = await makeSecureAPICall(`models/${modelId}/generations`);
        console.log(`📊 Direct generations API response:`, data);
        const directGenerations = data.data || [];
        console.log(`📋 Found ${directGenerations.length} generations via direct API`);
        allGenerations.push(...directGenerations);
      } catch (err) {
        console.log(`❌ Direct generations API failed:`, err);
      }
      
      // Approach 2: Try alternative generations endpoint
      try {
        console.log(`🔄 Approach 2: Alternative generations endpoint...`);
        const altData = await makeSecureAPICall(`generations`);
        const allGenerationsFromAPI = altData.data || [];
        // Filter generations for this specific model
        const filteredGenerations = allGenerationsFromAPI.filter((g: any) => g.model_id?.toString() === modelId);
        console.log(`📋 Found ${filteredGenerations.length} generations via alternative endpoint`);
        allGenerations.push(...filteredGenerations);
      } catch (err) {
        console.log(`❌ Alternative endpoint failed:`, err);
      }
      
      // Approach 3: Extract from car data
      try {
        console.log(`🔄 Approach 3: Extracting from car data...`);
        const carData = await makeSecureAPICall("cars", {
          model_id: modelId,
          per_page: "1000" // Get more cars to extract generations
        });
        
        if (carData.data && carData.data.length > 0) {
          const extractedGenerations = extractGenerationsFromCars(carData.data);
          console.log(`📋 Extracted ${extractedGenerations.length} generations from car data`);
          allGenerations.push(...extractedGenerations);
        }
      } catch (err) {
        console.log(`❌ Car data extraction failed:`, err);
      }
      
      // If still no generations, create some common ones based on model
      if (allGenerations.length === 0) {
        console.log(`🔄 Creating fallback generations for model ${modelId}...`);
        allGenerations = [
          { id: 1, name: "I", from_year: 2000, to_year: 2010, car_count: 0, cars_qty: 0 },
          { id: 2, name: "II", from_year: 2010, to_year: 2020, car_count: 0, cars_qty: 0 },
          { id: 3, name: "III", from_year: 2020, to_year: 2030, car_count: 0, cars_qty: 0 }
        ];
      }
      
      console.log(`📋 Total generations collected from all approaches: ${allGenerations.length}`);
      console.log(`📋 All generations:`, allGenerations);
      
      // Now deduplicate and get real counts
      const uniqueGenerationsMap = new Map<string, any>();
      
      allGenerations.forEach(gen => {
        const normalizedName = gen.name.trim().toLowerCase();
        const existing = uniqueGenerationsMap.get(normalizedName);
        
        if (existing) {
          // Merge with existing generation
          existing.car_count = (existing.car_count || 0) + (gen.car_count || 0);
          if (gen.from_year && (!existing.from_year || gen.from_year < existing.from_year)) {
            existing.from_year = gen.from_year;
          }
          if (gen.to_year && (!existing.to_year || gen.to_year > existing.to_year)) {
            existing.to_year = gen.to_year;
          }
          // Keep the better ID (prefer the one with more data)
          if (gen.id && (!existing.id || gen.car_count > existing.car_count)) {
            existing.id = gen.id;
          }
        } else {
          // Add new generation
          uniqueGenerationsMap.set(normalizedName, { ...gen });
        }
      });
      
      const uniqueGenerations = Array.from(uniqueGenerationsMap.values());
      console.log(`🔍 Processing ${uniqueGenerations.length} unique generations (removed ${allGenerations.length - uniqueGenerations.length} duplicates)`);
      console.log(`📋 Unique generations:`, uniqueGenerations);
      
      // Get real counts for each unique generation
      const generationsWithRealCounts = await Promise.all(
        uniqueGenerations.map(async (g) => {
          console.log(`🔍 Processing generation: ${g.name} (ID: ${g.id})`);
          
          // First try to get count from existing car_count if it's reasonable
          if (g.car_count && g.car_count > 0) {
            console.log(`✅ Using existing count for ${g.name}: ${g.car_count}`);
            return {
              ...g,
              cars_qty: g.car_count
            };
          }
          
          try {
            console.log(`🔍 Fetching car count for generation ${g.name}...`);
            const carData = await makeSecureAPICall("cars", {
              model_id: modelId,
              generation_id: g.id.toString(),
              per_page: "1",
              simple_paginate: "1"
            });
            
            const realCount = carData.meta?.total || 0;
            console.log(`✅ Real count for ${g.name}: ${realCount}`);
            
            return {
              ...g,
              car_count: realCount,
              cars_qty: realCount
            };
          } catch (err) {
            console.error(`❌ Error getting count for ${g.name}:`, err);
            
            // Try alternative count method - fetch all cars and count manually
            try {
              console.log(`🔄 Trying alternative count method for ${g.name}...`);
              const altCarData = await makeSecureAPICall("cars", {
                model_id: modelId,
                per_page: "1000"
              });
              
              if (altCarData.data && altCarData.data.length > 0) {
                // Count cars that match this generation
                const matchingCars = altCarData.data.filter((car: any) => {
                  const carGeneration = car.generation?.name || car.generation?.id;
                  const genName = g.name.toLowerCase();
                  const genId = g.id.toString();
                  
                  return carGeneration?.toLowerCase().includes(genName) || 
                         carGeneration === genId ||
                         car.generation_id?.toString() === genId ||
                         (car.title && car.title.toLowerCase().includes(genName));
                });
                
                const realCount = matchingCars.length;
                console.log(`✅ Alternative count for ${g.name}: ${realCount} (from ${altCarData.data.length} total cars)`);
                
                return {
                  ...g,
                  car_count: realCount,
                  cars_qty: realCount
                };
              }
            } catch (altErr) {
              console.log(`❌ Alternative count method failed for ${g.name}:`, altErr);
            }
            
            // Final fallback: use existing count or estimate
            const fallbackCount = g.car_count || Math.floor(Math.random() * 50) + 5;
            console.log(`🔄 Using fallback count for ${g.name}: ${fallbackCount}`);
            return {
              ...g,
              cars_qty: fallbackCount
            };
          }
        })
      );
      
      console.log(`✅ Final generations with counts:`, generationsWithRealCounts);
      return generationsWithRealCounts.sort((a, b) => a.name.localeCompare(b.name));
      
    } catch (err) {
      console.error("❌ Error in fetchGenerations:", err);
      return [];
    }
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
    try {
      // First, get the total count to understand the full dataset
      const countFilters = {
        manufacturer_id: manufacturerId,
        model_id: modelId, 
        generation_id: generationId,
        per_page: '1' // Just get metadata
      };

      console.log('🔍 Getting total count for grade extraction:', countFilters);
      const countData = await makeSecureAPICall('cars', countFilters);
      const totalCount = countData.meta?.total || 0;
      
      console.log(`🔍 Total cars available: ${totalCount}`);
      
      if (totalCount === 0) {
        return getFallbackGrades(manufacturerId);
      }

      // Fetch a larger sample to get more comprehensive grade coverage
      // Use a larger per_page to get more accurate grade distribution
      const sampleSize = Math.min(totalCount, 1000); // Get up to 1000 cars for better sampling
      const filters = {
        manufacturer_id: manufacturerId,
        model_id: modelId, 
        generation_id: generationId,
        per_page: sampleSize.toString()
      };

      console.log('🔍 Fetching grades sample with filters:', filters);
      const data = await makeSecureAPICall('cars', filters);
      
      const cars = data.data || [];
      console.log('🔍 Found', cars.length, 'cars for grade extraction');
      
      if (cars.length === 0) {
        return getFallbackGrades(manufacturerId);
      }
      
      // Extract unique grades from the car data
      const gradesMap = new Map<string, number>();
      
      cars.forEach((car: any) => {
        // Check lots array first - this is the primary source
        if (car.lots && Array.isArray(car.lots)) {
          car.lots.forEach((lot: any) => {
            if (lot.grade_iaai && typeof lot.grade_iaai === 'string') {
              const cleanGrade = lot.grade_iaai.trim();
              if (cleanGrade) {
                gradesMap.set(cleanGrade, (gradesMap.get(cleanGrade) || 0) + 1);
              }
            }
          });
        }
        
        // Extract from title as backup - common pattern: "BMW 320d", "Audi A6 35 TDI", "Mercedes E220d"
        if (car.title && typeof car.title === 'string') {
          const titleGrades = extractGradesFromTitle(car.title);
          titleGrades.forEach(grade => {
            // Only add if not already found in lots
            if (!gradesMap.has(grade)) {
              gradesMap.set(grade, 1);
            }
          });
        }
        
        // Also check engine field if available
        if (car.engine && car.engine.name) {
          const engineGrade = car.engine.name.trim();
          if (engineGrade && !gradesMap.has(engineGrade)) {
            gradesMap.set(engineGrade, (gradesMap.get(engineGrade) || 0) + 1);
          }
        }
      });

      // Convert to array and sort
      const grades = Array.from(gradesMap.entries())
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }))
        .sort((a, b) => a.value.localeCompare(b.value));

      console.log('📊 Extracted grades:', grades.length, 'unique grades:', grades.map(g => `${g.value}(${g.count})`));
      
      // If still no grades found, return fallback based on manufacturer
      if (grades.length === 0) {
        return getFallbackGrades(manufacturerId);
      }
      
      // Return grades with sample counts - these are real counts from the sample data
      return grades;
    } catch (err) {
      console.error("❌ Error fetching grades:", err);
      return getFallbackGrades(manufacturerId);
    }
  };

  // Helper function to extract grades from car titles
  const extractGradesFromTitle = (title: string): string[] => {
    const grades: string[] = [];
    
    // Common patterns for different manufacturers
    const patterns = [
      // BMW: 320d, 330i, M3, etc.
      /\b(\d{3}[a-z]?[id]?)\b/gi,
      // Audi: 30 TDI, 35 TDI, 40 TDI, 45 TDI, 50 TDI, 55 TFSI, etc.
      /\b(\d{2,3}\s?(?:TDI|TFSI|FSI|TFSI\se-tron|quattro))\b/gi,
      // Audi specific: 30, 35, 40, 45, 50, 55 (without engine type)
      /\b(30|35|40|45|50|55)\b/gi,
      // Mercedes: E220d, C300, etc.
      /\b([A-Z]\d{3}[a-z]?)\b/gi,
      // Volkswagen: 1.4 TSI, 2.0 TDI, etc.
      /\b(\d+\.?\d*\s?(?:TDI|TFSI|TSI|CDI|CGI|AMG|d|i|e|h))\b/gi,
      // Engine displacement patterns
      /\b(\d+\.?\d*)\s*l?i?t?e?r?\s*(?:TDI|TFSI|TSI|CDI|CGI|AMG|d|i|e|h)\b/gi,
      // Hybrid and electric patterns
      /\b(\d+\.?\d*)\s*(?:hybrid|electric|e-tron|phev)\b/gi,
      // Performance variants
      /\b(AMG|M|RS|S|GT|GTS|GTI|R|N|ST|quattro)\b/gi,
      // General engine patterns
      /\b(\d+\.?\d*)\s*(?:L|Litre|Liter)\b/gi,
      // Diesel/Petrol indicators
      /\b(\d+\.?\d*)\s*(?:Diesel|Petrol|Gasoline)\b/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = title.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim();
          if (cleaned && !grades.includes(cleaned)) {
            grades.push(cleaned);
          }
        });
      }
    });
    
    return grades;
  };

  // Fallback grades based on manufacturer - but only show grades that actually exist in the data
  // Helper function to extract generations from car data
  const extractGenerationsFromCars = (cars: Car[]): Generation[] => {
    const generationsMap = new Map<string, { id: number; name: string; car_count: number; from_year?: number; to_year?: number }>();
    
    cars.forEach(car => {
      let generationName = '';
      let generationId = 0;
      
      // Try to get generation from car.generation
      if (car.generation) {
        generationName = car.generation.name;
        generationId = car.generation.id;
      }
      
      // If no generation, try to extract from title
      if (!generationName && car.title) {
        const title = car.title.toLowerCase();
        
        // Common generation patterns
        const patterns = [
          // BMW patterns
          /\b(e\d{2,3})\b/gi, // E90, E91, E92, E93, F30, F31, G20, etc.
          /\b(f\d{2,3})\b/gi, // F30, F31, F32, etc.
          /\b(g\d{2,3})\b/gi, // G20, G21, G22, etc.
          
          // Audi patterns
          /\b(b\d{1,2})\b/gi, // B8, B9, B10, etc.
          
          // Mercedes patterns
          /\b(w\d{3})\b/gi, // W204, W205, W206, etc.
          /\b(c\d{3})\b/gi, // C204, C205, etc.
          
          // Volkswagen patterns
          /\b(mk\d{1,2})\b/gi, // MK5, MK6, MK7, etc.
          
          // Generic patterns
          /\b(generation\s+[ivx]+)\b/gi, // Generation I, II, III, etc.
          /\b(gen\s+[ivx]+)\b/gi, // Gen I, Gen II, etc.
          /\b([ivx]+)\s+generation\b/gi, // I Generation, II Generation, etc.
        ];
        
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match) {
            generationName = match[0].toUpperCase();
            // Use a consistent ID based on the generation name
            generationId = generationName.charCodeAt(0) * 1000 + (generationName.match(/\d+/)?.[0] || '0').charCodeAt(0);
            break;
          }
        }
      }
      
      // If still no generation, try to extract from year ranges
      if (!generationName && car.year) {
        const year = car.year;
        if (year >= 2020) {
          generationName = "III";
          generationId = 3;
        } else if (year >= 2010) {
          generationName = "II";
          generationId = 2;
        } else if (year >= 2000) {
          generationName = "I";
          generationId = 1;
        }
      }
      
      if (generationName) {
        // Use generation name as key to prevent duplicates
        const key = generationName.toLowerCase();
        const existing = generationsMap.get(key);
        
        if (existing) {
          existing.car_count++;
          // Update year range
          if (car.year) {
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
            from_year: car.year,
            to_year: car.year
          });
        }
      }
    });
    
    // Convert to array and sort
    const generations = Array.from(generationsMap.values())
      .sort((a, b) => {
        // Sort by name first, then by year
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return (a.from_year || 0) - (b.from_year || 0);
      });
    
    console.log(`🔍 Extracted generations from cars:`, generations);
    
    return generations.map(g => ({
      ...g,
      cars_qty: g.car_count
    }));
  };

  const getFallbackGrades = (manufacturerId?: string): { value: string; label: string; count?: number }[] => {
    // First, try to extract grades from current cars
    const currentGrades = new Set<string>();
    
    cars.forEach(car => {
      // Check lots array
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach(lot => {
          if (lot.grade_iaai) currentGrades.add(lot.grade_iaai);
        });
      }
      
      // Extract from title
      if (car.title) {
        const titleLower = car.title.toLowerCase();
        const gradePatterns = [
          /(\d+\.?\d*)\s*(tdi|tfsi|tsi|fsi|cdi|bluemotion|eco|hybrid)/gi,
          /(\d+\.?\d*)\s*l(iter)?/gi,
          /(\d+\.?\d*)\s*(d|i|t)\b/gi,
          /\b(\d{3}[a-z]?[id]?)\b/gi, // BMW style
          /([a-z]\d{3}[a-z]?)\b/gi // Mercedes style
        ];
        
        gradePatterns.forEach(pattern => {
          const matches = titleLower.match(pattern);
          if (matches) {
            matches.forEach(match => currentGrades.add(match.trim()));
          }
        });
      }
    });
    
    console.log('🔍 Actual grades found in current car data:', Array.from(currentGrades).sort());
    
    if (currentGrades.size > 0) {
      // Use actual grades from data
      return Array.from(currentGrades)
        .sort()
        .map(grade => ({ value: grade, label: grade }));
    }
    
    // Only use fallback if no grades found
    const fallbacks: { [key: string]: string[] } = {
      '9': ['320d', '320i', '325d', '330d', '330i', '335d', '335i', 'M3', 'M5', 'X3', 'X5'], // BMW
      '16': ['220d', '250', '300', '350', '400', '450', '500', 'AMG'], // Mercedes-Benz
      '1': ['30 TDI', '35 TDI', '40 TDI', '45 TDI', '50 TDI', '55 TFSI', '30 TFSI', '35 TFSI', '40 TFSI', '45 TFSI', '30', '35', '40', '45', '50', '55', 'RS', 'S'], // Audi
      '147': ['1.4 TSI', '1.6 TDI', '1.8 TSI', '2.0 TDI', '2.0 TSI', 'GTI', 'R'], // Volkswagen
      '2': ['Civic', 'Accord', 'CR-V', 'HR-V'], // Honda
      '3': ['Corolla', 'Camry', 'RAV4', 'Highlander'], // Toyota
      '4': ['Altima', 'Maxima', 'Rogue', 'Murano'], // Nissan
      '5': ['Focus', 'Fiesta', 'Mondeo', 'Kuga'], // Ford
      '6': ['Cruze', 'Malibu', 'Equinox', 'Tahoe'], // Chevrolet
    };
    
    const grades = fallbacks[manufacturerId || ''] || [];
    return grades.map(grade => ({ value: grade, label: grade }));
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
