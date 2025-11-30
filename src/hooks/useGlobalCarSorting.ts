/**
 * Global Car Sorting Hook
 * @deprecated - This hook is deprecated as sorting is now handled globally on the backend
 * using keyset pagination. Use fetchCarsWithKeyset from @/services/carsApi instead.
 * 
 * This file is kept for backwards compatibility but all client-side sorting 
 * has been moved to the backend for better performance and consistency.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { APIFilters } from '@/utils/catalog-filter';
import { SortOption } from '@/hooks/useSortedCars';
import { GlobalSortingService, GlobalSortingState } from '@/services/globalSortingService';
import {
  CarWithRank,
  getCarsForPage,
  ChronologicalRankingResult,
  validateChronologicalRanking
} from '@/utils/chronologicalRanking';

interface UseGlobalCarSortingOptions {
  fetchAllCars: (filters: APIFilters) => Promise<any[]>;
  currentCars: any[];
  filters: APIFilters;
  totalCount: number;
  carsPerPage?: number;
  enableCaching?: boolean;
  validationEnabled?: boolean;
}

interface UseGlobalCarSortingReturn {
  // State
  globalSortingState: GlobalSortingState;

  // Actions
  initializeGlobalSorting: (sortBy: SortOption) => Promise<void>;
  getCarsForCurrentPage: (pageNumber: number) => CarWithRank[];
  clearGlobalSorting: () => void;
  refreshGlobalSorting: (sortBy: SortOption) => Promise<void>;

  // Utilities
  shouldUseGlobalSorting: () => boolean;
  isGlobalSortingReady: () => boolean;
  getPageInfo: (pageNumber: number) => {
    hasPage: boolean;
    totalPages: number;
    carsOnPage: number;
  };
}

/**
 * @deprecated - This hook is deprecated. Use fetchCarsWithKeyset from @/services/carsApi instead.
 * Backend sorting with keyset pagination provides better performance and consistency.
 */
export const useGlobalCarSorting = ({
  fetchAllCars,
  currentCars,
  filters,
  totalCount,
  carsPerPage = 50,
  enableCaching = true,
  validationEnabled = false
}: UseGlobalCarSortingOptions): UseGlobalCarSortingReturn => {

  console.warn('⚠️ useGlobalCarSorting is deprecated. Use fetchCarsWithKeyset from @/services/carsApi instead.');

  // Service instance
  const sortingService = useRef(new GlobalSortingService());

  // State
  const [globalSortingState, setGlobalSortingState] = useState<GlobalSortingState>({
    isGlobalSorting: false,
    allCars: [],
    rankedCars: [],
    totalCars: 0,
    totalPages: 0,
    currentSortBy: 'recently_added',
    isLoading: false,
    error: null,
    lastFetchKey: ''
  });

  // Refs to prevent duplicate operations
  const fetchingRef = useRef(false);
  const lastProcessedKey = useRef('');

  /**
   * Determines if global sorting should be used
   */
  const shouldUseGlobalSorting = useCallback((): boolean => {
    return sortingService.current.shouldUseGlobalSorting(totalCount);
  }, [totalCount]);

  /**
   * Checks if global sorting is ready to use
   */
  const isGlobalSortingReady = useCallback((): boolean => {
    return globalSortingState.isGlobalSorting &&
      globalSortingState.rankedCars.length > 0 &&
      !globalSortingState.isLoading;
  }, [globalSortingState]);

  /**
   * Initializes global sorting for the given sort option
   */
  const initializeGlobalSorting = useCallback(async (sortBy: SortOption): Promise<void> => {
    if (fetchingRef.current) {
      console.log('⏳ Global sorting already in progress, skipping');
      return;
    }

    // Create process key
    const processKey = `${JSON.stringify(filters)}_${sortBy}_${totalCount}`;

    if (processKey === lastProcessedKey.current && isGlobalSortingReady()) {
      console.log('✅ Global sorting already completed for current parameters');
      return;
    }

    // Check cache first if enabled
    if (enableCaching) {
      const cachedResult = sortingService.current.getCachedResult(filters, sortBy);
      if (cachedResult && cachedResult.totalCars === totalCount) {
        console.log(`📋 Using cached global sorting for ${sortBy} (${cachedResult.totalCars} cars)`);
        setGlobalSortingState(prev => ({
          ...prev,
          isGlobalSorting: true,
          allCars: cachedResult.rankedCars,
          rankedCars: cachedResult.rankedCars,
          totalCars: cachedResult.totalCars,
          totalPages: cachedResult.totalPages,
          currentSortBy: sortBy,
          isLoading: false,
          error: null,
          lastFetchKey: processKey
        }));
        lastProcessedKey.current = processKey;
        return;
      }
    }

    if (!shouldUseGlobalSorting()) {
      console.log('📝 Using current cars for small dataset');
      // For small datasets, use current cars
      try {
        const result = await sortingService.current.sortAllCars(currentCars, filters, sortBy, carsPerPage);

        setGlobalSortingState(prev => ({
          ...prev,
          isGlobalSorting: true,
          allCars: result.rankedCars,
          rankedCars: result.rankedCars,
          totalCars: result.totalCars,
          totalPages: result.totalPages,
          currentSortBy: sortBy,
          isLoading: false,
          error: null,
          lastFetchKey: processKey
        }));

        lastProcessedKey.current = processKey;
      } catch (error) {
        console.error('❌ Error in small dataset global sorting:', error);
        setGlobalSortingState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Global sorting failed'
        }));
      }
      return;
    }

    fetchingRef.current = true;

    setGlobalSortingState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      currentSortBy: sortBy
    }));

    try {
      console.log(`🔄 Fetching all ${totalCount} cars for global sorting with ${sortBy}`);

      // Fetch all cars
      const allCars = await fetchAllCars(filters);

      // Apply global sorting with chronological ranking
      const result = await sortingService.current.sortAllCars(allCars, filters, sortBy, carsPerPage);

      // Validate results if enabled
      if (validationEnabled) {
        const isValid = validateChronologicalRanking(result.rankedCars, sortBy);
        if (!isValid) {
          console.warn('⚠️ Chronological ranking validation failed');
        }
      }

      setGlobalSortingState(prev => ({
        ...prev,
        isGlobalSorting: true,
        allCars: result.rankedCars,
        rankedCars: result.rankedCars,
        totalCars: result.totalCars,
        totalPages: result.totalPages,
        currentSortBy: sortBy,
        isLoading: false,
        error: null,
        lastFetchKey: processKey
      }));

      lastProcessedKey.current = processKey;

      console.log(`✅ Global sorting initialized: ${result.totalCars} cars across ${result.totalPages} pages`);

    } catch (error) {
      console.error('❌ Error in global sorting initialization:', error);

      setGlobalSortingState(prev => ({
        ...prev,
        isGlobalSorting: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize global sorting',
        allCars: [],
        rankedCars: []
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, [filters, totalCount, shouldUseGlobalSorting, fetchAllCars, currentCars, carsPerPage, enableCaching, validationEnabled]);

  /**
   * Gets cars for a specific page from the globally sorted results
   */
  const getCarsForCurrentPage = useCallback((pageNumber: number): CarWithRank[] => {
    if (!isGlobalSortingReady()) {
      return [];
    }

    const carsForPage = getCarsForPage(globalSortingState.rankedCars, pageNumber, carsPerPage);

    console.log(`📄 Retrieved ${carsForPage.length} cars for page ${pageNumber} (global sorting)`);

    return carsForPage;
  }, [globalSortingState.rankedCars, carsPerPage, isGlobalSortingReady]);

  /**
   * Clears global sorting state
   */
  const clearGlobalSorting = useCallback(() => {
    console.log('🗑️ Clearing global sorting state');

    setGlobalSortingState({
      isGlobalSorting: false,
      allCars: [],
      rankedCars: [],
      totalCars: 0,
      totalPages: 0,
      currentSortBy: 'recently_added',
      isLoading: false,
      error: null,
      lastFetchKey: ''
    });

    lastProcessedKey.current = '';
    fetchingRef.current = false;

    if (enableCaching) {
      sortingService.current.clearCache();
    }
  }, [enableCaching]);

  /**
   * Refreshes global sorting with the same or new sort option
   */
  const refreshGlobalSorting = useCallback(async (sortBy: SortOption): Promise<void> => {
    console.log('🔄 Refreshing global sorting');

    // Clear current state
    lastProcessedKey.current = '';

    // Reinitialize
    await initializeGlobalSorting(sortBy);
  }, [initializeGlobalSorting]);

  /**
   * Gets page information
   */
  const getPageInfo = useCallback((pageNumber: number) => {
    const totalPages = globalSortingState.totalPages;
    const hasPage = pageNumber <= totalPages && pageNumber > 0;
    const startIndex = (pageNumber - 1) * carsPerPage;
    const endIndex = Math.min(startIndex + carsPerPage, globalSortingState.totalCars);
    const carsOnPage = hasPage ? endIndex - startIndex : 0;

    return {
      hasPage,
      totalPages,
      carsOnPage
    };
  }, [globalSortingState.totalPages, globalSortingState.totalCars, carsPerPage]);

  // Auto-clear when filters change significantly
  useEffect(() => {
    const currentFiltersKey = JSON.stringify(filters);
    const shouldClear = lastProcessedKey.current &&
      !lastProcessedKey.current.includes(currentFiltersKey);

    if (shouldClear) {
      console.log('🔄 Filters changed significantly, clearing global sorting');
      clearGlobalSorting();
    }
  }, [filters, clearGlobalSorting]);

  return {
    globalSortingState,
    initializeGlobalSorting,
    getCarsForCurrentPage,
    clearGlobalSorting,
    refreshGlobalSorting,
    shouldUseGlobalSorting,
    isGlobalSortingReady,
    getPageInfo
  };
};