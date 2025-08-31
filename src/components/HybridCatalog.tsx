import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Loader2, Search, Car, Filter, X, Database, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHybridCarsAPI } from "@/hooks/useHybridCarsAPI";
import { cn } from "@/lib/utils";
import { useCarsSearch, useCarsFacets } from "@/hooks/useCarsSearch";
import { SearchReq, DEFAULT_PAGE_SIZE } from "@/lib/search/types";

interface HybridCatalogProps {
  highlightCarId?: string | null;
}

const sortOptions = [
  { value: 'listed_at_desc', label: 'Recently Added' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_asc', label: 'Year: Old to New' },
  { value: 'year_desc', label: 'Year: New to Old' },
];

export const HybridCatalog = ({ highlightCarId }: HybridCatalogProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    hybridSearch,
    getHybridFacets,
    isLoading: hybridLoading,
    error: hybridError,
    dataSource,
    clearError,
    refreshCache
  } = useHybridCarsAPI();
  
  // Filter states from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedMake, setSelectedMake] = useState(searchParams.get('make') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'listed_at_desc');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  
  // UI states
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [cars, setCars] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState<any>({});

  // Build search request for database queries
  const searchRequest: SearchReq = useMemo(() => {
    const filters: any = {};
    
    if (selectedMake && selectedMake !== 'all') {
      filters.make = [selectedMake];
    }
    
    if (selectedModel && selectedModel !== 'all') {
      filters.model = [selectedModel];
    }

    return {
      q: searchTerm || undefined,
      filters,
      sort: { field: sortBy.split('_')[0] as any, dir: sortBy.split('_')[1] as any },
      page: currentPage,
      pageSize: DEFAULT_PAGE_SIZE,
      mode: 'full' as const,
    };
  }, [searchTerm, selectedMake, selectedModel, sortBy, currentPage]);

  // Use database search for primary data
  const { data: dbSearchResults, isLoading: dbLoading, error: dbError } = useCarsSearch(searchRequest);
  const { data: dbFacetsData } = useCarsFacets({
    q: searchTerm || undefined,
    filters: searchRequest.filters,
  });

  // Hybrid search function
  const performHybridSearch = useCallback(async () => {
    if (dbSearchResults?.hits && dbSearchResults.hits.length > 0) {
      // Use database results if available
      setCars(dbSearchResults.hits);
      setTotalCount(dbSearchResults.total || 0);
      setTotalPages(Math.ceil((dbSearchResults.total || 0) / DEFAULT_PAGE_SIZE));
      return;
    }

    // Fallback to hybrid search if database is empty
    try {
      const result = await hybridSearch({
        make: selectedMake !== 'all' ? selectedMake : undefined,
        model: selectedModel !== 'all' ? selectedModel : undefined,
        search: searchTerm || undefined,
      }, currentPage, DEFAULT_PAGE_SIZE);

      setCars(result.cars);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);

      if (result.source === 'api') {
        toast({
          title: "Data loaded from external API",
          description: "Results have been saved to database for faster future access",
          variant: "default",
        });
      }
    } catch (err) {
      console.error('Hybrid search failed:', err);
    }
  }, [dbSearchResults, hybridSearch, selectedMake, selectedModel, searchTerm, currentPage, toast]);

  // Load facets
  const loadFacets = useCallback(async () => {
    if (dbFacetsData?.facets) {
      setFacets(dbFacetsData.facets);
      return;
    }

    const hybridFacets = await getHybridFacets({
      make: selectedMake !== 'all' ? selectedMake : undefined,
      search: searchTerm || undefined,
    });
    
    if (hybridFacets) {
      setFacets(hybridFacets);
    }
  }, [dbFacetsData, getHybridFacets, selectedMake, searchTerm]);

  // Effects
  useEffect(() => {
    performHybridSearch();
  }, [performHybridSearch]);

  useEffect(() => {
    loadFacets();
  }, [loadFacets]);

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (searchTerm) newParams.set('q', searchTerm);
    if (selectedMake && selectedMake !== 'all') newParams.set('make', selectedMake);
    if (selectedModel && selectedModel !== 'all') newParams.set('model', selectedModel);
    if (sortBy !== 'listed_at_desc') newParams.set('sort', sortBy);
    if (currentPage > 1) newParams.set('page', currentPage.toString());

    setSearchParams(newParams);
  }, [searchTerm, selectedMake, selectedModel, sortBy, currentPage, setSearchParams]);

  // Get available makes and models from facets
  const availableMakes = useMemo(() => {
    if (!facets?.make) return [];
    return Object.entries(facets.make).map(([make, count]) => ({
      value: make,
      label: `${make} (${count})`,
    }));
  }, [facets]);

  const availableModels = useMemo(() => {
    if (!facets?.model || !selectedMake) return [];
    return Object.entries(facets.model).map(([model, count]) => ({
      value: model,
      label: `${model} (${count})`,
    }));
  }, [facets, selectedMake]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel(''); // Reset model when make changes
    setCurrentPage(1);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMake('');
    setSelectedModel('');
    setSortBy('listed_at_desc');
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedMake && selectedMake !== 'all') count++;
    if (selectedModel && selectedModel !== 'all') count++;
    return count;
  }, [searchTerm, selectedMake, selectedModel]);

  const isLoading = dbLoading || hybridLoading;
  const error = dbError || hybridError;

  // Data source indicator
  const DataSourceIndicator = () => (
    <div className="flex items-center gap-2">
      {dataSource === 'database' && (
        <Badge variant="secondary" className="text-xs">
          <Database className="h-3 w-3 mr-1" />
          Database
        </Badge>
      )}
      {dataSource === 'api' && (
        <Badge variant="outline" className="text-xs">
          <Wifi className="h-3 w-3 mr-1" />
          External API
        </Badge>
      )}
      {dataSource === 'hybrid' && (
        <Badge variant="default" className="text-xs">
          <Database className="h-3 w-3 mr-1" />
          <Wifi className="h-3 w-3" />
          Hybrid
        </Badge>
      )}
      {dataSource === 'cache' && (
        <Badge variant="secondary" className="text-xs">
          <WifiOff className="h-3 w-3 mr-1" />
          Cached
        </Badge>
      )}
    </div>
  );

  return (
    <div className="container-responsive py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hybrid Cars Catalog</h1>
            <p className="text-sm text-muted-foreground">
              Database + External API • Auto-sync enabled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DataSourceIndicator />
            <Badge variant="secondary">
              {totalCount.toLocaleString()} cars
            </Badge>
          </div>
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

        {/* Filters */}
        <div className={cn(
          "grid gap-4",
          isMobile ? (showFilters ? 'grid-cols-1' : 'hidden') : 'grid-cols-1 md:grid-cols-5'
        )}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cars..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Make filter */}
          <AdaptiveSelect
            value={selectedMake}
            onValueChange={handleMakeChange}
            placeholder="All Makes"
            options={[
              { value: 'all', label: 'All Makes' },
              ...availableMakes,
            ]}
          />

          {/* Model filter */}
          <AdaptiveSelect
            value={selectedModel}
            onValueChange={handleModelChange}
            placeholder="All Models"
            disabled={!selectedMake || selectedMake === 'all'}
            options={[
              { value: 'all', label: 'All Models' },
              ...availableModels,
            ]}
          />

          {/* Sort */}
          <AdaptiveSelect
            value={sortBy}
            onValueChange={handleSortChange}
            placeholder="Sort by"
            options={sortOptions}
          />

          {/* Actions */}
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button variant="outline" onClick={refreshCache} size="sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Active filters display */}
        {(selectedMake || selectedModel || searchTerm) && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary">
                Search: {searchTerm}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleSearch('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedMake && selectedMake !== 'all' && (
              <Badge variant="secondary">
                Make: {selectedMake}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleMakeChange('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedModel && selectedModel !== 'all' && (
              <Badge variant="secondary">
                Model: {selectedModel}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleModelChange('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{typeof error === 'string' ? error : error.message}</p>
            <Button variant="outline" size="sm" onClick={clearError} className="mt-2">
              Dismiss
            </Button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingLogo />
          <p className="text-muted-foreground mt-4">
            Loading from {dataSource === 'database' ? 'database' : 'external API'}...
          </p>
        </div>
      )}

      {/* Cars grid */}
      {!isLoading && cars.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {cars.map((car) => (
              <LazyCarCard
                key={car.id}
                id={car.id}
                make={car.make}
                model={car.model}
                year={car.year}
                price={car.price_eur || car.price}
                mileage={car.mileage_km?.toString() || car.mileage}
                image={car.thumbnail || (car.images && car.images[0])}
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
      {!isLoading && cars.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No cars found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Try adjusting your filters or search terms to find more results.
          </p>
          <div className="flex gap-2">
            <Button onClick={clearFilters}>Clear All Filters</Button>
            <Button variant="outline" onClick={refreshCache}>Refresh Data</Button>
          </div>
        </div>
      )}
    </div>
  );
};