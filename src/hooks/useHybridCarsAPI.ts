import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCarsSearch, useCarsFacets } from "@/hooks/useCarsSearch";
import { SearchReq, DEFAULT_SORT, DEFAULT_PAGE_SIZE } from "@/lib/search/types";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price_eur: number;
  mileage_km?: number;
  fuel?: string;
  transmission?: string;
  color?: string;
  images?: any;
  thumbnail?: string;
  created_at?: string;
  lot_number?: string;
  vin?: string;
}

interface HybridFilters {
  make?: string;
  model?: string;
  search?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  fuel?: string;
  transmission?: string;
}

/**
 * Hybrid Cars API Hook - Combines database and external API for optimal performance
 * Features:
 * - Database-first approach for fast loading
 * - External API fallback for comprehensive data
 * - Auto-sync: saves all API responses to database
 * - Smart caching and prefetching
 */
export const useHybridCarsAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'api' | 'hybrid' | 'cache'>('database');

  // Auto-sync function to save API data to database
  const autoSyncToDatabase = useCallback(async (cars: Car[], source: string = 'api') => {
    try {
      console.log(`🔄 Auto-syncing ${cars.length} cars to database from ${source}`);
      
      // Prepare cars for database insertion
      const carsToSync = cars.map(car => ({
        id: car.id,
        api_id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price_eur,
        mileage: car.mileage_km?.toString(),
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        images: car.images || [],
        lot_number: car.lot_number,
        vin: car.vin,
        car_data: {
          thumbnail: car.thumbnail,
          source: source,
          synced_at: new Date().toISOString()
        },
        last_api_sync: new Date().toISOString()
      }));

      // Batch upsert to database
      const { error: syncError } = await supabase
        .from('cars_cache')
        .upsert(carsToSync, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (syncError) {
        console.error('❌ Auto-sync error:', syncError);
      } else {
        console.log(`✅ Successfully auto-synced ${carsToSync.length} cars to database`);
        
        // Invalidate relevant queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['cars-search'] });
        queryClient.invalidateQueries({ queryKey: ['hybrid-cars'] });
      }
    } catch (err) {
      console.error('❌ Auto-sync exception:', err);
    }
  }, [queryClient]);

  // Enhanced search function that tries database first, then API
  const hybridSearch = useCallback(async (filters: HybridFilters, page: number = 1, pageSize: number = DEFAULT_PAGE_SIZE) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Try database first for instant results
      console.log('🗄️ Searching database first...');
      
      const searchRequest: SearchReq = {
        q: filters.search || undefined,
        filters: {
          make: filters.make ? [filters.make] : undefined,
          model: filters.model ? [filters.model] : undefined,
        },
        sort: { field: 'listed_at', dir: 'desc' },
        page,
        pageSize,
        mode: 'full'
      };

      // Try database search
      const dbResponse = await supabase.rpc('cars_search_sorted', { req: searchRequest as any });
      
      if (dbResponse.data && (dbResponse.data as any)?.hits?.length > 0) {
        console.log(`✅ Found ${(dbResponse.data as any).hits.length} cars in database`);
        setDataSource('database');
        return {
          cars: (dbResponse.data as any).hits,
          total: (dbResponse.data as any).total,
          page,
          totalPages: Math.ceil((dbResponse.data as any).total / pageSize),
          source: 'database'
        };
      }

      // Step 2: Fallback to external API if database has insufficient data
      console.log('🌐 Falling back to external API...');
      setDataSource('api');
      
      const apiResponse = await fetch('/api/external-cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, pageSize })
      });

      if (!apiResponse.ok) {
        throw new Error('External API request failed');
      }

      const apiData = await apiResponse.json();
      
      // Step 3: Auto-sync API results to database (background)
      if (apiData.cars?.length > 0) {
        autoSyncToDatabase(apiData.cars, 'external-api');
        
        setDataSource('hybrid');
        return {
          cars: apiData.cars,
          total: apiData.total,
          page,
          totalPages: apiData.totalPages,
          source: 'api'
        };
      }

      // No data found in either source
      return {
        cars: [],
        total: 0,
        page: 1,
        totalPages: 0,
        source: 'none'
      };

    } catch (err) {
      console.error('❌ Hybrid search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      
      // Fallback to any cached database data
      try {
        const fallbackResponse = await supabase
          .from('cars_cache')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(pageSize);
          
        if (fallbackResponse.data?.length > 0) {
          console.log('📋 Using cached database fallback');
          return {
            cars: fallbackResponse.data,
            total: fallbackResponse.data.length,
            page: 1,
            totalPages: 1,
            source: 'cache'
          };
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback error:', fallbackErr);
      }
      
      return { cars: [], total: 0, page: 1, totalPages: 0, source: 'error' };
    } finally {
      setIsLoading(false);
    }
  }, [autoSyncToDatabase]);

  // Get car details with hybrid approach
  const getCarDetails = useCallback(async (carId: string) => {
    if (!carId || carId === 'undefined') {
      throw new Error('Invalid car ID');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try database first
      const { data: dbCar, error: dbError } = await supabase
        .from('cars_cache')
        .select('*')
        .or(`id.eq.${carId},api_id.eq.${carId},lot_number.eq.${carId}`)
        .single();

      if (dbCar && !dbError) {
        console.log(`✅ Found car ${carId} in database`);
        return dbCar;
      }

      // Fallback to external API
      console.log(`🌐 Fetching car ${carId} from external API...`);
      
      const response = await supabase.functions.invoke('secure-cars-api', {
        body: {
          endpoint: 'search-lot',
          lotNumber: carId
        }
      });

      if (response.data && !response.error) {
        // Auto-sync to database
        await autoSyncToDatabase([response.data], 'car-detail-api');
        return response.data;
      }

      throw new Error(`Car ${carId} not found in any source`);
      
    } catch (err) {
      console.error('❌ Get car details error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get car details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [autoSyncToDatabase]);

  // Enhanced facets with hybrid data
  const getHybridFacets = useCallback(async (baseFilters?: HybridFilters) => {
    try {
      const searchRequest: SearchReq = {
        q: baseFilters?.search || undefined,
        filters: {
          make: baseFilters?.make ? [baseFilters.make] : undefined,
        },
        mode: 'facets',
        facets: ['make', 'model', 'fuel', 'transmission'],
        page: 1,
        pageSize: 1
      };

      const { data, error } = await supabase.rpc('cars_search_sorted', { req: searchRequest as any });
      
      if (error) {
        console.error('❌ Facets error:', error);
        return null;
      }

      return (data as any)?.facets || {};
    } catch (err) {
      console.error('❌ Get facets error:', err);
      return null;
    }
  }, []);

  // Background sync scheduler
  const scheduleBackgroundSync = useCallback(async () => {
    try {
      // Check if we need to sync recent external API data
      const recentApiCalls = queryClient.getQueriesData({ queryKey: ['external-api'] });
      
      for (const [, data] of recentApiCalls) {
        if (data && Array.isArray((data as any)?.cars)) {
          await autoSyncToDatabase((data as any).cars, 'background-sync');
        }
      }
    } catch (err) {
      console.error('❌ Background sync error:', err);
    }
  }, [queryClient, autoSyncToDatabase]);

  // Auto-schedule background sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(scheduleBackgroundSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [scheduleBackgroundSync]);

  return {
    // Main search function
    hybridSearch,
    
    // Car details
    getCarDetails,
    
    // Facets for filtering
    getHybridFacets,
    
    // Manual sync function
    syncToDatabase: autoSyncToDatabase,
    
    // State
    isLoading,
    error,
    dataSource,
    
    // Utility functions
    clearError: () => setError(null),
    refreshCache: () => {
      queryClient.invalidateQueries({ queryKey: ['cars-search'] });
      queryClient.invalidateQueries({ queryKey: ['hybrid-cars'] });
    }
  };
};