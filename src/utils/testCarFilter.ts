/**
 * Test car filtering utility
 * Filters out cars that appear to be test data or have unrealistic characteristics
 */

export const isTestCar = (car: any): boolean => {
  if (!car) return true;
  
  // Check for test car indicators in title
  const title = car.title?.toLowerCase() || '';
  const testPatterns = [
    'gjenarta',      // Specific test manufacturer mentioned in requirements
    'test',
    'sample',
    'demo',
    'placeholder',
    'emergency-',
    'nis2005',       // Specific code pattern
  ];
  
  if (testPatterns.some(pattern => title.includes(pattern))) {
    return true;
  }
  
  // Check manufacturer and model names for test patterns
  const make = car.manufacturer?.name?.toLowerCase() || '';
  const model = car.model?.name?.toLowerCase() || '';
  
  // Filter out suspicious makes/models - specifically target test manufacturers
  const testManufacturers = ['gjenarta', 'test', 'demo', 'sample', 'placeholder'];
  if (testManufacturers.includes(make) || testManufacturers.includes(model)) {
    return true;
  }
  
  // Check for missing essential data
  if (!car.manufacturer?.name || !car.model?.name || !car.year) {
    return true;
  }
  
  // Check for lot numbers that seem like test data
  const lotNumber = car.lot_number?.toLowerCase() || '';
  if (lotNumber.includes('test') || lotNumber.includes('demo') || 
      lotNumber.includes('emergency') || lotNumber.startsWith('nis')) {
    return true;
  }
  
  return false;
};

export const filterOutTestCars = (cars: any[]): any[] => {
  const filtered = cars.filter(car => !isTestCar(car));
  console.log(`🧹 Filtered out ${cars.length - filtered.length} test/invalid cars, ${filtered.length} remaining`);
  return filtered;
};