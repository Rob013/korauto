import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFavoritesBatch = (carIds: string[]) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const checkFavorites = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setFavorites(new Set());
        return;
      }

      // Batch query instead of individual requests
      const { data, error } = await supabase
        .from('favorite_cars')
        .select('car_id')
        .eq('user_id', user.user.id)
        .in('car_id', ids);

      if (error) {
        console.error('Error checking favorites:', error);
        return;
      }

      const favoriteSet = new Set(data?.map(item => item.car_id) || []);
      setFavorites(favoriteSet);
    } catch (error) {
      console.error('Error in batch favorites check:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (carIds.length > 0) {
      checkFavorites(carIds);
    }
  }, [carIds, checkFavorites]);

  const isFavorite = useCallback((carId: string) => {
    return favorites.has(carId);
  }, [favorites]);

  return { favorites, loading, isFavorite, refetch: () => checkFavorites(carIds) };
};