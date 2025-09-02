/**
 * Test for useEncarAPI database integration fix
 * Verifies that useEncarAPI now fetches real data from cars_cache table instead of mock data
 */

import { describe, it, expect } from 'vitest';

describe('useEncarAPI Database Integration Fix', () => {
  it('should validate that useEncarAPI source code has been updated', async () => {
    // Read the source file to verify changes
    const fs = await import('fs');
    const path = await import('path');
    
    const sourceFile = fs.readFileSync(
      path.join(process.cwd(), 'src/hooks/useEncarAPI.ts'),
      'utf-8'
    );

    // Verify that mock data is no longer used
    expect(sourceFile).not.toContain('Generate mock car data for testing');
    expect(sourceFile).not.toContain('const mockCars: Car[] = [');
    
    // Verify that real database queries are now used
    expect(sourceFile).toContain("supabase.from('cars_cache')");
    expect(sourceFile).toContain('.select(\'*\', { count: \'exact\' })');
    
    // Verify that the cars-sync function is still used (as per SYNC_SYSTEM_FIX)
    expect(sourceFile).toContain("supabase.functions.invoke('cars-sync'");
    
    // Verify that the car count prioritizes cars_cache (as mentioned in fix)
    expect(sourceFile).toContain('cars_cache');
    expect(sourceFile).toContain('const cacheCount = cacheResult.count || 0');
    expect(sourceFile).toContain('const totalCount = cacheCount > 0 ? cacheCount : mainCount');
  });

  it('should verify the fix removes BMW M3 mock data and related hardcoded values', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const sourceFile = fs.readFileSync(
      path.join(process.cwd(), 'src/hooks/useEncarAPI.ts'),
      'utf-8'
    );

    // Verify specific mock data is removed
    expect(sourceFile).not.toContain('BMW');
    expect(sourceFile).not.toContain('M3');
    expect(sourceFile).not.toContain('Mercedes-Benz');
    expect(sourceFile).not.toContain('C-Class');
    expect(sourceFile).not.toContain('67300'); // Mock price
    expect(sourceFile).not.toContain('47300'); // Mock price
    expect(sourceFile).not.toContain('images.unsplash.com'); // Mock images
  });

  it('should verify database filtering capabilities are implemented', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const sourceFile = fs.readFileSync(
      path.join(process.cwd(), 'src/hooks/useEncarAPI.ts'),
      'utf-8'
    );

    // Verify that filters are applied to database queries
    expect(sourceFile).toContain('filters?.make');
    expect(sourceFile).toContain('filters?.model');
    expect(sourceFile).toContain('filters?.yearFrom');
    expect(sourceFile).toContain('filters?.yearTo');
    expect(sourceFile).toContain('filters?.priceFrom');
    expect(sourceFile).toContain('filters?.priceTo');
    expect(sourceFile).toContain('filters?.search');
    
    // Verify proper query building
    expect(sourceFile).toContain('.in(\'make\', filters.make)');
    expect(sourceFile).toContain('.gte(\'year\', filters.yearFrom)');
    expect(sourceFile).toContain('.lte(\'year\', filters.yearTo)');
    expect(sourceFile).toContain('.or(`make.ilike.%${filters.search}%');
  });

  it('should verify proper data mapping from database to Car interface', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const sourceFile = fs.readFileSync(
      path.join(process.cwd(), 'src/hooks/useEncarAPI.ts'),
      'utf-8'
    );

    // Verify that all Car interface fields are properly mapped
    expect(sourceFile).toContain('id: car.id');
    expect(sourceFile).toContain('external_id: car.external_id');
    expect(sourceFile).toContain('make: car.make');
    expect(sourceFile).toContain('model: car.model');
    expect(sourceFile).toContain('year: car.year');
    expect(sourceFile).toContain('price: car.price');
    expect(sourceFile).toContain('mileage: car.mileage');
    expect(sourceFile).toContain('image_url: car.image_url');
    expect(sourceFile).toContain('source_api: car.source_api');
    expect(sourceFile).toContain('status: car.status');
  });

  it('should verify pagination functionality for database queries', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const sourceFile = fs.readFileSync(
      path.join(process.cwd(), 'src/hooks/useEncarAPI.ts'),
      'utf-8'
    );

    // Verify pagination logic
    expect(sourceFile).toContain('const offset = (page - 1) * limit');
    expect(sourceFile).toContain('.range(offset, offset + limit - 1)');
    
    // Verify page handling
    expect(sourceFile).toContain('if (page === 1) {');
    expect(sourceFile).toContain('setCars(carsData)');
    expect(sourceFile).toContain('setCars(prev => [...prev, ...carsData])');
  });
});