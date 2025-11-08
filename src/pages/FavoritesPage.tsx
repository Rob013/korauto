import { lazy, Suspense, useMemo } from "react";
import Header from "@/components/Header";
import CarCard from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";

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

const FavoritesPage = () => {
  const { user, favorites, loading } = useFavorites();
  const navigate = useNavigate();
  const favoriteCards = useMemo(
    () =>
      favorites.map((favorite) => ({
        id: favorite.id,
        carId: favorite.car_id,
        make: favorite.car_make ?? "Unknown",
        model: favorite.car_model ?? "Unknown",
        year: favorite.car_year ?? 0,
        price: favorite.car_price ?? 0,
        image: favorite.car_image ?? undefined,
      })),
    [favorites]
  );

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
                  {favoriteCards.length} makinë{favoriteCards.length !== 1 ? 'a' : ''} e ruajtur
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu për të Shfletuar
          </Button>
        </div>

          {favoriteCards.length === 0 ? (
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
              {favoriteCards.map((favorite) => (
              <CarCard
                  key={favorite.id}
                  id={favorite.carId}
                  make={favorite.make}
                  model={favorite.model}
                  year={favorite.year}
                  price={favorite.price}
                  image={favorite.image}
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