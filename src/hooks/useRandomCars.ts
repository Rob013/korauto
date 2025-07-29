import { useMemo } from 'react';

export const useRandomCars = (cars: any[], hasFilters: boolean) => {
  return useMemo(() => {
    if (hasFilters || cars.length === 0) {
      return cars; // Return normal order when filters are applied
    }
    
    // Fisher-Yates shuffle algorithm for random ordering
    const shuffled = [...cars];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }, [cars, hasFilters]);
};