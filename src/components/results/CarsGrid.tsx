import { memo, forwardRef, useCallback, useMemo } from 'react';
// import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window'; // Temporarily disabled for performance optimization
import { CarListing } from '@/lib/search/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Calendar, Gauge } from 'lucide-react';

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

  const formatMileage = (mileage: number) => {
    return `${mileage.toLocaleString()} km`;
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
        <div className="relative w-full h-32 mb-3 bg-muted rounded-md overflow-hidden">
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
              <span>{formatMileage(car.mileage_km)}</span>
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
      <Skeleton className="w-full h-32 mb-3 rounded-md" />
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

// Grid item component - simplified fallback
const GridItem = memo(({ car, onCarClick, isPriority }: { car: any; onCarClick: any; isPriority: boolean }) => {
  return (
    <div className="p-2">
      <CarCard 
        car={car} 
        onCarClick={onCarClick} 
        priority={isPriority}
      />
    </div>
  );
});

GridItem.displayName = 'GridItem';

export const CarsGrid = memo(({
  cars,
  loading = false,
  onCarClick,
  className = '',
}: Omit<CarsGridProps, 'width' | 'height'>) => {
  if (!loading && cars.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Car className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No cars found</h3>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {loading ? 
        [...Array(12)].map((_, i) => <CarCardSkeleton key={i} />) :
        cars.map((car) => (
          <CarCard key={car.id} car={car} onCarClick={onCarClick} />
        ))
      }
    </div>
  );
});

CarsGrid.displayName = 'CarsGrid';

export const ResponsiveCarsGrid = forwardRef<HTMLDivElement, Omit<CarsGridProps, 'width' | 'height'>>(
  (props, ref) => {
    return (
      <div ref={ref} className="w-full">
        <CarsGrid {...props} />
      </div>
    );
  }
);

ResponsiveCarsGrid.displayName = 'ResponsiveCarsGrid';