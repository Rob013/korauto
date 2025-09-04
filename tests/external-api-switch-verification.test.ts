/**
 * External API Switch Verification
 * 
 * This script demonstrates that the website has been successfully switched
 * from internal database API to external auction API with backend sorting.
 */

import { describe, it, expect } from 'vitest';

describe('External API Switch Verification', () => {
  it('should confirm fetchCars function uses external API', async () => {
    // Read the source code to verify external API usage
    const fs = await import('fs');
    const path = await import('path');
    
    const hookPath = path.resolve(process.cwd(), 'src/hooks/useSecureAuctionAPI.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf-8');
    
    // Verify fetchCars function uses makeSecureAPICall instead of fetchCarsWithKeyset
    const fetchCarsMatch = hookContent.match(/const fetchCars = useCallback\(async \(([\s\S]*?)\) => {([\s\S]*?)}, \[filters\]\);/);
    expect(fetchCarsMatch).toBeTruthy();
    
    const fetchCarsBody = fetchCarsMatch?.[2] || '';
    
    // Should contain external API call
    expect(fetchCarsBody).toContain('makeSecureAPICall("cars"');
    expect(fetchCarsBody).toContain('External API Success');
    
    // Should NOT contain internal database API calls
    expect(fetchCarsBody).not.toContain('fetchCarsWithKeyset');
    expect(fetchCarsBody).not.toContain('Database Success');
  });

  it('should confirm fetchAllCars function uses external API', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const hookPath = path.resolve(process.cwd(), 'src/hooks/useSecureAuctionAPI.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf-8');
    
    // Verify fetchAllCars function uses external API pagination
    const fetchAllCarsMatch = hookContent.match(/const fetchAllCars = async \(([\s\S]*?)\) => {([\s\S]*?)};/);
    expect(fetchAllCarsMatch).toBeTruthy();
    
    const fetchAllCarsBody = fetchAllCarsMatch?.[2] || '';
    
    // Should contain external API call
    expect(fetchAllCarsBody).toContain('makeSecureAPICall("cars"');
    expect(fetchAllCarsBody).toContain('External API global fetch completed');
    
    // Should NOT contain internal database API calls
    expect(fetchAllCarsBody).not.toContain('fetchCarsWithKeyset');
  });

  it('should confirm backend sorting is implemented', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const hookPath = path.resolve(process.cwd(), 'src/hooks/useSecureAuctionAPI.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf-8');
    
    // Verify mapSortToAPI function exists for backend sorting
    const mapSortToAPIMatch = hookContent.match(/const mapSortToAPI = \(sortBy: string\)([\s\S]*?)};/);
    expect(mapSortToAPIMatch).toBeTruthy();
    
    const mapSortBody = mapSortToAPIMatch?.[0] || '';
    
    // Should contain sorting mappings for external API
    expect(mapSortBody).toContain('sort_by');
    expect(mapSortBody).toContain('sort_direction');
    expect(mapSortBody).toContain('price_low');
    expect(mapSortBody).toContain('price_high');
  });

  it('should confirm error handling is updated for external API', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const hookPath = path.resolve(process.cwd(), 'src/hooks/useSecureAuctionAPI.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf-8');
    
    // Should contain external API error messages
    expect(hookContent).toContain('External API Error');
    expect(hookContent).toContain('Failed to load cars from external API');
    
    // Should NOT contain database error messages in fetchCars
    const fetchCarsSection = hookContent.split('const fetchCars')[1]?.split('const ')[0] || '';
    expect(fetchCarsSection).not.toContain('Database Error');
    expect(fetchCarsSection).not.toContain('fallback cars for pagination testing');
  });

  it('should confirm no unused database imports remain', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    // Check main catalog component
    const catalogPath = path.resolve(process.cwd(), 'src/components/EncarCatalog.tsx');
    const catalogContent = fs.readFileSync(catalogPath, 'utf-8');
    
    // Should NOT import old database API functions
    expect(catalogContent).not.toContain('mapFrontendSortToBackend');
    expect(catalogContent).not.toContain('from "@/services/carsApi"');
  });

  it('should verify all main functions use external API', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const hookPath = path.resolve(process.cwd(), 'src/hooks/useSecureAuctionAPI.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf-8');
    
    // Count external API calls vs old database calls
    const externalAPICalls = (hookContent.match(/makeSecureAPICall/g) || []).length;
    const databaseAPICalls = (hookContent.match(/fetchCarsWithKeyset/g) || []).length;
    
    // Should have multiple external API calls
    expect(externalAPICalls).toBeGreaterThan(3);
    
    // Should have minimal or no database API calls (only in deprecated comments)
    expect(databaseAPICalls).toBeLessThanOrEqual(1);
  });
});