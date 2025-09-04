/**
 * Global Sorting Select Component
 * Calls all API cars, sorts them globally, and provides pagination
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AdaptiveSelect } from '@/components/ui/adaptive-select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, Database } from 'lucide-react';
import { useFastGlobalSorting } from '@/hooks/useFastGlobalSorting';
import { SortKey } from '@/services/globalSort';
import LazyCarCard from '@/components/LazyCarCard';

interface GlobalSortingSelectProps {
  filters?: any;
  onCarsChange?: (cars: any[], total: number) => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: New to Old' },
  { value: 'year_asc', label: 'Year: Old to New' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_desc', label: 'Mileage: High to Low' },
  { value: 'make_asc', label: 'Make: A to Z' },
  { value: 'make_desc', label: 'Make: Z to A' },
];

export function GlobalSortingSelect({ 
  filters = {}, 
  onCarsChange,
  className 
}: GlobalSortingSelectProps) {
  const [selectedSort, setSelectedSort] = useState<SortKey>('price_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [progressPercent, setProgressPercent] = useState(0);

  const {
    state,
    onSortChange,
    getPage,
    clearCache,
    isReady,
    getCacheStats
  } = useFastGlobalSorting(
    { filters, sort: selectedSort as any },
    {
      pageSize,
      cacheEnabled: true,
      onProgress: (progress) => {
        const percent = Math.min(100, (progress.loaded / progress.total) * 100);
        setProgressPercent(percent);
      }
    }
  );

  // Handle sort change
  const handleSortChange = useCallback(async (sortValue: string) => {
    const sortKey = sortValue as SortKey;
    setSelectedSort(sortKey);
    setCurrentPage(1);
    setProgressPercent(0);
    
    console.log(`🔄 Global sort change: ${sortValue}`);
    await onSortChange(sortKey);
  }, [onSortChange]);

  // Get current page data
  const currentPageData = getPage(currentPage, pageSize);

  // Notify parent of changes
  useEffect(() => {
    if (onCarsChange && isReady()) {
      onCarsChange(currentPageData.items, state.total);
    }
  }, [onCarsChange, currentPageData.items, state.total, isReady]);

  // Auto-trigger initial sort on mount
  useEffect(() => {
    if (!state.isLoading && !state.sortedItems.length) {
      handleSortChange(selectedSort);
    }
  }, []);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const cacheStats = getCacheStats();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sort Control */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <AdaptiveSelect
            value={selectedSort}
            onValueChange={handleSortChange}
            placeholder="Sort all cars globally..."
            disabled={state.isLoading}
            options={SORT_OPTIONS}
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => clearCache()}
          disabled={state.isLoading}
        >
          <Database className="h-4 w-4 mr-2" />
          Clear Cache
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSortChange(selectedSort)}
          disabled={state.isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading Progress */}
      {(state.isLoading || state.progress) && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {state.isAggregating && '🔄 Fetching all cars from API...'}
                  {state.isSorting && '🔄 Sorting globally...'}
                  {!state.isAggregating && !state.isSorting && state.isLoading && '🔄 Loading...'}
                </span>
                {state.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {state.progress && (
                <>
                  <Progress value={progressPercent} className="w-full" />
                  <div className="text-xs text-muted-foreground">
                    Loaded {state.progress.loaded.toLocaleString()} / {state.progress.total.toLocaleString()} cars
                    {state.progress.pages && <> • Page {state.progress.pages}</>}
                    {state.progress.estimatedRemaining && (
                      <> • {state.progress.estimatedRemaining.toLocaleString()} remaining</>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {state.error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <div className="text-destructive text-sm">{state.error}</div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {isReady() && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Badge variant="secondary">
            {state.total.toLocaleString()} total cars
          </Badge>
          <Badge variant="outline">
            Page {currentPage} of {currentPageData.totalPages}
          </Badge>
          <Badge variant="outline">
            Fetch: {formatDuration(state.fetchDuration)}
          </Badge>
          <Badge variant="outline">
            Sort: {formatDuration(state.sortDuration)}
          </Badge>
          {cacheStats && (
            <Badge variant="outline">
              Cache: {cacheStats.cache.memory.size} entries
            </Badge>
          )}
        </div>
      )}

      {/* Car Grid */}
      {isReady() && currentPageData.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentPageData.items.map((car) => (
              <LazyCarCard
                key={car.id}
                id={car.id}
                make={car.make}
                model={car.model}
                year={car.year}
                price={car.price || 0}
                mileage={car.mileage?.toString()}
                image={car.thumbnail}
                images={car.thumbnail ? [car.thumbnail] : []}
                fuel=""
                transmission=""
                color=""
                lot={car.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {currentPageData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!currentPageData.hasPrev}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, currentPageData.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum > currentPageData.totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!currentPageData.hasNext}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPageData.totalPages)}
                disabled={currentPage === currentPageData.totalPages}
              >
                Last
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {isReady() && currentPageData.items.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No cars found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default GlobalSortingSelect;