import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingLogo from "@/components/LoadingLogo";
import { formatMileage } from '@/utils/mileageFormatter';
import { debounce } from '@/utils/performance';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface VirtualCarsListProps {
  cars: Car[];
  isLoading: boolean;
  error?: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onCarClick: (car: Car) => void;
  className?: string;
  totalCount?: number;
  activeFiltersCount?: number;
}

// Optimized skeleton with better performance
const CarCardSkeleton: React.FC = React.memo(() => (
  <Card className="w-full h-full animate-pulse">
    <CardContent className="p-3">
      <div className="h-40 bg-muted mb-3 rounded" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-5 bg-muted rounded w-20" />
          <div className="h-5 bg-muted rounded w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
));

// Optimized car card with minimal re-renders
const FastCarCard: React.FC<{ car: Car; onClick: () => void }> = React.memo(({ car, onClick }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  
  return (
    <Card 
      className="w-full h-full cursor-pointer transition-transform duration-200 hover:scale-[1.02] will-change-transform"
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Optimized Image */}
        <div className="relative h-40 mb-3 rounded overflow-hidden bg-muted">
          {car.images && car.images.length > 0 ? (
            <img
              src={car.images[0]}
              alt={`${car.make} ${car.model}`}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No Image
            </div>
          )}
        </div>

        {/* Car Details - Optimized layout */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-1">
            {car.year} {car.make} {car.model}
          </h3>
          
          <div className="text-xs text-muted-foreground space-y-1">
            {car.mileage && <p>{formatMileage(car.mileage)}</p>}
            {car.fuel && car.transmission && (
              <p>{car.fuel} • {car.transmission}</p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-lg font-bold text-primary">
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
  );
});

// Grid item renderer optimized for performance
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
}> = React.memo(({ columnIndex, rowIndex, style, data }) => {
  const { cars, columnsPerRow, onCarClick, isLoading } = data;
  const carIndex = rowIndex * columnsPerRow + columnIndex;
  const car = cars[carIndex];

  return (
    <div style={{ ...style, padding: '6px' }}>
      {car ? (
        <FastCarCard car={car} onClick={() => onCarClick(car)} />
      ) : isLoading && carIndex < cars.length + 20 ? (
        <CarCardSkeleton />
      ) : null}
    </div>
  );
});

// Optimized hook for intersection observer
const useLoadMoreObserver = (
  callback: () => void,
  hasMore: boolean,
  isLoading: boolean
) => {
  const targetRef = useRef<HTMLDivElement>(null);
  
  const debouncedCallback = useMemo(
    () => debounce(callback, 100),
    [callback]
  );

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          debouncedCallback();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [debouncedCallback, hasMore, isLoading]);

  return targetRef;
};

const VirtualCarsList: React.FC<VirtualCarsListProps> = ({
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
  const isMobile = useIsMobile();

  // Optimized grid calculations with memoization
  const gridConfig = useMemo(() => {
    const containerWidth = window.innerWidth;
    
    let cardWidth: number;
    let columnsPerRow: number;
    
    if (isMobile) {
      cardWidth = Math.min(280, containerWidth - 32);
      columnsPerRow = containerWidth < 600 ? 1 : 2;
    } else if (containerWidth >= 1536) {
      cardWidth = 280;
      columnsPerRow = Math.floor((containerWidth - 64) / (cardWidth + 12));
    } else if (containerWidth >= 1280) {
      cardWidth = 260;
      columnsPerRow = Math.floor((containerWidth - 64) / (cardWidth + 12));
    } else if (containerWidth >= 1024) {
      cardWidth = 240;
      columnsPerRow = Math.floor((containerWidth - 48) / (cardWidth + 12));
    } else {
      cardWidth = 220;
      columnsPerRow = Math.floor((containerWidth - 32) / (cardWidth + 12));
    }

    const cardHeight = isMobile ? 280 : 300;
    const rowCount = Math.ceil(cars.length / columnsPerRow);

    return { 
      columnsPerRow, 
      rowCount, 
      cardWidth: cardWidth + 12, 
      cardHeight: cardHeight + 12,
      containerWidth: columnsPerRow * (cardWidth + 12)
    };
  }, [cars.length, isMobile]);

  // Load more observer
  const loadMoreRef = useLoadMoreObserver(onLoadMore, hasMore, isLoading);

  // Grid data memoization
  const gridData = useMemo(() => ({
    cars,
    columnsPerRow: gridConfig.columnsPerRow,
    onCarClick,
    isLoading,
  }), [cars, gridConfig.columnsPerRow, onCarClick, isLoading]);

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
      {/* Virtual Grid Container */}
      <div className="w-full" style={{ height: isMobile ? '70vh' : '80vh', minHeight: '400px' }}>
        <Grid
          columnCount={gridConfig.columnsPerRow}
          rowCount={gridConfig.rowCount}
          columnWidth={() => gridConfig.cardWidth}
          rowHeight={() => gridConfig.cardHeight}
          width={Math.min(gridConfig.containerWidth, window.innerWidth - (isMobile ? 16 : 32))}
          height={isMobile ? window.innerHeight * 0.7 : window.innerHeight * 0.8}
          itemData={gridData}
          className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          overscanRowCount={2}
          overscanColumnCount={1}
        >
          {GridItem}
        </Grid>
      </div>

      {/* Loading indicator */}
      {isLoading && cars.length > 0 && (
        <div className="flex justify-center py-6">
          <LoadingLogo size="md" />
        </div>
      )}

      {/* Load more trigger */}
      {hasMore && !isLoading && (
        <div ref={loadMoreRef} className="h-1" />
      )}

      {/* Load more button fallback */}
      {hasMore && !isLoading && cars.length > 0 && (
        <div className="flex justify-center py-6">
          <Button
            onClick={onLoadMore}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            Load More Cars
            {totalCount && (
              <span className="text-xs text-muted-foreground">
                ({cars.length} of {totalCount.toLocaleString()})
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Initial loading */}
      {isLoading && cars.length === 0 && (
        <div className={`grid gap-3 ${
          isMobile 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        }`}>
          {Array.from({ length: isMobile ? 6 : 15 }).map((_, index) => (
            <CarCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* End of results */}
      {!hasMore && cars.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>All cars loaded</p>
          <p className="text-sm mt-1">{cars.length} total</p>
        </div>
      )}
    </div>
  );
};

FastCarCard.displayName = 'FastCarCard';
GridItem.displayName = 'GridItem';

export default VirtualCarsList;