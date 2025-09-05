import React, { useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingLogo from "@/components/LoadingLogo";
import { OptimizedCarImage } from "@/components/OptimizedCarImage";
import { useNavigate } from 'react-router-dom';

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
  total: number;
  totalPages: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error?: Error | null;
  filters: any;
  prefetchNextPage: () => void;
  highlightCarId?: string | null;
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
        <OptimizedCarImage
          images={car.images}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full rounded-lg"
        />
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

const CarsList: React.FC<CarsListProps> = ({
  cars,
  total,
  totalPages,
  hasMore,
  isLoading,
  isFetching,
  error,
  filters,
  prefetchNextPage,
  highlightCarId,
  className = '',
}) => {
  const navigate = useNavigate();

  // Handle car click navigation
  const handleCarClick = useCallback((car: Car) => {
    navigate(`/car/${car.id}`);
  }, [navigate]);

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
    <div className={`w-full ${className}`}>
      {/* Simple Grid Container - No Virtual Scrolling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-4">
        {cars.map((car) => (
          <CarCard 
            key={car.id} 
            car={car} 
            onClick={() => handleCarClick(car)} 
          />
        ))}
        
        {/* Loading More Skeletons */}
        {isFetching && Array.from({ length: 8 }).map((_, index) => (
          <CarCardSkeleton key={`loading-${index}`} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && !isLoading && cars.length > 0 && (
        <div className="flex justify-center py-8">
          <Button
            onClick={prefetchNextPage}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <LoadingLogo className="h-4 w-4" />
                Loading...
              </>
            ) : (
              <>
                Load More Cars
                <div className="text-xs text-muted-foreground ml-2">
                  ({cars.length} of {total})
                </div>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Initial Loading Skeletons */}
      {isLoading && cars.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-4">
          {Array.from({ length: 20 }).map((_, index) => (
            <CarCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* End of Results */}
      {!hasMore && cars.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>You've reached the end</p>
          <p className="text-sm mt-1">{cars.length} cars shown</p>
        </div>
      )}
    </div>
  );
};

export default CarsList;