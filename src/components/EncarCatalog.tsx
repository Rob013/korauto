import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import CarCard from "@/components/CarCard";
import { useSecureAuctionAPI } from "@/hooks/useSecureAuctionAPI";
import FilterForm from "@/components/FilterForm";
import { useSearchParams } from "react-router-dom";
import {
  useSortedCars,
  getSortOptions,
  SortOption,
} from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";

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
    fetchFilterCounts,
    fetchGrades,
    loadMore,
  } = useSecureAuctionAPI();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("price_low");
  const [searchParams, setSearchParams] = useSearchParams();

  // Apply filtering with proper grade filtering as backup
  const filteredCars = cars.filter((car) => {
    // If grade filter is applied, filter by grade
    if (filters.grade_iaai) {
      const carGrades: string[] = [];
      
      // Extract grades from lots
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach((lot: any) => {
          if (lot.grade_iaai) carGrades.push(lot.grade_iaai.trim());
        });
      }
      
      // Extract grades from title
      if (car.title) {
        const titleGrades = extractGradesFromTitle(car.title);
        carGrades.push(...titleGrades);
      }
      
      // Check if any car grade matches the filter
      const hasMatchingGrade = carGrades.some(grade => 
        grade.toLowerCase().includes(filters.grade_iaai!.toLowerCase()) ||
        filters.grade_iaai!.toLowerCase().includes(grade.toLowerCase())
      );
      
      if (!hasMatchingGrade) return false;
    }
    
    return true;
  });

  const carsForSorting = filteredCars.map((car) => ({
    ...car,
    status: String(car.status || ""),
    lot_number: String(car.lot_number || ""),
    cylinders: Number(car.cylinders || 0),
  }));
  
  const sortedCars = useSortedCars(carsForSorting, sortBy);

  // Helper function to extract grades from title
  const extractGradesFromTitle = (title: string): string[] => {
    const grades: string[] = [];
    const patterns = [
      /\b(\d{2,3}\s?(?:TDI|TFSI|FSI|TSI|CDI))\b/gi,
      /\b(\d+\.?\d*\s?[TD])\b/gi,
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
  };

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

  const handleFiltersChange = (newFilters: APIFilters) => {
    console.log('🔧 Filter change requested:', newFilters);
    
    setFilters(newFilters);
    setLoadedPages(1);
    
    // Clear previous data immediately to show loading state
    setCars([]);
    
    // Ensure all filters including grade_iaai are passed to API
    console.log('🔧 Sending filters to API:', newFilters);
    fetchCars(1, newFilters, true);

    // Update URL with all non-empty filter values - properly encode grade filter
    const paramsToSet: any = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        // Properly encode grade filter for URL
        paramsToSet[key] = key === 'grade_iaai' ? encodeURIComponent(value) : value;
      }
    });
    paramsToSet.loadedPages = "1";
    setSearchParams(paramsToSet);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setLoadedPages(1);
    setModels([]);
    setGenerations([]);
    fetchCars(1, {}, true);
    setSearchParams({});
  };

  const handleSearch = () => {
    const newFilters = {
      ...filters,
      search: searchTerm.trim() || undefined,
    };
    handleFiltersChange(newFilters);
  };

  const handleLoadMore = () => {
    loadMore();
    const newLoadedPages = loadedPages + 1;
    setLoadedPages(newLoadedPages);

    // Update URL with new pagination state
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.loadedPages = newLoadedPages.toString();
    setSearchParams(currentParams);
  };

  const handleManufacturerChange = async (manufacturerId: string) => {
    const modelData = manufacturerId ? await fetchModels(manufacturerId) : [];
    setModels(modelData);

    const newFilters: APIFilters = {
      ...filters,
      manufacturer_id: manufacturerId || undefined,
      model_id: undefined,
      generation_id: undefined,
    };
    setGenerations([]);
    setLoadedPages(1); // Reset pagination when manufacturer changes
    handleFiltersChange(newFilters);
  };

  const handleModelChange = async (modelId: string) => {
    const generationData = modelId ? await fetchGenerations(modelId) : [];
    setGenerations(generationData);

    const newFilters: APIFilters = {
      ...filters,
      model_id: modelId || undefined,
      generation_id: undefined,
    };
    setLoadedPages(1); // Reset pagination when model changes
    handleFiltersChange(newFilters);
  };

  // Initialize filters from URL params on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsRestoringState(true);

      // Always start at the top when loading catalog
      console.log('📊 Catalog: Component mounting, forcing scroll to top');
      window.scrollTo({ top: 0, behavior: 'auto' });

      // Load manufacturers first
      const manufacturerData = await fetchManufacturers();
      setManufacturers(manufacturerData);

      // Get filters and pagination state from URL parameters
      const urlFilters: APIFilters = {};
      let urlLoadedPages = 1;

      for (const [key, value] of searchParams.entries()) {
        if (key === "loadedPages") {
          urlLoadedPages = parseInt(value) || 1;
        } else if (value && key !== "loadedPages") {
          // Fix URL encoding issues - replace + with spaces for grade filter
          const decodedValue = key === 'grade_iaai' ? decodeURIComponent(value.replace(/\+/g, ' ')) : value;
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

      // Load dependent data based on URL filters
      if (urlFilters.manufacturer_id) {
        const models = await fetchModels(urlFilters.manufacturer_id);
        setModels(models);
      }

      if (urlFilters.model_id) {
        const generations = await fetchGenerations(urlFilters.model_id);
        setGenerations(generations);
      }

      // Set filters and pagination state
      setFilters(urlFilters);
      setLoadedPages(urlLoadedPages);

      // Restore multiple pages if needed
      if (urlLoadedPages > 1) {
        // First load page 1
        await fetchCars(1, urlFilters, true);

        // Then load additional pages
        for (let page = 2; page <= urlLoadedPages; page++) {
          await fetchCars(page, urlFilters, false);
        }
      } else {
        // Just load page 1
        await fetchCars(1, urlFilters, true);
      }

      setIsRestoringState(false);

      // Only restore scroll if this is a returning visit to the same page
      // and not coming from homepage generation selection
      const savedData = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      const shouldRestoreScroll = savedData && 
        window.location.search === new URLSearchParams(savedData ? JSON.parse(savedData).filters || {} : {}).toString();
      
      console.log('📊 Catalog: Scroll decision', { savedData: !!savedData, shouldRestoreScroll, currentURL: window.location.search });
      
      if (shouldRestoreScroll) {
        console.log('📊 Catalog: Restoring scroll position');
        setTimeout(() => {
          restoreScrollPosition();
        }, 300);
      } else {
        // Clear any old scroll data and ensure we stay at top
        console.log('📊 Catalog: Clearing scroll data and staying at top');
        sessionStorage.removeItem(SCROLL_STORAGE_KEY);
        setTimeout(() => {
          console.log('📊 Catalog: Final scroll to top');
          window.scrollTo({ top: 0, behavior: 'auto' });
        }, 300);
      }
    };

    loadInitialData();
  }, []); // Only run on mount

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
        <div className="flex items-center gap-3">
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
              {sortedCars.length.toLocaleString()} cars {filters.grade_iaai ? `filtered by ${filters.grade_iaai}` : 'total'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
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
        <FilterForm
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
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
          onFetchGrades={fetchGrades}
        />

        {/* Sort Control - positioned under filters, right side */}
        <div className="flex justify-end">
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
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

      {/* No Results State */}
      {!loading && !isRestoringState && cars.length === 0 && (
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

      {/* Cars Grid/List - More compact grid */}
      {cars.length > 0 && (
        <>
          <div
            ref={containerRef}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4"
                : "space-y-3"
            }
          >
            {sortedCars.map((car) => {
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

          {/* Load More - More compact */}
          {hasMorePages && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
                size="default"
                className="px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  `Load More Cars`
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EncarCatalog;
