/**
 * Integration Example: Using Fast Global Sorting with Existing Catalog
 * Shows how to integrate the new fast sorting system while keeping existing UI unchanged
 */

import React, { useState, useCallback } from 'react';
import { useFastGlobalSorting, mapToSortKey } from '@/hooks/useFastGlobalSorting';
import LazyCarCard from '@/components/LazyCarCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface IntegratedCatalogProps {
  filters?: any;
  defaultSort?: string;
  pageSize?: number;
}

export function IntegratedCatalog({ 
  filters = {}, 
  defaultSort = 'price_asc', 
  pageSize = 50 
}: IntegratedCatalogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState(defaultSort);

  // Initialize fast global sorting
  const {
    state,
    onSortChange,
    getPage,
    isReady
  } = useFastGlobalSorting(
    { filters, sort: mapToSortKey(selectedSort) as any },
    { 
      pageSize,
      cacheEnabled: true,
      onProgress: (progress) => {
        console.log(`Loading progress: ${progress.loaded}/${progress.total}`);
      }
    }
  );

  // Handle sort change with automatic page reset
  const handleSortChange = useCallback(async (newSort: string) => {
    setSelectedSort(newSort);
    setCurrentPage(1); // Reset to first page on sort change
    await onSortChange(mapToSortKey(newSort));
  }, [onSortChange]);

  // Get current page data
  const currentPageData = getPage(currentPage, pageSize);

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedSort} onValueChange={handleSortChange} disabled={state.isLoading}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="year_desc">Year: New to Old</SelectItem>
              <SelectItem value="year_asc">Year: Old to New</SelectItem>
              <SelectItem value="mileage_asc">Mileage: Low to High</SelectItem>
              <SelectItem value="mileage_desc">Mileage: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {isReady() && (
            <span className="text-sm text-muted-foreground">
              {state.total.toLocaleString()} cars found
            </span>
          )}
        </div>
      </div>

      {/* Loading Progress */}
      {state.isLoading && state.progress && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {state.isAggregating ? 'Fetching all results...' : 'Sorting...'}
                </span>
                <span>{state.progress.loaded.toLocaleString()} / {state.progress.total.toLocaleString()}</span>
              </div>
              <Progress value={(state.progress.loaded / state.progress.total) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {state.error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-destructive">{state.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Car Grid - Using Existing LazyCarCard Component */}
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, state.total)} of {state.total.toLocaleString()} cars
              </div>
              
              <div className="flex gap-2">
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
                <span className="px-3 py-2 text-sm">
                  Page {currentPage} of {currentPageData.totalPages}
                </span>
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

export default IntegratedCatalog;