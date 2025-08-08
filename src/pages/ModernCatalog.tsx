import React, { useEffect, useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import {
  ArrowLeft,
  ArrowUpDown,
  Filter,
  PanelLeftOpen,
  PanelLeftClose,
  Loader2
} from "lucide-react";

import { ModernCatalogFilters } from "@/components/filters/ModernCatalogFilters";
import { CarsGrid } from "@/components/results/CarsGrid";
import { useUrlFilters, useActiveFilterCount } from "@/hooks/useUrlFilters";
import { useCarsSearch } from "@/hooks/useCarsSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchSort } from "@/lib/search/types";

const Footer = lazy(() => import("@/components/Footer"));

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

const sortOptions = [
  { value: 'listed_at:desc', label: 'Newest First' },
  { value: 'price_eur:asc', label: 'Price: Low to High' },
  { value: 'price_eur:desc', label: 'Price: High to Low' },
  { value: 'year:desc', label: 'Year: Newest' },
  { value: 'year:asc', label: 'Year: Oldest' },
  { value: 'mileage_km:asc', label: 'Mileage: Lowest' },
  { value: 'mileage_km:desc', label: 'Mileage: Highest' }
];

const ModernCatalog = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(() => !isMobile);
  const [hasExplicitlyClosed, setHasExplicitlyClosed] = useState(false);
  
  const {
    filters,
    sort,
    page,
    pageSize,
    query,
    setSort,
    setPage,
    setPageSize,
    clearFilters,
    isLoading: storeLoading
  } = useUrlFilters();

  const activeFilterCount = useActiveFilterCount(filters, query);

  // Build search request
  const searchRequest = React.useMemo(() => ({
    q: query,
    filters,
    sort,
    page,
    pageSize
  }), [query, filters, sort, page, pageSize]);

  // Get search results
  const {
    hits: cars,
    total,
    facets,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isFetching,
    isError,
    error
  } = useCarsSearch(searchRequest);

  const highlightCarId = searchParams.get('highlight');

  useEffect(() => {
    // Track catalog page view
    trackPageView(undefined, { 
      page_type: 'modern_catalog',
      highlighted_car: highlightCarId,
      active_filters: activeFilterCount
    });
  }, [highlightCarId, activeFilterCount]);

  // Handle sort change
  const handleSortChange = (sortValue: string) => {
    const [field, dir] = sortValue.split(':');
    setSort({
      field: field as SearchSort['field'],
      dir: dir as SearchSort['dir']
    });
  };

  // Handle car click
  const handleCarClick = (car: any) => {
    // Navigate to car details - this would be implemented based on your routing
    console.log('Navigate to car:', car);
  };

  // Toggle filters panel
  const toggleFilters = () => {
    const newShowState = !showFilters;
    setShowFilters(newShowState);
    if (newShowState) {
      setHasExplicitlyClosed(false);
    } else {
      setHasExplicitlyClosed(true);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentSortValue = `${sort.field}:${sort.dir}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex min-h-screen">
        {/* Filter Sidebar */}
        <div 
          className={`
            fixed lg:relative z-40 bg-background border-r transition-transform duration-300 ease-in-out
            ${showFilters ? 'translate-x-0' : '-translate-x-full'}
            ${isMobile ? 'top-0 left-0 right-0 bottom-0 w-full h-dvh overflow-y-auto' : 'w-80 h-full flex-shrink-0 overflow-y-auto'} 
            lg:shadow-none shadow-xl
          `}
        >
          <div className="p-4 h-full">
            <ModernCatalogFilters
              compact={isMobile}
              onClose={isMobile ? () => setShowFilters(false) : undefined}
            />
          </div>
        </div>

        {/* Overlay for mobile */}
        {showFilters && isMobile && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="container-responsive py-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Mobile header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1 hover:bg-primary hover:text-primary-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden xs:inline text-xs">Back</span>
                  </Button>
                  
                  {/* Filter Toggle Button */}
                  <Button
                    variant="default"
                    size="lg"
                    onClick={toggleFilters}
                    className="flex items-center gap-2 h-12 px-4 sm:px-6 font-semibold text-sm sm:text-base"
                  >
                    {showFilters ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                    <span className="hidden xs:inline">
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </span>
                    <span className="xs:hidden">Filters</span>
                    {activeFilterCount > 0 && !showFilters && (
                      <Badge variant="secondary" className="text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </div>
                
                {/* Sort Control */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3 w-3" />
                  <AdaptiveSelect
                    value={currentSortValue}
                    onValueChange={handleSortChange}
                    placeholder="Sort"
                    className="w-32 sm:w-40 h-8 text-sm"
                    options={sortOptions}
                  />
                </div>
              </div>
              
              {/* Title and stats */}
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Modern Car Catalog
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground text-xs sm:text-sm">
                  <span>{total.toLocaleString()} cars found</span>
                  <span>•</span>
                  <span>Page {page} of {totalPages}</span>
                  <span>•</span>
                  <span>Showing {cars.length} cars</span>
                  {(isLoading || isFetching) && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Error State */}
            {isError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
                <p className="text-destructive font-medium">
                  Error: {error?.message || 'Failed to load cars'}
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && cars.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading cars...</span>
              </div>
            )}

            {/* No Results State */}
            {!isLoading && cars.length === 0 && total === 0 && (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">No cars found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your filters or search terms to find more cars.
                  </p>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Filter className="h-4 w-4" />
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Cars Grid */}
            {cars.length > 0 && (
              <>
                <CarsGrid
                  cars={cars}
                  loading={isLoading}
                  onCarClick={handleCarClick}
                  className={`transition-all duration-300 ${
                    showFilters 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                  }`}
                  itemsPerRow={{
                    mobile: 1,
                    tablet: showFilters ? 2 : 3,
                    desktop: showFilters ? 3 : 5
                  }}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!hasPreviousPage || isLoading}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-10 h-8"
                              disabled={isLoading}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!hasNextPage || isLoading}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default ModernCatalog;