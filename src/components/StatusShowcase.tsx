import React from 'react';
import LazyCarCard from '@/components/LazyCarCard';
import { mockCarsWithStatus } from '@/data/mockCarsWithStatus';
import { shouldHideSoldCar } from '@/utils/carStatus';

interface StatusShowcaseProps {
  className?: string;
}

export const StatusShowcase: React.FC<StatusShowcaseProps> = ({ className = '' }) => {
  // Filter out cars that should be hidden due to 24-hour rule
  const visibleCars = mockCarsWithStatus.filter(car => !shouldHideSoldCar(car));

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Car Status System Demo</h2>
        <p className="text-muted-foreground">
          This showcase demonstrates the enhanced car status system with proper color coding:
        </p>
        <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
          <li><span className="font-semibold text-red-600">SOLD</span> - Red background, cars sold</li>
          <li><span className="font-semibold text-orange-600">RESERVED</span> - Orange background, cars reserved by customers</li>
          <li><span className="font-semibold text-yellow-600">PENDING</span> - Yellow background, cars with pending sales</li>
          <li><span className="font-semibold text-green-600">AVAILABLE</span> - No badge shown, available for purchase</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleCars.map((car) => (
          <LazyCarCard
            key={car.id}
            id={car.id}
            make={car.make}
            model={car.model}
            year={car.year}
            price={car.price}
            image={car.image}
            images={car.images}
            mileage={car.mileage}
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
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">24-Hour Cleanup System</h3>
        <p className="text-sm text-muted-foreground">
          Cars that have been sold for more than 24 hours are automatically hidden from the catalog. 
          In this demo, one car (Ford Focus) was sold 26 hours ago and is hidden from display.
          Total cars in data: {mockCarsWithStatus.length}, Visible cars: {visibleCars.length}
        </p>
      </div>
    </div>
  );
};

export default StatusShowcase;