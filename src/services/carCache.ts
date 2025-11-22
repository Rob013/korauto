// Car cache transformation service
// Transforms cached car records from Supabase into the expected format

export interface CachedCarRecord {
  id: string;
  car_data: any;
  updated_at?: string;
  [key: string]: any;
}

export function transformCachedCarRecord(cachedRecord: CachedCarRecord): any {
  if (!cachedRecord) return null;

  // If car_data exists, use it as the base
  const carData = cachedRecord.car_data || {};

  // Merge top-level fields with car_data, preferring car_data values
  return {
    ...cachedRecord,
    ...carData,
    id: cachedRecord.id, // Always preserve the cache ID
    updated_at: cachedRecord.updated_at || carData.updated_at,
  };
}
