import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import CarCard from "./CarCard";
import { useAuctionAPI } from '@/hooks/useAuctionAPI';
import FilterForm from './FilterForm';

interface APIFilters {
  manufacturer_id?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
}

const FilteredCarsSection = () => {
  const { cars, loading, error, totalCount, hasMorePages, fetchCars, fetchManufacturers, loadMore } = useAuctionAPI();
  const [filters, setFilters] = useState<APIFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [manufacturers, setManufacturers] = useState<{id: number, name: string}[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleFiltersChange = (newFilters: APIFilters) => {
    setFilters(newFilters);
    fetchCars(1, newFilters, true);
  };

  const handleClearFilters = () => {
    setFilters({});
    fetchCars(1, {}, true);
  };

  const handleRefresh = () => {
    fetchCars(1, filters, true);
    setLastUpdate(new Date());
  };

  const handleLoadMore = () => {
    loadMore(filters);
  };

  // Load manufacturers and initial cars on mount
  useEffect(() => {
    const initializeData = async () => {
      const manufacturerData = await fetchManufacturers();
      setManufacturers(manufacturerData);
      await fetchCars(1, {}, true);
      setLastUpdate(new Date());
    };
    
    initializeData();
  }, []);

  return (
    <section id="cars" className="py-8 sm:py-12 lg:py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
            Available Cars
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Browse our selection of high-quality vehicles. Every car can be professionally inspected for free.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-4 sm:mt-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
              className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            {lastUpdate && (
              <span className="text-sm text-muted-foreground text-center">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 mb-6 sm:mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mx-4 sm:mx-0">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-yellow-800 text-sm sm:text-base text-left sm:text-center">
              API connection issue: {error}. Showing demo cars with full inspection service available.
            </span>
          </div>
        )}

        {/* Filter Form */}
        <div className="mb-6 sm:mb-8">
          <FilterForm
            filters={filters}
            manufacturers={manufacturers}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            showAdvanced={showAdvancedFilters}
            onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
          />
        </div>

        {/* Loading State */}
        {loading && cars.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading cars...</p>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && cars.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No cars found matching your filters.</p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Cars Grid */}
        {cars.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {cars.map((car) => {
                const lot = car.lots?.[0];
                const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : 25000;
                
                return (
                  <CarCard
                    key={car.id}
                    id={car.id}
                    make={car.manufacturer?.name || 'Unknown'}
                    model={car.model?.name || 'Unknown'}
                    year={car.year}
                    price={price}
                    image={lot?.images?.normal?.[0] || lot?.images?.big?.[0]}
                    vin={car.vin}
                    mileage={lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined}
                    transmission={car.transmission?.name}
                    fuel={car.fuel?.name}
                    color={car.color?.name}
                    condition={car.condition?.replace('run_and_drives', 'Good')}
                    lot={car.lot_number || lot?.lot}
                    title={car.title}
                    status={car.status}
                    sale_status={car.sale_status}
                  />
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMorePages && (
              <div className="flex justify-center mt-8 sm:mt-12">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="min-h-[44px] px-8"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Loading More...
                    </>
                  ) : (
                    `Show More Cars (${totalCount - cars.length} remaining)`
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FilteredCarsSection;