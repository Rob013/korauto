import { SearchFilters } from './types';

/**
 * Builds filter expression with AND between facets and OR within a facet
 * For use with search engines like Meilisearch, Algolia, or SQL queries
 */
export function buildFilter(filters: SearchFilters): string {
  const conditions: string[] = [];

  // Helper function to build OR conditions within a facet
  const buildOrCondition = (field: string, values: string[]): string => {
    if (values.length === 1) {
      return `${field} = "${values[0]}"`;
    }
    return `(${values.map(value => `${field} = "${value}"`).join(' OR ')})`;
  };

  // Helper function to build numeric range conditions
  const buildRangeCondition = (field: string, range: { min?: number; max?: number }): string => {
    const parts: string[] = [];
    if (range.min !== undefined) {
      parts.push(`${field} >= ${range.min}`);
    }
    if (range.max !== undefined) {
      parts.push(`${field} <= ${range.max}`);
    }
    return parts.length > 1 ? `(${parts.join(' AND ')})` : parts[0];
  };

  // Categorical filters (OR within each facet)
  if (filters.country && filters.country.length > 0) {
    conditions.push(buildOrCondition('country', filters.country));
  }

  if (filters.make && filters.make.length > 0) {
    conditions.push(buildOrCondition('make', filters.make));
  }

  if (filters.model && filters.model.length > 0) {
    conditions.push(buildOrCondition('model', filters.model));
  }

  if (filters.trim && filters.trim.length > 0) {
    conditions.push(buildOrCondition('trim', filters.trim));
  }

  if (filters.fuel && filters.fuel.length > 0) {
    conditions.push(buildOrCondition('fuel', filters.fuel));
  }

  if (filters.transmission && filters.transmission.length > 0) {
    conditions.push(buildOrCondition('transmission', filters.transmission));
  }

  if (filters.body && filters.body.length > 0) {
    conditions.push(buildOrCondition('body', filters.body));
  }

  if (filters.drive && filters.drive.length > 0) {
    conditions.push(buildOrCondition('drive', filters.drive));
  }

  if (filters.accident && filters.accident.length > 0) {
    conditions.push(buildOrCondition('accident', filters.accident));
  }

  if (filters.use_type && filters.use_type.length > 0) {
    conditions.push(buildOrCondition('use_type', filters.use_type));
  }

  if (filters.exterior_color && filters.exterior_color.length > 0) {
    conditions.push(buildOrCondition('exterior_color', filters.exterior_color));
  }

  if (filters.interior_color && filters.interior_color.length > 0) {
    conditions.push(buildOrCondition('interior_color', filters.interior_color));
  }

  if (filters.region && filters.region.length > 0) {
    conditions.push(buildOrCondition('region', filters.region));
  }

  // Numeric array filters (OR within each facet)
  if (filters.owners && filters.owners.length > 0) {
    conditions.push(buildOrCondition('owners', filters.owners.map(String)));
  }

  if (filters.seats && filters.seats.length > 0) {
    conditions.push(buildOrCondition('seats', filters.seats.map(String)));
  }

  // Numeric range filters
  if (filters.year) {
    const yearCondition = buildRangeCondition('year', filters.year);
    if (yearCondition) {
      conditions.push(yearCondition);
    }
  }

  if (filters.price_eur) {
    const priceCondition = buildRangeCondition('price_eur', filters.price_eur);
    if (priceCondition) {
      conditions.push(priceCondition);
    }
  }

  if (filters.mileage_km) {
    const mileageCondition = buildRangeCondition('mileage_km', filters.mileage_km);
    if (mileageCondition) {
      conditions.push(mileageCondition);
    }
  }

  if (filters.engine_cc) {
    const engineCondition = buildRangeCondition('engine_cc', filters.engine_cc);
    if (engineCondition) {
      conditions.push(engineCondition);
    }
  }

  // Array filters (contains logic)
  if (filters.options && filters.options.length > 0) {
    const optionsConditions = filters.options.map(option => `options CONTAINS "${option}"`);
    if (optionsConditions.length === 1) {
      conditions.push(optionsConditions[0]);
    } else {
      conditions.push(`(${optionsConditions.join(' AND ')})`);
    }
  }

  // AND all conditions together
  return conditions.join(' AND ');
}

/**
 * Builds filter for SQL WHERE clause
 */
export function buildSQLFilter(filters: SearchFilters): { whereClause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Helper function to add parameter and return placeholder
  const addParam = (value: any): string => {
    params.push(value);
    return `$${paramIndex++}`;
  };

  // Helper function to build IN conditions
  const buildInCondition = (field: string, values: string[]): string => {
    const placeholders = values.map(() => addParam).join(', ');
    values.forEach(value => params.push(value));
    return `${field} IN (${placeholders})`;
  };

  // Categorical filters
  if (filters.country && filters.country.length > 0) {
    conditions.push(buildInCondition('country', filters.country));
  }

  if (filters.make && filters.make.length > 0) {
    conditions.push(buildInCondition('make', filters.make));
  }

  if (filters.model && filters.model.length > 0) {
    conditions.push(buildInCondition('model', filters.model));
  }

  if (filters.trim && filters.trim.length > 0) {
    conditions.push(buildInCondition('trim', filters.trim));
  }

  if (filters.fuel && filters.fuel.length > 0) {
    conditions.push(buildInCondition('fuel', filters.fuel));
  }

  if (filters.transmission && filters.transmission.length > 0) {
    conditions.push(buildInCondition('transmission', filters.transmission));
  }

  if (filters.body && filters.body.length > 0) {
    conditions.push(buildInCondition('body', filters.body));
  }

  if (filters.drive && filters.drive.length > 0) {
    conditions.push(buildInCondition('drive', filters.drive));
  }

  if (filters.accident && filters.accident.length > 0) {
    conditions.push(buildInCondition('accident', filters.accident));
  }

  if (filters.use_type && filters.use_type.length > 0) {
    conditions.push(buildInCondition('use_type', filters.use_type));
  }

  if (filters.exterior_color && filters.exterior_color.length > 0) {
    conditions.push(buildInCondition('exterior_color', filters.exterior_color));
  }

  if (filters.interior_color && filters.interior_color.length > 0) {
    conditions.push(buildInCondition('interior_color', filters.interior_color));
  }

  if (filters.region && filters.region.length > 0) {
    conditions.push(buildInCondition('region', filters.region));
  }

  // Numeric array filters
  if (filters.owners && filters.owners.length > 0) {
    const placeholders = filters.owners.map(() => addParam(filters.owners)).join(', ');
    conditions.push(`owners IN (${placeholders})`);
  }

  if (filters.seats && filters.seats.length > 0) {
    const placeholders = filters.seats.map(() => addParam(filters.seats)).join(', ');
    conditions.push(`seats IN (${placeholders})`);
  }

  // Numeric range filters
  if (filters.year) {
    if (filters.year.min !== undefined) {
      conditions.push(`year >= ${addParam(filters.year.min)}`);
    }
    if (filters.year.max !== undefined) {
      conditions.push(`year <= ${addParam(filters.year.max)}`);
    }
  }

  if (filters.price_eur) {
    if (filters.price_eur.min !== undefined) {
      conditions.push(`price_eur >= ${addParam(filters.price_eur.min)}`);
    }
    if (filters.price_eur.max !== undefined) {
      conditions.push(`price_eur <= ${addParam(filters.price_eur.max)}`);
    }
  }

  if (filters.mileage_km) {
    if (filters.mileage_km.min !== undefined) {
      conditions.push(`mileage_km >= ${addParam(filters.mileage_km.min)}`);
    }
    if (filters.mileage_km.max !== undefined) {
      conditions.push(`mileage_km <= ${addParam(filters.mileage_km.max)}`);
    }
  }

  if (filters.engine_cc) {
    if (filters.engine_cc.min !== undefined) {
      conditions.push(`engine_cc >= ${addParam(filters.engine_cc.min)}`);
    }
    if (filters.engine_cc.max !== undefined) {
      conditions.push(`engine_cc <= ${addParam(filters.engine_cc.max)}`);
    }
  }

  // Array filters (JSON containment)
  if (filters.options && filters.options.length > 0) {
    const optionsConditions = filters.options.map(option => 
      `options @> ${addParam(JSON.stringify([option]))}`
    );
    conditions.push(`(${optionsConditions.join(' AND ')})`);
  }

  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  
  return { whereClause, params };
}

/**
 * Legacy: Convert existing API filters to new search filters format
 */
export function convertLegacyFilters(legacyFilters: any): SearchFilters {
  const filters: SearchFilters = {};

  // Map manufacturer to make
  if (legacyFilters.manufacturer_id) {
    filters.make = [legacyFilters.manufacturer_id];
  }

  // Map model
  if (legacyFilters.model_id) {
    filters.model = [legacyFilters.model_id];
  }

  // Map grade/trim
  if (legacyFilters.grade_iaai) {
    filters.trim = [legacyFilters.grade_iaai];
  }

  if (legacyFilters.trim_level) {
    if (filters.trim) {
      filters.trim.push(legacyFilters.trim_level);
    } else {
      filters.trim = [legacyFilters.trim_level];
    }
  }

  // Map color
  if (legacyFilters.color) {
    filters.exterior_color = [legacyFilters.color];
  }

  // Map fuel type
  if (legacyFilters.fuel_type) {
    filters.fuel = [legacyFilters.fuel_type];
  }

  // Map transmission
  if (legacyFilters.transmission) {
    filters.transmission = [legacyFilters.transmission];
  }

  // Map body type
  if (legacyFilters.body_type) {
    filters.body = [legacyFilters.body_type];
  }

  // Map year range
  if (legacyFilters.from_year || legacyFilters.to_year) {
    filters.year = {};
    if (legacyFilters.from_year) {
      filters.year.min = parseInt(legacyFilters.from_year, 10);
    }
    if (legacyFilters.to_year) {
      filters.year.max = parseInt(legacyFilters.to_year, 10);
    }
  }

  // Map price range
  if (legacyFilters.buy_now_price_from || legacyFilters.buy_now_price_to) {
    filters.price_eur = {};
    if (legacyFilters.buy_now_price_from) {
      filters.price_eur.min = parseInt(legacyFilters.buy_now_price_from, 10);
    }
    if (legacyFilters.buy_now_price_to) {
      filters.price_eur.max = parseInt(legacyFilters.buy_now_price_to, 10);
    }
  }

  // Map mileage range
  if (legacyFilters.odometer_from_km || legacyFilters.odometer_to_km) {
    filters.mileage_km = {};
    if (legacyFilters.odometer_from_km) {
      filters.mileage_km.min = parseInt(legacyFilters.odometer_from_km, 10);
    }
    if (legacyFilters.odometer_to_km) {
      filters.mileage_km.max = parseInt(legacyFilters.odometer_to_km, 10);
    }
  }

  // Map seats
  if (legacyFilters.seats_count) {
    filters.seats = [parseInt(legacyFilters.seats_count, 10)];
  }

  return filters;
}