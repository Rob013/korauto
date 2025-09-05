import { useEffect, useState, useCallback } from 'react';
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
  Car,
  Award
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
  const { 
    fetchManufacturers, 
    fetchModels, 
    fetchGrades, 
    fetchTrimLevels 
  } = useSecureAuctionAPI();
  
  // State for cars and pagination
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<CarsApiSortOption>('created_desc');
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<CarFilters & {
    bodyType?: string;
    transmission?: string;
    priceRange?: [number, number];
    yearRange?: [number, number];
    mileageRange?: [number, number];
    manufacturerId?: string;
    modelId?: string;
    selectedGrades?: string[];
    selectedTrims?: string[];
  }>({
    priceRange: [5000, 100000],
    yearRange: [2000, 2024],
    mileageRange: [0, 300000]
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  
  // API data state
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [trimLevels, setTrimLevels] = useState<any[]>([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingTrims, setLoadingTrims] = useState(false);

  
  // Load manufacturers on component mount
  useEffect(() => {
    const loadManufacturers = async () => {
      setLoadingManufacturers(true);
      try {
        const data = await fetchManufacturers();
        setManufacturers(data);
      } catch (err) {
        console.error('Failed to load manufacturers:', err);
      } finally {
        setLoadingManufacturers(false);
      }
    };
    loadManufacturers();
  }, [fetchManufacturers]);

  // Load models when manufacturer changes
  useEffect(() => {
    if (filters.manufacturerId) {
      const loadModels = async () => {
        setLoadingModels(true);
        try {
          const data = await fetchModels(filters.manufacturerId);
          setModels(data);
        } catch (err) {
          console.error('Failed to load models:', err);
          setModels([]);
        } finally {
          setLoadingModels(false);
        }
      };
      loadModels();
    } else {
      setModels([]);
    }
  }, [filters.manufacturerId, fetchModels]);

  // Load grades when manufacturer or model changes
  useEffect(() => {
    if (filters.manufacturerId) {
      const loadGrades = async () => {
        setLoadingGrades(true);
        try {
          const data = await fetchGrades(filters.manufacturerId, filters.modelId);
          setGrades(data);
        } catch (err) {
          console.error('Failed to load grades:', err);
          setGrades([]);
        } finally {
          setLoadingGrades(false);
        }
      };
      loadGrades();
    } else {
      setGrades([]);
    }
  }, [filters.manufacturerId, filters.modelId, fetchGrades]);

  // Load trim levels when manufacturer or model changes
  useEffect(() => {
    if (filters.manufacturerId) {
      const loadTrims = async () => {
        setLoadingTrims(true);
        try {
          const data = await fetchTrimLevels(filters.manufacturerId, filters.modelId);
          setTrimLevels(data);
        } catch (err) {
          console.error('Failed to load trim levels:', err);
          setTrimLevels([]);
        } finally {
          setLoadingTrims(false);
        }
      };
      loadTrims();
    } else {
      setTrimLevels([]);
    }
  }, [filters.manufacturerId, filters.modelId, fetchTrimLevels]);

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
        manufacturerId: filters.manufacturerId,
        modelId: filters.modelId,
        grades: filters.selectedGrades?.length ? filters.selectedGrades.join(',') : undefined,
        trims: filters.selectedTrims?.length ? filters.selectedTrims.join(',') : undefined
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
      mileageRange: [0, 300000],
      manufacturerId: undefined,
      modelId: undefined,
      selectedGrades: [],
      selectedTrims: []
    });
    setSearchTerm('');
    setSelectedMakes([]);
  };

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
                filters.make || filters.model || filters.fuel ||
                filters.manufacturerId || filters.modelId ||
                (filters.selectedGrades && filters.selectedGrades.length > 0) ||
                (filters.selectedTrims && filters.selectedTrims.length > 0)) && (
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
                {(selectedMakes.length > 0 || searchTerm ||
                  filters.manufacturerId || filters.modelId ||
                  (filters.selectedGrades && filters.selectedGrades.length > 0) ||
                  (filters.selectedTrims && filters.selectedTrims.length > 0)) && (
                  <Badge variant="secondary" className="ml-1">
                    {[
                      selectedMakes.length,
                      searchTerm ? 1 : 0,
                      filters.manufacturerId ? 1 : 0,
                      filters.modelId ? 1 : 0,
                      filters.selectedGrades?.length || 0,
                      filters.selectedTrims?.length || 0
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex gap-6 py-6">
          {/* Filters Sidebar - Encar Style */}
          {showFilters && (
            <div className="w-80 space-y-6">
              {/* Brand/Manufacturer */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Brand
                  </h3>
                  <Select 
                    value={filters.manufacturerId || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      manufacturerId: value === 'all' ? undefined : value,
                      modelId: undefined, // Reset model when brand changes
                      selectedGrades: [],
                      selectedTrims: []
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingManufacturers ? "Loading brands..." : "Select Brand"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                          <div className="flex items-center gap-2">
                            {manufacturer.image && (
                              <img 
                                src={manufacturer.image} 
                                alt={manufacturer.name} 
                                className="w-4 h-4 object-contain" 
                              />
                            )}
                            <span>{manufacturer.name} ({manufacturer.cars_qty || 0})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Model */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Model
                  </h3>
                  <Select 
                    value={filters.modelId || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      modelId: value === 'all' ? undefined : value,
                      selectedGrades: [],
                      selectedTrims: []
                    }))}
                    disabled={!filters.manufacturerId || loadingModels}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        !filters.manufacturerId ? "Select brand first" :
                        loadingModels ? "Loading models..." : 
                        "Select Model"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id.toString()}>
                          {model.name} ({model.cars_qty || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Grade */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Grade
                  </h3>
                  {!filters.manufacturerId ? (
                    <div className="text-sm text-muted-foreground">Select brand first</div>
                  ) : loadingGrades ? (
                    <div className="text-sm text-muted-foreground">Loading grades...</div>
                  ) : grades.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No grades available</div>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {grades.map((grade) => (
                        <div key={grade.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`grade-${grade.value}`}
                            checked={filters.selectedGrades?.includes(grade.value) || false}
                            onCheckedChange={(checked) => {
                              const currentGrades = filters.selectedGrades || [];
                              const newGrades = checked 
                                ? [...currentGrades, grade.value]
                                : currentGrades.filter(g => g !== grade.value);
                              setFilters(prev => ({ ...prev, selectedGrades: newGrades }));
                            }}
                          />
                          <label htmlFor={`grade-${grade.value}`} className="text-sm font-medium cursor-pointer">
                            {grade.label} {grade.count ? `(${grade.count})` : ''}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trim Level */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Trim Level
                  </h3>
                  {!filters.manufacturerId ? (
                    <div className="text-sm text-muted-foreground">Select brand first</div>
                  ) : loadingTrims ? (
                    <div className="text-sm text-muted-foreground">Loading trim levels...</div>
                  ) : trimLevels.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No trim levels available</div>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {trimLevels.map((trim) => (
                        <div key={trim.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`trim-${trim.value}`}
                            checked={filters.selectedTrims?.includes(trim.value) || false}
                            onCheckedChange={(checked) => {
                              const currentTrims = filters.selectedTrims || [];
                              const newTrims = checked 
                                ? [...currentTrims, trim.value]
                                : currentTrims.filter(t => t !== trim.value);
                              setFilters(prev => ({ ...prev, selectedTrims: newTrims }));
                            }}
                          />
                          <label htmlFor={`trim-${trim.value}`} className="text-sm font-medium cursor-pointer">
                            {trim.label} {trim.count ? `(${trim.count})` : ''}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Price Range */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Price Range</h3>
                  <div className="space-y-4">
                    <Slider
                      value={filters.priceRange || [5000, 100000]}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                      max={200000}
                      min={1000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>€{filters.priceRange?.[0]?.toLocaleString()}</span>
                      <span>€{filters.priceRange?.[1]?.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Year Range */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Year</h3>
                  <div className="space-y-4">
                    <Slider
                      value={filters.yearRange || [2000, 2024]}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, yearRange: value as [number, number] }))}
                      max={2024}
                      min={1990}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{filters.yearRange?.[0]}</span>
                      <span>{filters.yearRange?.[1]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fuel Type */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Fuel Type</h3>
                  <div className="space-y-3">
                    {FUEL_TYPES.map((fuel) => (
                      <div key={fuel} className="flex items-center space-x-2">
                        <Checkbox
                          id={fuel}
                          checked={filters.fuel === fuel}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, fuel: checked ? fuel : undefined }))
                          }
                        />
                        <label htmlFor={fuel} className="text-sm font-medium cursor-pointer">
                          {fuel}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Transmission */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Transmission</h3>
                  <div className="space-y-3">
                    {TRANSMISSIONS.map((trans) => (
                      <div key={trans} className="flex items-center space-x-2">
                        <Checkbox
                          id={trans}
                          checked={filters.transmission === trans}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, transmission: checked ? trans : undefined }))
                          }
                        />
                        <label htmlFor={trans} className="text-sm font-medium cursor-pointer">
                          {trans}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Body Type */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Body Type</h3>
                  <div className="space-y-3">
                    {BODY_TYPES.map((body) => (
                      <div key={body} className="flex items-center space-x-2">
                        <Checkbox
                          id={body}
                          checked={filters.bodyType === body}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, bodyType: checked ? body : undefined }))
                          }
                        />
                        <label htmlFor={body} className="text-sm font-medium cursor-pointer">
                          {body}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
  
  const handleCardClick = () => {
    // Navigate to car details page using lot number or id
    const carId = car.lot_number || car.id;
    window.location.href = `/car/${carId}`;
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCardClick();
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hello! I'm interested in the ${car.year} ${car.make} ${car.model}. Could you provide more information?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={handleCardClick}>
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
          <img
            src={car.images?.[0] || car.image_url || '/placeholder-car.jpg'}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
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
          <Button className="flex-1" size="sm" onClick={handleViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm" onClick={handleContact}>
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
  
  const handleCardClick = () => {
    // Navigate to car details page using lot number or id
    const carId = car.lot_number || car.id;
    window.location.href = `/car/${carId}`;
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCardClick();
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hello! I'm interested in the ${car.year} ${car.make} ${car.model}. Could you provide more information?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer" onClick={handleCardClick}>
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
                <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
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
              <Button size="sm" onClick={handleViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" size="sm" onClick={handleContact}>
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