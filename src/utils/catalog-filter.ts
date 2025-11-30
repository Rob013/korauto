//@ts-nocheck
/**
 * Catalog Filter Utilities
 * 
 * This module contains all the filtering logic for the car catalog.
 * It provides utilities for grade extraction, filter application,
 * filter validation, and search functionality.
 */

import { hasRealPricing } from './carPricing';

export interface APIFilters {
  manufacturer_id?: string;
  manufacturer_name?: string; // Name for cache filtering
  model_id?: string;
  model_name?: string; // Name for cache filtering
  generation_id?: string;
  generation_name?: string; // Name for cache filtering
  grade_iaai?: string;
  trim_level?: string;
  engine_spec?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  drive_type?: string;
  steering_position?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  engine_from?: string;
  engine_to?: string;
  doors_count?: string;
  seats_count?: string;
  search?: string;
  max_accidents?: string;
  domain_name?: string;
  per_page?: string;
}

export interface Car {
  id: string;
  title?: string;
  lots?: Array<{ grade_iaai?: string;[key: string]: unknown }>;
  engine?: { name?: string };
  [key: string]: unknown;
}

export interface FilterCounts {
  manufacturers: { [key: string]: number };
  models: { [key: string]: number };
  colors: { [key: string]: number };
  fuelTypes: { [key: string]: number };
  transmissions: { [key: string]: number };
  years: { [key: string]: number };
}

/**
 * Extracts engine specifications from car title
 * Returns normalized engine variants (e.g., "2.0 TDI", "520d", "35 TFSI")
 */
export const extractEngineSpecs = (title: string): string[] => {
  const engines: string[] = [];
  const patterns = [
    // BMW style: 520d, 530i, 535xi
    /\b(\d{3}[dix]+)\b/gi,
    // Audi style: 35 TDI, 40 TFSI, 45 quattro
    /\b(\d+)\s+(TDI|TFSI|FSI|TSI|quattro)\b/gi,
    // VW/Audi traditional: 2.0 TDI, 1.5 TSI, 3.0 diesel
    /\b(\d+\.?\d*)\s+(TDI|TFSI|FSI|TSI|CDI|diesel|petrol|hybrid)\b/gi,
    // Mercedes style: 220d, 300 CDI
    /\b(\d{3}[dh]?)\s*(CDI|diesel|petrol)?\b/gi,
  ];

  patterns.forEach(pattern => {
    const matches = title.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.trim();
        if (cleaned && !engines.includes(cleaned)) {
          engines.push(cleaned);
        }
      });
    }
  });

  return engines;
};

/**
 * Extracts grade information from a car title using various patterns
 */
export const extractGradesFromTitle = (title: string): string[] => {
  const grades: string[] = [];
  const patterns = [
    /\b(\d+\.?\d*)\s*(?:TDI|TFSI|FSI|TSI|CDI)\b/gi, // Engine tech abbreviations
    /\b(\d+\.?\d*)\s*(?:diesel|petrol|benzin|hybrid|electric)\b/gi, // Full fuel type words
    /\b(\d+\.?\d*)\s*(?:turbo|liter?|l)\s*(?:diesel|petrol|gasoline|hybrid|electric)?\b/gi, // Engine displacement and turbo
  ];

  patterns.forEach(pattern => {
    const matches = title.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.trim().toLowerCase();
        // Normalize the engine specification format
        const normalized = cleaned
          .replace(/\bl\b/g, 'liter')
          .replace(/\bgas(oline)?\b/g, 'petrol')
          .replace(/(\d+\.?\d*)\s*(tdi|tfsi|fsi|tsi|cdi|diesel|petrol|gasoline|hybrid|electric|turbo|liter)/gi, '$1 $2');

        if (normalized && !grades.includes(normalized)) {
          grades.push(normalized);
        }
      });
    }
  });

  return grades;
};

/**
 * Extracts all grades from a car object (from lots, title, and engine)
 */
export const extractCarGrades = (car: Car): string[] => {
  const carGrades: string[] = [];

  if (!car) return carGrades;

  // Extract grades from lots (primary source)
  if (car.lots && Array.isArray(car.lots)) {
    car.lots.forEach((lot: { grade_iaai?: string;[key: string]: unknown }) => {
      if (lot.grade_iaai) {
        carGrades.push(lot.grade_iaai.trim().toLowerCase());
      }
    });
  }

  // Extract grades from title
  if (car.title) {
    const titleGrades = extractGradesFromTitle(car.title);
    carGrades.push(...titleGrades.map(g => g.toLowerCase()));
  }

  // Extract grades from engine field
  if (car.engine && car.engine.name) {
    carGrades.push(car.engine.name.trim().toLowerCase());
  }

  return carGrades;
};

/**
 * Checks if a car matches a grade filter - STRICT matching
 */
export const matchesGradeFilter = (car: Car, gradeFilter: string): boolean => {
  if (!car) return false;

  if (!gradeFilter || gradeFilter === 'all') {
    return true;
  }

  const filterGrade = gradeFilter.toLowerCase().trim();
  const carGrades = extractCarGrades(car);

  // STRICT matching - exact match or filter is contained in car grade
  return carGrades.some(grade => {
    const gradeNormalized = grade.toLowerCase().trim();

    // Exact match (highest priority)
    if (gradeNormalized === filterGrade) return true;

    // Car grade contains the filter (e.g., "2.0 TDI quattro" contains "2.0 TDI")
    if (gradeNormalized.includes(filterGrade)) return true;

    // Remove spaces for comparison (e.g., "2.0TDI" matches "2.0 TDI")
    const gradeNoSpaces = gradeNormalized.replace(/\s+/g, '');
    const filterNoSpaces = filterGrade.replace(/\s+/g, '');
    if (gradeNoSpaces === filterNoSpaces || gradeNoSpaces.includes(filterNoSpaces)) return true;

    return false;
  });
};

/**
 * Extracts unique engine specifications from a list of cars
 */
export const extractUniqueEngineSpecs = (cars: Car[]): Array<{ value: string; label: string; count: number }> => {
  const engineCounts = new Map<string, number>();

  if (!Array.isArray(cars)) return [];

  cars.forEach(car => {
    if (!car) return;
    if (car.title) {
      const engines = extractEngineSpecs(car.title);
      engines.forEach(engine => {
        engineCounts.set(engine, (engineCounts.get(engine) || 0) + 1);
      });
    }

    // Also check engine field
    if (car.engine && car.engine.name) {
      const engines = extractEngineSpecs(car.engine.name);
      engines.forEach(engine => {
        engineCounts.set(engine, (engineCounts.get(engine) || 0) + 1);
      });
    }
  });

  // Convert to array and sort by count (most common first)
  return Array.from(engineCounts.entries())
    .map(([engine, count]) => ({
      value: engine,
      label: `${engine} (${count})`,
      count
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Checks if a car matches an engine specification filter - STRICT matching
 */
export const matchesEngineFilter = (car: Car, engineFilter: string): boolean => {
  if (!car) return false;

  if (!engineFilter || engineFilter === 'all') {
    return true;
  }

  const filterEngine = engineFilter.toLowerCase().trim();
  const carEngines: string[] = [];

  // Extract from title
  if (car.title) {
    const titleEngines = extractEngineSpecs(car.title);
    carEngines.push(...titleEngines.map(e => e.toLowerCase()));
  }

  // Extract from engine field
  if (car.engine && car.engine.name) {
    const engineFieldSpecs = extractEngineSpecs(car.engine.name);
    carEngines.push(...engineFieldSpecs.map(e => e.toLowerCase()));
  }

  // STRICT matching - exact match or car engine contains filter
  return carEngines.some(engine => {
    const engineNormalized = engine.toLowerCase().trim();

    // Exact match (highest priority)
    if (engineNormalized === filterEngine) return true;

    // Car engine contains filter (e.g., "520d xDrive" contains "520d")
    if (engineNormalized.includes(filterEngine)) return true;

    // Remove spaces for comparison
    const engineNoSpaces = engineNormalized.replace(/\s+/g, '');
    const filterNoSpaces = filterEngine.replace(/\s+/g, '');
    if (engineNoSpaces === filterNoSpaces || engineNoSpaces.includes(filterNoSpaces)) return true;

    return false;
  });
};

/**
 * Applies client-side grade filtering to a list of cars
 * Also filters out cars without real pricing data
 */
export const applyGradeFilter = (cars: Car[], gradeFilter?: string): Car[] => {
  if (!Array.isArray(cars)) return [];

  // First filter out cars without real pricing data
  const carsWithRealPricing = cars.filter(car => car && hasRealPricing(car));

  if (!gradeFilter || gradeFilter === 'all') {
    return carsWithRealPricing;
  }

  return carsWithRealPricing.filter(car => matchesGradeFilter(car, gradeFilter));
};

/**
 * Validates and normalizes filter values
 */
export const normalizeFilters = (filters: APIFilters): APIFilters => {
  const normalized: APIFilters = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all' && value !== 'any') {
      normalized[key as keyof APIFilters] = value;
    }
  });

  return normalized;
};

/**
 * Creates URL search parameters from filters
 */
export const filtersToURLParams = (filters: APIFilters): URLSearchParams => {
  const params = new URLSearchParams();
  const normalizedFilters = normalizeFilters(filters);

  Object.entries(normalizedFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      // Properly encode grade filter for URL
      params.set(key, key === 'grade_iaai' ? encodeURIComponent(value) : value);
    }
  });

  return params;
};

/**
 * Parses URL search parameters into filters
 */
export const urlParamsToFilters = (searchParams: URLSearchParams): APIFilters => {
  const filters: APIFilters = {};

  searchParams.forEach((value, key) => {
    if (value && value !== 'undefined') {
      // Properly decode grade filter from URL
      filters[key as keyof APIFilters] = key === 'grade_iaai' ? decodeURIComponent(value) : value;
    }
  });

  return filters;
};

/**
 * Checks if any filters are currently active
 */
export const hasActiveFilters = (filters: APIFilters): boolean => {
  const normalizedFilters = normalizeFilters(filters);
  return Object.keys(normalizedFilters).length > 0;
};

/**
 * Checks if this is a year range filter change
 */
export const isYearRangeChange = (newFilters: APIFilters, currentFilters: APIFilters): boolean => {
  return (
    newFilters.from_year !== currentFilters.from_year ||
    newFilters.to_year !== currentFilters.to_year
  ) && (newFilters.from_year || newFilters.to_year);
};

/**
 * Creates filters with pagination
 */
export const addPaginationToFilters = (filters: APIFilters, perPage: number = 200, page: number = 1): APIFilters => {
  return {
    ...filters,
    per_page: perPage.toString(),
    page: page.toString()
  };
};

/**
 * Fallback grades for manufacturers when API data is not available
 */
export const getFallbackGrades = (manufacturerId: string): Array<{ value: string; label: string }> => {
  const fallbacks: { [key: string]: string[] } = {
    '9': ['2.0 diesel', '3.0 diesel', '2.0 petrol', '3.0 petrol', '1.6 diesel', '2.5 petrol', '4.0 petrol'], // BMW
    '16': ['2.2 diesel', '2.5 petrol', '3.0 diesel', '3.5 petrol', '4.0 petrol', '4.5 petrol', '5.0 petrol'], // Mercedes-Benz
    '1': ['2.0 TDI', '3.0 TDI', '2.0 TFSI', '3.0 TFSI', '1.4 TFSI', '1.8 TFSI', '2.5 TFSI'], // Audi
    '147': ['1.4 TSI', '1.6 TDI', '1.8 TSI', '2.0 TDI', '2.0 TSI'], // Volkswagen
    '148': ['2.0 turbo', '2.5 petrol', '1.8 hybrid', '1.6 diesel'], // Generic
    '2': ['1.5 petrol', '2.0 petrol', '1.6 diesel', '2.4 petrol', '1.8 hybrid'], // Honda
    '3': ['1.8 petrol', '2.0 petrol', '2.5 petrol', '1.6 hybrid', '2.0 hybrid'], // Toyota
    '4': ['2.5 petrol', '3.5 petrol', '1.6 turbo', '2.0 petrol'], // Nissan
    '5': ['1.0 turbo', '1.5 turbo', '2.0 petrol', '1.6 diesel', '2.0 diesel'], // Ford
    '6': ['1.4 turbo', '1.8 petrol', '2.0 petrol', '1.6 diesel'], // Chevrolet
  };

  return (fallbacks[manufacturerId] || []).map(grade => ({ value: grade, label: grade }));
};

/**
 * Manufacturer categories for sorting
 */
export const getManufacturerCategory = (manufacturerName: string): { priority: number; categoryName: string } => {
  const categories = {
    german: {
      name: 'German Brands',
      brands: ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'],
      priority: 1
    },
    korean: {
      name: 'Korean Brands',
      brands: ['Hyundai', 'Kia', 'Genesis'],
      priority: 2
    },
    japanese: {
      name: 'Japanese Brands',
      brands: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Infiniti', 'Acura', 'Mitsubishi'],
      priority: 3
    },
    american: {
      name: 'American Brands',
      brands: ['Ford', 'Chevrolet', 'Cadillac', 'GMC', 'Tesla', 'Chrysler', 'Jeep', 'Dodge'],
      priority: 4
    },
    luxury: {
      name: 'Luxury/European Brands',
      brands: ['Land Rover', 'Jaguar', 'Volvo', 'Ferrari', 'Lamborghini', 'Maserati', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'McLaren', 'Mini'],
      priority: 5
    },
    french: {
      name: 'French Brands',
      brands: ['Peugeot', 'Renault', 'Citroën'],
      priority: 6
    },
    italian: {
      name: 'Italian Brands',
      brands: ['Fiat', 'Alfa Romeo'],
      priority: 7
    },
    other: {
      name: 'Other Brands',
      brands: ['Skoda', 'Seat'],
      priority: 8
    }
  };

  const categoryEntry = Object.values(categories).find(category =>
    category.brands.includes(manufacturerName.trim())
  );

  return {
    priority: categoryEntry?.priority || 999,
    categoryName: categoryEntry?.name || 'Other Brands'
  };
};

/**
 * Sorts manufacturers by category and car count
 */
export const sortManufacturers = (manufacturers: Array<{
  id: number;
  name: string;
  cars_qty?: number;
  car_count?: number
}>): Array<{ id: number; name: string; cars_qty?: number; car_count?: number }> => {
  // Brands to exclude from the dropdown
  const excludedBrands = [
    'Daewoo', 'Daihatsu', 'Saab', 'Isuzu', 'BAIC',
    'Jeis Mobility', 'Ineos', 'IVECO', 'Mitsuoka',
    'Buick', 'International', 'Mercury'
  ];

  return manufacturers
    .filter(m => {
      // Ensure manufacturer has valid data from API
      const count = m.cars_qty ?? m.car_count;
      const hasCountData = m.cars_qty !== undefined || m.car_count !== undefined;
      const hasValidCount = hasCountData ? (count || 0) > 0 : true;

      const isValid = m.id &&
        m.name &&
        typeof m.name === 'string' &&
        m.name.trim().length > 0 &&
        hasValidCount;

      // Exclude specific brands
      const isNotExcluded = !excludedBrands.includes(m.name.trim());

      return isValid && isNotExcluded;
    })
    .sort((a, b) => {
      // Sort by car count (descending) - brands with most cars on top
      const aCount = a.cars_qty ?? a.car_count ?? 0;
      const bCount = b.cars_qty ?? b.car_count ?? 0;
      if (aCount !== bCount) {
        return bCount - aCount;
      }

      // If same count, sort alphabetically
      return a.name.trim().localeCompare(b.name.trim());
    });
};

/**
 * Generate year range for filters
 */
export const generateYearRange = (currentYear?: number): number[] => {
  const year = currentYear || new Date().getFullYear();
  // Fixed: Enhanced year range - 30 years from current year to 1996, corrected calculation
  return Array.from({ length: 32 }, (_, i) => Math.max(year + 2 - i, 1996));
};

/**
 * Generate year range presets for quick filtering
 */
export const generateYearPresets = (currentYear?: number) => {
  const year = currentYear || new Date().getFullYear();
  return [
    { label: '2022+', from: 2022, to: year + 2 },
    { label: '2020+', from: 2020, to: 2022 },
    { label: '2018+', from: 2018, to: 2020 },
    { label: '2016+', from: 2016, to: 2018 },
    { label: '2010+', from: 2010, to: year + 2 },
    { label: '2005+', from: 2005, to: year + 2 },
    { label: '2000+', from: 2000, to: year + 2 },
  ];
};

/**
 * Checks if strict filtering mode should be enabled
 */
export const isStrictFilterMode = (filters: APIFilters): boolean => {
  return !!(filters.manufacturer_id || filters.model_id ||
    filters.color || filters.fuel_type || filters.transmission ||
    filters.from_year || filters.to_year || filters.buy_now_price_from ||
    filters.buy_now_price_to || filters.odometer_from_km || filters.odometer_to_km ||
    filters.seats_count || filters.max_accidents || filters.grade_iaai || filters.search);
};

/**
 * Debounce utility function for filter operations
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};