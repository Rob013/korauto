/**
 * Car Dataset Validation Utilities
 * 
 * This module provides utilities to validate that the complete 150k+ car dataset
 * is properly synced and that filters match exactly what's available in the catalog.
 */

export interface DatasetValidationResult {
  isComplete: boolean;
  totalCars: number;
  expectedMinimum: number;
  coverage: number;
  missingDataPercent: number;
  filterConsistency: boolean;
  validationErrors: string[];
}

// Cache for validation results to avoid redundant work
const validationCache = new Map<string, { result: DatasetValidationResult; timestamp: number }>();
const VALIDATION_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Helper function for non-blocking chunked processing
const processInChunks = async <T>(
  array: T[],
  chunkSize: number,
  processor: (chunk: T[]) => any
): Promise<any[]> => {
  const results: any[] = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    const chunkResult = processor(chunk);
    results.push(chunkResult);
    
    // Yield control to prevent blocking the main thread
    if (i + chunkSize < array.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
};

/**
 * Validate that we have the complete dataset from the external API
 * Optimized with chunked processing to avoid blocking the main thread
 */
export const validateCompleteDataset = async (
  allCars: any[],
  expectedMinimum: number = 150000
): Promise<DatasetValidationResult> => {
  // Check cache first
  const cacheKey = `${allCars.length}-${expectedMinimum}`;
  const cached = validationCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < VALIDATION_CACHE_DURATION) {
    console.log(`📋 Using cached validation result for ${allCars.length} cars`);
    return cached.result;
  }

  const result: DatasetValidationResult = {
    isComplete: false,
    totalCars: allCars.length,
    expectedMinimum,
    coverage: 0,
    missingDataPercent: 0,
    filterConsistency: true,
    validationErrors: []
  };

  // Calculate coverage
  if (expectedMinimum > 0) {
    result.coverage = Math.round((allCars.length / expectedMinimum) * 100);
    result.missingDataPercent = Math.max(0, 100 - result.coverage);
  }

  // Check if we have the expected number of cars
  if (allCars.length < expectedMinimum) {
    result.validationErrors.push(
      `Dataset incomplete: got ${allCars.length} cars, expected at least ${expectedMinimum}`
    );
  } else {
    result.isComplete = true;
  }

  // Validate data quality using chunked processing for large datasets
  if (allCars.length > 1000) {
    console.log(`🔄 Starting chunked validation for ${allCars.length} cars...`);
    
    // Process in chunks of 5000 cars to avoid blocking
    const chunkSize = 5000;
    let carsWithoutManufacturer = 0;
    let carsWithoutModel = 0;
    let carsWithoutYear = 0;
    
    await processInChunks(allCars, chunkSize, (chunk) => {
      carsWithoutManufacturer += chunk.filter(car => !car.manufacturer?.name).length;
      carsWithoutModel += chunk.filter(car => !car.model?.name).length;
      carsWithoutYear += chunk.filter(car => !car.year).length;
    });
    
    // Add validation errors for missing data
    if (carsWithoutManufacturer > 0) {
      const percentMissing = Math.round((carsWithoutManufacturer / allCars.length) * 100);
      result.validationErrors.push(
        `${percentMissing}% of cars missing manufacturer data (${carsWithoutManufacturer} cars)`
      );
    }

    if (carsWithoutModel > 0) {
      const percentMissing = Math.round((carsWithoutModel / allCars.length) * 100);
      result.validationErrors.push(
        `${percentMissing}% of cars missing model data (${carsWithoutModel} cars)`
      );
    }

    if (carsWithoutYear > 0) {
      const percentMissing = Math.round((carsWithoutYear / allCars.length) * 100);
      result.validationErrors.push(
        `${percentMissing}% of cars missing year data (${carsWithoutYear} cars)`
      );
    }
    
    console.log(`✅ Chunked validation completed for ${allCars.length} cars`);
  } else {
    // For smaller datasets, use synchronous processing
    const carsWithoutManufacturer = allCars.filter(car => !car.manufacturer?.name);
    if (carsWithoutManufacturer.length > 0) {
      const percentMissing = Math.round((carsWithoutManufacturer.length / allCars.length) * 100);
      result.validationErrors.push(
        `${percentMissing}% of cars missing manufacturer data (${carsWithoutManufacturer.length} cars)`
      );
    }

    const carsWithoutModel = allCars.filter(car => !car.model?.name);
    if (carsWithoutModel.length > 0) {
      const percentMissing = Math.round((carsWithoutModel.length / allCars.length) * 100);
      result.validationErrors.push(
        `${percentMissing}% of cars missing model data (${carsWithoutModel.length} cars)`
      );
    }

    const carsWithoutYear = allCars.filter(car => !car.year);
    if (carsWithoutYear.length > 0) {
      const percentMissing = Math.round((carsWithoutYear.length / allCars.length) * 100);
      result.validationErrors.push(
        `${percentMissing}% of cars missing year data (${carsWithoutYear.length} cars)`
      );
    }
  }

  // Cache the result
  validationCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });

  return result;
};

/**
 * Validate that filter counts match the actual catalog data
 */
export const validateFilterConsistency = (
  allCars: any[],
  filterCounts: any
): boolean => {
  try {
    // Count manufacturers in actual data
    const actualManufacturers = new Map<string, number>();
    allCars.forEach(car => {
      if (car.manufacturer?.name) {
        const name = car.manufacturer.name;
        actualManufacturers.set(name, (actualManufacturers.get(name) || 0) + 1);
      }
    });

    // Check if filter counts match actual counts
    const actualManufacturerCounts = Object.fromEntries(actualManufacturers);
    const filterManufacturerCounts = filterCounts.manufacturers || {};

    const actualManufacturerNames = Object.keys(actualManufacturerCounts);
    const filterManufacturerNames = Object.keys(filterManufacturerCounts);

    // Check if we have the same manufacturers
    if (actualManufacturerNames.length !== filterManufacturerNames.length) {
      console.warn(`⚠️ Manufacturer count mismatch: actual=${actualManufacturerNames.length}, filter=${filterManufacturerNames.length}`);
      return false;
    }

    // Check if counts match for each manufacturer
    for (const manufacturer of actualManufacturerNames) {
      const actualCount = actualManufacturerCounts[manufacturer];
      const filterCount = filterManufacturerCounts[manufacturer];
      
      if (actualCount !== filterCount) {
        console.warn(`⚠️ Count mismatch for ${manufacturer}: actual=${actualCount}, filter=${filterCount}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating filter consistency:', error);
    return false;
  }
};

/**
 * Log detailed validation results
 */
export const logValidationResults = (result: DatasetValidationResult): void => {
  console.log(`📊 Dataset Validation Results:`);
  console.log(`   Total cars: ${result.totalCars.toLocaleString()}`);
  console.log(`   Expected minimum: ${result.expectedMinimum.toLocaleString()}`);
  console.log(`   Coverage: ${result.coverage}%`);
  console.log(`   Complete: ${result.isComplete ? '✅' : '❌'}`);
  console.log(`   Filter consistency: ${result.filterConsistency ? '✅' : '❌'}`);
  
  if (result.validationErrors.length > 0) {
    console.log(`   Validation errors:`);
    result.validationErrors.forEach(error => {
      console.log(`     ❌ ${error}`);
    });
  } else {
    console.log(`   ✅ No validation errors`);
  }
};

/**
 * Get a summary message for UI display
 */
export const getValidationSummary = (result: DatasetValidationResult): string => {
  if (result.isComplete && result.filterConsistency) {
    return `✅ Complete dataset: ${result.totalCars.toLocaleString()} cars (100% coverage)`;
  } else if (result.isComplete) {
    return `⚠️ Dataset complete but filter inconsistencies detected`;
  } else if (result.totalCars === 0) {
    return `🔄 Database empty: Using fallback data while sync initializes`;
  } else {
    return `❌ Incomplete dataset: ${result.totalCars.toLocaleString()} cars (${result.coverage}% coverage)`;
  }
};