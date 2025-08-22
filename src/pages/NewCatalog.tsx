import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFiltersFromUrl } from '@/hooks/useFiltersFromUrl';
import { useCarsQuery } from '@/hooks/useCarsQuery';
import FiltersPanel from '@/components/FiltersPanel';
import CarsList from '@/components/CarsList';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, X, ArrowLeft, ArrowUpDown } from 'lucide-react';
import { trackPageView } from '@/utils/analytics';
import { cn } from '@/lib/utils';

const Header = lazy(() => import('@/components/Header'));
const Footer = lazy(() => import('@/components/Footer'));

// Create a separate QueryClient for the new catalog
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45000, // 45 seconds
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry aborted requests
        if (error instanceof Error && error.name === 'AbortError') {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Mock data for the filters panel - replace with actual API calls
const mockFiltersData = {
  brands: [
    { id: 'toyota', name: 'Toyota', count: 245 },
    { id: 'honda', name: 'Honda', count: 134 },
    { id: 'bmw', name: 'BMW', count: 312 },
    { id: 'mercedes-benz', name: 'Mercedes-Benz', count: 189 },
    { id: 'audi', name: 'Audi', count: 245 },
    { id: 'volkswagen', name: 'Volkswagen', count: 156 },
    { id: 'hyundai', name: 'Hyundai', count: 201 },
    { id: 'kia', name: 'Kia', count: 134 },
  ],
  models: [
    { id: 'a3', name: 'A3', brandId: 'audi', count: 45 },
    { id: 'a4', name: 'A4', brandId: 'audi', count: 67 },
    { id: 'a6', name: 'A6', brandId: 'audi', count: 38 },
    { id: '3-series', name: '3 Series', brandId: 'bmw', count: 89 },
    { id: '5-series', name: '5 Series', brandId: 'bmw', count: 76 },
    { id: 'x3', name: 'X3', brandId: 'bmw', count: 54 },
    { id: 'c-class', name: 'C-Class', brandId: 'mercedes', count: 43 },
    { id: 'e-class', name: 'E-Class', brandId: 'mercedes', count: 52 },
    { id: 'glc', name: 'GLC', brandId: 'mercedes', count: 34 },
  ],
  fuelTypes: [
    { id: 'petrol', name: 'Benzinë', count: 567 },
    { id: 'diesel', name: 'Dizel', count: 432 },
    { id: 'hybrid', name: 'Hibrid', count: 123 },
    { id: 'electric', name: 'Elektrik', count: 89 },
  ],
  transmissions: [
    { id: 'manual', name: 'Manuale', count: 543 },
    { id: 'automatic', name: 'Automatike', count: 678 },
    { id: 'cvt', name: 'CVT', count: 45 },
  ],
  bodyTypes: [
    { id: 'sedan', name: 'Sedan', count: 456 },
    { id: 'suv', name: 'SUV', count: 334 },
    { id: 'hatchback', name: 'Hatchback', count: 234 },
    { id: 'coupe', name: 'Coupé', count: 123 },
    { id: 'wagon', name: 'Wagon', count: 87 },
  ],
  colors: [
    { id: 'black', name: 'E Zezë', count: 234 },
    { id: 'white', name: 'E Bardhë', count: 198 },
    { id: 'silver', name: 'Argjendtë', count: 156 },
    { id: 'gray', name: 'Gri', count: 134 },
    { id: 'blue', name: 'Blu', count: 98 },
    { id: 'red', name: 'E Kuqe', count: 76 },
  ],
  locations: [
    { id: 'pristina', name: 'Prishtinë', count: 456 },
    { id: 'prizren', name: 'Prizren', count: 234 },
    { id: 'mitrovica', name: 'Mitrovicë', count: 123 },
    { id: 'peja', name: 'Pejë', count: 98 },
  ],
  yearRange: { min: 2000, max: 2024 },
  priceRange: { min: 5000, max: 100000 },
  mileageRange: { min: 0, max: 300000 },
};

const sortOptions = [
  { value: 'recently_added', label: 'Shtuar së Fundmi' },
  { value: 'price_asc', label: 'Çmimi: Nga i Ulët në të Lartë' },
  { value: 'price_desc', label: 'Çmimi: Nga i Lartë në të Ulët' },
  { value: 'year_desc', label: 'Viti: Më të Rejat së Pari' },
  { value: 'year_asc', label: 'Viti: Më të Vjetrat së Pari' },
  { value: 'mileage_asc', label: 'Kilometrazhi: Nga i Ulët në të Lartë' },
  { value: 'mileage_desc', label: 'Kilometrazhi: Nga i Lartë në të Ulët' },
];

const CatalogContent: React.FC = () => {
  const navigate = useNavigate();
  const { filters, updateFilters, updateFilter, updateBrand, clearFilters } = useFiltersFromUrl();
  const { cars, total, totalPages, hasMore, models, isLoading, isFetching, error, prefetchNextPage } = useCarsQuery(filters);
  
  const [showFilters, setShowFilters] = useState(true);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);

  // Track page view
  useEffect(() => {
    trackPageView(undefined, { 
      page_type: 'new_catalog',
      total_cars: total,
      active_filters: Object.keys(filters).filter(key => 
        filters[key as keyof typeof filters] !== undefined && 
        key !== 'page' && 
        key !== 'pageSize' && 
        key !== 'sort'
      ).length
    });
  }, [total, filters]);

  // Update filters data with models from query
  const filtersData = {
    ...mockFiltersData,
    models: models.map(model => ({
      id: model.id,
      name: model.name,
      brandId: model.brandId,
      count: undefined,
    })),
  };

  const handleCarClick = (car: any) => {
    navigate(`/car/${car.id}`);
  };

  const handleLoadMore = () => {
    updateFilter('page', (filters.page || 1) + 1);
  };

  const handleSortChange = (sortValue: string) => {
    updateFilter('sort', sortValue);
  };

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    updateFilters(newFilters);
  };

  const handleBrandChange = (brandId: string) => {
    updateBrand(brandId);
  };

  // Count active filters for display
  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof typeof filters] !== undefined && 
    key !== 'page' && 
    key !== 'pageSize' && 
    key !== 'sort'
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <Header />
      </Suspense>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Filters Sidebar */}
        <div className={cn(
          'transition-all duration-300 ease-in-out border-r bg-card',
          showFilters && !filterPanelCollapsed ? 'w-80' : 'w-0',
          'flex-shrink-0 overflow-hidden'
        )}>
          <div className="h-full overflow-y-auto">
            {showFilters && !filterPanelCollapsed && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterPanelCollapsed(true)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <FiltersPanel
                  filters={filters}
                  data={filtersData}
                  isLoading={isLoading}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={clearFilters}
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {(!showFilters || filterPanelCollapsed) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFilters(true);
                      setFilterPanelCollapsed(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Show Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Sort Control */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={filters.sort || 'recently_added'} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sort by" />
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

            {/* Results Summary */}
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Car Catalog
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{total.toLocaleString()} cars found</span>
                {cars.length > 0 && cars.length < total && (
                  <>
                    <span>•</span>
                    <span>Showing {cars.length} of {total.toLocaleString()}</span>
                  </>
                )}
                {isFetching && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                      Duke ngarkuar...
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Active Filters:</span>
                  <Badge variant="outline">{activeFiltersCount}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.brand && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Brand: {filtersData.brands.find(b => b.id === filters.brand)?.name || filters.brand}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto w-auto p-0 hover:bg-transparent"
                        onClick={() => updateBrand(undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.model && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Model: {filtersData.models.find(m => m.id === filters.model)?.name || filters.model}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto w-auto p-0 hover:bg-transparent"
                        onClick={() => updateFilter('model', undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.fuel && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Fuel: {filtersData.fuelTypes.find(f => f.id === filters.fuel)?.name || filters.fuel}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto w-auto p-0 hover:bg-transparent"
                        onClick={() => updateFilter('fuel', undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {(filters.yearMin || filters.yearMax) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Year: {filters.yearMin || filtersData.yearRange.min}-{filters.yearMax || filtersData.yearRange.max}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto w-auto p-0 hover:bg-transparent"
                        onClick={() => updateFilters({ yearMin: undefined, yearMax: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {(filters.priceMin || filters.priceMax) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Price: €{(filters.priceMin || filtersData.priceRange.min).toLocaleString()}-€{(filters.priceMax || filtersData.priceRange.max).toLocaleString()}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto w-auto p-0 hover:bg-transparent"
                        onClick={() => updateFilters({ priceMin: undefined, priceMax: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Cars List */}
            <CarsList
              cars={cars}
              isLoading={isLoading}
              error={error}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onCarClick={handleCarClick}
              totalCount={total}
              activeFiltersCount={activeFiltersCount}
            />
          </div>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

const NewCatalog: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogContent />
    </QueryClientProvider>
  );
};

export default NewCatalog;