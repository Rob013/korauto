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
      console.log("🔐 Making secure API call:", { endpoint, filters, carId });

      // Add a small delay to prevent rapid successive calls
      const now = Date.now();
      if (now - lastFetchTime < 500) {
        // 500ms minimum between calls
        await delay(500 - (now - lastFetchTime));
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
        throw new Error(functionError.message || "API call failed");
      }

      if (data?.error) {
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
      // Pass ALL filters to the API including grade_iaai
      const apiFilters = {
        ...newFilters,
        page: page.toString(),
        // Increase per_page when filtering by grade to get more relevant results
        per_page: newFilters.grade_iaai ? "50" : (newFilters.per_page || "12"),
        simple_paginate: "0",
      };

      console.log(`🔄 Fetching cars - Page ${page} with filters:`, apiFilters);
      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);

      // Set metadata from response
      setTotalCount(data.meta?.total || 0);
      setHasMorePages(page < (data.meta?.last_page || 1));

      console.log(
        `✅ API Success - Fetched ${data.data?.length || 0} cars from page ${page}, total: ${data.meta?.total || 0}`
      );

      if (resetList || page === 1) {
        setCars(data.data || []);
        setCurrentPage(1);
      } else {
        setCars((prev) => [...prev, ...(data.data || [])]);
        setCurrentPage(page);
      }
    } catch (err: any) {
      console.error("❌ API Error:", err);
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
      const data = await makeSecureAPICall("manufacturers/cars");
      return data.data || [];
    } catch (err) {
      console.error("❌ Error fetching manufacturers:", err);
      return [];
    }
  };

  const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
    try {
      const data = await makeSecureAPICall(`models/${manufacturerId}/cars`);
      return data.data || [];
    } catch (err) {
      console.error("❌ Error fetching models:", err);
      return [];
    }
  };

  const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
    try {
      const data = await makeSecureAPICall(`generations/${modelId}/cars`);
      return data.data || [];
    } catch (err) {
      console.error("❌ Error fetching generations:", err);
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
      // Fetch a reasonable sample to extract grades without overloading the API
      const filters = {
        manufacturer_id: manufacturerId,
        model_id: modelId, 
        generation_id: generationId,
        per_page: '50' // Reduced to prevent multiple rapid calls
      };

      console.log('🔍 Fetching grades for filters:', filters);
      const data = await makeSecureAPICall('cars', filters);
      
      const cars = data.data || [];
      console.log('🔍 Found', cars.length, 'cars for grade extraction');
      
      if (cars.length === 0) {
        return getFallbackGrades(manufacturerId);
      }
      
      // Extract unique grades from the car data
      const gradesMap = new Map<string, number>();
      
      cars.forEach((car: any) => {
        // Check lots array first
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
        
        // Extract from title (common pattern: "BMW 320d", "Audi A6 35 TDI", "Mercedes E220d")
        if (car.title && typeof car.title === 'string') {
          const titleGrades = extractGradesFromTitle(car.title);
          titleGrades.forEach(grade => {
            gradesMap.set(grade, (gradesMap.get(grade) || 0) + 1);
          });
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

      console.log('📊 Extracted grades:', grades.length, 'unique grades');
      
      // If still no grades found, return fallback based on manufacturer
      if (grades.length === 0) {
        return getFallbackGrades(manufacturerId);
      }
      
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
      // Audi: 35 TDI, 45 TFSI, etc.
      /\b(\d{2,3}\s?(?:TDI|TFSI|FSI|TFSI\se-tron))\b/gi,
      // Mercedes: E220d, C300, etc.
      /\b([A-Z]\d{3}[a-z]?)\b/gi,
      // General engine badges
      /\b(\d+\.?\d*\s?(?:TDI|TFSI|TSI|CDI|CGI|AMG|d|i))\b/gi
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
      '9': ['320d', '320i', '325d', '330d', '330i', '335d', '335i'], // BMW
      '16': ['220d', '250', '300', '350', '400', '450', '500'], // Mercedes-Benz
      '1': ['35 TDI', '40 TDI', '45 TDI', '50 TDI', '55 TFSI', '30 TFSI', '35 TFSI', '40 TFSI', '45 TFSI'], // Audi
      '147': ['1.4 TSI', '1.6 TDI', '1.8 TSI', '2.0 TDI', '2.0 TSI'], // Volkswagen
    };
    
    const grades = fallbacks[manufacturerId || ''] || [];
    return grades.map(grade => ({ value: grade, label: grade }));
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
    fetchCarById,
    fetchCarCounts,
    fetchFilterCounts,
    fetchKoreaDuplicates,
    fetchGrades,
    loadMore,
  };
};
