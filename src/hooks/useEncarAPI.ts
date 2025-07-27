import { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE_URL = 'https://auctionsapi.com/api';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

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
  odometer?: {
    km: number;
    mi: number;
    status: { name: string };
  };
  engine?: { name: string };
  cylinders?: number;
  drive_wheel?: { name: string };
  body_type?: { name: string };
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

export interface Manufacturer {
  id: number;
  name: string;
}

export interface APIResponse {
  cars: Car[];
  total: number;
  page: number;
  hasMore: boolean;
}

interface CacheEntry {
  data: APIResponse | any;
  timestamp: number;
}

interface Filters {
  make?: string[];
  model?: string;
  year?: number;
  yearRange?: [number, number];
  priceRange?: [number, number];
  mileageRange?: [number, number];
  fuel?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  bodyType?: string;
}

export const useEncarAPI = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  // Transform API data to our Car interface
  const transformCarData = useCallback((car: any, index: number = 0): Car => {
    const lot = car.lots?.[0];
    const basePrice = lot?.buy_now || lot?.final_bid || car.price || (25000 + (index * 1000));
    const price = Math.round(basePrice * 1.1); // Add 10% markup

    const images = lot?.images?.normal || [];
    const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : 
      `https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center`;

    return {
      id: car.id?.toString() || `car-${index}`,
      make: car.manufacturer?.name || 'Unknown',
      model: car.model?.name || 'Unknown',
      year: car.year || 2020,
      price: price,
      currentBid: lot?.bid,
      imageUrl: imageUrl,
      images: images,
      mileage: lot?.odometer?.km || Math.floor(Math.random() * 100000) + 20000,
      location: 'Germany',
      endTime: lot?.sale_date || '2 days',
      isLive: Math.random() > 0.5,
      watchers: Math.floor(Math.random() * 50) + 1,
      vin: car.vin,
      transmission: car.transmission?.name,
      fuel: car.fuel?.name,
      color: car.color?.name,
      condition: lot?.condition?.name?.replace('run_and_drives', 'Good'),
      lot: lot?.lot,
      title: car.title,
      odometer: lot?.odometer,
      engine: car.engine,
      cylinders: car.cylinders,
      drive_wheel: car.drive_wheel,
      body_type: car.body_type,
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

  // Fetch cars with pagination and filters
  const fetchCars = useCallback(async (
    page: number = 1, 
    limit: number = 1000, 
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
            api_key: API_KEY,
            limit: limit.toString(),
            page: page.toString()
          });

          if (minutes) {
            params.append('minutes', minutes.toString());
          }

          if (filters?.make && filters.make.length > 0) {
            params.append('manufacturer', filters.make.join(','));
          }

          if (filters?.year) {
            params.append('year_from', filters.year.toString());
          }

          if (filters?.yearRange) {
            params.append('year_from', filters.yearRange[0].toString());
            params.append('year_to', filters.yearRange[1].toString());
          }

          const requestUrl = `${API_BASE_URL}/cars?${params}`;
          console.log('API Request:', requestUrl);

          const response = await fetch(requestUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'KORAUTO-WebApp/1.0',
              'X-API-Key': API_KEY
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

        // Transform API data to our Car interface
        const transformedCars: Car[] = (result.data || []).map(transformCarData);

        const apiResponse: APIResponse = {
          cars: transformedCars,
          total: result.total || transformedCars.length,
          page: result.page || page,
          hasMore: result.hasMore || transformedCars.length === limit
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
          
          // Generate fallback data for demo
          const fallbackCars: Car[] = generateFallbackCars(limit, page);
          
          const fallbackResult: APIResponse = {
            cars: fallbackCars,
            total: 2500, // Simulate large dataset
            page: page,
            hasMore: page * limit < 2500
          };
          
          setLoading(false);
          return fallbackResult;
        }
        
        retryCount++;
        await sleep(1000 * retryCount);
      }
    }

    throw new Error('Max retries exceeded');
  }, [cache, withRateLimit, transformCarData]);

  // Fetch manufacturers
  const fetchManufacturers = useCallback(async (): Promise<Manufacturer[]> => {
    try {
      const cacheKey = 'manufacturers';
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 5) { // 10 min cache for manufacturers
        return (cached.data as any).manufacturers || [];
      }

      const result = await withRateLimit(async () => {
        const params = new URLSearchParams({
          api_key: API_KEY
        });

        const response = await fetch(`${API_BASE_URL}/manufacturers?${params}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KORAUTO-WebApp/1.0',
            'X-API-Key': API_KEY
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
      });

      const manufacturers = result.manufacturers || [];
      
      // Cache manufacturers
      setCache(prev => new Map(prev).set(cacheKey, { 
        data: { cars: [], manufacturers, total: 0, page: 1, hasMore: false }, 
        timestamp: Date.now() 
      }));

      return manufacturers;
    } catch (err) {
      console.error('Failed to fetch manufacturers:', err);
      
      // Return fallback manufacturers
      return [
        { id: 1, name: 'Audi' },
        { id: 2, name: 'BMW' },
        { id: 3, name: 'Mercedes-Benz' },
        { id: 4, name: 'Volkswagen' },
        { id: 5, name: 'Porsche' },
        { id: 6, name: 'Tesla' },
        { id: 7, name: 'Ford' },
        { id: 8, name: 'Chevrolet' },
        { id: 9, name: 'Jaguar' },
        { id: 10, name: 'Land Rover' },
        { id: 11, name: 'Lexus' },
        { id: 12, name: 'Infiniti' },
        { id: 13, name: 'Bentley' },
        { id: 14, name: 'Hyundai' },
        { id: 15, name: 'Kia' }
      ];
    }
  }, [cache, withRateLimit]);

  // Fetch archived lots
  const fetchArchivedLots = useCallback(async (minutes?: number) => {
    try {
      const params = new URLSearchParams({
        api_key: API_KEY
      });

      if (minutes) {
        params.append('minutes', minutes.toString());
      }

      const response = await fetch(`${API_BASE_URL}/archived-lots?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.archivedLots || [];
    } catch (err) {
      console.error('API Error:', err);
      return [];
    }
  }, []);

  // Load all cars with infinite scroll simulation
  const loadAllCars = useCallback(async (filters?: Filters) => {
    setLoading(true);
    setError(null);
    
    let allLoadedCars: Car[] = [];
    let page = 1;
    let hasMoreData = true;
    
    try {
      // Load up to 10 pages (10,000 cars max) for performance
      while (hasMoreData && page <= 10) {
        const result = await fetchCars(page, 1000, filters);
        allLoadedCars = [...allLoadedCars, ...result.cars];
        hasMoreData = result.hasMore && result.cars.length > 0;
        page++;
        
        // Small delay to avoid overwhelming the API
        if (hasMoreData) {
          await sleep(100);
        }
      }
      
      setAllCars(allLoadedCars);
      setCars(allLoadedCars.slice(0, 50)); // Show first 50 initially
      setTotalPages(Math.ceil(allLoadedCars.length / 50));
      setHasMore(allLoadedCars.length >= 10000); // Assume more if we hit the limit
      
    } catch (err) {
      console.error('Failed to load all cars:', err);
      setError('Failed to load cars');
    } finally {
      setLoading(false);
    }
  }, [fetchCars]);

  // Load manufacturers on mount
  useEffect(() => {
    fetchManufacturers().then(setManufacturers);
  }, [fetchManufacturers]);

  // Real-time updates every 60 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Fetching real-time updates...');
      fetchCars(1, 50, undefined, 60).then(result => {
        if (result.cars.length > 0) {
          setCars(prev => {
            const updatedCars = [...result.cars];
            // Add any existing cars not in the update
            prev.forEach(car => {
              if (!updatedCars.find(updated => updated.id === car.id)) {
                updatedCars.push(car);
              }
            });
            return updatedCars.slice(0, 1000); // Limit to 1000 cars in memory
          });
        }
      });
    }, 60 * 60 * 1000); // Every 60 minutes

    return () => clearInterval(interval);
  }, [fetchCars]);

  // Load more cars for infinite scroll
  const loadMoreCars = useCallback((count: number = 50) => {
    const startIndex = cars.length;
    const newCars = allCars.slice(startIndex, startIndex + count);
    setCars(prev => [...prev, ...newCars]);
    setCurrentPage(prev => prev + 1);
  }, [cars.length, allCars]);

  // Filter cars locally for better performance
  const filterCars = useCallback((filters: Filters) => {
    let filtered = [...allCars];

    if (filters.make && filters.make.length > 0) {
      filtered = filtered.filter(car => 
        filters.make!.some(make => 
          car.make.toLowerCase().includes(make.toLowerCase())
        )
      );
    }

    if (filters.model) {
      filtered = filtered.filter(car => 
        car.model.toLowerCase().includes(filters.model!.toLowerCase())
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

    if (filters.fuel) {
      filtered = filtered.filter(car => 
        car.fuel?.toLowerCase().includes(filters.fuel!.toLowerCase())
      );
    }

    if (filters.transmission) {
      filtered = filtered.filter(car => 
        car.transmission?.toLowerCase().includes(filters.transmission!.toLowerCase())
      );
    }

    if (filters.condition) {
      filtered = filtered.filter(car => 
        car.condition?.toLowerCase().includes(filters.condition!.toLowerCase())
      );
    }

    setCars(filtered.slice(0, 50)); // Show first 50 filtered results
    setCurrentPage(1);
  }, [allCars]);

  return {
    cars,
    allCars,
    manufacturers,
    loading,
    error,
    totalPages,
    currentPage,
    hasMore,
    fetchCars,
    fetchManufacturers,
    fetchArchivedLots,
    loadAllCars,
    loadMoreCars,
    filterCars,
    setCurrentPage
  };
};

// Generate fallback cars for demo purposes
function generateFallbackCars(limit: number, page: number): Car[] {
  const makes = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Tesla', 'Ford', 'Chevrolet', 'Jaguar', 'Land Rover'];
  const models = ['Series 3', 'C-Class', 'A4', 'Golf', 'Cayenne', 'Model S', 'Mustang', 'Camaro', 'F-Type', 'Range Rover'];
  const fuels = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
  const transmissions = ['Automatic', 'Manual'];
  const colors = ['Silver', 'Black', 'White', 'Blue', 'Red', 'Gray'];
  
  const cars: Car[] = [];
  const startIndex = (page - 1) * limit;
  
  for (let i = 0; i < limit; i++) {
    const index = startIndex + i;
    const make = makes[index % makes.length];
    const model = models[index % models.length];
    
    cars.push({
      id: `fallback-${index}`,
      make,
      model,
      year: 2015 + (index % 9),
      price: 25000 + (index * 1000) + Math.floor(Math.random() * 20000),
      imageUrl: `https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      mileage: 20000 + (index * 1000) + Math.floor(Math.random() * 50000),
      location: 'Germany',
      isLive: Math.random() > 0.5,
      watchers: Math.floor(Math.random() * 50) + 1,
      transmission: transmissions[index % transmissions.length],
      fuel: fuels[index % fuels.length],
      color: colors[index % colors.length],
      condition: 'Good',
      vin: `VIN${index.toString().padStart(8, '0')}`
    });
  }
  
  return cars;
}

export default useEncarAPI;