import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  images?: string[];
  image?: string;
  lot?: string;
  title?: string;
  status?: number;
  sale_status?: string;
  is_archived?: boolean;
  archived_at?: string;
  archive_reason?: string;
}

interface CarsListProps {
  cars: Car[];
  isLoading: boolean;
  error?: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onCarClick: (car: Car) => void;
  className?: string;
  totalCount?: number; // Add total count for better display
  activeFiltersCount?: number; // Add active filters count
}

// Skeleton component for loading states
const CarCardSkeleton: React.FC = () => (
  <Card className="w-full h-full">
    <CardContent className="p-4">
      <Skeleton className="h-48 w-full mb-4 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center mt-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Individual car card component using the actual LazyCarCard
const CarCardWrapper: React.FC<{ car: Car; onClick: () => void }> = React.memo(({ car, onClick }) => (
  <div className="h-full" onClick={onClick}>
    <LazyCarCard
      id={car.id}
      make={car.make}
      model={car.model}
      year={car.year}
      price={car.price}
      image={car.image || car.images?.[0]}
      images={car.images}
      mileage={car.mileage?.toString()}
      transmission={car.transmission}
      fuel={car.fuel}
      color={car.color}
      lot={car.lot}
      title={car.title}
      status={car.status}
      sale_status={car.sale_status}
      is_archived={car.is_archived}
      archived_at={car.archived_at}
      archive_reason={car.archive_reason}
    />
  </div>
));

CarCardWrapper.displayName = 'CarCardWrapper';

// Grid item renderer for react-window
const GridItem: React.FC<{
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    cars: Car[];
    columnsPerRow: number;
    onCarClick: (car: Car) => void;
    isLoading: boolean;
  };
}> = ({ columnIndex, rowIndex, style, data }) => {
  const { cars, columnsPerRow, onCarClick, isLoading } = data;
  const carIndex = rowIndex * columnsPerRow + columnIndex;
  const car = cars[carIndex];

  return (
    <div style={{ ...style, padding: '8px' }}>
      {car ? (
        <CarCardWrapper car={car} onClick={() => onCarClick(car)} />
      ) : isLoading ? (
        <CarCardSkeleton />
      ) : null}
    </div>
  );
};

// Hook for intersection observer to detect when to load more
const useLoadMoreObserver = (
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      options
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
};

const CarsList: React.FC<CarsListProps> = ({
  cars,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onCarClick,
  className = '',
  totalCount,
  activeFiltersCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions
  const { columnsPerRow, rowCount, cardWidth, cardHeight } = useMemo(() => {
    const containerWidth = window.innerWidth;
    
    // Responsive card sizing
    let cardWidth: number;
    let columnsPerRow: number;
    
    if (containerWidth >= 1536) { // 2xl
      cardWidth = 280;
      columnsPerRow = Math.floor((containerWidth - 64) / (cardWidth + 16));
    } else if (containerWidth >= 1280) { // xl
      cardWidth = 260;
      columnsPerRow = Math.floor((containerWidth - 64) / (cardWidth + 16));
    } else if (containerWidth >= 1024) { // lg
      cardWidth = 240;
      columnsPerRow = Math.floor((containerWidth - 48) / (cardWidth + 16));
    } else if (containerWidth >= 768) { // md
      cardWidth = 220;
      columnsPerRow = Math.floor((containerWidth - 32) / (cardWidth + 16));
    } else { // sm and smaller
      cardWidth = Math.min(300, containerWidth - 32);
      columnsPerRow = 1;
    }

    const cardHeight = 320; // Fixed height for consistent grid
    const rowCount = Math.ceil(cars.length / columnsPerRow);

    return { columnsPerRow, rowCount, cardWidth, cardHeight };
  }, [cars.length]);

  // Prefetch next page when near bottom
  const loadMoreRef = useLoadMoreObserver(
    useCallback(() => {
      if (hasMore && !isLoading) {
        onLoadMore();
      }
    }, [hasMore, isLoading, onLoadMore]),
    { rootMargin: '200px' } // Start loading 200px before reaching bottom
  );

  // Grid data for react-window
  const gridData = useMemo(() => ({
    cars,
    columnsPerRow,
    onCarClick,
    isLoading,
  }), [cars, columnsPerRow, onCarClick, isLoading]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive text-lg font-medium mb-2">
          Failed to load cars
        </div>
        <div className="text-muted-foreground mb-4">
          {error.message}
        </div>
        <div className="text-xs text-muted-foreground mb-4 font-mono bg-muted p-3 rounded max-w-md">
          Debug info: {JSON.stringify({ 
            errorName: error.name,
            errorStack: error.stack?.split('\n')[0]
          }, null, 2)}
        </div>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!isLoading && cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-lg font-medium mb-2">No cars found</div>
        <div className="text-muted-foreground mb-4">
          Try adjusting your filters to see more results
        </div>
        <div className="text-xs text-muted-foreground mb-4 font-mono bg-muted p-3 rounded max-w-md">
          Debug info: {JSON.stringify({ 
            totalCount,
            activeFiltersCount,
            hasMore,
            isLoading
          }, null, 2)}
        </div>
        <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('clear-filters'))}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {/* Simple Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {cars.map((car) => (
          <CarCardWrapper key={car.id} car={car} onClick={() => onCarClick(car)} />
        ))}
      </div>

      {/* Loading More Indicator */}
      {isLoading && cars.length > 0 && (
        <div className="flex justify-center py-8">
          <LoadingLogo size="md" />
        </div>
      )}

      {/* Load More Trigger (invisible, for intersection observer) */}
      {hasMore && !isLoading && (
        <div ref={loadMoreRef} className="h-1" />
      )}

      {/* Load More Button (visible backup) */}
      {hasMore && !isLoading && cars.length > 0 && (
        <div className="flex justify-center py-8">
          <Button
            onClick={onLoadMore}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            {activeFiltersCount && activeFiltersCount > 0 ? (
              <>
                Load More Filtered Cars
                <div className="text-xs text-muted-foreground ml-2">
                  ({cars.length} of {totalCount ? totalCount.toLocaleString() : 'many'} shown)
                </div>
              </>
            ) : (
              <>
                Load More Cars
                <div className="text-xs text-muted-foreground ml-2">
                  ({cars.length} of {totalCount ? totalCount.toLocaleString() : 'many'} shown)
                </div>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Initial Loading Skeletons */}
      {isLoading && cars.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {Array.from({ length: 24 }).map((_, index) => (
            <CarCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* End of Results */}
      {!hasMore && cars.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>You've reached the end of the results</p>
          <p className="text-sm mt-1">{cars.length} cars total</p>
        </div>
      )}
    </div>
  );
};

export default CarsList;