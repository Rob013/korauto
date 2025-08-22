/**
 * Test car filtering utility
 * Filters out cars that appear to be test data or have unrealistic characteristics
 */

export const isTestCar = (car: any): boolean => {
  if (!car) return true;
  
  // Check for test car indicators in title
  const title = car.title?.toLowerCase() || '';
  const testPatterns = [
    'gjenarta',
    'elite',
    'test',
    'sample',
    'demo',
    'placeholder',
    'emergency-'
  ];
  
  if (testPatterns.some(pattern => title.includes(pattern))) {
    return true;
  }
  
  // Check for unrealistic pricing (too high or too low)
  const lot = car.lots?.[0];
  const price = lot?.buy_now || 0;
  if (price < 1000 || price > 500000) {
    return true;
  }
  
  // Check for missing essential data
  if (!car.manufacturer?.name || !car.model?.name || !car.year) {
    return true;
  }
  
  return false;
};

export const filterOutTestCars = (cars: any[]): any[] => {
  return cars.filter(car => !isTestCar(car));
};