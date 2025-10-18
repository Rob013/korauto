import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuctionsApiCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  [key: string]: any;
}

export interface AuctionsApiResponse {
  data: AuctionsApiCar[];
  scroll_id: string | null;
  next_url: string | null;
  message?: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface Model {
  id: number;
  name: string;
  generations: Generation[];
}

export interface Generation {
  generation_id: number;
  name: string;
  start_year: number;
  end_year: number;
}

export interface UseAuctionsApiSupabaseOptions {
  autoStart?: boolean;
  onError?: (error: string) => void;
  onProgress?: (totalCars: number, currentBatch: number) => void;
}

export interface UseAuctionsApiSupabaseReturn {
  // Cars data
  cars: AuctionsApiCar[];
  isLoading: boolean;
  error: string | null;
  
  // Scroll state
  isScrolling: boolean;
  hasMoreData: boolean;
  totalCarsFetched: number;
  
  // Actions
  startScroll: (scrollTime?: number, limit?: number) => Promise<void>;
  continueScroll: () => Promise<void>;
  endScroll: () => void;
  fetchAllCars: (scrollTime?: number, limit?: number) => Promise<void>;
  reset: () => void;
  
  // Brands and models
  brands: Brand[];
  models: Model[];
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  fetchBrands: () => Promise<void>;
  fetchModels: (brandId: number) => Promise<void>;
}

export const useAuctionsApiSupabase = (options: UseAuctionsApiSupabaseOptions = {}): UseAuctionsApiSupabaseReturn => {
  const { autoStart = false, onError, onProgress } = options;
  
  // State
  const [cars, setCars] = useState<AuctionsApiCar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalCarsFetched, setTotalCarsFetched] = useState(0);
  
  // Brands and models state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Scroll state
  const scrollIdRef = useRef<string | null>(null);

  const handleError = useCallback((err: any) => {
    const errorMessage = err.message || 'An unknown error occurred';
    setError(errorMessage);
    onError?.(errorMessage);
    console.error('Auctions API Error:', err);
  }, [onError]);

  const startScroll = useCallback(async (scrollTime = 10, limit = 1000) => {
    setIsLoading(true);
    setError(null);
    setCars([]);
    setTotalCarsFetched(0);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('auctions-api', {
        body: {
          action: 'start',
          scroll_time: scrollTime,
          limit: limit
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to start scroll session');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to start scroll session');
      }

      const response: AuctionsApiResponse = data.data;
      
      setCars(response.data);
      setTotalCarsFetched(response.data.length);
      setIsScrolling(true);
      setHasMoreData(!!response.scroll_id && response.data.length > 0);
      scrollIdRef.current = response.scroll_id;
      
      onProgress?.(response.data.length, 1);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, onProgress]);

  const continueScroll = useCallback(async () => {
    if (!isScrolling || !scrollIdRef.current) {
      throw new Error('No active scroll session. Start a new scroll first.');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('auctions-api', {
        body: {
          action: 'continue',
          scroll_id: scrollIdRef.current
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to continue scroll session');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to continue scroll session');
      }

      const response: AuctionsApiResponse = data.data;
      
      setCars(prev => [...prev, ...response.data]);
      setTotalCarsFetched(prev => prev + response.data.length);
      setHasMoreData(!!response.scroll_id && response.data.length > 0);
      scrollIdRef.current = response.scroll_id;
      
      onProgress?.(totalCarsFetched + response.data.length, Math.ceil((totalCarsFetched + response.data.length) / 1000));
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isScrolling, totalCarsFetched, handleError, onProgress]);

  const endScroll = useCallback(() => {
    scrollIdRef.current = null;
    setIsScrolling(false);
    setHasMoreData(false);
  }, []);

  const fetchAllCars = useCallback(async (scrollTime = 10, limit = 1000) => {
    setIsLoading(true);
    setError(null);
    setCars([]);
    setTotalCarsFetched(0);
    
    try {
      // Start scroll session
      await startScroll(scrollTime, limit);
      
      // Continue scrolling until no more data
      while (hasMoreData && scrollIdRef.current) {
        await continueScroll();
      }
      
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [startScroll, continueScroll, hasMoreData, handleError]);

  const reset = useCallback(() => {
    endScroll();
    setCars([]);
    setError(null);
    setTotalCarsFetched(0);
    setHasMoreData(true);
  }, [endScroll]);

  const fetchBrands = useCallback(async () => {
    setIsLoadingBrands(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('auctions-api', {
        body: {
          action: 'brands'
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch brands');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch brands');
      }

      setBrands(data.data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoadingBrands(false);
    }
  }, [handleError]);

  const fetchModels = useCallback(async (brandId: number) => {
    setIsLoadingModels(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('auctions-api', {
        body: {
          action: 'models',
          brand_id: brandId
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch models');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch models');
      }

      setModels(data.data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoadingModels(false);
    }
  }, [handleError]);

  // Auto-start if enabled
  React.useEffect(() => {
    if (autoStart && !isScrolling && cars.length === 0) {
      startScroll();
    }
  }, [autoStart, isScrolling, cars.length, startScroll]);

  return {
    // Cars data
    cars,
    isLoading,
    error,
    
    // Scroll state
    isScrolling,
    hasMoreData,
    totalCarsFetched,
    
    // Actions
    startScroll,
    continueScroll,
    endScroll,
    fetchAllCars,
    reset,
    
    // Brands and models
    brands,
    models,
    isLoadingBrands,
    isLoadingModels,
    fetchBrands,
    fetchModels
  };
};

export default useAuctionsApiSupabase;
