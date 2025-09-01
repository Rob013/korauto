import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBackendSorting } from '@/hooks/useBackendSorting';
import { CarFilters, FrontendSortOption } from '@/services/carsApi';
import { Loader2, SortAsc, SortDesc } from 'lucide-react';

export const BackendSortingDemo = () => {
  const [filters] = useState<CarFilters>({});
  const [sortedCars, setSortedCars] = useState<any[]>([]);
  
  const { applySorting, isLoading, error, total, supportedSorts } = useBackendSorting({
    filters,
    onSortChange: (cars, totalCount) => {
      setSortedCars(cars);
      console.log(`Received ${cars.length} sorted cars out of ${totalCount} total`);
    }
  });

  const handleSortChange = useCallback(async (sortValue: string) => {
    console.log(`🔄 Applying backend sort: ${sortValue}`);
    await applySorting(sortValue as FrontendSortOption);
  }, [applySorting]);

  const sortOptions = [
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'year_new', label: 'Year: Newest First' },
    { value: 'year_old', label: 'Year: Oldest First' },
    { value: 'recently_added', label: 'Recently Added' },
    { value: 'popular', label: 'Most Popular' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SortAsc className="h-5 w-5" />
          Backend Global Sorting Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <Select onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select sorting option" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sorting globally...
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Error: {error}
          </div>
        )}

        {sortedCars.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Showing {sortedCars.length} cars (Total: {total})
            </div>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {sortedCars.slice(0, 10).map((car, index) => (
                <div key={car.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                  <span>#{index + 1} {car.year} {car.make} {car.model}</span>
                  <span>€{car.price?.toLocaleString()}</span>
                </div>
              ))}
              {sortedCars.length > 10 && (
                <div className="text-xs text-muted-foreground text-center">
                  ... and {sortedCars.length - 10} more cars
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};