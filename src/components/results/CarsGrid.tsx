import React, { useMemo, useRef, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { CarListItem } from '@/lib/search/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface CarsGridProps {
  cars: CarListItem[];
  loading?: boolean;
  onCarClick?: (car: CarListItem) => void;
  className?: string;
  itemsPerRow?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

interface CarCardProps {
  car: CarListItem;
  onClick?: () => void;
  loading?: boolean;
}

// Individual car card component
function CarCard({ car, onClick, loading = false }: CarCardProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  if (loading) {
    return <CarCardSkeleton />;
  }

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] h-full"
      onClick={onClick}
    >
      <CardContent className="p-3 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-muted">
          {car.thumbnail && !imageError ? (
            <>
              {!imageLoaded && (
                <Skeleton className="absolute inset-0" />
              )}
              <img
                src={car.thumbnail}
                alt={`${car.make} ${car.model}`}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-200",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
              <div className="text-center">
                <div className="text-2xl mb-1">🚗</div>
                <div className="text-xs">No Image</div>
              </div>
            </div>
          )}
          
          {/* Overlay badges */}
          {car.accident && car.accident !== 'none' && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 left-2 text-xs"
            >
              {car.accident}
            </Badge>
          )}
        </div>

        {/* Car Info */}
        <div className="flex-1 flex flex-col space-y-2">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
              {car.year} {car.make} {car.model}
            </h3>
            {car.trim && (
              <p className="text-xs text-muted-foreground truncate">
                {car.trim}
              </p>
            )}
          </div>

          {/* Key specs */}
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            {car.mileage_km && (
              <div className="flex items-center gap-1">
                <span>📊</span>
                <span>{(car.mileage_km / 1000).toFixed(0)}k km</span>
              </div>
            )}
            {car.fuel && (
              <div className="flex items-center gap-1">
                <span>⛽</span>
                <span>{car.fuel}</span>
              </div>
            )}
            {car.transmission && (
              <div className="flex items-center gap-1">
                <span>⚙️</span>
                <span>{car.transmission}</span>
              </div>
            )}
            {car.engine_cc && (
              <div className="flex items-center gap-1">
                <span>🔧</span>
                <span>{car.engine_cc}cc</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-auto pt-2">
            {car.price_eur ? (
              <div className="text-lg font-bold text-primary">
                €{car.price_eur.toLocaleString()}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Price on request
              </div>
            )}
          </div>

          {/* Additional info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {car.region && (
              <span className="flex items-center gap-1">
                📍 {car.region}
              </span>
            )}
            {car.lot_number && (
              <span className="font-mono">
                #{car.lot_number}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for car card
function CarCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-3 h-full">
        <Skeleton className="aspect-[4/3] mb-3 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="grid grid-cols-2 gap-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-6 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

// Grid item component for react-window
interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    cars: CarListItem[];
    itemsPerRow: number;
    onCarClick?: (car: CarListItem) => void;
    loading?: boolean;
  };
}

function GridItem({ columnIndex, rowIndex, style, data }: GridItemProps) {
  const { cars, itemsPerRow, onCarClick, loading } = data;
  const index = rowIndex * itemsPerRow + columnIndex;
  const car = cars[index];

  if (!car && !loading) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="p-2">
      <CarCard
        car={car}
        onClick={() => car && onCarClick?.(car)}
        loading={loading && !car}
      />
    </div>
  );
}

export function CarsGrid({
  cars,
  loading = false,
  onCarClick,
  className,
  itemsPerRow = {
    mobile: 1,
    tablet: 2,
    desktop: 4
  }
}: CarsGridProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 400 });

  // Determine items per row based on screen size
  const currentItemsPerRow = useMemo(() => {
    if (isMobile) return itemsPerRow.mobile;
    // For tablet/desktop, we'll detect based on container width
    const width = containerSize.width;
    if (width < 768) return itemsPerRow.mobile;
    if (width < 1024) return itemsPerRow.tablet;
    return itemsPerRow.desktop;
  }, [containerSize.width, isMobile, itemsPerRow]);

  // Calculate grid dimensions
  const totalItems = loading ? currentItemsPerRow * 6 : cars.length; // Show 6 rows of skeletons when loading
  const rowCount = Math.ceil(totalItems / currentItemsPerRow);
  const itemWidth = containerSize.width / currentItemsPerRow;
  const itemHeight = 320; // Fixed height for each item

  // Data for the grid
  const gridData = useMemo(() => ({
    cars: loading ? [] : cars,
    itemsPerRow: currentItemsPerRow,
    onCarClick,
    loading
  }), [cars, currentItemsPerRow, onCarClick, loading]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height: Math.max(height, 400) });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Observer for container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height: Math.max(height, 400) });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (cars.length === 0 && !loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No cars found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ height: Math.max(rowCount * itemHeight + 32, 400) }}
    >
      {containerSize.width > 0 && (
        <Grid
          columnCount={currentItemsPerRow}
          columnWidth={itemWidth}
          height={containerSize.height}
          rowCount={rowCount}
          rowHeight={itemHeight}
          width={containerSize.width}
          itemData={gridData}
          overscanRowCount={2}
        >
          {GridItem}
        </Grid>
      )}
    </div>
  );
}

/**
 * Alternative list view for mobile
 */
export function CarsListView({
  cars,
  loading = false,
  onCarClick,
  className
}: Omit<CarsGridProps, 'itemsPerRow'>) {
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <CarCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No cars found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {cars.map((car) => (
        <CarCard
          key={car.id}
          car={car}
          onClick={() => onCarClick?.(car)}
        />
      ))}
    </div>
  );
}