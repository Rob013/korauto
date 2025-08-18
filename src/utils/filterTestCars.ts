/**
 * Test car filtering utilities
 * Removes test cars and cars without valid data
 */

export interface CarLike {
  id?: string | number;
  title?: string;
  make?: string;
  model?: string;
  price?: number;
  year?: number;
  vin?: string;
  lot_number?: string;
  [key: string]: any;
}

/**
 * Check if a car is a test car that should be filtered out
 */
export const isTestCar = (car: CarLike): boolean => {
  if (!car) return true;
  
  // Check common test indicators
  const testIndicators = [
    'test',
    'demo',
    'sample',
    'example',
    'dummy',
    'fake',
    'mock'
  ];
  
  const fieldsToCheck = [
    car.title?.toLowerCase(),
    car.make?.toLowerCase(),
    car.model?.toLowerCase(),
    car.vin?.toLowerCase(),
    car.lot_number?.toLowerCase()
  ].filter(Boolean);
  
  return fieldsToCheck.some(field => 
    testIndicators.some(indicator => 
      field?.includes(indicator)
    )
  );
};

/**
 * Check if a car has valid pricing data
 */
export const hasValidPricing = (car: CarLike): boolean => {
  return !!(car.price && car.price > 0);
};

/**
 * Check if a car has minimum required data
 */
export const hasRequiredData = (car: CarLike): boolean => {
  return !!(
    car.id &&
    (car.title || (car.make && car.model)) &&
    car.year &&
    car.year > 1990 &&
    car.year <= new Date().getFullYear() + 2
  );
};

/**
 * Filter out test cars and invalid data from car array
 */
export const filterRealCars = <T extends CarLike>(cars: T[]): T[] => {
  if (!Array.isArray(cars)) return [];
  
  return cars.filter(car => {
    // Remove test cars
    if (isTestCar(car)) return false;
    
    // Ensure valid pricing
    if (!hasValidPricing(car)) return false;
    
    // Ensure required data
    if (!hasRequiredData(car)) return false;
    
    return true;
  });
};

/**
 * Get random real cars from a filtered list
 */
export const getRandomRealCars = <T extends CarLike>(cars: T[], count: number = 20): T[] => {
  const realCars = filterRealCars(cars);
  
  if (realCars.length <= count) {
    return realCars;
  }
  
  // Shuffle and return random selection
  const shuffled = [...realCars].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export default {
  isTestCar,
  hasValidPricing,
  hasRequiredData,
  filterRealCars,
  getRandomRealCars
};