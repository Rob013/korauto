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
  status?: number; // 1: active, 2: pending, 3: sold, 4: archived
  sale_status?: string; // "active", "pending", "sold", "archived"
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
  include_sold?: string; // 'true' to include sold cars
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

      // Only fetch active (1) and pending (2) cars by default
      params.append('status[]', '1');
      params.append('status[]', '2');

      // Add all filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'include_sold') {
          params.append(key, value);
        }
      });

      // If explicitly requesting sold cars, include status 3
      if (filters.include_sold === 'true') {
        params.delete('status[]');
        params.append('status[]', '1');
        params.append('status[]', '2'); 
        params.append('status[]', '3');
      }

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

  const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/${manufacturerId}/cars`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error fetching models:', err);
      return [];
    }
  };

  const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generations/${modelId}/cars`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch generations: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error fetching generations:', err);
      return [];
    }
  };

  const fetchCarCounts = async (filters: APIFilters = {}): Promise<{ [key: string]: number }> => {
    try {
      const params = new URLSearchParams({
        per_page: '1',
        simple_paginate: '1'
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/cars?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch car counts: ${response.status}`);
      }

      const data = await response.json();
      return { total: data.meta?.total || 0 };
    } catch (err) {
      console.error('Error fetching car counts:', err);
      return { total: 0 };
    }
  };

  const fetchFilterCounts = async (currentFilters: APIFilters = {}, manufacturersList: Manufacturer[] = []) => {
    const counts = {
      manufacturers: {} as { [key: string]: number },
      models: {} as { [key: string]: number },
      generations: {} as { [key: string]: number },
      colors: {} as { [key: string]: number },
      fuelTypes: {} as { [key: string]: number },
      transmissions: {} as { [key: string]: number },
      years: {} as { [key: string]: number }
    };

    try {
      // Helper function to get count for specific filter combination
      const getCountForFilter = async (additionalFilters: APIFilters) => {
        const combinedFilters = { ...currentFilters, ...additionalFilters };
        
        // Remove undefined values
        const cleanFilters = Object.fromEntries(
          Object.entries(combinedFilters).filter(([_, value]) => value !== undefined && value !== '')
        );
        
        const params = new URLSearchParams({
          per_page: '1',
          simple_paginate: '1'
        });

        Object.entries(cleanFilters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });

        try {
          const response = await fetch(`${API_BASE_URL}/cars?${params}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'KORAUTO-WebApp/1.0',
              'X-API-Key': API_KEY
            }
          });

          if (!response.ok) {
            console.error(`API error for filters ${JSON.stringify(cleanFilters)}: ${response.status}`);
            return 0;
          }

          const data = await response.json();
          const total = data.meta?.total || 0;
          console.log(`Count for filters ${JSON.stringify(cleanFilters)}: ${total}`);
          return total;
        } catch (err) {
          console.error('Error fetching count:', err);
          return 0;
        }
      };

      console.log('Fetching manufacturer counts...');
      // Get counts for manufacturers (excluding current manufacturer/model/generation filters)
      const manufacturerFilters = { ...currentFilters };
      delete manufacturerFilters.manufacturer_id;
      delete manufacturerFilters.model_id;
      delete manufacturerFilters.generation_id;

      // Process manufacturers in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < manufacturersList.length; i += batchSize) {
        const batch = manufacturersList.slice(i, i + batchSize);
        
        const promises = batch.map(async (manufacturer) => {
          const count = await getCountForFilter({ 
            ...manufacturerFilters, 
            manufacturer_id: manufacturer.id.toString() 
          });
          counts.manufacturers[manufacturer.id.toString()] = count;
          return count;
        });

        await Promise.all(promises);
        
        // Rate limiting delay between batches
        if (i + batchSize < manufacturersList.length) {
          await delay(2000);
        }
      }

      console.log('Manufacturer counts:', counts.manufacturers);

      // Get counts for models (if manufacturer is selected)
      if (currentFilters.manufacturer_id) {
        console.log('Fetching model counts for manufacturer:', currentFilters.manufacturer_id);
        
        const modelFilters = { ...currentFilters };
        delete modelFilters.model_id;
        delete modelFilters.generation_id;

        // First fetch models for the manufacturer
        try {
          const response = await fetch(`${API_BASE_URL}/models/${currentFilters.manufacturer_id}/cars`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'KORAUTO-WebApp/1.0',
              'X-API-Key': API_KEY
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const models = data.data || [];
            console.log(`Found ${models.length} models for manufacturer ${currentFilters.manufacturer_id}`);
            
            // Process models in batches
            for (let i = 0; i < models.length; i += batchSize) {
              const batch = models.slice(i, i + batchSize);
              
              const promises = batch.map(async (model: any) => {
                const count = await getCountForFilter({ 
                  ...modelFilters, 
                  model_id: model.id.toString() 
                });
                counts.models[model.id.toString()] = count;
                return count;
              });
              
              await Promise.all(promises);
              
              if (i + batchSize < models.length) {
                await delay(1000);
              }
            }
            
            console.log('Model counts:', counts.models);
          }
        } catch (err) {
          console.error('Error fetching models:', err);
        }
      }

      // Get counts for generations (if model is selected)
      if (currentFilters.model_id) {
        console.log('Fetching generation counts for model:', currentFilters.model_id);
        
        const generationFilters = { ...currentFilters };
        delete generationFilters.generation_id;

        try {
          const response = await fetch(`${API_BASE_URL}/generations/${currentFilters.model_id}/cars`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'KORAUTO-WebApp/1.0',
              'X-API-Key': API_KEY
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const generations = data.data || [];
            console.log(`Found ${generations.length} generations for model ${currentFilters.model_id}`);
            
            // Process generations in batches
            for (let i = 0; i < generations.length; i += batchSize) {
              const batch = generations.slice(i, i + batchSize);
              
              const promises = batch.map(async (generation: any) => {
                const count = await getCountForFilter({ 
                  ...generationFilters, 
                  generation_id: generation.id.toString() 
                });
                counts.generations[generation.id.toString()] = count;
                return count;
              });
              
              await Promise.all(promises);
              
              if (i + batchSize < generations.length) {
                await delay(1000);
              }
            }
            
            console.log('Generation counts:', counts.generations);
          }
        } catch (err) {
          console.error('Error fetching generations:', err);
        }
      }

      return counts;
    } catch (err) {
      console.error('Error fetching filter counts:', err);
      return counts;
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
    fetchModels,
    fetchGenerations,
    fetchCarCounts,
    fetchFilterCounts,
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