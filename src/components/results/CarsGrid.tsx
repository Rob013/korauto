import { memo, forwardRef, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import { CarListing } from '@/lib/search/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Calendar, Gauge } from 'lucide-react';
import { formatMileage } from '@/utils/mileageFormatter';

interface CarsGridProps {
  cars: CarListing[];
  loading?: boolean;
  onCarClick?: (car: CarListing) => void;
  className?: string;
  width: number;
  height: number;
  columnCount?: number;
  rowHeight?: number;
}

interface CarCardProps {
  car: CarListing;
  onCarClick?: (car: CarListing) => void;
  priority?: boolean;
}

// Memoized car card component
const CarCard = memo(({ car, onCarClick, priority = false }: CarCardProps) => {
  const handleClick = useCallback(() => {
    onCarClick?.(car);
  }, [car, onCarClick]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  return (
    <Card 
      className="h-full cursor-pointer hover:shadow-md transition-shadow duration-200 border-muted"
      onClick={handleClick}
    >
      <CardContent className="p-3 h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] mb-3 bg-muted rounded-md overflow-hidden">
          {car.thumbnail ? (
            <img
              src={car.thumbnail}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover"
              loading={priority ? 'eager' : 'lazy'}
              onError={(e) => {
                // Fallback to placeholder on error
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback placeholder */}
          <div className={`absolute inset-0 flex items-center justify-center bg-muted ${car.thumbnail ? 'hidden' : ''}`}>
            <Car className="h-8 w-8 text-muted-foreground" />
          </div>
          
          {/* Year badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 text-xs"
          >
            {car.year}
          </Badge>
        </div>

        {/* Car info */}
        <div className="flex-1 space-y-2">
          {/* Title */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {car.make} {car.model}
          </h3>

          {/* Price */}
          <div className="text-lg font-bold text-primary">
            {formatPrice(car.price_eur)}
          </div>

          {/* Details */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              <span>{formatMileage(car.mileage_km) || '0 km'}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(car.listed_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CarCard.displayName = 'CarCard';

// Skeleton component for loading state
const CarCardSkeleton = memo(() => (
  <Card className="h-full">
    <CardContent className="p-3 h-full flex flex-col">
      <Skeleton className="w-full aspect-[4/3] mb-3 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </CardContent>
  </Card>
));

CarCardSkeleton.displayName = 'CarCardSkeleton';

// Grid item component
const GridItem = memo(({ columnIndex, rowIndex, style, data }: GridChildComponentProps) => {
  const { cars, onCarClick, columnCount, loading } = data;
  const itemIndex = rowIndex * columnCount + columnIndex;
  const car = cars[itemIndex];

  // Priority loading for first row
  const isPriority = rowIndex === 0;

  return (
    <div style={style} className="p-2">
      {loading || !car ? (
        <CarCardSkeleton />
      ) : (
        <CarCard 
          car={car} 
          onCarClick={onCarClick} 
          priority={isPriority}
        />
      )}
    </div>
  );
});

GridItem.displayName = 'GridItem';

export const CarsGrid = memo(({
  cars,
  loading = false,
  onCarClick,
  className = '',
  width,
  height,
  columnCount = 4,
  rowHeight = 320, // Updated to accommodate 4:3 aspect ratio images + content
}: CarsGridProps) => {
  // Calculate responsive column count based on width
  const responsiveColumnCount = useMemo(() => {
    if (width < 768) return 1; // Mobile
    if (width < 1024) return 3; // Tablet/iPad
    return 4; // Desktop - always 4 columns
  }, [width]);

  const columnWidth = useMemo(() => {
    return Math.floor(width / responsiveColumnCount);
  }, [width, responsiveColumnCount]);

  // Calculate number of rows needed
  const rowCount = useMemo(() => {
    if (loading) {
      // Show skeleton rows
      return Math.ceil(responsiveColumnCount * 2);
    }
    return Math.ceil(cars.length / responsiveColumnCount);
  }, [cars.length, responsiveColumnCount, loading]);

  // Prepare data for grid items
  const itemData = useMemo(() => ({
    cars,
    onCarClick,
    columnCount: responsiveColumnCount,
    loading,
  }), [cars, onCarClick, responsiveColumnCount, loading]);

  if (!loading && cars.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Car className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No cars found
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Try adjusting your filters or search criteria to find more results.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Grid
        columnCount={responsiveColumnCount}
        columnWidth={columnWidth}
        height={height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={width}
        itemData={itemData}
        overscanRowCount={1}
        overscanColumnCount={0}
      >
        {GridItem}
      </Grid>
    </div>
  );
});

CarsGrid.displayName = 'CarsGrid';

// Higher-order component to handle container sizing
export const ResponsiveCarsGrid = forwardRef<
  HTMLDivElement,
  Omit<CarsGridProps, 'width' | 'height'> & {
    height?: number;
    minHeight?: number;
  }
>(({ height = 600, minHeight = 400, ...props }, ref) => {
  return (
    <div 
      ref={ref}
      className="w-full"
      style={{ height: Math.max(height, minHeight) }}
    >
      <div className="w-full h-full">
        {/* This would typically use a resize observer or similar to get actual dimensions */}
        {/* For now, we'll use a simple approach */}
        <CarsGrid
          {...props}
          width={1200} // This should be dynamically calculated
          height={height}
        />
      </div>
    </div>
  );
});

ResponsiveCarsGrid.displayName = 'ResponsiveCarsGrid';