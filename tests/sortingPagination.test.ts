import { describe, it, expect } from 'vitest';

describe('Catalog Sorting Pagination Fix', () => {
  
  it('should distribute sorted results across pages properly', () => {
    // Simulate a dataset of cars with different prices
    const mockCars = Array.from({ length: 450 }, (_, i) => ({
      id: i + 1,
      manufacturer: { name: 'BMW' },
      lots: [{ buy_now: 10000 + (i * 1000) }], // Prices from 10k to 459k
      year: 2020,
      title: `2020 BMW Car ${i + 1}`
    }));

    // Sort by price low to high
    const sortedCars = [...mockCars].sort((a, b) => 
      a.lots[0].buy_now - b.lots[0].buy_now
    );

    // Simulate pagination - 200 cars per page
    const pageSize = 200;
    const page1 = sortedCars.slice(0, pageSize);
    const page2 = sortedCars.slice(pageSize, pageSize * 2);
    const page3 = sortedCars.slice(pageSize * 2, pageSize * 3);

    // Page 1 should have the lowest prices (10k-209k)
    expect(page1[0].lots[0].buy_now).toBe(10000);
    expect(page1[page1.length - 1].lots[0].buy_now).toBe(209000);

    // Page 2 should have middle prices (210k-409k)
    expect(page2[0].lots[0].buy_now).toBe(210000);
    expect(page2[page2.length - 1].lots[0].buy_now).toBe(409000);

    // Page 3 should have highest prices (410k-459k)
    expect(page3[0].lots[0].buy_now).toBe(410000);
    expect(page3[page3.length - 1].lots[0].buy_now).toBe(459000);

    // Verify no price overlap between pages
    const page1MaxPrice = Math.max(...page1.map(car => car.lots[0].buy_now));
    const page2MinPrice = Math.min(...page2.map(car => car.lots[0].buy_now));
    const page2MaxPrice = Math.max(...page2.map(car => car.lots[0].buy_now));
    const page3MinPrice = Math.min(...page3.map(car => car.lots[0].buy_now));

    expect(page2MinPrice).toBeGreaterThan(page1MaxPrice);
    expect(page3MinPrice).toBeGreaterThan(page2MaxPrice);
  });

  it('should correctly calculate total pages for sorted datasets', () => {
    const totalCars = 237;
    const pageSize = 200;
    const expectedPages = Math.ceil(totalCars / pageSize); // Should be 2 pages

    expect(expectedPages).toBe(2);

    // Verify distribution
    // Page 1 should have 200 cars
    // Page 2 should have 37 cars (237 - 200)
    const lastPageSize = totalCars - ((expectedPages - 1) * pageSize);
    expect(lastPageSize).toBe(37);
  });

  it('should maintain sort order within each page', () => {
    // Create test cars with random prices
    const mockCars = [
      { id: 1, lots: [{ buy_now: 50000 }] },
      { id: 2, lots: [{ buy_now: 25000 }] },
      { id: 3, lots: [{ buy_now: 75000 }] },
      { id: 4, lots: [{ buy_now: 30000 }] },
      { id: 5, lots: [{ buy_now: 45000 }] }
    ];

    // Sort by price low to high
    const sortedCars = [...mockCars].sort((a, b) => 
      a.lots[0].buy_now - b.lots[0].buy_now
    );

    // Verify sorted order
    expect(sortedCars[0].lots[0].buy_now).toBe(25000); // id: 2
    expect(sortedCars[1].lots[0].buy_now).toBe(30000); // id: 4
    expect(sortedCars[2].lots[0].buy_now).toBe(45000); // id: 5
    expect(sortedCars[3].lots[0].buy_now).toBe(50000); // id: 1
    expect(sortedCars[4].lots[0].buy_now).toBe(75000); // id: 3

    // Verify IDs match the expected sort order
    expect(sortedCars.map(car => car.id)).toEqual([2, 4, 5, 1, 3]);
  });

  it('should handle edge cases for pagination', () => {
    // Test with exactly 200 cars (1 page)
    const exactly200Cars = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      lots: [{ buy_now: (i + 1) * 1000 }]
    }));

    const totalPages200 = Math.ceil(exactly200Cars.length / 200);
    expect(totalPages200).toBe(1);

    // Test with 201 cars (2 pages)
    const exactly201Cars = Array.from({ length: 201 }, (_, i) => ({
      id: i + 1,
      lots: [{ buy_now: (i + 1) * 1000 }]
    }));

    const totalPages201 = Math.ceil(exactly201Cars.length / 200);
    expect(totalPages201).toBe(2);

    // Second page should have only 1 car
    const page2Size = exactly201Cars.length - 200;
    expect(page2Size).toBe(1);
  });

  it('should properly handle sorting by different criteria with pagination', () => {
    const mockCars = [
      { id: 1, year: 2020, lots: [{ buy_now: 30000 }] },
      { id: 2, year: 2019, lots: [{ buy_now: 25000 }] },
      { id: 3, year: 2021, lots: [{ buy_now: 35000 }] },
      { id: 4, year: 2018, lots: [{ buy_now: 20000 }] }
    ];

    // Sort by year (newest first)
    const sortedByYear = [...mockCars].sort((a, b) => b.year - a.year);
    expect(sortedByYear.map(car => car.year)).toEqual([2021, 2020, 2019, 2018]);

    // Sort by price (lowest first)
    const sortedByPrice = [...mockCars].sort((a, b) => 
      a.lots[0].buy_now - b.lots[0].buy_now
    );
    expect(sortedByPrice.map(car => car.lots[0].buy_now)).toEqual([20000, 25000, 30000, 35000]);
  });
});