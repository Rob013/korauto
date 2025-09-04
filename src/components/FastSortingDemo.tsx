/**
 * Fast Global Sorting Integration Component
 * Demonstrates usage of the new fast global sorting system
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, Timer, Database, Zap } from 'lucide-react';
import { useFastGlobalSorting, mapToSortKey } from '@/hooks/useFastGlobalSorting';
import type { SortKey } from '@/services/globalSort';

interface FastSortingDemoProps {
  filters?: any;
  onCarsChange?: (cars: any[], total: number) => void;
}

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_asc', label: 'Year: Old to New' },
  { value: 'year_desc', label: 'Year: New to Old' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_desc', label: 'Mileage: High to Low' },
  { value: 'make_asc', label: 'Make: A to Z' },
  { value: 'make_desc', label: 'Make: Z to A' },
];

export function FastSortingDemo({ filters = {}, onCarsChange }: FastSortingDemoProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedSort, setSelectedSort] = useState<SortKey>('price_asc');
  const [progressPercent, setProgressPercent] = useState(0);

  const {
    state,
    onSortChange,
    getPage,
    prefetchPage,
    clearCache,
    isReady,
    getCacheStats
  } = useFastGlobalSorting(
    { filters, sort: selectedSort },
    {
      pageSize,
      cacheEnabled: true,
      onProgress: (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        setProgressPercent(percent);
      }
    }
  );

  // Handle sort change
  const handleSortChange = useCallback(async (newSort: string) => {
    const sortKey = mapToSortKey(newSort);
    setSelectedSort(sortKey);
    setCurrentPage(1); // Reset to page 1
    setProgressPercent(0);
    
    console.log(`🔄 Sort change: ${newSort} -> ${sortKey}`);
    await onSortChange(sortKey);
  }, [onSortChange]);

  // Get current page data
  const currentPageData = getPage(currentPage, pageSize);
  
  // Prefetch next page
  useEffect(() => {
    if (isReady() && currentPageData.hasNext) {
      prefetchPage(currentPage + 1, pageSize);
    }
  }, [currentPage, pageSize, isReady, prefetchPage, currentPageData.hasNext]);

  // Notify parent of changes
  useEffect(() => {
    if (onCarsChange && isReady()) {
      onCarsChange(currentPageData.items, state.total);
    }
  }, [onCarsChange, currentPageData.items, state.total, isReady]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const cacheStats = getCacheStats();

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Fast Global Sorting
          </CardTitle>
          <CardDescription>
            High-performance sorting with caching and Web Worker optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={selectedSort} onValueChange={handleSortChange} disabled={state.isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Page Size</label>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 items</SelectItem>
                  <SelectItem value="50">50 items</SelectItem>
                  <SelectItem value="100">100 items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={clearCache} variant="outline" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status and Progress */}
      {(state.isLoading || state.progress) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {state.isAggregating && 'Fetching all results...'}
                  {state.isSorting && 'Sorting data...'}
                  {!state.isAggregating && !state.isSorting && state.isLoading && 'Loading...'}
                </span>
                {state.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {state.progress && (
                <>
                  <Progress value={progressPercent} className="w-full" />
                  <div className="text-xs text-muted-foreground text-center">
                    Loaded {state.progress.loaded.toLocaleString()} / {state.progress.total.toLocaleString()} items
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
          <CardContent className="pt-6">
            <div className="text-destructive text-sm">{state.error}</div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {isReady() && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{state.total.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{currentPageData.totalPages}</div>
                <div className="text-sm text-muted-foreground">Total Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatDuration(state.fetchDuration)}</div>
                <div className="text-sm text-muted-foreground">Fetch Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatDuration(state.sortDuration)}</div>
                <div className="text-sm text-muted-foreground">Sort Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {isReady() && currentPageData.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {currentPageData.totalPages} • 
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, state.total)} of {state.total.toLocaleString()}
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
          </CardContent>
        </Card>
      )}

      {/* Cache Statistics */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Performance Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Memory Cache</div>
                <div className="text-muted-foreground">
                  {cacheStats.cache.memory.size} / {cacheStats.cache.memory.maxSize} entries
                </div>
              </div>
              <div>
                <div className="font-medium">Sort Average</div>
                <div className="text-muted-foreground">
                  {formatDuration(cacheStats.sort.averageTime)}
                </div>
              </div>
              <div>
                <div className="font-medium">Current Sort</div>
                <div className="text-muted-foreground">{selectedSort}</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(cacheStats.sort.bySort).map(([sortKey, avgTime]) => (
                <Badge key={sortKey} variant="secondary" className="text-xs">
                  {sortKey}: {formatDuration(avgTime as number)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Page Data Preview */}
      {isReady() && currentPageData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Page Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentPageData.items.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      #{((currentPage - 1) * pageSize) + index + 1}
                    </span>
                    <span className="font-medium">{item.make} {item.model}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>${item.price?.toLocaleString() || 'N/A'}</span>
                    <span>{item.year || 'N/A'}</span>
                    <span>{item.mileage?.toLocaleString() || 'N/A'} mi</span>
                  </div>
                </div>
              ))}
              {currentPageData.items.length > 5 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... and {currentPageData.items.length - 5} more items
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FastSortingDemo;