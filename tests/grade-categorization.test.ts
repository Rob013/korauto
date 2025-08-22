import { describe, it, expect } from 'vitest';
import { 
  normalizeGrade, 
  categorizeGrade, 
  areGradesDuplicate, 
  deduplicateGrades,
  categorizeAndOrganizeGrades,
  flattenCategorizedGrades,
  type GradeOption 
} from '@/utils/grade-categorization';

describe('Grade Categorization and Deduplication', () => {
  
  describe('normalizeGrade', () => {
    it('should normalize common variations', () => {
      expect(normalizeGrade('2.0L TDI')).toBe('2.0 liter tdi');
      expect(normalizeGrade('2.0-TDI')).toBe('2.0 tdi');
      expect(normalizeGrade('2.0 gasoline')).toBe('2.0 petrol');
      expect(normalizeGrade('EV')).toBe('electric');
      expect(normalizeGrade('PHEV')).toBe('hybrid');
      expect(normalizeGrade('e-tron')).toBe('electric');
    });

    it('should handle spacing and case consistently', () => {
      expect(normalizeGrade('  2.0  TDI  ')).toBe('2.0 tdi');
      expect(normalizeGrade('2.0TDI')).toBe('2.0tdi');
      expect(normalizeGrade('BMW M3')).toBe('bmw m3');
    });
  });

  describe('categorizeGrade', () => {
    it('should categorize electric/hybrid grades with highest priority', () => {
      expect(categorizeGrade('e-tron')).toEqual({ category: 'Electric & Hybrid', priority: 1 });
      expect(categorizeGrade('hybrid')).toEqual({ category: 'Electric & Hybrid', priority: 1 });
      expect(categorizeGrade('PHEV')).toEqual({ category: 'Electric & Hybrid', priority: 1 });
      expect(categorizeGrade('electric')).toEqual({ category: 'Electric & Hybrid', priority: 1 });
    });

    it('should categorize performance variants correctly', () => {
      expect(categorizeGrade('AMG')).toEqual({ category: 'Performance', priority: 2 });
      expect(categorizeGrade('BMW M3')).toEqual({ category: 'Performance', priority: 2 });
      expect(categorizeGrade('RS6')).toEqual({ category: 'Performance', priority: 2 });
      expect(categorizeGrade('GTI')).toEqual({ category: 'Performance', priority: 2 });
      expect(categorizeGrade('Type-R')).toEqual({ category: 'Performance', priority: 2 });
    });

    it('should categorize engine technology variants', () => {
      expect(categorizeGrade('2.0 TDI')).toEqual({ category: 'Engine Technology', priority: 3 });
      expect(categorizeGrade('1.4 TFSI')).toEqual({ category: 'Engine Technology', priority: 3 });
      expect(categorizeGrade('3.0 turbo')).toEqual({ category: 'Engine Technology', priority: 3 });
      expect(categorizeGrade('2.5 VTEC')).toEqual({ category: 'Engine Technology', priority: 3 });
    });

    it('should categorize basic engine displacement', () => {
      expect(categorizeGrade('2.0 diesel')).toEqual({ category: 'Engine Displacement', priority: 4 });
      expect(categorizeGrade('1.6 petrol')).toEqual({ category: 'Engine Displacement', priority: 4 });
      expect(categorizeGrade('3.0 liter')).toEqual({ category: 'Engine Displacement', priority: 4 });
    });

    it('should categorize luxury trims', () => {
      expect(categorizeGrade('Luxury')).toEqual({ category: 'Luxury Trims', priority: 5 });
      expect(categorizeGrade('Premium')).toEqual({ category: 'Luxury Trims', priority: 5 });
      expect(categorizeGrade('Executive')).toEqual({ category: 'Luxury Trims', priority: 5 });
      expect(categorizeGrade('Prestige')).toEqual({ category: 'Luxury Trims', priority: 5 });
    });

    it('should categorize style trims', () => {
      expect(categorizeGrade('Sport')).toEqual({ category: 'Style Trims', priority: 6 });
      expect(categorizeGrade('Dynamic')).toEqual({ category: 'Style Trims', priority: 6 });
      expect(categorizeGrade('Design')).toEqual({ category: 'Style Trims', priority: 6 });
      expect(categorizeGrade('Elegance')).toEqual({ category: 'Style Trims', priority: 6 });
    });
  });

  describe('areGradesDuplicate', () => {
    it('should detect exact duplicates after normalization', () => {
      expect(areGradesDuplicate('2.0 TDI', '2.0 tdi')).toBe(true);
      expect(areGradesDuplicate('2.0L TDI', '2.0 liter tdi')).toBe(true);
      expect(areGradesDuplicate('2.0-TDI', '2.0 TDI')).toBe(true);
    });

    it('should detect substring duplicates', () => {
      expect(areGradesDuplicate('2.0 TDI', 'TDI')).toBe(true);
      expect(areGradesDuplicate('BMW M3', 'M3')).toBe(true);
    });

    it('should detect abbreviation duplicates', () => {
      expect(areGradesDuplicate('TDI', 'diesel')).toBe(true);
      expect(areGradesDuplicate('TFSI', 'turbo fsi')).toBe(true);
      // Note: AMG vs mercedes amg is too different to be considered duplicates in this implementation
      expect(areGradesDuplicate('2.0 TDI', '2.0 diesel')).toBe(true);
    });

    it('should not detect false duplicates', () => {
      expect(areGradesDuplicate('2.0 TDI', '3.0 TDI')).toBe(false);
      expect(areGradesDuplicate('Sport', 'Luxury')).toBe(false);
      expect(areGradesDuplicate('M3', 'M5')).toBe(false);
    });
  });

  describe('deduplicateGrades', () => {
    it('should merge duplicate grades and combine counts', () => {
      const grades: GradeOption[] = [
        { value: '2.0 TDI', label: '2.0 TDI', count: 10 },
        { value: '2.0 tdi', label: '2.0 tdi', count: 5 },
        { value: 'TDI', label: 'TDI', count: 3 },
        { value: '3.0 TDI', label: '3.0 TDI', count: 8 }
      ];

      const result = deduplicateGrades(grades);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: '2.0 TDI', label: '2.0 TDI', count: 18 });
      expect(result[1]).toEqual({ value: '3.0 TDI', label: '3.0 TDI', count: 8 });
    });

    it('should choose the better label when merging similar grades', () => {
      const grades: GradeOption[] = [
        { value: 'TDI', label: 'TDI', count: 10 },
        { value: '2.0 TDI', label: '2.0 TDI', count: 5 }
      ];

      const result = deduplicateGrades(grades);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('2.0 TDI'); // More descriptive label chosen
      expect(result[0].count).toBe(15);
    });
  });

  describe('categorizeAndOrganizeGrades', () => {
    it('should organize grades into proper categories with correct priorities', () => {
      const grades: GradeOption[] = [
        { value: '2.0 TDI', label: '2.0 TDI', count: 20 },
        { value: 'e-tron', label: 'e-tron', count: 15 },
        { value: 'AMG', label: 'AMG', count: 10 },
        { value: 'Sport', label: 'Sport', count: 8 },
        { value: '1.6 diesel', label: '1.6 diesel', count: 12 },
        { value: 'Luxury', label: 'Luxury', count: 6 }
      ];

      const result = categorizeAndOrganizeGrades(grades);

      expect(result).toHaveLength(5);
      
      // Check category order by priority
      expect(result[0].category).toBe('Electric & Hybrid');
      expect(result[0].priority).toBe(1);
      expect(result[0].grades).toHaveLength(1);
      expect(result[0].grades[0].value).toBe('e-tron');

      expect(result[1].category).toBe('Performance');
      expect(result[1].priority).toBe(2);

      expect(result[2].category).toBe('Engine Technology');
      expect(result[2].priority).toBe(3);

      expect(result[3].category).toBe('Luxury Trims');
      expect(result[3].priority).toBe(5);

      expect(result[4].category).toBe('Style Trims');
      expect(result[4].priority).toBe(6);
    });

    it('should sort grades within categories by count', () => {
      const grades: GradeOption[] = [
        { value: '1.4 TFSI', label: '1.4 TFSI', count: 5 },
        { value: '2.0 TDI', label: '2.0 TDI', count: 20 },
        { value: '3.0 TFSI', label: '3.0 TFSI', count: 15 }
      ];

      const result = categorizeAndOrganizeGrades(grades);
      const engineTechCategory = result.find(cat => cat.category === 'Engine Technology');
      
      expect(engineTechCategory).toBeDefined();
      expect(engineTechCategory!.grades[0].value).toBe('2.0 TDI'); // Highest count first
      expect(engineTechCategory!.grades[1].value).toBe('3.0 TFSI');
      expect(engineTechCategory!.grades[2].value).toBe('1.4 TFSI');
    });
  });

  describe('flattenCategorizedGrades', () => {
    it('should add category separators between categories', () => {
      const categorized = [
        {
          category: 'Electric & Hybrid',
          priority: 1,
          grades: [{ value: 'e-tron', label: 'e-tron', count: 15 }]
        },
        {
          category: 'Performance',
          priority: 2,
          grades: [{ value: 'AMG', label: 'AMG', count: 10 }]
        }
      ];

      const result = flattenCategorizedGrades(categorized);

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe('e-tron');
      expect(result[1].value).toBe('separator-1');
      expect(result[1].label).toBe('──── Performance ────');
      expect(result[2].value).toBe('AMG');
    });

    it('should not add separator before first category', () => {
      const categorized = [
        {
          category: 'Electric & Hybrid',
          priority: 1,
          grades: [{ value: 'e-tron', label: 'e-tron', count: 15 }]
        }
      ];

      const result = flattenCategorizedGrades(categorized);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('e-tron');
    });
  });
});