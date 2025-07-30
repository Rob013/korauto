import LazyCarCard from "./LazyCarCard";
import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useSecureAuctionAPI } from "@/hooks/useSecureAuctionAPI";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import {
  useSortedCars,
  getSortOptions,
  SortOption,
} from "@/hooks/useSortedCars";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

const HomeCarsSection = memo(() => {
  const navigate = useNavigate();
  const {
    cars,
    loading,
    error,
    fetchCars,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchFilterCounts,
  } = useSecureAuctionAPI();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showAllCars, setShowAllCars] = useState(false);


  // Type conversion to match the sorting hook interface
  const carsForSorting = cars.map((car) => ({
    ...car,
    status: String(car.status || ""),
    lot_number: String(car.lot_number || ""),
    cylinders: Number(car.cylinders || 0),
  }));

  // Use normal sorting on cars
  const sortedCars = useSortedCars(carsForSorting, sortBy);

  // Show 50 cars (daily rotation)
  const displayedCars = showAllCars
    ? sortedCars
    : sortedCars.slice(0, 50);

  useEffect(() => {
    // Calculate daily page based on day of month (1-31)
    const today = new Date();
    const dayOfMonth = today.getDate(); // 1-31
    const dailyPage = ((dayOfMonth - 1) % 10) + 1; // Cycle through pages 1-10

    // Load initial data with 50 cars from daily page
    fetchCars(dailyPage, { per_page: "50" }, true);
  }, []);


  return (
    <section id="cars" className="py-3 sm:py-4 lg:py-6 bg-secondary/30">
      <div className="container-responsive">
        <div className="text-center mb-3 sm:mb-4">
          <div className="flex justify-center mb-3">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-base" 
              onClick={() => window.location.href = '/catalog'}
            >
              Kërko makinën tënde
            </Button>
          </div>
          
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 text-foreground">
            Makinat e Disponueshme
          </h2>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            Zgjedhja e Ditës - {new Date().getDate()}{" "}
            {new Date().toLocaleDateString("sq-AL", { month: "long" })}
          </div>
        </div>

        {error && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 mb-4 sm:mb-6 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg mx-2 sm:mx-0">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-yellow-800 dark:text-yellow-200 text-sm text-left sm:text-center">
              Problem me lidhjen API: {error}
            </span>
          </div>
        )}


        {/* Sort Control */}
        <div className="mb-4 sm:mb-5 mx-2 sm:mx-0">
          <div className="flex justify-end">
            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => setSortBy(value)}
            >
              <SelectTrigger className="w-48">
                <ArrowUpDown className="h-3 w-3 mr-2" />
                <SelectValue placeholder="Rreshtoni sipas..." />
              </SelectTrigger>
              <SelectContent>
                {getSortOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Car Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 px-2 sm:px-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                <div className="h-48 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : sortedCars.length === 0 ? (
          <div className="text-center py-6 sm:py-8 px-4">
            <p className="text-base sm:text-lg text-muted-foreground mb-4">
              Nuk u gjetën makina.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 px-2 sm:px-0">
              {displayedCars.map((car) => {
                const lot = car.lots?.[0];
                const usdPrice = lot?.buy_now || 25000;
                const price = convertUSDtoEUR(Math.round(usdPrice + 2200));
                return (
                  <LazyCarCard
                    key={car.id}
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
                    condition={car.condition?.replace("run_and_drives", "Good")}
                    lot={car.lot_number || lot?.lot}
                    title={car.title}
                    status={Number(car.status || lot?.status || 1)}
                    sale_status={car.sale_status || lot?.sale_status}
                    final_price={car.final_price || lot?.final_price}
                    insurance_v2={(lot as any)?.insurance_v2}
                    details={(lot as any)?.details}
                  />
                );
              })}
            </div>

            {/* Show More Button and Browse All Cars Button */}
            <div className="text-center mt-6 space-y-4">
              {sortedCars.length > 50 && !showAllCars && (
                <Button
                  onClick={() => setShowAllCars(true)}
                  variant="outline"
                  size="lg"
                  className="bg-card border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-2.5"
                >
                  Shiko të gjitha ({sortedCars.length} makina)
                </Button>
              )}

              <Button
                onClick={() => navigate("/catalog")}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5"
              >
                Shfleto të gjitha makinat
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
});

HomeCarsSection.displayName = "HomeCarsSection";
export default HomeCarsSection;
