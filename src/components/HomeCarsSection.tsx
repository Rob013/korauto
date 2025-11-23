// @ts-nocheck
import LazyCarCard from "./LazyCarCard";
import { resolveFuelFromSources } from "@/utils/fuel";
import { memo, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useSecureAuctionAPI } from "@/hooks/useSecureAuctionAPI";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useInView } from "@/hooks/useInView";
import { useSortedCars, getSortOptions, SortOption } from "@/hooks/useSortedCars";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import EncarStyleFilter from "@/components/EncarStyleFilter";
import { useDailyRotatingCars } from "@/hooks/useDailyRotatingCars";
import { filterOutTestCars } from "@/utils/testCarFilter";
import { calculateFinalPriceEUR, filterCarsWithBuyNowPricing, filterCarsWithRealPricing } from "@/utils/carPricing";
import { fallbackCars, fallbackManufacturers } from "@/data/fallbackData";
import { cn } from "@/lib/utils";
import { useSmoothListTransition } from "@/hooks/useSmoothListTransition";
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
  max_accidents?: string;
  per_page?: string;
}
const HomeCarsSection = memo(() => {
  const navigate = useNavigate();
  const {
    ref,
    isInView
  } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  const {
    cars,
    loading,
    error,
    fetchCars,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchFilterCounts,
    fetchGrades,
    fetchTrimLevels,
    refreshInventory
  } = useSecureAuctionAPI();
  const {
    convertUSDtoEUR,
    exchangeRate
  } = useCurrencyAPI();
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showAllCars, setShowAllCars] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<APIFilters>({});
  const [pendingFilters, setPendingFilters] = useState<APIFilters>({});
  const [manufacturers, setManufacturers] = useState<{
    id: number;
    name: string;
    car_count?: number;
    cars_qty?: number;
  }[]>([]);
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

  // Cache for API data to improve performance
  const [dataCache, setDataCache] = useState<{
    manufacturers?: {
      id: number;
      name: string;
      car_count?: number;
      cars_qty?: number;
    }[];
    models?: {
      [manufacturerId: string]: {
        id: number;
        name: string;
        car_count?: number;
        cars_qty?: number;
      }[];
    };
    generations?: {
      [modelId: string]: {
        id: number;
        name: string;
        manufacturer_id?: number;
        model_id?: number;
        from_year?: number;
        to_year?: number;
        cars_qty?: number;
      }[];
    };
    lastUpdated?: number;
  }>({});

  // Performance optimization: debounced API calls
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false);

  // Frontend filtering function
  const applyFrontendFilters = (cars: any[], filters: APIFilters) => {
    return cars.filter(car => {
      // Manufacturer filter
      if (filters.manufacturer_id && car.manufacturer?.id !== parseInt(filters.manufacturer_id)) {
        return false;
      }

      // Model filter
      if (filters.model_id && car.model?.id !== parseInt(filters.model_id)) {
        return false;
      }

      // Generation filter
      if (filters.generation_id && car.generation?.id !== parseInt(filters.generation_id)) {
        return false;
      }

      // Color filter
      if (filters.color && (car.color?.name || '').toLowerCase() !== filters.color.toLowerCase()) {
        return false;
      }

      // Fuel type filter
      const carFuel = resolveFuelFromSources(car, car.lots?.[0]);
      if (filters.fuel_type && (carFuel || '').toLowerCase() !== filters.fuel_type.toLowerCase()) {
        return false;
      }

      // Transmission filter
      if (filters.transmission && (car.transmission?.name || '').toLowerCase() !== filters.transmission.toLowerCase()) {
        return false;
      }

      // Year range filters
      if (filters.from_year && car.year < parseInt(filters.from_year)) {
        return false;
      }
      if (filters.to_year && car.year > parseInt(filters.to_year)) {
        return false;
      }

      // Price filter (using lot buy_now price)
      const carPrice = car.lots?.[0]?.buy_now;
      if (filters.buy_now_price_from && carPrice && carPrice < parseInt(filters.buy_now_price_from)) {
        return false;
      }
      if (filters.buy_now_price_to && carPrice && carPrice > parseInt(filters.buy_now_price_to)) {
        return false;
      }

      // Mileage filter
      const carMileage = car.lots?.[0]?.odometer?.km;
      if (filters.odometer_from_km && carMileage && carMileage < parseInt(filters.odometer_from_km)) {
        return false;
      }
      if (filters.odometer_to_km && carMileage && carMileage > parseInt(filters.odometer_to_km)) {
        return false;
      }

      // Grade filter (check lots array for grade_iaai)
      if (filters.grade_iaai && filters.grade_iaai !== 'all') {
        const targetGrade = filters.grade_iaai.toLowerCase().trim();
        let hasMatchingGrade = false;

        // Check in lots array
        if (car.lots && Array.isArray(car.lots)) {
          hasMatchingGrade = car.lots.some((lot: any) =>
            lot.grade_iaai && (lot.grade_iaai || '').toString().toLowerCase().includes(targetGrade)
          );
        }

        // Check in single lot object
        if (!hasMatchingGrade && car.lot && car.lot.grade_iaai) {
          hasMatchingGrade = (car.lot.grade_iaai || '').toString().toLowerCase().includes(targetGrade);
        }

        // Check in car title for grade patterns
        if (!hasMatchingGrade && car.title) {
          hasMatchingGrade = (car.title || '').toString().toLowerCase().includes(targetGrade);
        }
        if (!hasMatchingGrade) {
          return false;
        }
      }

      // Search filter (search in make, model, title, VIN)
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const searchFields = [
          car.manufacturer?.name || '',
          car.model?.name || '',
          car.title || '',
          car.vin || ''
        ].filter(Boolean).join(" ").toLowerCase();
        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }

      // Seats count filter
      if (filters.seats_count && car.details?.seats_count !== parseInt(filters.seats_count)) {
        return false;
      }
      return true;
    });
  };

  // Type conversion to match the sorting hook interface - use fallback data if API fails
  const carsForSorting = useMemo(() => {
    // Use fallback data when there's an error and no cars loaded and we aren't loading
    const shouldUseFallback = !loading && (error || cars.length === 0);
    const sourceCars = shouldUseFallback ? fallbackCars : cars;
    const cleanedCars = filterOutTestCars(sourceCars);
    // Filter to show cars that have real pricing (buy_now, final_bid, or price)
    const carsWithRealPricing = filterCarsWithRealPricing(cleanedCars);

    return carsWithRealPricing.map(car => {
      // Calculate EUR price using current exchange rate from the best available price
      const lot = car.lots?.[0];
      const priceUSD = Number(lot?.buy_now || lot?.final_bid || lot?.price || (car as any).buy_now || (car as any).final_bid || (car as any).price || 0);
      const priceEUR = priceUSD > 0 ? calculateFinalPriceEUR(priceUSD, exchangeRate.rate) : 0;

      return {
        ...car,
        price_eur: priceEUR, // Add calculated EUR price
        status: String(car.status || ""),
        lot_number: String(car.lot_number || ""),
        cylinders: Number(car.cylinders || 0)
      };
    });
  }, [cars, error, exchangeRate.rate, loading]);

  // Check if any meaningful filters are applied (using pendingFilters for homepage)
  const hasFilters = useMemo(() => {
    return !!(pendingFilters.manufacturer_id || pendingFilters.model_id || pendingFilters.generation_id || pendingFilters.color || pendingFilters.fuel_type || pendingFilters.transmission || pendingFilters.odometer_from_km || pendingFilters.odometer_to_km || pendingFilters.from_year || pendingFilters.to_year || pendingFilters.buy_now_price_from || pendingFilters.buy_now_price_to || pendingFilters.search || pendingFilters.seats_count);
  }, [pendingFilters]);

  // Apply daily rotating cars when no filters are applied, showing 50 cars same as catalog
  const dailyRotatingCars = useDailyRotatingCars(carsForSorting, hasFilters, 50);

  // Use daily rotating cars when no filters, otherwise use sorted cars
  const carsToDisplay = useMemo(() => {
    if (!hasFilters) {
      return dailyRotatingCars;
    }
    // When filters are applied, use sorted cars
    return useSortedCars(carsForSorting, sortBy);
  }, [hasFilters, dailyRotatingCars, carsForSorting, sortBy]);

  // Show 50 cars by default (daily rotation) to match catalog
  const defaultDisplayCount = 50;

  // Memoize displayed cars to prevent unnecessary re-renders
  const displayedCars = useMemo(() => {
    if (!hasFilters) {
      // When no filters, show all daily rotating cars (already limited to 50)
      return showAllCars ? carsToDisplay : carsToDisplay.slice(0, defaultDisplayCount);
    }
    // When filters are applied, use the slice logic
    return showAllCars ? carsToDisplay : carsToDisplay.slice(0, defaultDisplayCount);
  }, [showAllCars, carsToDisplay, defaultDisplayCount, hasFilters]);

  const {
    currentValue: smoothDisplayedCars,
    isTransitioning: isShowcaseTransitioning,
  } = useSmoothListTransition(displayedCars, loading, { transitionMs: 200 });

  const hasRenderedCars = smoothDisplayedCars.length > 0;
  const showInitialSkeleton = loading && !hasRenderedCars;
  const showEmptyState = !loading && carsToDisplay.length === 0;

  // Preload first 6 car images for better initial loading performance
  useEffect(() => {
    const preloadImages = () => {
      const firstSixCars = displayedCars.slice(0, 6);
      firstSixCars.forEach(car => {
        const lot = car.lots?.[0];
        const imageUrl = lot?.images?.normal?.[0] || lot?.images?.big?.[0];
        if (imageUrl) {
          const img = new Image();
          img.src = imageUrl;
        }
      });
    };
    if (displayedCars.length > 0) {
      // Delay preloading to not interfere with critical resources
      setTimeout(preloadImages, 100);
    }
  }, [displayedCars]);
  useEffect(() => {
    // Calculate daily page based on day of month (1-31)
    const today = new Date();
    const dayOfMonth = today.getDate(); // 1-31
    const dailyPage = (dayOfMonth - 1) % 10 + 1; // Cycle through pages 1-10

    // Load initial data with 50 cars from daily page - increased for better visibility
    fetchCars(dailyPage, {
      per_page: "50"
    }, true);

    // Load manufacturers with caching
    const loadManufacturers = async () => {
      setIsLoadingManufacturers(true);
      try {
        // Check cache first (cache for 5 minutes)
        const cacheAge = Date.now() - (dataCache.lastUpdated || 0);
        if (dataCache.manufacturers && cacheAge < 5 * 60 * 1000) {
          setManufacturers(dataCache.manufacturers);
          setIsLoadingManufacturers(false);
          return;
        }
        const manufacturersData = await fetchManufacturers();
        setManufacturers(manufacturersData);
        setDataCache(prev => ({
          ...prev,
          manufacturers: manufacturersData,
          lastUpdated: Date.now()
        }));
      } catch (error) {
        console.error('Failed to load manufacturers:', error);
      } finally {
        setIsLoadingManufacturers(false);
      }
    };
    loadManufacturers();
  }, []);
  useEffect(() => {
    refreshInventory(45);
  }, [refreshInventory]);
  const handleFiltersChange = (newFilters: APIFilters) => {
    // Check if generation is being selected
    if (newFilters.generation_id && newFilters.generation_id !== filters.generation_id) {
      // Close the filter panel before navigation
      setShowFilters(false);

      // Smooth redirect to catalog with all current filters
      const searchParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          searchParams.set(key, value);
        }
      });

      // Add flag to indicate navigation from homepage filters
      searchParams.set('fromHomepage', 'true');

      // Clear any existing scroll restoration data
      sessionStorage.removeItem('encar-catalog-scroll');
      console.log('🚀 Homepage: Cleared scroll data and navigating to catalog');

      // Navigate to catalog
      navigate(`/catalog?${searchParams.toString()}`);
      return;
    }

    // Check if advanced filters are being applied (not manufacturer, model, or generation)
    const hasAdvancedFilters = Object.entries(newFilters).some(([key, value]) => !['manufacturer_id', 'model_id', 'generation_id'].includes(key) && value && value !== '');
    if (hasAdvancedFilters) {
      // Close the filter panel before navigation
      setShowFilters(false);

      // Redirect to catalog with filters as URL params
      const searchParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          searchParams.set(key, value);
        }
      });

      // Add flag to indicate navigation from homepage filters
      searchParams.set('fromHomepage', 'true');
      navigate(`/catalog?${searchParams.toString()}`);
    } else {
      // Store filters as pending for basic filters (manufacturer, model)
      // Don't apply them immediately - wait for search button click
      setPendingFilters(newFilters);
      console.log('Stored pending filters:', newFilters);
    }
  };
  const handleSearchCars = () => {
    // Close the filter panel after search
    setShowFilters(false);

    // Always redirect to catalog with current pending filters
    const searchParams = new URLSearchParams();
    Object.entries(pendingFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        searchParams.set(key, value);
      }
    });

    // Add flag to indicate navigation from homepage search
    searchParams.set('fromHomepage', 'true');
    navigate(`/catalog?${searchParams.toString()}`);
  };

  // Optimized manufacturer change handler with caching
  const handleManufacturerChange = async (manufacturerId: string) => {
    setIsLoadingModels(true);
    try {
      // Check cache first
      if (dataCache.models && dataCache.models[manufacturerId]) {
        setModels(dataCache.models[manufacturerId]);
        setGenerations([]);
        setIsLoadingModels(false);
        return;
      }

      // Fetch from API
      const modelsData = await fetchModels(manufacturerId);
      setModels(modelsData);
      setGenerations([]);

      // Update cache
      setDataCache(prev => ({
        ...prev,
        models: {
          ...prev.models,
          [manufacturerId]: modelsData
        }
      }));
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Optimized model change handler with caching
  const handleModelChange = async (modelId: string) => {
    setIsLoadingGenerations(true);
    try {
      // Check cache first
      if (dataCache.generations && dataCache.generations[modelId]) {
        setGenerations(dataCache.generations[modelId]);
        setIsLoadingGenerations(false);
        return;
      }

      // Fetch from API
      const generationsData = await fetchGenerations(modelId);
      setGenerations(generationsData);

      // Update cache
      setDataCache(prev => ({
        ...prev,
        generations: {
          ...prev.generations,
          [modelId]: generationsData
        }
      }));
    } catch (error) {
      console.error('Failed to load generations:', error);
    } finally {
      setIsLoadingGenerations(false);
    }
  };

  const handleClearFilters = () => {
    // Frontend-only filter clearing - no API calls needed
    setFilters({});
    setPendingFilters({});
  };

  // Generation change handler
  const handleGenerationChange = async (generationId: string) => {
    console.log('Generation changed:', generationId);
    // Generations are primarily for filtering in catalog, so we redirect
  };

  return <section ref={ref} id="cars" className={`py-4 sm:py-6 lg:py-8 bg-secondary/30 transition-all duration-1000 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
    <div className="container-responsive">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-foreground gradient-text">
          Makinat e Disponueshme
        </h2>


      </div>

      {error && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 mb-6 sm:mb-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg mx-2 sm:mx-0">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5 sm:mt-0" />
        <span className="text-blue-800 dark:text-blue-200 text-sm sm:text-base text-left sm:text-center">
          {cars.length === 0 ? "Shfaqen makina të përzgjedhura. Për përditësime të reja, kontaktoni: +38348181116" : "Problem me lidhjen API: Disa funksione mund të jenë të kufizuara."}
        </span>
      </div>}

      {/* Filter Form */}
      {showFilters && <div className="mb-6 sm:mb-8">
        <EncarStyleFilter
          filters={pendingFilters}
          manufacturers={manufacturers.length > 0 ? manufacturers : fallbackManufacturers}
          models={models}
          filterCounts={filterCounts}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onManufacturerChange={handleManufacturerChange}
          onModelChange={handleModelChange}
          onGenerationChange={handleGenerationChange}
          onFetchGrades={fetchGrades}
          onFetchGenerations={fetchGenerations}
          onFetchTrimLevels={fetchTrimLevels}
          isHomepage={true}
          onSearchCars={handleSearchCars}
        />
      </div>}

      {/* Daily Selection Badge */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          Zgjedhja e Ditës - {new Date().getDate()}{" "}
          {new Date().toLocaleDateString("sq-AL", {
            month: "long"
          })}
        </div>
      </div>

      {/* Sort Control */}
      <div className="mb-6 sm:mb-8 mx-2 sm:mx-0">

      </div>

      {/* Car Cards */}
      {showInitialSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0 stagger-animation">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="modern-card p-4 pulse-enhanced">
              <div className="h-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded mb-4"></div>
              <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded mb-2"></div>
              <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : showEmptyState ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-base sm:text-lg text-muted-foreground mb-4">
            Nuk ka makina të disponueshme.
          </p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0 mobile-card-container",
              isInView && "stagger-animation",
              (loading || isShowcaseTransitioning) &&
              "opacity-80 transition-opacity duration-200 motion-reduce:transition-none",
            )}
          >
            {smoothDisplayedCars.map((car) => {
              const lot = car.lots?.[0];
              const usdPrice = Number(
                lot?.buy_now ||
                lot?.final_bid ||
                lot?.price ||
                (car as any).buy_now ||
                (car as any).final_bid ||
                (car as any).price ||
                0,
              );
              const price =
                usdPrice > 0 ? calculateFinalPriceEUR(usdPrice, exchangeRate.rate) : 0;
              return (
                <LazyCarCard
                  key={car.id}
                  id={car.id}
                  make={car.manufacturer?.name || "Unknown"}
                  model={car.model?.name || "Unknown"}
                  year={car.year}
                  price={price}
                  image={lot?.images?.normal?.[0] || lot?.images?.big?.[0]}
                  vin={car.vin}
                  mileage={
                    lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined
                  }
                  transmission={car.transmission?.name}
                  fuel={resolveFuelFromSources(car, lot) || undefined}
                  color={car.color?.name}
                  condition={car.condition?.replace("run_and_drives", "Good")}
                  lot={car.lot_number || lot?.lot}
                  title={car.title}
                  status={Number(car.status || lot?.status || 1)}
                  sale_status={car.sale_status || lot?.sale_status}
                  final_price={car.final_price || lot?.final_price}
                  insurance_v2={(lot as any)?.insurance_v2}
                  details={(lot as any)?.details}
                />
              );
            })}
          </div>

          {/* Show More Button */}
          <div className="text-center mt-8">
            {carsToDisplay.length > defaultDisplayCount && !showAllCars && (
              <Button
                onClick={() => setShowAllCars(true)}
                variant="outline"
                size="lg"
                className="btn-enhanced bg-card border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3"
              >
                Shiko të gjitha ({carsToDisplay.length} makina)
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  </section>;
});
HomeCarsSection.displayName = "HomeCarsSection";
export default HomeCarsSection;