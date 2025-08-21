import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Grid,
  List,
  ArrowLeft,
  ArrowUpDown,
  Car,
} from "lucide-react";
import CarCard from "@/components/CarCard";
import { useSecureAuctionAPI } from "@/hooks/useSecureAuctionAPI";
import EncarStyleFilter from "@/components/EncarStyleFilter";

import { useSearchParams } from "react-router-dom";
import {
  useSortedCars,
  getSortOptions,
  SortOption,
} from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { supabase } from "@/integrations/supabase/client";
import { useServerCatalog, ServerSort } from "@/hooks/useServerCatalog";

interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
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
    loadMore,
  } = useSecureAuctionAPI();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("price_low");
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allCarsForSorting, setAllCarsForSorting] = useState<any[]>([]);
  const [isSortingGlobal, setIsSortingGlobal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useServerSide, setUseServerSide] = useState(() =>
    typeof window !== 'undefined' && window.location.hostname === 'localhost' ? false : true
  );
  const { cars: serverCars, totalCount: serverTotal, loading: serverLoading, error: serverError, fetchServerCars } = useServerCatalog();

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

  // Filter cars to remove test/emergency cars and apply grade filtering
  const filteredCars = useMemo(() => {
    // First filter out test/emergency cars (addressing the "18 test cars" issue)
    const realCars = cars.filter((car) => {
      // Remove cars with emergency or test IDs
      if (car.id && (
        car.id.startsWith('emergency-') || 
        car.id.startsWith('test-') || 
        car.id.startsWith('sample-') ||
        car.id.startsWith('mock-')
      )) {
        return false;
      }

      // Remove cars with test data indicators in external_id
      if (car.external_id && (
        car.external_id.startsWith('emergency-') || 
        car.external_id.startsWith('test-') || 
        car.external_id.startsWith('sample-') ||
        car.external_id.startsWith('mock-')
      )) {
        return false;
      }

      // Remove mock cars that have generic image URLs (likely test data)
      if (car.image_url && car.image_url.includes('unsplash.com') && 
          (!car.vin || car.vin.length < 10)) {
        return false;
      }

      return true;
    });

    // Apply grade filtering only if a specific grade is selected
    if (!filters.grade_iaai || filters.grade_iaai === 'all') {
      return realCars;
    }

    const filterGrade = filters.grade_iaai.toLowerCase().trim();
    
    return realCars.filter((car) => {
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
  const serverSortedCars = serverCars; // Server returns sorted already
  
  // Memoized current page cars from sorted results
  const carsForCurrentPage = useMemo(() => {
    return isSortingGlobal && allCarsForSorting.length > 0 
      ? sortedCars.slice((currentPage - 1) * 50, currentPage * 50)
      : sortedCars;
  }, [isSortingGlobal, allCarsForSorting.length, sortedCars, currentPage]);

  const effectiveCars = useMemo(() => useServerSide ? serverSortedCars : carsForCurrentPage, [useServerSide, serverSortedCars, carsForCurrentPage]);
  const effectiveTotal = useServerSide ? serverTotal : totalCount;

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
  >([]);

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

  const handleFiltersChange = useCallback((newFilters: APIFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    
    // Reset global sorting when filters change
    setIsSortingGlobal(false);
    setAllCarsForSorting([]);
    
    // Clear previous data immediately to show loading state
    setCars([]);
    
    // Use 50 cars per page for proper pagination
    const filtersWithPagination = {
      ...newFilters,
      per_page: "50" // Show 50 cars per page
    };
    
    if (useServerSide) {
      const serverFilters = {
        make_name: undefined as string | undefined,
        model_name: undefined as string | undefined,
        from_year: newFilters.from_year,
        to_year: newFilters.to_year,
        buy_now_price_from: newFilters.buy_now_price_from,
        buy_now_price_to: newFilters.buy_now_price_to,
        odometer_from_km: newFilters.odometer_from_km,
        odometer_to_km: newFilters.odometer_to_km,
        color_name: undefined as string | undefined,
        fuel_name: undefined as string | undefined,
        transmission_name: undefined as string | undefined,
        search: newFilters.search,
      };
      fetchServerCars(1, 50, sortBy as ServerSort, serverFilters);
    } else {
      fetchCars(1, filtersWithPagination, true);
    }

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
  }, [fetchCars, setSearchParams, useServerSide, fetchServerCars, sortBy]);

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
    
    if (useServerSide) {
      const serverFilters = {
        make_name: undefined as string | undefined,
        model_name: undefined as string | undefined,
        from_year: filters.from_year,
        to_year: filters.to_year,
        buy_now_price_from: filters.buy_now_price_from,
        buy_now_price_to: filters.buy_now_price_to,
        odometer_from_km: filters.odometer_from_km,
        odometer_to_km: filters.odometer_to_km,
        color_name: undefined as string | undefined,
        fuel_name: undefined as string | undefined,
        transmission_name: undefined as string | undefined,
        search: filters.search,
      };
      fetchServerCars(page, 50, sortBy as ServerSort, serverFilters);
    } else {
      fetchCars(page, filtersWithPagination, true); // Reset list for new page
    }
    
    // Update URL with new page
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = page.toString();
    setSearchParams(currentParams);
  }, [filters, fetchCars, setSearchParams, useServerSide, fetchServerCars, sortBy]);

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
    
    // Safety cap to prevent huge blocking fetches that slow down the catalog
    const MAX_GLOBAL_SORT_CARS = 500;
    if (totalCount > MAX_GLOBAL_SORT_CARS) {
      setAllCarsForSorting([]);
      setIsSortingGlobal(false);
      return;
    }

    setIsSortingGlobal(true);
    
    try {
      // Use the API hook to fetch all cars
      const allCarsFilters = {
        ...filters,
        // Fetch up to the cap amount
        per_page: Math.min(totalCount, 500).toString()
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
      
      // Apply the same filtering as current cars - remove test cars and apply grade filtering
      const filteredAllCars = allCars.filter((car: any) => {
        // Filter out test/emergency cars (same logic as in filteredCars)
        if (car.id && (
          car.id.startsWith('emergency-') || 
          car.id.startsWith('test-') || 
          car.id.startsWith('sample-') ||
          car.id.startsWith('mock-')
        )) {
          return false;
        }

        if (car.external_id && (
          car.external_id.startsWith('emergency-') || 
          car.external_id.startsWith('test-') || 
          car.external_id.startsWith('sample-') ||
          car.external_id.startsWith('mock-')
        )) {
          return false;
        }

        if (car.image_url && car.image_url.includes('unsplash.com') && 
            (!car.vin || car.vin.length < 10)) {
          return false;
        }

        // Apply grade filtering if specified
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
    setModels([]);
    setGenerations([]);
    try {
      if (manufacturerId) {
        console.log(`[handleManufacturerChange] Fetching models...`);
        const modelData = await fetchModels(manufacturerId);
        console.log(`[handleManufacturerChange] Received modelData:`, modelData);
        console.log(`[handleManufacturerChange] Setting models to:`, modelData);
        setModels(modelData);
      }
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
      setLoadedPages(1);
      handleFiltersChange(newFilters);
    } catch (error) {
      console.error('[handleManufacturerChange] Error:', error);
      setModels([]);
      setGenerations([]);
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
    setGenerations([]);
    try {
      if (!modelId) {
        const newFilters: APIFilters = {
          ...filters,
          model_id: undefined,
          generation_id: undefined,
          grade_iaai: undefined,
        };
        setLoadedPages(1);
        handleFiltersChange(newFilters);
        setIsLoading(false);
        return;
      }
      const generationData = await fetchGenerations(modelId);
      setGenerations(generationData);
      const newFilters: APIFilters = {
        ...filters,
        model_id: modelId,
        generation_id: undefined,
        grade_iaai: undefined,
      };
      setLoadedPages(1);
      handleFiltersChange(newFilters);
    } catch (error) {
      setGenerations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerationChange = async (generationId: string) => {
    setIsLoading(true);
    try {
      if (!generationId) {
        const newFilters: APIFilters = {
          ...filters,
          generation_id: undefined,
          grade_iaai: undefined,
        };
        setLoadedPages(1);
        handleFiltersChange(newFilters);
        setIsLoading(false);
        return;
      }
      const newFilters: APIFilters = {
        ...filters,
        generation_id: generationId,
        grade_iaai: undefined,
      };
      setLoadedPages(1);
      handleFiltersChange(newFilters);
    } catch (error) {
      // nothing
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

      // Set default manufacturer_id=9 if no filters in URL
      if (Object.keys(urlFilters).length === 0) {
        urlFilters.manufacturer_id = "9";
      }

      // Set search term from URL
      if (urlFilters.search) {
        setSearchTerm(urlFilters.search);
      }

      // Set filters immediately for faster UI response
      setFilters(urlFilters);
      setLoadedPages(urlLoadedPages);

      // Load data in parallel for faster loading
      const loadPromises = [
        fetchManufacturers().then(setManufacturers)
      ];

      // Load dependent data only if needed
      if (urlFilters.manufacturer_id) {
        loadPromises.push(
          fetchModels(urlFilters.manufacturer_id).then(setModels)
        );
      }

      if (urlFilters.model_id) {
        loadPromises.push(
          fetchGenerations(urlFilters.model_id).then(setGenerations)
        );
      }

      // Wait for all data to load
      await Promise.all(loadPromises);

      // Load cars with optimized pagination - only load current page
      const initialFilters = {
        ...urlFilters,
        per_page: "50"
      };
      if (useServerSide) {
        await fetchServerCars(1, 50, sortBy as ServerSort, {} as any);
      } else {
        await fetchCars(1, initialFilters, true);
      }

      setIsRestoringState(false);

      // Quick scroll restoration
      const savedData = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (savedData) {
        try {
          const { scrollTop, timestamp } = JSON.parse(savedData);
          const isRecent = Date.now() - timestamp < 30000;
          
          if (isRecent && scrollTop > 0) {
            window.scrollTo({ top: scrollTop, behavior: 'auto' });
          }
        } catch (error) {
          // Ignore scroll restoration errors
        }
      }
    };

    loadInitialData();
  }, [useServerSide, fetchServerCars, fetchCars, sortBy]); // re-run if toggle changes

  // Save scroll position when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save scroll position on navigation
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Save scroll position periodically while scrolling
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 150); // Debounce scroll saving
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [filters, loadedPages]); // Re-run when filters or pages change

  // Load filter counts when filters or manufacturers change
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

    loadFilterCounts();
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

  // Calculate total pages considering server/client mode
  useEffect(() => {
    if (useServerSide) {
      const pages = Math.max(1, Math.ceil(serverTotal / 50));
      setTotalPages(pages);
    } else {
      let effectivePages = Math.ceil(totalCount / 50);
      if (filters.grade_iaai && filters.grade_iaai !== 'all' && filteredCars.length > 0) {
        effectivePages = Math.ceil(filteredCars.length / 50);
      }
      setTotalPages(effectivePages);
    }
  }, [useServerSide, serverTotal, totalCount, filteredCars, filters.grade_iaai]);

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

  // Show cars when brand is selected - enable real brand filtering before model selection
  const shouldShowCars = useServerSide || filters.manufacturer_id;

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

  return (
    <div className="container-responsive py-4 sm:py-6">
      {/* Header Section - More compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Car Catalog
            </h1>
            <p className="text-muted-foreground text-sm">
              {totalCount.toLocaleString()} cars {filters.grade_iaai && filters.grade_iaai !== 'all' ? `filtered by ${filters.grade_iaai}` : 'total'} • Page {currentPage} of {totalPages} • Showing {carsForCurrentPage.length} cars
            </p>
          </div>
        </div>

        {/* Quick Search + View Mode Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-64">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Search model, trim, keywords..."
              className="h-8"
            />
            <Button size="sm" className="h-8" onClick={handleSearch}>
              <Search className="h-3 w-3 mr-1" />
              Search
            </Button>
          </div>
          <Button
            variant={useServerSide ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            onClick={() => {
              setUseServerSide(!useServerSide);
              // refresh current view via server or client accordingly
              handlePageChange(1);
            }}
            title="Toggle server-side filtering/sorting"
          >
            {useServerSide ? 'Server' : 'Client'}
          </Button>

          {/* View Mode Toggle */}
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Form with Sort - More compact */}
      <div className="mb-4 space-y-3">
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
        />
        

        {/* Sort Control - positioned under filters, right side */}
        <div className="flex justify-end">
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => {
              setSortBy(value);
              // No need to re-fetch since we're using client-side sorting
            }}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <ArrowUpDown className="h-3 w-3 mr-2" />
              <SelectValue placeholder="Rreshtoni sipas..." />
            </SelectTrigger>
            <SelectContent>
              {getSortOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {(useServerSide ? serverError : error) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
          <p className="text-destructive font-medium">Error: {(useServerSide ? serverError : error) as any}</p>
        </div>
      )}



      {/* Loading State */}
      {(((useServerSide ? serverLoading : loading) && (useServerSide ? serverCars.length === 0 : cars.length === 0)) || isRestoringState) ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>
            {isRestoringState ? "Restoring your view..." : "Loading cars..."}
          </span>
        </div>
      ) : null}

      {/* No Selection State */}
      {!shouldShowCars && !(useServerSide ? serverLoading : loading) && !isRestoringState && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Zgjidhni markën</h3>
            <p className="text-muted-foreground mb-6">
              Për të parë makinat, ju duhet të zgjidhni së paku markën e makinës.
            </p>
          </div>
        </div>
      )}

      {/* No Results State */}
      {shouldShowCars && !(useServerSide ? serverLoading : loading) && !isRestoringState && (useServerSide ? serverCars.length === 0 : cars.length === 0) && (
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

      {/* Cars Grid/List - Show if brand is selected */}
      {shouldShowCars && (useServerSide ? serverCars.length > 0 : cars.length > 0) && (
        <>
          <div
            ref={containerRef}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4"
                : "space-y-3"
            }
          >
            {(useServerSide ? serverCars : carsForCurrentPage).map((car) => {
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
                  <CarCard
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
                    condition={car.condition?.replace("run_and_drives", "Good")}
                    lot={car.lot_number || lot?.lot || ""}
                    title={car.title || ""}
                    status={Number(car.status || lot?.status || 1)}
                    sale_status={car.sale_status || lot?.sale_status}
                    final_price={car.final_price || lot?.final_price}
                    generation={car.generation?.name}
                    body_type={car.body_type?.name}
                    engine={car.engine?.name}
                    drive_wheel={car.drive_wheel}
                    vehicle_type={car.vehicle_type?.name}
                    cylinders={car.cylinders}
                    bid={lot?.bid}
                    estimate_repair_price={lot?.estimate_repair_price}
                    pre_accident_price={lot?.pre_accident_price}
                    clean_wholesale_price={lot?.clean_wholesale_price}
                    actual_cash_value={lot?.actual_cash_value}
                    sale_date={lot?.sale_date}
                    seller={lot?.seller}
                    seller_type={lot?.seller_type}
                    detailed_title={lot?.detailed_title}
                    damage_main={lot?.damage?.main}
                    damage_second={lot?.damage?.second}
                    keys_available={lot?.keys_available}
                    airbags={lot?.airbags}
                    grade_iaai={lot?.grade_iaai}
                    domain={lot?.domain?.name}
                    external_id={lot?.external_id}
                    insurance={(lot as any)?.insurance}
                    insurance_v2={(lot as any)?.insurance_v2}
                    location={(lot as any)?.location}
                    inspect={(lot as any)?.inspect}
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
  );
};

export default EncarCatalog;
