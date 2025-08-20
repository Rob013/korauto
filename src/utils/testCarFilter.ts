/**
 * Test car filtering utilities
 * Removes test cars and cars with fake/test data from the catalog
 */

interface CarWithLots {
  id: string;
  title?: string;
  manufacturer?: { name: string };
  model?: { name: string };
  lots?: Array<{
    buy_now?: number;
    final_price?: number;
    bid?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

// Test car patterns to filter out
const TEST_CAR_PATTERNS = [
  /gjenarta/i,
  /elite.*test/i,
  /test.*car/i,
  /demo.*vehicle/i,
  /sample.*car/i,
  /placeholder/i,
  /^test\s/i,
  /\stest$/i,
  /fake.*car/i,
  /dummy.*vehicle/i,
];

// Test manufacturer patterns
const TEST_MANUFACTURER_PATTERNS = [
  /test/i,
  /demo/i,
  /fake/i,
  /sample/i,
  /placeholder/i,
];

/**
 * Checks if a car appears to be a test car based on various criteria
 */
export const isTestCar = (car: CarWithLots): boolean => {
  // Check title for test patterns
  if (car.title) {
    const hasTestPattern = TEST_CAR_PATTERNS.some(pattern => pattern.test(car.title!));
    if (hasTestPattern) return true;
  }

  // Check manufacturer name for test patterns
  if (car.manufacturer?.name) {
    const hasTestManufacturer = TEST_MANUFACTURER_PATTERNS.some(pattern => 
      pattern.test(car.manufacturer!.name)
    );
    if (hasTestManufacturer) return true;
  }

  // Check model name for test patterns
  if (car.model?.name) {
    const hasTestModel = TEST_MANUFACTURER_PATTERNS.some(pattern => 
      pattern.test(car.model!.name)
    );
    if (hasTestModel) return true;
  }

  // Check for unrealistic pricing (likely test data)
  if (car.lots && car.lots.length > 0) {
    const lot = car.lots[0];
    const price = lot.buy_now || lot.final_price || lot.bid || 0;
    
    // Filter out cars with suspiciously low or high prices (likely test data)
    if (price > 0 && (price < 1000 || price > 500000)) {
      return true;
    }
  }

  return false;
};

/**
 * Filters out test cars from an array of cars
 */
export const filterOutTestCars = <T extends CarWithLots>(cars: T[]): T[] => {
  return cars.filter(car => !isTestCar(car));
};

/**
 * Filters out test cars and returns only real cars with valid pricing
 */
export const getValidCarsOnly = <T extends CarWithLots>(cars: T[]): T[] => {
  return cars.filter(car => {
    // Filter out test cars
    if (isTestCar(car)) return false;
    
    // Ensure car has valid lots with pricing
    if (!car.lots || car.lots.length === 0) return false;
    
    const lot = car.lots[0];
    const price = lot.buy_now || lot.final_price || lot.bid;
    
    // Must have valid pricing
    return price && price > 1000 && price < 500000;
  });
};