import React, { memo, useCallback, useMemo } from 'react';
import LazyCarCard from '@/components/LazyCarCard';
import { shallowEqual } from '@/utils/performance-optimizer';

interface MemoizedCarCardProps {
  car: any;
  isHighlighted?: boolean;
  onClick?: (car: any) => void;
  convertUSDtoEUR?: (amount: number) => number;
  exchangeRate?: number;
}

const MemoizedCarCard = memo<MemoizedCarCardProps>(({
  car,
  isHighlighted = false,
  onClick,
  convertUSDtoEUR,
  exchangeRate
}) => {
  const handleClick = useCallback(() => {
    onClick?.(car);
  }, [onClick, car]);

  // Memoize car data to prevent unnecessary re-renders
  const processedCar = useMemo(() => ({
    ...car,
    // Pre-calculate converted price if converter is available
    convertedPrice: convertUSDtoEUR && car.price 
      ? convertUSDtoEUR(car.price)
      : car.price
  }), [car, convertUSDtoEUR]);

  return (
    <div 
      className={`cursor-pointer transition-transform hover:scale-105 ${
        isHighlighted ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleClick}
    >
      <LazyCarCard
        id={processedCar.id}
        make={processedCar.make}
        model={processedCar.model}
        year={processedCar.year}
        price={processedCar.convertedPrice || processedCar.price}
        image={processedCar.image}
        images={processedCar.images}
        vin={processedCar.vin}
        mileage={processedCar.mileage}
        transmission={processedCar.transmission}
        fuel={processedCar.fuel}
        color={processedCar.color}
        condition={processedCar.condition}
        lot={processedCar.lot}
        title={processedCar.title}
        status={processedCar.status}
        sale_status={processedCar.sale_status}
        final_price={processedCar.final_price}
        insurance_v2={processedCar.insurance_v2}
        details={processedCar.details}
        is_archived={processedCar.is_archived}
        archived_at={processedCar.archived_at}
        archive_reason={processedCar.archive_reason}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.car.id === nextProps.car.id &&
    prevProps.car.updated_at === nextProps.car.updated_at &&
    prevProps.exchangeRate === nextProps.exchangeRate &&
    shallowEqual(prevProps.car, nextProps.car)
  );
});

MemoizedCarCard.displayName = 'MemoizedCarCard';

export default MemoizedCarCard;