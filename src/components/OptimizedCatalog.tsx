import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  ArrowUpDown,
  Car,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LazyCarCard from "@/components/LazyCarCard";
import { useSecureAuctionAPI } from "@/hooks/useSecureAuctionAPI";
import { useSearchParams } from "react-router-dom";
import { useSortedCars, getSortOptions, SortOption } from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useIsMobile } from "@/hooks/use-mobile";
import { APIFilters, applyGradeFilter, addPaginationToFilters } from "@/utils/catalog-filter";

interface OptimizedCatalogProps {
  highlightCarId?: string | null;
}

const OptimizedCatalog = ({ highlightCarId }: OptimizedCatalogProps = {}) => {
  const { toast } = useToast();
  const {
    cars,
    setCars,
    loading,
    totalCount,
    setTotalCount,
    hasMorePages,
    fetchCars,
    fetchAllCars,
    filters,
    setFilters,
  } = useSecureAuctionAPI();
  
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [sortBy, setSortBy] = useState<SortOption>("recently_added");
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allCarsForSorting, setAllCarsForSorting] = useState<any[]>([]);
  const [isSortingGlobal, setIsSortingGlobal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  // Memoized filtered cars
  const filteredCars = useMemo(() => {
    return applyGradeFilter(cars as any, filters.grade_iaai);
  }, [cars, filters.grade_iaai]);

  // Memoized cars for sorting
  const carsForSorting = useMemo(() => {
    return filteredCars.map((car) => ({
      ...car,
      status: String(car.status || ""),
      lot_number: String(car.lot_number || ""),
      cylinders: Number(car.cylinders || 0),
    }));
  }, [filteredCars]);

  // Use global or current page cars for sorting
  const carsToSort = useMemo(() => {
    return isSortingGlobal && allCarsForSorting.length > 0 ? allCarsForSorting : carsForSorting;
  }, [isSortingGlobal, allCarsForSorting, carsForSorting]);

  const sortedCars = useSortedCars(carsToSort, sortBy);

  // Current page cars from sorted results
  const carsForCurrentPage = useMemo(() => {
    return isSortingGlobal && allCarsForSorting.length > 0 
      ? sortedCars.slice((currentPage - 1) * 50, currentPage * 50)
      : sortedCars;
  }, [isSortingGlobal, allCarsForSorting.length, sortedCars, currentPage]);

  // Calculate pagination
  useEffect(() => {
    if (isSortingGlobal && allCarsForSorting.length > 0) {
      setTotalPages(Math.ceil(allCarsForSorting.length / 50));
    } else {
      setTotalPages(Math.ceil(totalCount / 50));
    }
  }, [isSortingGlobal, allCarsForSorting.length, totalCount]);

  // Fetch all cars for global sorting
  const fetchAllCarsForSorting = useCallback(async () => {
    if (totalCount <= 50) {
      setAllCarsForSorting(filteredCars);
      setIsSortingGlobal(true);
      return;
    }
    
    setIsSortingGlobal(true);
    setIsLoading(true);
    
    try {
      const allCars = await fetchAllCars(filters);
      const filteredAllCars = applyGradeFilter(allCars, filters.grade_iaai);
      setAllCarsForSorting(filteredAllCars);
    } catch (err) {
      console.error('Error fetching all cars for global sorting:', err);
      setIsSortingGlobal(false);
      setAllCarsForSorting([]);
    } finally {
      setIsLoading(false);
    }
  }, [totalCount, fetchAllCars, filters, filteredCars]);

  // Handle sort change with global sorting
  const handleSortChange = useCallback(async (newSortBy: SortOption) => {
    setSortBy(newSortBy);
    
    // Enable global sorting for better user experience
    if (!isSortingGlobal && totalCount > 50) {
      await fetchAllCarsForSorting();
    }
  }, [isSortingGlobal, totalCount, fetchAllCarsForSorting]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (isSortingGlobal && allCarsForSorting.length > 0) {
      const maxPages = Math.ceil(allCarsForSorting.length / 50);
      if (page > maxPages) return;
    }
    
    setCurrentPage(page);
    
    if (!isSortingGlobal) {
      const filtersWithPagination = addPaginationToFilters(filters, 50);
      fetchCars(page, filtersWithPagination, true);
    }
    
    // Update URL
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = page.toString();
    setSearchParams(currentParams);
  }, [filters, fetchCars, setSearchParams, isSortingGlobal, allCarsForSorting.length]);

  // Handle search
  const handleSearch = useCallback(() => {
    const newFilters = {
      ...filters,
      search: searchTerm.trim() || undefined,
    };
    setFilters(newFilters);
    setCurrentPage(1);
    setIsSortingGlobal(false);
    setAllCarsForSorting([]);
    
    const filtersWithPagination = addPaginationToFilters(newFilters, 50);
    fetchCars(1, filtersWithPagination, true);
  }, [filters, searchTerm, setFilters, fetchCars]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm("");
    setCurrentPage(1);
    setIsSortingGlobal(false);
    setAllCarsForSorting([]);
    fetchCars(1, {}, true);
    setSearchParams({});
  }, [fetchCars, setFilters, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Car Catalog</h1>
          
          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <AdaptiveSelect
              value={sortBy}
              onValueChange={handleSortChange}
              placeholder="Sort by"
              options={getSortOptions()}
              className="w-48"
            />

            {/* Clear filters */}
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          </div>

          {/* Results count and sorting status */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {isLoading || loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span>{totalCount.toLocaleString()} cars found</span>
                  {isSortingGlobal && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      Global Sort
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(isLoading ? Array.from({ length: 12 }) : carsForCurrentPage).map((car: any, index) => (
            <div key={car?.id || index} className="w-full">
              {isLoading ? (
                <div className="animate-pulse bg-muted rounded-lg h-64" />
              ) : (
                <LazyCarCard
                  {...car}
                  price_eur={convertUSDtoEUR(car?.price || 0)}
                  isHighlighted={highlightCarId === car?.id}
                />
              )}
            </div>
          ))}
        </div>

        {/* Load more for mobile */}
        {isMobile && hasMorePages && !isSortingGlobal && (
          <div className="mt-8 text-center">
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={loading}
              variant="outline"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More Cars"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedCatalog;