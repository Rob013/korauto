import { useState, useEffect } from 'react';
import { useAuctionAPI } from './useAuctionAPI';

export const useDailyCarRotation = () => {
  const { cars, loading, error, fetchCars } = useAuctionAPI();
  const [dailyCars, setDailyCars] = useState<any[]>([]);
  const [isRotationLoading, setIsRotationLoading] = useState(false);

  // Get today's date as a number for pagination calculation
  const getTodayIndex = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return dayOfYear;
  };

  // Fetch daily cars with rotation logic
  const fetchDailyCars = async () => {
    setIsRotationLoading(true);
    try {
      const dayIndex = getTodayIndex();
      
      // Calculate which "page" of cars to fetch based on the day
      // Rotate through different sets every day
      const carsPerDay = 50;
      const pageSize = 100; // Fetch more to have variety
      const rotationCycle = 7; // 7 different sets before repeating
      const currentRotation = dayIndex % rotationCycle;
      const pageToFetch = currentRotation + 1;
      
      console.log(`🔄 Daily car rotation: Day ${dayIndex}, Rotation ${currentRotation}, Fetching page ${pageToFetch}`);
      
      // Fetch cars with different parameters each day
      const rotationFilters = {
        // Rotate through different criteria each day
        ...(currentRotation === 0 && {}), // All cars
        ...(currentRotation === 1 && { from_year: '2018' }), // Newer cars
        ...(currentRotation === 2 && { from_year: '2015' }), // 2015 and newer cars  
        ...(currentRotation === 3 && { buy_now_price_to: '30000' }), // Lower price range
        ...(currentRotation === 4 && { buy_now_price_from: '25000' }), // Higher price range
        ...(currentRotation === 5 && { fuel_type: '1' }), // Diesel only
        ...(currentRotation === 6 && { transmission: '1' }), // Automatic only
      };
      
      await fetchCars(pageToFetch, rotationFilters, true);
      
    } catch (error) {
      console.error('Failed to fetch daily cars:', error);
    } finally {
      setIsRotationLoading(false);
    }
  };

  // Process cars with German priority and daily selection
  useEffect(() => {
    if (cars && cars.length > 0) {
      const germanBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'];
      const dayIndex = getTodayIndex();
      
      // Separate German and other cars
      const germanCars = cars.filter(car => 
        germanBrands.includes(car.manufacturer?.name)
      );
      const otherCars = cars.filter(car => 
        !germanBrands.includes(car.manufacturer?.name)
      );
      
      // Seed-based selection for consistent daily results
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      
      const shuffleWithSeed = (array: any[], seed: number) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(seed + i) * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };
      
      // Select cars with daily seed
      const dailySeed = dayIndex;
      const shuffledGermanCars = shuffleWithSeed(germanCars, dailySeed);
      const shuffledOtherCars = shuffleWithSeed(otherCars, dailySeed + 1000);
      
      // Aim for 35 German cars and 15 others (70/30 split)
      const germanCarsToShow = Math.min(35, shuffledGermanCars.length);
      const otherCarsToShow = Math.min(15, shuffledOtherCars.length);
      
      const selectedGermanCars = shuffledGermanCars.slice(0, germanCarsToShow);
      const selectedOtherCars = shuffledOtherCars.slice(0, otherCarsToShow);
      
      // Combine and shuffle final selection
      const finalSelection = [...selectedGermanCars, ...selectedOtherCars];
      const dailySelection = shuffleWithSeed(finalSelection, dailySeed + 2000);
      
      // Limit to 50 cars max
      setDailyCars(dailySelection.slice(0, 50));
      
      console.log(`📅 Daily cars updated: ${dailySelection.length} cars (${selectedGermanCars.length} German, ${selectedOtherCars.length} others)`);
    }
  }, [cars]);

  // Check if we need to fetch new cars (once per day)
  useEffect(() => {
    const lastFetchDate = localStorage.getItem('daily_cars_fetch_date');
    const today = new Date().toDateString();
    
    if (lastFetchDate !== today) {
      console.log('🆕 Fetching new daily cars for', today);
      fetchDailyCars();
      localStorage.setItem('daily_cars_fetch_date', today);
    } else if (dailyCars.length === 0 && cars.length > 0) {
      // Process existing cars if we haven't fetched new ones today
      setDailyCars(cars.slice(0, 50));
    }
  }, []);

  // Set up midnight refresh
  useEffect(() => {
    const checkForMidnight = () => {
      const now = new Date();
      const lastFetchDate = localStorage.getItem('daily_cars_fetch_date');
      const today = now.toDateString();
      
      if (lastFetchDate !== today) {
        console.log('🌙 Midnight refresh: Fetching new daily cars');
        fetchDailyCars();
        localStorage.setItem('daily_cars_fetch_date', today);
      }
    };

    // Check every minute for midnight
    const interval = setInterval(checkForMidnight, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    dailyCars,
    loading: loading || isRotationLoading,
    error,
    refreshDailyCars: fetchDailyCars
  };
};