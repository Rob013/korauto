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

export const useGenerations = (modelId?: string, manufacturerId?: string) => {
  return useQuery({
    queryKey: ['generations', modelId, manufacturerId],
    queryFn: async () => {
      if (!modelId) return [];

      const compositeModelId = manufacturerId ? `${manufacturerId}-${modelId}` : undefined;
      try {
        let query = supabase
          .from('car_grades')
          .select('id,name,car_count,model_id')
          .eq('is_active', true);

        if (compositeModelId) {
          query = query.eq('model_id', compositeModelId);
        } else {
          query = query.like('model_id', `%-${modelId}`);
        }

        const { data: cachedGenerations, error: cachedError } = await query.order('name', { ascending: true });

        if (!cachedError && Array.isArray(cachedGenerations) && cachedGenerations.length > 0) {
          return cachedGenerations.map((generation: any) => {
            const idSegments = String(generation.id).split('-');
            const rawId = idSegments[idSegments.length - 1];
            return {
              id: rawId,
              name: generation.name,
              car_count: generation.car_count || 0,
            };
          });
        }
      } catch (cachedErr) {
        console.warn('[useGenerations] Failed to load cached generations:', cachedErr);
      }

      const { data, error } = await supabase.functions.invoke('secure-cars-api', {
        body: {
          endpoint: `generations/${modelId}`,
          filters: {}
        }
      });

      if (error) throw error;

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