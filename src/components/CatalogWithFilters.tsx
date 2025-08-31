import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Search, Car, Filter, X, ChevronDown, ChevronUp, Calendar, DollarSign, Settings, Fuel, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CatalogWithFiltersProps {
  highlightCarId?: string | null;
}

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
  images?: any;
  created_at?: string;
}

interface FilterCounts {
  makes: Record<string, number>;
  models: Record<string, number>;
  fuels: Record<string, number>;
  transmissions: Record<string, number>;
  colors: Record<string, number>;
}

const sortOptions = [
  { value: 'created_at_desc', label: 'Recently Added' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_asc', label: 'Year: Old to New' },
  { value: 'year_desc', label: 'Year: New to Old' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_desc', label: 'Mileage: High to Low' },
];

export const CatalogWithFilters = ({ highlightCarId }: CatalogWithFiltersProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for cars and loading
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedMake, setSelectedMake] = useState(searchParams.get('make') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '');
  const [selectedFuel, setSelectedFuel] = useState(searchParams.get('fuel') || '');
  const [selectedTransmission, setSelectedTransmission] = useState(searchParams.get('transmission') || '');
  const [selectedColor, setSelectedColor] = useState(searchParams.get('color') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at_desc');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  
  // Range filters
  const [yearRange, setYearRange] = useState<[number, number]>([2000, 2024]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [mileageRange, setMileageRange] = useState<[number, number]>([0, 500000]);
  
  // UI state
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  
  // Filter counts for faceted filtering
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    makes: {},
    models: {},
    fuels: {},
    transmissions: {},
    colors: {}
  });

  // Pagination
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Load all cars from database
  const loadAllCars = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cars_cache')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cars:', error);
        toast({
          title: "Error loading cars",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const carsData: Car[] = data?.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price || 0,
        mileage: car.mileage,
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        images: car.images,
        created_at: car.created_at
      })) || [];

      setCars(carsData);
      
      // Calculate filter counts
      const counts: FilterCounts = {
        makes: {},
        models: {},
        fuels: {},
        transmissions: {},
        colors: {}
      };
      
      carsData.forEach(car => {
        // Count makes
        if (car.make) {
          counts.makes[car.make] = (counts.makes[car.make] || 0) + 1;
        }
        
        // Count models
        if (car.model) {
          counts.models[car.model] = (counts.models[car.model] || 0) + 1;
        }
        
        // Count fuels
        if (car.fuel) {
          counts.fuels[car.fuel] = (counts.fuels[car.fuel] || 0) + 1;
        }
        
        // Count transmissions
        if (car.transmission) {
          counts.transmissions[car.transmission] = (counts.transmissions[car.transmission] || 0) + 1;
        }
        
        // Count colors
        if (car.color) {
          counts.colors[car.color] = (counts.colors[car.color] || 0) + 1;
        }
      });
      
      setFilterCounts(counts);

      // Set price and year ranges based on actual data
      if (carsData.length > 0) {
        const years = carsData.map(car => car.year).filter(Boolean);
        const prices = carsData.map(car => car.price).filter(Boolean);
        const mileages = carsData.map(car => car.mileage ? parseInt(car.mileage) : 0).filter(Boolean);
        
        if (years.length > 0) {
          const minYear = Math.min(...years);
          const maxYear = Math.max(...years);
          setYearRange([minYear, maxYear]);
        }
        
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange([Math.floor(minPrice), Math.ceil(maxPrice)]);
        }
        
        if (mileages.length > 0) {
          const minMileage = Math.min(...mileages);
          const maxMileage = Math.max(...mileages);
          setMileageRange([minMileage, maxMileage]);
        }
      }
      
    } catch (error) {
      console.error('Error in loadAllCars:', error);
      toast({
        title: "Error loading cars", 
        description: "Failed to load cars from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Apply filters to cars
  const applyFilters = useCallback(() => {
    let filtered = [...cars];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(car =>
        car.make?.toLowerCase().includes(searchLower) ||
        car.model?.toLowerCase().includes(searchLower)
      );
    }

    // Make filter  
    if (selectedMake && selectedMake !== 'all') {
      filtered = filtered.filter(car => car.make === selectedMake);
    }

    // Model filter
    if (selectedModel && selectedModel !== 'all') {
      filtered = filtered.filter(car => car.model === selectedModel);
    }

    // Fuel filter
    if (selectedFuel && selectedFuel !== 'all') {
      filtered = filtered.filter(car => car.fuel === selectedFuel);
    }

    // Transmission filter
    if (selectedTransmission && selectedTransmission !== 'all') {
      filtered = filtered.filter(car => car.transmission === selectedTransmission);
    }

    // Color filter
    if (selectedColor && selectedColor !== 'all') {
      filtered = filtered.filter(car => car.color === selectedColor);
    }

    // Year range filter
    filtered = filtered.filter(car => car.year >= yearRange[0] && car.year <= yearRange[1]);

    // Price range filter
    filtered = filtered.filter(car => car.price >= priceRange[0] && car.price <= priceRange[1]);

    // Mileage range filter
    if (mileageRange) {
      filtered = filtered.filter(car => {
        const mileage = car.mileage ? parseInt(car.mileage) : 0;
        return mileage >= mileageRange[0] && mileage <= mileageRange[1];
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_asc':
          return a.year - b.year;
        case 'year_desc':
          return b.year - a.year;
        case 'mileage_asc':
          const aMileage = a.mileage ? parseInt(a.mileage) : 0;
          const bMileage = b.mileage ? parseInt(b.mileage) : 0;
          return aMileage - bMileage;
        case 'mileage_desc':
          const aMileageDesc = a.mileage ? parseInt(a.mileage) : 0;
          const bMileageDesc = b.mileage ? parseInt(b.mileage) : 0;
          return bMileageDesc - aMileageDesc;
        case 'created_at_desc':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    setFilteredCars(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change
  }, [cars, searchTerm, selectedMake, selectedModel, selectedFuel, selectedTransmission, selectedColor, sortBy, yearRange, priceRange, mileageRange]);

  // Get paginated cars for display
  const paginatedCars = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredCars.slice(startIndex, endIndex);
  }, [filteredCars, currentPage]);

  // Get available models based on selected make
  const availableModels = useMemo(() => {
    if (!selectedMake || selectedMake === 'all') return [];
    return cars
      .filter(car => car.make === selectedMake)
      .reduce((models: string[], car) => {
        if (car.model && !models.includes(car.model)) {
          models.push(car.model);
        }
        return models;
      }, [])
      .sort();
  }, [cars, selectedMake]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const newParams = new URLSearchParams();
    
    if (searchTerm) newParams.set('q', searchTerm);
    if (selectedMake && selectedMake !== 'all') newParams.set('make', selectedMake);
    if (selectedModel && selectedModel !== 'all') newParams.set('model', selectedModel);
    if (selectedFuel && selectedFuel !== 'all') newParams.set('fuel', selectedFuel);
    if (selectedTransmission && selectedTransmission !== 'all') newParams.set('transmission', selectedTransmission);
    if (selectedColor && selectedColor !== 'all') newParams.set('color', selectedColor);
    if (sortBy !== 'created_at_desc') newParams.set('sort', sortBy);
    if (currentPage > 1) newParams.set('page', currentPage.toString());

    setSearchParams(newParams);
  }, [searchTerm, selectedMake, selectedModel, selectedFuel, selectedTransmission, selectedColor, sortBy, currentPage, setSearchParams]);

  // Effects
  useEffect(() => {
    loadAllCars();
  }, [loadAllCars]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel(''); // Reset model when make changes
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMake('');
    setSelectedModel('');
    setSelectedFuel('');
    setSelectedTransmission('');
    setSelectedColor('');
    setSortBy('created_at_desc');
    setCurrentPage(1);
    // Reset ranges to full range
    const years = cars.map(car => car.year).filter(Boolean);
    const prices = cars.map(car => car.price).filter(Boolean);
    const mileages = cars.map(car => car.mileage ? parseInt(car.mileage) : 0).filter(Boolean);
    
    if (years.length > 0) {
      setYearRange([Math.min(...years), Math.max(...years)]);
    }
    if (prices.length > 0) {
      setPriceRange([Math.min(...prices), Math.max(...prices)]);
    }
    if (mileages.length > 0) {
      setMileageRange([Math.min(...mileages), Math.max(...mileages)]);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedMake && selectedMake !== 'all') count++;
    if (selectedModel && selectedModel !== 'all') count++;
    if (selectedFuel && selectedFuel !== 'all') count++;
    if (selectedTransmission && selectedTransmission !== 'all') count++;
    if (selectedColor && selectedColor !== 'all') count++;
    return count;
  }, [searchTerm, selectedMake, selectedModel, selectedFuel, selectedTransmission, selectedColor]);

  return (
    <div className="container-responsive py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cars Catalog</h1>
          <Badge variant="secondary">
            {totalCount.toLocaleString()} cars
          </Badge>
        </div>

        {/* Mobile filter toggle */}
        {isMobile && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <div className={cn(
          "lg:col-span-1 space-y-4",
          isMobile ? (showFilters ? 'block' : 'hidden') : 'block'
        )}>
          <div className="bg-card rounded-lg border p-4 space-y-4">
            {/* Header with clear filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Filters</h3>
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cars..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Basic Filters */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                onClick={() => toggleSection('basic')}
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="font-medium">Basic Filters</span>
                </div>
                {expandedSections.includes('basic') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {expandedSections.includes('basic') && (
                <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                  {/* Make */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Make</label>
                    <Select value={selectedMake} onValueChange={handleMakeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Makes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Makes</SelectItem>
                        {Object.entries(filterCounts.makes).map(([make, count]) => (
                          <SelectItem key={make} value={make}>
                            {make} ({count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model</label>
                    <Select 
                      value={selectedModel} 
                      onValueChange={handleModelChange}
                      disabled={!selectedMake || selectedMake === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedMake || selectedMake === 'all' ? "Select Make First" : "All Models"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        {availableModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Year Range
                    </label>
                    <div className="px-2">
                      <Slider
                        value={yearRange}
                        onValueChange={(value) => setYearRange([value[0], value[1]])}
                        min={2000}
                        max={2024}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>{yearRange[0]}</span>
                        <span>{yearRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Price Range (€)
                    </label>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange([value[0], value[1]])}
                        min={0}
                        max={200000}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>€{priceRange[0].toLocaleString()}</span>
                        <span>€{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                onClick={() => toggleSection('advanced')}
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="font-medium">Advanced Filters</span>
                </div>
                {expandedSections.includes('advanced') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {expandedSections.includes('advanced') && (
                <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                  {/* Fuel */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      Fuel Type
                    </label>
                    <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Fuel Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fuel Types</SelectItem>
                        {Object.entries(filterCounts.fuels).map(([fuel, count]) => (
                          <SelectItem key={fuel} value={fuel}>
                            {fuel} ({count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transmission */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Transmission
                    </label>
                    <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Transmissions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Transmissions</SelectItem>
                        {Object.entries(filterCounts.transmissions).map(([transmission, count]) => (
                          <SelectItem key={transmission} value={transmission}>
                            {transmission} ({count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mileage Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Mileage (km)
                    </label>
                    <div className="px-2">
                      <Slider
                        value={mileageRange}
                        onValueChange={(value) => setMileageRange([value[0], value[1]])}
                        min={0}
                        max={500000}
                        step={10000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>{mileageRange[0].toLocaleString()} km</span>
                        <span>{mileageRange[1].toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingLogo />
              <p className="text-muted-foreground mt-4">Loading cars...</p>
            </div>
          )}

          {/* Cars grid */}
          {!isLoading && paginatedCars.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedCars.map((car) => (
                  <LazyCarCard
                    key={car.id}
                    id={car.id}
                    make={car.make}
                    model={car.model}
                    year={car.year}
                    price={car.price}
                    mileage={car.mileage}
                    image={car.images && car.images.length > 0 ? 
                      (typeof car.images[0] === 'string' ? car.images[0] : car.images[0]?.url) : 
                      undefined
                    }
                    title={`${car.year} ${car.make} ${car.model}`}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, currentPage - 2) + i;
                      if (page > totalPages) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {/* No results */}
          {!isLoading && paginatedCars.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cars found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Try adjusting your filters to find more results.
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};