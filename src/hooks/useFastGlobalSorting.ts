/**
 * Fast Global Sorting Hook
 * Main integration point for the new global sorting system
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { LeanCar, SortKey } from '../types/cars';
import { cacheManager, SortedCacheData } from '../services/cacheManager';
import { globalSort, PaginatedResult, paginateSortedResults, sortProfiler } from '../services/globalSort';

// Simplified interfaces without complex dependencies
export interface AggregateProgress {
  loaded: number;
  total: number;
  pages: number;
  estimatedRemaining?: number;
}

export interface AggregateParams {
  filters?: any;
  pageSize?: number;
  sort?: string;
}

export interface AggregateResult {
  items: LeanCar[];
  total: number;
  fetchedPages: number;
  duration: number;
}

// Simple sorting function without worker complexity
const sortWithOptimalMethod = async (
  items: LeanCar[], 
  sortKey: SortKey, 
  onProgress?: (progress: number) => void
) => {
  onProgress?.(0.5);
  const result = globalSort(items, sortKey);
  onProgress?.(1);
  return result;
};

// Simple aggregate fetch without external dependencies
const aggregateFetch = async (
  params: AggregateParams,
  options: {
    signal?: AbortSignal;
    onProgress?: (progress: AggregateProgress) => void;
  } = {}
): Promise<AggregateResult> => {
  // Mock implementation for now to avoid circular dependencies
  return {
    items: [],
    total: 0,
    fetchedPages: 0,
    duration: 0
  };
};

export interface FastGlobalSortingState {
  isLoading: boolean;
  isAggregating: boolean;
  isSorting: boolean;
  sortedItems: LeanCar[];
  currentSort: SortKey;
  total: number;
  error: string | null;
  progress: AggregateProgress | null;
  fetchDuration: number;
  sortDuration: number;
  lastUpdated: number;
}

export interface FastGlobalSortingOptions {
  pageSize?: number;
  cacheEnabled?: boolean;
  workerThreshold?: number;
  onProgress?: (progress: AggregateProgress) => void;
  signal?: AbortSignal;
}

export interface UseFastGlobalSortingReturn {
  state: FastGlobalSortingState;
  onSortChange: (nextSort: SortKey) => Promise<void>;
  getPage: (page: number, pageSize?: number) => PaginatedResult;
  prefetchPage: (page: number, pageSize?: number) => PaginatedResult;
  clearCache: () => Promise<void>;
  isReady: () => boolean;
  getCacheStats: () => any;
}

const initialState: FastGlobalSortingState = {
  isLoading: false,
  isAggregating: false,
  isSorting: false,
  sortedItems: [],
  currentSort: 'price_asc',
  total: 0,
  error: null,
  progress: null,
  fetchDuration: 0,
  sortDuration: 0,
  lastUpdated: 0
};

/**
 * Fast Global Sorting Hook
 * Provides high-performance global sorting with caching and optimization
 */
export function useFastGlobalSorting(
  params: AggregateParams,
  options: FastGlobalSortingOptions = {}
): UseFastGlobalSortingReturn {
  const {
    pageSize = 50,
    cacheEnabled = true,
    workerThreshold = 50000,
    onProgress,
    signal
  } = options;

  const [state, setState] = useState<FastGlobalSortingState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize cache manager
  useEffect(() => {
    if (!isInitializedRef.current && cacheEnabled) {
      cacheManager.init().catch(console.error);
      isInitializedRef.current = true;
    }
  }, [cacheEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Handle sort change with automatic page reset and caching
   */
  const onSortChange = useCallback(async (nextSort: SortKey) => {
    console.log(`🔄 Sort change triggered: ${nextSort}`);
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const currentSignal = signal || abortControllerRef.current.signal;

    setState(prev => ({
      ...prev,
      isLoading: true,
      isAggregating: false,
      isSorting: false,
      currentSort: nextSort,
      error: null,
      progress: null
    }));

    try {
      // Check cache first if enabled
      let cachedData: SortedCacheData | null = null;
      if (cacheEnabled) {
        cachedData = await cacheManager.get(params.filters || {}, nextSort);
      }

      if (cachedData && cachedData.items.length > 0) {
        console.log(`✅ Using cached data for ${nextSort}: ${cachedData.items.length} items`);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          sortedItems: cachedData!.items,
          total: cachedData!.total,
          currentSort: nextSort,
          lastUpdated: Date.now(),
          sortDuration: 0 // Cached, no sort time
        }));
        
        return;
      }

      // Check if filters changed and we need to re-aggregate
      const needsAggregate = !state.sortedItems.length || 
                           JSON.stringify(params.filters) !== JSON.stringify(cachedData?.params?.filters);

      let itemsToSort: LeanCar[] = [];
      let fetchDuration = 0;

      if (needsAggregate) {
        console.log(`🔄 Aggregating data for ${nextSort}`);
        
        setState(prev => ({ ...prev, isAggregating: true }));

        const aggregateResult = await aggregateFetch(params, {
          signal: currentSignal,
          onProgress: (progress) => {
            setState(prev => ({ ...prev, progress }));
            onProgress?.(progress);
          }
        });

        if (currentSignal?.aborted) return;

        itemsToSort = aggregateResult.items;
        fetchDuration = aggregateResult.duration;
        
        setState(prev => ({
          ...prev,
          isAggregating: false,
          isSorting: true,
          total: aggregateResult.total,
          fetchDuration
        }));
      } else {
        // Reuse existing data, just resort
        console.log(`🔄 Resorting existing data: ${state.sortedItems.length} items`);
        itemsToSort = state.sortedItems;
        fetchDuration = state.fetchDuration;
        
        setState(prev => ({ ...prev, isSorting: true }));
      }

      // Sort the data (using worker for large datasets)
      const sortStartTime = Date.now();
      const sortResult = await sortWithOptimalMethod(
        itemsToSort, 
        nextSort,
        (progress) => {
          console.log(`Sort progress: ${(progress * 100).toFixed(1)}%`);
        }
      );

      if (currentSignal?.aborted) return;

      const sortDuration = Date.now() - sortStartTime;
      
      // Record performance metrics
      sortProfiler.record(nextSort, itemsToSort.length, sortDuration);

      // Cache the sorted result if enabled
      if (cacheEnabled && sortResult.items.length > 0) {
        const cacheData: SortedCacheData = {
          items: sortResult.items,
          total: sortResult.total,
          params: { filters: params.filters },
          sortKey: nextSort
        };
        
        await cacheManager.set(params.filters || {}, nextSort, cacheData);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAggregating: false,
        isSorting: false,
        sortedItems: sortResult.items,
        total: sortResult.total,
        currentSort: nextSort,
        fetchDuration,
        sortDuration,
        lastUpdated: Date.now(),
        error: null,
        progress: null
      }));

      console.log(`✅ Sort completed: ${nextSort} (${sortResult.items.length} items) in ${sortDuration}ms`);

    } catch (error) {
      if (currentSignal?.aborted) {
        console.log('Sort operation was aborted');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Sort operation failed';
      console.error('Sort operation failed:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAggregating: false,
        isSorting: false,
        error: errorMessage,
        progress: null
      }));
    }
  }, [params, pageSize, cacheEnabled, onProgress, signal, state.sortedItems, state.fetchDuration]);

  /**
   * Get a specific page from sorted results
   */
  const getPage = useCallback((page: number, customPageSize?: number): PaginatedResult => {
    const effectivePageSize = customPageSize || pageSize;
    
    if (!state.sortedItems.length) {
      return {
        items: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: effectivePageSize,
        hasPrev: false,
        hasNext: false
      };
    }

    return paginateSortedResults(state.sortedItems, page, effectivePageSize);
  }, [state.sortedItems, pageSize]);

  /**
   * Prefetch page data (returns immediately from sorted array)
   */
  const prefetchPage = useCallback((page: number, customPageSize?: number): PaginatedResult => {
    // Since we have all data sorted in memory, prefetching is instant
    return getPage(page, customPageSize);
  }, [getPage]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(async () => {
    if (cacheEnabled) {
      await cacheManager.clear();
      console.log('🗑️ Cache cleared');
    }
  }, [cacheEnabled]);

  /**
   * Check if sorting system is ready for use
   */
  const isReady = useCallback(() => {
    return !state.isLoading && state.sortedItems.length > 0 && !state.error;
  }, [state.isLoading, state.sortedItems.length, state.error]);

  /**
   * Get cache statistics for debugging
   */
  const getCacheStats = useCallback(() => {
    if (!cacheEnabled) return null;
    
    return {
      cache: cacheManager.getStats(),
      sort: sortProfiler.getStats(),
      state: {
        itemCount: state.sortedItems.length,
        lastUpdated: state.lastUpdated,
        currentSort: state.currentSort
      }
    };
  }, [cacheEnabled, state]);

  return {
    state,
    onSortChange,
    getPage,
    prefetchPage,
    clearCache,
    isReady,
    getCacheStats
  };
}

// Utility function to convert backend sort options to our sort keys
export function mapToSortKey(backendSort: string): SortKey {
  switch (backendSort) {
    case 'price_asc':
    case 'price_low':
      return 'price_asc';
    case 'price_desc':
    case 'price_high':
      return 'price_desc';
    case 'year_asc':
    case 'year_old':
      return 'year_asc';
    case 'year_desc':
    case 'year_new':
      return 'year_desc';
    case 'mileage_asc':
    case 'mileage_low':
      return 'mileage_asc';
    case 'mileage_desc':
    case 'mileage_high':
      return 'mileage_desc';
    case 'make_asc':
    case 'make_az':
      return 'make_asc';
    case 'make_desc':
    case 'make_za':
      return 'make_desc';
    case 'model_asc':
      return 'model_asc';
    case 'model_desc':
      return 'model_desc';
    default:
      return 'price_asc';
  }
}