import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ServerSort = 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'mileage_low' | 'mileage_high' | 'make_az' | 'make_za';

export interface ServerFilters {
  make_name?: string;
  model_name?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  color_name?: string;
  fuel_name?: string;
  transmission_name?: string;
  search?: string;
}

export const useServerCatalog = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchServerCars = useCallback(async (page: number, perPage: number, sortBy: ServerSort, filters: ServerFilters) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('catalog-cars', {
        body: {
          page,
          per_page: perPage,
          sort_by: sortBy,
          filters,
        },
      });
      if (error) throw new Error(error.message);
      setCars(data?.data || []);
      setTotalCount(data?.meta?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load cars');
    } finally {
      setLoading(false);
    }
  }, []);

  return { cars, loading, error, totalCount, fetchServerCars };
};

