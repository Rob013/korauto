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

/**
 * Validate that we have the complete dataset from the external API
 */
export const validateCompleteDataset = async (
  allCars: any[],
  expectedMinimum: number = 150000
): Promise<DatasetValidationResult> => {
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

  // Validate data quality
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
  } else {
    return `❌ Incomplete dataset: ${result.totalCars.toLocaleString()} cars (${result.coverage}% coverage)`;
  }
};