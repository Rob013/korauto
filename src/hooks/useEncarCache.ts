/**
 * useEncarCache Hook
 * 
 * React Query hook for fetching cached Encar car data from Supabase
 * Provides instant loading with automatic refetching and error handling
 * Optimized for performance with cached data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { APIFilters } from '@/utils/catalog-filter';

export interface EncarCachedCar {
    id: number;
    vehicle_id: number;
    lot_number: string | null;
    vin: string | null;
    manufacturer_id: number | null;
    manufacturer_name: string | null;
    model_id: number | null;
    model_name: string | null;
    generation_id: number | null;
    generation_name: string | null;
    grade_name: string | null;
    form_year: string | null;
    year_month: string | null;
    mileage: number | null;
    displacement: number | null;
    fuel_type: string | null;
    fuel_code: string | null;
    transmission: string | null;
    color_name: string | null;
    body_type: string | null;
    seat_count: number | null;
    buy_now_price: number | null;
    original_price: number | null;
    advertisement_status: string | null;
    vehicle_type: string | null;
    photos: any;
    options: any;
    registered_date: string | null;
    first_advertised_date: string | null;
    modified_date: string | null;
    view_count: number;
    subscribe_count: number;
    has_accident: boolean;
    inspection_available: boolean;
    dealer_name: string | null;
    dealer_firm: string | null;
    contact_address: string | null;
    synced_at: string;
    data_hash: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface UseEncarCacheOptions {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
}

/**
 * Hook to fetch cached Encar cars from Supabase
 */
export function useEncarCache(
    filters: APIFilters = {},
    page: number = 1,
    perPage: number = 200,
    options: UseEncarCacheOptions = {}
) {
    return useQuery({
        queryKey: ['encar-cache', filters, page, perPage],
        queryFn: async () => {
            console.log('🔍 Fetching from Encar cache:', { filters, page, perPage });
            
            // Log cache query details
            console.log('📊 Cache query state:', {
                hasFilters: Object.keys(filters).length > 0,
                filterKeys: Object.keys(filters),
                isActive: true
            });

            let query = supabase
                .from('encar_cars_cache')
                .select('*', { count: 'exact' })
                .eq('is_active', true);

            // Apply filters (only if explicitly set, empty object means show all)
            if (filters.manufacturer_id && filters.manufacturer_id !== 'all') {
                const manufacturerId = Number(filters.manufacturer_id);
                if (!isNaN(manufacturerId) && manufacturerId > 0) {
                    query = query.eq('manufacturer_id', manufacturerId);
                }
            }

            if (filters.model_id && filters.model_id !== 'all') {
                query = query.eq('model_id', Number(filters.model_id));
            }

            if (filters.generation_id && filters.generation_id !== 'all') {
                query = query.eq('generation_id', Number(filters.generation_id));
            }

            if (filters.fuel_type) {
                query = query.eq('fuel_type', filters.fuel_type);
            }

            if (filters.transmission) {
                query = query.eq('transmission', filters.transmission);
            }

            if (filters.color) {
                query = query.eq('color_name', filters.color);
            }

            if (filters.body_type) {
                query = query.eq('body_type', filters.body_type);
            }

            if (filters.seats_count) {
                query = query.eq('seat_count', Number(filters.seats_count));
            }

            // Year range
            if (filters.from_year) {
                query = query.gte('form_year', filters.from_year);
            }
            if (filters.to_year) {
                query = query.lte('form_year', filters.to_year);
            }

            // Price range
            if (filters.buy_now_price_from) {
                query = query.gte('buy_now_price', filters.buy_now_price_from);
            }
            if (filters.buy_now_price_to) {
                query = query.lte('buy_now_price', filters.buy_now_price_to);
            }

            // Odometer range
            if (filters.odometer_from_km) {
                query = query.gte('mileage', filters.odometer_from_km);
            }
            if (filters.odometer_to_km) {
                query = query.lte('mileage', filters.odometer_to_km);
            }

            // Search
            if (filters.search) {
                query = query.or(`manufacturer_name.ilike.%${filters.search}%,model_name.ilike.%${filters.search}%,grade_name.ilike.%${filters.search}%`);
            }

            // Pagination
            const from = (page - 1) * perPage;
            const to = from + perPage - 1;
            query = query.range(from, to);

            // Sorting - default to recently synced (newest first)
            query = query.order('synced_at', { ascending: false });

            const { data, error, count } = await query;

            if (error) {
                console.error('❌ Supabase cache query error:', error);
                throw error;
            }

            console.log(`✅ Fetched ${data?.length || 0} cars from cache (total: ${count})`);

            // Transform cached data to match existing car format
            const transformedCars = (data || []).map(transformCachedCarToAPIFormat);

            return {
                cars: transformedCars,
                totalCount: count || 0,
                page,
                perPage,
                totalPages: Math.ceil((count || 0) / perPage)
            };
        },
        enabled: options.enabled !== false,
        staleTime: 5 * 1000, // 5 seconds - quick refetch for filter changes
        gcTime: 5 * 60 * 1000, // 5 minutes cache time
        refetchOnWindowFocus: false,
        refetchOnMount: true, // Always refetch on mount to get fresh data
        refetchOnReconnect: false,
        // Network waterfall optimization
        networkMode: 'online',
        // Retry on error
        retry: 1,
    });
}

/**
 * Transform cached car data to match the existing API format
 * This ensures compatibility with existing components
 */
function transformCachedCarToAPIFormat(cached: EncarCachedCar): any {
    // Parse JSON fields
    const photos = typeof cached.photos === 'string' ? JSON.parse(cached.photos) : (cached.photos || []);
    const options = typeof cached.options === 'string' ? JSON.parse(cached.options) : (cached.options || {});

    // Extract image arrays - Encar typically has photo URLs in array
    const photoArray = Array.isArray(photos) ? photos : [];

    return {
        // Core identifiers
        id: String(cached.vehicle_id), // Important: string ID for React keys
        vehicleId: cached.vehicle_id,
        vehicle_id: cached.vehicle_id,
        lot_number: cached.lot_number,
        vehicleNo: cached.lot_number,
        vin: cached.vin,

        // IDs for filters
        manufacturer_id: cached.manufacturer_id,
        model_id: cached.model_id,
        generation_id: cached.generation_id,

        // Nested objects with .name property (required by catalog)
        manufacturer: {
            id: cached.manufacturer_id,
            name: cached.manufacturer_name || 'Unknown'
        },
        model: {
            id: cached.model_id,
            name: cached.model_name || 'Unknown'
        },
        transmission: {
            name: cached.transmission || 'Unknown'
        },
        color: {
            name: cached.color_name
        },

        // Category
        category: {
            manufacturerName: cached.manufacturer_name,
            modelName: cached.model_name,
            modelGroupName: cached.generation_name,
            gradeName: cached.grade_name,
            formYear: cached.form_year,
            yearMonth: cached.year_month,
            originPrice: cached.original_price
        },

        // Specs
        spec: {
            mileage: cached.mileage,
            displacement: cached.displacement,
            fuelName: cached.fuel_type,
            fuelCd: cached.fuel_code,
            transmissionName: cached.transmission,
            colorName: cached.color_name,
            bodyName: cached.body_type,
            seatCount: cached.seat_count
        },

        // For compatibility with existing code
        year: cached.form_year ? parseInt(cached.form_year) : null,
        title: `${cached.form_year || ''} ${cached.manufacturer_name || ''} ${cached.model_name || ''}`.trim(),
        odometer: cached.mileage,
        fuel: cached.fuel_type,
        body_type: cached.body_type,
        seats: cached.seat_count,

        // Pricing - format for existing components
        advertisement: {
            price: cached.buy_now_price,
            status: cached.advertisement_status
        },
        buy_now: cached.buy_now_price,
        price: cached.buy_now_price,

        // CRITICAL: Lots array structure (catalog expects this!)
        lots: [{
            lot: cached.lot_number,
            buy_now: cached.buy_now_price,

            // Images in proper structure for catalog
            images: {
                normal: photoArray,  // All photos as "normal" size
                big: photoArray      // Same photos as "big" size (Encar doesn't distinguish)
            },

            // Odometer in proper structure
            odometer: {
                km: cached.mileage || 0,
                mi: cached.mileage ? Math.round(cached.mileage * 0.621371) : 0
            },

            // Insurance/accident info
            insurance_v2: {
                accidentCnt: cached.has_accident ? 1 : 0,
                hasAccident: cached.has_accident
            },

            // Additional details
            details: {
                seats_count: cached.seat_count,
                badge: cached.grade_name,
                inspection_available: cached.inspection_available
            },

            status: cached.advertisement_status,
            sale_status: cached.advertisement_status
        }],

        // Also provide images at top level for backward compatibility
        photos: photoArray,
        images: photoArray,

        // Status
        status: cached.advertisement_status,
        vehicleType: cached.vehicle_type,

        // Options
        options: options,

        // Management
        manage: {
            registDateTime: cached.registered_date,
            firstAdvertisedDateTime: cached.first_advertised_date,
            modifyDateTime: cached.modified_date,
            viewCount: cached.view_count,
            subscribeCount: cached.subscribe_count
        },

        // Condition
        condition: {
            accident: {
                recordView: cached.has_accident,
                count: cached.has_accident ? 1 : 0
            },
            inspection: {
                formats: cached.inspection_available ? ['available'] : [],
                available: cached.inspection_available
            }
        },

        // Dealer
        partnership: {
            dealer: {
                name: cached.dealer_name,
                firm: {
                    name: cached.dealer_firm
                }
            }
        },
        dealer_name: cached.dealer_name,
        dealer_firm: cached.dealer_firm,

        // Contact
        contact: {
            address: cached.contact_address
        },

        // Source/domain for badge display
        domain: {
            name: 'Encar'
        },
        source_api: 'encar',

        // Cache metadata
        _cached: true,
        _synced_at: cached.synced_at,
        _cache_source: 'encar_cars_cache'
    };
}

/**
 * Hook to get the last sync status
 */
export function useEncarSyncStatus() {
    return useQuery({
        queryKey: ['encar-sync-status'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('encar_sync_status')
                .select('*')
                .order('sync_started_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching sync status:', error);
                return null;
            }

            return data;
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchInterval: 2 * 60 * 1000 // Refetch every 2 minutes
    });
}

/**
 * Hook to check if cache is available and healthy
 */
export function useEncarCacheHealth() {
    return useQuery({
        queryKey: ['encar-cache-health'],
        queryFn: async () => {
            // Check if cache has data
            const { count, error } = await supabase
                .from('encar_cars_cache')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (error) {
                return {
                    available: false,
                    carCount: 0,
                    error: error.message
                };
            }

            // Get last sync time
            const { data: lastSync } = await supabase
                .from('encar_cars_cache')
                .select('synced_at')
                .order('synced_at', { ascending: false })
                .limit(1)
                .single();

            const lastSyncTime = lastSync?.synced_at ? new Date(lastSync.synced_at) : null;
            const minutesSinceSync = lastSyncTime
                ? Math.floor((Date.now() - lastSyncTime.getTime()) / 1000 / 60)
                : null;

            return {
                available: (count || 0) > 0,
                carCount: count || 0,
                lastSyncTime,
                minutesSinceSync,
                isStale: minutesSinceSync ? minutesSinceSync > 30 : true
            };
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
    });
}
