import React, { useEffect, useState, useMemo } from 'react';
import { useEncarAPI } from '@/hooks/useEncarAPI';
import { useCurrencyAPI } from '@/hooks/useCurrencyAPI';
import LazyCarCard from '@/components/LazyCarCard';
import { AdaptiveSelect } from '@/components/ui/adaptive-select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface EncarCatalogProps {
  highlightCarId?: string | null;
}

const EncarCatalog = ({ highlightCarId }: EncarCatalogProps) => {
  const { cars, loading, error, totalCount, fetchCars } = useEncarAPI();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('recently_added');
  
  const sortOptions = [
    { value: 'recently_added', label: 'Recently Added' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'year_desc', label: 'Year: Newest First' },
    { value: 'year_asc', label: 'Year: Oldest First' },
    { value: 'mileage_asc', label: 'Mileage: Low to High' }
  ];

  // Sort cars based on selected option
  const sortedCars = useMemo(() => {
    if (!cars || cars.length === 0) return [];
    
    const carsCopy = [...cars];
    
    switch (sortBy) {
      case 'price_asc':
        return carsCopy.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc':
        return carsCopy.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'year_desc':
        return carsCopy.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'year_asc':
        return carsCopy.sort((a, b) => (a.year || 0) - (b.year || 0));
      case 'mileage_asc':
        return carsCopy.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      case 'recently_added':
      default:
        return carsCopy.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
    }
  }, [cars, sortBy]);

  // Load initial cars on mount
  useEffect(() => {
    fetchCars(1, 24);
  }, []);

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchCars(nextPage, 24);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <p>Error loading cars: {error}</p>
          <Button onClick={() => fetchCars(1, 24)} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Car Catalog</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount > 0 ? `${totalCount.toLocaleString()} cars found` : 'Loading cars...'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="min-w-[200px]">
            <AdaptiveSelect
              value={sortBy}
              onValueChange={handleSortChange}
              placeholder="Sort by..."
              options={sortOptions}
            />
          </div>
        </div>
      </div>

      {/* Cars Grid */}
      {loading && cars.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <Skeleton key={index} className="h-80 w-full rounded-lg" />
          ))}
        </div>
      ) : sortedCars.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {sortedCars.map((car) => (
              <LazyCarCard
                key={car.id}
                id={car.id}
                title={`${car.make} ${car.model}`}
                make={car.make}
                model={car.model}
                year={car.year}
                price={car.price}
                mileage={car.mileage ? `${car.mileage.toLocaleString()} km` : undefined}
                fuel={car.fuel}
                transmission={car.transmission}
                color={car.color}
                condition={car.condition}
                image={car.image_url}
              />
            ))}
          </div>
          
          {/* Load More Button */}
          {totalCount > sortedCars.length && (
            <div className="text-center">
              <Button 
                onClick={handleLoadMore} 
                disabled={loading}
                size="lg"
                variant="outline"
              >
                {loading ? 'Loading...' : `Load More Cars (${sortedCars.length} of ${totalCount})`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No cars found</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or check back later</p>
        </div>
      )}
    </div>
  );
};

export default EncarCatalog;