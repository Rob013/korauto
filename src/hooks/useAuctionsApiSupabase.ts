import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAuctionsApiOptions {
  autoStart?: boolean;
}

export const useAuctionsApiSupabase = (options: UseAuctionsApiOptions = {}) => {
  const [cars, setCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollId, setScrollId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchBatch = useCallback(async (currentScrollId: string | null = null) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`📡 Fetching Auctions API batch ${currentScrollId ? 'with scroll' : 'initial'}`);

      const { data, error: functionError } = await supabase.functions.invoke('auctions-api-proxy', {
        body: {
          scrollId: currentScrollId,
          limit: 1000,
          scrollTime: 10
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data) {
        throw new Error('No data received from API');
      }

      console.log(`✅ Received ${data.cars?.length || 0} cars from Auctions API`);

      return {
        cars: data.cars || [],
        scrollId: data.scrollId,
        hasMore: data.hasMore
      };

    } catch (err: any) {
      console.error('❌ Error fetching from Auctions API:', err);
      setError(err.message || 'Failed to fetch cars');
      return { cars: [], scrollId: null, hasMore: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startScroll = useCallback(async (maxBatches: number = 5, maxCars: number = 5000) => {
    console.log(`🚀 Starting Auctions API scroll (max ${maxBatches} batches, ${maxCars} cars)`);
    
    let allCars: any[] = [];
    let currentScrollId: string | null = null;
    let batchCount = 0;

    try {
      while (batchCount < maxBatches && allCars.length < maxCars) {
        const result = await fetchBatch(currentScrollId);
        
        if (result.cars.length === 0) {
          console.log('📭 No more cars available');
          break;
        }

        allCars = [...allCars, ...result.cars];
        currentScrollId = result.scrollId;
        batchCount++;

        console.log(`📊 Batch ${batchCount}: ${result.cars.length} cars (total: ${allCars.length})`);

        if (!result.hasMore) {
          console.log('✅ Reached end of data');
          break;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`✅ Scroll complete: ${allCars.length} total cars from ${batchCount} batches`);
      
      setCars(allCars);
      setScrollId(currentScrollId);
      setHasMore(batchCount >= maxBatches || allCars.length >= maxCars);

    } catch (err: any) {
      console.error('❌ Error during scroll:', err);
      setError(err.message || 'Failed to complete scroll');
    }
  }, [fetchBatch]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    const result = await fetchBatch(scrollId);
    
    if (result.cars.length > 0) {
      setCars(prev => [...prev, ...result.cars]);
      setScrollId(result.scrollId);
      setHasMore(result.hasMore);
    } else {
      setHasMore(false);
    }
  }, [scrollId, hasMore, isLoading, fetchBatch]);

  return {
    cars,
    isLoading,
    error,
    hasMore,
    startScroll,
    loadMore
  };
};
