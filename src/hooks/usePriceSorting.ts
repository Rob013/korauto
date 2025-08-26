import { useState, useCallback } from 'react';
import { SortOption } from '@/hooks/useSortedCars';

interface Car {
  id: string;
  lots?: Array<{ buy_now?: number }>;
  [key: string]: any;
}

export const usePriceSorting = () => {
  const [isSorting, setIsSorting] = useState(false);

  const sortCarsByPrice = useCallback((cars: Car[], sortBy: SortOption): Car[] => {
    if (sortBy !== 'price_low' && sortBy !== 'price_high') {
      return cars; // Return original order for non-price sorts
    }

    console.log(`🔄 Sorting ${cars.length} cars globally by ${sortBy}`);
    
    const sortedCars = [...cars].sort((a, b) => {
      const priceA = a.lots?.[0]?.buy_now || 0;
      const priceB = b.lots?.[0]?.buy_now || 0;
      
      if (sortBy === 'price_low') {
        return priceA - priceB; // Cheapest first
      } else {
        return priceB - priceA; // Most expensive first  
      }
    });

    console.log(`✅ Global price sorting complete: ${sortedCars.length} cars ranked`);
    console.log(`Cheapest: €${((sortedCars[0]?.lots?.[0]?.buy_now || 0) + 2200).toLocaleString()}`);
    console.log(`Most expensive: €${((sortedCars[sortedCars.length - 1]?.lots?.[0]?.buy_now || 0) + 2200).toLocaleString()}`);
    
    return sortedCars;
  }, []);

  const sortCarsGlobally = useCallback(async (
    cars: Car[], 
    sortBy: SortOption,
    onUpdate: (sortedCars: Car[]) => void
  ) => {
    setIsSorting(true);
    
    try {
      // Simulate async operation for large datasets
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const sorted = sortCarsByPrice(cars, sortBy);
      onUpdate(sorted);
    } finally {
      setIsSorting(false);
    }
  }, [sortCarsByPrice]);

  return {
    sortCarsGlobally,
    isSorting
  };
};