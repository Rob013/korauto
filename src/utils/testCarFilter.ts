/**
 * Test car filtering utility
 * Filters out cars that appear to be test data or have unrealistic characteristics
 * 
 * UPDATED: Made filtering more surgical to avoid removing legitimate cars.
 * - Removed overly broad patterns like 'elite', 'altima', 'lot', 'code'
 * - Removed requirement for images (many legitimate cars may load images later)
 * - Expanded price range to 100-1M EUR for Korean market
 * - Relaxed missing data requirements
 * - Made test patterns more specific (e.g. 'test car' vs 'test')
 */

export const isTestCar = (car: any): boolean => {
  if (!car) return true;
  
  // Check for test car indicators in title - be more specific
  const title = car.title?.toLowerCase() || '';
  const testPatterns = [
    'gjenarta',
    'test car',    // More specific - must have "test car" not just "test"
    'test vehicle',
    'sample car',
    'demo vehicle',
    'placeholder',
    'emergency-vehicle',
    'nis2005', // Specific code pattern that was identified as test data
    // Removed 'elite', 'altima', 'code ', 'lot ' as these filter legitimate cars
  ];
  
  if (testPatterns.some(pattern => title.includes(pattern))) {
    return true;
  }
  
  // Check manufacturer and model names for test patterns - be more specific
  const make = car.manufacturer?.name?.toLowerCase() || '';
  const model = car.model?.name?.toLowerCase() || '';
  
  // Filter out suspicious makes/models - be more specific
  if (make.includes('test vehicle') || model.includes('test vehicle') || 
      make.includes('demo vehicle') || model.includes('demo vehicle') ||
      make.includes('sample vehicle') || model.includes('sample vehicle')) {
    return true;
  }
  
  // REMOVED: Filtering cars without images - many legitimate cars may not have images loaded yet
  // const lot = car.lots?.[0];
  // const hasImages = lot?.images?.normal?.length > 0 || lot?.images?.big?.length > 0;
  // if (!hasImages) {
  //   return true; // Remove cars without images
  // }
  
  // Check for extremely unrealistic pricing (broadened range for Korean market)
  const lot = car.lots?.[0];
  const price = lot?.buy_now || 0;
  if (price > 0 && (price < 100 || price > 1000000)) { // Expanded range: 100-1M EUR
    return true;
  }
  
  // RELAXED: Check for missing essential data - allow cars with some missing data
  // Only filter if completely empty of identifying information
  if (!car.manufacturer?.name && !car.model?.name && !car.year && !car.title) {
    return true;
  }
  
  // Check for suspicious VIN patterns - be more specific
  const vin = car.vin?.toLowerCase() || '';
  if (vin.includes('test') || vin.includes('demo') || 
      (vin.length > 0 && vin.length < 8)) { // VINs should be at least 8 chars if present
    return true;
  }
  
  // Check for lot numbers that seem like test data - be more specific
  const lotNumber = car.lot_number?.toLowerCase() || '';
  if (lotNumber.includes('test') || lotNumber.includes('demo') || 
      lotNumber.includes('emergency') || lotNumber.includes('sample')) {
    return true;
  }
  
  return false;
};

export const filterOutTestCars = (cars: any[]): any[] => {
  const filtered = cars.filter(car => !isTestCar(car));
  const filteredCount = cars.length - filtered.length;
  
  if (filteredCount > 0) {
    console.log(`🧹 Filtered out ${filteredCount} test/invalid cars, ${filtered.length} remaining`);
    
    // Log examples of what was filtered for debugging (max 3 examples)
    const filteredCars = cars.filter(car => isTestCar(car)).slice(0, 3);
    filteredCars.forEach(car => {
      console.log(`🗑️ Filtered car example: ${car.title || 'No title'} (${car.manufacturer?.name || 'No make'} ${car.model?.name || 'No model'})`);
    });
  } else {
    console.log(`✅ No test cars filtered out of ${cars.length} cars`);
  }
  
  return filtered;
};