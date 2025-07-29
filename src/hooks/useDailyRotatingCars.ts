import { useMemo } from 'react';

export const useDailyRotatingCars = (cars: any[], hasFilters: boolean, limit: number = 50) => {
  return useMemo(() => {
    if (hasFilters || cars.length === 0) {
      return cars; // Return normal order when filters are applied
    }
    
    // Get current timestamp + random factor for rotation on refresh
    const now = Date.now();
    const randomFactor = Math.floor(Math.random() * 1000);
    const seed = now + randomFactor;
    
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
    const shuffledCars = shuffleWithSeed(filteredCars, seed);
    return shuffledCars.slice(0, Math.min(filteredCars.length, limit));
    
  }, [cars, hasFilters, limit]);
};