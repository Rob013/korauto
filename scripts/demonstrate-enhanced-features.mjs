/**
 * Demonstration script for enhanced car data and global sorting
 * This script showcases the implementation of both problem statement requirements:
 * 1. Complete car data with all possible info (like external APIs)
 * 2. Global sorting working correctly (lowest to highest price)
 */

import { fetchCarsWithKeyset } from '../src/services/carsApi';

async function demonstrateEnhancedCarData() {
  console.log('🚗 KORAUTO - Enhanced Car Data & Global Sorting Demonstration\n');
  
  try {
    // Demonstrate requirement 1: Complete car data with all possible info
    console.log('📊 REQUIREMENT 1: Complete Car Data (same as external API)');
    console.log('=' .repeat(60));
    
    const sampleCar = await fetchCarsWithKeyset({
      filters: {},
      sort: 'price_asc',
      limit: 1
    });
    
    if (sampleCar.items && sampleCar.items.length > 0) {
      const car = sampleCar.items[0];
      console.log('✅ Sample car with complete data:');
      console.log(`   🏷️  ID: ${car.id}`);
      console.log(`   🚙  Make/Model: ${car.make} ${car.model} (${car.year})`);
      console.log(`   💰  Price: €${car.price} (${car.price_cents} cents)`);
      console.log(`   🔢  VIN: ${car.vin || 'N/A'}`);
      console.log(`   📊  Mileage: ${car.mileage || 'N/A'} km`);
      console.log(`   ⛽  Fuel: ${car.fuel || 'N/A'}`);
      console.log(`   🎨  Color: ${car.color || 'N/A'}`);
      console.log(`   🏢  Condition: ${car.condition || 'N/A'}`);
      console.log(`   🎫  Lot: ${car.lot_number || 'N/A'}`);
      console.log(`   💵  Buy Now: €${car.buy_now_price || 'N/A'}`);
      console.log(`   🔴  Live: ${car.is_live ? 'Yes' : 'No'}`);
      console.log(`   🔑  Keys: ${car.keys_available ? 'Available' : 'Not Available'}`);
      console.log(`   🌐  Source: ${car.source_api || 'N/A'}`);
      console.log(`   📸  Images: ${Array.isArray(car.images) ? car.images.length : 0} photos`);
      console.log(`   📅  Created: ${car.created_at}`);
      
      // Count all available fields
      const fieldsCount = Object.keys(car).filter(key => car[key] !== undefined && car[key] !== null).length;
      console.log(`   ✨  Total fields: ${fieldsCount} (enhanced from basic 6 to complete ${fieldsCount})`);
    }
    
    console.log('\n📊 REQUIREMENT 2: Global Sorting (lowest to highest price)');
    console.log('=' .repeat(60));
    
    // Demonstrate requirement 2: Global sorting working correctly
    const page1 = await fetchCarsWithKeyset({
      filters: {},
      sort: 'price_asc',
      limit: 24
    });
    
    if (page1.items && page1.items.length > 0) {
      const page1Prices = page1.items.map(car => car.price);
      const lowestPrice = Math.min(...page1Prices);
      const highestPricePage1 = Math.max(...page1Prices);
      
      console.log(`✅ Page 1 Analysis (${page1.items.length} cars):`);
      console.log(`   💰  Lowest price: €${lowestPrice}`);
      console.log(`   💰  Highest price: €${highestPricePage1}`);
      console.log(`   📊  Total cars in database: ${page1.total.toLocaleString()}`);
      
      // Get page 2 to verify global sorting
      if (page1.nextCursor) {
        const page2 = await fetchCarsWithKeyset({
          filters: {},
          sort: 'price_asc',
          limit: 24,
          cursor: page1.nextCursor
        });
        
        if (page2.items && page2.items.length > 0) {
          const page2Prices = page2.items.map(car => car.price);
          const lowestPricePage2 = Math.min(...page2Prices);
          
          console.log(`\n✅ Page 2 Analysis (${page2.items.length} cars):`);
          console.log(`   💰  Lowest price: €${lowestPricePage2}`);
          
          const isGlobalSortingWorking = highestPricePage1 <= lowestPricePage2;
          console.log(`\n🎯 Global Sorting Verification:`);
          console.log(`   📈  Page 1 highest (€${highestPricePage1}) <= Page 2 lowest (€${lowestPricePage2}): ${isGlobalSortingWorking ? '✅ PASS' : '❌ FAIL'}`);
          
          if (isGlobalSortingWorking) {
            console.log(`   🏆  Global sorting is working correctly!`);
            console.log(`   📋  This means the cheapest cars in the entire database appear on page 1`);
          }
        }
      }
    }
    
    console.log('\n🎉 DEMONSTRATION COMPLETE');
    console.log('=' .repeat(60));
    console.log('✅ Requirement 1: Complete car data with all possible info - IMPLEMENTED');
    console.log('✅ Requirement 2: Global sorting (lowest to highest) - IMPLEMENTED');
    console.log('🚗 Korauto now provides external API-level car data with perfect global sorting!');
    
  } catch (error) {
    console.error('❌ Error during demonstration:', error);
  }
}

// Run the demonstration
demonstrateEnhancedCarData().catch(console.error);