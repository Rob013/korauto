import { useState, useEffect } from 'react';
import { apiLimiter } from '@/utils/apiLimiter';

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

  const fetchCars = async (page: number = 1, minutes?: number, filters?: {make?: string[], year?: number}): Promise<APIResponse> => {
    if (!apiLimiter.canMakeRequest()) {
      const timeLeft = Math.ceil(apiLimiter.getTimeUntilReset() / 1000 / 60);
      throw new Error(`Request limit reached. Try again in ${timeLeft} minutes.`);
    }

    setLoading(true);
    setError(null);

    try {
      apiLimiter.recordRequest();
      const params = new URLSearchParams({
        api_key: API_KEY,
        limit: '20' // Reduced for demo API
      });

      if (minutes) {
        params.append('minutes', minutes.toString());
      }

      // Test filtering for specific brands
      if (filters?.make && filters.make.length > 0) {
        // Try to filter by manufacturer - this may or may not work with the API
        params.append('manufacturer', filters.make.join(','));
      }

      if (filters?.year) {
        params.append('year_from', filters.year.toString());
      }

      const response = await fetch(`${API_BASE_URL}/cars?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'Authorization': `Bearer ${API_KEY}`,
          'X-API-Key': API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
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

      return {
        cars: transformedCars,
        total: data.total || transformedCars.length,
        page: data.page || page,
        hasMore: data.hasMore || false
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      console.error('API Error:', err);
      
      // Return empty response on error
      return {
        cars: [],
        total: 0,
        page: 1,
        hasMore: false
      };
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedLots = async (minutes?: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        api_key: API_KEY
      });

      if (minutes) {
        params.append('minutes', minutes.toString());
      }

      const response = await fetch(`${API_BASE_URL}/api/archived-lots?${params}`);
      
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

  // Disable automatic initial load to conserve API requests
  // useEffect(() => {
  //   fetchCars().then(result => {
  //     setCars(result.cars);
  //   });
  // }, []);

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