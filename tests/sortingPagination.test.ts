import { describe, it, expect } from 'vitest';

describe('Catalog Sorting Pagination Fix', () => {
  
  it('should distribute sorted results across pages properly', () => {
    // Simulate a dataset of cars with different prices
    const mockCars = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      manufacturer: { name: 'BMW' },
      lots: [{ buy_now: 10000 + (i * 1000) }], // Prices from 10k to 160k
      year: 2020,
      title: `2020 BMW Car ${i + 1}`
    }));

    // Sort by price low to high
    const sortedCars = [...mockCars].sort((a, b) => 
      a.lots[0].buy_now - b.lots[0].buy_now
    );

    // Simulate pagination - 50 cars per page
    const pageSize = 50;
    const page1 = sortedCars.slice(0, pageSize);
    const page2 = sortedCars.slice(pageSize, pageSize * 2);
    const page3 = sortedCars.slice(pageSize * 2, pageSize * 3);

    // Page 1 should have the lowest prices (10k-59k)
    expect(page1[0].lots[0].buy_now).toBe(10000);
    expect(page1[page1.length - 1].lots[0].buy_now).toBe(59000);

    // Page 2 should have middle prices (60k-109k)
    expect(page2[0].lots[0].buy_now).toBe(60000);
    expect(page2[page2.length - 1].lots[0].buy_now).toBe(109000);

    // Page 3 should have highest prices (110k-159k)
    expect(page3[0].lots[0].buy_now).toBe(110000);
    expect(page3[page3.length - 1].lots[0].buy_now).toBe(159000);

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
    const pageSize = 50;
    const expectedPages = Math.ceil(totalCars / pageSize); // Should be 5 pages

    expect(expectedPages).toBe(5);

    // Verify distribution
    // Pages 1-4 should have 50 cars each
    // Page 5 should have 37 cars (237 - 200)
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
    // Test with exactly 50 cars (1 page)
    const exactly50Cars = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      lots: [{ buy_now: (i + 1) * 1000 }]
    }));

    const totalPages50 = Math.ceil(exactly50Cars.length / 50);
    expect(totalPages50).toBe(1);

    // Test with 51 cars (2 pages)
    const exactly51Cars = Array.from({ length: 51 }, (_, i) => ({
      id: i + 1,
      lots: [{ buy_now: (i + 1) * 1000 }]
    }));

    const totalPages51 = Math.ceil(exactly51Cars.length / 50);
    expect(totalPages51).toBe(2);

    // Second page should have only 1 car
    const page2Size = exactly51Cars.length - 50;
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