import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw } from 'lucide-react';
import LazyCarCard from '@/components/LazyCarCard';
import { useGlobalSortedCars, CarFilters, GlobalSortOptions } from '@/hooks/useGlobalSortedCars';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SORT_OPTIONS = [
  { field: 'price_cents', direction: 'ASC', label: 'Price: Low to High' },
  { field: 'price_cents', direction: 'DESC', label: 'Price: High to Low' },
  { field: 'year', direction: 'DESC', label: 'Year: Newest First' },
  { field: 'year', direction: 'ASC', label: 'Year: Oldest First' },
  { field: 'make', direction: 'ASC', label: 'Make: A-Z' },
  { field: 'make', direction: 'DESC', label: 'Make: Z-A' },
  { field: 'created_at', direction: 'DESC', label: 'Recently Added' },
] as const;

export const GlobalSortedCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Initialize from URL params
  const initialFilters: CarFilters = useMemo(() => ({
    make: searchParams.get('make') || undefined,
    model: searchParams.get('model') || undefined,
    yearMin: searchParams.get('yearMin') || undefined,
    yearMax: searchParams.get('yearMax') || undefined,
    priceMin: searchParams.get('priceMin') || undefined,
    priceMax: searchParams.get('priceMax') || undefined,
    fuel: searchParams.get('fuel') || undefined,
    search: searchParams.get('search') || undefined,
  }), []);

  const initialSort: GlobalSortOptions = useMemo(() => {
    const sortParam = searchParams.get('sort') || 'price_cents:ASC';
    const [field, direction] = sortParam.split(':');
    return {
      field: field as GlobalSortOptions['field'],
      direction: direction as GlobalSortOptions['direction']
    };
  }, []);

  // Use the global sorted cars hook
  const {
    cars,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    fetchPage,
    applyFilters,
    changeSort,
    refreshData
  } = useGlobalSortedCars(initialFilters, initialSort, 50);

  // Local state for form inputs
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [makeFilter, setMakeFilter] = useState(initialFilters.make || '');
  const [modelFilter, setModelFilter] = useState(initialFilters.model || '');
  const [minPrice, setMinPrice] = useState(initialFilters.priceMin || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.priceMax || '');
  const [minYear, setMinYear] = useState(initialFilters.yearMin || '');
  const [maxYear, setMaxYear] = useState(initialFilters.yearMax || '');
  const [syncing, setSyncing] = useState(false);

  // Update URL when filters or sort change
  const updateURL = useCallback((newFilters: CarFilters, newSort: GlobalSortOptions, page: number) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    params.set('sort', `${newSort.field}:${newSort.direction}`);
    params.set('page', page.toString());
    
    setSearchParams(params);
  }, [setSearchParams]);

  // Handle filter application
  const handleApplyFilters = useCallback(async () => {
    const newFilters: CarFilters = {
      search: searchTerm || undefined,
      make: makeFilter || undefined,
      model: modelFilter || undefined,
      priceMin: minPrice || undefined,
      priceMax: maxPrice || undefined,
      yearMin: minYear || undefined,
      yearMax: maxYear || undefined,
    };

    await applyFilters(newFilters);
    updateURL(newFilters, initialSort, 1);
  }, [searchTerm, makeFilter, modelFilter, minPrice, maxPrice, minYear, maxYear, applyFilters, updateURL, initialSort]);

  // Handle sort change
  const handleSortChange = useCallback(async (sortValue: string) => {
    const [field, direction] = sortValue.split(':');
    const newSort: GlobalSortOptions = {
      field: field as GlobalSortOptions['field'],
      direction: direction as GlobalSortOptions['direction']
    };

    await changeSort(newSort);
    updateURL(initialFilters, newSort, currentPage);
  }, [changeSort, updateURL, initialFilters, currentPage]);

  // Handle pagination
  const handlePageChange = useCallback(async (page: number) => {
    await fetchPage(page);
    updateURL(initialFilters, initialSort, page);
  }, [fetchPage, updateURL, initialFilters, initialSort]);

  // Trigger enhanced sync
  const handleTriggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      console.log('🚀 Triggering enhanced sync...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-cars-sync', {
        body: { resume: false }
      });

      if (error) throw error;

      toast({
        title: "Sync Started",
        description: "Enhanced car sync is running. The data will update automatically.",
      });

      // Refresh data after a delay to see new results
      setTimeout(() => refreshData(), 5000);

    } catch (error) {
      console.error('❌ Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }, [toast, refreshData]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setMakeFilter('');
    setModelFilter('');
    setMinPrice('');
    setMaxPrice('');
    setMinYear('');
    setMaxYear('');
    applyFilters({});
    setSearchParams({});
  }, [applyFilters, setSearchParams]);

  const currentSortValue = `${initialSort.field}:${initialSort.direction}`;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Car Catalog</h1>
          <p className="text-muted-foreground">
            {totalCount} cars • Page {currentPage} of {totalPages}
          </p>
        </div>
        <Button
          onClick={handleTriggerSync}
          disabled={syncing}
          className="gap-2"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncing ? 'Syncing...' : 'Sync Cars'}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Make</label>
              <Input
                placeholder="e.g. BMW"
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input
                placeholder="e.g. M3"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Price (€)</label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Price (€)</label>
              <Input
                type="number"
                placeholder="100000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Year Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="2010"
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="2024"
                  value={maxYear}
                  onChange={(e) => setMaxYear(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="gap-2">
              <Search className="h-4 w-4" />
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} variant="outline">
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sort and Results */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <label className="text-sm font-medium">Sort by:</label>
          </div>
          <Select value={currentSortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem
                  key={`${option.field}:${option.direction}`}
                  value={`${option.field}:${option.direction}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <Badge variant="secondary" className="text-sm">
          {loading ? 'Loading...' : `${cars.length} of ${totalCount} results`}
        </Badge>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading globally sorted results...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refreshData} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Cars Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cars.map((car, index) => (
              <div key={car.id} className="relative">
                <LazyCarCard
                  id={car.id}
                  make={car.make}
                  model={car.model}
                  year={car.year}
                  price={car.price_cents / 100}
                  image={car.image_url}
                  mileage={car.mileage}
                  transmission={car.transmission}
                  fuel={car.fuel}
                  color={car.color}
                  isVisible={true}
                />
                <Badge 
                  variant="outline" 
                  className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-xs"
                >
                  #{car.row_number}
                </Badge>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage || loading}
                variant="outline"
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Page</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                    }
                  }}
                  className="w-16 text-center"
                />
                <span className="text-sm">of {totalPages}</span>
              </div>
              
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage || loading}
                variant="outline"
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Debug info for verification */}
          {cars.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm">
              <h3 className="font-medium mb-2">Global Sorting Verification:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <strong>First car:</strong><br />
                  €{(cars[0].price_cents / 100).toFixed(0)} (#{cars[0].row_number})
                </div>
                <div>
                  <strong>Last car:</strong><br />
                  €{(cars[cars.length - 1].price_cents / 100).toFixed(0)} (#{cars[cars.length - 1].row_number})
                </div>
                <div>
                  <strong>Page range:</strong><br />
                  #{cars[0].row_number} - #{cars[cars.length - 1].row_number}
                </div>
                <div>
                  <strong>Total:</strong><br />
                  {totalCount} cars across {totalPages} pages
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && cars.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No cars found matching your criteria.</p>
          <Button onClick={handleClearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};