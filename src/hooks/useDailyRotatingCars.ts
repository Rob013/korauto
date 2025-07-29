import { useMemo } from 'react';

export const useDailyRotatingCars = (cars: any[], hasFilters: boolean, limit: number = 50) => {
  return useMemo(() => {
    if (hasFilters || cars.length === 0) {
      return cars; // Return normal order when filters are applied
    }
    
    // Get today's date as seed for consistent daily rotation
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Separate German cars from others
    const germanBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'];
    const germanCars = cars.filter(car => 
      germanBrands.includes(car.manufacturer?.name)
    );
    const otherCars = cars.filter(car => 
      !germanBrands.includes(car.manufacturer?.name)
    );
    
    // Seeded random function that produces same results for same seed
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Shuffle function with seed
    const shuffleWithSeed = (array: any[], seed: number) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // Shuffle both arrays with today's seed
    const shuffledGermanCars = shuffleWithSeed(germanCars, seed);
    const shuffledOtherCars = shuffleWithSeed(otherCars, seed + 1000);
    
    // Combine: Show 70% German cars, 30% other cars
    const totalCarsToShow = Math.min(cars.length, limit); // Show up to limit cars
    const germanCarsToShow = Math.ceil(totalCarsToShow * 0.7);
    const otherCarsToShow = totalCarsToShow - germanCarsToShow;
    
    const selectedGermanCars = shuffledGermanCars.slice(0, germanCarsToShow);
    const selectedOtherCars = shuffledOtherCars.slice(0, otherCarsToShow);
    
    // Merge and shuffle the final selection with seed
    const finalSelection = [...selectedGermanCars, ...selectedOtherCars];
    return shuffleWithSeed(finalSelection, seed + 2000);
    
  }, [cars, hasFilters, limit]);
};