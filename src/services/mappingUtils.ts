// mapDbToExternal: Maps database row to exact external API JSON shape
// This ensures /api/cars and /api/cars/:id return identical JSON structure to external APIs
export function mapDbToExternal(row: any): any {
  return {
    // Core identifiers - exact same keys as external API
    id: row.id,
    api_id: row.api_id,
    
    // Basic car info - same keys and types as external API
    make: row.make,
    model: row.model,
    year: Number(row.year) || 0,
    price: row.price_cents ? Number(row.price_cents) / 100 : null,
    price_cents: Number(row.price_cents) || null,
    mileage: Number(row.mileage_km) || 0,
    fuel: row.fuel,
    transmission: row.transmission || row.gearbox, // Support both field names
    color: row.color,
    condition: row.condition,
    vin: row.vin,
    
    // Location and images - external API structure
    location: row.location || row.city || '', // Support both field names
    image_url: row.image_url,
    images: row.images || [],
    
    // Additional external API fields
    title: `${row.year} ${row.make} ${row.model}`,
    rank_score: Number(row.rank_score) || 0,
    lot_number: row.lot_number,
    created_at: row.created_at,
    
    // Preserve complete external API structure from stored raw data
    // This pulls any missing fields from the external_raw JSON column equivalent
    ...(row.car_data && typeof row.car_data === 'object' ? row.car_data : {}),
    
    // Include lot data as lots array (matches external API structure)
    lots: row.lot_data ? [row.lot_data] : [],
    
    // Override with our normalized/computed values to ensure consistency
    make: row.make,
    model: row.model,
    year: Number(row.year) || 0,
    price: row.price_cents ? Number(row.price_cents) / 100 : null,
    mileage: Number(row.mileage_km) || 0,
  };
}

// SORT_MAP whitelist for safe dynamic ordering - prevents SQL injection
export const SORT_MAP: Record<string, { field: string; direction: string }> = {
  'price_asc': { field: 'price_cents', direction: 'ASC' },
  'price_desc': { field: 'price_cents', direction: 'DESC' },
  'year_asc': { field: 'year', direction: 'ASC' },
  'year_desc': { field: 'year', direction: 'DESC' },
  'mileage_asc': { field: 'mileage_km', direction: 'ASC' },
  'mileage_desc': { field: 'mileage_km', direction: 'DESC' },
  'rank_asc': { field: 'rank_score', direction: 'ASC' },
  'rank_desc': { field: 'rank_score', direction: 'DESC' },
  'make_asc': { field: 'make', direction: 'ASC' },
  'make_desc': { field: 'make', direction: 'DESC' },
  'created_asc': { field: 'created_at', direction: 'ASC' },
  'created_desc': { field: 'created_at', direction: 'DESC' },
  // Frontend mappings for backward compatibility
  'price_low': { field: 'price_cents', direction: 'ASC' },
  'price_high': { field: 'price_cents', direction: 'DESC' },
  'year_new': { field: 'year', direction: 'DESC' },
  'year_old': { field: 'year', direction: 'ASC' },
  'mileage_low': { field: 'mileage_km', direction: 'ASC' },
  'mileage_high': { field: 'mileage_km', direction: 'DESC' },
  'make_az': { field: 'make', direction: 'ASC' },
  'make_za': { field: 'make', direction: 'DESC' },
  'recently_added': { field: 'created_at', direction: 'DESC' },
  'oldest_first': { field: 'created_at', direction: 'ASC' },
  'popular': { field: 'rank_score', direction: 'DESC' },
};