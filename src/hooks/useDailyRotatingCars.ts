import { useMemo } from "react";
import { filterOutTestCars } from "@/utils/testCarFilter";

export const useDailyRotatingCars = (
  cars: any[],
  hasFilters: boolean,
  limit: number = 50
) => {
  return useMemo(() => {
    if (hasFilters || cars.length === 0) {
      return filterOutTestCars(cars); // Always filter test cars
    }

    // Get day of month as seed for daily rotation (1-31, changes daily but same each day)
    const today = new Date();
    const dayOfMonth = today.getDate(); // This gives us 1-31
    const month = today.getMonth() + 1; // Add month to make it more unique
    const dailySeed = dayOfMonth * 100 + month; // Combine day and month for better variation

    // Filter out test cars first, then apply additional filters
    const cleanedCars = filterOutTestCars(cars);
    
    // Include all cars (no brand filtering) but must have manufacturer and images
    const availableCars = cleanedCars.filter(
      (car) =>
        car.manufacturer?.name && // Must have a manufacturer
        car.lots?.[0]?.images?.normal?.[0] && // Must have at least one normal image
        car.lots?.[0]?.buy_now > 5000 && // Must have reasonable price
        car.lots?.[0]?.buy_now < 200000 // Not too expensive
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

    // Shuffle and limit the cars to requested amount
    const shuffledCars = shuffleWithSeed(availableCars, dailySeed);
    const finalCars = shuffledCars.slice(0, Math.min(availableCars.length, limit));
    
    console.log(`🎲 Daily rotation: ${finalCars.length} cars selected from ${availableCars.length} valid cars`);
    return finalCars;
  }, [cars, hasFilters, limit]);
};
