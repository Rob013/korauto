import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { transformCachedCarRecord } from '@/services/carCache';

/**
 * Hook to prefetch car data on hover/focus for instant loading
 * Uses sessionStorage for ultra-fast access
 */
export const useCarPrefetch = () => {
  const prefetchCar = useCallback(async (lotNumber: string) => {
    if (!lotNumber) return;

    // Check if already in sessionStorage
    try {
      const existing = sessionStorage.getItem(`car_${lotNumber}`);
      if (existing) {
        console.log('⚡ Car already prefetched:', lotNumber);
        return;
      }
    } catch (e) {
      // Ignore storage errors
    }

    // Prefetch from Supabase cache
    try {
      console.log('🔮 Prefetching car:', lotNumber);
      const { data, error } = await supabase
        .from('cars_cache')
        .select('*')
        .or(`lot_number.eq.${lotNumber},api_id.eq.${lotNumber}`)
        .maybeSingle();

      if (!error && data) {
        const cachedCar = transformCachedCarRecord(data);
        // Store minimal data for prefetch (just what's needed to show the page quickly)
        const prefetchData = {
          id: cachedCar?.id,
          make: cachedCar?.manufacturer?.name,
          model: cachedCar?.model?.name,
          year: cachedCar?.year,
          price: cachedCar?.lots?.[0]?.buy_now,
          images: cachedCar?.lots?.[0]?.images?.normal?.slice(0, 5), // Only first 5 images
          lot: cachedCar?.lots?.[0]?.lot,
          mileage: cachedCar?.lots?.[0]?.odometer?.km,
          transmission: cachedCar?.transmission?.name,
          fuel: cachedCar?.fuel?.name,
          color: cachedCar?.color?.name,
          vin: cachedCar?.vin,
          // Store full data for complete hydration
          _fullData: cachedCar
        };
        
        try {
          sessionStorage.setItem(`car_${lotNumber}`, JSON.stringify(prefetchData));
          console.log('✅ Car prefetched successfully:', lotNumber);
        } catch (storageError) {
          console.warn('Failed to store prefetch data:', storageError);
        }
      }
    } catch (error) {
      console.warn('Prefetch failed for', lotNumber, error);
    }
  }, []);

  return { prefetchCar };
};
