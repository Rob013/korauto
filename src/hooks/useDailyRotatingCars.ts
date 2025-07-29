import { useMemo } from 'react';

export const useDailyRotatingCars = (cars: any[], hasFilters: boolean, limit: number = 50) => {
  return useMemo(() => {
    if (hasFilters || cars.length === 0) {
      return cars; // Return normal order when filters are applied
    }
    
    // Get today's date as seed for daily rotation (changes every 24 hours)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const dailySeed = dayOfYear + today.getFullYear(); // Unique seed per day
    
    // Only show Audi, Volkswagen, Mercedes-Benz, and BMW cars
    const targetBrands = ['Audi', 'Volkswagen', 'Mercedes-Benz', 'BMW'];
    const filteredCars = cars.filter(car => 
      targetBrands.includes(car.manufacturer?.name)
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
    
    // Shuffle and limit the filtered cars
    const shuffledCars = shuffleWithSeed(filteredCars, dailySeed);
    return shuffledCars.slice(0, Math.min(filteredCars.length, limit));
    
  }, [cars, hasFilters, limit]);
};