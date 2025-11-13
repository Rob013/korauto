import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useManufacturers = () => {
  return useQuery({
    queryKey: ['manufacturers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useModels = (manufacturerId?: string) => {
  return useQuery({
    queryKey: ['models', manufacturerId],
    queryFn: async () => {
      if (!manufacturerId) return [];
      
      const { data, error } = await supabase
        .rpc('get_models_by_manufacturer', {
          p_manufacturer_id: manufacturerId
        });
      
      if (error) throw error;
      return data;
    },
    enabled: !!manufacturerId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useGrades = (modelId?: string) => {
  return useQuery({
    queryKey: ['grades', modelId],
    queryFn: async () => {
      if (!modelId) return [];
      
      const { data, error } = await supabase.functions.invoke('secure-cars-api', {
        body: {
          endpoint: `generations/${modelId}`,
          filters: {}
        }
      });
      
      if (error) throw error;
      
      // Map API response to expected format
      const generations = data?.data || [];
      return generations.map((g: any) => ({
        id: String(g.id),
        name: g.name,
        car_count: g.cars_qty || 0
      }));
    },
    enabled: !!modelId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useTrims = (modelId?: string) => {
  return useQuery({
    queryKey: ['trims', modelId],
    queryFn: async () => {
      if (!modelId) return [];
      
      const { data, error } = await supabase
        .rpc('get_trims_by_model', {
          p_model_id: modelId
        });
      
      if (error) throw error;
      return data;
    },
    enabled: !!modelId,
    staleTime: 1000 * 60 * 10,
  });
};