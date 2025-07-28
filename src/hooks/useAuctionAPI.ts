import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://auctionsapi.com/api';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currentBid?: number;
  imageUrl?: string;
  mileage?: number;
  location?: string;
  endTime?: string;
  isLive: boolean;
  watchers?: number;
}

interface APIResponse {
  cars: Car[];
  total: number;
  page: number;
  hasMore: boolean;
}

export const useAuctionAPI = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for API responses
  const [cache, setCache] = useState<Map<string, {data: APIResponse, timestamp: number}>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Rate limiting
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchCars = async (page: number = 1, minutes?: number, filters?: {make?: string[], year?: number}): Promise<APIResponse> => {
    setLoading(true);
    setError(null);

    // Create cache key
    const cacheKey = JSON.stringify({ page, minutes, filters });
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached data for cars');
      setLoading(false);
      return cached.data;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    setLastRequestTime(Date.now());

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log('Fetching cars from API...');
        const params = new URLSearchParams({
          api_key: API_KEY,
          limit: '1000'
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
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Rate limited. Waiting ${waitTime}ms before retry ${retryCount + 1}`);
          await sleep(waitTime);
          retryCount++;
          continue;
        }

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Transform API data to our Car interface
        const transformedCars: Car[] = data.cars?.map((car: any) => ({
          id: car.id || Math.random().toString(36),
          make: car.make || 'Unknown',
          model: car.model || 'Unknown',
          year: car.year || 2020,
          price: car.price || 0,
          currentBid: car.currentBid,
          imageUrl: car.imageUrl || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
          mileage: car.mileage || 0,
          location: car.location || 'Germany',
          endTime: car.endTime || '2 days',
          isLive: car.isLive || Math.random() > 0.5,
          watchers: car.watchers || Math.floor(Math.random() * 50) + 1
        })) || [];

        const result: APIResponse = {
          cars: transformedCars,
          total: data.total || transformedCars.length,
          page: data.page || page,
          hasMore: data.hasMore || false
        };

        // Cache the result
        setCache(prev => new Map(prev).set(cacheKey, { data: result, timestamp: Date.now() }));

        return result;
      } catch (err) {
        console.log(`API Request failed: ${err}`);
        
        if (retryCount === maxRetries - 1) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
          setError(errorMessage);
          console.error('API Error:', err);
          
          // Use fallback data
          console.log('Using fallback car data');
          const fallbackResult: APIResponse = {
            cars: [],
            total: 0,
            page: 1,
            hasMore: false
          };
          
          return fallbackResult;
        }
        
        retryCount++;
        await sleep(1000 * retryCount); // Progressive delay
      }
    }

    // Fallback if all retries failed
    throw new Error('Rate limit exceeded after retries');
  };

  const fetchArchivedLots = async (minutes?: number, perPage: number = 100) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        per_page: perPage.toString()
      });

      if (minutes) {
        params.append('minutes', minutes.toString());
      }

      const response = await fetch(`${API_BASE_URL}/archived-lots?${params}`, {
        headers: {
          'Accept': '*/*',
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch archived lots';
      setError(errorMessage);
      console.error('API Error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        api_key: API_KEY
      });

      const response = await fetch(`${API_BASE_URL}/api/manufacturers?${params}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.manufacturers || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch manufacturers';
      setError(errorMessage);
      console.error('API Error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Initial load effect
  useEffect(() => {
    fetchCars().then(result => {
      setCars(result.cars);
    });
  }, []);

  return {
    cars,
    setCars,
    loading,
    error,
    fetchCars,
    fetchArchivedLots,
    fetchManufacturers
  };
};

export default useAuctionAPI;