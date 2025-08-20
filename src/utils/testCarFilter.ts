/**
 * Test Car Filter Utility
 * 
 * Removes test cars with specific patterns like "2023 gjenarta elite"
 */

interface CarLike {
  title?: string;
  manufacturer?: { name: string };
  model?: { name: string };
  year?: number;
  [key: string]: any;
}

/**
 * Checks if a car is a test car based on various patterns
 */
export const isTestCar = (car: CarLike): boolean => {
  const title = car.title?.toLowerCase() || '';
  const manufacturer = car.manufacturer?.name?.toLowerCase() || '';
  const model = car.model?.name?.toLowerCase() || '';
  
  // Common test car patterns
  const testPatterns = [
    'gjenarta',
    'elite',
    'test car',
    'sample',
    'demo',
    'placeholder'
  ];
  
  // Check if any test pattern exists in title, manufacturer, or model
  return testPatterns.some(pattern => 
    title.includes(pattern) || 
    manufacturer.includes(pattern) || 
    model.includes(pattern)
  );
};

/**
 * Filters out test cars from an array of cars
 */
export const filterOutTestCars = <T extends CarLike>(cars: T[]): T[] => {
  return cars.filter(car => !isTestCar(car));
};