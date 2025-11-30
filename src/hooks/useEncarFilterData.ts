import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getBrandLogo } from '@/data/brandLogos';

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
    image?: string;
}

export interface Manufacturer extends FilterOption {
    id: number;
    name: string;
    cars_qty: number;
}

export interface Model extends FilterOption {
    id: number;
    name: string;
    manufacturer_id: number;
}

export interface Generation extends FilterOption {
    id: number;
    name: string;
    model_id: number;
}

/**
 * Hook to fetch filter data from the pre-computed metadata table
 * This ensures high performance and perfect consistency with the cached cars
 */
export const useEncarFilterData = () => {

    // Fetch manufacturers with counts
    const fetchManufacturers = async (): Promise<Manufacturer[]> => {
        try {
            const { data, error } = await supabase
                .from('encar_filter_metadata')
                .select('filter_value, car_count')
                .eq('filter_type', 'manufacturer')
                .order('car_count', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => {
                const value = JSON.parse(item.filter_value);
                return {
                    value: value.id.toString(),
                    label: `${value.name} (${item.car_count})`,
                    id: value.id,
                    name: value.name,
                    cars_qty: item.car_count,
                    count: item.car_count,
                    image: getBrandLogo(value.name)
                };
            });
        } catch (err) {
            console.error('Error fetching manufacturers:', err);
            return [];
        }
    };

    // Fetch models for a manufacturer
    const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
        try {
            const { data, error } = await supabase
                .from('encar_filter_metadata')
                .select('filter_value, car_count')
                .eq('filter_type', 'model')
                .eq('parent_filter', manufacturerId)
                .order('car_count', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => {
                const value = JSON.parse(item.filter_value);
                return {
                    value: value.id.toString(),
                    label: `${value.name} (${item.car_count})`,
                    id: value.id,
                    name: value.name,
                    manufacturer_id: Number(manufacturerId),
                    count: item.car_count
                };
            });
        } catch (err) {
            console.error('Error fetching models:', err);
            return [];
        }
    };

    // Fetch generations for a model
    const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
        try {
            const { data, error } = await supabase
                .from('encar_filter_metadata')
                .select('filter_value, car_count')
                .eq('filter_type', 'generation')
                .eq('parent_filter', modelId)
                .order('car_count', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => {
                const value = JSON.parse(item.filter_value);
                return {
                    value: value.id.toString(),
                    label: `${value.name} (${item.car_count})`,
                    id: value.id,
                    name: value.name,
                    model_id: Number(modelId),
                    count: item.car_count
                };
            });
        } catch (err) {
            console.error('Error fetching generations:', err);
            return [];
        }
    };

    // Fetch simple filter options (fuel, transmission, etc.)
    const fetchSimpleOptions = async (type: 'fuel_type' | 'transmission' | 'body_type' | 'color'): Promise<FilterOption[]> => {
        try {
            const { data, error } = await supabase
                .from('encar_filter_metadata')
                .select('filter_value, car_count')
                .eq('filter_type', type)
                .order('car_count', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                value: item.filter_value,
                label: `${item.filter_value} (${item.car_count})`,
                count: item.car_count
            }));
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            return [];
        }
    };

    return {
        fetchManufacturers,
        fetchModels,
        fetchGenerations,
        fetchSimpleOptions
    };
};
