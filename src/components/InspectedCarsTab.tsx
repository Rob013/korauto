import { useToast } from "@/hooks/use-toast";
import { Loader2, Car, AlertCircle } from "lucide-react";
import LazyCarCard from "@/components/LazyCarCard";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useInspectedCars } from "@/hooks/useInspectedCars";
import { Button } from "@/components/ui/button";

const InspectedCarsTab = () => {
  const { cars, loading, error, lotNumbers } = useInspectedCars();
  const { toast } = useToast();
  const { convertUSDtoEUR } = useCurrencyAPI();

  // Show toast when cars are loaded successfully
  if (cars.length > 0 && !loading && !error) {
    toast({
      title: "Inspected cars loaded",
      description: `Found ${cars.length} inspected car${cars.length !== 1 ? 's' : ''}`,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading inspected cars...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-2xl mx-auto">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Service Temporarily Unavailable</h3>
          <p className="text-muted-foreground mb-6">
            The car database service is currently unavailable. This usually happens in development environments
            where external APIs are not accessible.
          </p>
          <div className="bg-muted/50 border rounded-lg p-6 mb-6">
            <h4 className="font-medium mb-3">Expected Inspected Cars (Lot Numbers):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {lotNumbers.map((lotNumber) => (
                <div key={lotNumber} className="bg-background border rounded px-3 py-2 text-center font-mono text-sm">
                  {lotNumber}
                </div>
              ))}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mx-auto"
          >
            Try Again
          </Button>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Technical Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Inspected Cars Found</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find any cars with the specified lot numbers. They may not be available in the current database.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Looking for lot numbers:</p>
            <p className="font-mono mt-2">
              {lotNumbers.join(", ")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">TE INSPEKTUARA</h2>
        <p className="text-muted-foreground">
          {cars.length} inspected car{cars.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Cars Grid */}
      <div className="grid mobile-car-grid-compact sm:mobile-car-grid gap-2 sm:gap-3 lg:gap-4">
        {cars.map((car) => {
          const lot = car.lots?.[0];
          const usdPrice = lot?.buy_now || 25000;
          const price = convertUSDtoEUR(Math.round(usdPrice + 2200));
          const lotNumber = car.lot_number || lot?.lot || "";

          return (
            <div key={car.id} id={`car-${car.id}`}>
              <LazyCarCard
                id={car.id}
                make={car.manufacturer?.name || "Unknown"}
                model={car.model?.name || "Unknown"}
                year={car.year}
                price={price}
                image={lot?.images?.normal?.[0] || lot?.images?.big?.[0]}
                vin={car.vin}
                mileage={
                  lot?.odometer?.km
                    ? `${lot.odometer.km.toLocaleString()} km`
                    : undefined
                }
                transmission={car.transmission?.name}
                fuel={car.fuel?.name}
                color={car.color?.name}
                lot={lotNumber}
                title={car.title || ""}
                status={Number(car.status || lot?.status || 1)}
                sale_status={car.sale_status || lot?.sale_status}
                final_price={car.final_price || lot?.final_price}
                insurance_v2={lot?.insurance_v2}
                details={lot?.details}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InspectedCarsTab;