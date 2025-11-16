import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Gauge, Fuel, Settings2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuctionCar {
  stock_no: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  color: string;
  fuel: string;
  price: number;
  image_url: string;
  detail_url: string;
  auction_date: string;
}

const Auctions = () => {
  const [cars, setCars] = useState<AuctionCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuctionCars();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchAuctionCars, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAuctionCars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ssancar-scraper');
      
      if (error) throw error;
      
      if (data?.success && data?.cars) {
        setCars(data.cars);
      }
    } catch (err) {
      console.error('Error fetching auction cars:', err);
      setError('Nuk mund të ngarkohen vetura nga ankandi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Ankandet e Drejtpërdrejta</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ankandet e Drejtpërdrejta</h1>
        <p className="text-muted-foreground">
          Vetura nga ankandet e Koresë së Jugut - të përditësuara në kohë reale
        </p>
        <Badge variant="outline" className="mt-2">
          {cars.length} vetura disponueshme
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cars.map((car) => (
          <Card key={car.stock_no} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 bg-muted">
              {car.image_url && !car.image_url.includes('no_image') ? (
                <img 
                  src={car.image_url} 
                  alt={car.model}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">Nuk ka imazh</span>
                </div>
              )}
              <Badge className="absolute top-2 right-2 bg-background/90">
                #{car.stock_no}
              </Badge>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {car.make} {car.model}
              </h3>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{car.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  <span>{car.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span>{car.transmission}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  <span>{car.fuel}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Oferta fillestare</div>
                  <div className="text-xl font-bold text-primary">
                    ${car.price.toLocaleString()}
                  </div>
                </div>
                <a 
                  href={car.detail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Shiko
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cars.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nuk ka vetura të disponueshme në ankandin e tanishëm
        </div>
      )}
    </div>
  );
};

export default Auctions;
