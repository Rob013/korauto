import { useEffect } from 'react';
import { useSortedCars, SortOption } from '@/hooks/useSortedCars';

interface SimplePriceSortingProps {
  cars: any[];
  sortBy: SortOption;
  totalCount: number;
  onSortedCarsUpdate: (sortedCars: any[]) => void;
}

export const SimplePriceSorting = ({ 
  cars, 
  sortBy, 
  totalCount, 
  onSortedCarsUpdate 
}: SimplePriceSortingProps) => {
  
  const sortedCars = useSortedCars(cars, sortBy);
  
  useEffect(() => {
    // When we have price sorting and a large dataset, apply global sorting
    if ((sortBy === 'price_low' || sortBy === 'price_high') && totalCount > 50) {
      console.log(`🔄 Global price sorting: ${sortedCars.length} cars sorted by ${sortBy}`);
      onSortedCarsUpdate(sortedCars);
    }
  }, [sortedCars, sortBy, totalCount, onSortedCarsUpdate]);

  return null; // This is a logic-only component
};