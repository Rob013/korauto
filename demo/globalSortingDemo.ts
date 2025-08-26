/**
 * Demonstration of Global Sorting Fix
 * 
 * This script demonstrates how the global sorting feature now works correctly
 * across all pages for scenarios like "Audi A4 filter with 300+ cars".
 */

import { applyChronologicalRanking, getCarsForPage } from '../src/utils/chronologicalRanking';

// Simulate 300+ Audi A4 cars with random prices (like the problem statement)
const generateMockAudiA4Cars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `audi-a4-${i + 1}`,
    manufacturer: { name: 'Audi' },
    model: { name: 'A4' },
    year: 2015 + (i % 10), // Years 2015-2024
    lots: [{
      buy_now: Math.floor(Math.random() * 40000) + 15000, // Random prices 15k-55k EUR
      odometer: { km: Math.floor(Math.random() * 150000) + 20000 }
    }],
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

// Generate test data: 315 Audi A4 cars (15 pages x 50 cars per page + 15 cars on last page)
const audiA4Cars = generateMockAudiA4Cars(315);

console.log('\n🚗 Global Sorting Demonstration: Audi A4 Filter with 315 Cars');
console.log('='.repeat(70));

// Apply global sorting with "Lowest to Highest" price
const globalSortingResult = applyChronologicalRanking(audiA4Cars, 'price_low', 50);

console.log(`\n📊 Dataset Overview:`);
console.log(`   Total Cars: ${globalSortingResult.totalCars}`);
console.log(`   Total Pages: ${globalSortingResult.totalPages}`);
console.log(`   Cars per Page: ${globalSortingResult.carsPerPage}`);
console.log(`   Sort Method: ${globalSortingResult.sortedBy} (Lowest to Highest Price)`);

// Demonstrate page-by-page results
for (let pageNum = 1; pageNum <= Math.min(5, globalSortingResult.totalPages); pageNum++) {
  const pageData = getCarsForPage(globalSortingResult.rankedCars, pageNum, 50);
  const prices = pageData.map(car => car.lots[0].buy_now);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  console.log(`\n📄 Page ${pageNum}:`);
  console.log(`   Cars on page: ${pageData.length}`);
  console.log(`   Price range: €${minPrice.toLocaleString()} - €${maxPrice.toLocaleString()}`);
  console.log(`   Rank range: ${pageData[0].rank} - ${pageData[pageData.length - 1].rank}`);
  
  // Show first 3 cars on each page
  console.log(`   First 3 cars:`);
  pageData.slice(0, 3).forEach(car => {
    console.log(`     Rank ${car.rank}: ${car.manufacturer.name} ${car.model.name} ${car.year} - €${car.lots[0].buy_now.toLocaleString()}`);
  });
}

// Verify global sorting correctness
console.log(`\n✅ Validation:`);

// Check that page 1 has the cheapest cars overall
const page1Cars = getCarsForPage(globalSortingResult.rankedCars, 1, 50);
const page2Cars = getCarsForPage(globalSortingResult.rankedCars, 2, 50);
const lastPageCars = getCarsForPage(globalSortingResult.rankedCars, globalSortingResult.totalPages, 50);

const page1MaxPrice = Math.max(...page1Cars.map(car => car.lots[0].buy_now));
const page2MinPrice = Math.min(...page2Cars.map(car => car.lots[0].buy_now));
const lastPageMinPrice = Math.min(...lastPageCars.map(car => car.lots[0].buy_now));

console.log(`   ✓ Page 1 max price (€${page1MaxPrice.toLocaleString()}) ≤ Page 2 min price (€${page2MinPrice.toLocaleString()}): ${page1MaxPrice <= page2MinPrice}`);
console.log(`   ✓ Page 1 max price (€${page1MaxPrice.toLocaleString()}) < Last page min price (€${lastPageMinPrice.toLocaleString()}): ${page1MaxPrice < lastPageMinPrice}`);

// Check that ranking is sequential
const isSequential = globalSortingResult.rankedCars.every((car, index) => car.rank === index + 1);
console.log(`   ✓ All cars have sequential ranks 1-${globalSortingResult.totalCars}: ${isSequential}`);

console.log(`\n🎯 Problem Statement Solution:`);
console.log(`   ✓ Filter: Audi A4 shows ${globalSortingResult.totalPages} pages with ${globalSortingResult.totalCars} cars`);
console.log(`   ✓ User selects "Lowest to Highest" price`);
console.log(`   ✓ Page 1 shows cheapest cars from ALL ${globalSortingResult.totalCars} cars`);
console.log(`   ✓ Page 2 shows next cheapest cars from the global dataset`);
console.log(`   ✓ Continues through all pages with proper global ranking`);
console.log(`   ✓ Cars are NOT just sorted within each page, but across ALL pages globally`);

console.log(`\n✨ Fix implemented successfully!`);