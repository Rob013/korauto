import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowUpDown, Car, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCarsSearch, useCarsFacets } from "@/hooks/useCarsSearch";
import { SearchReq, DEFAULT_SORT, DEFAULT_PAGE_SIZE } from "@/lib/search/types";
import { useIsMobile } from "@/hooks/use-mobile";
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";

interface NewEncarCatalogProps {
  highlightCarId?: string | null;
}

const sortOptions = [
  { value: 'listed_at_desc', label: 'Recently Added' },
  { value: 'price_eur_asc', label: 'Price: Low to High' },
  { value: 'price_eur_desc', label: 'Price: High to Low' },
  { value: 'year_asc', label: 'Year: Old to New' },
  { value: 'year_desc', label: 'Year: New to Old' },
  { value: 'mileage_km_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_km_desc', label: 'Mileage: High to Low' },
];

export const NewEncarCatalog = ({ highlightCarId }: NewEncarCatalogProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Extract filters from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedMake, setSelectedMake] = useState(searchParams.get('make') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'listed_at_desc');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [showFilters, setShowFilters] = useState(false);

  // Build search request
  const searchRequest: SearchReq = useMemo(() => {
    const filters: any = {};
    
    if (selectedMake && selectedMake !== 'all') {
      filters.make = [selectedMake];
    }
    
    if (selectedModel && selectedModel !== 'all') {
      filters.model = [selectedModel];
    }

    // Parse sort - handle compound field names like 'listed_at'
    let sortField: 'listed_at' | 'price_eur' | 'mileage_km' | 'year';
    let sortDir: 'asc' | 'desc';
    
    if (sortBy.includes('listed_at')) {
      sortField = 'listed_at';
      sortDir = sortBy.endsWith('_desc') ? 'desc' : 'asc';
    } else if (sortBy.includes('price_eur')) {
      sortField = 'price_eur';
      sortDir = sortBy.endsWith('_desc') ? 'desc' : 'asc';
    } else if (sortBy.includes('mileage_km')) {
      sortField = 'mileage_km';
      sortDir = sortBy.endsWith('_desc') ? 'desc' : 'asc';
    } else {
      sortField = 'year';
      sortDir = sortBy.endsWith('_desc') ? 'desc' : 'asc';
    }

    return {
      q: searchTerm || undefined,
      filters,
      sort: { field: sortField, dir: sortDir },
      page: currentPage,
      pageSize: DEFAULT_PAGE_SIZE,
      mode: 'full' as const,
    };
  }, [searchTerm, selectedMake, selectedModel, sortBy, currentPage]);

  // Fetch cars data
  const { data: searchResults, isLoading, error } = useCarsSearch(searchRequest);

  // Fetch facets for filters
  const { data: facetsData } = useCarsFacets({
    q: searchTerm || undefined,
    filters: searchRequest.filters,
  });

  // Extract data
  const cars = searchResults?.hits || [];
  const totalCount = searchResults?.total || 0;
  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE);

  // Get available makes and models from facets
  const availableMakes = useMemo(() => {
    if (!facetsData?.facets?.make) return [];
    return Object.entries(facetsData.facets.make).map(([make, count]) => ({
      value: make,
      label: `${make} (${count})`,
    }));
  }, [facetsData]);

  const availableModels = useMemo(() => {
    if (!facetsData?.facets?.model || !selectedMake) return [];
    return Object.entries(facetsData.facets.model).map(([model, count]) => ({
      value: model,
      label: `${model} (${count})`,
    }));
  }, [facetsData, selectedMake]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const newParams = new URLSearchParams();
    
    if (searchTerm) newParams.set('q', searchTerm);
    if (selectedMake && selectedMake !== 'all') newParams.set('make', selectedMake);
    if (selectedModel && selectedModel !== 'all') newParams.set('model', selectedModel);
    if (sortBy !== 'listed_at_desc') newParams.set('sort', sortBy);
    if (currentPage > 1) newParams.set('page', currentPage.toString());

    setSearchParams(newParams);
  }, [searchTerm, selectedMake, selectedModel, sortBy, currentPage, setSearchParams]);

  // Update URL when filters change
  useEffect(() => {
    updateURL();
  }, [updateURL]);

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

  // Show error message in useEffect to avoid re-render loops
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading cars",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="container-responsive py-6">
      {/* Header with search and filters toggle */}
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
          </Button>
        )}

        {/* Search and filters */}
        <div className={`grid gap-4 ${isMobile ? (showFilters ? 'grid-cols-1' : 'hidden') : 'grid-cols-1 md:grid-cols-4'}`}>
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
        </div>

        {/* Active filters and clear button */}
        {(selectedMake || selectedModel || searchTerm) && (
          <div className="flex items-center justify-between">
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
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingLogo />
          <p className="text-muted-foreground mt-4">Loading cars...</p>
        </div>
      )}

      {/* Cars grid */}
      {!isLoading && cars.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cars.map((car) => (
              <LazyCarCard
                key={car.id}
                id={car.id}
                make={car.make}
                model={car.model}
                year={car.year}
                price={car.price_eur}
                image={car.thumbnail ? String(car.thumbnail) : undefined}
                mileage={car.mileage_km?.toString()}
                title={`${car.year} ${car.make} ${car.model}`}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
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
          <Button onClick={clearFilters}>Clear All Filters</Button>
        </div>
      )}
    </div>
  );
};