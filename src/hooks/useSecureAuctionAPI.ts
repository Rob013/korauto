import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { filterTestCars } from "@/utils/carFilters";

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
        // Add filter to exclude test cars at API level if supported
        exclude_test_cars: "1"
      };
      
      // IMPORTANT: Remove grade_iaai from server request - we'll do client-side filtering
      // This prevents backend errors and ensures we get all cars for client-side filtering
      const selectedVariant = newFilters.grade_iaai;
      delete apiFilters.grade_iaai;

      console.log(`🔄 Fetching cars - Page ${page} with filters:`, apiFilters);
      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);

      // FIRST: Filter out test/emergency cars before any other filtering
      // This addresses the "18 test cars" issue when selecting brands
      let filteredCars = filterTestCars(data.data || []);

      console.log(`🧹 Filtered out test cars: ${(data.data || []).length - filteredCars.length} test cars removed, ${filteredCars.length} real cars remaining`);

      // SECOND: Apply client-side variant filtering if a variant is selected
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
        
        console.log(`✅ Variant filter "${selectedVariant}": ${filteredCars.length} cars match after test car filtering`);
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
      return [];
    }
  };

  const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
    try {
      const carResponse = await makeSecureAPICall('cars', {
        model_id: modelId,
        per_page: '20',
        simple_paginate: '0',
        exclude_test_cars: '1'
      });
      const cars = carResponse.data || [];
      const generations = extractGenerationsFromCars(cars).filter(g => g && g.id && g.name);
      generations.sort((a, b) => a.name.localeCompare(b.name));
      return generations;
    } catch (err) {
      console.error('[fetchGenerations] Error:', err);
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
        exclude_test_cars: "1"
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
      const filters: any = { 
        per_page: '50', // Increased for better grade coverage
        exclude_test_cars: '1'
      };
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
    const generationsMap = new Map<string, { id: number; name: string; car_count: number; from_year?: number; to_year?: number }>();
    let carsWithGenerations = 0;
    let carsWithoutGenerations = 0;
    
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
      } else {
        carsWithoutGenerations++;
      }
    });
    
    const generations = Array.from(generationsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`📊 Cars with generations: ${carsWithGenerations}, Cars without generations: ${carsWithoutGenerations}`);
    
    return generations.map(g => ({
      ...g,
      cars_qty: g.car_count
    }));
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
        simple_paginate: "1",
        exclude_test_cars: "1"
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
          per_page: "1000",
          exclude_test_cars: "1"
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
        simple_paginate: "1",
        exclude_test_cars: "1"
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
              simple_paginate: "1",
              exclude_test_cars: "1"
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
