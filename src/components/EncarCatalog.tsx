import {
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"
import EncarCarCard from '@/components/EncarCarCard';
import { useSortedCars, SortOption, getEncarSortOptions } from '@/hooks/useSortedCars';
import { useBackendCarSorting } from '@/hooks/useBackendCarSorting';
import { usePriceSorting } from '@/hooks/usePriceSorting';
import { APIFilters, buildBuyNowQueryParams, defaultFilters } from '@/utils/catalog-filter';
import { filterCarsWithRealPricing } from '@/utils/carPricing';
import { suppressCarDataType } from '@/utils/typeSuppress';

interface EncarCatalogProps {
  highlightCarId?: string | null;
  className?: string;
}

interface FlexibleCar {
  id: string;
  year: number; // Make year required
  manufacturer?: { name: string };
  model?: { name: string };
  vin?: string;
  transmission?: { name: string };
  fuel?: { name: string };
  color?: { name: string };
  condition?: string;
  lot_number?: string;
  title?: string;
  status?: number | string;
  sale_status?: string;
  final_price?: number;
  generation?: { name: string };
  body_type?: { name: string };
  engine?: { name: string };
  drive_wheel?: string;
  vehicle_type?: { name: string };
  cylinders?: number;
  lots?: Array<{
    buy_now?: number;
    odometer?: { km?: number };
    popularity_score?: number;
    images?: { 
      normal?: string[];
      big?: string[];
    };
    bid?: number;
    lot?: string;
    status?: string | number;
    sale_status?: string;
    final_price?: number;
    estimate_repair_price?: number;
    pre_accident_price?: number;
    clean_wholesale_price?: number;
    actual_cash_value?: number;
    sale_date?: string;
    seller?: string;
    seller_type?: string;
    detailed_title?: string;
    damage?: {
      main?: string;
      second?: string;
    };
    keys_available?: boolean;
    airbags?: string;
    grade_iaai?: string;
    domain?: { name: string };
    external_id?: string;
  }>;
  popularity_score?: number;
}

const EncarCatalog = ({ highlightCarId, className = '' }: EncarCatalogProps) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const [isMobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<APIFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>('recently_added');
  const [currentPage, setCurrentPage] = useState(1);
  const [cars, setCars] = useState<FlexibleCar[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [allCarsForSorting, setAllCarsForSorting] = useState<FlexibleCar[]>([]);

  const [isMobile, setIsMobile] = useState(false);
  const [loadingManufacturers, setLoadingManufacturers] = useState(true);
  const [loadingModels, setLoadingModels] = useState(true);

  // Initialize sorting hooks
  const { sortCarsGlobally, isSorting } = usePriceSorting();
  
  const { 
    fetchWithBackendSorting, 
    loading: backendSortingLoading 
  } = useBackendCarSorting({
    filters,
    onCarsUpdate: (sortedCars: any[], total: number) => {
      // Convert cars to ensure they have required properties
      const convertedCars = sortedCars.map(car => ({
        ...car,
        year: car.year || 2000, // Ensure year exists
      }));
      setAllCarsForSorting(convertedCars);
      setCars(convertedCars);
      setTotalCount(total);
    },
    onError: (error: string) => {
      console.error('Backend sorting error:', error);
      toast({
        title: "Error",
        description: "Failed to sort cars",
        variant: "destructive"
      });
    }
  });

  // Use sorted cars for display
  const sortedCars = useSortedCars(cars, sortBy);
  const displayCars = sortedCars;

  const fetchCars = useCallback(async (
    newFilters: APIFilters = filters,
    page: number = 1,
    sortOption: SortOption = sortBy
  ) => {
    setIsLoading(true);
    
    try {
      const queryParams = buildBuyNowQueryParams({
        ...newFilters,
        per_page: newFilters.per_page || '50'
      });
      
      const response = await fetch(`${API_BASE_URL}/api/cars?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response received:', {
        totalCars: data.total_count,
        currentPage: data.current_page,
        carsOnPage: data.data?.length || 0
      });

      // Convert API cars to FlexibleCar format
      const convertedCars = (data.data || []).map((car: any) => ({
        ...car,
        year: car.year || 2000, // Ensure year exists
      }));

      setCars(convertedCars);
      setTotalCount(data.total_count || 0);
      setCurrentPage(data.current_page || 1);

      // For sorting purposes, we need all cars if dataset is large
      if (data.total_count > 50 && (sortOption === 'price_low' || sortOption === 'price_high')) {
        console.log('🔄 Large dataset detected, will fetch all cars for global sorting');
      }

    } catch (error) {
      console.error('❌ Error fetching cars:', error);
      toast({
        title: "Error",
        description: "Failed to load cars",
        variant: "destructive"
      });
      setCars([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy]);

  const fetchManufacturers = useCallback(async () => {
    setLoadingManufacturers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/manufacturers`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const manufacturersWithImages = data.data.map((manufacturer: any) => ({
        ...manufacturer,
        image: manufacturer.image || undefined,
      }));
      setManufacturers(manufacturersWithImages);
    } catch (error) {
      console.error('❌ Error fetching manufacturers:', error);
      toast({
        title: "Error", 
        description: "Failed to load manufacturers",
        variant: "destructive"
      });
      setManufacturers([]);
    } finally {
      setLoadingManufacturers(false);
    }
  }, []);

  const fetchModels = useCallback(async (manufacturerId: string) => {
    setLoadingModels(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/models?manufacturer_id=${manufacturerId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setModels(data.data);
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      toast({
        title: "Error",
        description: "Failed to load models",
        variant: "destructive"
      });
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
    fetchManufacturers();

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (selectedManufacturer) {
      fetchModels(selectedManufacturer);
    } else {
      setModels([]);
    }
  }, [selectedManufacturer, fetchModels]);

  const handleManufacturerChange = (event: any) => {
    const manufacturerId = event.target.value;
    setSelectedManufacturer(manufacturerId);
    setFilters({ ...filters, manufacturer_id: manufacturerId, model_id: '' });
    setSelectedModel('');
  };

  const handleModelChange = (event: any) => {
    const modelId = event.target.value;
    setSelectedModel(modelId);
    setFilters({ ...filters, model_id: modelId });
  };

  const handleSearchChange = (event: any) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event: any) => {
    event.preventDefault();
    setFilters({ ...filters, search: searchQuery });
  };

  const handleFilterChange = (newFilters: APIFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setMobileFiltersOpen(false);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setSelectedManufacturer('');
    setSelectedModel('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchCars({ ...filters }, newPage, sortBy);
  };

  // Handle sort change with global sorting for price
  const handleSortChange = useCallback(async (newSortBy: SortOption) => {
    console.log(`🔄 Sort changed to: ${newSortBy}`);
    setSortBy(newSortBy);

    // For large datasets and price sorting, use global sorting
    if (totalCount > 50 && (newSortBy === 'price_low' || newSortBy === 'price_high')) {
      console.log(`🌍 Applying global ${newSortBy} sorting to ${totalCount} cars`);
      
      // If we don't have all cars yet, fetch them first
      if (allCarsForSorting.length < totalCount) {
        try {
          await fetchWithBackendSorting(newSortBy);
        } catch (error) {
          console.error('Failed to fetch with backend sorting:', error);
          // Fallback to client-side sorting with current cars
          await sortCarsGlobally(cars, newSortBy, (sortedCars) => {
            setCars(sortedCars.map(car => ({ ...car, year: car.year || 2000 })));
          });
        }
      } else {
        // Use existing all cars for sorting
        await sortCarsGlobally(allCarsForSorting, newSortBy, (sortedCars) => {
          setCars(sortedCars.map(car => ({ ...car, year: car.year || 2000 })));
        });
      }
    } else {
      // For small datasets or non-price sorting, just re-fetch
      await fetchCars(filters, 1, newSortBy);
    }
  }, [totalCount, allCarsForSorting, cars, filters, fetchWithBackendSorting, sortCarsGlobally, fetchCars]);

  // Calculate pagination
  const carsPerPage = parseInt(filters.per_page || '50');
  const totalPages = Math.ceil(totalCount / carsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Get cars for current page from sorted results
  const startIndex = (currentPage - 1) * carsPerPage;
  const endIndex = startIndex + carsPerPage;
  const carsForCurrentPage = displayCars.slice(startIndex, endIndex);

  const showLoading = isLoading || isSorting || backendSortingLoading;

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Mobile filters will be added later */}
      
      <div className="container mx-auto px-4 py-4">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Cars Catalog</h1>
          
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cars..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </form>

            
            <div className="flex items-center gap-2">
              {isMobile ? (
                <Button
                  variant="outline"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          
          
          {/* Results */}
          <div className="flex-1">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {showLoading ? (
                  'Loading...'
                ) : (
                  `${totalCount.toLocaleString()} cars found`
                )}
              </div>

              {/* Sort dropdown */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getEncarSortOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevPage || showLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <span className="text-sm px-4">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage || showLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Cars Grid */}
            {showLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">
                  {isSorting ? 'Sorting cars...' : 'Loading cars...'}
                </span>
              </div>
            ) : carsForCurrentPage.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {carsForCurrentPage.map((car) => (
                  <EncarCarCard
                    key={car.id}
                    id={car.id}
                    make={car.manufacturer?.name || ''}
                    model={car.model?.name || ''}
                    year={car.year}
                    price={car.lots?.[0]?.buy_now || 0}
                    image={car.lots?.[0]?.images?.normal?.[0]}
                    mileage={car.lots?.[0]?.odometer?.km ? `${car.lots[0].odometer.km} km` : ''}
                    fuel={car.fuel?.name}
                    transmission={car.transmission?.name}
                    color={car.color?.name}
                     lot={car.lots?.[0]?.lot}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No cars found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { EncarCatalog };
