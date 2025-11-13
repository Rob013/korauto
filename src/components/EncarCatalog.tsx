import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/contexts/NavigationContext";
import { Loader2, Search, ArrowLeft, ArrowUpDown, Car, Filter, X, PanelLeftOpen, PanelLeftClose, Grid3X3, List } from "lucide-react";
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";
import { useSecureAuctionAPI, createFallbackManufacturers, createFallbackModels } from "@/hooks/useSecureAuctionAPI";
import { useAuctionsApiGrid } from "@/hooks/useAuctionsApiGrid";
import { fetchSourceCounts } from "@/hooks/useSecureAuctionAPI";
import EncarStyleFilter from "@/components/EncarStyleFilter";
import { AISearchBar } from "@/components/AISearchBar";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useResourcePreloader } from "@/hooks/useResourcePreloader";
import { debounce } from "@/utils/performance";
import { useOptimizedYearFilter } from "@/hooks/useOptimizedYearFilter";
import { initializeTouchRipple, cleanupTouchRipple } from "@/utils/touchRipple";
import { APIFilters, extractGradesFromTitle, applyGradeFilter, matchesGradeFilter, normalizeFilters, filtersToURLParams, isYearRangeChange, addPaginationToFilters, debounce as catalogDebounce, extractUniqueEngineSpecs, matchesEngineFilter } from "@/utils/catalog-filter";
import { useSearchParams } from "react-router-dom";
import { useSortedCars, getEncarSortOptions, SortOption } from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalCarSorting } from "@/hooks/useGlobalCarSorting";
import { useSmoothListTransition } from "@/hooks/useSmoothListTransition";
// TODO: Migrate this component to use useCarsQuery and fetchCarsWithKeyset 
// for consistent backend sorting
import { CarWithRank } from "@/utils/chronologicalRanking";
import { filterOutTestCars } from "@/utils/testCarFilter";
import { calculateFinalPriceEUR, filterCarsWithBuyNowPricing } from "@/utils/carPricing";
import { resolveFuelFromSources } from "@/utils/fuel";
import { fallbackCars } from "@/data/fallbackData";
import { useAnimatedCount } from "@/hooks/useAnimatedCount";
interface EncarCatalogProps {
  highlightCarId?: string | null;
}
const EncarCatalog = ({
  highlightCarId
}: EncarCatalogProps = {}) => {
  const {
    toast
  } = useToast();
  const {
    restorePageState
  } = useNavigation();
  const {
    cars,
    setCars,
    // ✅ Import setCars
    loading,
    error,
    totalCount,
    setTotalCount,
    // ✅ Import setTotalCount for optimized filtering
    hasMorePages,
    fetchCars,
    fetchAllCars,
    // ✅ Import new function for global sorting
    filters,
    setFilters,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchAllGenerationsForManufacturer,
    // ✅ Import new function
    fetchFilterCounts,
    fetchGrades,
    fetchTrimLevels,
    loadMore,
    refreshInventory,
    clearCarsCache
  } = useSecureAuctionAPI();
  const {
    convertUSDtoEUR,
    exchangeRate
  } = useCurrencyAPI();

  // Global sorting hook
  const {
    globalSortingState,
    initializeGlobalSorting,
    getCarsForCurrentPage,
    shouldUseGlobalSorting,
    isGlobalSortingReady,
    getPageInfo,
    clearGlobalSorting
  } = useGlobalCarSorting({
    fetchAllCars,
    currentCars: cars,
    filters,
    totalCount,
    carsPerPage: 200,
    enableCaching: true,
    validationEnabled: false
  });

  // Default sort: recently_added when no filters selected
  const [sortBy, setSortBy] = useState<SortOption>("recently_added");
  const [hasUserSelectedSort, setHasUserSelectedSort] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [showAllCars, setShowAllCars] = useState(false); // New state for showing all cars
  const [allCarsData, setAllCarsData] = useState<any[]>([]); // Store all cars when fetched
  const isMobile = useIsMobile();
    const [sourceCounts, setSourceCounts] = useState<{ encar: number; kbc: number; all?: number }>({ encar: 0, kbc: 0 });
  const { cars: gridCars, isLoading: gridLoading, error: gridError, fetchGrid, fetchFromLink } = useAuctionsApiGrid();
  const KBC_DOMAINS = ['kbchachacha', 'kbchacha', 'kb_chachacha', 'kbc', 'kbcchachacha'];

  // Initialize showFilters - always open on desktop, closed on mobile
  const [showFilters, setShowFilters] = useState(() => {
    // On desktop (lg breakpoint), filters should always be open
    return !isMobile; // desktop open, mobile closed
  });

  // Track if user has explicitly closed the filter panel (mobile only)
  const [hasExplicitlyClosed, setHasExplicitlyClosed] = useState(() => {
    // Only relevant for mobile
    return isMobile;
  });

  // View mode state - toggle between grid and list view
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const savedViewMode = localStorage.getItem('catalog-view-mode');
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      return savedViewMode;
    }
    // Default to 'grid' for all devices
    return 'grid';
  });
  const [hasSelectedCategories, setHasSelectedCategories] = useState(false);

  // Use ref for tracking fetch progress to avoid triggering re-renders
  const fetchingSortRef = useRef(false);
  const lastSortParamsRef = useRef('');

  // Ensure filters are always open on desktop
  useEffect(() => {
    if (!isMobile) setShowFilters(true);else setShowFilters(false);
  }, [isMobile]);

  useEffect(() => {
    refreshInventory(60);
  }, [refreshInventory]);

  // Memoized helper function to extract grades from title - now using utility
  const extractGradesFromTitleCallback = useCallback(extractGradesFromTitle, []);

  // Helper function to check if filters are in default "all brands" state
  const isDefaultState = useMemo(() => {
    // Handle case where filters might be undefined during initial render
    if (!filters) return true;

    // Default state means no meaningful filters are applied OR manufacturer is explicitly set to "all"
    return (!filters.manufacturer_id || filters.manufacturer_id === 'all') && !filters.model_id && !filters.generation_id && !filters.color && !filters.fuel_type && !filters.transmission && !filters.body_type && !filters.odometer_from_km && !filters.odometer_to_km && !filters.from_year && !filters.to_year && !filters.buy_now_price_from && !filters.buy_now_price_to && !filters.search && !filters.seats_count && (!filters.grade_iaai || filters.grade_iaai === 'all');
  }, [filters]);

  // Memoized client-side grade and engine filtering for better performance
  const filteredCars = useMemo(() => {
    // Use fallback data when there's an error and no cars loaded
    const sourceCars = error && cars.length === 0 ? fallbackCars : cars;
    const cleanedCars = filterOutTestCars(sourceCars || []);
    
    // Apply grade filter
    const gradeFiltered = applyGradeFilter(cleanedCars, filters?.grade_iaai) || [];
    
    // Apply engine filter if specified
    const engineSpec = (filters as any)?.engine_spec;
    const engineFiltered = engineSpec 
      ? gradeFiltered.filter(car => matchesEngineFilter(car, engineSpec))
      : gradeFiltered;
    
    // Filter to show only cars with real buy_now pricing data
    return filterCarsWithBuyNowPricing(engineFiltered);
  }, [cars, filters?.grade_iaai, (filters as any)?.engine_spec, error]);

  // Extract engine variants from filtered cars for the dropdown
  const engineVariants = useMemo(() => {
    if (!filters?.model_id || filteredCars.length === 0) {
      return [];
    }
    return extractUniqueEngineSpecs(filteredCars);
  }, [filteredCars, filters?.model_id]);

  // console.log(`📊 Filter Results: ${filteredCars.length} cars match (total loaded: ${cars.length}, total count from API: ${totalCount}, grade filter: ${filters.grade_iaai || 'none'})`);

  // Merge AuctionsAPI grid cars with secure cars BEFORE sorting to share the same pipeline
  const mergedCars = useMemo(() => {
    const result = [...(filterOutTestCars(error && cars.length === 0 ? fallbackCars : cars) || [])];
    if (Array.isArray(gridCars) && gridCars.length > 0) {
      // Include only cars with buy_now price to match existing rule
      gridCars.forEach((c: any) => {
        const lot = c?.lots?.[0];
        if (lot?.buy_now && lot.buy_now > 0) {
          result.push(c);
        }
      });
    }
    return result;
  }, [cars, gridCars, error]);

  // Apply filters on merged list
  const mergedFilteredCars = useMemo(() => {
    const gradeFiltered = applyGradeFilter(mergedCars, filters?.grade_iaai) || [];
    const engineSpec = (filters as any)?.engine_spec;
    const engineFiltered = engineSpec ? gradeFiltered.filter(car => matchesEngineFilter(car, engineSpec)) : gradeFiltered;
    return filterCarsWithBuyNowPricing(engineFiltered);
  }, [mergedCars, filters?.grade_iaai, (filters as any)?.engine_spec]);

  // Memoized cars for sorting to prevent unnecessary re-computations
  const carsForSorting = useMemo(() => {
    return mergedFilteredCars.map(car => {
      // Calculate EUR price using current exchange rate
      const priceUSD = Number(car.lots?.[0]?.buy_now || car.buy_now || 0);
      const priceEUR = priceUSD > 0 ? calculateFinalPriceEUR(priceUSD, exchangeRate.rate) : 0;
      return {
        ...car,
        price_eur: priceEUR,
        // Add calculated EUR price
        status: String(car.status || ""),
        lot_number: String(car.lot_number || ""),
        cylinders: Number(car.cylinders || 0),
        year: Number(car.year || 2000),
        // Ensure year is a number for FlexibleCar interface
        engine: {
          name: car.engine?.name || "Unknown"
        } // Ensure engine has required name property
      };
    });
  }, [mergedFilteredCars, exchangeRate.rate]);

  // Always call useSortedCars hook (hooks must be called unconditionally)
  const sortedResults = useSortedCars(carsForSorting, sortBy);
  const sortedAllCarsResults = useSortedCars(allCarsData, sortBy); // Add sorting for all cars data

  // Memoized cars to display - uses global sorting when available
  const carsToDisplay = useMemo(() => {
    // Priority 0: Show all cars when user has selected "Show All" option
    if (showAllCars && allCarsData.length > 0) {
      console.log(`🌟 Showing all ${sortedAllCarsResults.length} cars (Show All mode active)`);
      return sortedAllCarsResults;
    }

    // Priority 1: Global sorting (when available and dataset is large enough)
    if (isGlobalSortingReady() && shouldUseGlobalSorting()) {
      const rankedCarsForPage = getCarsForCurrentPage(currentPage);
      console.log(`🎯 Using globally sorted cars for page ${currentPage}: ${rankedCarsForPage.length} cars (${globalSortingState.currentSortBy} sort)`);
      return rankedCarsForPage;
    }

    // Priority 2: Recently added cars by default
    // Catalog always shows fresh inventory from API sorted by recently_added

    // Priority 3: Regular sorted cars (recently added by default)
    // For server-side pagination, use all sorted results without client-side slicing
    // Server already provides the correct page data with 'recently_added' sort by default
    console.log(`📄 Using sorted cars for page ${currentPage}: ${sortedResults.length} cars (including AuctionsAPI grid) (sort: ${sortBy || 'recently_added'})`);
    return sortedResults;
  }, [showAllCars, allCarsData, sortedAllCarsResults, sortBy, isGlobalSortingReady, shouldUseGlobalSorting, getCarsForCurrentPage, currentPage, globalSortingState.currentSortBy, isDefaultState, hasUserSelectedSort, sortedResults]);

  const {
    currentValue: smoothCarsToDisplay,
    isTransitioning: isCarsTransitioning,
  } = useSmoothListTransition(carsToDisplay, loading || isFilterLoading, {
    holdDuringLoading: true,
    transitionMs: 240,
  });

  const renderableCars = useMemo(
    () =>
      smoothCarsToDisplay.filter((car: CarWithRank | any) => {
        const lot = car?.lots?.[0];
        return lot?.buy_now && lot.buy_now > 0;
      }),
    [smoothCarsToDisplay],
  );
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [manufacturers, setManufacturers] = useState<{
    id: number;
    name: string;
    car_count?: number;
    cars_qty?: number;
    image?: string;
  }[]>(createFallbackManufacturers()); // Initialize with fallback data immediately

  const [models, setModels] = useState<{
    id: number;
    name: string;
    car_count?: number;
    cars_qty?: number;
  }[]>([]);
  const [generations, setGenerations] = useState<{
    id: number;
    name: string;
    manufacturer_id?: number;
    model_id?: number;
    from_year?: number;
    to_year?: number;
    cars_qty?: number;
  }[]>([]);
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
        timestamp: Date.now()
      };
      sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(scrollData));
    }
  }, []);

  // SIMPLIFIED: Basic scroll restoration without complex timing checks
  const restoreScrollPosition = useCallback(() => {
    const savedData = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedData) {
      try {
        const {
          scrollTop,
          timestamp
        } = JSON.parse(savedData);

        // Only restore recent scroll positions (within 10 minutes)
        const isRecent = Date.now() - timestamp < 600000;
        if (isRecent && scrollTop > 0) {
          window.scrollTo({
            top: scrollTop,
            behavior: 'auto'
          });
        } else {
          window.scrollTo({
            top: 0,
            behavior: 'auto'
          });
        }
      } catch (error) {
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
    }
  }, []);

  // Swipe gesture handlers
  const handleSwipeRightToShowFilters = useCallback(() => {
    if (!showFilters && isMobile) {
      setShowFilters(true);
      setHasExplicitlyClosed(false); // Reset explicit close flag when opening via swipe
    }
  }, [showFilters, isMobile]);
  const handleSwipeLeftToCloseFilters = useCallback(() => {
    if (showFilters && isMobile) {
      setShowFilters(false);
      setHasExplicitlyClosed(true); // Mark as explicitly closed
    }
  }, [showFilters, isMobile]);

  // Handle view mode toggle
  const handleViewModeToggle = useCallback(() => {
    const newViewMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newViewMode);
    localStorage.setItem('catalog-view-mode', newViewMode);
  }, [viewMode]);

  // Debounced filter toggle to prevent rapid clicking issues
  const handleFilterToggle = useCallback(debounce((e: React.MouseEvent) => {
    // Prevent event bubbling and ensure click is processed
    e.preventDefault();
    e.stopPropagation();
    console.log("Filter toggle clicked, current showFilters:", showFilters, "isMobile:", isMobile);
    const newShowState = !showFilters;

    // Update state
    setShowFilters(newShowState);

    // Update explicit close tracking
    if (newShowState) {
      setHasExplicitlyClosed(false);
      console.log("Opening filters, reset explicit close flag");
    } else {
      setHasExplicitlyClosed(true);
      console.log("Closing filters, set explicit close flag");
    }

    // Use a single shorter timeout for DOM sync if needed (mobile only)
    if (isMobile) {
      setTimeout(() => {
        const filterPanel = document.querySelector('[data-filter-panel]') as HTMLElement;
        if (filterPanel) {
          if (newShowState) {
            filterPanel.style.transform = 'translateX(0)';
            filterPanel.style.visibility = 'visible';
            console.log("Mobile: Synced filter panel to show");
          } else {
            filterPanel.style.transform = 'translateX(-100%)';
            filterPanel.style.visibility = 'hidden';
            console.log("Mobile: Synced filter panel to hide");
          }
        }
      }, 50); // Reduced from 100ms to 50ms to reduce race conditions
    }
  }, 250),
  // 250ms debounce to prevent rapid clicking
  [showFilters, isMobile, setShowFilters, setHasExplicitlyClosed]);

  // Set up swipe gestures for main content (swipe right to show filters)
  useSwipeGesture(mainContentRef, {
    onSwipeRight: handleSwipeRightToShowFilters,
    minSwipeDistance: 80,
    // Require a more deliberate swipe
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

    // Keep current sort preference when filters change
    // Don't reset to recently_added

    // Reset global sorting when filters change
    clearGlobalSorting();

    // Use 200 cars per page for proper pagination - fetch from ALL sources
    const filtersWithPagination = addPaginationToFilters(newFilters, 200, 1);

    // Use current sort if user has selected one
    const filtersWithSort = hasUserSelectedSort && sortBy ? {
      ...filtersWithPagination,
      sort_by: sortBy
    } : filtersWithPagination;
    fetchCars(1, filtersWithSort, true);

    // Update URL with all non-empty filter values - now using utility
    const searchParams = filtersToURLParams(newFilters);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  }, [fetchCars, setSearchParams, hasUserSelectedSort, sortBy, clearGlobalSorting]);

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

  // Apply filters instantly without debouncing
  const handleFiltersChange = useCallback(async (newFilters: APIFilters) => {
      // Reset sorting to neutral whenever filters change
      setHasUserSelectedSort(false);
      setSortBy("");

      // Update UI immediately for instant response
      setFilters(newFilters);

      // Reset "Show All" mode when filters change
      setShowAllCars(false);
      setAllCarsData([]);

      // Clear global sorting when filters change
      clearGlobalSorting();

      // Apply filters immediately - no debouncing - fetch from ALL sources
      const filtersWithPagination = addPaginationToFilters(newFilters, 200, 1);
      fetchCars(1, filtersWithPagination, true);
      setCurrentPage(1);

      // Update URL
      const searchParams = filtersToURLParams(newFilters);
      searchParams.set('page', '1');
      setSearchParams(searchParams);
      
      setIsFilterLoading(false);
    }, [fetchCars, setSearchParams, clearGlobalSorting]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm("");
    setLoadedPages(1);
    setModels([]);
    setGenerations([]);
    setHasUserSelectedSort(false); // Reset sort preference
    setSortBy("recently_added"); // Reset to recently_added default
    clearCarsCache();
    fetchCars(1, {}, true);
    setSearchParams({});
  }, [fetchCars, setSearchParams, clearCarsCache]);
  const handleSearch = useCallback(() => {
    const newFilters = {
      ...(filters || {}),
      search: searchTerm.trim() || undefined
    };
    handleFiltersChange(newFilters);
  }, [filters, searchTerm, handleFiltersChange]);
  const handlePageChange = useCallback((page: number) => {
    // Validate page number
    if (page < 1 || page > totalPages) {
      console.log(`⚠️ Invalid page number: ${page}. Must be between 1 and ${totalPages}`);
      return;
    }
    setCurrentPage(page);

    // Fetch cars for the specific page with proper API pagination - fetch from ALL sources
    const filtersWithPagination = addPaginationToFilters(filters, 200, page);
    const filtersWithSort = hasUserSelectedSort && sortBy ? {
      ...filtersWithPagination,
      sort_by: sortBy
    } : filtersWithPagination;
    fetchCars(page, filtersWithSort, true); // Reset list for new page

    // Update URL with new page
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = page.toString();
    setSearchParams(currentParams);

    // Avoid forcing scroll on desktop; let dropdowns remain in view
    console.log(`📄 Navigated to page ${page} of ${totalPages} with filters:`, filtersWithPagination);
  }, [filters, fetchCars, setSearchParams, addPaginationToFilters, totalPages]);

  // Function to fetch and display all cars
  const handleShowAllCars = useCallback(async () => {
    if (showAllCars) {
      // If already showing all cars, switch back to pagination
      setShowAllCars(false);
      setAllCarsData([]);
      setCurrentPage(1);
      return;
    }
    setIsLoading(true);
    try {
      console.log(`🔄 Fetching all cars with current filters...`);
      const allCars = await fetchAllCars(filters);

      // Apply the same client-side filtering as the current filtered cars
      const filteredAllCars = allCars.filter((car: any) => {
        return matchesGradeFilter(car, filters.grade_iaai);
      });
      setAllCarsData(filteredAllCars);
      setShowAllCars(true);
      console.log(`✅ Loaded ${filteredAllCars.length} cars for "Show All" view`);
    } catch (error) {
      console.error('❌ Error fetching all cars:', error);
      toast({
        title: "Error",
        description: "Failed to load all cars. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [showAllCars, filters, fetchAllCars, toast]);

  // Function to fetch all cars for sorting across all pages
  const fetchAllCarsForSorting = useCallback(async () => {
    // Create a unique key for current sort parameters to prevent duplicate calls
    const sortKey = `${totalCount}-${sortBy}-${filters.grade_iaai || ''}-${filters.manufacturer_id || ''}-${filters.model_id || ''}-${filters.generation_id || ''}-${filters.from_year || ''}-${filters.to_year || ''}`;
    if (fetchingSortRef.current) {
      console.log(`⏳ Already fetching sort data, skipping duplicate request`);
      return;
    }

    // Only skip if the exact same sort request was completed successfully
    if (sortKey === lastSortParamsRef.current && globalSortingState.isGlobalSorting && globalSortingState.rankedCars.length > 0) {
      console.log(`✅ Using cached sort data for: ${sortKey}`);
      return;
    }
    if (!shouldUseGlobalSorting()) {
      // For small datasets, the global sorting hook handles this automatically
      console.log(`📝 Small dataset (${totalCount} cars), letting global sorting hook handle it`);
      // setAllCarsForSorting(filteredCars);
      // setIsSortingGlobal(true);
      lastSortParamsRef.current = sortKey;
      return;
    }
    fetchingSortRef.current = true;
    // setIsSortingGlobal(true); // Handled by global sorting hook
    setIsLoading(true);
    try {
      console.log(`🔄 Global sorting: Fetching all ${totalCount} cars for sorting across ${totalPages} pages`);

      // Use the new fetchAllCars function to get all cars with current filters
      const allCars = await fetchAllCars(filters);

      // Apply the same client-side filtering as the current filtered cars - using utility
      const filteredAllCars = allCars.filter((car: any) => {
        return matchesGradeFilter(car, filters.grade_iaai);
      });

      // setAllCarsForSorting(filteredAllCars); // Handled by global sorting hook
      lastSortParamsRef.current = sortKey;

      // Check if current page is beyond available pages and reset to page 1 if needed
      const maxPages = Math.ceil(filteredAllCars.length / 200);
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
      // setIsSortingGlobal(false); // Handled by global sorting hook
      // setAllCarsForSorting([]); // Handled by global sorting hook
    } finally {
      setIsLoading(false);
      fetchingSortRef.current = false;
    }
  }, [totalCount, fetchAllCars, filters?.grade_iaai, filters?.manufacturer_id, filters?.model_id, filters?.generation_id, filters?.from_year, filters?.to_year, sortBy,
  // Remove filteredCars from dependencies as it's computed and can cause infinite loops
  // filteredCars,
  totalPages || 0, currentPage, setSearchParams]);
    const handleManufacturerChange = async (manufacturerId: string) => {
      console.log(`[handleManufacturerChange] Called with manufacturerId: ${manufacturerId}`);
  
      // Reset sorting to neutral when manufacturer changes
      setHasUserSelectedSort(false);
      setSortBy("");

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
      search: filters.search
    };
    setFilters(newFilters);
    setLoadedPages(1);
    setModels([]);
    setGenerations([]);

    // Only show loading for cars
    setIsLoading(true);
    try {
      if (!manufacturerId) {
        setIsLoading(false);
        return;
      }

      // Optimistically show fallback models instantly (replaced when API returns)
      const selectedManufacturer = manufacturers.find(m => m.id.toString() === manufacturerId);
      if (selectedManufacturer?.name) {
        try {
          const optimisticModels = createFallbackModels(selectedManufacturer.name);
          if (optimisticModels && optimisticModels.length > 0) {
            setModels(optimisticModels);
          }
        } catch {}
      }

      // Fetch models in parallel
      const modelPromise = fetchModels(manufacturerId);

        // Fetch cars with neutral sorting (user can re-apply a sort after filters)
        const filtersForCars = {
          ...newFilters,
          per_page: "50"
        };
      await Promise.all([fetchCars(1, filtersForCars, true), modelPromise.then(modelData => {
        console.log(`[handleManufacturerChange] Setting models to:`, modelData);
        setModels(modelData);
      }).catch(err => console.warn('Failed to load models:', err))]);

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
      // Reset sorting to neutral when model changes
      setHasUserSelectedSort(false);
      setSortBy("");

    // Create new filters immediately for faster UI response
    const newFilters: APIFilters = {
      ...filters,
      model_id: modelId,
      generation_id: undefined,
      grade_iaai: undefined
    };
    setFilters(newFilters);
    setLoadedPages(1);
    setGenerations([]);

    // Only show loading for cars
    setIsLoading(true);
    try {
        // Fetch cars with neutral sorting (user can re-apply a sort after filters)
        const filtersForCars = {
          ...newFilters,
          per_page: "50"
        };
      await fetchCars(1, filtersForCars, true);

      // Fetch generations in background (non-blocking)
      if (modelId) {
        fetchGenerations(modelId).then(generationData => setGenerations(generationData)).catch(err => console.warn('Failed to load generations:', err));
      }

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
    } finally {
      setIsLoading(false);
      setIsFilterLoading(false);
    }
  };

  // Detect if any filter is applied
  const anyFilterApplied = useMemo(() => {
    if (!filters) return false;
    const entries = Object.entries(filters);
    return entries.some(([key, value]) => !!value && value !== 'all');
  }, [filters]);

    // Adjust sort depending on filter presence
    useEffect(() => {
      if (hasUserSelectedSort) {
        return;
      }

      setSortBy((currentSort) => {
        const desiredSort: SortOption = anyFilterApplied ? "" : "recently_added";
        return currentSort === desiredSort ? currentSort : desiredSort;
      });
    }, [anyFilterApplied, hasUserSelectedSort]);

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
          per_page: "200",
          page: urlCurrentPage.toString(),
          ...(hasUserSelectedSort && sortBy ? {
            sort_by: sortBy
          } : {})
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
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });

        // Remove the fromHomepage flag from URL without causing re-render
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('fromHomepage');
        window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams.toString()}`);
      } else {
        // Try to restore complete page state from navigation context first
        setTimeout(() => {
          const stateRestored = restorePageState();
          if (!stateRestored) {
            // Fallback to sessionStorage scroll restoration
            const savedData = sessionStorage.getItem(SCROLL_STORAGE_KEY);
            if (savedData) {
              try {
                const {
                  scrollTop
                } = JSON.parse(savedData);
                if (scrollTop > 0) {
                  window.scrollTo({
                    top: scrollTop,
                    behavior: 'auto'
                  });
                }
              } catch (error) {
                // Ignore scroll restoration errors
              }
            }
          }
        }, 100); // Small delay to ensure DOM is ready
      }
    };
    loadInitialData();
  }, []); // Only run on mount

  // Live source totals (Encar/KBC) based on current filters
    const displayableGridCount = useMemo(() => {
      if (!Array.isArray(gridCars)) {
        return 0;
      }
      return gridCars.filter((c: any) => c?.lots?.[0]?.buy_now && c.lots[0].buy_now > 0).length;
    }, [gridCars]);

    const effectiveTotalCount = useMemo(() => {
      const base = Number(totalCount || 0);
      return Number.isFinite(base) ? base + displayableGridCount : displayableGridCount;
    }, [totalCount, displayableGridCount]);

    const animatedTotalCount = useAnimatedCount(effectiveTotalCount, {
      duration: loading ? 900 : 600,
    });

    useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { encar, kbc, all } = await fetchSourceCounts(filters);
        // Augment total with gridCars length when present
          const extra = displayableGridCount;
        if (!cancelled) setSourceCounts({ encar, kbc, all: (all || 0) + extra });
      } catch {}
    })();
      return () => { cancelled = true; };
    }, [filters, displayableGridCount]);

  // Kick off fetching AuctionsAPI grid data once on mount (small number of pages for responsiveness)
  useEffect(() => {
    const link = (import.meta as any).env?.VITE_AUCTIONS_GRID_LINK as string | undefined;
    if (link) {
      fetchFromLink(link, 10, 100).catch(() => {});
      // Trigger cloud import to persist and count
      fetch('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grid_link', link, limit: 100, pages: 50 })
      }).then(r => r.json()).then((res) => {
        if (res?.success) {
          console.log(`☁️ Cloud import done: imported ${res.imported} (KBC: ${res.kbchachaCount}, Encar: ${res.encarCount})`);
          toast({ title: 'Shtim i të dhënave', description: `U shtuan ${res.imported} makina nga linku`, duration: 4000 });
        }
      }).catch(() => {});
    } else {
      fetchGrid(3, 100).catch(() => {});
    }
  }, []);

  // Debug: Count how many KB Chachacha cars are added via grid (not present in secure list)
  useEffect(() => {
    try {
      if (!Array.isArray(gridCars) || !Array.isArray(cars)) return;
      const secureIds = new Set((cars || []).map((c: any) => String(c.id)));
      const kbcFromGrid = gridCars.filter((c: any) => {
        const d = String(c?.domain_name || c?.domain?.name || '').toLowerCase();
        return KBC_DOMAINS.some(k => d.includes(k));
      });
      const newKbc = kbcFromGrid.filter((c: any) => !secureIds.has(String(c.id)));
      if (newKbc.length > 0) {
        console.log('➡️ New KB Chachacha cars added via grid:', newKbc.length);
      } else {
        console.log('➡️ New KB Chachacha cars added via grid: 0');
      }
    } catch {}
  }, [gridCars, cars]);

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
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
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
      if (manufacturers.length > 0 && !filterCounts) {
        // Only load if not already loaded
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

  // Calculate total pages based on actual total count
  useEffect(() => {
    if (totalCount > 0) {
      const calculatedPages = Math.ceil(totalCount / 200);
      setTotalPages(calculatedPages);
      console.log(`📊 Calculated pagination: ${totalCount} cars across ${calculatedPages} pages (200 cars per page)`);
    } else {
      setTotalPages(0);
      console.log(`📊 No cars available: ${totalCount} cars, 0 pages`);
    }
  }, [totalCount]); // Update when totalCount changes

  // Initialize global sorting when sortBy changes or totalCount becomes available
  useEffect(() => {
    if (totalCount > 0) {
      // Skip global sorting for recently_added - always use server-side sorting for this option
      if (sortBy === 'recently_added' || isDefaultState && !hasUserSelectedSort) {
        console.log(`📝 Using server-side sorting for recently_added (${totalCount} cars)`);
        clearGlobalSorting();
        return;
      }
      if (shouldUseGlobalSorting()) {
        console.log(`🔄 Initializing global sorting: totalCount=${totalCount}, sortBy=${sortBy}, hasUserSelectedSort=${hasUserSelectedSort}`);
        initializeGlobalSorting(sortBy);
      } else {
        console.log(`📝 Small dataset (${totalCount} cars), using regular sorting`);
        // Clear any existing global sorting for small datasets
        clearGlobalSorting();
      }
    }
  }, [sortBy, totalCount, shouldUseGlobalSorting, initializeGlobalSorting, clearGlobalSorting, hasUserSelectedSort, isDefaultState]);

  // Show cars without requiring brand and model selection
  const shouldShowCars = true;

  // Track when categories are selected 
  useEffect(() => {
    const hasCategories = filters?.manufacturer_id && filters?.model_id;
    setHasSelectedCategories(!!hasCategories);
  }, [filters?.manufacturer_id, filters?.model_id]);

  // Effect to highlight and scroll to specific car by lot number
  useEffect(() => {
    if (highlightCarId && cars.length > 0) {
      setTimeout(() => {
        // Find the car by lot number or ID and scroll to it
        const targetCar = cars.find(car => car.lot_number === highlightCarId || car.id === highlightCarId);
        if (targetCar) {
          const lotNumber = targetCar.lot_number || targetCar.lots?.[0]?.lot || "";
          setHighlightedCarId(lotNumber || targetCar.id);

          // Scroll to the car
          const carElement = document.getElementById(`car-${targetCar.id}`);
          if (carElement) {
            carElement.scrollIntoView({
              behavior: "smooth",
              block: "center"
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
      // Only save when user explicitly opens the panel, but always start closed on navigation
      // This ensures filter panel stays closed after "Kthehu te Makinat" or page navigation
      sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
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
  return <div className="flex min-h-screen bg-background">
      {/* Collapsible Filter Sidebar - Optimized for mobile */}
      <div ref={filterPanelRef} data-filter-panel className={`
        fixed lg:sticky lg:top-4 lg:self-start z-40 glass-card transition-transform duration-300 ease-in-out
        ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${!showFilters && 'lg:block hidden'}
        ${isMobile ? 'mobile-filter-panel top-0 left-0 right-0 bottom-0 w-full rounded-none h-full flex flex-col' : 'w-80 md:w-72 lg:w-80 xl:w-96 flex-shrink-0 rounded-lg shadow-lg will-change-transform'}
      `}>
        <div className={`${isMobile ? 'mobile-filter-compact filter-header bg-primary text-primary-foreground safe-area-inset-top' : 'p-4 border-b flex-shrink-0 bg-card'}`}>
          <div className="flex items-center justify-center gap-4 sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className={`h-4 w-4 sm:h-5 sm:w-5 ${isMobile ? 'text-primary-foreground' : 'text-primary'}`} />
              <h3 className={`font-semibold ${isMobile ? 'text-sm text-primary-foreground' : 'text-sm sm:text-base'}`}>
                {isMobile ? 'Filtrat e Kërkimit' : 'Filters'}
              </h3>
              {hasSelectedCategories && isMobile && <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0">
                  {Object.values(filters).filter(Boolean).length} aktiv
                </Badge>}
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters} className={`lg:hidden flex items-center gap-1 ${isMobile ? 'h-6 px-1.5 hover:bg-primary-foreground/20 text-primary-foreground text-xs' : 'h-8 px-2'}`}>
                <span className="text-xs">Clear</span>
              </Button>
              {/* Show close button on mobile and tablet (iPad) */}
              <Button type="button" variant="ghost" size="sm" onClick={() => {
              console.log("Close button clicked");
              setShowFilters(false);
              setHasExplicitlyClosed(true); // Mark as explicitly closed
            }} className={`lg:hidden flex items-center gap-1 ${isMobile ? 'h-6 px-1.5 hover:bg-primary-foreground/20 text-primary-foreground' : 'h-8 px-2 hover:bg-muted'}`} title="Mbyll filtrat">
                  <X className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
            </div>
          </div>
        </div>
        
        <div className={`flex-1 ${isMobile ? 'overflow-y-auto mobile-filter-content mobile-filter-compact safe-area-inset-bottom safe-area-inset-left safe-area-inset-right' : ''}`}>
          <div className={`${isMobile ? 'p-3' : ''}`}>
            <EncarStyleFilter 
              filters={filters} 
              manufacturers={manufacturers.length > 0 ? manufacturers : createFallbackManufacturers()} 
              models={models} 
              engineVariants={engineVariants}
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
            console.log("Search button clicked, isMobile:", isMobile);
            // Apply search/filters with current sort preference - fetch from ALL sources
            const effectiveSort = hasUserSelectedSort ? sortBy : anyFilterApplied ? '' : 'recently_added';
            const searchFilters = effectiveSort ? {
              ...filters,
              per_page: "200",
              sort_by: effectiveSort
            } : {
              ...filters,
              per_page: "200"
            };
            fetchCars(1, searchFilters, true);

            // Close filter panel on mobile only; keep open on desktop
            if (isMobile) {
              setShowFilters(false);
              setHasExplicitlyClosed(true);
            }

            // Additional CSS force close as backup
            if (isMobile) {
              setTimeout(() => {
                const filterPanel = document.querySelector('[data-filter-panel]');
                if (filterPanel) {
                  (filterPanel as HTMLElement).style.transform = 'translateX(-100%)';
                  (filterPanel as HTMLElement).style.visibility = 'hidden';
                }
              }, 100);
            }
          }} onCloseFilter={() => {
            console.log("Close filter called, isMobile:", isMobile);
            // Close the filter panel on mobile only; keep open on desktop
            if (isMobile) {
              setShowFilters(false);
              setHasExplicitlyClosed(true);
            }

            // Additional CSS force close as backup
            if (isMobile) {
              setTimeout(() => {
                const filterPanel = document.querySelector('[data-filter-panel]');
                if (filterPanel) {
                  (filterPanel as HTMLElement).style.transform = 'translateX(-100%)';
                  (filterPanel as HTMLElement).style.visibility = 'hidden';
                }
              }, 100);
            }
          }} />
          
          {/* Mobile Apply/Close Filters Button - Enhanced */}
          {isMobile && <div className="mt-4 pt-3 border-t space-y-2 flex-shrink-0">
              {/* Apply/Close button removed per Issue #3 */}
            </div>}
          </div>
        </div>
      </div>

      {/* Overlay for mobile - stronger backdrop on mobile */}
      {showFilters && <div className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-300 ${isMobile ? 'bg-black/70 backdrop-blur-md' : 'bg-black/50 backdrop-blur-sm'}`} onClick={() => {
      // Only close on mobile via overlay click
      if (isMobile) {
        setShowFilters(false);
        setHasExplicitlyClosed(true); // Mark as explicitly closed
      }
    }} />}

      {/* Main Content */}
      <div ref={mainContentRef} className={`flex-1 min-w-0 transition-all duration-300 lg:ml-6`}>
        <div className="container-responsive py-3 sm:py-6 mobile-text-optimize max-w-[1600px]">
          {/* Header Section - Mobile optimized */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Top row: Back button and filter button */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full flex-nowrap">
              {/* Left group: Back and Filter buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()} className="flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors h-8 sm:h-9 px-2 sm:px-3">
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm whitespace-nowrap">Back</span>
                </Button>
                
                {/* Filter Toggle Button - Mobile only */}
                <Button type="button" variant="default" size="sm" onClick={handleFilterToggle} className="lg:hidden flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2 sm:px-3 font-semibold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform">
                  {showFilters ? <PanelLeftClose className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <PanelLeftOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  <span className="whitespace-nowrap">{showFilters ? 'Fshih' : 'Filtrat'}</span>
                  {hasSelectedCategories && !showFilters && <span className="ml-1 text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
                      {Object.values(filters).filter(Boolean).length}
                    </span>}
                </Button>
              </div>
              
              {/* Right group: View and Sort controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
                {/* View Mode Toggle Button */}
                <Button type="button" variant="outline" size="sm" onClick={handleViewModeToggle} className="h-8 sm:h-9 px-2 sm:px-3 flex items-center gap-1 transition-colors hover:bg-accent" title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}>
                  {viewMode === 'grid' ? <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  <span className="text-xs sm:text-sm whitespace-nowrap">{viewMode === 'grid' ? 'List' : 'Grid'}</span>
                </Button>
                
                {/* Sort Control */}
                <div className="relative flex-shrink-0">
                  <ArrowUpDown className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none" />
                  <AdaptiveSelect value={sortBy} onValueChange={(value: SortOption) => {
                  setSortBy(value);
                  setHasUserSelectedSort(true);
                  setCurrentPage(1);
                  const currentParams = Object.fromEntries(searchParams.entries());
                  currentParams.page = '1';
                  setSearchParams(currentParams);
                }} placeholder="Sort" className="w-36 sm:w-44 h-8 sm:h-9 text-xs sm:text-sm pl-6" options={getEncarSortOptions().map(option => ({
                  value: option.value,
                  label: option.label
                }))} />
                </div>
              </div>
            </div>
            
            {/* AI Search Bar */}
            
            
            {/* Title and count from API */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Katalogu i makinave
            </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      className="h-4 w-4 text-primary loading-spinner"
                      aria-hidden="true"
                    />
                    Duke ngarkuar...
                  </span>
                ) : (
                  <>
                  <span className="font-semibold text-foreground">{animatedTotalCount.toLocaleString()}</span> vetura të disponueshme
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Error State */}
          {error && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
              <p className="text-destructive font-medium">Error: {error}</p>
            </div>}

          {/* Loading State - Only for initial load, not for filters */}
          {loading && cars.length === 0 || isRestoringState ? <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingLogo size="lg" />
            </div> : null}

          {/* No Selection State */}
          {!shouldShowCars && !loading && !isRestoringState && <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Zgjidhni markën dhe modelin</h3>
                <p className="text-muted-foreground mb-6">
                  Për të parë makinat, ju duhet të zgjidhni së paku markën dhe modelin e makinës.
                </p>
                <Button variant="outline" onClick={() => setShowFilters(true)} className="flex items-center gap-2 mx-auto">
                  <Filter className="h-4 w-4" />
                  Open Filters
                </Button>
              </div>
            </div>}

          {/* No Results State */}
          {shouldShowCars && !loading && !isRestoringState && !isFilterLoading && cars.length === 0 && <div className="text-center py-12">
              <p className="text-muted-foreground">
                No cars found matching your filters.
              </p>
              <Button variant="outline" onClick={handleClearFilters} className="mt-4">
                Clear Filters
              </Button>
            </div>}

          {/* Filter Loading State - Only when no cars and not in main loading */}
          {isFilterLoading && cars.length === 0 && !loading && !isRestoringState && <div className="flex items-center justify-center py-12">
              <LoadingLogo size="lg" />
            </div>}

          {/* Cars Grid/List - Show cars without requiring filters */}
          {shouldShowCars && cars.length > 0 && <div className="relative">
              {/* Loading Overlay for Cars Grid - Only on desktop or when not conflicting with main loading */}
              {isFilterLoading && !loading && !isRestoringState && !isMobile && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
                    <LoadingLogo size="md" />
                  </div>
                </div>}
              
                <div
                  ref={containerRef}
                  className={cn(
                    "transition-all duration-300 motion-safe:transition-opacity motion-reduce:transition-none",
                    viewMode === "list"
                      ? "flex flex-col gap-2 sm:gap-3"
                      : "grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 px-1 sm:px-2",
                    (isFilterLoading || loading || isCarsTransitioning) && "opacity-80",
                  )}
                >
                  {renderableCars.map((car: CarWithRank | any) => {
              const lot = car.lots?.[0];
              // Only use buy_now price, no fallbacks
              const usdPrice = lot?.buy_now;
              const price = calculateFinalPriceEUR(usdPrice, exchangeRate.rate);
              const lotNumber = car.lot_number || lot?.lot || "";
                return <div key={car.id} id={`car-${car.id}`} data-lot-id={`car-lot-${lotNumber}`}>
                        <LazyCarCard id={car.id} make={car.manufacturer?.name || "Unknown"} model={car.model?.name || "Unknown"} year={car.year} price={price} image={lot?.images?.normal?.[0] || lot?.images?.big?.[0]} images={[...(lot?.images?.normal || []), ...(lot?.images?.big || [])].filter(Boolean)} // Combine normal and big images, filter out undefined
                  vin={car.vin} mileage={lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined} transmission={car.transmission?.name} fuel={resolveFuelFromSources(car, lot) || undefined} color={car.color?.name} lot={car.lot_number || lot?.lot || ""} title={car.title || ""} status={Number(car.status || lot?.status || 1)} sale_status={car.sale_status || lot?.sale_status} final_price={car.final_price || lot?.final_price} insurance_v2={(lot as any)?.insurance_v2} details={(lot as any)?.details} source={(car as any)?.domain?.name || (car as any)?.domain_name || (car as any)?.source_api} viewMode={viewMode} />
                      </div>;
            })}
              </div>

              {/* Pagination Controls - replace Load More button */}
              {!showAllCars && totalPages > 1 && <div className="flex flex-col items-center py-8 space-y-4">
                  {/* Page Info */}
                    <div className="text-center text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages.toLocaleString()} • {renderableCars.length} cars shown
                  </div>
                  
                  {/* Pagination Navigation */}
                  <div className="flex items-center space-x-2">
                    {/* First Page */}
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} className="h-8 px-3">
                      First
                    </Button>
                    
                    {/* Previous Page */}
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="h-8 px-3">
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {(() => {
                  const maxVisible = 5;
                  const half = Math.floor(maxVisible / 2);
                  let start = Math.max(1, currentPage - half);
                  let end = Math.min(totalPages, start + maxVisible - 1);

                  // Adjust start if we're near the end
                  if (end - start < maxVisible - 1) {
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  const pages = [];

                  // Show first page if not in range
                  if (start > 1) {
                    pages.push(<Button key={1} variant={1 === currentPage ? "default" : "outline"} size="sm" onClick={() => handlePageChange(1)} disabled={loading} className="h-8 px-3">
                              1
                            </Button>);
                    if (start > 2) {
                      pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">
                                ...
                              </span>);
                    }
                  }

                  // Show page range
                  for (let i = start; i <= end; i++) {
                    pages.push(<Button key={i} variant={i === currentPage ? "default" : "outline"} size="sm" onClick={() => handlePageChange(i)} disabled={loading} className="h-8 px-3">
                              {i.toLocaleString()}
                            </Button>);
                  }

                  // Show last page if not in range
                  if (end < totalPages) {
                    if (end < totalPages - 1) {
                      pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">
                                ...
                              </span>);
                    }
                    pages.push(<Button key={totalPages} variant={totalPages === currentPage ? "default" : "outline"} size="sm" onClick={() => handlePageChange(totalPages)} disabled={loading} className="h-8 px-3">
                              {totalPages.toLocaleString()}
                            </Button>);
                  }
                  return pages;
                })()}
                    </div>
                    
                    {/* Next Page */}
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} className="h-8 px-3">
                      Next
                    </Button>
                    
                    {/* Last Page */}
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || loading} className="h-8 px-3">
                      Last
                    </Button>
                  </div>
                  
                  {/* Go to Page Input */}
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">Go to page:</span>
                    <Input type="number" min={1} max={totalPages} value={currentPage} onChange={e => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }} className="w-20 h-8 text-center" />
                    <span className="text-muted-foreground">of {totalPages.toLocaleString()}</span>
                  </div>
                </div>}
              
              {/* Loading indicator for load more */}
              {loading && cars.length > 0 && <div className="flex justify-center py-8">
                  <LoadingLogo size="md" />
                </div>}
            </div>}
        </div>
      </div>
    </div>;
};
export default EncarCatalog;