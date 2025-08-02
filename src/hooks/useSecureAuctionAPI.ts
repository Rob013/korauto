import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Simple debounce utility (avoiding lodash dependency)
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
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

  // Enhanced caching and performance optimizations
  const [apiCache, setApiCache] = useState<{ [key: string]: { data: any; timestamp: number } }>({});
  const [requestQueue, setRequestQueue] = useState<{ [key: string]: Promise<any> }>({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Debounced API call utility
  const debouncedApiCall = useCallback(
    debounce(async (endpoint: string, filters: any, carId?: string) => {
      return makeSecureAPICall(endpoint, filters, carId);
    }, 300),
    []
  );

  // Enhanced API call with caching and deduplication
  const makeOptimizedAPICall = async (
    endpoint: string,
    filters: any = {},
    carId?: string
  ): Promise<any> => {
    const cacheKey = `${endpoint}-${JSON.stringify(filters)}-${carId || ''}`;
    const now = Date.now();
    
    // Check cache first
    const cached = apiCache[cacheKey];
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`📦 Cache hit for ${endpoint}`);
      return cached.data;
    }
    
    // Check if request is already in progress
    if (requestQueue[cacheKey]) {
      console.log(`⏳ Request deduplication for ${endpoint}`);
      return requestQueue[cacheKey];
    }
    
    // Make new request
    const requestPromise = makeSecureAPICall(endpoint, filters, carId);
    setRequestQueue(prev => ({ ...prev, [cacheKey]: requestPromise }));
    
    try {
      const result = await requestPromise;
      
      // Cache successful results
      setApiCache(prev => ({
        ...prev,
        [cacheKey]: { data: result, timestamp: now }
      }));
      
      return result;
    } finally {
      // Remove from queue
      setRequestQueue(prev => {
        const newQueue = { ...prev };
        delete newQueue[cacheKey];
        return newQueue;
      });
    }
  };

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

  // Enhanced fetchCars with performance optimizations
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
      delete apiFilters.grade_iaai;

      // Use optimized API call with caching
      const data: APIResponse = await makeOptimizedAPICall("cars", apiFilters);

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

  // Enhanced fetchManufacturers with caching
  const fetchManufacturers = async (): Promise<Manufacturer[]> => {
    try {
      console.log(`🔍 Fetching all manufacturers`);
      
      // Use optimized API call with caching
      const data = await makeOptimizedAPICall("manufacturers/cars", {
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

  // Enhanced fetchModels with caching
  const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
    try {
      // Use optimized API call with caching
      const fallbackData = await makeOptimizedAPICall(`models/${manufacturerId}/cars`, {
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

  // Enhanced fetchGenerations with caching
  const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
    try {
      const carResponse = await makeOptimizedAPICall('cars', {
        model_id: modelId,
        per_page: '20',
        simple_paginate: '0'
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
      
      // Extract unique grades from the car data
      const gradesMap = new Map<string, number>();
      
      cars.forEach((car: any) => {
        // Primary source: lots array grade_iaai
        if (car.lots && Array.isArray(car.lots)) {
          car.lots.forEach((lot: any) => {
            if (lot.grade_iaai && typeof lot.grade_iaai === 'string' && lot.grade_iaai.trim()) {
              const cleanGrade = lot.grade_iaai.trim();
              gradesMap.set(cleanGrade, (gradesMap.get(cleanGrade) || 0) + 1);
            }
          });
        }
        
        // Secondary source: extract from title
        if (car.title && typeof car.title === 'string') {
          const titleGrades = extractGradesFromTitle(car.title);
          titleGrades.forEach(grade => {
            if (grade && !gradesMap.has(grade)) {
              gradesMap.set(grade, 1);
            }
          });
        }
        
        // Tertiary source: engine field
        if (car.engine && car.engine.name && typeof car.engine.name === 'string' && car.engine.name.trim()) {
          const engineGrade = car.engine.name.trim();
          if (!gradesMap.has(engineGrade)) {
            gradesMap.set(engineGrade, 1);
          }
        }
      });

      // Filter out common non-grade values and convert to array
      const invalidGrades = new Set(['unknown', 'n/a', 'none', '', 'null', 'undefined']);
      const grades = Array.from(gradesMap.entries())
        .filter(([value]) => !invalidGrades.has(value.toLowerCase()) && value.length > 0)
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }))
        .sort((a, b) => b.count - a.count); // Sort by popularity first

      console.log('📊 Extracted grades:', grades.length, 'unique grades:', grades.slice(0, 10).map(g => `${g.value}(${g.count})`));
      
      // Always return something - fallback if no grades found
      const result = grades.length > 0 ? grades : getFallbackGrades(manufacturerId);
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

  // Comprehensive API categories fetcher
  const fetchAllCategories = async (): Promise<{
    manufacturers: Manufacturer[];
    bodyTypes: any[];
    fuelTypes: any[];
    transmissions: any[];
    colors: any[];
    locations: any[];
    domains: any[];
  }> => {
    try {
      console.log('🔄 Fetching all API categories...');
      
      const [
        manufacturersData,
        bodyTypesData,
        fuelTypesData,
        transmissionsData,
        colorsData,
        locationsData,
        domainsData
      ] = await Promise.all([
        makeOptimizedAPICall("manufacturers/cars", { per_page: "1000" }),
        makeOptimizedAPICall("body-types", { per_page: "1000" }).catch(() => ({ data: [] })),
        makeOptimizedAPICall("fuel-types", { per_page: "1000" }).catch(() => ({ data: [] })),
        makeOptimizedAPICall("transmissions", { per_page: "1000" }).catch(() => ({ data: [] })),
        makeOptimizedAPICall("colors", { per_page: "1000" }).catch(() => ({ data: [] })),
        makeOptimizedAPICall("locations", { per_page: "1000" }).catch(() => ({ data: [] })),
        makeOptimizedAPICall("domains", { per_page: "1000" }).catch(() => ({ data: [] }))
      ]);
      
      console.log('✅ All categories fetched successfully');
      
      return {
        manufacturers: manufacturersData?.data || [],
        bodyTypes: bodyTypesData?.data || [],
        fuelTypes: fuelTypesData?.data || [],
        transmissions: transmissionsData?.data || [],
        colors: colorsData?.data || [],
        locations: locationsData?.data || [],
        domains: domainsData?.data || []
      };
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      return {
        manufacturers: [],
        bodyTypes: [],
        fuelTypes: [],
        transmissions: [],
        colors: [],
        locations: [],
        domains: []
      };
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
    fetchAllCategories, // ✅ Export new function for categories
  };
};
