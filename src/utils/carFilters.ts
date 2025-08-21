// Utility function to filter out test/emergency cars
// This addresses the "18 test cars" issue when selecting brands

export interface Car {
  id?: string;
  external_id?: string;
  title?: string;
  image_url?: string;
  vin?: string;
  [key: string]: any;
}

/**
 * Filter out test, emergency, and mock cars from a car array
 * This ensures only real cars are shown when filtering by brand
 */
export const filterTestCars = (cars: Car[]): Car[] => {
  return cars.filter((car) => {
    // Remove cars with emergency or test IDs
    if (car.id && (
      car.id.startsWith('emergency-') || 
      car.id.startsWith('test-') || 
      car.id.startsWith('sample-') ||
      car.id.startsWith('mock-') ||
      car.id.startsWith('demo-')
    )) {
      return false;
    }

    // Remove cars with test data indicators in external_id
    if (car.external_id && (
      car.external_id.startsWith('emergency-') || 
      car.external_id.startsWith('test-') || 
      car.external_id.startsWith('sample-') ||
      car.external_id.startsWith('mock-') ||
      car.external_id.startsWith('demo-')
    )) {
      return false;
    }

    // Remove mock cars that have generic image URLs (likely test data)
    if (car.image_url && car.image_url.includes('unsplash.com') && 
        (!car.vin || car.vin.length < 10)) {
      return false;
    }

    // Additional check: remove cars with obviously fake/test titles
    if (car.title && (
      car.title.toLowerCase().includes('test') ||
      car.title.toLowerCase().includes('sample') ||
      car.title.toLowerCase().includes('mock') ||
      car.title.toLowerCase().includes('demo')
    )) {
      return false;
    }

    // Ensure we only show real cars for brand filtering
    return true;
  });
};

/**
 * Check if a single car is a test/mock car
 */
export const isTestCar = (car: Car): boolean => {
  return !filterTestCars([car]).length;
};