import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Grid3X3,
  List,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Palette,
  Settings,
  Heart,
  Share2,
  Phone,
  Eye,
  Car
} from 'lucide-react';
import { fetchCarsWithKeyset, SortOption as CarsApiSortOption, CarFilters } from '@/services/carsApi';
import { useCurrencyAPI } from '@/hooks/useCurrencyAPI';
import { useSecureAuctionAPI } from '@/hooks/useSecureAuctionAPI';
import EncarStyleFilter from '@/components/EncarStyleFilter';
import { APIFilters } from '@/utils/catalog-filter';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  price_cents?: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  location?: string;
  images?: string[];
  image_url?: string;
}

interface EncarLikeCatalogProps {
  highlightCarId?: string | null;
  className?: string;
}

const SORT_OPTIONS: Array<{value: CarsApiSortOption, label: string}> = [
  { value: 'created_desc', label: 'Latest Listed' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'year_asc', label: 'Year: Oldest First' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_desc', label: 'Mileage: High to Low' },
];

const POPULAR_MAKES = [
  'Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 
  'Hyundai', 'Kia', 'Nissan', 'Ford', 'Mazda', 'Lexus'
];

const FUEL_TYPES = ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'LPG'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT'];
const BODY_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Wagon', 'Coupe', 'Convertible', 'Pickup'];

export const EncarLikeCatalog = ({ highlightCarId, className = '' }: EncarLikeCatalogProps) => {
  const { toast } = useToast();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for cars and pagination
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Initialize state from URL parameters
  const initializeFromURL = useCallback(() => {
    const sortFromURL = searchParams.get('sort') as CarsApiSortOption || 'created_desc';
    const searchFromURL = searchParams.get('search') || '';
    const makesFromURL = searchParams.get('makes')?.split(',').filter(Boolean) || [];
    const priceMinFromURL = parseInt(searchParams.get('priceMin') || '5000');
    const priceMaxFromURL = parseInt(searchParams.get('priceMax') || '100000');
    const yearMinFromURL = parseInt(searchParams.get('yearMin') || '2000');
    const yearMaxFromURL = parseInt(searchParams.get('yearMax') || '2024');
    const mileageMinFromURL = parseInt(searchParams.get('mileageMin') || '0');
    const mileageMaxFromURL = parseInt(searchParams.get('mileageMax') || '300000');
    const fuelFromURL = searchParams.get('fuel') || undefined;
    const transmissionFromURL = searchParams.get('transmission') || undefined;
    const bodyTypeFromURL = searchParams.get('bodyType') || undefined;
    const viewModeFromURL = (searchParams.get('view') as 'grid' | 'list') || 'grid';
    const showFiltersFromURL = searchParams.get('showFilters') !== 'false';

    return {
      sortBy: sortFromURL,
      searchTerm: searchFromURL,
      selectedMakes: makesFromURL,
      priceRange: [priceMinFromURL, priceMaxFromURL] as [number, number],
      yearRange: [yearMinFromURL, yearMaxFromURL] as [number, number],
      mileageRange: [mileageMinFromURL, mileageMaxFromURL] as [number, number],
      fuel: fuelFromURL,
      transmission: transmissionFromURL,
      bodyType: bodyTypeFromURL,
      viewMode: viewModeFromURL,
      showFilters: showFiltersFromURL
    };
  }, [searchParams]);

  // Initialize state from URL on component mount
  const urlState = initializeFromURL();
  const [sortBy, setSortBy] = useState<CarsApiSortOption>(urlState.sortBy);
  const [showFilters, setShowFilters] = useState(urlState.showFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(urlState.viewMode);
  
  // Filter state
  const [filters, setFilters] = useState<CarFilters & {
    bodyType?: string;
    transmission?: string;
    priceRange?: [number, number];
    yearRange?: [number, number];
    mileageRange?: [number, number];
  }>({
    priceRange: urlState.priceRange,
    yearRange: urlState.yearRange,
    mileageRange: urlState.mileageRange,
    fuel: urlState.fuel,
    transmission: urlState.transmission,
    bodyType: urlState.bodyType
  });
  
  const [searchTerm, setSearchTerm] = useState(urlState.searchTerm);
  const [selectedMakes, setSelectedMakes] = useState<string[]>(urlState.selectedMakes);

  // Enhanced filter state for EncarStyleFilter - now using real API data
  const [apiFilters, setApiFilters] = useState<APIFilters>({
    manufacturer_id: undefined,
    model_id: undefined,
    fuel_type: urlState.fuel,
    transmission: urlState.transmission,
    body_type: urlState.bodyType,
    buy_now_price_from: urlState.priceRange[0]?.toString(),
    buy_now_price_to: urlState.priceRange[1]?.toString(),
    from_year: urlState.yearRange[0]?.toString(),
    to_year: urlState.yearRange[1]?.toString(),
    odometer_from_km: urlState.mileageRange[0]?.toString(),
    odometer_to_km: urlState.mileageRange[1]?.toString(),
  });

  // Use real API data instead of mock data
  const { 
    cars: apiCars, 
    loading: apiLoading, 
    manufacturers: realManufacturers,
    models: realModels,
    fetchCars: fetchApiCars,
    fetchManufacturers,
    fetchModels,
    fetchFilterCounts
  } = useSecureAuctionAPI();

  // Update URL parameters whenever state changes
  const updateURLParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (sortBy !== 'created_desc') params.set('sort', sortBy);
    if (searchTerm) params.set('search', searchTerm);
    if (selectedMakes.length > 0) params.set('makes', selectedMakes.join(','));
    if (filters.priceRange?.[0] !== 5000) params.set('priceMin', filters.priceRange[0].toString());
    if (filters.priceRange?.[1] !== 100000) params.set('priceMax', filters.priceRange[1].toString());
    if (filters.yearRange?.[0] !== 2000) params.set('yearMin', filters.yearRange[0].toString());
    if (filters.yearRange?.[1] !== 2024) params.set('yearMax', filters.yearRange[1].toString());
    if (filters.mileageRange?.[0] !== 0) params.set('mileageMin', filters.mileageRange[0].toString());
    if (filters.mileageRange?.[1] !== 300000) params.set('mileageMax', filters.mileageRange[1].toString());
    if (filters.fuel) params.set('fuel', filters.fuel);
    if (filters.transmission) params.set('transmission', filters.transmission);
    if (filters.bodyType) params.set('bodyType', filters.bodyType);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (!showFilters) params.set('showFilters', 'false');
    
    setSearchParams(params, { replace: true });
  }, [sortBy, searchTerm, selectedMakes, filters, viewMode, showFilters, setSearchParams]);

  // Update URL parameters whenever state changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURLParams();
    }, 300);
    return () => clearTimeout(timer);
  }, [updateURLParams]);

  // Fetch cars with current filters and sort
  const fetchCars = useCallback(async (resetList = false, cursor?: string) => {
    if (resetList) {
      setLoading(true);
      setCars([]);
      setNextCursor(undefined);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);

    try {
      const apiFilters: CarFilters = {
        ...filters,
        search: searchTerm || undefined,
        make: selectedMakes.length === 1 ? selectedMakes[0] : undefined,
        priceMin: filters.priceRange?.[0]?.toString(),
        priceMax: filters.priceRange?.[1]?.toString(),
        yearMin: filters.yearRange?.[0]?.toString(),
        yearMax: filters.yearRange?.[1]?.toString(),
      };

      const response = await fetchCarsWithKeyset({
        filters: apiFilters,
        sort: sortBy,
        limit: 24,
        cursor: cursor || nextCursor
      });

      if (resetList) {
        setCars(response.items);
      } else {
        setCars(prev => [...prev, ...response.items]);
      }
      
      setNextCursor(response.nextCursor);
      setTotalCount(response.total);
    } catch (err: unknown) {
      console.error('Failed to fetch cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cars');
      toast({
        title: "Error",
        description: "Failed to load cars. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, sortBy, searchTerm, selectedMakes, nextCursor, toast]);

  // Enhanced API integration - first try to use real API data, then fallback
  useEffect(() => {
    // Only run this effect once when component mounts
    if (cars.length === 0 && !loading && !error) {
      const fetchWithFallback = async () => {
        try {
          // Only fetch API cars if we don't have successful API manufacturers yet
          if (realManufacturers && realManufacturers.length > 0) {
            console.log('✅ Using real API manufacturers:', realManufacturers.length, 'brands');
            await fetchApiCars(apiFilters);
            
            if (apiCars && apiCars.length > 0) {
              console.log('✅ Successfully loaded real API cars:', apiCars.length);
              setCars(apiCars);
              setTotalCount(apiCars.length);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log('ℹ️ API not available, using fallback catalog system');
        }
        
        // Use the standard catalog system as fallback
        fetchCars(true);
      };

      fetchWithFallback();
    }
  }, []); // Remove all dependencies to prevent infinite loop

  // Initial load - only run once
  useEffect(() => {
    fetchCars(true);
  }, []); // Remove dependencies to prevent infinite loop

  // Fetch manufacturers on component mount to ensure filters are populated
  useEffect(() => {
    if (!realManufacturers || realManufacturers.length === 0) {
      console.log('🚀 Fetching manufacturers for filters...');
      fetchManufacturers().catch(err => {
        console.log('ℹ️ Could not fetch manufacturers:', err.message);
      });
    }
  }, [fetchManufacturers, realManufacturers]);

  // Debounced search and filter changes - with proper dependencies
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || selectedMakes.length > 0 || Object.keys(filters).length > 0) {
        fetchCars(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedMakes, filters]); // Remove fetchCars from dependencies

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchCars(false);
    }
  };

  const handleMakeToggle = (make: string) => {
    setSelectedMakes(prev => 
      prev.includes(make) 
        ? prev.filter(m => m !== make)
        : [...prev, make]
    );
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: [5000, 100000],
      yearRange: [2000, 2024],
      mileageRange: [0, 300000]
    });
    setSearchTerm('');
    setSelectedMakes([]);
  };

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Enhanced Header Section with Brand Colors */}
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground border-b border-primary/20">
        <div className="container mx-auto px-4 py-8">
          {/* Premium Search Bar - Encar Style with Brand Colors */}
          <div className="mb-6">
            <div className="flex gap-4 items-center max-w-4xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search by make, model, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg bg-background/95 border-background/20 focus:border-accent focus:ring-accent/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button 
                size="lg" 
                className="h-14 px-10 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Enhanced Quick Make Filters with Brand Colors */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm font-semibold text-primary-foreground/90">Popular Brands:</span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_MAKES.slice(0, 8).map((make) => (
                <Button
                  key={make}
                  variant={selectedMakes.includes(make) ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleMakeToggle(make)}
                  className={`h-9 transition-all duration-200 ${
                    selectedMakes.includes(make) 
                      ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-md' 
                      : 'bg-background/10 text-primary-foreground border-primary-foreground/30 hover:bg-background/20 hover:border-primary-foreground/50'
                  }`}
                >
                  {make}
                </Button>
              ))}
            </div>
          </div>

          {/* Enhanced Results and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-primary-foreground/80 font-medium">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  `${totalCount.toLocaleString()} cars found`
                )}
              </div>
              {(selectedMakes.length > 0 || searchTerm || 
                filters.make || filters.model || filters.fuel) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-destructive-foreground bg-destructive/10 hover:bg-destructive/20 hover:text-destructive-foreground border border-destructive/30"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Enhanced View Mode Toggle */}
              <div className="flex border border-primary-foreground/20 rounded-lg bg-background/10 overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-r-none border-0 ${
                    viewMode === 'grid' 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-primary-foreground hover:bg-background/20'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-l-none border-0 ${
                    viewMode === 'list' 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-primary-foreground hover:bg-background/20'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Enhanced Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value: CarsApiSortOption) => setSortBy(value)}>
                <SelectTrigger className="w-48 bg-background/10 border-primary-foreground/20 text-primary-foreground">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Enhanced Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(selectedMakes.length > 0 || searchTerm) && (
                  <Badge variant="secondary" className="ml-1 bg-accent text-accent-foreground">
                    {selectedMakes.length + (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex gap-8 py-6">
          {/* Enhanced Filters Sidebar - Desktop Optimized */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-4">
                <Card className="shadow-lg border-border/50">
                  <div className="p-6">
                    <EncarStyleFilter
                      filters={apiFilters}
                      manufacturers={realManufacturers && realManufacturers.length > 0 ? realManufacturers : [
                        // Enhanced fallback manufacturers data with proper structure
                        { id: 1, name: 'Toyota', cars_qty: 67, car_count: 67 },
                        { id: 2, name: 'Honda', cars_qty: 45, car_count: 45 },
                        { id: 3, name: 'BMW', cars_qty: 38, car_count: 38 },
                        { id: 4, name: 'Mercedes-Benz', cars_qty: 42, car_count: 42 },
                        { id: 5, name: 'Audi', cars_qty: 35, car_count: 35 },
                        { id: 6, name: 'Volkswagen', cars_qty: 28, car_count: 28 },
                        { id: 7, name: 'Hyundai', cars_qty: 52, car_count: 52 },
                        { id: 8, name: 'Kia', cars_qty: 44, car_count: 44 },
                        { id: 9, name: 'Nissan', cars_qty: 33, car_count: 33 },
                        { id: 10, name: 'Ford', cars_qty: 29, car_count: 29 },
                        { id: 11, name: 'Mazda', cars_qty: 22, car_count: 22 },
                        { id: 12, name: 'Lexus', cars_qty: 18, car_count: 18 },
                      ]}
                      models={realModels && realModels.length > 0 ? realModels : [
                        // Enhanced fallback models based on popular Korean market models
                        { id: 101, name: 'Camry', cars_qty: 15, car_count: 15 },
                        { id: 102, name: 'Corolla', cars_qty: 12, car_count: 12 },
                        { id: 103, name: 'RAV4', cars_qty: 18, car_count: 18 },
                        { id: 104, name: 'Civic', cars_qty: 14, car_count: 14 },
                        { id: 105, name: 'Accord', cars_qty: 11, car_count: 11 },
                        { id: 106, name: 'CR-V', cars_qty: 16, car_count: 16 },
                        { id: 107, name: '3 Series', cars_qty: 13, car_count: 13 },
                        { id: 108, name: 'X3', cars_qty: 10, car_count: 10 },
                        { id: 109, name: 'C-Class', cars_qty: 15, car_count: 15 },
                        { id: 110, name: 'GLC', cars_qty: 12, car_count: 12 },
                      ]}
                onFiltersChange={(newFilters) => {
                  setApiFilters(newFilters);
                  // Sync with legacy filter state for backward compatibility
                  setFilters(prev => ({
                    ...prev,
                    fuel: newFilters.fuel_type,
                    transmission: newFilters.transmission,
                    bodyType: newFilters.body_type,
                    priceRange: newFilters.buy_now_price_from && newFilters.buy_now_price_to
                      ? [parseInt(newFilters.buy_now_price_from), parseInt(newFilters.buy_now_price_to)]
                      : prev.priceRange,
                    yearRange: newFilters.from_year && newFilters.to_year
                      ? [parseInt(newFilters.from_year), parseInt(newFilters.to_year)]
                      : prev.yearRange,
                    mileageRange: newFilters.odometer_from_km && newFilters.odometer_to_km
                      ? [parseInt(newFilters.odometer_from_km), parseInt(newFilters.odometer_to_km)]
                      : prev.mileageRange,
                  }));
                }}
                onClearFilters={() => {
                  setApiFilters({});
                  clearAllFilters();
                }}
                onManufacturerChange={(manufacturerId) => {
                  // Fetch models when manufacturer changes
                  if (manufacturerId && manufacturerId !== 'all') {
                    fetchModels(manufacturerId);
                  }
                  console.log('Manufacturer changed:', manufacturerId);
                }}
                onModelChange={(modelId) => {
                  // Handle model change
                  console.log('Model changed:', modelId);
                }}
                fetchFilterCounts={fetchFilterCounts}
                compact={false}
                isHomepage={false}
              />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Enhanced Cars Grid/List */}
          <div className="flex-1">
            {loading && cars.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground text-lg">Loading cars...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
                  <p className="text-destructive mb-4 font-medium">{error}</p>
                  <Button onClick={() => fetchCars(true)} className="bg-primary hover:bg-primary/90">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-20">
                <Car className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-semibold mb-2 text-foreground">No cars found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search criteria</p>
                <Button onClick={clearAllFilters} className="bg-primary hover:bg-primary/90">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.map((car) => (
                      <CarCard key={car.id} car={car} convertUSDtoEUR={convertUSDtoEUR} highlightCarId={highlightCarId} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cars.map((car) => (
                      <CarListItem key={car.id} car={car} convertUSDtoEUR={convertUSDtoEUR} highlightCarId={highlightCarId} />
                    ))}
                  </div>
                )}

                {/* Enhanced Load More Button */}
                {nextCursor && (
                  <div className="flex justify-center mt-12">
                    <Button 
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      size="lg"
                      className="px-12 py-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Loading More...
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-5 w-5 mr-2" />
                          Load More Cars
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Car Card Component with Brand Colors
const CarCard = ({ car, convertUSDtoEUR, highlightCarId }: { 
  car: Car; 
  convertUSDtoEUR: (amount: number) => number;
  highlightCarId?: string | null;
}) => {
  const price = convertUSDtoEUR(car.price_cents ? Math.round(car.price_cents / 100) : car.price || 25000);
  const isHighlighted = highlightCarId === car.id;
  
  return (
    <Card className={`group hover:shadow-2xl transition-all duration-300 cursor-pointer border-border/50 ${
      isHighlighted ? 'ring-2 ring-primary shadow-xl' : ''
    }`}>
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
          <img
            src={car.images?.[0] || car.image_url || '/placeholder-car.jpg'}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <Button size="sm" variant="secondary" className="h-9 w-9 p-0 bg-background/80 hover:bg-background/90 backdrop-blur-sm">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" className="h-9 w-9 p-0 bg-background/80 hover:bg-background/90 backdrop-blur-sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        {isHighlighted && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground shadow-lg">
              Featured
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-5">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-2xl font-bold text-primary">
            €{price.toLocaleString()}
          </p>
        </div>
        
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{car.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-4 w-4 text-primary" />
              <span>{car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Fuel className="h-4 w-4 text-primary" />
              <span>{car.fuel || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="h-4 w-4 text-primary" />
              <span>{car.transmission || 'N/A'}</span>
            </div>
          </div>
          {car.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{car.location}</span>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex gap-2">
          <Button className="flex-1 bg-primary hover:bg-primary/90" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm" className="border-primary/20 hover:border-primary hover:bg-primary/10">
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Car List Item Component with Brand Colors
const CarListItem = ({ car, convertUSDtoEUR, highlightCarId }: { 
  car: Car; 
  convertUSDtoEUR: (amount: number) => number;
  highlightCarId?: string | null;
}) => {
  const price = convertUSDtoEUR(car.price_cents ? Math.round(car.price_cents / 100) : car.price || 25000);
  const isHighlighted = highlightCarId === car.id;
  
  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 ${
      isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex gap-6">
          <div className="w-56 h-40 flex-shrink-0 relative overflow-hidden rounded-lg">
            <img
              src={car.images?.[0] || car.image_url || '/placeholder-car.jpg'}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isHighlighted && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-primary text-primary-foreground shadow-lg">
                  Featured
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="text-3xl font-bold text-primary">
                  €{price.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-primary/20 hover:border-primary hover:bg-primary/10">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-primary/20 hover:border-primary hover:bg-primary/10">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{car.year}</span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="h-4 w-4 text-primary" />
                <span>{car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4 text-primary" />
                <span>{car.fuel || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-4 w-4 text-primary" />
                <span>{car.transmission || 'N/A'}</span>
              </div>
            </div>
            
            {car.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{car.location}</span>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button className="bg-primary hover:bg-primary/90" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" size="sm" className="border-primary/20 hover:border-primary hover:bg-primary/10">
                <Phone className="h-4 w-4 mr-2" />
                Contact Dealer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EncarLikeCatalog;