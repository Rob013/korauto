import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FavoriteCar {
  id: string;
  car_id: string;
  user_id: string;
  created_at: string;
  // Car details from join
  cars?: {
    make: string;
    model: string;
    year: number;
    price: number;
    image_url?: string;
  };
}

const FavoritesPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<FavoriteCar[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        fetchFavorites(user.id);
      } else {
        setLoading(false);
      }
    };
    
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchFavorites(session.user.id);
      } else {
        setFavorites([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorite_cars')
        .select(`
          id,
          car_id,
          user_id,
          created_at,
          cars!favorite_cars_car_id_fkey (
            make,
            model,
            year,
            price,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-8">
            Please login to view your favorite cars
          </p>
          <div className="space-x-4">
            <Button onClick={() => navigate('/auth')}>
              Login / Sign Up
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your favorites...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold">My Favorite Cars</h1>
              <p className="text-muted-foreground">
                {favorites.length} saved car{favorites.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-8">
              Start browsing cars and click the heart icon to save your favorites
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Cars
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <CarCard
                key={favorite.id}
                id={favorite.car_id}
                make={favorite.cars?.make || 'Unknown'}
                model={favorite.cars?.model || 'Unknown'}
                year={favorite.cars?.year || 0}
                price={favorite.cars?.price || 0}
                image={favorite.cars?.image_url}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FavoritesPage;