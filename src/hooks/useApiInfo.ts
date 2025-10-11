import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApiEndpoint {
  name: string;
  url: string;
  method: string;
  description: string;
  parameters: Record<string, any>;
  responseSchema: Record<string, any>;
  status: 'active' | 'inactive' | 'deprecated';
  lastUsed?: string;
  requestCount?: number;
}

export interface ApiDataInfo {
  tableName: string;
  recordCount: number;
  lastUpdated: string;
  columns: string[];
  description: string;
}

export interface ApiStats {
  totalEndpoints: number;
  activeEndpoints: number;
  totalRecords: number;
  totalTables: number;
  lastSyncTime?: string;
  syncStatus?: string;
}

export interface ApiInfoData {
  endpoints: ApiEndpoint[];
  dataInfo: ApiDataInfo[];
  stats: ApiStats;
  mappings: Record<string, any>;
  filters: Record<string, any>;
}

export const useApiInfo = () => {
  const [apiInfo, setApiInfo] = useState<ApiInfoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching comprehensive API information...');

      // Gather endpoint information
      const endpoints: ApiEndpoint[] = [
        {
          name: 'Cars API',
          url: '/functions/v1/cars-api',
          method: 'GET',
          description: 'Main cars data endpoint with filtering, sorting, and pagination',
          parameters: {
            make: 'string',
            model: 'string',
            yearMin: 'number',
            yearMax: 'number',
            priceMin: 'number',
            priceMax: 'number',
            fuel: 'string',
            search: 'string',
            sort: 'string',
            limit: 'number (1-100)',
            cursor: 'string'
          },
          responseSchema: {
            data: 'Car[]',
            total: 'number',
            nextCursor: 'string',
            hasMore: 'boolean'
          },
          status: 'active'
        },
        {
          name: 'Secure Cars API',
          url: '/functions/v1/secure-cars-api',
          method: 'POST',
          description: 'Secure proxy for external auction APIs',
          parameters: {
            endpoint: 'string',
            filters: 'object',
            carId: 'string',
            lotNumber: 'string'
          },
          responseSchema: {
            data: 'any[]',
            success: 'boolean',
            message: 'string'
          },
          status: 'active'
        },
        {
          name: 'Encar Sync',
          url: '/functions/v1/encar-sync',
          method: 'POST',
          description: 'Synchronization endpoint for car data',
          parameters: {
            type: 'full | incremental | daily',
            minutes: 'number',
            emergency: 'boolean',
            count: 'number'
          },
          responseSchema: {
            success: 'boolean',
            cars_added: 'number',
            message: 'string'
          },
          status: 'active'
        },
        {
          name: 'Cars Search',
          url: '/functions/v1/cars-search',
          method: 'POST',
          description: 'Advanced search functionality across car data',
          parameters: {
            query: 'string',
            filters: 'object',
            limit: 'number'
          },
          responseSchema: {
            results: 'Car[]',
            total: 'number'
          },
          status: 'active'
        },
        {
          name: 'Cars Sync',
          url: '/functions/v1/cars-sync',
          method: 'POST',
          description: 'General car synchronization endpoint',
          parameters: {
            source: 'string',
            options: 'object'
          },
          responseSchema: {
            success: 'boolean',
            synced: 'number'
          },
          status: 'active'
        }
      ];

      // Get database table information - use known tables
      const tablesData = [
        { table_name: 'cars' },
        { table_name: 'cars_cache' },
        { table_name: 'favorite_cars' },
        { table_name: 'inspection_requests' },
        { table_name: 'sync_status' }
      ];

      // Get car data statistics
      let carsCount = 0;
      let activeViewCount = 0;
      let syncStatus = null;

      try {
        const { count } = await supabase
          .from('cars')
          .select('*', { count: 'exact', head: true });
        carsCount = count || 0;
      } catch (err) {
        console.warn('Could not fetch cars count:', err);
      }

      try {
        const { count } = await supabase
          .from('cars_cache')
          .select('*', { count: 'exact', head: true });
        activeViewCount = count || 0;
      } catch (err) {
        console.warn('Could not fetch cars_cache count:', err);
      }

      try {
        const { data } = await supabase
          .from('sync_status')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        syncStatus = data;
      } catch (err) {
        console.warn('Could not fetch sync status:', err);
      }

      // Build data info
      const dataInfo: ApiDataInfo[] = [
        {
          tableName: 'cars',
          recordCount: carsCount || 0,
          lastUpdated: new Date().toISOString(),
          columns: [
            'id', 'make', 'model', 'year', 'price', 'mileage', 'vin', 
            'color', 'fuel', 'transmission', 'condition', 'location',
            'lot_number', 'current_bid', 'buy_now_price', 'status'
          ],
          description: 'Main cars table with all vehicle data'
        },
        {
          tableName: 'cars_cache',
          recordCount: activeViewCount || 0,
          lastUpdated: new Date().toISOString(),
          columns: ['Same as cars table plus cached data'],
          description: 'Cached cars data with enhanced search capabilities'
        }
      ];

      // Available filters and mappings
      const filters = {
        color: {
          silver: 1, purple: 2, orange: 3, green: 4, red: 5, gold: 6,
          charcoal: 7, brown: 8, grey: 9, turquoise: 10, blue: 11,
          bronze: 12, white: 13, cream: 14, black: 15, yellow: 16,
          beige: 17, pink: 18
        },
        fuelType: {
          diesel: 1, electric: 2, hybrid: 3, gasoline: 4, gas: 5,
          flexible: 6, hydrogen: 7
        },
        transmission: {
          automatic: 1, manual: 2
        },
        bodyType: {
          sedan: 1, suv: 2, hatchback: 3, coupe: 4, wagon: 5,
          convertible: 6, pickup: 7, van: 8, minivan: 9, crossover: 10,
          roadster: 11, limousine: 12
        }
      };

      const mappings = {
        sortOptions: [
          'price_asc', 'price_desc', 'year_asc', 'year_desc',
          'mileage_asc', 'mileage_desc', 'make_asc', 'make_desc',
          'created_asc', 'created_desc', 'rank_asc', 'rank_desc'
        ],
        statusValues: ['available', 'sold', 'pending', 'reserved'],
        apiSources: ['encar', 'iaai', 'copart', 'manual']
      };

      const stats: ApiStats = {
        totalEndpoints: endpoints.length,
        activeEndpoints: endpoints.filter(e => e.status === 'active').length,
        totalRecords: (carsCount || 0) + (activeViewCount || 0),
        totalTables: dataInfo.length,
        lastSyncTime: syncStatus?.last_activity_at || syncStatus?.created_at,
        syncStatus: syncStatus?.status
      };

      setApiInfo({
        endpoints,
        dataInfo,
        stats,
        mappings,
        filters
      });

      console.log('✅ API info gathered successfully');

    } catch (err) {
      console.error('❌ Error fetching API info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch API information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiInfo();
  }, []);

  return {
    apiInfo,
    loading,
    error,
    refresh: fetchApiInfo
  };
};