import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/contexts/NavigationContext";
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
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";

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
  getEncarSortOptions,
  SortOption,
} from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchCarsWithKeyset, fetchCarsWithGlobalSort, mapFrontendSortToBackend, type FrontendSortOption } from "@/services/carsApi";
import { filterOutTestCars } from "@/utils/testCarFilter";
import { fallbackCars } from "@/data/fallbackData";

interface EncarCatalogProps {
  highlightCarId?: string | null;
}

const EncarCatalog = ({ highlightCarId }: EncarCatalogProps = {}) => {
  const { toast } = useToast();
  const { restorePageState } = useNavigation();
  
  // State for cars and backend sorting
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [filters, setFilters] = useState<any>({});
  
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [sortBy, setSortBy] = useState<SortOption>("recently_added");
  const [hasUserSelectedSort, setHasUserSelectedSort] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const isMobile = useIsMobile();
  
  // Initialize showFilters - always start closed
  const [showFilters, setShowFilters] = useState(false);
  const [hasExplicitlyClosed, setHasExplicitlyClosed] = useState(true);

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

  // Backend car fetching with global sorting across all pages
  const fetchCarsFromBackend = useCallback(async (
    newSortBy?: SortOption, 
    page?: number,
    reset: boolean = true
  ) => {
    setLoading(true);
    setError(null);
    
    const targetPage = page || currentPage;
    const targetSort = newSortBy || sortBy;
    
    try {
      console.log(`🔄 Fetching cars with global sort: ${targetSort}, page: ${targetPage}`);
      
      // Use global sort with page-based pagination for proper ranking
      const response = await fetchCarsWithGlobalSort({
        filters: {},
        sort: targetSort,
        limit: 50,
        page: targetPage
      });
      
      setCars(response.items);
      setTotalCount(response.total);
      
      // Calculate total pages
      const totalPages = Math.ceil(response.total / 50);
      setTotalPages(totalPages);
      
      // Validate current page is within bounds
      if (targetPage > totalPages && totalPages > 0) {
        console.warn(`⚠️ Page ${targetPage} exceeds total pages ${totalPages}, redirecting to page 1`);
        setCurrentPage(1);
        // Fetch page 1 instead
        const page1Response = await fetchCarsWithGlobalSort({
          filters: {},
          sort: targetSort,
          limit: 50,
          page: 1
        });
        setCars(page1Response.items);
      }
      
      console.log(`✅ Global sort complete: page ${targetPage}, ${response.items.length} cars, total: ${response.total}`);
      
    } catch (err) {
      console.error('❌ Error fetching cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      
      // Fallback to showing some cars if there's an error
      if (reset && cars.length === 0) {
        setCars(fallbackCars.slice(0, 50));
        setTotalCount(fallbackCars.length);
        setTotalPages(Math.ceil(fallbackCars.length / 50));
      }
    } finally {
      setLoading(false);
    }
  }, [sortBy, currentPage]);

  // Helper function to check if filters are in default "all brands" state
  const isDefaultState = useMemo(() => {
    if (!filters) return true;
    return Object.keys(filters).length === 0;
  }, [filters]);

  // Cars to display - directly from backend with global sorting
  const carsToDisplay = useMemo(() => {
    console.log(`📄 Displaying ${cars.length} globally sorted cars from backend`);
    return cars;
  }, [cars]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
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

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm("");
    setLoadedPages(1);
    setModels([]);
    setGenerations([]);
    setHasUserSelectedSort(false); // Reset to allow daily rotating cars again
    fetchCarsFromBackend('recently_added', 1, true);
    setSearchParams({});
  }, [fetchCarsFromBackend, setSearchParams]);

  const handleSearch = useCallback(() => {
    // For now, just reset filters since we're using simple backend sorting
    const newFilters = {
      search: searchTerm.trim() || undefined,
    };
    setFilters(newFilters);
    fetchCarsFromBackend(sortBy, 1, true);
  }, [searchTerm, sortBy, fetchCarsFromBackend]);

  const handlePageChange = useCallback((page: number) => {
    // Validate page number
    if (page < 1 || page > totalPages) {
      console.log(`⚠️ Invalid page number: ${page}. Must be between 1 and ${totalPages}`);
      return;
    }
    
    console.log(`📄 Changing to page ${page} with global sorting by ${sortBy}`);
    setCurrentPage(page);
    
    // Fetch the specific page with global sorting
    fetchCarsFromBackend(sortBy, page, true);
    
    // Update URL with new page
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = page.toString();
    const newSearchParams = new URLSearchParams(currentParams);
    setSearchParams(newSearchParams);
    
    // Save scroll position before page change
    saveScrollPosition();
    
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages, sortBy, fetchCarsFromBackend, searchParams, setSearchParams, saveScrollPosition]);

  // Load more cars (for infinite scroll or load more button)
  const handleLoadMore = useCallback(async () => {
    if (currentPage < totalPages && !loading) {
      const nextPage = currentPage + 1;
      console.log(`📄 Loading more cars: page ${nextPage}`);
      await fetchCarsFromBackend(sortBy, nextPage, false);
      setCurrentPage(nextPage);
    }
  }, [currentPage, totalPages, loading, sortBy, fetchCarsFromBackend]);

  // Handle sort option change with backend global sorting
  const handleSortChange = useCallback(async (newSortBy: SortOption) => {
    console.log(`🎯 Sort changed to: ${newSortBy} - applying global sorting across all pages`);
    setSortBy(newSortBy);
    setHasUserSelectedSort(true);
    setCurrentPage(1);
    
    // Fetch page 1 with new global sort - this ranks ALL cars and shows the first 50
    await fetchCarsFromBackend(newSortBy, 1, true);
    
    // Update URL to reflect new sort and reset to page 1
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', newSortBy);
    newParams.set('page', '1');
    setSearchParams(newParams);
  }, [fetchCarsFromBackend, searchParams, setSearchParams]);

  // Initialize component with backend cars
  useEffect(() => {
    let isMounted = true;
    
    const initializeCatalog = async () => {
      if (!isMounted) return;

      try {
        setIsRestoringState(true);
        
        // Get URL parameters for state
        const urlFilters = Object.fromEntries(searchParams.entries());
        const urlSortBy = (urlFilters.sortBy as SortOption) || 'recently_added';
        const urlPage = parseInt(urlFilters.page) || 1;
        
        // Set initial state
        setSortBy(urlSortBy);
        setCurrentPage(urlPage);
        
        if (urlSortBy !== 'recently_added') {
          setHasUserSelectedSort(true);
        }
        
        // Fetch cars with backend global sorting for the specified page
        await fetchCarsFromBackend(urlSortBy, urlPage, true);
        
        // Restore scroll position after a short delay
        setTimeout(() => {
          restoreScrollPosition();
        }, 500);
        
      } catch (error) {
        console.error('❌ Error initializing catalog:', error);
      } finally {
        if (isMounted) {
          setIsRestoringState(false);
        }
      }
    };

    initializeCatalog();

    return () => {
      isMounted = false;
    };
  }, [fetchCarsFromBackend, searchParams, restoreScrollPosition]); // Run only once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Filter Panel - Mobile slide-out */}
      <div
        ref={filterPanelRef}
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-card border-r shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          showFilters ? "translate-x-0" : "-translate-x-full"
        } lg:block`}
        style={{ zIndex: 1000 }}
      >
        {/* Filter content would go here */}
        <div className="h-full overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Basic filter controls */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} variant="outline" className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${showFilters ? "lg:ml-80" : ""}`}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                {showFilters ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
              <h1 className="text-xl font-semibold">
                Cars ({totalCount.toLocaleString()})
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <AdaptiveSelect
                value={sortBy}
                onValueChange={handleSortChange}
                options={getEncarSortOptions()}
                placeholder="Sort by"
                className="w-48"
              />
              
              {/* Catalog Lock Toggle (Mobile) */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCatalogLockToggle}
                  className="flex items-center gap-1"
                  title={catalogLocked ? "Unlock swipe gestures" : "Lock swipe gestures"}
                >
                  {catalogLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cars Grid */}
        <div ref={mainContentRef} className="p-4">
          {loading && cars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingLogo />
              <p className="text-muted-foreground mt-4">Loading cars with global sorting...</p>
            </div>
          ) : error && cars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Cars</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => fetchCarsFromBackend(sortBy, 1, true)}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {carsToDisplay.map((car, index) => (
                  <LazyCarCard
                    key={car.id || index}
                    id={car.id}
                    make={car.make?.name || car.make}
                    model={car.model?.name || car.model}
                    year={car.year}
                    price={car.price}
                    image={car.image_url}
                    vin={car.vin}
                    mileage={car.mileage?.toString()}
                    transmission={car.transmission?.name || car.transmission}
                    fuel={car.fuel?.name || car.fuel}
                    color={car.color?.name || car.color}
                    lot={car.lot_number || car.lots?.[0]?.lot || car.id}
                    title={car.title}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {currentPage < totalPages && !loading && (
                <div className="flex justify-center mt-8">
                  <Button onClick={handleLoadMore} variant="outline">
                    Load More Cars
                  </Button>
                </div>
              )}

              {/* Loading indicator for load more */}
              {loading && cars.length > 0 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile filter panel */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};

export default EncarCatalog;