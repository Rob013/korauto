/**
 * Problem Statement Integration Test
 * Tests the exact scenario described in the problem statement:
 * "When sorting is applied rank all cars filtered for example 1000 cars based on sorting 
 * for example cheapest on first page to the most expensive on last page check well 
 * all filtered cars shown and unshown on filter selected or all brand"
 */

import { describe, it, expect } from 'vitest';
import { applyChronologicalRanking, getCarsForPage, validateChronologicalRanking } from '@/utils/chronologicalRanking';
import { GlobalSortingService } from '@/services/globalSortingService';

// Mock API filters interface
const mockFilters = {
  manufacturer_id: 'audi',
  model_id: 'a4',
  grade_iaai: 'all'
};

describe('Problem Statement Integration - 1000 Cars Global Sorting', () => {
  it('should rank all 1000 filtered cars globally - cheapest to most expensive across all pages', () => {
    console.log('\n🎯 Problem Statement Test: 1000 cars with global sorting');
    console.log('=' .repeat(70));

    // Generate exactly 1000 cars as mentioned in problem statement
    const thousandCars = Array.from({ length: 1000 }, (_, i) => ({
      id: `filtered-car-${i + 1}`,
      manufacturer: { name: 'Audi' },
      model: { name: 'A4' },
      year: 2015 + (i % 10),
      lots: [{
        buy_now: Math.floor(Math.random() * 50000) + 15000, // €15k - €65k
        odometer: { km: Math.floor(Math.random() * 150000) + 20000 }
      }],
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));

    console.log(`📊 Dataset: ${thousandCars.length} filtered cars (all Audi A4)`);

    // Apply global sorting - cheapest first (as mentioned in problem)
    const globalRankingResult = applyChronologicalRanking(thousandCars, 'price_low', 50);

    // Validate basic structure
    expect(globalRankingResult.totalCars).toBe(1000);
    expect(globalRankingResult.totalPages).toBe(20); // 1000 ÷ 50 = 20 pages
    expect(globalRankingResult.carsPerPage).toBe(50);

    console.log(`📄 Pages: ${globalRankingResult.totalPages} pages with ${globalRankingResult.carsPerPage} cars each`);

    // Test that ALL cars are ranked globally (problem statement requirement)
    const allRanksSequential = globalRankingResult.rankedCars.every((car, index) => car.rank === index + 1);
    expect(allRanksSequential).toBe(true);

    console.log('✅ All 1000 cars have sequential global ranks (1, 2, 3, ..., 1000)');

    // Test cheapest on first page to most expensive on last page (problem statement requirement)
    const firstPageCars = getCarsForPage(globalRankingResult.rankedCars, 1, 50);
    const lastPageCars = getCarsForPage(globalRankingResult.rankedCars, 20, 50);

    const firstPagePrices = firstPageCars.map(car => car.lots[0].buy_now);
    const lastPagePrices = lastPageCars.map(car => car.lots[0].buy_now);

    const cheapestOverall = Math.min(...firstPagePrices);
    const mostExpensiveOverall = Math.max(...lastPagePrices);
    const firstPageMostExpensive = Math.max(...firstPagePrices);
    const lastPageCheapest = Math.min(...lastPagePrices);

    // Cheapest car should be on first page
    expect(firstPagePrices).toContain(cheapestOverall);
    
    // Most expensive car should be on last page
    expect(lastPagePrices).toContain(mostExpensiveOverall);
    
    // First page's most expensive should be <= last page's cheapest
    expect(firstPageMostExpensive).toBeLessThanOrEqual(lastPageCheapest);

    console.log(`💰 Price range: €${cheapestOverall.toLocaleString()} (page 1) → €${mostExpensiveOverall.toLocaleString()} (page 20)`);
    console.log(`✅ Cheapest on first page, most expensive on last page - correct global ordering`);

    // Test shown vs unshown cars (problem statement mentions checking "shown and unshown")
    const middlePageCars = getCarsForPage(globalRankingResult.rankedCars, 10, 50); // Page 10 = "unshown" initially
    const middlePagePrices = middlePageCars.map(car => car.lots[0].buy_now);
    const middlePageCheapest = Math.min(...middlePagePrices);
    const middlePageMostExpensive = Math.max(...middlePagePrices);

    // Middle page prices should be between first and last page
    expect(firstPageMostExpensive).toBeLessThanOrEqual(middlePageCheapest);
    expect(middlePageMostExpensive).toBeLessThanOrEqual(lastPageCheapest);

    console.log(`📄 Page 10 (unshown): €${middlePageCheapest.toLocaleString()} - €${middlePageMostExpensive.toLocaleString()}`);
    console.log('✅ Unshown cars (middle pages) properly ranked between shown cars');

    // Validate chronological ranking is correct
    const isValidRanking = validateChronologicalRanking(globalRankingResult.rankedCars, 'price_low');
    expect(isValidRanking).toBe(true);

    console.log('✅ Chronological ranking validation passed');

    // Test every page boundary to ensure global consistency
    for (let pageNum = 1; pageNum < globalRankingResult.totalPages; pageNum++) {
      const currentPage = getCarsForPage(globalRankingResult.rankedCars, pageNum, 50);
      const nextPage = getCarsForPage(globalRankingResult.rankedCars, pageNum + 1, 50);

      const currentPageMaxPrice = Math.max(...currentPage.map(car => car.lots[0].buy_now));
      const nextPageMinPrice = Math.min(...nextPage.map(car => car.lots[0].buy_now));

      expect(currentPageMaxPrice).toBeLessThanOrEqual(nextPageMinPrice);
    }

    console.log('✅ All page boundaries maintain correct price ordering');
    console.log('\n🎉 Problem Statement Solution Verified:');
    console.log('   ✓ 1000 cars ranked globally across all pages');
    console.log('   ✓ Cheapest cars on first page');
    console.log('   ✓ Most expensive cars on last page'); 
    console.log('   ✓ All filtered cars (shown and unshown) properly ranked');
    console.log('   ✓ Sequential ranking from 1 to 1000');
    console.log('   ✓ Global sorting applied correctly');
  });

  it('should work with "all brand" filter (problem statement requirement)', () => {
    console.log('\n🌐 Testing "all brand" filter scenario');
    console.log('=' .repeat(50));

    // Generate cars from multiple brands (simulating "all brand" filter)
    const allBrandCars = Array.from({ length: 500 }, (_, i) => ({
      id: `all-brand-car-${i + 1}`,
      manufacturer: { name: ['Audi', 'BMW', 'Mercedes', 'Toyota', 'Honda'][i % 5] },
      model: { name: ['A4', 'X3', 'C-Class', 'Camry', 'Civic'][i % 5] },
      year: 2018 + (i % 7),
      lots: [{
        buy_now: Math.floor(Math.random() * 60000) + 15000,
        odometer: { km: Math.floor(Math.random() * 120000) + 30000 }
      }],
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));

    console.log(`📊 Dataset: ${allBrandCars.length} cars from all brands`);

    // Check if this should use global sorting
    const globalSortingService = new GlobalSortingService();
    const shouldUseGlobal = globalSortingService.shouldUseGlobalSorting(allBrandCars.length);
    expect(shouldUseGlobal).toBe(true);

    // Apply global sorting
    const allBrandResult = applyChronologicalRanking(allBrandCars, 'price_low', 50);

    // Validate mixed brands are properly sorted
    expect(allBrandResult.totalCars).toBe(500);
    expect(allBrandResult.totalPages).toBe(10);

    // Check that ranking ignores brand and focuses on price
    const firstPageCars = getCarsForPage(allBrandResult.rankedCars, 1, 50);
    const lastPageCars = getCarsForPage(allBrandResult.rankedCars, 10, 50);

    const firstPageMaxPrice = Math.max(...firstPageCars.map(car => car.lots[0].buy_now));
    const lastPageMinPrice = Math.min(...lastPageCars.map(car => car.lots[0].buy_now));

    expect(firstPageMaxPrice).toBeLessThan(lastPageMinPrice);

    // Verify brands are mixed on first page (not clustered by brand)
    const firstPageBrands = new Set(firstPageCars.map(car => car.manufacturer.name));
    expect(firstPageBrands.size).toBeGreaterThan(1); // Should have multiple brands

    console.log(`✅ First page has ${firstPageBrands.size} different brands: ${Array.from(firstPageBrands).join(', ')}`);
    console.log(`💰 Price progression: €${Math.min(...firstPageCars.map(car => car.lots[0].buy_now)).toLocaleString()} → €${Math.max(...lastPageCars.map(car => car.lots[0].buy_now)).toLocaleString()}`);
    console.log('✅ "All brand" filter works correctly with global sorting');
  });

  it('should handle real-world filter combinations', () => {
    console.log('\n🔍 Testing real-world filter combinations');
    console.log('=' .repeat(50));

    // Simulate realistic filter combinations
    const scenarios = [
      {
        name: 'Luxury Cars (BMW + Mercedes + Audi)',
        cars: Array.from({ length: 200 }, (_, i) => ({
          id: `luxury-${i + 1}`,
          manufacturer: { name: ['BMW', 'Mercedes', 'Audi'][i % 3] },
          model: { name: ['X5', 'E-Class', 'A6'][i % 3] },
          year: 2019 + (i % 6),
          lots: [{ buy_now: Math.floor(Math.random() * 40000) + 35000 }], // €35k-75k
          created_at: new Date().toISOString()
        }))
      },
      {
        name: 'Economy Cars (Toyota + Honda)',
        cars: Array.from({ length: 150 }, (_, i) => ({
          id: `economy-${i + 1}`,
          manufacturer: { name: ['Toyota', 'Honda'][i % 2] },
          model: { name: ['Corolla', 'Civic'][i % 2] },
          year: 2017 + (i % 8),
          lots: [{ buy_now: Math.floor(Math.random() * 20000) + 12000 }], // €12k-32k
          created_at: new Date().toISOString()
        }))
      }
    ];

    scenarios.forEach(scenario => {
      console.log(`\n📱 Scenario: ${scenario.name} (${scenario.cars.length} cars)`);

      if (scenario.cars.length > 30) {
        const result = applyChronologicalRanking(scenario.cars, 'price_low', 50);
        
        // Validate proper global ranking
        const isValid = validateChronologicalRanking(result.rankedCars, 'price_low');
        expect(isValid).toBe(true);

        const firstPage = getCarsForPage(result.rankedCars, 1, 50);
        const prices = firstPage.map(car => car.lots[0].buy_now);
        
        console.log(`   ✅ ${result.totalCars} cars across ${result.totalPages} pages`);
        console.log(`   💰 First page: €${Math.min(...prices).toLocaleString()} - €${Math.max(...prices).toLocaleString()}`);
      }
    });

    console.log('\n✅ All real-world filter combinations work correctly');
  });
});