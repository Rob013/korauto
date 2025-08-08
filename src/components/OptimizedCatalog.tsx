import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight,
  X,
  ArrowUpDown
} from 'lucide-react';

import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useFilterStore, useFilterStoreSelectors } from '@/store/filterStore';
import { useCarsSearch, useCarsResults, useCarsFacets, useCarsSearchPrefetch } from '@/hooks/useCarsSearch';
import { CarsGrid } from '@/components/results/CarsGrid';
import { Facet } from '@/components/filters/Facet';
import { RangeFacet } from '@/components/filters/RangeFacet';
import { SearchReq, FACET_FIELDS } from '@/lib/search/types';

interface OptimizedCatalogProps {
  className?: string;
}

export const OptimizedCatalog = ({ className = '' }: OptimizedCatalogProps) => {
  const [showFilters, setShowFilters] = useState(true);
  const [isFiltersLoading, setIsFiltersLoading] = useState(false);
  
  // URL synchronization
  const { isInitialized } = useUrlFilters();
  
  // Store state
  const store = useFilterStore();
  const { searchRequest, hasActiveFilters, activeFilterCount } = useFilterStoreSelectors();
  
  // Search hooks with two-phase fetching
  const searchReq = searchRequest();
  
  // Main results query (with keepPreviousData for no flicker)
  const { 
    data: resultsData, 
    isLoading: resultsLoading, 
    isFetching: resultsFetching,
    error: resultsError 
  } = useCarsResults(searchReq, { 
    enabled: isInitialized,
    keepPreviousData: true 
  });
  
  // Facets query (separate from results for fast updates)
  const { 
    data: facetsData, 
    isLoading: facetsLoading 
  } = useCarsFacets(searchReq, [...FACET_FIELDS], { 
    enabled: isInitialized 
  });
  
  // Prefetch utilities
  const { 
    prefetchNextPage, 
    prefetchPrevPage, 
    prefetchMakeResults, 
    prefetchPopularMakes 
  } = useCarsSearchPrefetch();

  // Handle filter changes with two-phase fetching
  const handleFilterChange = useCallback(async (key: keyof SearchReq['filters'], value: any) => {
    // Set loading state for filters
    setIsFiltersLoading(true);
    
    // Update filter (this will trigger page reset automatically)
    store.setFilter(key, value);
    
    // For make changes, prefetch popular results
    if (key === 'make' && value && value.length > 0) {
      try {
        await prefetchMakeResults(value[0], searchReq);
      } catch (error) {
        console.warn('Failed to prefetch make results:', error);
      }
    }
    
    // Reset loading state after a short delay
    setTimeout(() => setIsFiltersLoading(false), 500);
  }, [store, searchReq, prefetchMakeResults]);

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    store.setPage(newPage);
    
    // Prefetch adjacent pages
    if (newPage > 1) {
      prefetchPrevPage({ ...searchReq, page: newPage }).catch(console.warn);
    }
    if (resultsData?.total && newPage * searchReq.pageSize! < resultsData.total) {
      prefetchNextPage({ ...searchReq, page: newPage }).catch(console.warn);
    }
  }, [store, searchReq, resultsData, prefetchNextPage, prefetchPrevPage]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: SearchReq['sort']) => {
    store.setSort(newSort);
  }, [store]);

  // Handle search query
  const handleQueryChange = useCallback((query: string) => {
    store.setQuery(query);
  }, [store]);

  // Prefetch on make dropdown hover
  const handleMakeDropdownOpen = useCallback(() => {
    prefetchPopularMakes(searchReq).catch(console.warn);
  }, [searchReq, prefetchPopularMakes]);

  // Calculate pagination
  const totalPages = useMemo(() => {
    if (!resultsData?.total || !searchReq.pageSize) return 1;
    return Math.ceil(resultsData.total / searchReq.pageSize);
  }, [resultsData?.total, searchReq.pageSize]);

  // Format price for range facet
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  // Format mileage
  const formatMileage = useCallback((mileage: number) => {
    return `${mileage.toLocaleString()} km`;
  }, []);

  // Don't render until URL is initialized
  if (!isInitialized) {
    return <CatalogSkeleton />;
  }

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cars..."
                value={store.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select
              value={store.sort ? `${store.sort.field}:${store.sort.dir}` : 'listed_at:desc'}
              onValueChange={(value) => {
                const [field, dir] = value.split(':');
                handleSortChange({ 
                  field: field as any, 
                  dir: dir as 'asc' | 'desc' 
                });
              }}
            >
              <SelectTrigger className="w-48">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listed_at:desc">Newest First</SelectItem>
                <SelectItem value="listed_at:asc">Oldest First</SelectItem>
                <SelectItem value="price_eur:asc">Price: Low to High</SelectItem>
                <SelectItem value="price_eur:desc">Price: High to Low</SelectItem>
                <SelectItem value="mileage_km:asc">Mileage: Low to High</SelectItem>
                <SelectItem value="mileage_km:desc">Mileage: High to Low</SelectItem>
                <SelectItem value="year:desc">Year: Newest First</SelectItem>
                <SelectItem value="year:asc">Year: Oldest First</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {activeFilterCount()}
                </Badge>
              )}
            </Button>

            {/* Clear filters */}
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                onClick={() => store.clearFilters()}
                className="text-sm"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                {isFiltersLoading && (
                  <Skeleton className="h-4 w-4 rounded-full animate-spin" />
                )}
              </div>

              {/* Make Filter */}
              <Facet
                title="Make"
                field="make"
                facetCounts={facetsData?.facets?.make}
                selectedValues={store.filters.make || []}
                onSelectionChange={(values) => handleFilterChange('make', values)}
                disabled={facetsLoading}
                searchable
                onDropdownOpen={handleMakeDropdownOpen}
              />

              {/* Model Filter */}
              <Facet
                title="Model"
                field="model"
                facetCounts={facetsData?.facets?.model}
                selectedValues={store.filters.model || []}
                onSelectionChange={(values) => handleFilterChange('model', values)}
                disabled={facetsLoading}
                searchable
              />

              {/* Year Range */}
              <RangeFacet
                title="Year"
                field="year"
                min={1990}
                max={2024}
                selectedRange={store.filters.year}
                onRangeChange={(range) => handleFilterChange('year', range)}
                disabled={facetsLoading}
              />

              {/* Price Range */}
              <RangeFacet
                title="Price"
                field="price_eur"
                min={1000}
                max={100000}
                step={1000}
                selectedRange={store.filters.price_eur}
                onRangeChange={(range) => handleFilterChange('price_eur', range)}
                formatValue={formatPrice}
                disabled={facetsLoading}
              />

              {/* Mileage Range */}
              <RangeFacet
                title="Mileage"
                field="mileage_km"
                min={0}
                max={300000}
                step={5000}
                selectedRange={store.filters.mileage_km}
                onRangeChange={(range) => handleFilterChange('mileage_km', range)}
                formatValue={formatMileage}
                disabled={facetsLoading}
              />

              {/* Fuel Type */}
              <Facet
                title="Fuel Type"
                field="fuel"
                facetCounts={facetsData?.facets?.fuel}
                selectedValues={store.filters.fuel || []}
                onSelectionChange={(values) => handleFilterChange('fuel', values)}
                disabled={facetsLoading}
              />

              {/* Transmission */}
              <Facet
                title="Transmission"
                field="transmission"
                facetCounts={facetsData?.facets?.transmission}
                selectedValues={store.filters.transmission || []}
                onSelectionChange={(values) => handleFilterChange('transmission', values)}
                disabled={facetsLoading}
              />
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  {resultsData?.total ? `${resultsData.total.toLocaleString()} cars` : 'Cars'}
                </h2>
                {resultsFetching && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Skeleton className="h-4 w-4 rounded-full animate-spin" />
                    Searching...
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(store.page - 1)}
                    disabled={store.page <= 1}
                    onMouseEnter={() => {
                      if (store.page > 1) {
                        prefetchPrevPage(searchReq).catch(console.warn);
                      }
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-2">
                    Page {store.page} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(store.page + 1)}
                    disabled={store.page >= totalPages}
                    onMouseEnter={() => {
                      if (store.page < totalPages) {
                        prefetchNextPage(searchReq).catch(console.warn);
                      }
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Error state */}
            {resultsError && (
              <Card className="p-6 text-center">
                <p className="text-destructive mb-2">Failed to load cars</p>
                <p className="text-sm text-muted-foreground">{resultsError.message}</p>
              </Card>
            )}

            {/* Results grid */}
            {!resultsError && (
              <CarsGrid
                cars={resultsData?.hits || []}
                loading={resultsLoading}
                width={showFilters ? 800 : 1200}
                height={600}
                onCarClick={(car) => {
                  // Navigate to car details
                  console.log('Navigate to car:', car.id);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton component
const CatalogSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="w-80 space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="flex-1">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default OptimizedCatalog;