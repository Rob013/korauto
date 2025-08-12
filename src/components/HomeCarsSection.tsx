import LazyCarCard from "./LazyCarCard";
import { memo, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useSecureAuctionAPI } from "@/hooks/useSecureAuctionAPI";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import {
  useSortedCars,
  getSortOptions,
  SortOption,
} from "@/hooks/useSortedCars";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import EncarStyleFilter from "@/components/EncarStyleFilter";

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
  per_page?: string;
}

const HomeCarsSection = memo(() => {
  const navigate = useNavigate();
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
  } = useSecureAuctionAPI();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showAllCars, setShowAllCars] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<APIFilters>({});
  const [pendingFilters, setPendingFilters] = useState<APIFilters>({});
  const [manufacturers, setManufacturers] = useState<
    {
      id: number;
      name: string;
      car_count?: number;
      cars_qty?: number;
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

  // Cache for API data to improve performance
  const [dataCache, setDataCache] = useState<{
    manufacturers?: { id: number; name: string; car_count?: number; cars_qty?: number; }[];
    models?: { [manufacturerId: string]: { id: number; name: string; car_count?: number; cars_qty?: number; }[] };
    generations?: { [modelId: string]: { id: number; name: string; manufacturer_id?: number; model_id?: number; from_year?: number; to_year?: number; cars_qty?: number; }[] };
    lastUpdated?: number;
  }>({});

  // Performance optimization: debounced API calls
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false);

  // Frontend filtering function
  const applyFrontendFilters = (cars: any[], filters: APIFilters) => {
    return cars.filter((car) => {
      // Manufacturer filter
      if (
        filters.manufacturer_id &&
        car.manufacturer?.id !== parseInt(filters.manufacturer_id)
      ) {
        return false;
      }

      // Model filter
      if (filters.model_id && car.model?.id !== parseInt(filters.model_id)) {
        return false;
      }

      // Generation filter
      if (
        filters.generation_id &&
        car.generation?.id !== parseInt(filters.generation_id)
      ) {
        return false;
      }

      // Color filter
      if (
        filters.color &&
        car.color?.name?.toLowerCase() !== filters.color.toLowerCase()
      ) {
        return false;
      }

      // Fuel type filter
      if (
        filters.fuel_type &&
        car.fuel?.name?.toLowerCase() !== filters.fuel_type.toLowerCase()
      ) {
        return false;
      }

      // Transmission filter
      if (
        filters.transmission &&
        car.transmission?.name?.toLowerCase() !==
          filters.transmission.toLowerCase()
      ) {
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
      if (
        filters.buy_now_price_from &&
        carPrice &&
        carPrice < parseInt(filters.buy_now_price_from)
      ) {
        return false;
      }
      if (
        filters.buy_now_price_to &&
        carPrice &&
        carPrice > parseInt(filters.buy_now_price_to)
      ) {
        return false;
      }

      // Mileage filter
      const carMileage = car.lots?.[0]?.odometer?.km;
      if (
        filters.odometer_from_km &&
        carMileage &&
        carMileage < parseInt(filters.odometer_from_km)
      ) {
        return false;
      }
      if (
        filters.odometer_to_km &&
        carMileage &&
        carMileage > parseInt(filters.odometer_to_km)
      ) {
        return false;
      }

      // Grade filter (check lots array for grade_iaai)
      if (filters.grade_iaai && filters.grade_iaai !== 'all') {
        const targetGrade = filters.grade_iaai.toLowerCase().trim();
        let hasMatchingGrade = false;
        
        // Check in lots array
        if (car.lots && Array.isArray(car.lots)) {
          hasMatchingGrade = car.lots.some((lot: any) => 
            lot.grade_iaai && lot.grade_iaai.toLowerCase().includes(targetGrade)
          );
        }
        
        // Check in single lot object
        if (!hasMatchingGrade && car.lot && car.lot.grade_iaai) {
          hasMatchingGrade = car.lot.grade_iaai.toLowerCase().includes(targetGrade);
        }
        
        // Check in car title for grade patterns
        if (!hasMatchingGrade && car.title) {
          hasMatchingGrade = car.title.toLowerCase().includes(targetGrade);
        }
        
        if (!hasMatchingGrade) {
          return false;
        }
      }

      // Search filter (search in make, model, title, VIN)
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const searchFields = [
          car.manufacturer?.name,
          car.model?.name,
          car.title,
          car.vin,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }

      // Seats count filter
      if (
        filters.seats_count &&
        car.details?.seats_count !== parseInt(filters.seats_count)
      ) {
        return false;
      }

      return true;
    });
  };

  // Type conversion to match the sorting hook interface
  const carsForSorting = cars.map((car) => ({
    ...car,
    status: String(car.status || ""),
    lot_number: String(car.lot_number || ""),
    cylinders: Number(car.cylinders || 0),
  }));

  // Don't filter homepage cars - always show original cars
  const sortedCars = useSortedCars(carsForSorting, sortBy);

  // Show 30 cars by default (daily rotation) - optimized for better loading performance
  const defaultDisplayCount = 30;

  // Memoize displayed cars to prevent unnecessary re-renders
  const displayedCars = useMemo(() => {
    return showAllCars ? sortedCars : sortedCars.slice(0, defaultDisplayCount);
  }, [showAllCars, sortedCars, defaultDisplayCount]);

  // Preload first 6 car images for better initial loading performance
  useEffect(() => {
    const preloadImages = () => {
      const firstSixCars = displayedCars.slice(0, 6);
      firstSixCars.forEach((car) => {
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
    const dailyPage = ((dayOfMonth - 1) % 10) + 1; // Cycle through pages 1-10

    // Load initial data with 30 cars from daily page - optimized for faster loading
    fetchCars(dailyPage, { per_page: "30" }, true);
    
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

  const handleFiltersChange = (newFilters: APIFilters) => {
    // Check if generation is being selected
    if (newFilters.generation_id && newFilters.generation_id !== filters.generation_id) {
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
    const hasAdvancedFilters = Object.entries(newFilters).some(([key, value]) => 
      !['manufacturer_id', 'model_id', 'generation_id'].includes(key) && value && value !== ''
    );
    
    if (hasAdvancedFilters) {
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

  return (
    <section id="cars" className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Header section - encar.com style */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Featured Cars
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Discover our handpicked selection of premium vehicles from South Korea
            </p>
          </div>
          
          {/* Quick Filter Tabs - encar.com style */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={pendingFilters.manufacturer_id === undefined ? "default" : "outline"}
              size="sm"
              className={`${pendingFilters.manufacturer_id === undefined ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700 dark:text-gray-300'} hover:bg-blue-700 hover:text-white`}
              onClick={() => handleFiltersChange({})}
            >
              All Cars
            </Button>
            <Button
              variant={pendingFilters.manufacturer_id === "1" ? "default" : "outline"}
              size="sm"
              className={`${pendingFilters.manufacturer_id === "1" ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700 dark:text-gray-300'} hover:bg-blue-700 hover:text-white`}
              onClick={() => handleFiltersChange({ manufacturer_id: "1" })}
            >
              Toyota
            </Button>
            <Button
              variant={pendingFilters.manufacturer_id === "2" ? "default" : "outline"}
              size="sm"
              className={`${pendingFilters.manufacturer_id === "2" ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700 dark:text-gray-300'} hover:bg-blue-700 hover:text-white`}
              onClick={() => handleFiltersChange({ manufacturer_id: "2" })}
            >
              Honda
            </Button>
            <Button
              variant={pendingFilters.manufacturer_id === "3" ? "default" : "outline"}
              size="sm"
              className={`${pendingFilters.manufacturer_id === "3" ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-700 dark:text-gray-300'} hover:bg-blue-700 hover:text-white`}
              onClick={() => handleFiltersChange({ manufacturer_id: "3" })}
            >
              Hyundai
            </Button>
          </div>
        </div>

        {/* Sort and View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {displayedCars.length} cars
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <div className="relative min-w-[140px]">
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="h-9 text-sm border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="end">
                  {getSortOptions().map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-sm"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 mb-6 sm:mb-8 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg mx-2 sm:mx-0">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-yellow-800 dark:text-yellow-200 text-sm sm:text-base text-left sm:text-center">
              Problem me lidhjen API: {error}
            </span>
          </div>
        )}

        {/* Filter Form */}
        {showFilters && (
          <div className="mb-6 sm:mb-8">
            <EncarStyleFilter
              filters={pendingFilters}
              manufacturers={manufacturers}
              models={models}
              filterCounts={filterCounts}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              onManufacturerChange={handleManufacturerChange}
              onModelChange={handleModelChange}
              onFetchGrades={fetchGrades}
              onFetchTrimLevels={fetchTrimLevels}
              isHomepage={true}
              onSearchCars={handleSearchCars}
            />
          </div>
        )}

        {/* Daily Selection Badge */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            Zgjedhja e Ditës - {new Date().getDate()}{" "}
            {new Date().toLocaleDateString("sq-AL", { month: "long" })}
          </div>
        </div>

        {/* Sort Control */}
        <div className="mb-6 sm:mb-8 mx-2 sm:mx-0">
          <div className="flex justify-end">
            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => setSortBy(value)}
            >
              <SelectTrigger className="w-48">
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

        {/* Car Cards - encar.com style */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sortedCars.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No cars available</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your filters or check back later for new arrivals.
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">{displayedCars.map((car) => {
                const lot = car.lots?.[0];
                const usdPrice = lot?.buy_now || 25000;
                const price = convertUSDtoEUR(Math.round(usdPrice + 2200));
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
                      lot?.odometer?.km
                        ? `${lot.odometer.km.toLocaleString()} km`
                        : undefined
                    }
                    transmission={car.transmission?.name}
                    fuel={car.fuel?.name}
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
              {sortedCars.length > 30 && !showAllCars && (
                <Button
                  onClick={() => setShowAllCars(true)}
                  variant="outline"
                  size="lg"
                  className="bg-card border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3"
                >
                  Shiko të gjitha ({sortedCars.length} makina)
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
});

HomeCarsSection.displayName = "HomeCarsSection";
export default HomeCarsSection;
