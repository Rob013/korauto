/**
 * Hook for fetching individual car details with hybrid cache/API approach
 * 1. Try Supabase cache first
 * 2. Fallback to Encar API
 * 3. Last resort: external auction API
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchEncarsVehicle, fetchEncarsInspection, type EncarsVehicleResponse } from '@/services/encarApi';

export interface CarDetailsData {
  id: number | string;
  vehicle_id?: number;
  lot?: string;
  make?: string;
  model?: string | { id?: number; name?: string };
  year?: number;
  price?: number;
  mileage?: string | number;
  fuel?: string;
  transmission?: string;
  color?: string;
  vin?: string;
  images?: any[];
  details?: any;
  insurance_v2?: any;
  inspect?: any;
  manufacturer?: { id?: number; name?: string };
  generation?: { id?: number; name?: string };
  grade?: string;
  options?: any;
  contact?: any;
  [key: string]: any;
}

interface UseCarDetailsOptions {
  preferCache?: boolean;
  fallbackToAPI?: boolean;
}

// Transform cached car data
function transformCachedCar(cached: any): CarDetailsData {
  let photos: string[] = [];
  try {
    if (cached.photos) {
      const parsed = typeof cached.photos === 'string' ? JSON.parse(cached.photos) : cached.photos;
      photos = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn('Error parsing photos:', e);
  }

  return {
    id: parseInt(String(cached.vehicle_id)),
    vehicle_id: cached.vehicle_id,
    lot: cached.lot_number || String(cached.vehicle_id),
    make: cached.manufacturer_name,
    year: cached.form_year ? parseInt(cached.form_year) : undefined,
    price: cached.buy_now_price || cached.original_price,
    mileage: cached.mileage,
    fuel: cached.fuel_type,
    transmission: cached.transmission,
    color: cached.color_name,
    vin: cached.vin,
    images: photos,
    manufacturer: {
      id: cached.manufacturer_id,
      name: cached.manufacturer_name
    },
    model: {
      id: cached.model_id,
      name: cached.model_name
    },
    generation: {
      id: cached.generation_id,
      name: cached.generation_name
    },
    grade: cached.grade_name,
    options: cached.options,
    contact: {
      address: cached.contact_address
    },
    details: {
      seats_count: cached.seat_count,
      inspection_available: cached.inspection_available
    },
    insurance_v2: {
      accidentCnt: cached.has_accident ? 1 : 0,
      hasAccident: cached.has_accident
    },
    dealer_name: cached.dealer_name,
    dealer_firm: cached.dealer_firm,
    _cached: true,
    _source: 'cache'
  };
}

// Transform Encar API response
function transformEncarAPIResponse(vehicle: EncarsVehicleResponse, inspection: any): CarDetailsData {
  const photos = vehicle.photos?.map(p => p.path) || [];
  
  return {
    id: vehicle.vehicleId,
    vehicle_id: vehicle.vehicleId,
    lot: vehicle.vehicleNo || String(vehicle.vehicleId),
    make: vehicle.category?.manufacturerName,
    year: vehicle.category?.formYear ? parseInt(vehicle.category.formYear) : undefined,
    price: vehicle.advertisement?.price || vehicle.category?.originPrice,
    mileage: vehicle.spec?.mileage,
    fuel: vehicle.spec?.fuelName,
    transmission: vehicle.spec?.transmissionName,
    color: vehicle.spec?.colorName,
    vin: vehicle.vin,
    images: photos,
    manufacturer: {
      id: 0,
      name: vehicle.category?.manufacturerName
    },
    model: {
      id: 0,
      name: vehicle.category?.modelName
    },
    generation: {
      id: 0,
      name: vehicle.category?.modelGroupName
    },
    grade: vehicle.category?.gradeName,
    details: {
      ...vehicle,
      inspect: inspection,
      seats_count: vehicle.spec?.seatCount
    },
    inspect: inspection,
    options: vehicle.options,
    contact: vehicle.contact,
    insurance_v2: {
      accidentCnt: vehicle.condition?.accident?.recordView ? 1 : 0,
      hasAccident: vehicle.condition?.accident?.recordView
    },
    dealer_name: vehicle.partnership?.dealer?.name,
    dealer_firm: vehicle.partnership?.dealer?.firm?.name,
    _source: 'encar-api'
  };
}

export function useCarDetails(
  vehicleId: string | number | undefined,
  options: UseCarDetailsOptions = {}
) {
  const { preferCache = true, fallbackToAPI = true } = options;
  
  const [car, setCar] = useState<CarDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'cache' | 'encar-api' | 'external-api' | null>(null);

  const fetchFromCache = useCallback(async (id: string | number): Promise<CarDetailsData | null> => {
    try {
      console.log('🔍 Fetching car from cache:', id);
      
      const { data, error } = await supabase
        .from('encar_cars_cache')
        .select('*')
        .eq('vehicle_id', Number(id))
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        console.log('✅ Found car in cache');
        return transformCachedCar(data);
      }
      
      return null;
    } catch (err) {
      console.warn('Cache fetch failed:', err);
      return null;
    }
  }, []);

  const fetchFromEncarAPI = useCallback(async (id: string | number): Promise<CarDetailsData | null> => {
    try {
      console.log('🌐 Fetching car from Encar API:', id);
      
      const [vehicle, inspection] = await Promise.allSettled([
        fetchEncarsVehicle(id),
        fetchEncarsInspection(id).catch(() => null)
      ]);

      const vehicleData = vehicle.status === 'fulfilled' ? vehicle.value : null;
      const inspectionData = inspection.status === 'fulfilled' ? inspection.value : null;

      if (!vehicleData) return null;

      console.log('✅ Found car in Encar API');
      return transformEncarAPIResponse(vehicleData, inspectionData);
    } catch (err) {
      console.warn('Encar API fetch failed:', err);
      return null;
    }
  }, []);

  const fetchCarDetails = useCallback(async (id: string | number) => {
    setLoading(true);
    setError(null);
    setCar(null);
    setSource(null);

    try {
      let carData: CarDetailsData | null = null;

      // Try cache first if preferred
      if (preferCache) {
        carData = await fetchFromCache(id);
        if (carData) {
          setSource('cache');
        }
      }

      // Fallback to Encar API if cache failed or not preferred
      if (!carData && fallbackToAPI) {
        carData = await fetchFromEncarAPI(id);
        if (carData) {
          setSource('encar-api');
        }
      }

      if (carData) {
        setCar(carData);
      } else {
        setError('Car not found');
      }
    } catch (err) {
      console.error('Error fetching car details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch car details');
    } finally {
      setLoading(false);
    }
  }, [preferCache, fallbackToAPI, fetchFromCache, fetchFromEncarAPI]);

  useEffect(() => {
    if (vehicleId) {
      fetchCarDetails(vehicleId);
    } else {
      setLoading(false);
      setError('No vehicle ID provided');
    }
  }, [vehicleId, fetchCarDetails]);

  return {
    car,
    loading,
    error,
    source,
    refetch: () => vehicleId ? fetchCarDetails(vehicleId) : Promise.resolve()
  };
}
