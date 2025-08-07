import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import React from "react";
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
import { debounce, throttle } from "@/utils/performance";

import { useSearchParams } from "react-router-dom";
import {
  useSortedCars,
  getSortOptions,
  SortOption,
} from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  trim_level?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  search?: string;
  seats_count?: string;
}

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
    hasMorePages,
    fetchCars,
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

  // Memoized helper function to extract grades from title
  const extractGradesFromTitle = useCallback((title: string): string[] => {
    const grades: string[] = [];
    const patterns = [
      /\b(\d+\.?\d*\s?(?:TDI|TFSI|FSI|TSI|CDI|T|D|I|E|H))\b/gi, // Include all engine types
      /\b(\d+\.?\d*)\s*l?i?t?e?r?\s*(?:TDI|TFSI|FSI|TSI|CDI|T|D|I|E|H)\b/gi,
      /\b(\d+\.?\d*[iIdDeEhH])\b/gi, // Specific patterns for all engine types: 520i, 530d, 530e, etc.
      /\b(\d+\.?\d*)\s*(?:hybrid|electric|diesel|petrol|gasoline)\b/gi, // Full word variants
    ];
    
    patterns.forEach(pattern => {
      const matches = title.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim();
          if (cleaned && !grades.includes(cleaned)) {
            grades.push(cleaned);
          }
        });
      }
    });
    
    return grades;
  }, []);

  // Memoized client-side grade filtering for better performance
  const filteredCars = useMemo(() => {
    if (!filters.grade_iaai || filters.grade_iaai === 'all') {
      return cars;
    }

    const filterGrade = filters.grade_iaai.toLowerCase().trim();
    
    return cars.filter((car) => {
      const carGrades: string[] = [];
      
      // Extract grades from lots (primary source)
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach((lot: any) => {
          if (lot.grade_iaai) carGrades.push(lot.grade_iaai.trim().toLowerCase());
        });
      }
      
      // Extract grades from title
      if (car.title) {
        const titleGrades = extractGradesFromTitle(car.title);
        carGrades.push(...titleGrades.map(g => g.toLowerCase()));
      }
      
      // Extract grades from engine field
      if (car.engine && car.engine.name) {
        carGrades.push(car.engine.name.trim().toLowerCase());
      }
      
      // More comprehensive matching for grades
      return carGrades.some(grade => {
        // Exact match
        if (grade === filterGrade) return true;
        
        // Partial match - both directions
        if (grade.includes(filterGrade) || filterGrade.includes(grade)) return true;
        
        // Remove spaces and try again
        const gradeNoSpaces = grade.replace(/\s+/g, '');
        const filterNoSpaces = filterGrade.replace(/\s+/g, '');
        if (gradeNoSpaces === filterNoSpaces) return true;
        
        // Handle special cases like "30 TDI" vs "30"
        const gradeParts = grade.split(/\s+/);
        const filterParts = filterGrade.split(/\s+/);
        if (gradeParts.some(part => filterParts.includes(part))) return true;
        
        return false;
      });
    });
  }, [cars, filters.grade_iaai, extractGradesFromTitle]);
  
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

  // Save current scroll position
  const saveScrollPosition = () => {
    if (containerRef.current) {
      const scrollData = {
        scrollTop: window.scrollY,
        timestamp: Date.now(),
        filters: filters,
        loadedPages: loadedPages,
      };
      sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(scrollData));
    }
  };

  // Restore scroll position
  const restoreScrollPosition = () => {
    const savedData = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedData) {
      try {
        const { scrollTop, timestamp } = JSON.parse(savedData);
        
        // Only restore if the saved data is recent (within 30 seconds)
        // This prevents restoring old scroll positions from previous sessions
        const isRecent = Date.now() - timestamp < 30000;
        
        if (isRecent && scrollTop > 0) {
          // Smooth scroll to saved position
          window.scrollTo({
            top: scrollTop,
            behavior: "smooth",
          });
          console.log(`📍 Restored scroll position to ${scrollTop}px`);
        } else {
          // Stay at top if data is old or position is 0
          window.scrollTo({ top: 0, behavior: 'auto' });
          console.log(`📍 Starting at top - data too old or position was 0`);
        }
      } catch (error) {
        console.error("Failed to restore scroll position:", error);
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  };

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

  // Internal function to actually apply filters
  const applyFiltersInternal = useCallback((newFilters: APIFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    
    // Reset global sorting when filters change
    setIsSortingGlobal(false);
    setAllCarsForSorting([]);
    
    // Use 50 cars per page for proper pagination
    const filtersWithPagination = {
      ...newFilters,
      per_page: "50" // Show 50 cars per page
    };
    
    fetchCars(1, filtersWithPagination, true);

    // Update URL with all non-empty filter values - properly encode grade filter
    const paramsToSet: any = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        // Properly encode grade filter for URL
        paramsToSet[key] = key === 'grade_iaai' ? encodeURIComponent(value) : value;
      }
    });
    paramsToSet.page = "1";
    setSearchParams(paramsToSet);
  }, [fetchCars, setSearchParams]);

  // Debounced version for performance
  const debouncedApplyFilters = useCallback(
    debounce(applyFiltersInternal, 300),
    [applyFiltersInternal]
  );

  const handleFiltersChange = useCallback((newFilters: APIFilters) => {
    // Use React's concurrent features for better performance
    React.startTransition(() => {
      setFilters(newFilters);
    });
    
    // Clear previous data immediately to show loading state
    React.startTransition(() => {
      setCars([]);
    });
    
    // Apply filters with optimized debouncing
    debouncedApplyFilters(newFilters);
  }, [debouncedApplyFilters]);

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
    
    // Fetch cars for the specific page
    const filtersWithPagination = {
      ...filters,
      per_page: "50"
    };
    
    fetchCars(page, filtersWithPagination, true); // Reset list for new page
    
    // Update URL with new page
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = page.toString();
    setSearchParams(currentParams);
  }, [filters, fetchCars, setSearchParams]);

  const handleLoadMore = () => {
    // For backward compatibility, load next page
    handlePageChange(currentPage + 1);
  };

  // Function to fetch all cars for sorting across all pages
  const fetchAllCarsForSorting = async () => {
    if (totalCount <= 50) {
      setAllCarsForSorting([]);
      setIsSortingGlobal(false);
      return;
    }
    
    setIsSortingGlobal(true);
    
    try {
      // Use the API hook to fetch all cars
      const allCarsFilters = {
        ...filters,
        per_page: totalCount.toString() // Fetch all cars at once
      };
      
      // Call the API using supabase functions
      const { data, error } = await supabase.functions.invoke('secure-cars-api', {
        body: {
          endpoint: 'cars',
          filters: allCarsFilters,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }
      const allCars = data.data || [];
      
      // Apply the same filtering as current cars
      const filteredAllCars = allCars.filter((car: any) => {
        if (filters.grade_iaai && filters.grade_iaai !== 'all') {
          const lot = car.lots?.[0];
          const grade = lot?.grade_iaai;
          const title = car.title || lot?.detailed_title || '';
          const extractedGrades = grade ? [grade] : extractGradesFromTitle(title);
          return extractedGrades.some(g => 
            g.toLowerCase().includes(filters.grade_iaai.toLowerCase())
          );
        }
        return true;
      });
      
      setAllCarsForSorting(filteredAllCars);
    } catch (err) {
      setIsSortingGlobal(false);
      setAllCarsForSorting([]);
    }
  };

  const handleManufacturerChange = async (manufacturerId: string) => {
    console.log(`[handleManufacturerChange] Called with manufacturerId: ${manufacturerId}`);
    setIsLoading(true);
    
    // Batch state updates to reduce re-renders
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
    
    // Update state in a single batch
    React.startTransition(() => {
      setFilters(newFilters);
      setLoadedPages(1);
      setModels([]);
      setGenerations([]);
    });
    
    try {
      const tasks: Promise<any>[] = [];
      
      if (manufacturerId) {
        console.log(`[handleManufacturerChange] Fetching models...`);
        tasks.push(
          fetchModels(manufacturerId).then(modelData => {
            React.startTransition(() => {
              setModels(modelData);
            });
            return modelData;
          })
        );
      }
      
      // Fetch cars in parallel with models
      tasks.push(
        fetchCars(1, { ...newFilters, per_page: "50" }, true)
      );
      
      // Wait for all tasks but handle errors gracefully
      const results = await Promise.allSettled(tasks);
      const hasErrors = results.some(result => result.status === 'rejected');
      
      if (hasErrors) {
        console.warn('[handleManufacturerChange] Some requests failed but continuing with partial data');
      }
      
      // Update URL after data operations
      const paramsToSet: any = {};
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          paramsToSet[key] = value.toString();
        }
      });
      setSearchParams(paramsToSet);
      
    } catch (error) {
      console.error('[handleManufacturerChange] Error:', error);
      React.startTransition(() => {
        setModels([]);
        setGenerations([]);
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add useEffect to log models change
  useEffect(() => {
    console.log(`[EncarCatalog] Models state updated:`, models);
  }, [models]);

  const handleModelChange = async (modelId: string) => {
    setIsLoading(true);
    
    // Create new filters and batch state updates
    const newFilters: APIFilters = {
      ...filters,
      model_id: modelId,
      generation_id: undefined,
      grade_iaai: undefined,
    };
    
    React.startTransition(() => {
      setFilters(newFilters);
      setLoadedPages(1);
      setGenerations([]);
    });
    
    try {
      if (!modelId) {
        await fetchCars(1, { ...newFilters, per_page: "50" }, true);
        return;
      }
      
      // Parallel execution of generations and cars loading
      const tasks = [
        fetchGenerations(modelId).then(generationData => {
          React.startTransition(() => {
            setGenerations(generationData);
          });
          return generationData;
        }),
        fetchCars(1, { ...newFilters, per_page: "50" }, true)
      ];
      
      const results = await Promise.allSettled(tasks);
      const hasErrors = results.some(result => result.status === 'rejected');
      
      if (hasErrors) {
        console.warn('[handleModelChange] Some requests failed but continuing with partial data');
      }
      
      // Update URL after successful operations
      const paramsToSet: any = {};
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          paramsToSet[key] = value.toString();
        }
      });
      setSearchParams(paramsToSet);
      
    } catch (error) {
      console.error('[handleModelChange] Error:', error);
      React.startTransition(() => {
        setGenerations([]);
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerationChange = async (generationId: string) => {
    setIsLoading(true);
    
    // Create new filters and batch state updates
    const newFilters: APIFilters = {
      ...filters,
      generation_id: generationId,
      grade_iaai: undefined,
    };
    
    React.startTransition(() => {
      setFilters(newFilters);
      setLoadedPages(1);
    });
    
    try {
      // Single optimized API call for cars
      await fetchCars(1, { ...newFilters, per_page: "50" }, true);
      
      // Update URL after successful data fetch
      const paramsToSet: any = {};
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          paramsToSet[key] = value.toString();
        }
      });
      setSearchParams(paramsToSet);
      
    } catch (error) {
      console.error('[handleGenerationChange] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize filters from URL params on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsRestoringState(true);

      // Get filters and pagination state from URL parameters
      const urlFilters: APIFilters = {};
      let urlLoadedPages = 1;

      for (const [key, value] of searchParams.entries()) {
        if (key === "loadedPages") {
          urlLoadedPages = parseInt(value) || 1;
        } else if (value && key !== "loadedPages") {
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

      // Set initial state immediately for faster UI response
      if (urlFilters.search) {
        setSearchTerm(urlFilters.search);
      }
      setFilters(urlFilters);
      setLoadedPages(urlLoadedPages);

      // Start with manufacturers loading immediately
      const manufacturersPromise = fetchManufacturers().then(setManufacturers);

      // Create optimized loading strategy based on what filters are present
      const loadingTasks: Promise<any>[] = [manufacturersPromise];

      // Only load dependent data if we have the required parent filters
      if (urlFilters.manufacturer_id && urlFilters.model_id) {
        // If we have both manufacturer and model, load them in parallel
        loadingTasks.push(
          fetchModels(urlFilters.manufacturer_id).then(setModels),
          fetchGenerations(urlFilters.model_id).then(setGenerations)
        );
      } else if (urlFilters.manufacturer_id) {
        // If we only have manufacturer, load models after manufacturers
        loadingTasks.push(
          manufacturersPromise.then(() => 
            fetchModels(urlFilters.manufacturer_id!).then(setModels)
          )
        );
      }

      // Start loading cars immediately while other data loads
      const initialFilters = {
        ...urlFilters,
        per_page: "50"
      };
      
      const carsPromise = fetchCars(1, initialFilters, true);
      loadingTasks.push(carsPromise);

      // Load all data in parallel and handle errors gracefully
      try {
        await Promise.allSettled(loadingTasks);
      } catch (error) {
        console.warn('Some data failed to load during restoration:', error);
        // Continue with partial data rather than failing completely
      }

      setIsRestoringState(false);

      // Defer scroll restoration to not block the UI
      setTimeout(() => {
        const savedData = sessionStorage.getItem(SCROLL_STORAGE_KEY);
        if (savedData) {
          try {
            const { scrollTop, timestamp } = JSON.parse(savedData);
            const isRecent = Date.now() - timestamp < 30000;
            
            if (isRecent && scrollTop > 0) {
              window.scrollTo({ 
                top: scrollTop, 
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
              });
            }
          } catch (error) {
            // Ignore scroll restoration errors silently
          }
        }
      }, 100); // Small delay to ensure DOM is ready
    };

    loadInitialData();
  }, []); // Only run on mount

  // Save scroll position when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Optimized scroll position saving with throttling
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = throttle(() => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 300); // Reduced frequency for better performance
    }, 150); // Throttle scroll events

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [filters, loadedPages]); // Re-run when filters or pages change

  // Load filter counts when filters or manufacturers change - with optimized debouncing
  useEffect(() => {
    const loadFilterCounts = async () => {
      if (manufacturers.length > 0) {
        setLoadingCounts(true);
        try {
          const counts = await fetchFilterCounts(filters, manufacturers);
          setFilterCounts(counts);
        } finally {
          setLoadingCounts(false);
        }
      }
    };

    // Increased debounce time to reduce API calls during rapid filter changes
    const timeoutId = setTimeout(loadFilterCounts, 500);
    return () => clearTimeout(timeoutId);
  }, [filters, manufacturers]);

  useEffect(() => {
    const loadInitialCounts = async () => {
      if (manufacturers.length > 0) {
        setLoadingCounts(true);
        try {
          const counts = await fetchFilterCounts({}, manufacturers);
          setFilterCounts(counts);
        } finally {
          setLoadingCounts(false);
        }
      }
    };

    loadInitialCounts();
  }, [manufacturers]);

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

  // Fetch all cars for sorting when sortBy changes and we have multiple pages
  useEffect(() => {
    if (totalPages > 1 && totalCount > 50 && (!filters.grade_iaai || filters.grade_iaai === 'all')) {
      fetchAllCarsForSorting();
    } else {
      // Reset global sorting if not needed or if grade filter is active
      setIsSortingGlobal(false);
      setAllCarsForSorting([]);
    }
  }, [sortBy, totalPages, totalCount, filters.grade_iaai]);

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
            generations={generations}
            filterCounts={filterCounts}
            loadingCounts={loadingCounts}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            onManufacturerChange={handleManufacturerChange}
            onModelChange={handleModelChange}
            onGenerationChange={handleGenerationChange}
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
              </p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
              <p className="text-destructive font-medium">Error: {error}</p>
            </div>
          )}

          {/* Loading State - Enhanced for restoration */}
          {(loading && cars.length === 0) || isRestoringState ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2 mb-2" />
              <span className="text-base font-medium">
                {isRestoringState ? "Restoring your view..." : "Loading cars..."}
              </span>
              {isRestoringState && (
                <p className="text-sm text-muted-foreground mt-1">
                  Applying your previous filters and settings
                </p>
              )}
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
          {shouldShowCars && !loading && !isRestoringState && cars.length === 0 && (
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

          {/* Cars Grid/List - Show cars without requiring filters */}
          {shouldShowCars && cars.length > 0 && (
            <>
              <div
                ref={containerRef}
                className={`grid mobile-car-grid-compact sm:mobile-car-grid gap-2 sm:gap-3 lg:gap-4 transition-all duration-300 ${
                  showFilters 
                    ? 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                    : 'lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7'
                }`}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncarCatalog;
