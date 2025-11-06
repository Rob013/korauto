/**
 * Test car filtering utility
 * Filters out cars that appear to be test data or have unrealistic characteristics
 */

export const isTestCar = (car: any): boolean => {
  if (!car) return true;
  
  // Check for test car indicators in title
  const title = String(car.title || '').toLowerCase();
  const testPatterns = [
    'gjenarta',
    'elite',
    'test',
    'sample',
    'demo',
    'placeholder',
    'emergency-',
    'nis2005', // Specific code pattern
    'altima', // Remove all Altimas as they seem to be test data
    'code ',   // Any car with "code" in title
    'lot ',    // Any car with "lot" in title pattern
  ];
  
  if (testPatterns.some(pattern => title.includes(pattern))) {
    return true;
  }
  
  // Check manufacturer and model names for test patterns
  const make = String(car.manufacturer?.name || '').toLowerCase();
  const model = String(car.model?.name || '').toLowerCase();
  
  // Filter out suspicious makes/models
  if (make.includes('test') || model.includes('test') || 
      make.includes('demo') || model.includes('demo') ||
      make.includes('sample') || model.includes('sample')) {
    return true;
  }
  
  // Check for cars without proper images
  const lot = car.lots?.[0];
  const hasImages = lot?.images?.normal?.length > 0 || lot?.images?.big?.length > 0;
  if (!hasImages) {
    return true; // Remove cars without images
  }
  
  // Check for unrealistic pricing (too high or too low)
  const price = lot?.buy_now || 0;
  if (price < 1000 || price > 500000) {
    return true;
  }
  
  // Check for missing essential data
  if (!car.manufacturer?.name || !car.model?.name || !car.year) {
    return true;
  }
  
  // Check for suspicious VIN patterns
  const vin = String(car.vin || '').toLowerCase();
  if (vin.includes('test') || vin.includes('demo') || vin.length < 10) {
    return true;
  }
  
  // Check for lot numbers that seem like test data
  const lotNumber = String(car.lot_number || '').toLowerCase();
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