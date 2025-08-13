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
} from "lucide-react";
import LazyCarCard from "@/components/LazyCarCard";
import { useSecureAuctionAPI, createFallbackManufacturers } from "@/hooks/useSecureAuctionAPI";
import EncarStyleFilter from "@/components/EncarStyleFilter";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useResourcePreloader } from "@/hooks/useResourcePreloader";
import { debounce } from "@/utils/performance";
import { useOptimizedYearFilter } from "@/hooks/useOptimizedYearFilter";
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
  const [sortBy, setSortBy] = useState<SortOption>("price_low");
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allCarsForSorting, setAllCarsForSorting] = useState<any[]>([]);
  const [isSortingGlobal, setIsSortingGlobal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const isMobile = useIsMobile();
  
  // Initialize showFilters with preserved state for mobile users returning from car details
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
    // Default to open on desktop
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
  
  const [hasSelectedCategories, setHasSelectedCategories] = useState(false);
  
  // Use ref for tracking fetch progress to avoid triggering re-renders
  const fetchingSortRef = useRef(false);
  const lastSortParamsRef = useRef('');

  // Memoized helper function to extract grades from title - now using utility
  const extractGradesFromTitleCallback = useCallback(extractGradesFromTitle, []);

  // Memoized client-side grade filtering for better performance - now using utility
  const filteredCars = useMemo(() => {
    return applyGradeFilter(cars, filters.grade_iaai);
  }, [cars, filters.grade_iaai]);
  
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
  
  // Memoized cars to sort (global vs current page)
  const carsToSort = useMemo(() => {
    return isSortingGlobal && allCarsForSorting.length > 0 ? allCarsForSorting : carsForSorting;
  }, [isSortingGlobal, allCarsForSorting, carsForSorting]);
  
  const sortedCars = useSortedCars(carsToSort, sortBy);
  
  // Memoized current page cars from sorted results
  const carsForCurrentPage = useMemo(() => {
    return isSortingGlobal && allCarsForSorting.length > 0 
      ? sortedCars.slice((currentPage - 1) * 50, currentPage * 50)
      : sortedCars;
  }, [isSortingGlobal, allCarsForSorting.length, sortedCars, currentPage]);

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
    setCurrentPage(page);
    
    // If global sorting is active, don't fetch new cars - just update the page for slicing
    if (isSortingGlobal && allCarsForSorting.length > 0) {
      // Update URL with new page
      const currentParams = Object.fromEntries(searchParams.entries());
      currentParams.page = page.toString();
      setSearchParams(currentParams);
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

  const handleLoadMore = () => {
    // For backward compatibility, load next page
    handlePageChange(currentPage + 1);
  };

  // Function to fetch all cars for sorting across all pages
  const fetchAllCarsForSorting = useCallback(async () => {
    // Create a unique key for current sort parameters to prevent duplicate calls
    const sortKey = `${totalCount}-${sortBy}-${filters.grade_iaai || ''}-${filters.manufacturer_id || ''}-${filters.model_id || ''}`;
    
    if (fetchingSortRef.current || sortKey === lastSortParamsRef.current) {
      console.log(`⏭️ Skipping duplicate sort request: ${sortKey}`);
      return;
    }

    if (totalCount <= 50) {
      // For small datasets, use current filtered cars instead of fetching
      setAllCarsForSorting(filteredCars);
      setIsSortingGlobal(true);
      lastSortParamsRef.current = sortKey;
      return;
    }
    
    fetchingSortRef.current = true;
    setIsSortingGlobal(true);
    setIsLoading(true);
    
    try {
      console.log(`🔄 Global sorting: Fetching all cars for sorting across ${totalPages} pages`);
      
      // Use the new fetchAllCars function to get all cars with current filters
      const allCars = await fetchAllCars(filters);
      
      // Apply the same client-side filtering as the current filtered cars - using utility
      const filteredAllCars = allCars.filter((car: any) => {
        return matchesGradeFilter(car, filters.grade_iaai);
      });
      
      setAllCarsForSorting(filteredAllCars);
      lastSortParamsRef.current = sortKey;
      console.log(`✅ Global sorting: Loaded ${filteredAllCars.length} cars for sorting across all pages`);
    } catch (err) {
      console.error('❌ Error fetching all cars for global sorting:', err);
      setIsSortingGlobal(false);
      setAllCarsForSorting([]);
    } finally {
      setIsLoading(false);
      fetchingSortRef.current = false;
    }
  }, [totalCount, fetchAllCars, filters.grade_iaai, filters.manufacturer_id, filters.model_id, filters.generation_id, filters.from_year, filters.to_year, sortBy, filteredCars, totalPages]);

  const handleManufacturerChange = async (manufacturerId: string) => {
    console.log(`[handleManufacturerChange] Called with manufacturerId: ${manufacturerId}`);
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
      // Only fetch models and cars, skip duplicate calls for grades/trim levels
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
      
      // Fetch cars with new filters - remove per_page duplicates
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
    
    if (filters.grade_iaai && filters.grade_iaai !== 'all' && filteredCars.length > 0) {
      effectiveTotal = filteredCars.length;
      effectivePages = Math.ceil(filteredCars.length / 50);
    }
    
    setTotalPages(effectivePages);
  }, [totalCount, filteredCars, filters.grade_iaai]);

  // Fetch all cars for sorting when sortBy changes OR when totalCount first becomes available
  // This ensures global sorting works on initial load and when sort options change
  useEffect(() => {
    if (totalCount > 50 && !fetchingSortRef.current) {
      console.log(`🔄 Triggering global sorting: totalCount=${totalCount}, sortBy=${sortBy}`);
      fetchAllCarsForSorting();
    } else if (totalCount <= 50) {
      // Reset global sorting if not needed (small dataset)
      setIsSortingGlobal(false);
      setAllCarsForSorting([]);
    }
  }, [sortBy, totalCount, fetchAllCarsForSorting]);

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
        fixed lg:relative z-40 bg-card border-r transition-transform duration-300 ease-in-out
        ${showFilters ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'top-0 left-0 right-0 bottom-0 w-full h-dvh overflow-y-auto safe-area-inset' : 'w-80 sm:w-80 lg:w-72 h-full flex-shrink-0 overflow-y-auto'} 
        lg:shadow-none shadow-xl
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowFilters(false);
                  setHasExplicitlyClosed(true); // Mark as explicitly closed
                }}
                className={`lg:hidden flex items-center gap-1 ${isMobile ? 'h-6 px-1.5 hover:bg-primary-foreground/20 text-primary-foreground' : 'h-8 px-2'}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'mobile-filter-content mobile-filter-compact' : 'p-3 sm:p-4'}`}>
          <div className={`${isMobile ? '' : ''}`}>
            <EncarStyleFilter
            filters={filters}
            manufacturers={manufacturers}
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
              // Issue #2 FIXED: Hide filter panel after search and mark as explicitly closed
              // This prevents the panel from reopening until user manually opens it
              fetchCars(1, { ...filters, per_page: "50" }, true);
              setShowFilters(false); // Always hide filter panel when search button is clicked
              setHasExplicitlyClosed(true); // Mark as explicitly closed to prevent auto-reopening
            }}
            onCloseFilter={() => {
              setShowFilters(false);
              setHasExplicitlyClosed(true); // Mark as explicitly closed
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
            // Issue #2 FIXED: Allow closing filters anytime via overlay click and mark as explicitly closed
            setShowFilters(false);
            setHasExplicitlyClosed(true); // Mark as explicitly closed
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
                {/* Sort Control - smaller on mobile */}
                <div className="relative">
                  <ArrowUpDown className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none" />
                  <AdaptiveSelect
                    value={sortBy}
                    onValueChange={(value: SortOption) => {
                      setSortBy(value);
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
                {totalCount.toLocaleString()} cars {filters.grade_iaai && filters.grade_iaai !== 'all' ? `filtered by ${filters.grade_iaai}` : 'total'} • Page {currentPage} of {totalPages} • Showing {carsForCurrentPage.length} cars
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
          {(loading && cars.length === 0) || isRestoringState ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>
                {isRestoringState ? "Restoring your view..." : "Loading cars..."}
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
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg font-medium">Applying filters...</span>
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
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm font-medium text-foreground">Applying filters...</span>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-10 h-8"
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
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
