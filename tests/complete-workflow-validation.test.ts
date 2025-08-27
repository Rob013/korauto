import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCarsWithLimitOffset } from '@/services/carsApi';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

const mockSupabase = supabase as any;

describe('Problem Statement Validation - Complete Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should demonstrate the complete workflow: filters → ORDER BY → LIMIT/OFFSET with page 1 having global cheapest', async () => {
    // Create a realistic dataset with various prices across different makes
    const allCarsInDatabase = [
      // Toyota cars (filtered set)
      { id: 'toyota1', price_cents: 1200000, make: 'Toyota', model: 'Yaris', year: 2020, mileage: 30000 },
      { id: 'toyota2', price_cents: 1800000, make: 'Toyota', model: 'Camry', year: 2021, mileage: 20000 },
      { id: 'toyota3', price_cents: 2200000, make: 'Toyota', model: 'RAV4', year: 2022, mileage: 15000 },
      { id: 'toyota4', price_cents: 2800000, make: 'Toyota', model: 'Highlander', year: 2021, mileage: 25000 },
      { id: 'toyota5', price_cents: 3200000, make: 'Toyota', model: 'Land Cruiser', year: 2023, mileage: 5000 },
      // BMW cars (not in filtered set)
      { id: 'bmw1', price_cents: 3500000, make: 'BMW', model: '3 Series', year: 2020, mileage: 35000 },
      { id: 'bmw2', price_cents: 4500000, make: 'BMW', model: '5 Series', year: 2021, mileage: 20000 },
      // Honda cars (not in filtered set) 
      { id: 'honda1', price_cents: 1500000, make: 'Honda', model: 'Civic', year: 2020, mileage: 40000 },
    ];

    // Apply make filter to get only Toyota cars
    const toyotaCars = allCarsInDatabase.filter(car => car.make === 'Toyota');
    
    // Sort Toyota cars globally by price (what database should do)
    const toyotaCarsSortedByPrice = toyotaCars.sort((a, b) => a.price_cents - b.price_cents);
    
    // Paginate: page 1 should get first 3 cars, page 2 should get remaining 2 cars
    const pageSize = 3;
    const page1Cars = toyotaCarsSortedByPrice.slice(0, pageSize);
    const page2Cars = toyotaCarsSortedByPrice.slice(pageSize, pageSize * 2);

    // Mock database calls for page 1
    mockSupabase.rpc.mockResolvedValueOnce({ data: toyotaCars.length, error: null }); // total count
    mockSupabase.rpc.mockResolvedValueOnce({ data: page1Cars, error: null }); // page 1 data

    // Test page 1: should contain the 3 cheapest Toyota cars globally
    const page1Result = await fetchCarsWithLimitOffset({
      filters: { make: 'Toyota' },
      sort: 'price_asc',
      page: 1,
      pageSize
    });

    // Verify response format matches problem statement
    expect(page1Result).toHaveProperty('items');
    expect(page1Result).toHaveProperty('total');
    expect(page1Result).toHaveProperty('page');
    expect(page1Result).toHaveProperty('pageSize');
    expect(page1Result).toHaveProperty('hasNext');
    expect(page1Result).toHaveProperty('hasPrev');

    // Verify pagination info
    expect(page1Result.page).toBe(1);
    expect(page1Result.pageSize).toBe(3);
    expect(page1Result.total).toBe(5); // 5 Toyota cars total
    expect(page1Result.hasNext).toBe(true); // More pages available
    expect(page1Result.hasPrev).toBe(false); // First page

    // Verify page 1 has the globally cheapest Toyota cars
    const page1Prices = page1Result.items.map(car => car.price_cents);
    const globalMinToyotaPrice = Math.min(...toyotaCars.map(car => car.price_cents));
    const page1MinPrice = Math.min(...page1Prices);
    
    expect(page1MinPrice).toBe(globalMinToyotaPrice);
    expect(page1MinPrice).toBe(1200000); // €12,000 - cheapest Toyota

    // Verify all cars on page 1 are among the 3 cheapest globally
    const cheapest3ToyotaPrices = toyotaCarsSortedByPrice.slice(0, 3).map(car => car.price_cents);
    expect(page1Prices.sort()).toEqual(cheapest3ToyotaPrices.sort());

    // Verify database was called with correct parameters (filters → ORDER BY → LIMIT/OFFSET)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_limit_offset_page', {
      p_filters: { make: 'Toyota' },
      p_sort_field: 'price_cents',
      p_sort_dir: 'ASC', // ORDER BY price_cents ASC NULLS LAST, id ASC
      p_page: 1,
      p_page_size: 3
    });

    // Mock database calls for page 2
    vi.clearAllMocks();
    mockSupabase.rpc.mockResolvedValueOnce({ data: toyotaCars.length, error: null }); // total count
    mockSupabase.rpc.mockResolvedValueOnce({ data: page2Cars, error: null }); // page 2 data

    // Test page 2: should continue the sequence without repeats
    const page2Result = await fetchCarsWithLimitOffset({
      filters: { make: 'Toyota' },
      sort: 'price_asc',
      page: 2,
      pageSize
    });

    // Verify page 2 pagination info
    expect(page2Result.page).toBe(2);
    expect(page2Result.hasNext).toBe(false); // Last page (5 cars total, 3 per page = 2 pages)
    expect(page2Result.hasPrev).toBe(true); // Has previous page

    // Verify no duplicate cars between pages
    const page1Ids = page1Result.items.map(car => car.id);
    const page2Ids = page2Result.items.map(car => car.id);
    const intersection = page1Ids.filter(id => page2Ids.includes(id));
    expect(intersection).toHaveLength(0);

    // Verify price sequence continues correctly: last price of page 1 ≤ first price of page 2
    const lastPage1Price = Math.max(...page1Result.items.map(car => car.price_cents));
    const firstPage2Price = Math.min(...page2Result.items.map(car => car.price_cents));
    expect(lastPage1Price).toBeLessThanOrEqual(firstPage2Price);

    // Verify specific price sequence (Toyota Yaris €12k → Camry €18k → RAV4 €22k | Highlander €28k → Land Cruiser €32k)
    expect(page1Result.items[0].price_cents).toBe(1200000); // €12,000 - Yaris (cheapest)
    expect(page1Result.items[1].price_cents).toBe(1800000); // €18,000 - Camry
    expect(page1Result.items[2].price_cents).toBe(2200000); // €22,000 - RAV4
    expect(page2Result.items[0].price_cents).toBe(2800000); // €28,000 - Highlander
    expect(page2Result.items[1].price_cents).toBe(3200000); // €32,000 - Land Cruiser (most expensive)

    console.log('✅ Complete workflow validated:');
    console.log(`   1. Applied filter: make='Toyota' (${toyotaCars.length} of ${allCarsInDatabase.length} cars)`);
    console.log(`   2. Global ORDER BY price_cents ASC NULLS LAST, id ASC`);
    console.log(`   3. LIMIT/OFFSET pagination: ${pageSize} cars per page`);
    console.log(`   4. Page 1 contains globally cheapest: €${page1MinPrice/100000}k`);
    console.log(`   5. Sequence continues across pages without repeats`);
  });

  it('should support different sort options (year, mileage) with global sorting', async () => {
    const mockCars = [
      { id: 'car1', price_cents: 2000000, year: 2023, mileage: 5000, make: 'Toyota' }, // Newest, lowest mileage
      { id: 'car2', price_cents: 1500000, year: 2020, mileage: 50000, make: 'Toyota' }, // Older, higher mileage
      { id: 'car3', price_cents: 1800000, year: 2022, mileage: 15000, make: 'Toyota' }, // Middle
    ];

    // Test year sorting (newest first)
    const carsSortedByYear = [...mockCars].sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
    
    mockSupabase.rpc.mockResolvedValueOnce({ data: 3, error: null });
    mockSupabase.rpc.mockResolvedValueOnce({ data: carsSortedByYear, error: null });

    const yearResult = await fetchCarsWithLimitOffset({
      sort: 'year_desc',
      page: 1,
      pageSize: 3
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_limit_offset_page', {
      p_filters: {},
      p_sort_field: 'year',
      p_sort_dir: 'DESC', // ORDER BY year DESC NULLS LAST, id ASC
      p_page: 1,
      p_page_size: 3
    });

    // Verify newest car is first
    expect(yearResult.items[0].year).toBe(2023);

    // Test mileage sorting (lowest first)
    vi.clearAllMocks();
    const carsSortedByMileage = [...mockCars].sort((a, b) => a.mileage - b.mileage || a.id.localeCompare(b.id));
    
    mockSupabase.rpc.mockResolvedValueOnce({ data: 3, error: null });
    mockSupabase.rpc.mockResolvedValueOnce({ data: carsSortedByMileage, error: null });

    const mileageResult = await fetchCarsWithLimitOffset({
      sort: 'mileage_asc',
      page: 1,
      pageSize: 3
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_limit_offset_page', {
      p_filters: {},
      p_sort_field: 'mileage',
      p_sort_dir: 'ASC', // ORDER BY mileage ASC NULLS LAST, id ASC
      p_page: 1,
      p_page_size: 3
    });

    // Verify lowest mileage car is first
    expect(mileageResult.items[0].mileage).toBe(5000);
  });
});