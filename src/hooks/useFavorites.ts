import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

export const useFavorites = () => {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check auth and load favorites
  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await loadFavorites(user.id);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadFavorites(session.user.id);
      } else {
        setFavorites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorite_cars')
        .select('car_id')
        .eq('user_id', userId);

      if (error) throw error;
      
      setFavorites(data?.map(fav => fav.car_id) || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (carId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save favorites",
        variant: "destructive"
      });
      return false;
    }

    try {
      const isFavorited = favorites.includes(carId);
      
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_cars')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', carId);

        if (error) throw error;
        
        setFavorites(prev => prev.filter(id => id !== carId));
        
        toast({
          title: "Removed from Favorites",
          description: "Car removed from your favorites",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_cars')
          .insert({
            user_id: user.id,
            car_id: carId
          });

        if (error) throw error;
        
        setFavorites(prev => [...prev, carId]);
        
        toast({
          title: "Added to Favorites",
          description: "Car saved to your favorites",
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update favorites",
        variant: "destructive"
      });
      
      return false;
    }
  };

  const isFavorited = (carId: string) => favorites.includes(carId);

  return {
    user,
    favorites,
    loading,
    toggleFavorite,
    isFavorited
  };
};