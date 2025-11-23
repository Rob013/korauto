import { useState, useRef, startTransition, useCallback } from "react";
import { categorizeAndOrganizeGrades, flattenCategorizedGrades } from '../utils/grade-categorization';
import { getBrandLogo } from '@/data/brandLogos';

// Simple memory cache for the session only
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds
const MAX_API_RETRIES = 2;
const API_RETRY_BASE_DELAY = 300;
let lastFetchTime = 0;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to get cached data or make API call
const getCachedApiCall = async (endpoint: string, filters: any, apiCall: () => Promise<any>) => {
  const cacheKey = `${endpoint}-${JSON.stringify(filters)}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📋 Using cached data for ${endpoint}`);
    return cached.data;
  }

  const data = await apiCall();
  apiCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

export const makeSecureAPICall = async (
  endpoint: string,
  filters: any = {},
  carId?: string
): Promise<any> => {
  // Direct external API call using provided key
  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

  // Build URL once
  let url: string;
  if (carId && (endpoint === 'cars' || endpoint === 'car')) {
    url = `${API_BASE_URL}/cars/${encodeURIComponent(carId)}`;
  } else if (endpoint.includes('/')) {
    // e.g., models/{id}/cars or generations/{id}
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') params.append(k, String(v));
    });
    url = `${API_BASE_URL}/${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
  } else {
    const params = new URLSearchParams();
    if (!filters?.per_page) params.append('per_page', '200');
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') params.append(k, String(v));
    });
    url = `${API_BASE_URL}/${endpoint}?${params.toString()}`;
  }

  const performRequest = async () => {
    const now = Date.now();
    if (now - lastFetchTime < 50) {
      await delay(50 - (now - lastFetchTime));
    }
    lastFetchTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        headers: {
          accept: 'application/json',
          'x-api-key': API_KEY,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`API ${res.status}`);
      }
      return await res.json();
    } catch (e: any) {
      clearTimeout(timeoutId);
      const error = new Error(e?.message || 'External API request failed');
      if (e?.name) {
        error.name = e.name;
      }
      throw error;
    }
  };

  let attempt = 0;
  while (attempt <= MAX_API_RETRIES) {
    try {
      if (attempt > 0) {
        console.warn(`🔁 Retrying ${endpoint} (attempt ${attempt + 1}/${MAX_API_RETRIES + 1})`);
      }
      return await performRequest();
    } catch (error: any) {
      const isAbortError = error?.name === 'AbortError';
      const canRetry = attempt < MAX_API_RETRIES && !isAbortError;
      if (!canRetry) {
        throw error;
      }

      const backoffDelay = API_RETRY_BASE_DELAY * Math.pow(2, attempt);
      await delay(backoffDelay);
      attempt += 1;
    }
  }

  throw new Error('Unexpected API retry exit');
};

// Create fallback car data for testing when API is not available
export const createFallbackCars = (_filters: any = {}): any[] => {
  return [];
};

export const createFallbackGenerations = (_manufacturerName: string): any[] => {
  return [];
};

export const createFallbackModels = (_manufacturerName: string): any[] => {
  return [];
};

export const createFallbackManufacturers = () => {
  return [];
};

export interface Lot {
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
  insurance_v2?: any;
  location?: any;
  inspect?: any;
  details?: any;
}

export interface Car {
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

export interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  image?: string;
}

export interface Model {
  id: number;
  name: string;
  car_count?: number;
  manufacturer_id?: number;
}

export interface Generation {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  from_year?: number;
  to_year?: number;
  manufacturer_id?: number;
  model_id?: number;
}

export interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  trim_level?: string;
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
  const [filters, setFilters] = useState<APIFilters>({});

  const activeFetchRequestIdRef = useRef(0);

  const fetchCars = async (
    page: number = 1,
    newFilters: APIFilters = filters,
    resetList: boolean = true
  ): Promise<void> => {
    activeFetchRequestIdRef.current += 1;
    const requestId = activeFetchRequestIdRef.current;

    const isCurrentRequest = () => activeFetchRequestIdRef.current === requestId;

    if (resetList) {
      startTransition(() => {
        setFilters(newFilters);
      });
      setLoading(true);
      if (page === 1) {
        setCurrentPage(1);
      }
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      // Pass filters to the API
      const apiFilters = {
        ...newFilters,
        page: page.toString(),
        per_page: newFilters.per_page || "200", // Show 200 cars per page
        simple_paginate: "0",
      };

      // Remove client-side filters from server request
      const selectedVariant = newFilters.grade_iaai;
      const selectedTrimLevel = newFilters.trim_level;
      delete apiFilters.grade_iaai;
      delete apiFilters.trim_level;

      console.log(`🔄 Fetching cars - Page ${page} with filters:`, apiFilters);
      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);

      // Apply client-side variant filtering if a variant is selected
      let filteredCars = data.data || [];
      if (selectedVariant && selectedVariant !== 'all') {
        filteredCars = filteredCars.filter(car => {
          if (car.lots && Array.isArray(car.lots)) {
            return car.lots.some(lot => {
              if (lot.grade_iaai && lot.grade_iaai.trim() === selectedVariant) return true;
              if (lot.details && lot.details.badge && lot.details.badge.trim() === selectedVariant) return true;
              if (car.engine && car.engine.name && car.engine.name.trim() === selectedVariant) return true;
              if (car.title && car.title.toLowerCase().includes(selectedVariant.toLowerCase())) return true;
              return false;
            });
          }
          return false;
        });
      }

      // Apply client-side trim level filtering
      if (selectedTrimLevel && selectedTrimLevel !== 'all') {
        filteredCars = filteredCars.filter(car => {
          if (car.lots && Array.isArray(car.lots)) {
            const hasMatchInLots = car.lots.some(lot => {
              if (lot.details && lot.details.badge &&
                lot.details.badge.toLowerCase().includes(selectedTrimLevel.toLowerCase())) return true;
              if (lot.grade_iaai &&
                lot.grade_iaai.toLowerCase().includes(selectedTrimLevel.toLowerCase())) return true;
              return false;
            });
            if (hasMatchInLots) return true;
          }
          if (car.title && car.title.toLowerCase().includes(selectedTrimLevel.toLowerCase())) return true;
          return false;
        });
      }

      const total = data.meta?.total || 0;
      const lastPage = data.meta?.last_page || 1;
      const hasMore = page < lastPage;

      // Enhanced filter for sold/inactive cars
      const isCarSold = (car: any): boolean => {
        // Check sale status strings
        const statusLabels = [
          String(car?.sale_status || "").toLowerCase(),
          String(car?.status || "").toLowerCase(),
          String(car?.lots?.[0]?.status || "").toLowerCase(),
          String(car?.lots?.[0]?.sale_status || "").toLowerCase(),
        ];

        // Check for sold/archived/inactive keywords
        const soldKeywords = ['sold', 'archived', 'inactive', 'removed', 'deleted', 'cancelled'];
        if (statusLabels.some((label) => soldKeywords.some(keyword => label.includes(keyword)))) {
          return true;
        }

        // Check numeric status codes (3, 4, 5 typically mean sold/archived)
        const numericStatus = Number(car?.status ?? car?.lots?.[0]?.status);
        if (Number.isFinite(numericStatus) && [3, 4, 5].includes(numericStatus)) {
          return true;
        }

        // Check if buy_now price is missing or 0 (likely removed/sold)
        const buyNowPrice = car?.lots?.[0]?.buy_now || car?.buy_now;
        if (!buyNowPrice || buyNowPrice <= 0) {
          return true;
        }

        return false;
      };

      const activeCars = filteredCars.filter(car => !isCarSold(car));

      console.log(
        `✅ API Success - Fetched ${filteredCars.length} cars from page ${page}`
      );

      startTransition(() => {
        if (!isCurrentRequest()) {
          return;
        }
        setTotalCount(total);
        setHasMorePages(hasMore);

        if (resetList || page === 1) {
          setCars(activeCars);
        } else {
          setCars((prev) => [...prev, ...activeCars]);
        }

        setCurrentPage(page);
        setLoading(false);
      });

    } catch (err: any) {
      console.error("❌ API Error:", err);

      if (err?.name === 'AbortError' || /abort/i.test(err?.message || '')) {
        return;
      }

      if (!isCurrentRequest()) {
        return;
      }

      if (err?.message === 'API 404') {
        startTransition(() => {
          setCars([]);
          setTotalCount(0);
          setHasMorePages(false);
          setCurrentPage(1);
          setLoading(false);
        });
        setError(null);
        return;
      }

      if (err.message === "RATE_LIMITED") {
        try {
          await delay(2000);
          return fetchCars(page, newFilters, resetList);
        } catch (retryErr) {
          console.error("❌ Retry failed:", retryErr);
        }
      }

      setError(err.message || "Failed to fetch cars");
      setLoading(false);
    }
  };

  const fetchAllCars = async (currentFilters: APIFilters = filters): Promise<Car[]> => {
    try {
      const apiFilters = {
        ...currentFilters,
        per_page: "1000",
        simple_paginate: "0",
      };
      delete apiFilters.grade_iaai;
      delete apiFilters.trim_level;

      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);
      return data.data || [];
    } catch (err) {
      console.error("❌ Error fetching all cars:", err);
      return [];
    }
  };

  const loadMore = async () => {
    if (!hasMorePages || loading) return;
    await fetchCars(currentPage + 1, filters, false);
  };

  const refreshInventory = useCallback((intervalSeconds: number = 300) => {
    // Auto-refresh to remove sold cars every 5 minutes (300 seconds)
    const intervalMs = intervalSeconds * 1000;
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing inventory to remove sold cars...');
      // Clear cache to force fresh API call
      apiCache.clear();
    }, intervalMs);

    return () => clearInterval(refreshInterval);
  }, []);

  const clearCarsCache = useCallback(() => {
    apiCache.clear();
  }, []);

  return {
    cars,
    setCars,
    loading,
    error,
    totalCount,
    setTotalCount,
    hasMorePages,
    fetchCars,
    fetchAllCars,
    fetchManufacturers,
    filters,
    setFilters,
    loadMore,
    refreshInventory,
    clearCarsCache
  };
};

export const fetchManufacturers = async (): Promise<Manufacturer[]> => {
  try {
    const data = await getCachedApiCall("manufacturers/cars", { per_page: "1000", simple_paginate: "0" },
      () => makeSecureAPICall("manufacturers/cars", {
        per_page: "1000",
        simple_paginate: "0"
      })
    );

    let manufacturers = data.data || [];
    if (manufacturers.length > 0) {
      manufacturers = manufacturers.map((manufacturer: any) => ({
        id: manufacturer.id,
        name: manufacturer.name,
        cars_qty: manufacturer.cars_qty || manufacturer.car_count || 0,
        car_count: manufacturer.car_count || manufacturer.cars_qty || 0,
        image: manufacturer.image || getBrandLogo(manufacturer.name)
      }));
    }
    return manufacturers;
  } catch (err) {
    console.error("❌ Error fetching manufacturers:", err);
    return [];
  }
};

export const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
  try {
    const data = await getCachedApiCall(`models/${manufacturerId}/cars`, { per_page: "1000", simple_paginate: "0" },
      () => makeSecureAPICall(`models/${manufacturerId}/cars`, {
        per_page: "1000",
        simple_paginate: "0"
      })
    );

    let models = (data.data || []).filter((m: any) => m && m.id && m.name);
    models = models.filter((m: any) =>
      m.manufacturer_id?.toString() === manufacturerId ||
      m.manufacturer?.id?.toString() === manufacturerId
    );
    models.sort((a: any, b: any) => a.name.localeCompare(b.name));
    return models;
  } catch (err) {
    console.error("[fetchModels] Error:", err);
    return [];
  }
};

export const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
  try {
    let generationsFromAPI: Generation[] = [];
    try {
      const generationResponse = await makeSecureAPICall(`generations/${modelId}`, {});
      if (generationResponse.data && Array.isArray(generationResponse.data)) {
        generationsFromAPI = generationResponse.data.filter((g: any) => g && g.id && g.name);
      }
    } catch (err) {
      // Ignore
    }

    if (generationsFromAPI.length > 0) {
      return generationsFromAPI.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (err) {
    console.error('[fetchGenerations] Error:', err);
    return [];
  }
};

export const fetchAllGenerationsForManufacturer = async (manufacturerId: string): Promise<Generation[]> => {
  try {
    const models = await fetchModels(manufacturerId);
    const allGenerations: Generation[] = [];
    for (const model of models) {
      const gens = await fetchGenerations(model.id.toString());
      allGenerations.push(...gens);
    }
    return allGenerations;
  } catch (err) {
    return [];
  }
};

export const fetchGrades = async (manufacturerId?: string, modelId?: string, generationId?: string): Promise<{ value: string; label: string; count?: number }[]> => {
  // Simplified fetchGrades for brevity, can be expanded if needed
  try {
    const filters: any = { per_page: '1000' };
    if (manufacturerId) filters.manufacturer_id = manufacturerId;
    if (modelId) filters.model_id = modelId;
    if (generationId) filters.generation_id = generationId;

    const data = await makeSecureAPICall('cars', filters);
    const cars = data.data || [];

    const gradesMap = new Map<string, number>();
    cars.forEach((car: any) => {
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach((lot: any) => {
          if (lot.grade_iaai && typeof lot.grade_iaai === 'string' && lot.grade_iaai.trim()) {
            const cleanGrade = lot.grade_iaai.trim();
            gradesMap.set(cleanGrade, (gradesMap.get(cleanGrade) || 0) + 1);
          }
        });
      }
    });

    const rawGrades = Array.from(gradesMap.entries())
      .map(([value, count]) => ({ value, label: value, count }));

    const categorizedGrades = categorizeAndOrganizeGrades(rawGrades);
    return flattenCategorizedGrades(categorizedGrades);
  } catch (e) {
    return [];
  }
};

export const fetchTrimLevels = async (manufacturerId?: string, modelId?: string, generationId?: string): Promise<{ value: string; label: string; count?: number }[]> => {
  return [];
};

export const fetchEngines = async (manufacturerId?: string, modelId?: string, generationId?: string): Promise<{ value: string; label: string; count?: number }[]> => {
  return [];
};

export const fetchFilterCounts = async (filters: APIFilters = {}, manufacturers: any[] = []): Promise<any> => {
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

export const fetchSourceCounts = async (filters: APIFilters = {}) => {
  return {
    auctions_api: 0,
    encar: 0,
    auctionapis: 0,
    kbc: 0,
    all: 0
  };
};

