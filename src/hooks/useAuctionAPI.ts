import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://auctionsapi.com/api';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

interface Car {
  id: string;
  manufacturer: { id: number; name: string };
  model: { id: number; name: string };
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
  lots?: {
    buy_now?: number;
    lot?: string;
    odometer?: {
      km?: number;
      mi?: number;
    };
    images?: {
      normal?: string[];
      big?: string[];
    };
  }[];
}

interface Manufacturer {
  id: number;
  name: string;
}

interface APIFilters {
  manufacturer_id?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  search?: string;
}

interface APIResponse {
  data: Car[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
}

export const useAuctionAPI = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchCars = async (page: number = 1, filters: APIFilters = {}, resetList: boolean = true): Promise<void> => {
    if (resetList) {
      setLoading(true);
      setCurrentPage(1);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '12',
        simple_paginate: '0'
      });

      // Add all filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      console.log('API Request:', `${API_BASE_URL}/cars?${params}`);

      const response = await fetch(`${API_BASE_URL}/cars?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });

      if (response.status === 429) {
        console.log('Rate limited, waiting before retry...');
        await delay(2000);
        return fetchCars(page, filters, resetList);
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data: APIResponse = await response.json();
      
      setTotalCount(data.meta?.total || 0);
      setHasMorePages(page < (data.meta?.last_page || 1));
      
      if (resetList || page === 1) {
        setCars(data.data || []);
        setCurrentPage(1);
      } else {
        setCars(prev => [...prev, ...(data.data || [])]);
        setCurrentPage(page);
      }

    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturers = async (): Promise<Manufacturer[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/manufacturers/cars`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch manufacturers: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error fetching manufacturers:', err);
      return [];
    }
  };

  const loadMore = async (filters: APIFilters = {}) => {
    if (!hasMorePages || loading) return;
    await fetchCars(currentPage + 1, filters, false);
  };

  return {
    cars,
    loading,
    error,
    currentPage,
    totalCount,
    hasMorePages,
    fetchCars,
    fetchManufacturers,
    loadMore
  };
};

// Color options mapping
export const COLOR_OPTIONS = {
  silver: 1,
  purple: 2,
  orange: 3,
  green: 4,
  red: 5,
  gold: 6,
  charcoal: 7,
  brown: 8,
  grey: 9,
  turquoise: 10,
  blue: 11,
  bronze: 12,
  white: 13,
  cream: 14,
  black: 15,
  yellow: 16,
  beige: 17,
  pink: 18,
  two_colors: 100
};

// Fuel type options mapping
export const FUEL_TYPE_OPTIONS = {
  diesel: 1,
  electric: 2,
  hybrid: 3,
  gasoline: 4,
  gas: 5,
  flexible: 6,
  hydrogen: 7
};

// Transmission options mapping
export const TRANSMISSION_OPTIONS = {
  automatic: 1,
  manual: 2
};

export default useAuctionAPI;