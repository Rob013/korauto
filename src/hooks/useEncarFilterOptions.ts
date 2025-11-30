/**
 * Hook to fetch available filter options from Encar cache
 * Returns actual values from the database for dynamic filtering
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface FilterOptions {
    fuelTypes: FilterOption[];
    transmissions: FilterOption[];
    bodyTypes: FilterOption[];
    colors: FilterOption[];
}

// Map Korean values to Albanian labels
const FUEL_TYPE_LABELS: Record<string, string> = {
    '가솔린': 'Benzinë',
    'Gasoline': 'Benzinë',
    '디젤': 'Dizel',
    'Diesel': 'Dizel',
    '하이브리드': 'Hibrid',
    'Hybrid': 'Hibrid',
    '전기': 'Elektrik',
    'Electric': 'Elektrik',
    'LPG': 'Gaz',
    'CNG': 'Gaz'
};

const TRANSMISSION_LABELS: Record<string, string> = {
    '자동': 'Automatik',
    'Automatic': 'Automatik',
    'Auto': 'Automatik',
    '수동': 'Manual',
    'Manual': 'Manual',
    'CVT': 'CVT',
    '세미오토': 'Semi-Automatik'
};

const BODY_TYPE_LABELS: Record<string, string> = {
    '세단': 'Sedan',
    'Sedan': 'Sedan',
    'SUV': 'SUV',
    '해치백': 'Hatchback',
    'Hatchback': 'Hatchback',
    '왜건': 'Wagon',
    'Wagon': 'Wagon',
    '쿠페': 'Coupe',
    'Coupe': 'Coupe',
    '컨버터블': 'Convertible',
    'Convertible': 'Convertible',
    '밴': 'Van',
    'Van': 'Van',
    '트럭': 'Truck',
    'Truck': 'Truck'
};

const COLOR_LABELS: Record<string, string> = {
    '검정': 'E zezë',
    'Black': 'E zezë',
    '흰색': 'E bardhë',
    'White': 'E bardhë',
    '회색': 'Gri',
    'Gray': 'Gri',
    'Grey': 'Gri',
    '은색': 'Argjend',
    'Silver': 'Argjend',
    '파랑': 'Blu',
    'Blue': 'Blu',
    '빨강': 'E kuqe',
    'Red': 'E kuqe',
    '갈색': 'Kafe',
    'Brown': 'Kafe',
    '초록': 'Jeshile',
    'Green': 'Jeshile',
    '주황': 'Portokalli',
    'Orange': 'Portokalli',
    '금색': 'Ari',
    'Gold': 'Ari'
};

/**
 * Hook to fetch available filter options from the database
 */
export function useEncarFilterOptions() {
    return useQuery({
        queryKey: ['encar-filter-options'],
        queryFn: async (): Promise<FilterOptions> => {
            console.log('🔍 Fetching filter options from Encar cache');

            try {
                // Fetch distinct values for each filter type
                const [fuelTypesResult, transmissionsResult, bodyTypesResult, colorsResult] = await Promise.all([
                    // Fuel types
                    supabase
                        .from('encar_cars_cache')
                        .select('fuel_type')
                        .eq('is_active', true)
                        .not('fuel_type', 'is', null),
                    
                    // Transmissions
                    supabase
                        .from('encar_cars_cache')
                        .select('transmission')
                        .eq('is_active', true)
                        .not('transmission', 'is', null),
                    
                    // Body types
                    supabase
                        .from('encar_cars_cache')
                        .select('body_type')
                        .eq('is_active', true)
                        .not('body_type', 'is', null),
                    
                    // Colors
                    supabase
                        .from('encar_cars_cache')
                        .select('color_name')
                        .eq('is_active', true)
                        .not('color_name', 'is', null)
                ]);

                // Check for errors
                if (fuelTypesResult.error) throw fuelTypesResult.error;
                if (transmissionsResult.error) throw transmissionsResult.error;
                if (bodyTypesResult.error) throw bodyTypesResult.error;
                if (colorsResult.error) throw colorsResult.error;

                const fuelTypesData = fuelTypesResult.data || [];
                const transmissionsData = transmissionsResult.data || [];
                const bodyTypesData = bodyTypesResult.data || [];
                const colorsData = colorsResult.data || [];

                console.log('📊 Raw filter data:', {
                    fuelTypes: fuelTypesData.length,
                    transmissions: transmissionsData.length,
                    bodyTypes: bodyTypesData.length,
                    colors: colorsData.length
                });

            // Process fuel types
            const fuelTypeMap = new Map<string, number>();
            fuelTypesData.forEach(item => {
                if (item.fuel_type) {
                    fuelTypeMap.set(item.fuel_type, (fuelTypeMap.get(item.fuel_type) || 0) + 1);
                }
            });

            const fuelTypes: FilterOption[] = Array.from(fuelTypeMap.entries())
                .map(([value, count]) => ({
                    value,
                    label: FUEL_TYPE_LABELS[value] || value,
                    count
                }))
                .sort((a, b) => b.count - a.count);

            // Process transmissions
            const transmissionMap = new Map<string, number>();
            transmissionsData.forEach(item => {
                if (item.transmission) {
                    transmissionMap.set(item.transmission, (transmissionMap.get(item.transmission) || 0) + 1);
                }
            });

            const transmissions: FilterOption[] = Array.from(transmissionMap.entries())
                .map(([value, count]) => ({
                    value,
                    label: TRANSMISSION_LABELS[value] || value,
                    count
                }))
                .sort((a, b) => b.count - a.count);

            // Process body types
            const bodyTypeMap = new Map<string, number>();
            bodyTypesData.forEach(item => {
                if (item.body_type) {
                    bodyTypeMap.set(item.body_type, (bodyTypeMap.get(item.body_type) || 0) + 1);
                }
            });

            const bodyTypes: FilterOption[] = Array.from(bodyTypeMap.entries())
                .map(([value, count]) => ({
                    value,
                    label: BODY_TYPE_LABELS[value] || value,
                    count
                }))
                .sort((a, b) => b.count - a.count);

            // Process colors
            const colorMap = new Map<string, number>();
            colorsData.forEach(item => {
                if (item.color_name) {
                    colorMap.set(item.color_name, (colorMap.get(item.color_name) || 0) + 1);
                }
            });

            const colors: FilterOption[] = Array.from(colorMap.entries())
                .map(([value, count]) => ({
                    value,
                    label: COLOR_LABELS[value] || value,
                    count
                }))
                .sort((a, b) => b.count - a.count);

                console.log('✅ Filter options loaded:', {
                    fuelTypes: fuelTypes.length,
                    transmissions: transmissions.length,
                    bodyTypes: bodyTypes.length,
                    colors: colors.length
                });

                return {
                    fuelTypes,
                    transmissions,
                    bodyTypes,
                    colors
                };
            } catch (error) {
                console.error('❌ Error fetching filter options:', error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - refresh more often
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
        retryDelay: 1000
    });
}
