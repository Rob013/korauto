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
  RefreshCw,
} from "lucide-react";
import LoadingLogo from "@/components/LoadingLogo";
import CarCard from "@/components/CarCard";
import { useSearchParams } from "react-router-dom";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchCarsWithKeyset, type CarFilters, type SortOption, type Car as ApiCar } from "@/services/carsApi";

interface EncarCatalogProps {
  highlightCarId?: string | null;
}

// Use the ApiCar type directly
type Car = ApiCar;

const EncarCatalog = ({ highlightCarId }: EncarCatalogProps = {}) => {
  const { toast } = useToast();
  const { convertUSDtoEUR, exchangeRate } = useCurrencyAPI();
  const isMobile = useIsMobile();
  
  // State for cars data using new API service
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMorePages, setHasMorePages] = useState(false);
  
  // Filters and sorting state
  const [filters, setFilters] = useState<CarFilters>({});
  const [sortBy, setSortBy] = useState("price_asc" as SortOption);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Load cars from database
  const loadCars = useCallback(async (resetData = false, cursor?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading cars with filters:', filters, 'sort:', sortBy, 'cursor:', cursor);
      
      const response = await fetchCarsWithKeyset({
        filters,
        sort: sortBy,
        limit: 24,
        cursor
      });
      
      console.log('✅ Loaded cars:', response.items.length, 'total:', response.total);
      
      if (resetData) {
        setCars(response.items as Car[]);
      } else {
        setCars(prev => [...prev, ...response.items] as Car[]);
      }
      
      setTotalCount(response.total);
      setNextCursor(response.nextCursor || null);
      setHasMorePages(!!response.nextCursor);
      
    } catch (error) {
      console.error('❌ Error loading cars:', error);
      setError('Failed to load cars. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load cars from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, toast]);

  // Load more cars for pagination
  const loadMore = useCallback(() => {
    if (hasMorePages && !loading && nextCursor) {
      loadCars(false, nextCursor);
    }
  }, [hasMorePages, loading, nextCursor, loadCars]);

  // Apply filters and reload cars
  const applyFilters = useCallback(async (newFilters: CarFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setNextCursor(null);
    
    // Update URL
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
    
    // Reload cars with new filters
    await loadCars(true);
  }, [loadCars, setSearchParams]);

  // Handle search
  const handleSearch = useCallback(async () => {
    const searchFilters: CarFilters = {
      ...filters,
      search: searchTerm.trim() || undefined
    };
    await applyFilters(searchFilters);
  }, [searchTerm, filters, applyFilters]);

  // Handle sort change
  const handleSortChange = useCallback(async (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
    setNextCursor(null);
    await loadCars(true);
  }, [loadCars]);

  // Load initial data
  useEffect(() => {
    loadCars(true);
  }, []); // Only run once on mount

  // Get unique makes and models for filter dropdowns
  const availableMakes = useMemo(() => {
    const makes = [...new Set(cars.map(car => car.make))].filter(Boolean);
    return makes.sort();
  }, [cars]);

  const availableModels = useMemo(() => {
    if (!filters.make) return [];
    const models = [...new Set(cars.filter(car => car.make === filters.make).map(car => car.model))].filter(Boolean);
    return models.sort();
  }, [cars, filters.make]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with filters toggle */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Car Catalog</h1>
              {totalCount > 0 && (
                <Badge variant="secondary">
                  {totalCount.toLocaleString()} cars
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <Button
                onClick={() => loadCars(true)}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {!isMobile && "Refresh"}
              </Button>
              
              {/* Filter toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4" />
                {!isMobile && "Filters"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Filter Panel */}
        {showFilters && (
          <div className="w-80 bg-card border-r p-6 space-y-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button
                onClick={() => setShowFilters(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search cars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Make filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Make</label>
              <select
                value={filters.make || ''}
                onChange={(e) => applyFilters({ ...filters, make: e.target.value || undefined, model: undefined })}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="">All Makes</option>
                {availableMakes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </div>

            {/* Model filter */}
            {filters.make && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <select
                  value={filters.model || ''}
                  onChange={(e) => applyFilters({ ...filters, model: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">All Models</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Year Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="From"
                  value={String(filters.yearMin || '')}
                  onChange={(e) => applyFilters({ ...filters, yearMin: e.target.value || undefined })}
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={String(filters.yearMax || '')}
                  onChange={(e) => applyFilters({ ...filters, yearMax: e.target.value || undefined })}
                />
              </div>
            </div>

            {/* Price filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range (€)</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="From"
                  value={String(filters.priceMin || '')}
                  onChange={(e) => applyFilters({ ...filters, priceMin: e.target.value || undefined })}
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={String(filters.priceMax || '')}
                  onChange={(e) => applyFilters({ ...filters, priceMax: e.target.value || undefined })}
                />
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="year_desc">Year: Newest First</option>
                <option value="make_asc">Make A-Z</option>
              </select>
            </div>

            {/* Clear filters */}
            <Button
              onClick={() => {
                setFilters({});
                setSearchTerm('');
                setSearchParams(new URLSearchParams());
                loadCars(true);
              }}
              variant="outline"
              className="w-full"
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1">
          <div className="container-responsive py-6">
            {/* Error state */}
            {error && (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => loadCars(true)}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Loading state */}
            {loading && cars.length === 0 && (
              <div className="text-center py-12">
                <LoadingLogo />
                <p className="mt-4 text-muted-foreground">Loading cars...</p>
              </div>
            )}

            {/* Cars grid */}
            {!error && cars.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {cars.map((car) => (
                    <CarCard
                      key={car.id}
                      id={car.id}
                      make={car.make}
                      model={car.model}
                      year={car.year}
                      price={car.price}
                      mileage={car.mileage?.toString()}
                      fuel={car.fuel}
                      transmission={car.transmission}
                      color={car.color}
                      title={car.title}
                      image={car.images?.[0] || car.image_url}
                      lot={car.id}
                    />
                  ))}
                </div>

                {/* Load more button */}
                {hasMorePages && (
                  <div className="text-center mt-8">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="outline"
                    >
                      {loading ? (
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

            {/* Empty state */}
            {!loading && !error && cars.length === 0 && (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cars found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms.
                </p>
                <Button onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                  loadCars(true);
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncarCatalog;