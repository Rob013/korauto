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
import EncarStyleFilter from '@/components/EncarStyleFilter';
import { MobileFilterUX } from '@/components/mobile-filter-ux';
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

interface EncarStyleCatalogProps {
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

export const EncarStyleCatalog = ({ highlightCarId, className = '' }: EncarStyleCatalogProps) => {
  const { toast } = useToast();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const { fetchFilterCounts } = useSecureAuctionAPI();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for cars and pagination
  const [cars, setCars] = useState<any[]>([]);
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

  // Enhanced filter state for EncarStyleFilter
  const [apiFilters, setApiFilters] = useState<any>({
    manufacturer_id: undefined,
    model_id: undefined,
    from_year: undefined,
    to_year: undefined,
    buy_now_price_from: undefined,
    buy_now_price_to: undefined,
    odometer_from_km: undefined,
    odometer_to_km: undefined,
    color: undefined,
    fuel_type: undefined,
    transmission: undefined,
    body_type: undefined,
    drive_type: undefined,
    seats_count: undefined,
    max_accidents: undefined,
    registration_type: undefined,
    is_certified: undefined,
    has_warranty: undefined,
    service_history: undefined,
    grade_iaai: undefined,
    trim_level: undefined,
    engine_displacement_from: undefined,
    engine_displacement_to: undefined,
    location_city: undefined,
    location_distance: undefined
  });

  // Mock manufacturers data - in a real app this would come from an API
  const mockManufacturers = [
    { id: 1, name: 'Toyota', cars_qty: 245, image: '/brand-logos/toyota.png' },
    { id: 2, name: 'Honda', cars_qty: 198, image: '/brand-logos/honda.png' },
    { id: 3, name: 'BMW', cars_qty: 167, image: '/brand-logos/bmw.png' },
    { id: 4, name: 'Mercedes-Benz', cars_qty: 145, image: '/brand-logos/mercedes.png' },
    { id: 5, name: 'Audi', cars_qty: 134, image: '/brand-logos/audi.png' },
    { id: 6, name: 'Volkswagen', cars_qty: 123, image: '/brand-logos/volkswagen.png' },
    { id: 7, name: 'Hyundai', cars_qty: 112, image: '/brand-logos/hyundai.png' },
    { id: 8, name: 'Kia', cars_qty: 98, image: '/brand-logos/kia.png' },
    { id: 9, name: 'Nissan', cars_qty: 87, image: '/brand-logos/nissan.png' },
    { id: 10, name: 'Ford', cars_qty: 76, image: '/brand-logos/ford.png' }
  ];

  // Mock models data - filtered by selected manufacturer
  const mockModels = apiFilters.manufacturer_id ? [
    { id: 1, name: 'Camry', cars_qty: 45 },
    { id: 2, name: 'Corolla', cars_qty: 38 },
    { id: 3, name: 'RAV4', cars_qty: 32 },
    { id: 4, name: 'Prius', cars_qty: 28 },
    { id: 5, name: 'Highlander', cars_qty: 22 }
  ] : [];

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
    } catch (err: any) {
      console.error('Failed to fetch cars:', err);
      setError(err.message || 'Failed to load cars');
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

  // Initial load
  useEffect(() => {
    fetchCars(true);
  }, [sortBy]);

  // Debounced search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCars(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, searchTerm, selectedMakes]);

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
    // Clear enhanced filter state
    setApiFilters({
      manufacturer_id: undefined,
      model_id: undefined,
      from_year: undefined,
      to_year: undefined,
      buy_now_price_from: undefined,
      buy_now_price_to: undefined,
      odometer_from_km: undefined,
      odometer_to_km: undefined,
      color: undefined,
      fuel_type: undefined,
      transmission: undefined,
      body_type: undefined,
      drive_type: undefined,
      seats_count: undefined,
      max_accidents: undefined,
      registration_type: undefined,
      is_certified: undefined,
      has_warranty: undefined,
      service_history: undefined,
      grade_iaai: undefined,
      trim_level: undefined,
      engine_displacement_from: undefined,
      engine_displacement_to: undefined,
      location_city: undefined,
      location_distance: undefined
    });
  };

  // Enhanced filter handlers
  const handleFiltersChange = useCallback((newFilters: any) => {
    setApiFilters(newFilters);
    // Trigger car fetch after filter change
    setTimeout(() => {
      fetchCars(true);
    }, 300);
  }, [fetchCars]);

  const handleManufacturerChange = useCallback((manufacturerId: string) => {
    // When manufacturer changes, clear model selection
    setApiFilters(prev => ({
      ...prev,
      manufacturer_id: manufacturerId,
      model_id: undefined
    }));
  }, []);

  const handleModelChange = useCallback((modelId: string) => {
    setApiFilters(prev => ({
      ...prev,
      model_id: modelId
    }));
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const handleSearchCars = useCallback(() => {
    fetchCars(true);
  }, [fetchCars]);

  const handleCloseFilter = useCallback(() => {
    setShowFilters(false);
  }, []);

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header Section */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          {/* Top Search Bar - Encar Style */}
          <div className="mb-6">
            <div className="flex gap-4 items-center max-w-4xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by make, model, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button 
                size="lg" 
                className="h-12 px-8 bg-primary hover:bg-primary/90"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Quick Make Filters */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Popular Brands:</span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_MAKES.slice(0, 8).map((make) => (
                <Button
                  key={make}
                  variant={selectedMakes.includes(make) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMakeToggle(make)}
                  className="h-8"
                >
                  {make}
                </Button>
              ))}
            </div>
          </div>

          {/* Results and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {loading ? (
                  'Loading...'
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
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value: CarsApiSortOption) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(selectedMakes.length > 0 || searchTerm) && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedMakes.length + (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex gap-6 py-6">
          {/* Enhanced Filters - Encar Style with Mobile Support */}
          <MobileFilterUX
            showFilters={showFilters}
            onToggleFilters={handleToggleFilters}
            onClearFilters={clearAllFilters}
            onSearchCars={handleSearchCars}
            hasSelectedCategories={Object.values(apiFilters).some(value => value !== undefined && value !== '')}
            selectedFiltersCount={Object.values(apiFilters).filter(value => value !== undefined && value !== '').length}
          >
            {showFilters && (
              <div className="w-80 flex-shrink-0">
                <EncarStyleFilter
                  filters={apiFilters}
                  manufacturers={mockManufacturers}
                  models={mockModels}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={clearAllFilters}
                  onManufacturerChange={handleManufacturerChange}
                  onModelChange={handleModelChange}
                  onSearchCars={handleSearchCars}
                  onCloseFilter={handleCloseFilter}
                  fetchFilterCounts={fetchFilterCounts}
                  compact={false}
                />
              </div>
            )}
          </MobileFilterUX>

          {/* Cars Grid/List */}
          <div className="flex-1">
            {loading && cars.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading cars...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => fetchCars(true)}>
                  Try Again
                </Button>
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-20">
                <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No cars found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
                <Button onClick={clearAllFilters}>Clear All Filters</Button>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.map((car) => (
                      <CarCard key={car.id} car={car} convertUSDtoEUR={convertUSDtoEUR} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cars.map((car) => (
                      <CarListItem key={car.id} car={car} convertUSDtoEUR={convertUSDtoEUR} />
                    ))}
                  </div>
                )}

                {/* Load More Button */}
                {nextCursor && (
                  <div className="flex justify-center mt-12">
                    <Button 
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      size="lg"
                      variant="outline"
                      className="px-8"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More Cars'
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

// Car Card Component - Encar Style
const CarCard = ({ car, convertUSDtoEUR }: { car: any; convertUSDtoEUR: (amount: number) => number }) => {
  const price = convertUSDtoEUR(car.price_cents ? Math.round(car.price_cents / 100) : car.price || 25000);
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
          <img
            src={car.images?.[0] || car.image_url || '/placeholder-car.jpg'}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-foreground mb-1">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-2xl font-bold text-primary">
            €{price.toLocaleString()}
          </p>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{car.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              <span>{car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Fuel className="h-4 w-4" />
              <span>{car.fuel || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>{car.transmission || 'N/A'}</span>
            </div>
          </div>
          {car.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{car.location}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Car List Item Component - Encar Style
const CarListItem = ({ car, convertUSDtoEUR }: { car: any; convertUSDtoEUR: (amount: number) => number }) => {
  const price = convertUSDtoEUR(car.price_cents ? Math.round(car.price_cents / 100) : car.price || 25000);
  
  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-48 h-36 flex-shrink-0">
            <img
              src={car.images?.[0] || car.image_url || '/placeholder-car.jpg'}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-xl text-foreground mb-1">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="text-2xl font-bold text-primary">
                  €{price.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{car.year}</span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="h-4 w-4" />
                <span>{car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4" />
                <span>{car.fuel || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span>{car.transmission || 'N/A'}</span>
              </div>
            </div>
            
            {car.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{car.location}</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" size="sm">
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

export default EncarStyleCatalog;