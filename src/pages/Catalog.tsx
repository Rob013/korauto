import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

// Create a separate QueryClient for the catalog
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
    { id: 'a6', name: 'A6', brandId: 'audi', count: 34 },
    { id: 'q3', name: 'Q3', brandId: 'audi', count: 23 },
    { id: 'q5', name: 'Q5', brandId: 'audi', count: 56 },
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

const FooterSkeleton = () => (
  <footer className="bg-card">
    <div className="container-responsive py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </footer>
);

const CatalogContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightCarId = searchParams.get('highlight');
  
  const { filters, updateFilters, updateFilter, updateBrand, clearFilters } = useFiltersFromUrl();
  const { cars, total, totalPages, hasMore, models, isLoading, isFetching, error, prefetchNextPage } = useCarsQuery(filters);
  
  const [showFilters, setShowFilters] = useState(true);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);

  // Track page view (with throttling)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      trackPageView(undefined, { 
        page_type: 'catalog',
        total_cars: total,
        highlighted_car: highlightCarId,
        active_filters: Object.keys(filters).filter(key => 
          filters[key as keyof typeof filters] !== undefined && 
          filters[key as keyof typeof filters] !== ''
        ).length
      });
    }, 1000); // Delay to prevent spam

    return () => clearTimeout(timeoutId);
  }, [total]); // Only track when total changes, not filters

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    updateFilter('sort', newSort);
  };

  // Calculate active filters count
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof typeof filters];
    return value !== undefined && value !== '' && value !== null;
  }).length;

  // Handle filter changes
  const handleFiltersChange = (newFilters: typeof filters) => {
    updateFilters(newFilters);
  };

  const filtersData = {
    brands: mockFiltersData.brands,
    models: models || mockFiltersData.models,
    bodyTypes: mockFiltersData.bodyTypes,
    colors: mockFiltersData.colors,
    locations: mockFiltersData.locations,
    yearRange: mockFiltersData.yearRange,
    priceRange: mockFiltersData.priceRange,
    mileageRange: mockFiltersData.mileageRange,
    
    // Add missing required fields for enhanced filters
    fuelTypes: [
      { id: 'gasoline', name: 'Benzinë', count: 300 },
      { id: 'diesel', name: 'Dizel', count: 250 },
      { id: 'hybrid', name: 'Hibrid', count: 120 },
      { id: 'electric', name: 'Elektrik', count: 45 },
    ],
    transmissions: [
      { id: 'manual', name: 'Manual', count: 280 },
      { id: 'automatic', name: 'Automatik', count: 320 },
      { id: 'cvt', name: 'CVT', count: 65 },
    ],
    conditions: [
      { id: 'new', name: 'I Ri', count: 50 },
      { id: 'used', name: 'I Përdorur', count: 500 },
      { id: 'certified', name: 'I Certifikuar', count: 75 }
    ],
    saleStatuses: [
      { id: 'available', name: 'I Disponueshëm', count: 580 },
      { id: 'sold', name: 'I Shitur', count: 45 },
      { id: 'pending', name: 'Në Pritje', count: 15 }
    ],
    drivetrains: [
      { id: 'fwd', name: 'FWD', count: 220 },
      { id: 'awd', name: 'AWD', count: 180 },
      { id: 'rwd', name: 'RWD', count: 160 },
      { id: '4wd', name: '4WD', count: 80 }
    ],
    doorCounts: [
      { id: '2', name: '2 Dyer', count: 30 },
      { id: '4', name: '4 Dyer', count: 480 },
      { id: '5', name: '5 Dyer', count: 130 }
    ],
    engineSizeRange: { min: 1.0, max: 6.0 }
  };

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="h-16 bg-background" />}>
        <Header />
      </Suspense>
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Filters Sidebar */}
        <div className={cn(
          "transition-all duration-200 border-r bg-card",
          showFilters && !filterPanelCollapsed ? "w-80 flex-shrink-0" : "w-0 overflow-hidden"
        )}>
          <div className="h-full overflow-hidden">
            {showFilters && !filterPanelCollapsed && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 p-4 border-b">
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

            {/* Cars List */}
            <CarsList
              cars={cars}
              total={total}
              totalPages={totalPages}
              hasMore={hasMore}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
              filters={filters}
              prefetchNextPage={prefetchNextPage}
              highlightCarId={highlightCarId}
            />
          </div>
        </div>
      </div>

      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
};

const Catalog = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogContent />
    </QueryClientProvider>
  );
};

export default Catalog;