import { useEffect, useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Grid3X3, 
  List, 
  Filter, 
  PanelLeftOpen,
  PanelLeftClose,
  X,
  ArrowUpDown 
} from 'lucide-react';
import { useFilterStore, useFilterStoreSelectors } from '@/store/filterStore';
import { useCarsQuery } from '@/hooks/useCarsQuery';
import { useFiltersFromUrl } from '@/hooks/useFiltersFromUrl';
import FiltersPanel from '@/components/FiltersPanel';
import LazyCarCard from '@/components/LazyCarCard';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import LoadingLogo from '@/components/LoadingLogo';
import { cn } from '@/lib/utils';

interface OptimizedCatalogProps {
  highlightCarId?: string | null;
}

// Sort options for the dropdown
const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Çmimi: Nga i ulëti' },
  { value: 'price_desc', label: 'Çmimi: Nga i larti' },
  { value: 'year_desc', label: 'Viti: Nga i riu' },
  { value: 'year_asc', label: 'Viti: Nga i vjetri' },
  { value: 'mileage_asc', label: 'Kilometrazhi: Nga i ulëti' },
  { value: 'mileage_desc', label: 'Kilometrazhi: Nga i larti' },
  { value: 'recently_added', label: 'Të shtuar së fundmi' },
];

// Mock data for filters panel (this should come from API in real implementation)
const MOCK_FILTERS_DATA = {
  brands: [
    { id: 'toyota', name: 'Toyota', count: 1234 },
    { id: 'honda', name: 'Honda', count: 987 },
    { id: 'bmw', name: 'BMW', count: 756 },
    { id: 'mercedes', name: 'Mercedes-Benz', count: 654 },
    { id: 'audi', name: 'Audi', count: 543 },
    { id: 'volkswagen', name: 'Volkswagen', count: 432 },
    { id: 'nissan', name: 'Nissan', count: 321 },
    { id: 'hyundai', name: 'Hyundai', count: 234 },
  ],
  models: [
    { id: 'camry', name: 'Camry', brandId: 'toyota', count: 123 },
    { id: 'corolla', name: 'Corolla', brandId: 'toyota', count: 234 },
    { id: 'civic', name: 'Civic', brandId: 'honda', count: 145 },
    { id: 'accord', name: 'Accord', brandId: 'honda', count: 167 },
  ],
  fuelTypes: [
    { id: 'gasoline', name: 'Benzinë', count: 2345 },
    { id: 'diesel', name: 'Diesel', count: 1234 },
    { id: 'hybrid', name: 'Hibrid', count: 567 },
    { id: 'electric', name: 'Elektrik', count: 234 },
  ],
  transmissions: [
    { id: 'automatic', name: 'Automatik', count: 3456 },
    { id: 'manual', name: 'Manual', count: 1234 },
  ],
  bodyTypes: [
    { id: 'sedan', name: 'Sedan', count: 1234 },
    { id: 'suv', name: 'SUV', count: 2345 },
    { id: 'hatchback', name: 'Hatchback', count: 987 },
    { id: 'coupe', name: 'Coupe', count: 456 },
  ],
  colors: [
    { id: 'white', name: 'E bardhë', count: 2345 },
    { id: 'black', name: 'E zezë', count: 1987 },
    { id: 'silver', name: 'Argjendtë', count: 1456 },
    { id: 'red', name: 'E kuqe', count: 987 },
  ],
  locations: [
    { id: 'tirana', name: 'Tiranë', count: 1234 },
    { id: 'durres', name: 'Durrës', count: 567 },
    { id: 'vlore', name: 'Vlorë', count: 345 },
  ],
  yearRange: { min: 2000, max: 2024 },
  priceRange: { min: 1000, max: 100000 },
  mileageRange: { min: 0, max: 300000 },
};

export const OptimizedCatalog: React.FC<OptimizedCatalogProps> = ({ highlightCarId }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Filter state management - use URL as single source of truth
  const { filters: urlFilters, updateFilters, clearFilters } = useFiltersFromUrl();
  
  // Local UI state
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Simple filter state helpers
  const hasActiveFilters = () => {
    return Object.entries(urlFilters).some(([key, value]) => 
      value && value !== '' && key !== 'page' && key !== 'pageSize' && key !== 'sort'
    );
  };

  const activeFilterCount = () => {
    return Object.entries(urlFilters).filter(([key, value]) => 
      value && value !== '' && key !== 'page' && key !== 'pageSize' && key !== 'sort'
    ).length;
  };
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
    refetch,
    prefetchNextPage,
  } = useCarsQuery({
    brand: urlFilters.brand,
    model: urlFilters.model,
    fuel: urlFilters.fuel,
    transmission: urlFilters.transmission,
    bodyType: urlFilters.bodyType,
    color: urlFilters.color,
    location: urlFilters.location,
    yearMin: urlFilters.yearMin,
    yearMax: urlFilters.yearMax,
    priceMin: urlFilters.priceMin,
    priceMax: urlFilters.priceMax,
    mileageMin: urlFilters.mileageMin,
    mileageMax: urlFilters.mileageMax,
    page: urlFilters.page || 1,
    pageSize: urlFilters.pageSize || 20,
    sort: urlFilters.sort || 'price_asc',
    search: urlFilters.search,
  });

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: any) => {
    console.log('🔄 Filters changing:', newFilters);
    
    // Convert store filters back to URL format
    const urlUpdate: any = {};
    
    if (newFilters.brand !== undefined) urlUpdate.brand = newFilters.brand;
    if (newFilters.model !== undefined) urlUpdate.model = newFilters.model;
    if (newFilters.fuel !== undefined) urlUpdate.fuel = newFilters.fuel;
    if (newFilters.transmission !== undefined) urlUpdate.transmission = newFilters.transmission;
    if (newFilters.bodyType !== undefined) urlUpdate.bodyType = newFilters.bodyType;
    if (newFilters.color !== undefined) urlUpdate.color = newFilters.color;
    if (newFilters.location !== undefined) urlUpdate.location = newFilters.location;
    if (newFilters.search !== undefined) urlUpdate.search = newFilters.search;
    
    // Handle ranges
    if (newFilters.yearMin !== undefined) urlUpdate.yearMin = newFilters.yearMin;
    if (newFilters.yearMax !== undefined) urlUpdate.yearMax = newFilters.yearMax;
    if (newFilters.priceMin !== undefined) urlUpdate.priceMin = newFilters.priceMin;
    if (newFilters.priceMax !== undefined) urlUpdate.priceMax = newFilters.priceMax;
    if (newFilters.mileageMin !== undefined) urlUpdate.mileageMin = newFilters.mileageMin;
    if (newFilters.mileageMax !== undefined) urlUpdate.mileageMax = newFilters.mileageMax;
    
    // Reset to page 1 when filters change (except for page/sort changes)
    if (!('page' in newFilters) && !('sort' in newFilters)) {
      urlUpdate.page = 1;
    }
    
    updateFilters(urlUpdate);
  }, [updateFilters]);

  // Handle sort change - keep it simple with string format since that's what URL expects
  const handleSortChange = useCallback((sort: string) => {
    console.log('🔄 Sort changing to:', sort);
    updateFilters({ sort, page: 1 }); // Reset page when sorting changes
  }, [updateFilters]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    console.log('🔄 Page changing to:', page);
    updateFilters({ page });
  }, [updateFilters]);

  // Load more cars (for infinite scroll)
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      const nextPage = (urlFilters.page || 1) + 1;
      handlePageChange(nextPage);
      prefetchNextPage();
    }
  }, [hasMore, isFetching, urlFilters.page, handlePageChange, prefetchNextPage]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    console.log('🗑️ Clearing all filters');
    clearFilters();
    toast({
      title: "Filtrat u pastruan",
      description: "Të gjitha filtrat janë hequr.",
    });
  }, [clearFilters, toast]);

  // Toggle view mode
  const handleViewModeToggle = useCallback(() => {
    const newViewMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newViewMode);
    localStorage.setItem('catalog-view-mode', newViewMode);
  }, [viewMode]);

  // Highlight car effect
  useEffect(() => {
    if (highlightCarId && cars.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`car-${highlightCarId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary');
          }, 3000);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightCarId, cars]);

  // Show error state
  if (error && !isLoading) {
    return (
      <div className="container-responsive py-8">
        <Card className="p-6">
          <CardContent className="text-center">
            <h2 className="text-xl font-semibold mb-4">Gabim në ngarkim</h2>
            <p className="text-muted-foreground mb-4">
              Ka ndodhur një gabim gjatë ngarkimit të makinave.
            </p>
            <Button onClick={() => refetch()}>
              Provo përsëri
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-responsive py-4">
        <div className="flex flex-col gap-4">
          {/* Header with controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold">Katalogu i Makinave</h1>
              <p className="text-muted-foreground">
                {isLoading ? 'Duke ngarkuar...' : `${total.toLocaleString()} makina të disponueshme`}
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* View mode toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewModeToggle}
                className="flex-shrink-0"
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
              
              {/* Filter toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0"
              >
                {showFilters ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                <Filter className="h-4 w-4 ml-1" />
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      {activeFilterCount()} filtër aktiv
                    </Badge>
              </Button>
              
              {/* Sort dropdown */}
              <div className="flex-1 sm:flex-initial min-w-[180px]">
                <Select
                  value={urlFilters.sort || 'price_asc'}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      <SelectValue placeholder="Renditja" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Filters Panel */}
            {showFilters && (
              <div className={cn(
                "bg-card border rounded-lg p-4",
                isMobile ? "fixed inset-0 z-50 overflow-y-auto" : "w-80 flex-shrink-0"
              )}>
                {isMobile && (
                  <div className="flex justify-end mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <FiltersPanel
                  filters={urlFilters}
                  data={MOCK_FILTERS_DATA}
                  isLoading={isLoadingModels}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Active filters display */}
              {hasActiveFilters() && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Filtrat aktiv:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      <X className="h-4 w-4" />
                      Pastro të gjitha
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* Show active filter badges here */}
                    <Badge variant="secondary">{activeFilterCount()} filtër aktiv</Badge>
                  </div>
                </div>
              )}

              {/* Cars Grid/List */}
              <div className={cn(
                "gap-4",
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "flex flex-col space-y-4"
              )}>
                {isLoading && cars.length === 0 ? (
                  // Initial loading state
                  <>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-muted rounded-lg h-64"></div>
                      </div>
                    ))}
                  </>
                ) : cars.length > 0 ? (
                  // Show cars
                  cars.map((car, index) => (
                    <LazyCarCard
                      key={`${car.id}-${index}`}
                      id={`car-${car.id}`}
                      make={car.make}
                      model={car.model}
                      year={car.year}
                      price={car.price}
                      mileage={car.mileage?.toString()}
                      fuel={car.fuel}
                      transmission={car.transmission}
                      color={car.color}
                      images={car.images}
                      viewMode={viewMode}
                    />
                  ))
                ) : (
                  // Empty state
                  <div className="col-span-full">
                    <Card className="p-8">
                      <CardContent className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Nuk u gjetën makina</h3>
                        <p className="text-muted-foreground mb-4">
                          Provoni të ndryshoni filtrat ose kërkimin tuaj.
                        </p>
                        {hasActiveFilters() && (
                          <Button onClick={handleClearFilters}>
                            Pastro filtrat
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Load More / Pagination */}
              {cars.length > 0 && (
                <div className="mt-8 flex justify-center">
                  {hasMore ? (
                    <Button
                      onClick={handleLoadMore}
                      disabled={isFetching}
                      variant="outline"
                      size="lg"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Duke ngarkuar...
                        </>
                      ) : (
                        'Ngarko më shumë'
                      )}
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">
                      U shfaqen të gjitha {total.toLocaleString()} makinat
                    </p>
                  )}
                </div>
              )}

              {/* Loading overlay for additional pages */}
              {isFetching && cars.length > 0 && (
                <div className="fixed bottom-4 right-4 z-40">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <LoadingLogo size="sm" />
                    <span className="text-sm">Duke ngarkuar...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};