import { useState, useCallback, useRef, useMemo } from 'react';

// Cache for year-based filter results to avoid repeat API calls
const yearFilterCache = new Map<string, { data: any[]; timestamp: number; totalCount: number }>();
const YEAR_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface YearFilterOptions {
  from_year?: string;
  to_year?: string;
}

interface UseOptimizedYearFilterProps {
  currentCars: any[];
  totalCount: number;
  onApiCall: (filters: any) => void; // Changed from Promise<void> to void
  filters: any;
}

export const useOptimizedYearFilter = ({
  currentCars,
  totalCount,
  onApiCall,
  filters
}: UseOptimizedYearFilterProps) => {
  const [isLoadingYearFilter, setIsLoadingYearFilter] = useState(false);
  const [yearFilterProgress, setYearFilterProgress] = useState<'instant' | 'loading' | 'complete'>('complete');
  const lastYearFilterRef = useRef<string>('');

  // Apply year filter to existing cars immediately for instant feedback
  const applyInstantYearFilter = useCallback((cars: any[], fromYear?: string, toYear?: string) => {
    if (!fromYear && !toYear) return cars;

    return cars.filter(car => {
      const carYear = car.year;
      if (!carYear) return false;

      if (fromYear && carYear < parseInt(fromYear)) return false;
      if (toYear && carYear > parseInt(toYear)) return false;
      
      return true;
    });
  }, []);

  // Get cached results for year filter
  const getCachedYearResults = useCallback((fromYear?: string, toYear?: string) => {
    const cacheKey = `${fromYear || 'any'}-${toYear || 'any'}`;
    const cached = yearFilterCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < YEAR_CACHE_DURATION) {
      console.log(`📋 Using cached year filter results for ${cacheKey}`);
      return cached;
    }
    
    return null;
  }, []);

  // Cache year filter results
  const cacheYearResults = useCallback((cars: any[], totalCount: number, fromYear?: string, toYear?: string) => {
    const cacheKey = `${fromYear || 'any'}-${toYear || 'any'}`;
    yearFilterCache.set(cacheKey, {
      data: cars,
      timestamp: Date.now(),
      totalCount
    });
    console.log(`💾 Cached ${cars.length} cars for year filter ${cacheKey}`);
  }, []);

  // Optimized year filter handler
  const handleOptimizedYearFilter = useCallback(async (
    fromYear?: string, 
    toYear?: string, 
    otherFilters: any = {}
  ) => {
    const yearFilterKey = `${fromYear || 'any'}-${toYear || 'any'}`;
    
    // Prevent duplicate calls
    if (lastYearFilterRef.current === yearFilterKey && isLoadingYearFilter) {
      console.log(`⏭️ Skipping duplicate year filter call: ${yearFilterKey}`);
      return;
    }
    
    lastYearFilterRef.current = yearFilterKey;
    
    // Step 1: Apply instant filtering to current cars for immediate feedback
    const instantFilteredCars = applyInstantYearFilter(currentCars, fromYear, toYear);
    console.log(`⚡ Applied instant year filter: ${instantFilteredCars.length} cars from ${currentCars.length} current cars`);
    
    setYearFilterProgress('instant');
    
    // If we have cached results for this year range, use them immediately
    const cachedResults = getCachedYearResults(fromYear, toYear);
    if (cachedResults) {
      console.log(`✅ Using cached complete results: ${cachedResults.data.length} cars`);
      setYearFilterProgress('complete');
      return cachedResults;
    }

    // If instant results seem reasonable (not too few compared to total), delay API call
    const instantRatio = instantFilteredCars.length / Math.max(currentCars.length, 1);
    const shouldDelayApiCall = instantFilteredCars.length > 10 && instantRatio > 0.1;
    
    if (shouldDelayApiCall) {
      console.log(`⏳ Delaying API call for better UX - showing ${instantFilteredCars.length} instant results first`);
      
      // Small delay to let user see the instant results before making API call
      setTimeout(() => {
        makeApiCallForCompleteResults(fromYear, toYear, otherFilters);
      }, 300);
    } else {
      // Make API call immediately if instant results are too sparse
      makeApiCallForCompleteResults(fromYear, toYear, otherFilters);
    }

    return { data: instantFilteredCars, totalCount: instantFilteredCars.length };
  }, [currentCars, isLoadingYearFilter, applyInstantYearFilter, getCachedYearResults]);

  // Make API call for complete results in background
  const makeApiCallForCompleteResults = useCallback(async (
    fromYear?: string, 
    toYear?: string, 
    otherFilters: any = {}
  ) => {
    setIsLoadingYearFilter(true);
    setYearFilterProgress('loading');
    
    try {
      const apiFilters = {
        ...otherFilters,
        from_year: fromYear,
        to_year: toYear
      };
      
      console.log(`🔄 Making API call for complete year filter results:`, apiFilters);
      onApiCall(apiFilters);
      
      setYearFilterProgress('complete');
      console.log(`✅ Complete year filter results loaded`);
    } catch (error) {
      console.error('❌ Error loading complete year filter results:', error);
      setYearFilterProgress('complete'); // Still mark as complete to stop loading state
    } finally {
      setIsLoadingYearFilter(false);
    }
  }, [onApiCall]);

  // Clear year filter cache when needed
  const clearYearFilterCache = useCallback(() => {
    yearFilterCache.clear();
    console.log('🧹 Cleared year filter cache');
  }, []);

  // Memoized instant filtered cars for current filters
  const instantFilteredCars = useMemo(() => {
    return applyInstantYearFilter(currentCars, filters.from_year, filters.to_year);
  }, [currentCars, filters.from_year, filters.to_year, applyInstantYearFilter]);

  return {
    handleOptimizedYearFilter,
    isLoadingYearFilter,
    yearFilterProgress,
    clearYearFilterCache,
    instantFilteredCars,
    cacheYearResults
  };
};