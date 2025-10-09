/**
 * Grade Categorization and Deduplication Utilities
 * 
 * This module provides enhanced categorization and deduplication 
 * for car grades/engine specifications to organize them properly
 * in the filter panel.
 */

export interface GradeOption {
  value: string;
  label: string;
  count?: number;
}

export interface CategorizedGrades {
  category: string;
  priority: number;
  grades: GradeOption[];
}

/**
 * Normalizes a grade string to remove inconsistencies and enable better duplicate detection
 */
export const normalizeGrade = (grade: string): string => {
  return grade
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/(\d+)l\b/g, '$1 liter') // Normalize "2.0l" to "2.0 liter"
    .replace(/(\d+)\s*-\s*(\w+)/g, '$1 $2') // Normalize "2.0-tdi" to "2.0 tdi"
    .replace(/gasoline/g, 'petrol') // Standardize fuel type
    .replace(/\bev\b/g, 'electric') // Standardize electric
    .replace(/\bphev\b/g, 'hybrid') // Standardize hybrid
    .replace(/\be-tron\b/g, 'electric'); // Audi electric
};

/**
 * Categorizes a grade based on its characteristics
 * Priority: Diesel first, Hybrid second, Petrol third
 */
export const categorizeGrade = (grade: string): { category: string; priority: number } => {
  const normalized = normalizeGrade(grade);
  
  // Diesel variants (highest priority - user requirement)
  if (/\b(tdi|cdi|diesel|d\b|dci|turbodiesel)\b/.test(normalized)) {
    return { category: 'Diesel', priority: 1 };
  }
  
  // Hybrid/Electric variants (second priority - user requirement)
  if (/\b(hybrid|electric|e-tron|phev|ev|e-power|e-quattro|plug-in)\b/.test(normalized)) {
    return { category: 'Hybrid & Electric', priority: 2 };
  }
  
  // Petrol variants (third priority - user requirement)
  if (/\b(tfsi|tsi|fsi|cgi|petrol|gasoline|turbo|vtec|vvt|i\b|gdi|mpi)\b/.test(normalized)) {
    return { category: 'Petrol', priority: 3 };
  }
  
  // Performance variants
  if (/\b(amg|m\d*|rs\d*|s\d*|gt[s]?|gti|r\d*|n\d*|st|type-r|nismo|sti|wrx)\b/.test(normalized)) {
    return { category: 'Performance', priority: 4 };
  }
  
  // Luxury/Premium trim levels
  if (/\b(luxury|premium|prestige|executive|business|signature|platinum|diamond|exclusive|elite)\b/.test(normalized)) {
    return { category: 'Luxury Trims', priority: 5 };
  }
  
  // Sport/Style trim levels
  if (/\b(sport|dynamic|design|style|elegance|advance|progressive|comfort|deluxe)\b/.test(normalized)) {
    return { category: 'Style Trims', priority: 6 };
  }
  
  // Basic trim levels
  if (/\b(base|standard|limited|special|edition)\b/.test(normalized)) {
    return { category: 'Standard Trims', priority: 7 };
  }
  
  // Default category for unclassified
  return { category: 'Other', priority: 8 };
};

/**
 * Checks if two grades should be considered duplicates
 */
export const areGradesDuplicate = (grade1: string, grade2: string): boolean => {
  const norm1 = normalizeGrade(grade1);
  const norm2 = normalizeGrade(grade2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // Check if one is a substring of the other (for variants like "2.0 TDI" vs "TDI")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const longer = norm1.length > norm2.length ? norm1 : norm2;
    const shorter = norm1.length > norm2.length ? norm2 : norm1;
    
    // Only consider duplicate if the shorter is a significant part of the longer
    return longer.length - shorter.length <= 6; // Allow small differences
  }
  
  // Check for common abbreviations
  const abbreviations = [
    ['tdi', 'diesel'],
    ['tfsi', 'turbo fsi'],
    ['tsi', 'turbo'],
    ['cdi', 'diesel'],
    ['cgi', 'petrol']
  ];
  
  for (const [abbrev, full] of abbreviations) {
    if ((norm1.includes(abbrev) && norm2.includes(full)) ||
        (norm1.includes(full) && norm2.includes(abbrev))) {
      return true;
    }
  }
  
  return false;
};

/**
 * Deduplicates grades by merging similar ones and combining their counts
 */
export const deduplicateGrades = (grades: GradeOption[]): GradeOption[] => {
  const deduplicated: GradeOption[] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < grades.length; i++) {
    if (processed.has(i)) continue;
    
    const currentGrade = grades[i];
    let combinedCount = currentGrade.count || 0;
    let bestLabel = currentGrade.label;
    
    // Look for duplicates
    for (let j = i + 1; j < grades.length; j++) {
      if (processed.has(j)) continue;
      
      if (areGradesDuplicate(currentGrade.value, grades[j].value)) {
        combinedCount += grades[j].count || 0;
        processed.add(j);
        
        // Choose the better label (longer, more descriptive)
        if (grades[j].label.length > bestLabel.length) {
          bestLabel = grades[j].label;
        }
      }
    }
    
    deduplicated.push({
      value: currentGrade.value,
      label: bestLabel,
      count: combinedCount
    });
    
    processed.add(i);
  }
  
  return deduplicated;
};

/**
 * Sorts grades within a category using intelligent logic
 * For diesel/petrol/hybrid: sort numerically by displacement (30 TDI, 35 TDI, 40 TDI)
 */
export const sortGradesInCategory = (grades: GradeOption[], category: string): GradeOption[] => {
  return [...grades].sort((a, b) => {
    // For Diesel, Petrol, and Hybrid categories: sort numerically by displacement/power
    if (category === 'Diesel' || category === 'Petrol' || category === 'Hybrid & Electric') {
      const aNum = extractEngineSize(a.value);
      const bNum = extractEngineSize(b.value);
      
      // If both have numbers, sort by number (ascending: 30, 35, 40, 45, etc.)
      if (aNum !== bNum && aNum > 0 && bNum > 0) {
        return aNum - bNum; // Smaller numbers first (30 before 35 before 40)
      }
      
      // If only one has a number, put the numbered one first
      if (aNum > 0 && bNum === 0) return -1;
      if (bNum > 0 && aNum === 0) return 1;
    }
    
    // Then sort by count (popularity) in descending order
    const countDiff = (b.count || 0) - (a.count || 0);
    if (countDiff !== 0) return countDiff;
    
    // For performance variants, custom order
    if (category === 'Performance') {
      const performanceOrder = ['amg', 'rs', 'm', 'gt', 'gti', 'st', 'r', 'n', 's'];
      const aIndex = performanceOrder.findIndex(perf => a.value.toLowerCase().includes(perf));
      const bIndex = performanceOrder.findIndex(perf => b.value.toLowerCase().includes(perf));
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }
    
    // Default to alphabetical
    return a.label.localeCompare(b.label);
  });
};

/**
 * Extracts numeric engine size/power for sorting
 * Handles various formats: "30 TDI", "2.0 TDI", "45 TFSI", etc.
 */
const extractEngineSize = (grade: string): number => {
  // First try to match power numbers (30, 35, 40, 45, etc. - common in Audi, VW)
  const powerMatch = grade.match(/\b(\d{2,3})\s*(?:TDI|TFSI|TSI|FSI|CDI|CGI|d|i|e|hybrid)/i);
  if (powerMatch) {
    return parseFloat(powerMatch[1]);
  }
  
  // Then try displacement numbers (1.4, 2.0, 3.0, etc.)
  const displacementMatch = grade.match(/(\d+\.?\d*)\s*(?:L|liter|litre)?/i);
  if (displacementMatch) {
    const displacement = parseFloat(displacementMatch[1]);
    // Convert displacement to comparable scale with power numbers
    // 1.4L -> 14, 2.0L -> 20, 3.0L -> 30, etc.
    if (displacement < 10) {
      return displacement * 10;
    }
    return displacement;
  }
  
  return 0;
};

/**
 * Main function to categorize and organize grades
 */
export const categorizeAndOrganizeGrades = (grades: GradeOption[]): CategorizedGrades[] => {
  // First deduplicate
  const deduplicated = deduplicateGrades(grades);
  
  // Group by category
  const categorized = new Map<string, GradeOption[]>();
  const categoryPriorities = new Map<string, number>();
  
  deduplicated.forEach(grade => {
    const { category, priority } = categorizeGrade(grade.value);
    
    if (!categorized.has(category)) {
      categorized.set(category, []);
      categoryPriorities.set(category, priority);
    }
    
    categorized.get(category)!.push(grade);
  });
  
  // Sort within each category and create final structure
  const result: CategorizedGrades[] = [];
  
  categorized.forEach((grades, category) => {
    const sortedGrades = sortGradesInCategory(grades, category);
    const priority = categoryPriorities.get(category) || 999;
    
    result.push({
      category,
      priority,
      grades: sortedGrades
    });
  });
  
  // Sort categories by priority
  result.sort((a, b) => a.priority - b.priority);
  
  return result;
};

/**
 * Flattens categorized grades back to a simple array for dropdown display
 * but maintains the category organization through separators
 */
export const flattenCategorizedGrades = (categorized: CategorizedGrades[]): GradeOption[] => {
  const flattened: GradeOption[] = [];
  
  categorized.forEach((categoryGroup, index) => {
    // Add category separator (except for first category)
    if (index > 0 && categoryGroup.grades.length > 0) {
      flattened.push({
        value: `separator-${index}`,
        label: `──── ${categoryGroup.category} ────`,
        count: 0
      });
    }
    
    // Add the grades in this category
    flattened.push(...categoryGroup.grades);
  });
  
  return flattened;
};