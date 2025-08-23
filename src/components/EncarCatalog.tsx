
// @ts-nocheck

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  ArrowLeft,
  ArrowUpDown,
  Car,
  Filter,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  Lock,
  Unlock,
} from "lucide-react";
import LazyCarCard from "@/components/LazyCarCard";
import { useSecureAuctionAPI, createFallbackManufacturers } from "@/hooks/useSecureAuctionAPI";
import EncarStyleFilter from "@/components/EncarStyleFilter";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useResourcePreloader } from "@/hooks/useResourcePreloader";
import { debounce } from "@/utils/performance";
import { useOptimizedYearFilter } from "@/hooks/useOptimizedYearFilter";
import { useDailyRotatingCars } from "@/hooks/useDailyRotatingCars";
import {
  APIFilters,
  extractGradesFromTitle,
  applyGradeFilter,
  matchesGradeFilter,
  normalizeFilters,
  filtersToURLParams,
  isYearRangeChange,
  addPaginationToFilters,
  debounce as catalogDebounce
} from "@/utils/catalog-filter";

import { useSearchParams } from "react-router-dom";
import {
  useSortedCars,
  getSortOptions,
  SortOption,
} from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { fallbackCars, fallbackManufacturers } from "@/data/fallbackData";
import { filterOutTestCars } from "@/utils/testCarFilter";

interface EncarCatalogProps {
  highlightCarId?: string | null;
}

const EncarCatalog = ({ highlightCarId }: EncarCatalogProps = {}) => {
  const { toast } = useToast();
  const {
    cars,
    setCars, // ✅ Import setCars
    loading,
    error,
    totalCount,
    setTotalCount, // ✅ Import setTotalCount for optimized filtering
    hasMorePages,
    fetchCars,
    fetchAllCars, // ✅ Import new function for global sorting
    filters,
    setFilters,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchAllGenerationsForManufacturer, // ✅ Import new function
    fetchFilterCounts,
    fetchGrades,
    fetchTrimLevels,
    loadMore,
  } = useSecureAuctionAPI();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [sortBy, setSortBy] = useState<SortOption>("recently_added");
  const [hasUserSelectedSort, setHasUserSelectedSort] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allCarsForSorting, setAllCarsForSorting] = useState<any[]>([]);
  const [isSortingGlobal, setIsSortingGlobal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const isMobile = useIsMobile();
  
  // Initialize showFilters - always open on desktop, toggleable on mobile
  const [showFilters, setShowFilters] = useState(() => {
    if (isMobile) {
      // On mobile, try to restore the previous filter panel state
      const savedFilterState = sessionStorage.getItem('mobile-filter-panel-state');
      if (savedFilterState !== null) {
        return JSON.parse(savedFilterState);
      }
      // Default to closed on mobile
      return false;
    }
    // Always open on desktop (unclosable)
    return true;
  });
  
  // Track if user has explicitly closed the filter panel to prevent auto-reopening
  const [hasExplicitlyClosed, setHasExplicitlyClosed] = useState(() => {
    if (isMobile) {
      const savedFilterState = sessionStorage.getItem('mobile-filter-panel-state');
      // If state is explicitly false, user has closed it
      return savedFilterState === 'false';
    }
    return false;
  });

  // Catalog lock state - prevents accidental swipe gestures on mobile
  const [catalogLocked, setCatalogLocked] = useState(() => {
    if (isMobile) {
      const savedLockState = localStorage.getItem('catalog-lock-state');
      return savedLockState === 'true';
    }
    return false;
  });
  
  const [hasSelectedCategories, setHasSelectedCategories] = useState(false);
  
  // Use ref for tracking fetch progress to avoid triggering re-renders
  const fetchingSortRef = useRef(false);
  const lastSortParamsRef = useRef('');

  // Memoized helper function to extract grades from title - now using utility
  const extractGradesFromTitleCallback = useCallback(extractGradesFromTitle, []);

  // Helper function to check if filters are in default "all brands" state
  const isDefaultState = useMemo(() => {
    // Default state means no meaningful filters are applied OR manufacturer is explicitly set to "all"
    return (!filters.manufacturer_id || filters.manufacturer_id === 'all') && 
           !filters.model_id && 
           !filters.generation_id &&
           !filters.color &&
           !filters.fuel_type &&
           !filters.transmission &&
           !filters.body_type &&
           !filters.odometer_from_km &&
           !filters.odometer_to_km &&
           !filters.from_year &&
           !filters.to_year &&
           !filters.buy_now_price_from &&
           !filters.buy_now_price_to &&
           !filters.search &&
           !filters.seats_count &&
           !filters.max_accidents &&
           (!filters.grade_iaai || filters.grade_iaai === 'all');
  }, [filters]);

  // Memoized client-side grade filtering for better performance - now using utility with fallback data
  const filteredCars = useMemo(() => {
    // Use fallback data when there's an error and no cars loaded
    const sourceCars = (error && cars.length === 0) ? fallbackCars : cars;
    const cleanedCars = filterOutTestCars(sourceCars);
    return applyGradeFilter(cleanedCars, filters.grade_iaai);
  }, [cars, filters.grade_iaai, error]);
  
  // console.log(`📊 Filter Results: ${filteredCars.length} cars match (total loaded: ${cars.length}, total count from API: ${totalCount}, grade filter: ${filters.grade_iaai || 'none'})`);

  // Memoized cars for sorting to prevent unnecessary re-computations
  const carsForSorting = useMemo(() => {
    return filteredCars.map((car) => ({
      ...car,
      status: String(car.status || ""),
      lot_number: String(car.lot_number || ""),
      cylinders: Number(car.cylinders || 0),
    }));
  }, [filteredCars]);
  
  // Apply daily rotating cars when in default state, same as homepage
  const dailyRotatingCars = useDailyRotatingCars(carsForSorting, !isDefaultState, 50);
  
  // Memoized cars to sort (global vs current page)
  const carsToSort = useMemo(() => {
    // Only use daily rotating cars when in default state AND user hasn't explicitly selected a sort option
    if (isDefaultState && !hasUserSelectedSort && !isSortingGlobal) {
      console.log(`🎲 Using daily rotating cars: ${dailyRotatingCars.length} cars (default state, no explicit sort)`);
      return dailyRotatingCars;
    }
    
    const result = isSortingGlobal && allCarsForSorting.length > 0 ? allCarsForSorting : carsForSorting;
    // Log for debugging: show which dataset is being used for sorting
    if (totalCount > 50) {
      console.log(`🎯 Sorting ${result.length} cars (global: ${isSortingGlobal && allCarsForSorting.length > 0}, total available: ${totalCount})`);
    }
    return result;
  }, [isSortingGlobal, allCarsForSorting, carsForSorting, totalCount, isDefaultState, hasUserSelectedSort, dailyRotatingCars]);
  
  const sortedCars = useSortedCars(carsToSort, sortBy);
  
  // Memoized current page cars from sorted results
  const carsForCurrentPage = useMemo(() => {
    // When using daily rotating cars (default state with no explicit sort), don't apply additional pagination
    if (isDefaultState && !hasUserSelectedSort && !isSortingGlobal) {
      return sortedCars; // Daily rotating cars already limited to 50
    }
    
    // Always apply pagination when not using daily rotating cars, regardless of global sorting mode
    return sortedCars.slice((currentPage - 1) * 50, currentPage * 50);
  }, [sortedCars, currentPage, isDefaultState, hasUserSelectedSort, isSortingGlobal]);

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [manufacturers, setManufacturers] = useState<
    {
      id: number;
      name: string;
      car_count?: number;
      cars_qty?: number;
      image?: string;
    }[]
  >(createFallbackManufacturers()); // Initialize with fallback data immediately

  const [models, setModels] = useState<
    {
      id: number;
      name: string;
      car_count?: number;
      cars_qty?: number;
    }[]
  >([]);

  const [generations, setGenerations] = useState<
    {
      id: number;
      name: string;
      manufacturer_id?: number;
      model_id?: number;
      from_year?: number;
      to_year?: number;
      cars_qty?: number;
    }[]
  >([]);
  const [filterCounts, setFilterCounts] = useState<any>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [highlightedCarId, setHighlightedCarId] = useState<string | null>(null);
  const [loadedPages, setLoadedPages] = useState(1);
  const [isRestoringState, setIsRestoringState] = useState(false);

  // Ref for the main container to handle scroll restoration
  const containerRef = useRef<HTMLDivElement>(null);
  const SCROLL_STORAGE_KEY = "encar-catalog-scroll";

  // Refs for swipe gesture detection
  const mainContentRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // SIMPLIFIED: More efficient scroll position saving
  const saveScrollPosition = useCallback(() => {
    if (containerRef.current) {
      const scrollData = {
        scrollTop: window.scrollY,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(scrollData));
    }
  }, []);

  // SIMPLIFIED: Basic scroll restoration without complex timing checks
  const restoreScrollPosition = useCallback(() => {
    const savedData = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedData) {
      try {
        const { scrollTop, timestamp } = JSON.parse(savedData);
        
        // Only restore recent scroll positions (within 10 minutes)
        const isRecent = Date.now() - timestamp < 600000;
        
        if (isRecent && scrollTop > 0) {
          window.scrollTo({ top: scrollTop, behavior: 'auto' });
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      } catch (error) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }, []);

  // Swipe gesture handlers
  const handleSwipeRightToShowFilters = useCallback(() => {
    if (!showFilters && isMobile && !catalogLocked) {
      setShowFilters(true);
      setHasExplicitlyClosed(false); // Reset explicit close flag when opening via swipe
    }
  }, [showFilters, isMobile, catalogLocked]);

  const handleSwipeLeftToCloseFilters = useCallback(() => {
    if (showFilters && isMobile && !catalogLocked) {
      setShowFilters(false);
      setHasExplicitlyClosed(true); // Mark as explicitly closed
    }
  }, [showFilters, isMobile, catalogLocked]);

  // Handle catalog lock toggle
  const handleCatalogLockToggle = useCallback(() => {
    const newLockState = !catalogLocked;
    setCatalogLocked(newLockState);
    localStorage.setItem('catalog-lock-state', newLockState.toString());
  }, [catalogLocked]);

  // Set up swipe gestures for main content (swipe right to show filters)
  useSwipeGesture(mainContentRef, {
    onSwipeRight: handleSwipeRightToShowFilters,
    minSwipeDistance: 80, // Require a more deliberate swipe
    maxVerticalDistance: 120
  });

  // Set up swipe gestures for filter panel (swipe left to close filters)
  useSwipeGesture(filterPanelRef, {
    onSwipeLeft: handleSwipeLeftToCloseFilters,
    minSwipeDistance: 80,
    maxVerticalDistance: 120
  });

  // Internal function to actually apply filters - now using utilities
  const applyFiltersInternal = useCallback((newFilters: APIFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    
    // Reset global sorting when filters change
    setIsSortingGlobal(false);
    setAllCarsForSorting([]);
    
    // Use 50 cars per page for proper pagination
    const filtersWithPagination = addPaginationToFilters(newFilters, 50);
    
    fetchCars(1, filtersWithPagination, true);

    // Update URL with all non-empty filter values - now using utility
    const searchParams = filtersToURLParams(newFilters);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  }, [fetchCars, setSearchParams]);

  // Optimized year filtering hook for better performance
  const {
    handleOptimizedYearFilter,
    isLoadingYearFilter,
    yearFilterProgress,
    clearYearFilterCache,
    instantFilteredCars,
    cacheYearResults
  } = useOptimizedYearFilter({
    currentCars: cars,
    totalCount,
    onApiCall: applyFiltersInternal,
    filters
  });

  // Debounced version for performance - Reduced debounce time for year filters - using catalog utility
  const debouncedApplyFilters = useCallback(
    catalogDebounce(applyFiltersInternal, 150), // Reduced from 300ms for faster response
    [applyFiltersInternal]
  );

  const handleFiltersChange = useCallback(async (newFilters: APIFilters) => {
    // Set filter loading state immediately for better UX
    setIsFilterLoading(true);
    
    // Update UI immediately for responsiveness
    setFilters(newFilters);
    
    // Check if this is a year range change - use optimized filtering for better UX - using utility
    const isYearChange = isYearRangeChange(newFilters, filters);
    
    if (isYearChange) {
      console.log('🚀 Using optimized year filtering for instant response');
      
      // Use optimized year filtering for instant feedback
      const result = await handleOptimizedYearFilter(
        newFilters.from_year, 
        newFilters.to_year, 
        newFilters
      );
      
      // If we got instant results, temporarily show them
      if (result && result.data.length > 0) {
        setCars(result.data);
        setTotalCount(result.totalCount);
      }
    } else {
      // Clear previous data immediately to show loading state for non-year filters
      setCars([]);
      
      // Apply other filters with debouncing to reduce API calls
      debouncedApplyFilters(newFilters);
    }
  }, [debouncedApplyFilters, handleOptimizedYearFilter, filters, setCars, setFilters, setTotalCount]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm("");
    setLoadedPages(1);
    setModels([]);
    setGenerations([]);
    setHasUserSelectedSort(false); // Reset to allow daily rotating cars again
    fetchCars(1, {}, true);
    setSearchParams({});
  }, [fetchCars, setSearchParams]);

  const handleSearch = useCallback(() => {
    const newFilters = {
      ...filters,
      search: searchTerm.trim() || undefined,
    };
    handleFiltersChange(newFilters);
  }, [filters, searchTerm, handleFiltersChange]);

  const handlePageChange = useCallback((page: number) => {
    // When global sorting is active, ensure we don't go beyond available pages
    if (isSortingGlobal && allCarsForSorting.length > 0) {
      const maxPages = Math.ceil(allCarsForSorting.length / 50);
      if (page > maxPages) {
        console.log(`⚠️ Attempted to navigate to page ${page}, but only ${maxPages} pages available with ${allCarsForSorting.length} cars`);
        return;
      }
    }
    
    setCurrentPage(page);
    
    // If global sorting is active, don't fetch new cars - just update the page for slicing
    if (isSortingGlobal && allCarsForSorting.length > 0) {
      // Update URL with new page
      const currentParams = Object.fromEntries(searchParams.entries());
      currentParams.page = page.toString();
      setSearchParams(currentParams);
      console.log(`📄 Global sorting: Navigated to page ${page} (showing cars ${(page-1)*50 + 1}-${Math.min(page*50, allCarsForSorting.length)} of ${allCarsForSorting.length})`);
      return;
    }
    
    // Fetch cars for the specific page (only when not using global sorting)
    const filtersWithPagination = addPaginationToFilters(filters, 50);
    
    fetchCars(page, filtersWithPagination, true); // Reset list for new page
    
    // Update URL with new page
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = page.toString();
    setSearchParams(currentParams);
  }, [filters, fetchCars, setSearchParams, isSortingGlobal, allCarsForSorting.length]);

  const loadMoreCars = useCallback(() => {
    // Implement proper "load more" functionality
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    // If global sorting is active, don't fetch new cars - just update the page for slicing
    if (isSortingGlobal && allCarsForSorting.length > 0) {
      // Update URL with new page
      const currentParams = Object.fromEntries(searchParams.entries());
      currentParams.page = nextPage.toString();
      setSearchParams(currentParams);
      console.log(`📄 Global sorting: Loading more cars for page ${nextPage}`);
      return;
    }
    
    // Fetch cars for the next page and append them to the existing list
    const filtersWithPagination = addPaginationToFilters(filters, 50);
    
    fetchCars(nextPage, filtersWithPagination, false); // Don't reset list, append instead
    
    // Update URL with new page
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = nextPage.toString();
    setSearchParams(currentParams);
  }, [currentPage, isSortingGlobal, allCarsForSorting.length, searchParams, setSearchParams, filters, fetchCars]);

  const handleLoadMore = useCallback(() => {
    // Legacy function for backward compatibility
    loadMoreCars();
  }, [loadMoreCars]);

  // Function to fetch all cars for sorting across all pages
  const fetchAllCarsForSorting = useCallback(async () => {
    // Create a unique key for current sort parameters to prevent duplicate calls
    const sortKey = `${totalCount}-${sortBy}-${filters.grade_iaai || ''}-${filters.manufacturer_id || ''}-${filters.model_id || ''}-${filters.generation_id || ''}-${filters.from_year || ''}-${filters.to_year || ''}`;
    
    if (fetchingSortRef.current) {
      console.log(`⏳ Already fetching sort data, skipping duplicate request`);
      return;
    }

    // Only skip if the exact same sort request was completed successfully
    if (sortKey === lastSortParamsRef.current && isSortingGlobal && allCarsForSorting.length > 0) {
      console.log(`✅ Using cached sort data for: ${sortKey}`);
      return;
    }

    if (totalCount <= 50) {
      // For small datasets, use current filtered cars instead of fetching
      console.log(`📝 Small dataset (${totalCount} cars), using filtered cars for sorting`);
      setAllCarsForSorting(filteredCars);
      setIsSortingGlobal(true);
      lastSortParamsRef.current = sortKey;
      return;
    }
    
    fetchingSortRef.current = true;
    setIsSortingGlobal(true);
    setIsLoading(true);
    
    try {
      console.log(`🔄 Global sorting: Fetching all ${totalCount} cars for sorting across ${totalPages} pages`);
      
      // Use the new fetchAllCars function to get all cars with current filters
      const allCars = await fetchAllCars(filters);
      
      // Apply the same client-side filtering as the current filtered cars - using utility
      const filteredAllCars = allCars.filter((car: any) => {
        return matchesGradeFilter(car, filters.grade_iaai);
      });
      
      setAllCarsForSorting(filteredAllCars);
      lastSortParamsRef.current = sortKey;
      
      // Check if current page is beyond available pages and reset to page 1 if needed
      const maxPages = Math.ceil(filteredAllCars.length / 50);
      if (currentPage > maxPages && maxPages > 0) {
        console.log(`📄 Resetting page from ${currentPage} to 1 (max available: ${maxPages})`);
        setCurrentPage(1);
        // Update URL to reflect page reset
        const currentParams = Object.fromEntries(searchParams.entries());
        currentParams.page = '1';
        setSearchParams(currentParams);
      }
      
      console.log(`✅ Global sorting: Loaded ${filteredAllCars.length} cars for sorting across ${maxPages} pages`);
    } catch (err) {
      console.error('❌ Error fetching all cars for global sorting:', err);
      setIsSortingGlobal(false);
      setAllCarsForSorting([]);
    } finally {
      setIsLoading(false);
      fetchingSortRef.current = false;
    }
  }, [totalCount, fetchAllCars, filters.grade_iaai, filters.manufacturer_id, filters.model_id, filters.generation_id, filters.from_year, filters.to_year, sortBy, filteredCars, totalPages, currentPage, setSearchParams]);

  const handleManufacturerChange = async (manufacturerId: string) => {
    console.log(`[handleManufacturerChange] Called with manufacturerId: ${manufacturerId}`);
    
    // Prevent rapid consecutive calls by showing loading immediately
    setIsLoading(true);
    setIsFilterLoading(true);
    setModels([]);
    setGenerations([]);
    
    // Create new filters immediately for faster UI response
    const newFilters: APIFilters = {
      manufacturer_id: manufacturerId,
      model_id: undefined,
      generation_id: undefined,
      grade_iaai: undefined,
      color: filters.color,
      fuel_type: filters.fuel_type,
      transmission: filters.transmission,
      odometer_from_km: filters.odometer_from_km,
      odometer_to_km: filters.odometer_to_km,
      from_year: filters.from_year,
      to_year: filters.to_year,
      buy_now_price_from: filters.buy_now_price_from,
      buy_now_price_to: filters.buy_now_price_to,
      seats_count: filters.seats_count,
      search: filters.search,
    };
    setFilters(newFilters);
    setLoadedPages(1);
    
    try {
      // Only fetch essential data - models and cars. Skip grades/trim levels to prevent excessive calls
      const promises = [];
      
      if (manufacturerId) {
        console.log(`[handleManufacturerChange] Fetching models...`);
        promises.push(
          fetchModels(manufacturerId).then(modelData => {
            console.log(`[handleManufacturerChange] Received modelData:`, modelData);
            console.log(`[handleManufacturerChange] Setting models to:`, modelData);
            setModels(modelData);
            return modelData;
          })
        );
      }
      
      // Fetch cars with new filters
      promises.push(
        fetchCars(1, { ...newFilters, per_page: "50" }, true)
      );
      
      await Promise.all(promises);
      
      // Update URL after successful data fetch
      const paramsToSet: any = {};
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          paramsToSet[key] = value.toString();
        }
      });
      setSearchParams(paramsToSet);
      
    } catch (error) {
      console.error('[handleManufacturerChange] Error:', error);
      setModels([]);
      setGenerations([]);
    } finally {
      setIsLoading(false);
      setIsFilterLoading(false);
    }
  };

  // Add useEffect to log models change
  useEffect(() => {
    console.log(`[EncarCatalog] Models state updated:`, models);
  }, [models]);

  const handleModelChange = async (modelId: string) => {
    setIsLoading(true);
    setIsFilterLoading(true);
    setGenerations([]);
    
    // Create new filters immediately for faster UI response
    const newFilters: APIFilters = {
      ...filters,
      model_id: modelId,
      generation_id: undefined,
      grade_iaai: undefined,
    };
    setFilters(newFilters);
    setLoadedPages(1);
    
    try {
      if (!modelId) {
        // Fetch cars with cleared model filter
        await fetchCars(1, { ...newFilters, per_page: "50" }, true);
        setIsLoading(false);
        setIsFilterLoading(false);
        return;
      }
      
      // Fetch generations and cars in parallel for better performance
      // Removed duplicate car fetches to optimize performance
      const promises = [
        fetchGenerations(modelId).then(generationData => {
          setGenerations(generationData);
          return generationData;
        }),
        fetchCars(1, { ...newFilters, per_page: "50" }, true)
      ];
      
      await Promise.all(promises);
      
      // Update URL after successful data fetch
      const paramsToSet: any = {};
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          paramsToSet[key] = value.toString();
        }
      });
      setSearchParams(paramsToSet);
      
    } catch (error) {
      console.error('[handleModelChange] Error:', error);
      setGenerations([]);
    } finally {
      setIsLoading(false);
      setIsFilterLoading(false);
    }
  };

  // Initialize filters from URL params on component mount - OPTIMIZED
  useEffect(() => {
    const loadInitialData = async () => {
      setIsRestoringState(true);

      // Check if we're coming from homepage filter
      const fromHomepage = searchParams.get('fromHomepage');
      const isFromHomepage = fromHomepage === 'true';

      // Get filters and pagination state from URL parameters
      const urlFilters: APIFilters = {};
      let urlLoadedPages = 1;
      let urlCurrentPage = 1;

      for (const [key, value] of searchParams.entries()) {
        if (key === "loadedPages") {
          urlLoadedPages = parseInt(value) || 1;
        } else if (key === "page") {
          urlCurrentPage = parseInt(value) || 1;
        } else if (value && key !== "loadedPages" && key !== "fromHomepage" && key !== "page") {
          let decodedValue = value;
          try {
            decodedValue = decodeURIComponent(value);
            if (decodedValue.includes('%')) {
              decodedValue = decodeURIComponent(decodedValue);
            }
          } catch (e) {
            decodedValue = value;
          }
          urlFilters[key as keyof APIFilters] = decodedValue;
        }
      }

      // Set search term from URL
      if (urlFilters.search) {
        setSearchTerm(urlFilters.search);
      }

      // Set filters and pagination immediately for faster UI response
      setFilters(urlFilters);
      setLoadedPages(urlLoadedPages);
      setCurrentPage(urlCurrentPage);

      try {
        // PERFORMANCE OPTIMIZATION: Load only essential data first
        // Load manufacturers immediately (they're cached)
        const manufacturersData = await fetchManufacturers();
        setManufacturers(manufacturersData);

        // Load dependent data only if filters exist, in sequence to avoid race conditions
        if (urlFilters.manufacturer_id) {
          const modelsData = await fetchModels(urlFilters.manufacturer_id);
          setModels(modelsData);
          
          if (urlFilters.model_id) {
            const generationsData = await fetchGenerations(urlFilters.model_id);
            setGenerations(generationsData);
          }
        }

        // Load cars last - this is the most expensive operation
        const initialFilters = {
          ...urlFilters,
          per_page: "50"
        };
        
        await fetchCars(urlCurrentPage, initialFilters, true);

      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsRestoringState(false);
      }

      // SIMPLIFIED SCROLL RESTORATION for better performance
      if (isFromHomepage) {
        // Always scroll to top when coming from homepage filters
        window.scrollTo({ top: 0, behavior: 'auto' });
        
        // Remove the fromHomepage flag from URL without causing re-render
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('fromHomepage');
        window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams.toString()}`);
      } else {
        // Quick scroll restoration without complex timing checks
        setTimeout(() => {
          const savedData = sessionStorage.getItem(SCROLL_STORAGE_KEY);
          if (savedData) {
            try {
              const { scrollTop } = JSON.parse(savedData);
              if (scrollTop > 0) {
                window.scrollTo({ top: scrollTop, behavior: 'auto' });
              }
            } catch (error) {
              // Ignore scroll restoration errors
            }
          }
        }, 100); // Small delay to ensure DOM is ready
      }
    };

    loadInitialData();
  }, []); // Only run on mount

  // OPTIMIZED: Simplified scroll position saving with less frequent updates
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // PERFORMANCE: Less frequent scroll position saving
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 500); // Increased debounce time for better performance
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []); // Remove dependencies to prevent unnecessary re-binding

  // OPTIMIZED: Load filter counts with reduced API calls and better debouncing
  useEffect(() => {
    const loadFilterCounts = async () => {
      if (manufacturers.length > 0) {
        setLoadingCounts(true);
        try {
          const counts = await fetchFilterCounts(filters, manufacturers);
          setFilterCounts(counts);
        } catch (error) {
          console.error('Error loading filter counts:', error);
        } finally {
          setLoadingCounts(false);
        }
      }
    };

    // PERFORMANCE: Longer debounce and only load when necessary
    const timeoutId = setTimeout(loadFilterCounts, 500);
    return () => clearTimeout(timeoutId);
  }, [filters, manufacturers.length]); // Only depend on manufacturers.length, not the full array

  // OPTIMIZED: Load initial counts only once when manufacturers are first loaded
  useEffect(() => {
    const loadInitialCounts = async () => {
      if (manufacturers.length > 0 && !filterCounts) { // Only load if not already loaded
        setLoadingCounts(true);
        try {
          const counts = await fetchFilterCounts({}, manufacturers);
          setFilterCounts(counts);
        } catch (error) {
          console.error('Error loading initial filter counts:', error);
        } finally {
          setLoadingCounts(false);
        }
      }
    };

    loadInitialCounts();
  }, [manufacturers.length]); // Only run when manufacturers are first loaded

  // Calculate total pages when totalCount or filteredCars changes
  useEffect(() => {
    let effectiveTotal = totalCount;
    let effectivePages = Math.ceil(totalCount / 50);
    
    // When global sorting is active, use the actual number of cars available for sorting
    if (isSortingGlobal && allCarsForSorting.length > 0) {
      effectiveTotal = allCarsForSorting.length;
      effectivePages = Math.ceil(allCarsForSorting.length / 50);
      console.log(`📊 Global sorting pagination: ${allCarsForSorting.length} cars across ${effectivePages} pages`);
    } else if (filters.grade_iaai && filters.grade_iaai !== 'all' && filteredCars.length > 0) {
      effectiveTotal = filteredCars.length;
      effectivePages = Math.ceil(filteredCars.length / 50);
      console.log(`📊 Grade filter pagination: ${filteredCars.length} cars across ${effectivePages} pages`);
    }
    
    setTotalPages(effectivePages);
  }, [totalCount, filteredCars, filters.grade_iaai, isSortingGlobal, allCarsForSorting.length]);

  // Fetch all cars for sorting when sortBy changes OR when totalCount first becomes available
  // This ensures global sorting works on initial load and when sort options change
  useEffect(() => {
    if (totalCount > 50) {
      // Always trigger global sorting for large datasets, regardless of current state
      if (!fetchingSortRef.current) {
        console.log(`🔄 Triggering global sorting: totalCount=${totalCount}, sortBy=${sortBy}`);
        fetchAllCarsForSorting();
      } else {
        console.log(`⏳ Global sorting already in progress for totalCount=${totalCount}, sortBy=${sortBy}`);
      }
    } else if (totalCount > 0 && totalCount <= 50) {
      // For small datasets, use current filtered cars and enable global sorting immediately
      console.log(`📝 Small dataset (${totalCount} cars), using current filtered cars for sorting`);
      setAllCarsForSorting(filteredCars);
      setIsSortingGlobal(true);
    }
  }, [sortBy, totalCount, fetchAllCarsForSorting, filteredCars]);

  // Show cars without requiring brand and model selection
  const shouldShowCars = true;

  // Track when categories are selected 
  useEffect(() => {
    const hasCategories = filters.manufacturer_id && filters.model_id;
    setHasSelectedCategories(!!hasCategories);
  }, [filters.manufacturer_id, filters.model_id]);

  // Effect to highlight and scroll to specific car by lot number
  useEffect(() => {
    if (highlightCarId && cars.length > 0) {
      setTimeout(() => {
        // Find the car by lot number or ID and scroll to it
        const targetCar = cars.find(
          (car) =>
            car.lot_number === highlightCarId || car.id === highlightCarId
        );

        if (targetCar) {
          const lotNumber =
            targetCar.lot_number || targetCar.lots?.[0]?.lot || "";
          setHighlightedCarId(lotNumber || targetCar.id);

          // Scroll to the car
          const carElement = document.getElementById(`car-${targetCar.id}`);
          if (carElement) {
            carElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }

          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedCarId(null);
          }, 3000);
        }
      }, 1000);
    }
  }, [highlightCarId, cars]);

  // Clear filter loading state when main loading completes
  useEffect(() => {
    if (!loading) {
      // Add a small delay to ensure smooth UX transition
      const timer = setTimeout(() => {
        setIsFilterLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Save filter panel state to sessionStorage on mobile when it changes
  useEffect(() => {
    if (isMobile) {
      sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(showFilters));
      // Also save explicit close state to maintain consistency
      sessionStorage.setItem('mobile-filter-explicit-close', JSON.stringify(hasExplicitlyClosed));
    }
  }, [showFilters, hasExplicitlyClosed, isMobile]);

  // Clear filter panel state when actually navigating away from catalog
  useEffect(() => {
    const clearStateOnNavigation = () => {
      // Only clear if we're navigating to a different page (not opening new tabs)
      if (!window.location.pathname.includes('/catalog')) {
        sessionStorage.removeItem('mobile-filter-panel-state');
        sessionStorage.removeItem('mobile-filter-explicit-close');
      }
    };

    const clearStateOnUnload = () => {
      // Don't clear on beforeunload as it might interfere with new tab opening
      // The state will be useful for back navigation
    };

    window.addEventListener('beforeunload', clearStateOnUnload);
    
    return () => {
      window.removeEventListener('beforeunload', clearStateOnUnload);
      // Clear state when navigating away from catalog page
      clearStateOnNavigation();
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Collapsible Filter Sidebar - Optimized for mobile */}
      <div 
        ref={filterPanelRef}
        className={`
        fixed lg:relative z-40 glass-card transition-transform duration-300 ease-in-out
        ${showFilters ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'top-0 left-0 right-0 bottom-0 w-full h-dvh overflow-y-auto safe-area-inset rounded-none' : 'w-80 sm:w-80 lg:w-72 h-full flex-shrink-0 overflow-y-auto rounded-lg'} 
        lg:shadow-none
      `}>
        <div className={`${isMobile ? 'mobile-filter-compact filter-header bg-primary text-primary-foreground' : 'p-3 sm:p-4 border-b flex-shrink-0'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className={`h-4 w-4 sm:h-5 sm:w-5 ${isMobile ? 'text-primary-foreground' : 'text-primary'}`} />
              <h3 className={`font-semibold ${isMobile ? 'text-sm text-primary-foreground' : 'text-sm sm:text-base'}`}>
                {isMobile ? 'Filtrat e Kërkimit' : 'Filters'}
              </h3>
              {hasSelectedCategories && isMobile && (
                <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0">
                  {Object.values(filters).filter(Boolean).length} aktiv
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFilters}
                className={`lg:hidden flex items-center gap-1 ${isMobile ? 'h-6 px-1.5 hover:bg-primary-foreground/20 text-primary-foreground text-xs' : 'h-8 px-2'}`}
              >
                <span className="text-xs">Clear</span>
              </Button>
              {/* Only show close button on mobile */}
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowFilters(false);
                    setHasExplicitlyClosed(true); // Mark as explicitly closed
                  }}
                  className="flex items-center gap-1 h-6 px-1.5 hover:bg-primary-foreground/20 text-primary-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'mobile-filter-content mobile-filter-compact' : 'p-3 sm:p-4'}`}>
          <div className={`${isMobile ? '' : ''}`}>
            <EncarStyleFilter
            filters={filters}
            manufacturers={manufacturers.length > 0 ? manufacturers : fallbackManufacturers}
            models={models}
            filterCounts={filterCounts}
            loadingCounts={loadingCounts}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            onManufacturerChange={handleManufacturerChange}
            onModelChange={handleModelChange}
            showAdvanced={showAdvancedFilters}
            onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
            onFetchGrades={fetchGrades}
            onFetchTrimLevels={fetchTrimLevels}
            compact={true}
            onSearchCars={() => {
              // Apply search/filters but keep panel open on desktop
              fetchCars(1, { ...filters, per_page: "50" }, true);
              if (isMobile) {
                setShowFilters(false); // Only hide on mobile
                setHasExplicitlyClosed(true); // Mark as explicitly closed on mobile
              }
            }}
            onCloseFilter={() => {
              if (isMobile) {
                setShowFilters(false);
                setHasExplicitlyClosed(true); // Mark as explicitly closed
              }
              // Do nothing on desktop - filters stay open
            }}
          />
          
          {/* Mobile Apply/Close Filters Button - Enhanced */}
          {isMobile && (
            <div className="mt-4 pt-3 border-t space-y-2 flex-shrink-0">
              {/* Apply/Close button removed per Issue #3 */}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile - stronger backdrop on mobile */}
      {showFilters && (
        <div 
          className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-300 ${
            isMobile ? 'bg-black/70 backdrop-blur-md' : 'bg-black/50 backdrop-blur-sm'
          }`}
          onClick={() => {
            // Only close on mobile via overlay click
            if (isMobile) {
              setShowFilters(false);
              setHasExplicitlyClosed(true); // Mark as explicitly closed
            }
          }}
        />
      )}

      {/* Main Content */}
      <div ref={mainContentRef} className={`flex-1 min-w-0 transition-all duration-300`}>
        <div className="container-responsive py-3 sm:py-6 mobile-text-optimize">
          {/* Header Section - Mobile optimized */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Mobile header - stacked layout */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors h-8 px-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden xs:inline text-xs">Back</span>
                </Button>
                
                {/* Filter Toggle Button - Solid styling with no effects */}
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => {
                    // Issue #2 FIXED: Allow toggling filters manually and reset explicit close flag
                    const newShowState = !showFilters;
                    setShowFilters(newShowState);
                    if (newShowState) {
                      setHasExplicitlyClosed(false); // Reset explicit close flag when manually opening
                    } else {
                      setHasExplicitlyClosed(true); // Mark as explicitly closed when manually closing
                    }
                  }}
                  className="flex items-center gap-2 h-12 px-4 sm:px-6 lg:px-8 font-semibold text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {showFilters ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                  <span className="hidden xs:inline">{showFilters ? 'Fshih Filtrat' : 'Shfaq Filtrat'}</span>
                  <span className="xs:hidden">Filtrat</span>
                  {hasSelectedCategories && !showFilters && (
                    <span className="ml-1 text-xs bg-primary-foreground/20 px-2 py-1 rounded-full animate-bounce">
                      {Object.values(filters).filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* View mode and sort - mobile optimized */}
              <div className="flex gap-1 items-center">
                {/* Catalog Lock Button - Only on mobile */}
                {isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCatalogLockToggle}
                    className={`h-8 px-2 flex items-center gap-1 transition-colors ${
                      catalogLocked 
                        ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-600 dark:text-orange-400' 
                        : 'hover:bg-accent'
                    }`}
                    title={catalogLocked ? 'Unlock swipe gestures' : 'Lock to prevent accidental swipes'}
                  >
                    {catalogLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    <span className="hidden sm:inline text-xs">{catalogLocked ? 'Locked' : 'Lock'}</span>
                  </Button>
                )}
                
                {/* Sort Control - smaller on mobile */}
                <div className="relative">
                  <ArrowUpDown className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none" />
                  <AdaptiveSelect
                    value={sortBy}
                    onValueChange={(value: SortOption) => {
                      setSortBy(value);
                      setHasUserSelectedSort(true); // Mark that user has explicitly chosen a sort option
                      // Reset to page 1 when sort changes to show users the first page of newly sorted results
                      setCurrentPage(1);
                      // Update URL to reflect page reset
                      const currentParams = Object.fromEntries(searchParams.entries());
                      currentParams.page = '1';
                      setSearchParams(currentParams);
                      // Immediately trigger global sorting for large datasets when sort changes
                      if (totalCount > 50 && !fetchingSortRef.current) {
                        console.log(`🔄 Sort changed: Immediately triggering global sorting for ${totalCount} cars with sortBy=${value}`);
                        fetchAllCarsForSorting();
                      }
                    }}
                    placeholder="Sort"
                    className="w-24 sm:w-32 h-7 text-xs pl-6"
                    options={getSortOptions().map((option) => ({
                      value: option.value,
                      label: option.label
                    }))}
                  />
                </div>
              </div>
            </div>
            
            {/* Title and stats - separate row for better mobile layout */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Car Catalog
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {(() => {
                  // Show different counts based on sorting mode
                  if (isSortingGlobal && allCarsForSorting.length > 0) {
                    return `${allCarsForSorting.length.toLocaleString()} cars sorted globally • Page ${currentPage} of ${totalPages} • Showing ${carsForCurrentPage.length} cars`;
                  } else {
                    return `${totalCount.toLocaleString()} cars ${filters.grade_iaai && filters.grade_iaai !== 'all' ? `filtered by ${filters.grade_iaai}` : 'total'} • Page ${currentPage} of ${totalPages} • Showing ${carsForCurrentPage.length} cars`;
                  }
                })()}
                {yearFilterProgress === 'instant' && (
                  <span className="ml-2 text-primary text-xs">⚡ Instant results</span>
                )}
                {yearFilterProgress === 'loading' && (
                  <span className="ml-2 text-primary text-xs">🔄 Loading complete results...</span>
                )}
              </p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
              <p className="text-destructive font-medium">Error: {error}</p>
            </div>
          )}

          {/* Loading State */}
          {(loading && cars.length === 0) || isRestoringState || isFilterLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>
                {isRestoringState ? "Restoring your view..." : 
                 isFilterLoading ? "Switching brand..." : "Loading cars..."}
              </span>
            </div>
          ) : null}

          {/* No Selection State */}
          {!shouldShowCars && !loading && !isRestoringState && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Zgjidhni markën dhe modelin</h3>
                <p className="text-muted-foreground mb-6">
                  Për të parë makinat, ju duhet të zgjidhni së paku markën dhe modelin e makinës.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Filter className="h-4 w-4" />
                  Open Filters
                </Button>
              </div>
            </div>
          )}

          {/* No Results State */}
          {shouldShowCars && !loading && !isRestoringState && !isFilterLoading && cars.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No cars found matching your filters.
              </p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Filter Loading State */}
          {isFilterLoading && cars.length === 0 && (
            <div className="flex items-center justify-center py-12">
              {/* Loading without text or spinner */}
            </div>
          )}

          {/* Cars Grid/List - Show cars without requiring filters */}
          {shouldShowCars && cars.length > 0 && (
            <div className="relative">
              {/* Loading Overlay for Cars Grid */}
              {isFilterLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      {/* Loading without text or spinner */}
                    </div>
                  </div>
                </div>
              )}
              
              <div
                ref={containerRef}
                className={`grid mobile-car-grid-compact sm:mobile-car-grid gap-2 sm:gap-3 lg:gap-4 transition-all duration-300 ${
                  showFilters 
                    ? 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                    : 'lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7'
                } ${isFilterLoading ? 'opacity-50' : ''}`}
              >
                {carsForCurrentPage.map((car) => {
                  const lot = car.lots?.[0];
                  const usdPrice = lot?.buy_now || 25000;
                  const price = convertUSDtoEUR(Math.round(usdPrice + 2200));
                  const lotNumber = car.lot_number || lot?.lot || "";

                  return (
                    <div
                      key={car.id}
                      id={`car-${car.id}`}
                      data-lot-id={`car-lot-${lotNumber}`}
                      className={
                        highlightedCarId === lotNumber ||
                        highlightedCarId === car.id
                          ? "car-highlight"
                          : ""
                      }
                    >
                      <LazyCarCard
                        id={car.id}
                        make={car.manufacturer?.name || "Unknown"}
                        model={car.model?.name || "Unknown"}
                        year={car.year}
                        price={price}
                        image={lot?.images?.normal?.[0] || lot?.images?.big?.[0]}
                        vin={car.vin}
                        mileage={
                          lot?.odometer?.km
                            ? `${lot.odometer.km.toLocaleString()} km`
                            : undefined
                        }
                        transmission={car.transmission?.name}
                        fuel={car.fuel?.name}
                        color={car.color?.name}
                        lot={car.lot_number || lot?.lot || ""}
                        title={car.title || ""}
                        status={Number(car.status || lot?.status || 1)}
                        sale_status={car.sale_status || lot?.sale_status}
                        final_price={car.final_price || lot?.final_price}
                        insurance_v2={(lot as any)?.insurance_v2}
                        details={(lot as any)?.details}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Load More Button - replacing pagination */}
              {hasMorePages && !loading && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => loadMoreCars()}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    Load More Cars
                    <div className="text-xs text-muted-foreground ml-2">
                      ({cars.length} of {totalCount} shown)
                    </div>
                  </Button>
                </div>
              )}
              
              {/* Loading indicator for load more */}
              {loading && cars.length > 0 && (
                <div className="flex justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span>Loading more cars...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncarCatalog;
