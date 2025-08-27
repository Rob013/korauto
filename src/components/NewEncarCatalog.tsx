import { useEffect, useMemo, useState, useCallback } from 'react';
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

// Import our new components and hooks
import { useFilterStore, useFilterStoreSelectors } from '@/store/filterStore';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useCarsResults, useCarsFacets, useCarsSearchPrefetch } from '@/hooks/useCarsSearch';
import { CarsGrid } from '@/components/results/CarsGrid';
import { Facet } from '@/components/filters/Facet';
import { RangeFacet } from '@/components/filters/RangeFacet';
import { CheckNewUpdates } from '@/components/CheckNewUpdates';
import { SearchReq, SortOption, FACET_FIELDS } from '@/lib/search/types';

interface NewEncarCatalogProps {
  highlightCarId?: string | null;
  className?: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'listed_at', dir: 'desc', label: 'Recently Added' },
  { field: 'listed_at', dir: 'asc', label: 'Oldest First' },
  { field: 'price_eur', dir: 'asc', label: 'Price: Low to High' },
  { field: 'price_eur', dir: 'desc', label: 'Price: High to Low' },
  { field: 'mileage_km', dir: 'asc', label: 'Mileage: Low to High' },
  { field: 'mileage_km', dir: 'desc', label: 'Mileage: High to Low' },
  { field: 'year', dir: 'desc', label: 'Year: Newest First' },
  { field: 'year', dir: 'asc', label: 'Year: Oldest First' },
];

export const NewEncarCatalog = ({ highlightCarId, className = '' }: NewEncarCatalogProps) => {
  // Initialize URL synchronization
  const { isInitialized } = useUrlFilters();
  
  // Get store state and actions
  const store = useFilterStore();
  const { searchRequest, hasActiveFilters, activeFilterCount } = useFilterStoreSelectors();
  
  // Local state for UI
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [searchInputValue, setSearchInputValue] = useState(store.query);

  // Update search input when store query changes
  useEffect(() => {
    setSearchInputValue(store.query);
  }, [store.query]);

  // Build search requests
  const resultsRequest = useMemo((): SearchReq => ({
    ...searchRequest(),
    mode: 'results',
  }), [searchRequest]);

  const facetsRequest = useMemo((): SearchReq => ({
    ...searchRequest(),
    mode: 'facets',
    facets: [...FACET_FIELDS],
    page: 1,
    pageSize: 1,
  }), [searchRequest]);

  // Fetch data with two-phase approach
  const resultsQuery = useCarsResults(resultsRequest, { 
    enabled: isInitialized,
    keepPreviousData: true,
  });

  const facetsQuery = useCarsFacets(
    { q: resultsRequest.q, filters: resultsRequest.filters, sort: resultsRequest.sort },
    [...FACET_FIELDS],
    { enabled: isInitialized }
  );

  // Prefetch helpers
  const { prefetchPage, prefetchMakeResults } = useCarsSearchPrefetch();

  // Handle search input change (debounced)
  const handleSearchChange = useCallback((value: string) => {
    setSearchInputValue(value);
    const timeoutId = setTimeout(() => {
      store.setQuery(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [store]);

  // Handle search submit
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    store.setQuery(searchInputValue);
  }, [store, searchInputValue]);

  // Handle filter changes
  const handleFilterChange = useCallback((field: keyof SearchReq['filters'], value: any) => {
    store.setFilter(field, value);
  }, [store]);

  // Handle sort change
  const handleSortChange = useCallback((sortString: string) => {
    const [field, dir] = sortString.split(':');
    if (field && dir) {
      store.setSort({ field: field as any, dir: dir as 'asc' | 'desc' });
    }
  }, [store]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    store.setPage(newPage);
  }, [store]);

  // Prefetch next/prev pages on hover
  const handlePrefetchPage = useCallback(async (page: number) => {
    try {
      await prefetchPage(resultsRequest, page);
    } catch (error) {
      console.warn('Failed to prefetch page:', error);
    }
  }, [prefetchPage, resultsRequest]);

  // Prefetch make results on dropdown interaction
  const handleMakePrefetch = useCallback(async (make: string) => {
    try {
      await prefetchMakeResults(make, resultsRequest);
    } catch (error) {
      console.warn('Failed to prefetch make results:', error);
    }
  }, [prefetchMakeResults, resultsRequest]);

  // Handle car click
  const handleCarClick = useCallback((car: any) => {
    console.log('Car clicked:', car);
    // Navigate to car detail page
    // This would typically use router.push() in Next.js or navigate() in React Router
  }, []);

  // Calculate pagination info
  const totalResults = resultsQuery.data?.total || 0;
  const totalPages = Math.ceil(totalResults / store.pageSize);
  const hasNextPage = store.page < totalPages;
  const hasPrevPage = store.page > 1;

  // Loading states
  const isLoading = resultsQuery.isLoading || !isInitialized;
  const isFacetsLoading = facetsQuery.isLoading;

  // Format price for range facet
  const formatPrice = useCallback((value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Format mileage for range facet
  const formatMileage = useCallback((value: number) => {
    return `${value.toLocaleString()} km`;
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Cars Catalog</h1>
          
          {/* Check for Updates */}
          <div className="mb-6">
            <CheckNewUpdates />
          </div>
          
          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cars..."
                  value={searchInputValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Filters toggle */}
              <Button
                variant="outline"
                onClick={() => setFiltersVisible(!filtersVisible)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount()}
                  </Badge>
                )}
              </Button>

              {/* Sort */}
              <Select 
                value={`${store.sort.field}:${store.sort.dir}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem 
                      key={`${option.field}:${option.dir}`}
                      value={`${option.field}:${option.dir}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear all filters */}
              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  onClick={store.clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {filtersVisible && (
            <div className="w-80 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Make Filter */}
                  <Facet
                    title="Make"
                    field="make"
                    facetCounts={facetsQuery.data?.facets?.make}
                    selectedValues={store.filters.make || []}
                    onSelectionChange={(values) => handleFilterChange('make', values.length > 0 ? values : undefined)}
                    disabled={isFacetsLoading}
                  />

                  {/* Model Filter (dependent on make) */}
                  <Facet
                    title="Model"
                    field="model"
                    facetCounts={facetsQuery.data?.facets?.model}
                    selectedValues={store.filters.model || []}
                    onSelectionChange={(values) => handleFilterChange('model', values.length > 0 ? values : undefined)}
                    disabled={isFacetsLoading}
                  />

                  {/* Year Range */}
                  <RangeFacet
                    title="Year"
                    field="year"
                    min={1990}
                    max={new Date().getFullYear()}
                    selectedRange={store.filters.year}
                    onRangeChange={(range) => handleFilterChange('year', range)}
                    disabled={isFacetsLoading}
                  />

                  {/* Price Range */}
                  <RangeFacet
                    title="Price"
                    field="price_eur"
                    min={1000}
                    max={200000}
                    step={1000}
                    selectedRange={store.filters.price_eur}
                    onRangeChange={(range) => handleFilterChange('price_eur', range)}
                    formatValue={formatPrice}
                    disabled={isFacetsLoading}
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
                    disabled={isFacetsLoading}
                  />

                  {/* Fuel Type */}
                  <Facet
                    title="Fuel Type"
                    field="fuel"
                    facetCounts={facetsQuery.data?.facets?.fuel}
                    selectedValues={store.filters.fuel || []}
                    onSelectionChange={(values) => handleFilterChange('fuel', values.length > 0 ? values : undefined)}
                    disabled={isFacetsLoading}
                  />

                  {/* Transmission */}
                  <Facet
                    title="Transmission"
                    field="transmission"
                    facetCounts={facetsQuery.data?.facets?.transmission}
                    selectedValues={store.filters.transmission || []}
                    onSelectionChange={(values) => handleFilterChange('transmission', values.length > 0 ? values : undefined)}
                    disabled={isFacetsLoading}
                  />

                  {/* Body Type */}
                  <Facet
                    title="Body Type"
                    field="body"
                    facetCounts={facetsQuery.data?.facets?.body}
                    selectedValues={store.filters.body || []}
                    onSelectionChange={(values) => handleFilterChange('body', values.length > 0 ? values : undefined)}
                    disabled={isFacetsLoading}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {isLoading ? (
                  'Loading...'
                ) : (
                  `${totalResults.toLocaleString()} cars found`
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(store.page - 1)}
                    disabled={!hasPrevPage || isLoading}
                    onMouseEnter={() => hasPrevPage && handlePrefetchPage(store.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm px-2">
                    Page {store.page} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(store.page + 1)}
                    disabled={!hasNextPage || isLoading}
                    onMouseEnter={() => hasNextPage && handlePrefetchPage(store.page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Cars Grid */}
            <CarsGrid
              cars={resultsQuery.data?.hits || []}
              loading={isLoading}
              onCarClick={handleCarClick}
              width={filtersVisible ? 800 : 1200}
              height={600}
              columnCount={filtersVisible ? 3 : 4}
            />
          </div>
        </div>
      </div>
    </div>
  );
};