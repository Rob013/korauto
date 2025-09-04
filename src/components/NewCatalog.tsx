import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import LazyCarCard from "@/components/LazyCarCard";
import { useCarsQuery } from "@/hooks/useCarsQuery";
import { useFiltersFromUrl } from "@/hooks/useFiltersFromUrl";
import { debounce } from "@/utils/performance";

const CARS_PER_PAGE = 24;

// Sort options for the new catalog
const sortOptions = [
  { value: 'recently_added', label: 'Recently Added' },
  { value: 'price_low', label: 'Price: Lowest First' },
  { value: 'price_high', label: 'Price: Highest First' },
  { value: 'year_new', label: 'Year: Newest First' },
  { value: 'year_old', label: 'Year: Oldest First' },
  { value: 'mileage_low', label: 'Mileage: Lowest First' },
  { value: 'mileage_high', label: 'Mileage: Highest First' },
  { value: 'popular', label: 'Most Popular' },
];

const NewCatalog = ({ highlightCarId }: { highlightCarId?: string | null }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get filters from URL
  const { filters, updateFilter, clearFilters } = useFiltersFromUrl();
  
  // Search input state
  const [searchInput, setSearchInput] = useState(filters.search || '');
  
  // Mobile filters panel
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Use the new cars query hook
  const {
    cars,
    total,
    totalPages,
    hasMore,
    models,
    isLoading,
    isFetching,
    isLoadingModels,
    error,
    modelsError,
    refetch,
    prefetchNextPage,
    invalidateQueries,
  } = useCarsQuery(filters);

  // Handle search with debouncing
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      updateFilter('search', searchTerm || undefined);
    }, 500),
    [updateFilter]
  );

  useEffect(() => {
    debouncedSearch(searchInput);
  }, [searchInput, debouncedSearch]);

  // Handle sort change
  const handleSortChange = (sortValue: string) => {
    updateFilter('sort', sortValue);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      const nextPage = Math.floor(cars.length / CARS_PER_PAGE) + 1;
      updateFilter('page', nextPage);
      prefetchNextPage();
    }
  };

  // Handle filter clear
  const handleClearFilters = () => {
    clearFilters();
    setSearchInput('');
    invalidateQueries();
  };

  // Show loading state
  if (isLoading && cars.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-responsive py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading cars...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-responsive py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Car className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">Failed to load cars</h2>
              <p className="text-muted-foreground">{error?.message || 'Please try again later'}</p>
              <Button onClick={() => refetch()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-responsive py-4 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Car Catalog</h1>
            <p className="text-muted-foreground mt-1">
              {total > 0 ? `${total.toLocaleString()} cars available` : 'No cars found'}
            </p>
          </div>
          
          {/* Desktop Sort */}
          <div className="hidden lg:flex gap-4 items-center">
            <select
              value={filters.sort || 'recently_added'}
              onValueChange={handleSortChange}
              placeholder="Sort by"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cars..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Brand Filter */}
            <div className="w-full lg:w-48">
              <AdaptiveSelect
                value={filters.brand || 'all'}
                onValueChange={(value) => updateFilter('brand', value === 'all' ? undefined : value)}
                placeholder="All Brands"
              >
                <option value="all">All Brands</option>
                <option value="bmw">BMW</option>
                <option value="mercedes-benz">Mercedes-Benz</option>
                <option value="audi">Audi</option>
                <option value="toyota">Toyota</option>
                <option value="honda">Honda</option>
                <option value="volkswagen">Volkswagen</option>
                <option value="porsche">Porsche</option>
                <option value="hyundai">Hyundai</option>
                <option value="kia">Kia</option>
                <option value="nissan">Nissan</option>
              </AdaptiveSelect>
            </div>
            
            {/* Model Filter */}
            <div className="w-full lg:w-48">
              <AdaptiveSelect
                value={filters.model || 'all'}
                onValueChange={(value) => updateFilter('model', value === 'all' ? undefined : value)}
                placeholder="All Models"
                disabled={!filters.brand || isLoadingModels}
              >
                <option value="all">All Models</option>
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </AdaptiveSelect>
            </div>

            {/* Mobile Sort */}
            <div className="lg:hidden">
              <AdaptiveSelect
                value={filters.sort || 'recently_added'}
                onValueChange={handleSortChange}
                placeholder="Sort by"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </AdaptiveSelect>
            </div>
            
            {/* Clear Filters */}
            {(filters.search || filters.brand || filters.model) && (
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="shrink-0"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(filters.brand || filters.model || filters.search) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.brand && (
              <Badge variant="secondary" className="flex items-center gap-2">
                Brand: {filters.brand}
                <button 
                  onClick={() => updateFilter('brand', undefined)}
                  className="hover:bg-secondary-foreground/20 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.model && (
              <Badge variant="secondary" className="flex items-center gap-2">
                Model: {filters.model}
                <button 
                  onClick={() => updateFilter('model', undefined)}
                  className="hover:bg-secondary-foreground/20 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-2">
                Search: "{filters.search}"
                <button 
                  onClick={() => {
                    updateFilter('search', undefined);
                    setSearchInput('');
                  }}
                  className="hover:bg-secondary-foreground/20 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Cars Grid */}
        {cars.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {cars.map((car, index) => (
                <LazyCarCard
                  key={car.id}
                  car={{
                    id: car.id,
                    title: car.title || `${car.year} ${car.make} ${car.model}`,
                    year: car.year,
                    manufacturer: { name: car.make },
                    model: { name: car.model },
                    lots: [{
                      buy_now: car.price,
                      odometer: { km: car.mileage || 0 },
                      images: {
                        normal: car.images || [],
                        big: car.images || []
                      }
                    }],
                    fuel: { name: car.fuel || '' },
                    transmission: { name: car.transmission || '' },
                    color: { name: car.color || '' },
                    location: car.location || ''
                  }}
                  index={index}
                  isHighlighted={highlightCarId === car.id}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  size="lg"
                  className="px-8"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Cars
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Car className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">No cars found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Clear all filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCatalog;