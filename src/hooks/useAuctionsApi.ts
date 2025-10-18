import React, { useState, useCallback, useRef } from 'react';
import { AuctionsApiService, AuctionsApiCar, Brand, Model, AuctionsApiResponse } from '@/services/auctionsApiService';

export interface UseAuctionsApiOptions {
  apiKey: string;
  autoStart?: boolean;
  onError?: (error: string) => void;
  onProgress?: (totalCars: number, currentBatch: number) => void;
}

export interface UseAuctionsApiReturn {
  // Cars data
  cars: AuctionsApiCar[];
  isLoading: boolean;
  error: string | null;
  
  // Scroll state
  isScrolling: boolean;
  hasMoreData: boolean;
  totalCarsFetched: number;
  
  // Actions
  startScroll: () => Promise<void>;
  continueScroll: () => Promise<void>;
  endScroll: () => void;
  fetchAllCars: () => Promise<void>;
  reset: () => void;
  
  // Brands and models
  brands: Brand[];
  models: Model[];
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  fetchBrands: () => Promise<void>;
  fetchModels: (brandId: number) => Promise<void>;
}

export const useAuctionsApi = (options: UseAuctionsApiOptions): UseAuctionsApiReturn => {
  const { apiKey, autoStart = false, onError, onProgress } = options;
  
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
  
  // Service instance
  const serviceRef = useRef<AuctionsApiService | null>(null);
  
  // Initialize service
  if (!serviceRef.current) {
    serviceRef.current = new AuctionsApiService({ apiKey });
  }

  const handleError = useCallback((err: any) => {
    const errorMessage = err.message || 'An unknown error occurred';
    setError(errorMessage);
    onError?.(errorMessage);
    console.error('Auctions API Error:', err);
  }, [onError]);

  const startScroll = useCallback(async () => {
    if (!serviceRef.current) return;
    
    setIsLoading(true);
    setError(null);
    setCars([]);
    setTotalCarsFetched(0);
    
    try {
      const response: AuctionsApiResponse = await serviceRef.current.startCarsScroll();
      
      setCars(response.data);
      setTotalCarsFetched(response.data.length);
      setIsScrolling(true);
      setHasMoreData(!!response.scroll_id && response.data.length > 0);
      
      onProgress?.(response.data.length, 1);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, onProgress]);

  const continueScroll = useCallback(async () => {
    if (!serviceRef.current || !isScrolling) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response: AuctionsApiResponse = await serviceRef.current.continueCarsScroll();
      
      setCars(prev => [...prev, ...response.data]);
      setTotalCarsFetched(prev => prev + response.data.length);
      setHasMoreData(!!response.scroll_id && response.data.length > 0);
      
      onProgress?.(totalCarsFetched + response.data.length, Math.ceil((totalCarsFetched + response.data.length) / 1000));
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isScrolling, totalCarsFetched, handleError, onProgress]);

  const endScroll = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.endScroll();
    }
    setIsScrolling(false);
    setHasMoreData(false);
  }, []);

  const fetchAllCars = useCallback(async () => {
    if (!serviceRef.current) return;
    
    setIsLoading(true);
    setError(null);
    setCars([]);
    setTotalCarsFetched(0);
    
    try {
      const allCars = await serviceRef.current.fetchAllCars();
      setCars(allCars);
      setTotalCarsFetched(allCars.length);
      setHasMoreData(false);
      setIsScrolling(false);
      
      onProgress?.(allCars.length, 1);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, onProgress]);

  const reset = useCallback(() => {
    endScroll();
    setCars([]);
    setError(null);
    setTotalCarsFetched(0);
    setHasMoreData(true);
  }, [endScroll]);

  const fetchBrands = useCallback(async () => {
    if (!serviceRef.current) return;
    
    setIsLoadingBrands(true);
    setError(null);
    
    try {
      const brandsData = await serviceRef.current.getBrands();
      setBrands(brandsData);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoadingBrands(false);
    }
  }, [handleError]);

  const fetchModels = useCallback(async (brandId: number) => {
    if (!serviceRef.current) return;
    
    setIsLoadingModels(true);
    setError(null);
    
    try {
      const modelsData = await serviceRef.current.getModels(brandId);
      setModels(modelsData);
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

export default useAuctionsApi;
