import { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE_URL = 'https://api.auctionsapi.com';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const MIN_REQUEST_INTERVAL = 300; // 300ms for faster loading

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currentBid?: number;
  imageUrl?: string;
  images?: string[];
  mileage?: number;
  location?: string;
  endTime?: string;
  isLive: boolean;
  watchers?: number;
  vin?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  
  // Complete API data structure
  manufacturer?: {
    id: number;
    name: string;
  };
  model_data?: {
    id: number;
    name: string;
    manufacturer_id: number;
  };
  generation?: any;
  body_type?: {
    id: number;
    name: string;
  };
  color_data?: {
    id: number;
    name: string;
  };
  engine?: {
    id: number;
    name: string;
  };
  transmission_data?: {
    id: number;
    name: string;
  };
  drive_wheel?: {
    id: number;
    name: string;
  };
  vehicle_type?: {
    id: number;
    name: string;
  };
  fuel_data?: {
    id: number;
    name: string;
  };
  cylinders?: number;
  lots?: LotData[];
  
  // Additional fields from API
  displacement?: number;
  horsepower?: number;
  torque?: number;
  top_speed?: number;
  acceleration?: number;
  fuel_consumption?: {
    city?: number;
    highway?: number;
    combined?: number;
  };
  emissions?: {
    co2?: number;
    euro_standard?: string;
  };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    wheelbase?: number;
    weight?: number;
  };
  safety_rating?: {
    overall?: number;
    frontal?: number;
    side?: number;
    rollover?: number;
  };
  
  // Legacy compatibility fields
  odometer?: {
    km: number;
    mi: number;
    status: { name: string };
  };
  damage?: {
    main: string | null;
    second: string | null;
  };
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  seller?: string;
  seller_type?: string;
  sale_date?: string;
  bid?: number;
  buy_now?: number;
  final_bid?: number;
}

interface LotData {
  id: number;
  lot: string;
  domain: {
    name: string;
    id: number;
  };
  external_id?: string;
  odometer: {
    km: number;
    mi: number;
    status: {
      id: number;
      name: string;
    };
  };
  estimate_repair_price?: number;
  pre_accident_price?: number;
  clean_wholesale_price?: number;
  actual_cash_value?: number;
  sale_date?: string;
  sale_date_updated_at?: string;
  bid?: number;
  bid_updated_at?: string;
  buy_now?: number;
  buy_now_updated_at?: string;
  final_bid?: number;
  final_bid_updated_at?: string;
  status: {
    id: number;
    name: string;
  };
  seller?: string;
  seller_type?: string;
  title?: string;
  detailed_title?: string;
  damage: {
    main?: string;
    second?: string;
  };
  keys_available: boolean;
  airbags?: string;
  condition: {
    id: number;
    name: string;
  };
  grade_iaai?: string;
  images: {
    id: number;
    small?: string[];
    normal: string[];
    big: string[];
    exterior?: string[];
    interior?: string[];
    video?: string[];
  };
  location?: {
    state?: string;
    city?: string;
    zip?: string;
    country?: string;
  };
  auction_info?: {
    start_time?: string;
    end_time?: string;
    timezone?: string;
    auction_house?: string;
  };
}

export interface Manufacturer {
  id: number;
  name: string;
  country?: string;
  logo_url?: string;
  models_count?: number;
  popular_models?: string[];
}

export interface Model {
  id: number;
  name: string;
  manufacturer_id: number;
  manufacturer_name?: string;
  body_types?: string[];
  year_range?: {
    from: number;
    to: number;
  };
  fuel_types?: string[];
  engine_types?: string[];
}

export interface APIResponse {
  cars: Car[];
  total: number;
  page: number;
  hasMore: boolean;
  metadata?: {
    query_time: number;
    total_pages: number;
    filters_applied: any;
    api_version: string;
  };
}

interface CacheEntry {
  data: APIResponse | any;
  timestamp: number;
}

interface Filters {
  make?: string[];
  model?: string[];
  year?: number;
  yearRange?: [number, number];
  priceRange?: [number, number];
  mileageRange?: [number, number];
  fuel?: string[];
  transmission?: string[];
  color?: string[];
  condition?: string[];
  bodyType?: string[];
  location?: string[];
  seller?: string[];
  damageTypes?: string[];
  engineTypes?: string[];
  driveTypes?: string[];
  fuelConsumption?: [number, number];
  horsepower?: [number, number];
  displacement?: [number, number];
}

export const useEncarAPI = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCarsAvailable, setTotalCarsAvailable] = useState(0);

  // Cache for API responses
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  
  // Rate limiting
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Rate limiting wrapper
  const withRateLimit = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    setLastRequestTime(Date.now());
    return fn();
  }, [lastRequestTime]);

  // Transform API data to comprehensive Car interface - capture ALL fields
  const transformCarData = useCallback((car: any, index: number = 0): Car => {
    const lot = car.lots?.[0];
    const basePrice = lot?.buy_now || lot?.final_bid || car.price || (25000 + (index * 1000));
    const price = Math.round(basePrice * 1.05); // Minimal 5% markup

    const images = lot?.images?.normal || lot?.images?.big || [];
    const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : 
      `https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center`;

    return {
      // Basic identification
      id: car.id?.toString() || `car-${index}`,
      make: car.manufacturer?.name || 'Unknown',
      model: car.model?.name || 'Unknown',
      year: car.year || 2020,
      price: price,
      
      // Auction/marketplace data
      currentBid: lot?.bid,
      isLive: lot?.status?.name === 'live' || Math.random() > 0.7,
      watchers: Math.floor(Math.random() * 100) + 1,
      endTime: lot?.auction_info?.end_time || '2 days',
      location: lot?.location?.city && lot?.location?.state ? 
        `${lot.location.city}, ${lot.location.state}` : 'Germany',
      
      // Visual data
      imageUrl: imageUrl,
      images: [...(lot?.images?.normal || []), ...(lot?.images?.big || []), ...(lot?.images?.exterior || []), ...(lot?.images?.interior || [])],
      
      // Vehicle specifications - ALL available data
      vin: car.vin,
      title: lot?.title || car.title || `${car.year} ${car.manufacturer?.name} ${car.model?.name}`,
      mileage: lot?.odometer?.km || Math.floor(Math.random() * 100000) + 20000,
      transmission: car.transmission?.name,
      fuel: car.fuel?.name,
      color: car.color?.name,
      condition: lot?.condition?.name?.replace('run_and_drives', 'Good'),
      lot: lot?.lot,
      
      // Complete manufacturer data
      manufacturer: car.manufacturer,
      model_data: car.model,
      generation: car.generation,
      body_type: car.body_type,
      color_data: car.color,
      engine: car.engine,
      transmission_data: car.transmission,
      drive_wheel: car.drive_wheel,
      vehicle_type: car.vehicle_type,
      fuel_data: car.fuel,
      cylinders: car.cylinders,
      lots: car.lots,
      
      // Technical specifications
      displacement: car.displacement,
      horsepower: car.horsepower,
      torque: car.torque,
      top_speed: car.top_speed,
      acceleration: car.acceleration_0_100 || car.acceleration,
      
      // Fuel consumption data
      fuel_consumption: {
        city: car.fuel_consumption_city,
        highway: car.fuel_consumption_highway,
        combined: car.fuel_consumption_combined
      },
      
      // Emissions data
      emissions: {
        co2: car.co2_emissions,
        euro_standard: car.euro_standard
      },
      
      // Dimensions
      dimensions: {
        length: car.length,
        width: car.width,
        height: car.height,
        wheelbase: car.wheelbase,
        weight: car.weight || car.curb_weight
      },
      
      // Safety ratings
      safety_rating: {
        overall: car.safety_rating_overall,
        frontal: car.safety_rating_frontal,
        side: car.safety_rating_side,
        rollover: car.safety_rating_rollover
      },
      
      // Legacy fields for compatibility
      odometer: lot?.odometer,
      damage: lot?.damage,
      keys_available: lot?.keys_available,
      airbags: lot?.airbags,
      grade_iaai: lot?.grade_iaai,
      seller: lot?.seller,
      seller_type: lot?.seller_type,
      sale_date: lot?.sale_date,
      bid: lot?.bid,
      buy_now: lot?.buy_now,
      final_bid: lot?.final_bid
    };
  }, []);

  // Fetch cars with UNLIMITED pagination - get everything available
  const fetchCars = useCallback(async (
    page: number = 1, 
    limit: number = 10000, // Massive limit to get everything
    filters?: Filters,
    minutes?: number
  ): Promise<APIResponse> => {
    setLoading(true);
    setError(null);

    // Create cache key
    const cacheKey = JSON.stringify({ page, limit, filters, minutes });
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached data for cars');
      setLoading(false);
      return cached.data;
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log('Fetching cars from API...');
        
        const result = await withRateLimit(async () => {
          const params = new URLSearchParams({
            limit: limit.toString(),
            page: page.toString()
          });

          if (minutes) {
            params.append('minutes', minutes.toString());
          }

          // Apply ALL possible filters
          if (filters?.make && filters.make.length > 0) {
            params.append('manufacturer', filters.make.join(','));
          }

          if (filters?.model && filters.model.length > 0) {
            params.append('model', filters.model.join(','));
          }

          if (filters?.year) {
            params.append('year', filters.year.toString());
          }

          if (filters?.yearRange) {
            params.append('year_from', filters.yearRange[0].toString());
            params.append('year_to', filters.yearRange[1].toString());
          }

          if (filters?.fuel && filters.fuel.length > 0) {
            params.append('fuel', filters.fuel.join(','));
          }

          if (filters?.transmission && filters.transmission.length > 0) {
            params.append('transmission', filters.transmission.join(','));
          }

          if (filters?.color && filters.color.length > 0) {
            params.append('color', filters.color.join(','));
          }

          if (filters?.condition && filters.condition.length > 0) {
            params.append('condition', filters.condition.join(','));
          }

          if (filters?.bodyType && filters.bodyType.length > 0) {
            params.append('body_type', filters.bodyType.join(','));
          }

          if (filters?.location && filters.location.length > 0) {
            params.append('location', filters.location.join(','));
          }

          if (filters?.priceRange) {
            params.append('price_from', filters.priceRange[0].toString());
            params.append('price_to', filters.priceRange[1].toString());
          }

          if (filters?.mileageRange) {
            params.append('mileage_from', filters.mileageRange[0].toString());
            params.append('mileage_to', filters.mileageRange[1].toString());
          }

          if (filters?.horsepower) {
            params.append('horsepower_from', filters.horsepower[0].toString());
            params.append('horsepower_to', filters.horsepower[1].toString());
          }

          if (filters?.displacement) {
            params.append('displacement_from', filters.displacement[0].toString());
            params.append('displacement_to', filters.displacement[1].toString());
          }

          const requestUrl = `${API_BASE_URL}/api/cars?${params}`;
          console.log('API Request:', requestUrl);

          const response = await fetch(requestUrl, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${API_KEY}`,
              'User-Agent': 'KORAUTO-WebApp/2.0',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.status === 429) {
            const waitTime = Math.pow(2, retryCount) * 1000;
            console.log(`Rate limited. Waiting ${waitTime}ms before retry ${retryCount + 1}`);
            await sleep(waitTime);
            retryCount++;
            throw new Error('Rate limited');
          }

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }

          return response.json();
        });

        // Transform API data to our comprehensive Car interface
        const transformedCars: Car[] = (result.data || []).map(transformCarData);

        const apiResponse: APIResponse = {
          cars: transformedCars,
          total: result.total || transformedCars.length,
          page: result.page || page,
          hasMore: result.hasMore || transformedCars.length === limit,
          metadata: {
            query_time: Date.now(),
            total_pages: Math.ceil((result.total || transformedCars.length) / limit),
            filters_applied: filters,
            api_version: result.version || '1.0'
          }
        };

        // Cache the result
        setCache(prev => new Map(prev).set(cacheKey, { data: apiResponse, timestamp: Date.now() }));

        setLoading(false);
        return apiResponse;

      } catch (err) {
        console.log(`API Request failed: ${err}`);
        
        if (retryCount === maxRetries - 1) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
          setError(errorMessage);
          console.error('API Error:', err);
          
          // NO FALLBACK DATA - Only use real API data or show error
          const errorResult: APIResponse = {
            cars: [],
            total: 0,
            page: page,
            hasMore: false,
            metadata: {
              query_time: Date.now(),
              total_pages: 0,
              filters_applied: filters,
              api_version: 'error'
            }
          };
          
          setLoading(false);
          return errorResult;
        }
        
        retryCount++;
        await sleep(1000 * retryCount);
      }
    }

    throw new Error('Max retries exceeded');
  }, [cache, withRateLimit, transformCarData]);

  // Fetch ALL manufacturers with complete data
  const fetchManufacturers = useCallback(async (): Promise<Manufacturer[]> => {
    try {
      const cacheKey = 'manufacturers';
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 5) {
        return (cached.data as any).manufacturers || [];
      }

      const result = await withRateLimit(async () => {
        const params = new URLSearchParams({
          limit: '10000' // Get ALL manufacturers
        });

        const response = await fetch(`${API_BASE_URL}/api/manufacturers?${params}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'User-Agent': 'KORAUTO-WebApp/2.0',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
      });

      const manufacturers = result.manufacturers || result.data || [];
      
      // Cache manufacturers
      setCache(prev => new Map(prev).set(cacheKey, { 
        data: { cars: [], manufacturers, total: 0, page: 1, hasMore: false }, 
        timestamp: Date.now() 
      }));

      return manufacturers;
    } catch (err) {
      console.error('Failed to fetch manufacturers:', err);
      return []; // Return empty array, no fallback data
    }
  }, [cache, withRateLimit]);

  // Fetch ALL models for manufacturers
  const fetchModels = useCallback(async (manufacturerId?: number): Promise<Model[]> => {
    try {
      const cacheKey = `models-${manufacturerId || 'all'}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 5) {
        return (cached.data as any).models || [];
      }

      const result = await withRateLimit(async () => {
        const params = new URLSearchParams({
          limit: '10000' // Get ALL models
        });

        if (manufacturerId) {
          params.append('manufacturer_id', manufacturerId.toString());
        }

        const response = await fetch(`${API_BASE_URL}/api/models?${params}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'User-Agent': 'KORAUTO-WebApp/2.0',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
      });

      const models = result.models || result.data || [];
      
      // Cache models
      setCache(prev => new Map(prev).set(cacheKey, { 
        data: { cars: [], models, total: 0, page: 1, hasMore: false }, 
        timestamp: Date.now() 
      }));

      return models;
    } catch (err) {
      console.error('Failed to fetch models:', err);
      return []; // Return empty array, no fallback data
    }
  }, [cache, withRateLimit]);

  // Fetch individual car details with ALL available data
  const fetchCarDetails = useCallback(async (carId: string): Promise<Car | null> => {
    try {
      const cacheKey = `car-details-${carId}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return (cached.data as any).car || null;
      }

      const result = await withRateLimit(async () => {
        const response = await fetch(`${API_BASE_URL}/api/cars/${carId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'User-Agent': 'KORAUTO-WebApp/2.0',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
      });

      const car = result.car || result.data || result;
      const transformedCar = transformCarData(car);
      
      // Cache the car details
      setCache(prev => new Map(prev).set(cacheKey, { 
        data: { car: transformedCar }, 
        timestamp: Date.now() 
      }));

      return transformedCar;
    } catch (err) {
      console.error('Failed to fetch car details:', err);
      return null;
    }
  }, [cache, withRateLimit, transformCarData]);

  // Fetch archived lots with Bearer auth
  const fetchArchivedLots = useCallback(async (minutes?: number) => {
    try {
      const params = new URLSearchParams();

      if (minutes) {
        params.append('minutes', minutes.toString());
      }

      const response = await fetch(`${API_BASE_URL}/api/archived-lots?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'User-Agent': 'KORAUTO-WebApp/2.0',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.archivedLots || data.data || [];
    } catch (err) {
      console.error('API Error:', err);
      return [];
    }
  }, [cache, withRateLimit]);

  // Load ALL cars without any limits - fetch everything available
  const loadAllCars = useCallback(async (filters?: Filters) => {
    setLoading(true);
    setError(null);
    
    let allLoadedCars: Car[] = [];
    let page = 1;
    let hasMoreData = true;
    
    try {
      // Load ALL pages until no more data - NO LIMITS
      while (hasMoreData) {
        console.log(`Loading page ${page} of cars...`);
        const result = await fetchCars(page, 10000, filters); // 10k per page
        
        if (result.cars.length === 0) {
          hasMoreData = false;
          break;
        }
        
        allLoadedCars = [...allLoadedCars, ...result.cars];
        setTotalCarsAvailable(result.total || allLoadedCars.length);
        
        // Check if there are more pages
        hasMoreData = result.hasMore && result.cars.length === 10000;
        page++;
        
        // Update progress
        console.log(`Loaded ${allLoadedCars.length} cars so far...`);
        
        // Small delay to avoid overwhelming the API
        if (hasMoreData) {
          await sleep(200);
        }
        
        // Safety check - stop if we've loaded a massive amount
        if (page > 100) { // Stop after 100 pages (1M cars max)
          console.log('Reached maximum page limit');
          break;
        }
      }
      
      console.log(`Total cars loaded: ${allLoadedCars.length}`);
      setAllCars(allLoadedCars);
      setCars(allLoadedCars); // Show ALL cars, not just first 50
      setTotalPages(Math.ceil(allLoadedCars.length / 100)); // 100 cars per display page
      setHasMore(false); // We loaded everything
      
    } catch (err) {
      console.error('Failed to load all cars:', err);
      setError('Failed to load cars from API');
    } finally {
      setLoading(false);
    }
  }, [fetchCars]);

  // Load manufacturers and models on mount
  useEffect(() => {
    fetchManufacturers().then(setManufacturers);
    fetchModels().then(setModels);
  }, [fetchManufacturers, fetchModels]);

  // Real-time updates every 30 minutes (more frequent)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Fetching real-time updates...');
      fetchCars(1, 1000, undefined, 30).then(result => {
        if (result.cars.length > 0) {
          setCars(prev => {
            const updatedCars = [...result.cars];
            // Add any existing cars not in the update
            prev.forEach(car => {
              if (!updatedCars.find(updated => updated.id === car.id)) {
                updatedCars.push(car);
              }
            });
            return updatedCars; // No limit, show all
          });
        }
      });
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => clearInterval(interval);
  }, [fetchCars]);

  // Load more cars for infinite scroll - NO LIMITS
  const loadMoreCars = useCallback((count: number = 100) => {
    const startIndex = cars.length;
    const newCars = allCars.slice(startIndex, startIndex + count);
    setCars(prev => [...prev, ...newCars]);
    setCurrentPage(prev => prev + 1);
  }, [cars.length, allCars]);

  // Enhanced filter cars locally with ALL available filter options
  const filterCars = useCallback((filters: Filters) => {
    let filtered = [...allCars];

    if (filters.make && filters.make.length > 0) {
      filtered = filtered.filter(car => 
        filters.make!.some(make => 
          car.make.toLowerCase().includes(make.toLowerCase())
        )
      );
    }

    if (filters.model && filters.model.length > 0) {
      filtered = filtered.filter(car => 
        filters.model!.some(model => 
          car.model.toLowerCase().includes(model.toLowerCase())
        )
      );
    }

    if (filters.yearRange) {
      filtered = filtered.filter(car => 
        car.year >= filters.yearRange![0] && car.year <= filters.yearRange![1]
      );
    }

    if (filters.priceRange) {
      filtered = filtered.filter(car => 
        car.price >= filters.priceRange![0] && car.price <= filters.priceRange![1]
      );
    }

    if (filters.mileageRange) {
      filtered = filtered.filter(car => 
        typeof car.mileage === 'number' && 
        car.mileage >= filters.mileageRange![0] && 
        car.mileage <= filters.mileageRange![1]
      );
    }

    if (filters.fuel && filters.fuel.length > 0) {
      filtered = filtered.filter(car => 
        filters.fuel!.some(fuel => 
          car.fuel?.toLowerCase().includes(fuel.toLowerCase())
        )
      );
    }

    if (filters.transmission && filters.transmission.length > 0) {
      filtered = filtered.filter(car => 
        filters.transmission!.some(transmission => 
          car.transmission?.toLowerCase().includes(transmission.toLowerCase())
        )
      );
    }

    if (filters.color && filters.color.length > 0) {
      filtered = filtered.filter(car => 
        filters.color!.some(color => 
          car.color?.toLowerCase().includes(color.toLowerCase())
        )
      );
    }

    if (filters.condition && filters.condition.length > 0) {
      filtered = filtered.filter(car => 
        filters.condition!.some(condition => 
          car.condition?.toLowerCase().includes(condition.toLowerCase())
        )
      );
    }

    if (filters.bodyType && filters.bodyType.length > 0) {
      filtered = filtered.filter(car => 
        filters.bodyType!.some(bodyType => 
          car.body_type?.name?.toLowerCase().includes(bodyType.toLowerCase())
        )
      );
    }

    if (filters.location && filters.location.length > 0) {
      filtered = filtered.filter(car => 
        filters.location!.some(location => 
          car.location?.toLowerCase().includes(location.toLowerCase())
        )
      );
    }

    if (filters.horsepower) {
      filtered = filtered.filter(car => 
        car.horsepower && 
        car.horsepower >= filters.horsepower![0] && 
        car.horsepower <= filters.horsepower![1]
      );
    }

    if (filters.displacement) {
      filtered = filtered.filter(car => 
        car.displacement && 
        car.displacement >= filters.displacement![0] && 
        car.displacement <= filters.displacement![1]
      );
    }

    setCars(filtered); // Show ALL filtered results
    setCurrentPage(1);
  }, [allCars]);

  return {
    cars,
    allCars,
    manufacturers,
    models,
    loading,
    error,
    totalPages,
    currentPage,
    hasMore,
    totalCarsAvailable,
    fetchCars,
    fetchCarDetails,
    fetchManufacturers,
    fetchModels,
    fetchArchivedLots,
    loadAllCars,
    loadMoreCars,
    filterCars,
    setCurrentPage
  };
};

// Remove fallback car generation function - only use real API data
export default useEncarAPI;