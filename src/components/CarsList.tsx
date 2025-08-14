import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
}

interface CarsListProps {
  cars: Car[];
  isLoading: boolean;
  error?: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onCarClick: (car: Car) => void;
  className?: string;
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

// Individual car card component
const CarCard: React.FC<{ car: Car; onClick: () => void }> = React.memo(({ car, onClick }) => (
  <Card 
    className="w-full h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
    onClick={onClick}
  >
    <CardContent className="p-4">
      {/* Car Image */}
      <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-muted">
        {car.images && car.images.length > 0 ? (
          <img
            src={car.images[0]}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/car-placeholder.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Car Details */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">
          {car.year} {car.make} {car.model}
        </h3>
        
        <div className="text-sm text-muted-foreground space-y-1">
          {car.mileage && (
            <p>{car.mileage.toLocaleString()} km</p>
          )}
          {car.fuel && car.transmission && (
            <p>{car.fuel} • {car.transmission}</p>
          )}
          {car.color && (
            <p>Color: {car.color}</p>
          )}
          {car.location && (
            <p>📍 {car.location}</p>
          )}
        </div>

        {/* Price and Body Type */}
        <div className="flex justify-between items-center mt-3">
          <div className="text-xl font-bold text-primary">
            €{car.price.toLocaleString()}
          </div>
          {car.bodyType && (
            <Badge variant="outline" className="text-xs">
              {car.bodyType}
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
));

CarCard.displayName = 'CarCard';

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
        <CarCard car={car} onClick={() => onCarClick(car)} />
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
        <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('clear-filters'))}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {/* Grid Container */}
      <div className="w-full" style={{ height: '80vh', minHeight: '600px' }}>
        <Grid
          columnCount={columnsPerRow}
          rowCount={rowCount}
          columnWidth={cardWidth + 16} // Add margin
          rowHeight={cardHeight + 16} // Add margin
          width={columnsPerRow * (cardWidth + 16)}
          height={Math.min(window.innerHeight * 0.8, rowCount * (cardHeight + 16))}
          itemData={gridData}
          className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        >
          {GridItem}
        </Grid>
      </div>

      {/* Loading More Indicator */}
      {isLoading && cars.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span>Loading more cars...</span>
          </div>
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
            Load More Cars
            <div className="text-xs text-muted-foreground ml-2">
              ({cars.length} of {cars.length < 1000 ? '1000+' : 'many'} shown)
            </div>
          </Button>
        </div>
      )}

      {/* Initial Loading Skeletons */}
      {isLoading && cars.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, index) => (
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