#!/usr/bin/env tsx
/**
 * Complete API Sync Demonstration Script
 * 
 * This script demonstrates the new complete API sync functionality that ensures
 * all 150k+ cars are fetched and filters match exactly what's in the catalog.
 */

import { validateCompleteDataset, logValidationResults } from '../src/utils/carDatasetValidation.js';

// Mock API function that simulates fetching cars with pagination
const mockFetchAllCars = async (): Promise<any[]> => {
  console.log('🔄 Starting complete API sync simulation...');
  
  const totalCars = 150500; // Simulate 150k+ cars
  const perPage = 200;
  const totalPages = Math.ceil(totalCars / perPage);
  
  const allCars: any[] = [];
  
  for (let page = 1; page <= totalPages; page++) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const remainingCars = totalCars - allCars.length;
    const carsThisPage = Math.min(perPage, remainingCars);
    
    // Generate mock cars for this page
    const pageCars = Array.from({ length: carsThisPage }, (_, i) => {
      const carIndex = allCars.length + i;
      return {
        id: carIndex.toString(),
        manufacturer: { name: `Brand${carIndex % 50}`, id: carIndex % 50 },
        model: { name: `Model${carIndex % 100}`, id: carIndex % 100 },
        year: 2010 + (carIndex % 15),
        color: ['Black', 'White', 'Silver', 'Blue', 'Red'][carIndex % 5],
        fuel_type: ['Gasoline', 'Diesel', 'Hybrid', 'Electric'][carIndex % 4],
        transmission: ['Automatic', 'Manual', 'CVT'][carIndex % 3],
        body_type: ['Sedan', 'SUV', 'Hatchback', 'Coupe'][carIndex % 4],
      };
    });
    
    allCars.push(...pageCars);
    
    // Log progress every 100 pages
    if (page % 100 === 0 || page === totalPages) {
      console.log(`📄 Fetched page ${page}/${totalPages} (${allCars.length}/${totalCars} cars)`);
    }
  }
  
  console.log(`✅ Complete API sync finished: ${allCars.length} cars fetched`);
  return allCars;
};

// Function to calculate filter counts from complete dataset
const calculateFilterCounts = (allCars: any[]) => {
  console.log(`📊 Calculating filter counts from ${allCars.length} cars...`);
  
  const counts = {
    manufacturers: new Map<string, number>(),
    models: new Map<string, number>(),
    fuelTypes: new Map<string, number>(),
    transmissions: new Map<string, number>(),
    bodyTypes: new Map<string, number>(),
    years: new Map<string, number>(),
  };
  
  allCars.forEach(car => {
    // Count manufacturers
    if (car.manufacturer?.name) {
      const manufacturer = car.manufacturer.name;
      counts.manufacturers.set(manufacturer, (counts.manufacturers.get(manufacturer) || 0) + 1);
    }
    
    // Count models
    if (car.model?.name) {
      const model = car.model.name;
      counts.models.set(model, (counts.models.get(model) || 0) + 1);
    }
    
    // Count fuel types
    if (car.fuel_type) {
      const fuelType = car.fuel_type;
      counts.fuelTypes.set(fuelType, (counts.fuelTypes.get(fuelType) || 0) + 1);
    }
    
    // Count transmissions
    if (car.transmission) {
      const transmission = car.transmission;
      counts.transmissions.set(transmission, (counts.transmissions.get(transmission) || 0) + 1);
    }
    
    // Count body types
    if (car.body_type) {
      const bodyType = car.body_type;
      counts.bodyTypes.set(bodyType, (counts.bodyTypes.get(bodyType) || 0) + 1);
    }
    
    // Count years
    if (car.year) {
      const year = car.year.toString();
      counts.years.set(year, (counts.years.get(year) || 0) + 1);
    }
  });
  
  const result = {
    manufacturers: Object.fromEntries(counts.manufacturers),
    models: Object.fromEntries(counts.models),
    fuelTypes: Object.fromEntries(counts.fuelTypes),
    transmissions: Object.fromEntries(counts.transmissions),
    bodyTypes: Object.fromEntries(counts.bodyTypes),
    years: Object.fromEntries(counts.years),
  };
  
  console.log(`✅ Filter counts calculated:`, {
    manufacturers: Object.keys(result.manufacturers).length,
    models: Object.keys(result.models).length,
    fuelTypes: Object.keys(result.fuelTypes).length,
    transmissions: Object.keys(result.transmissions).length,
    bodyTypes: Object.keys(result.bodyTypes).length,
    years: Object.keys(result.years).length,
  });
  
  return result;
};

// Main demonstration function
const demonstrateCompleteSync = async () => {
  console.log('🚀 Complete API Sync Demonstration');
  console.log('=====================================');
  
  try {
    // Step 1: Fetch complete dataset
    const startTime = Date.now();
    const allCars = await mockFetchAllCars();
    const fetchTime = Date.now() - startTime;
    
    console.log(`⏱️ Fetch completed in ${fetchTime}ms`);
    
    // Step 2: Validate dataset
    const validation = await validateCompleteDataset(allCars, 150000);
    logValidationResults(validation);
    
    // Step 3: Calculate filter counts
    const filterCounts = calculateFilterCounts(allCars);
    
    // Step 4: Show sample filter data
    console.log('\n📋 Sample Filter Counts:');
    console.log('-------------------------');
    
    // Show top manufacturers
    const topManufacturers = Object.entries(filterCounts.manufacturers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    console.log('Top Manufacturers:');
    topManufacturers.forEach(([name, count]) => {
      console.log(`  ${name}: ${count.toLocaleString()} cars`);
    });
    
    // Show fuel type distribution  
    console.log('\nFuel Type Distribution:');
    Object.entries(filterCounts.fuelTypes).forEach(([type, count]) => {
      const percentage = ((count / allCars.length) * 100).toFixed(1);
      console.log(`  ${type}: ${count.toLocaleString()} cars (${percentage}%)`);
    });
    
    // Show transmission distribution
    console.log('\nTransmission Distribution:');
    Object.entries(filterCounts.transmissions).forEach(([type, count]) => {
      const percentage = ((count / allCars.length) * 100).toFixed(1);
      console.log(`  ${type}: ${count.toLocaleString()} cars (${percentage}%)`);
    });
    
    console.log('\n✅ Complete API Sync Demonstration Successful!');
    console.log('\n📊 Summary:');
    console.log(`   Total cars: ${allCars.length.toLocaleString()}`);
    console.log(`   Dataset complete: ${validation.isComplete ? '✅' : '❌'}`);
    console.log(`   Filter categories: ${Object.keys(filterCounts).length}`);
    console.log(`   Fetch time: ${fetchTime}ms`);
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  }
};

// Run the demonstration
demonstrateCompleteSync();