import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import LazyCarCard from '@/components/LazyCarCard';
import { logger, useIntersectionObserver } from '@/utils/performance-optimizer';

interface VirtualizedCarGridProps {
  cars: any[];
  highlightCarId?: string | null;
  isLoading?: boolean;
  onCarClick?: (car: any) => void;
  className?: string;
}

const CarGridItem = memo(({ car, isHighlighted, onClick }: { 
  car: any; 
  isHighlighted: boolean; 
  onClick: (car: any) => void; 
}) => {
  const handleClick = useCallback(() => {
    onClick(car);
  }, [car, onClick]);

  return (
    <div
      className={`cursor-pointer transition-transform hover:scale-105 ${
        isHighlighted ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleClick}
    >
      <LazyCarCard
        id={car.id}
        make={car.make}
        model={car.model}
        year={car.year}
        price={car.price}
        image={car.image}
        images={car.images}
        vin={car.vin}
        mileage={car.mileage}
        transmission={car.transmission}
        fuel={car.fuel}
        color={car.color}
        condition={car.condition}
        lot={car.lot}
        title={car.title}
        status={car.status}
        sale_status={car.sale_status}
        final_price={car.final_price}
        insurance_v2={car.insurance_v2}
        details={car.details}
        is_archived={car.is_archived}
        archived_at={car.archived_at}
        archive_reason={car.archive_reason}
      />
    </div>
  );
});

CarGridItem.displayName = 'CarGridItem';

const VirtualizedCarGrid = memo<VirtualizedCarGridProps>(({
  cars,
  highlightCarId,
  isLoading = false,
  onCarClick,
  className = ''
}) => {
  const isMobile = useIsMobile();
  const [visibleCount, setVisibleCount] = useState(isMobile ? 10 : 15);
  
  // Intersection observer for progressive loading
  const loadMoreRef = useIntersectionObserver(
    (entry) => {
      if (entry.isIntersecting && visibleCount < cars.length) {
        setVisibleCount(prev => Math.min(prev + (isMobile ? 5 : 9), cars.length));
      }
    },
    { threshold: 0.1 }
  ) as React.RefObject<HTMLDivElement>;

  const handleCarClick = useCallback((car: any) => {
    logger.log('🚗 Car clicked in optimized grid:', car.id);
    onCarClick?.(car);
  }, [onCarClick]);

  // Memoize visible cars to prevent unnecessary recalculations
  const visibleCars = useMemo(() => 
    cars.slice(0, visibleCount), 
    [cars, visibleCount]
  );

  // Reset visible count when cars change
  useEffect(() => {
    setVisibleCount(isMobile ? 10 : 15);
  }, [cars, isMobile]);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="h-96 bg-muted/50 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">No cars found</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCars.map((car) => (
          <CarGridItem
            key={car.id}
            car={car}
            isHighlighted={highlightCarId === car.id}
            onClick={handleCarClick}
          />
        ))}
      </div>
      
      {/* Load more trigger */}
      {visibleCount < cars.length && (
        <div 
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          <div className="w-8 h-8 bg-muted/50 animate-pulse rounded" />
        </div>
      )}
    </div>
  );
});

VirtualizedCarGrid.displayName = 'VirtualizedCarGrid';

export default VirtualizedCarGrid;