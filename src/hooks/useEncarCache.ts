/**
 * useEncarCache Hook
 * 
 * React Query hook for fetching cached Encar car data from Supabase
 * Provides instant loading with automatic refetching and error handling
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { APIFilters } from '@/utils/catalog-filter';

export interface EncarCachedCar {
    vehicle_id: string | number; // Database can return either type
    lot_number?: string;
    vin?: string;
    manufacturer_id?: number;
    manufacturer_name?: string;
    model_id?: number;
    model_name?: string;
    generation_id?: number;
    generation_name?: string;
    grade_name?: string;
    form_year?: string;
    year_month?: string;

    // Odometer details
    mileage?: number;
    mileage_mi?: number;
    odometer_status?: string;

    displacement?: number;
    fuel_type?: string;
    fuel_code?: string;
    transmission?: string;
    color_name?: string;
    body_type?: string;
    seat_count?: number;

    // Price fields
    buy_now_price?: number;
    bid_price?: number;
    final_bid_price?: number;
    estimate_repair_price?: number;
    pre_accident_price?: number;
    clean_wholesale_price?: number;
    actual_cash_value?: number;
    original_price?: number;

    advertisement_status?: string;
    vehicle_type?: string;

    // Images
    photos?: string | any[];
    photos_small?: string | any[];
    images_id?: number;
    options?: string | any;

    // Dates
    registered_date?: string;
    first_advertised_date?: string;
    modified_date?: string;
    view_count?: number;
    subscribe_count?: number;

    // Flags
    has_accident?: boolean;
    inspection_available?: boolean;

    // Lot & sale tracking
    lot_external_id?: string;
    lot_status?: string;
    sale_date?: string;
    sale_date_updated_at?: string;
    bid_updated_at?: string;
    buy_now_updated_at?: string;
    final_bid_updated_at?: string;

    // Damage & condition
    damage_main?: string;
    damage_second?: string;
    airbags_status?: string;
    grade_iaai?: string;
    detailed_title?: string;
    condition_name?: string;

    // Seller
    seller_name?: string;
    seller_type?: string;

    // Dealer
    dealer_name?: string;
    dealer_firm?: string;
    contact_address?: string;

    // Engine
    engine_id?: number;
    engine_name?: string;
    drive_wheel?: string;

    // Metadata
    is_active?: boolean;
    synced_at?: string;
    updated_at?: string;
    data_hash?: string;
    created_at?: string; // Added from original interface
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

            let query = supabase
                .from('encar_cars_cache')
                .select('*', { count: 'exact' })
                .eq('is_active', true);

            // Apply filters
            if (filters.manufacturer_id && filters.manufacturer_id !== 'all') {
                query = query.eq('manufacturer_id', Number(filters.manufacturer_id));
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
        staleTime: options.staleTime ?? 30 * 60 * 1000, // 30 minutes - keep data fresh longer
        gcTime: options.cacheTime ?? 60 * 60 * 1000, // 60 minutes - cache in memory longer
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false
    });
}

/**
 * Transform cached car data to match the existing API format
 * This ensures compatibility with existing components
 */
function transformCachedCarToAPIFormat(cached: EncarCachedCar): any {
    // Parse photos
    let photos: string[] = [];
    let photosSmall: string[] = [];
    try {
        if (cached.photos) {
            const parsed = typeof cached.photos === 'string'
                ? JSON.parse(cached.photos)
                : cached.photos;
            photos = Array.isArray(parsed) ? parsed : [];
        }
        if (cached.photos_small) {
            const parsed = typeof cached.photos_small === 'string'
                ? JSON.parse(cached.photos_small)
                : cached.photos_small;
            photosSmall = Array.isArray(parsed) ? parsed : [];
        }
    } catch (e) {
        console.warn('Error parsing photos:', e);
    }

    // Parse options
    let options = {};
    try {
        if (cached.options) {
            options = typeof cached.options === 'string'
                ? JSON.parse(cached.options)
                : cached.options;
        }
    } catch (e) {
        console.warn('Error parsing options:', e);
    }

    const photoArray = Array.isArray(photos) ? photos : [];

    return {
        id: parseInt(String(cached.vehicle_id)), // Ensure it's a number for id
        year: parseInt(cached.form_year || '0'),
        title: `${cached.manufacturer_name || ''} ${cached.model_name || ''} ${cached.grade_name || ''}`.trim(),
        vin: cached.vin,
        manufacturer: {
            id: cached.manufacturer_id,
            name: cached.manufacturer_name
        },
        model: {
            id: cached.model_id,
            name: cached.model_name,
            manufacturer_id: cached.manufacturer_id
        },
        generation: cached.generation_id ? {
            id: cached.generation_id,
            name: cached.generation_name,
            manufacturer_id: cached.manufacturer_id,
            model_id: cached.model_id
        } : null,
        body_type: cached.body_type ? { name: cached.body_type } : null,
        color: cached.color_name ? { name: cached.color_name, id: 0 } : null,
        engine: (cached.engine_id || cached.engine_name) ? {
            id: cached.engine_id || 0,
            name: cached.engine_name || ''
        } : null,
        transmission: cached.transmission ? { name: cached.transmission, id: 0 } : null,
        drive_wheel: cached.drive_wheel ? { name: cached.drive_wheel, id: 0 } : null,
        vehicle_type: { name: 'automobile', id: 1 },
        fuel: cached.fuel_type ? { name: cached.fuel_type, id: 0 } : null,
        cylinders: null,
        lots: [{
            id: 0,
            lot: cached.lot_number,
            lot_number: cached.lot_number,
            domain: { name: 'Encar', id: 12 },
            external_id: cached.lot_external_id,

            // ENHANCED: Complete odometer with status
            odometer: {
                km: cached.mileage || 0,
                mi: cached.mileage_mi || Math.round((cached.mileage || 0) * 0.621371),
                status: {
                    name: cached.odometer_status || 'actual',
                    id: cached.odometer_status === 'actual' ? 1 : 0
                }
            },

            // ENHANCED: All price fields
            buy_now: cached.buy_now_price,
            bid: cached.bid_price,
            final_bid: cached.final_bid_price,
            estimate_repair_price: cached.estimate_repair_price,
            pre_accident_price: cached.pre_accident_price,
            clean_wholesale_price: cached.clean_wholesale_price,
            actual_cash_value: cached.actual_cash_value,

            // ENHANCED: Sale tracking
            sale_date: cached.sale_date,
            sale_date_updated_at: cached.sale_date_updated_at,
            bid_updated_at: cached.bid_updated_at,
            buy_now_updated_at: cached.buy_now_updated_at,
            final_bid_updated_at: cached.final_bid_updated_at,

            // ENHANCED: Status
            status: cached.lot_status ? {
                name: cached.lot_status,
                id: cached.lot_status === 'sale' ? 3 : 0
            } : { name: 'sale', id: 3 },

            // ENHANCED: Seller
            seller: cached.seller_name,
            seller_type: cached.seller_type,

            // ENHANCED: Condition & damage
            detailed_title: cached.detailed_title,
            damage: {
                main: cached.damage_main,
                second: cached.damage_second
            },
            keys_available: cached.inspection_available || false,
            airbags: cached.airbags_status,
            condition: cached.condition_name ? {
                name: cached.condition_name,
                id: 0
            } : { name: 'run_and_drives', id: 0 },
            grade_iaai: cached.grade_iaai,

            // ENHANCED: Images with metadata
            images: {
                id: cached.images_id || 0,
                small: photosSmall,
                normal: photoArray,
                big: photoArray
            },

            // Insurance and details
            insurance_v2: {
                accidentCnt: cached.has_accident ? 1 : 0,
                hasAccident: cached.has_accident
            },
            details: {
                seats_count: cached.seat_count,
                badge: cached.grade_name,
                inspection_available: cached.inspection_available
            },
            sale_status: cached.advertisement_status
        }],

        // Top-level fields
        lot_number: cached.lot_number,
        status: cached.advertisement_status || 'active',
        sale_status: cached.advertisement_status,
        final_price: cached.buy_now_price,
        domain: { name: 'Encar' },
        source_api: 'encar',
        _cache_source: 'encar_cars_cache',

        // Metadata
        options: options,
        registered_date: cached.registered_date,
        first_advertised_date: cached.first_advertised_date,
        modified_date: cached.modified_date,
        view_count: cached.view_count || 0,
        subscribe_count: cached.subscribe_count || 0,
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
