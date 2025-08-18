/**
 * Grade and Trim Level Utilities
 * 
 * This module provides utilities for organizing, categorizing, and deduplicating
 * grades and trim levels in the car catalog filters.
 */

export interface GradeOption {
  value: string;
  label: string;
  category?: string;
}

export interface TrimOption {
  value: string;
  label: string;
  category?: string;
}

/**
 * Categorizes grades by engine type and power level
 */
export const categorizeGrades = (grades: Array<{ value: string; label: string }>): Array<GradeOption> => {
  const categorized: Array<GradeOption> = [];
  const seen = new Set<string>();

  grades.forEach(grade => {
    const value = grade.value?.toLowerCase().trim();
    const label = grade.label?.trim();
    
    if (!value || !label || seen.has(value)) return;
    seen.add(value);

    let category = 'Other';
    
    // Diesel engines
    if (/\b(tdi|cdi|d|diesel)\b/i.test(value)) {
      category = 'Diesel Engines';
    }
    // Petrol engines
    else if (/\b(tsi|tfsi|fsi|gti|vti|i|petrol|gasoline)\b/i.test(value)) {
      category = 'Petrol Engines';
    }
    // Hybrid engines
    else if (/\b(hybrid|h|e-tron|e)\b/i.test(value)) {
      category = 'Hybrid/Electric';
    }
    // Performance variants
    else if (/\b(rs|r|m|amg|s|sport|performance)\b/i.test(value)) {
      category = 'Performance';
    }
    // Numeric patterns (displacement)
    else if (/^\d+\.?\d*$/.test(value)) {
      category = 'Engine Displacement';
    }

    categorized.push({
      value: grade.value,
      label,
      category
    });
  });

  // Sort by category and then by label
  return categorized.sort((a, b) => {
    const categoryOrder = {
      'Petrol Engines': 1,
      'Diesel Engines': 2,
      'Hybrid/Electric': 3,
      'Performance': 4,
      'Engine Displacement': 5,
      'Other': 6
    };
    
    const aCategoryOrder = (categoryOrder as any)[a.category!] || 999;
    const bCategoryOrder = (categoryOrder as any)[b.category!] || 999;
    
    if (aCategoryOrder !== bCategoryOrder) {
      return aCategoryOrder - bCategoryOrder;
    }
    
    return a.label.localeCompare(b.label);
  });
};

/**
 * Categorizes trim levels by type and features
 */
export const categorizeTrimLevels = (trimLevels: Array<{ value: string; label: string }>): Array<TrimOption> => {
  const categorized: Array<TrimOption> = [];
  const seen = new Set<string>();

  trimLevels.forEach(trim => {
    const value = trim.value?.toLowerCase().trim();
    const label = trim.label?.trim();
    
    if (!value || !label || seen.has(value)) return;
    seen.add(value);

    let category = 'Standard';
    
    // Luxury/Premium trims
    if (/\b(premium|luxury|executive|prestige|elite|platinum|signature)\b/i.test(value)) {
      category = 'Premium';
    }
    // Sport trims
    else if (/\b(sport|s-line|m-sport|r-line|st|rs|gti|type-r)\b/i.test(value)) {
      category = 'Sport';
    }
    // Base/Entry trims
    else if (/\b(base|entry|classic|essential|basic|comfort)\b/i.test(value)) {
      category = 'Base';
    }
    // Technology/Advanced trims
    else if (/\b(tech|technology|advanced|innovation|connect|digital)\b/i.test(value)) {
      category = 'Technology';
    }

    categorized.push({
      value: trim.value,
      label,
      category
    });
  });

  // Sort by category and then by label
  return categorized.sort((a, b) => {
    const categoryOrder = {
      'Base': 1,
      'Standard': 2,
      'Technology': 3,
      'Sport': 4,
      'Premium': 5
    };
    
    const aCategoryOrder = (categoryOrder as any)[a.category!] || 999;
    const bCategoryOrder = (categoryOrder as any)[b.category!] || 999;
    
    if (aCategoryOrder !== bCategoryOrder) {
      return aCategoryOrder - bCategoryOrder;
    }
    
    return a.label.localeCompare(b.label);
  });
};

/**
 * Removes duplicates from grade/trim arrays
 */
export const deduplicateOptions = <T extends { value: string; label: string }>(options: T[]): T[] => {
  const seen = new Set<string>();
  return options.filter(option => {
    const key = option.value?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Groups options by category for dropdown rendering
 */
export const groupOptionsByCategory = <T extends { value: string; label: string; category?: string }>(
  options: T[]
): Array<{ category: string; options: T[] }> => {
  const grouped = options.reduce((acc, option) => {
    const category = option.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(option);
    return acc;
  }, {} as Record<string, T[]>);

  return Object.entries(grouped).map(([category, options]) => ({
    category,
    options: options.sort((a, b) => a.label.localeCompare(b.label))
  }));
};