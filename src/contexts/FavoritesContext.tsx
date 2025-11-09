import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FavoritesContextType {
  favorites: Set<string>;
  isLoading: boolean;
  isFavorite: (carId: string) => boolean;
  toggleFavorite: (carId: string, carData: {
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
  }) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Batch fetch all favorites once per session
  const fetchFavorites = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setFavorites(new Set());
        setUserId(null);
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      // Single batched query for all favorites
      const { data, error } = await supabase
        .from('favorite_cars')
        .select('car_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
      } else {
        const favoriteIds = new Set(data?.map(fav => fav.car_id) || []);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize favorites on mount
  useEffect(() => {
    fetchFavorites();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchFavorites();
      } else {
        setFavorites(new Set());
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchFavorites]);

  const isFavorite = useCallback((carId: string) => {
    return favorites.has(carId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (
    carId: string,
    carData: {
      make: string;
      model: string;
      year: number;
      price: number;
      image?: string;
    }
  ) => {
    if (!userId) {
      throw new Error('User not logged in');
    }

    const isFav = favorites.has(carId);

    try {
      if (isFav) {
        // Remove from favorites
        await supabase
          .from('favorite_cars')
          .delete()
          .eq('user_id', userId)
          .eq('car_id', carId);

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(carId);
          return newSet;
        });
      } else {
        // Add to favorites
        await supabase
          .from('favorite_cars')
          .insert({
            user_id: userId,
            car_id: carId,
            car_make: carData.make,
            car_model: carData.model,
            car_year: carData.year,
            car_price: carData.price,
            car_image: carData.image
          });

        setFavorites(prev => new Set(prev).add(carId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }, [userId, favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        refreshFavorites: fetchFavorites
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};
