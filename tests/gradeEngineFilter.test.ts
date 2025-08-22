import { describe, it, expect } from 'vitest';
import { getFallbackGrades, extractGradesFromTitle } from '@/utils/catalog-filter';

describe('Grade/Engine Filter Improvements', () => {
  
  it('should return only engine specifications, not trim levels', () => {
    // Test BMW grades
    const bmwGrades = getFallbackGrades('9');
    
    // Should contain engine specifications
    expect(bmwGrades.some(g => g.value === '2.0 diesel')).toBe(true);
    expect(bmwGrades.some(g => g.value === '3.0 diesel')).toBe(true);
    expect(bmwGrades.some(g => g.value === '2.0 petrol')).toBe(true);
    
    // Should NOT contain trim levels
    expect(bmwGrades.some(g => g.value === 'M3')).toBe(false);
    expect(bmwGrades.some(g => g.value === 'M5')).toBe(false);
    expect(bmwGrades.some(g => g.value === 'X3')).toBe(false);
    expect(bmwGrades.some(g => g.value === 'X5')).toBe(false);
  });

  it('should return appropriate engine specs for different manufacturers', () => {
    // Test Audi grades
    const audiGrades = getFallbackGrades('1');
    expect(audiGrades.some(g => g.value === '2.0 TDI')).toBe(true);
    expect(audiGrades.some(g => g.value === '3.0 TDI')).toBe(true);
    expect(audiGrades.some(g => g.value === '2.0 TFSI')).toBe(true);
    
    // Should NOT contain trim level-like entries
    expect(audiGrades.some(g => g.value === 'RS')).toBe(false);
    expect(audiGrades.some(g => g.value === 'S')).toBe(false);

    // Test Volkswagen grades
    const vwGrades = getFallbackGrades('147');
    expect(vwGrades.some(g => g.value === '1.4 TSI')).toBe(true);
    expect(vwGrades.some(g => g.value === '2.0 TDI')).toBe(true);
    
    // Should NOT contain trim levels
    expect(vwGrades.some(g => g.value === 'GTI')).toBe(false);
    expect(vwGrades.some(g => g.value === 'R')).toBe(false);
  });

  it('should extract engine specifications from car titles', () => {
    const testTitles = [
      '2020 BMW 320d with 2.0 diesel engine',
      '2019 Audi A4 2.0 TDI Quattro',
      '2021 VW Golf 1.4 TSI',
      '2018 Mercedes C220d 2.2 diesel'
    ];

    testTitles.forEach(title => {
      const grades = extractGradesFromTitle(title);
      expect(grades.length).toBeGreaterThan(0);
      
      // Should extract engine-related terms
      const hasEngineSpec = grades.some(grade => 
        grade.includes('diesel') || 
        grade.includes('tdi') || 
        grade.includes('tsi') || 
        grade.includes('petrol')
      );
      expect(hasEngineSpec).toBe(true);
    });
  });

  it('should normalize engine specifications consistently', () => {
    const grades1 = extractGradesFromTitle('2020 BMW 2.0 diesel');
    const grades2 = extractGradesFromTitle('2020 BMW 2.0L diesel');
    
    // Should normalize similar engine specs
    expect(grades1.length).toBeGreaterThan(0);
    expect(grades2.length).toBeGreaterThan(0);
    
    // Both should contain engine-related information
    const hasEngine1 = grades1.some(g => g.includes('diesel') || g.includes('liter'));
    const hasEngine2 = grades2.some(g => g.includes('diesel') || g.includes('liter'));
    
    expect(hasEngine1).toBe(true);
    expect(hasEngine2).toBe(true);
  });

  it('should not include model names or trim levels in extracted grades', () => {
    const titleWithTrimLevels = '2020 Honda Civic Sport 1.6 turbo';
    const grades = extractGradesFromTitle(titleWithTrimLevels);
    
    // Should extract engine info
    const hasEngineInfo = grades.some(g => g.includes('turbo'));
    expect(hasEngineInfo).toBe(true);
    
    // Should not extract model names
    const hasModelName = grades.some(g => 
      g.toLowerCase().includes('civic') || 
      g.toLowerCase().includes('sport')
    );
    expect(hasModelName).toBe(false);
  });
});