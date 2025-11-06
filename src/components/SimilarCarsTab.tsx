import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSecureAuctionAPI } from '@/hooks/useSecureAuctionAPI';
import { useCurrencyAPI } from '@/hooks/useCurrencyAPI';
import { hasRealPricing, calculateFinalPriceEUR, filterCarsWithBuyNowPricing } from '@/utils/carPricing';
import CarCard from './CarCard';

interface SimilarCarsTabProps {
  carMake: string;
  carModel: string;
  currentCarId: string;
}

const SimilarCarsTab = ({ carMake, carModel, currentCarId }: SimilarCarsTabProps) => {
  const navigate = useNavigate();
  const { cars, fetchCars, fetchManufacturers } = useSecureAuctionAPI();
  const { convertUSDtoEUR, exchangeRate } = useCurrencyAPI();
  const [similarCars, setSimilarCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSimilarCars = async () => {
      setLoading(true);
      try {
        // Get all manufacturers to find the current car's manufacturer ID
        const manufacturers = await fetchManufacturers();
        const currentManufacturer = manufacturers.find(m => 
          (m.name || '').toLowerCase() === (carMake || '').toLowerCase()
        );

        if (currentManufacturer) {
          // Fetch cars from the same manufacturer
          await fetchCars(1, { manufacturer_id: currentManufacturer.id.toString() }, true);
        }
      } catch (error) {
        console.error('Failed to load similar cars:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSimilarCars();
  }, [carMake, carModel, fetchCars, fetchManufacturers]);

  useEffect(() => {
    // Filter cars to show same brand, exclude current car, and only include cars with buy_now pricing
    const filtered = cars
      .filter(car => 
        (car.manufacturer?.name || '').toLowerCase() === (carMake || '').toLowerCase() &&
        car.id !== currentCarId &&
        car.lots?.[0]?.buy_now && car.lots[0].buy_now > 0
      )
      .slice(0, 4); // Show max 4 similar cars

    setSimilarCars(filtered);
  }, [cars, carMake, currentCarId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-lg text-foreground">Makina të Ngjashme</h4>
        <div className="text-sm text-muted-foreground">
          Duke ngarkuar makina të ngjashme...
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-lg text-foreground">Makina të Ngjashme</h4>
      <div className="text-sm text-muted-foreground">
        Zbuloni makina të tjera të markës {carMake} në inventarin tonë:
      </div>
      
      {similarCars.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {similarCars.map((car) => {
              const lot = car.lots?.[0];
              // Only use buy_now price, no fallbacks  
              const usdPrice = lot?.buy_now;
              const price = calculateFinalPriceEUR(usdPrice, exchangeRate.rate);
              
              return (
                <div 
                  key={car.id} 
                  className="p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors bg-card"
                  onClick={() => navigate(`/car/${lot?.lot || car.id}`)}
                >
                  <div className="font-medium text-foreground">
                    {car.year} {typeof car.manufacturer === 'object' ? car.manufacturer?.name || '' : car.manufacturer || ''} {typeof car.model === 'object' ? car.model?.name || '' : car.model || ''}
                  </div>
                  <div className="text-primary font-semibold">€{price.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : 'Kilometrazhi i pa specifikuar'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Klic për më shumë detaje</div>
                </div>
              );
            })}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full mt-6 h-12 text-base font-medium border-2 hover:bg-primary hover:text-primary-foreground transition-colors" 
            onClick={() => navigate(`/catalog?manufacturer_id=${similarCars[0]?.manufacturer?.id || ''}`)}
          >
            <ChevronRight className="h-5 w-5 mr-2" />
            Shiko të Gjitha Makinat {carMake}
          </Button>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Aktualisht nuk kemi makina të tjera të markës {carMake} në inventar.
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/catalog')}
            className="border-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="h-5 w-5 mr-2" />
            Shiko të Gjitha Makinat
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimilarCarsTab;