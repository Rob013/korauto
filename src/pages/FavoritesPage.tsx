import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Header";
import CarCard from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Footer = lazy(() => import("@/components/Footer"));

const FooterSkeleton = () => (
  <footer className="bg-card">
    <div className="container-responsive py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </footer>
);

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
  const { toast } = useToast();

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
        .from("favorite_cars")
        .select("id, car_id, user_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setFavorites([]);
        return;
      }

      const carIds = Array.from(new Set(data.map((favorite) => favorite.car_id).filter(Boolean)));

      let carsById: Record<string, FavoriteCar["cars"]> = {};

      if (carIds.length > 0) {
        const { data: carsData, error: carsError } = await supabase
          .from("cars")
          .select("id, make, model, year, price, image_url")
          .in("id", carIds);

        if (carsError) {
          throw carsError;
        }

        carsById = (carsData || []).reduce<Record<string, FavoriteCar["cars"]>>((acc, car) => {
          acc[car.id] = {
            make: car.make || "Unknown",
            model: car.model || "Unknown",
            year: car.year || 0,
            price: car.price || 0,
            image_url: car.image_url || undefined
          };
          return acc;
        }, {});
      }

      const favoritesWithCars: FavoriteCar[] = data.map((favorite) => ({
        ...favorite,
        cars: carsById[favorite.car_id] || undefined
      }));

      setFavorites(favoritesWithCars);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Nuk mund të ngarkohen të preferuarat",
        description: "Diçka shkoi keq gjatë marrjes së të dhënave. Ju lutemi provoni përsëri.",
        variant: "destructive"
      });
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-responsive py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Duhet të Kyçeni</h1>
          <p className="text-muted-foreground mb-8">
            Ju lutemi kyçuni për të parë makinat tuaja të preferuara
          </p>
          <div className="space-x-4">
            <Button onClick={() => navigate('/auth')}>
              Kyçu / Regjistrohu
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu në Kryefaqe
            </Button>
          </div>
        </div>
        <Suspense fallback={<FooterSkeleton />}>
          <Footer />
        </Suspense>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-responsive py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your favorites...</p>
        </div>
        <Suspense fallback={<FooterSkeleton />}>
          <Footer />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container-responsive py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold">Makinat e Mia të Preferuara</h1>
              <p className="text-muted-foreground">
                {favorites.length} makinë{favorites.length !== 1 ? 'a' : ''} e ruajtur
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu për të Shfletuar
          </Button>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4">Asnjë të Preferuar Akoma</h2>
            <p className="text-muted-foreground mb-8">
              Filloni të shfletoni makinat dhe klikoni ikonën e zemrës për të ruajtur të preferuarat tuaja
            </p>
            <Button onClick={() => navigate('/')}>
              Shfleto Makinat
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
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default FavoritesPage;