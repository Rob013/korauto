/**
 * Test car filtering utility
 * Filters out cars that appear to be test data or have unrealistic characteristics
 * Updated to be more lenient with database cars while still filtering obvious test data
 */

export const isTestCar = (car: any, isFromDatabase: boolean = false): boolean => {
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
    'emergency-',
    'nis2005', // Specific code pattern
    'code ',   // Any car with "code" in title
    'lot ',    // Any car with "lot" in title pattern
  ];
  
  // Only filter out Altimas if they have obvious test indicators
  const hasTestInTitle = testPatterns.some(pattern => title.includes(pattern));
  const hasAltima = title.includes('altima');
  
  // More specific Altima filtering - only filter if combined with test patterns
  if (hasAltima && (title.includes('test') || title.includes('demo') || title.includes('sample'))) {
    return true;
  }
  
  if (hasTestInTitle && !hasAltima) {
    return true;
  }
  
  // Check manufacturer and model names for test patterns
  const make = car.manufacturer?.name?.toLowerCase() || '';
  const model = car.model?.name?.toLowerCase() || '';
  
  // Filter out suspicious makes/models
  if (make.includes('test') || model.includes('test') || 
      make.includes('demo') || model.includes('demo') ||
      make.includes('sample') || model.includes('sample')) {
    return true;
  }
  
  // For database cars, be more lenient with images since they might not be populated yet
  if (!isFromDatabase) {
    // Check for cars without proper images (only for external API cars)
    const lot = car.lots?.[0];
    const hasImages = lot?.images?.normal?.length > 0 || lot?.images?.big?.length > 0;
    if (!hasImages) {
      return true; // Remove external API cars without images
    }
  }
  
  // Check for unrealistic pricing (too high or too low)
  const lot = car.lots?.[0];
  const price = lot?.buy_now || car.price || 0;
  if (price < 500 || price > 1000000) { // More reasonable range
    return true;
  }
  
  // Check for missing essential data
  if (!car.manufacturer?.name || !car.model?.name || !car.year) {
    return true;
  }
  
  // For database cars, be more lenient with VIN validation
  if (!isFromDatabase) {
    // Check for suspicious VIN patterns (only for external API cars)
    const vin = car.vin?.toLowerCase() || '';
    if (vin.includes('test') || vin.includes('demo') || vin.length < 10) {
      return true;
    }
  } else {
    // For database cars, only filter if VIN explicitly contains test patterns
    const vin = car.vin?.toLowerCase() || '';
    if (vin.includes('test') || vin.includes('demo')) {
      return true;
    }
  }
  
  // Check for lot numbers that seem like test data
  const lotNumber = car.lot_number?.toLowerCase() || '';
  if (lotNumber.includes('test') || lotNumber.includes('demo') || 
      lotNumber.includes('emergency') || lotNumber.startsWith('nis')) {
    return true;
  }
  
  return false;
};

export const filterOutTestCars = (cars: any[], isFromDatabase?: boolean): any[] => {
  // Auto-detect if cars are from database if not explicitly specified
  if (isFromDatabase === undefined) {
    // Check if any car has the isFromDatabase flag
    isFromDatabase = cars.some(car => car.isFromDatabase === true);
  }
  
  const filtered = cars.filter(car => !isTestCar(car, isFromDatabase));
  console.log(`🧹 Filtered out ${cars.length - filtered.length} test/invalid cars, ${filtered.length} remaining (database mode: ${isFromDatabase})`);
  return filtered;
};