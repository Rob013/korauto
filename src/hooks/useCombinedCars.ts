import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuctionAPI, APIFilters } from "./useSecureAuctionAPI";

interface DatabaseCar {
  id: string;
  external_id: string | null;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number | null;
  title: string | null;
  vin: string | null;
  color: string | null;
  fuel: string | null;
  transmission: string | null;
  condition: string | null;
  location: string | null;
  lot_number: string | null;
  current_bid: number | null;
  buy_now_price: number | null;
  final_bid: number | null;
  image_url: string | null;
  images: any;
  source_api: string | null;
  domain_name: string | null;
  status: string | null;
  is_active: boolean | null;
  is_live: boolean | null;
  is_archived: boolean | null;
  keys_available: boolean | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

// Transform database car to match API car format
const transformDatabaseCar = (dbCar: DatabaseCar): any => {
  const images = dbCar.images || [];
  const imageArray = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images || '[]') : []);
  
  return {
    id: dbCar.external_id || dbCar.id,
    external_id: dbCar.external_id,
    manufacturer: { 
      id: 0, 
      name: dbCar.make 
    },
    model: { 
      id: 0, 
      name: dbCar.model 
    },
    year: dbCar.year,
    title: dbCar.title || `${dbCar.year} ${dbCar.make} ${dbCar.model}`,
    vin: dbCar.vin,
    color: dbCar.color ? { id: 0, name: dbCar.color } : null,
    fuel: dbCar.fuel ? { id: 0, name: dbCar.fuel } : null,
    transmission: dbCar.transmission ? { id: 0, name: dbCar.transmission } : null,
    condition: dbCar.condition,
    lot_number: dbCar.lot_number,
    status: dbCar.status === 'active' ? 1 : 0,
    lots: [{
      buy_now: dbCar.buy_now_price || dbCar.price,
      bid: dbCar.current_bid || 0,
      final_price: dbCar.final_bid,
      lot: dbCar.lot_number,
      odometer: { km: dbCar.mileage || 0 },
      images: { 
        normal: imageArray,
        big: imageArray 
      },
      status: dbCar.is_live ? 'live' : (dbCar.status || 'available'),
      keys_available: dbCar.keys_available
    }],
    source: 'database',
    location: dbCar.location,
    created_at: dbCar.created_at,
    last_synced_at: dbCar.last_synced_at
  };
};

// Apply basic filters to database query
const buildDatabaseQuery = (filters: APIFilters) => {
  let query = supabase
    .from('cars')
    .select('*');

  // Add basic filtering - use .not('is_archived', 'is', true) instead of .eq to handle null values
  try {
    query = query.neq('is_archived', true).neq('status', 'inactive');
  } catch (e) {
    // If columns don't exist, ignore the error and continue
    console.log('⚠️ Some database columns may not exist, continuing without full filtering');
  }

  // Apply filters
  if (filters.manufacturer_id) {
    // For database, we need to search by make name since we might not have manufacturer_id
    // This is a limitation but we'll handle it
    query = query.ilike('make', `%${filters.manufacturer_id}%`);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
  }

  if (filters.from_year) {
    query = query.gte('year', parseInt(filters.from_year));
  }

  if (filters.to_year) {
    query = query.lte('year', parseInt(filters.to_year));
  }

  if (filters.buy_now_price_from) {
    query = query.gte('buy_now_price', parseFloat(filters.buy_now_price_from));
  }

  if (filters.buy_now_price_to) {
    query = query.lte('buy_now_price', parseFloat(filters.buy_now_price_to));
  }

  if (filters.fuel_type) {
    query = query.ilike('fuel', `%${filters.fuel_type}%`);
  }

  if (filters.transmission) {
    query = query.ilike('transmission', `%${filters.transmission}%`);
  }

  if (filters.color) {
    query = query.ilike('color', `%${filters.color}%`);
  }

  return query;
};

export const useCombinedCars = () => {
  const [databaseCars, setDatabaseCars] = useState<any[]>([]);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [databaseTotal, setDatabaseTotal] = useState(0);

  // Use the existing API hook
  const {
    cars: apiCars,
    loading: apiLoading,
    error: apiError,
    totalCount: apiTotal,
    hasMorePages: apiHasMore,
    fetchCars: apiFetchCars,
    fetchAllCars: apiFetchAllCars,
    filters,
    setFilters,
    ...apiHookRest
  } = useSecureAuctionAPI();

  // Fetch cars from database
  const fetchDatabaseCars = useCallback(async (
    page: number = 1,
    newFilters: APIFilters = filters,
    resetList: boolean = true
  ) => {
    try {
      setDatabaseLoading(true);
      setDatabaseError(null);

      const perPage = 50; // Match API pagination
      const offset = (page - 1) * perPage;

      // Build the query with filters
      let query = buildDatabaseQuery(newFilters);
      
      // Add pagination
      query = query
        .order('updated_at', { ascending: false })
        .range(offset, offset + perPage - 1);

      console.log('🗄️ Fetching database cars with filters:', newFilters);
      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Database error:', error);
        // If the table doesn't exist or has schema issues, just return empty data
        if (error.message.includes('does not exist') || error.message.includes('column')) {
          console.log('⚠️ Database table/column issue, skipping database cars');
          setDatabaseCars([]);
          setDatabaseTotal(0);
          setDatabaseError(null);
          return;
        }
        setDatabaseError(error.message);
        return;
      }

      const transformedCars = (data || []).map(transformDatabaseCar);
      console.log(`✅ Database: Loaded ${transformedCars.length} cars from page ${page}`);

      if (resetList || page === 1) {
        setDatabaseCars(transformedCars);
      } else {
        setDatabaseCars(prev => [...prev, ...transformedCars]);
      }

      // Get total count if this is the first page
      if (page === 1) {
        try {
          const { count: totalCount } = await buildDatabaseQuery(newFilters).select('*', { count: 'exact', head: true });
          setDatabaseTotal(totalCount || 0);
        } catch (countError) {
          console.log('⚠️ Could not get database count, using current data length');
          setDatabaseTotal(transformedCars.length);
        }
      }

    } catch (err: any) {
      console.error('❌ Database fetch error:', err);
      // Don't show error to user if it's just a missing table - that's expected in some cases
      if (!err.message?.includes('does not exist')) {
        setDatabaseError(err.message || 'Failed to fetch database cars');
      }
      // Set empty data to prevent issues
      setDatabaseCars([]);
      setDatabaseTotal(0);
    } finally {
      setDatabaseLoading(false);
    }
  }, [filters]);

  // Get all database cars for sorting
  const fetchAllDatabaseCars = useCallback(async (filterParams: APIFilters = filters) => {
    try {
      console.log('🗄️ Fetching all database cars for sorting');
      
      const query = buildDatabaseQuery(filterParams)
        .order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Database error fetching all cars:', error);
        return [];
      }

      const transformedCars = (data || []).map(transformDatabaseCar);
      console.log(`✅ Database: Loaded all ${transformedCars.length} cars for sorting`);
      return transformedCars;
    } catch (err: any) {
      console.error('❌ Database fetch all error:', err);
      return [];
    }
  }, [filters]);

  // Combine and deduplicate cars from both sources
  const combinedCars = useMemo(() => {
    const combined: any[] = [];
    const seenIds = new Set<string>();

    // Add database cars first
    databaseCars.forEach(car => {
      const id = car.external_id || car.id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        combined.push({ ...car, source: 'database' });
      }
    });

    // Add API cars, but skip duplicates
    apiCars.forEach(car => {
      const id = car.id || car.external_id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        combined.push({ ...car, source: 'api' });
      }
    });

    console.log(`🔄 Combined cars: ${databaseCars.length} from database + ${apiCars.length} from API = ${combined.length} total (${seenIds.size} unique)`);
    return combined;
  }, [databaseCars, apiCars]);

  // Combined metadata
  const totalCount = databaseTotal + apiTotal;
  const loading = databaseLoading || apiLoading;
  const error = databaseError || apiError;

  // Enhanced fetchCars that fetches from both sources
  const fetchCars = useCallback(async (
    page: number = 1,
    newFilters: APIFilters = filters,
    resetList: boolean = true
  ) => {
    console.log(`🔄 Fetching combined cars - page ${page}`);
    
    // Update filters
    if (newFilters !== filters) {
      setFilters(newFilters);
    }

    // Fetch from both sources in parallel
    await Promise.all([
      fetchDatabaseCars(page, newFilters, resetList),
      apiFetchCars(page, newFilters, resetList)
    ]);
  }, [filters, fetchDatabaseCars, apiFetchCars, setFilters]);

  // Enhanced fetchAllCars for global sorting
  const fetchAllCars = useCallback(async (filterParams: APIFilters = filters) => {
    console.log('🔄 Fetching all combined cars for sorting');
    
    const [dbCars, apiCarsAll] = await Promise.all([
      fetchAllDatabaseCars(filterParams),
      apiFetchAllCars(filterParams)
    ]);

    // Combine and deduplicate
    const combined: any[] = [];
    const seenIds = new Set<string>();

    // Add database cars first
    dbCars.forEach(car => {
      const id = car.external_id || car.id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        combined.push({ ...car, source: 'database' });
      }
    });

    // Add API cars, but skip duplicates
    apiCarsAll.forEach(car => {
      const id = car.id || car.external_id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        combined.push({ ...car, source: 'api' });
      }
    });

    console.log(`✅ All combined cars: ${dbCars.length} from database + ${apiCarsAll.length} from API = ${combined.length} total unique`);
    return combined;
  }, [fetchAllDatabaseCars, apiFetchAllCars, filters]);

  // Initialize data on mount
  useEffect(() => {
    console.log('🚀 Initializing combined cars hook');
    fetchCars(1, filters, true);
  }, []); // Only run on mount

  return {
    // Combined data
    cars: combinedCars,
    totalCount,
    loading,
    error,
    
    // Individual source data (for debugging)
    databaseCars,
    apiCars,
    databaseTotal,
    apiTotal,
    databaseLoading,
    apiLoading,
    databaseError,
    apiError,

    // Enhanced functions
    fetchCars,
    fetchAllCars,
    
    // Pass through all other API hook functionality
    filters,
    setFilters,
    ...apiHookRest,

    // Additional metadata
    hasMorePages: apiHasMore, // We'll use API pagination for now
    hasDatabaseData: databaseCars.length > 0,
    hasApiData: apiCars.length > 0,
  };
};