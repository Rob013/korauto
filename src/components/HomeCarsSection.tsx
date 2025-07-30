import LazyCarCard from "./LazyCarCard";
import { memo, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useSecureAuctionAPI } from '@/hooks/useSecureAuctionAPI';
import { useCurrencyAPI } from '@/hooks/useCurrencyAPI';
import { useSortedCars, getSortOptions, SortOption } from '@/hooks/useSortedCars';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import FilterForm from '@/components/FilterForm';

interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  search?: string;
  seats_count?: string;
}

const HomeCarsSection = memo(() => {
  const navigate = useNavigate();
  const { cars, loading, error, fetchCars, fetchManufacturers, fetchModels, fetchGenerations, fetchFilterCounts } = useSecureAuctionAPI();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showAllCars, setShowAllCars] = useState(false);
  
  const [filters, setFilters] = useState<APIFilters>({});
  const [manufacturers, setManufacturers] = useState<{
    id: number;
    name: string;
    car_count?: number;
    cars_qty?: number;
  }[]>([]);
  const [models, setModels] = useState<{
    id: number;
    name: string;
    car_count?: number;
    cars_qty?: number;
  }[]>([]);
  const [generations, setGenerations] = useState<{
    id: number;
    name: string;
    manufacturer_id?: number;
    model_id?: number;
    from_year?: number;
    to_year?: number;
    cars_qty?: number;
  }[]>([]);
  const [filterCounts, setFilterCounts] = useState<any>(null);

  // Type conversion to match the sorting hook interface
  const carsForSorting = cars.map(car => ({
    ...car,
    status: String(car.status || ''),
    lot_number: String(car.lot_number || ''),
    cylinders: Number(car.cylinders || 0)
  }));
  
  const sortedCars = useSortedCars(carsForSorting, sortBy);
  const displayedCars = showAllCars ? sortedCars : sortedCars.slice(0, 8);

  useEffect(() => {
    // Load initial data
    console.log('HomeCarsSection: Component mounted, loading initial data');
    fetchCars(1, {}, true);
    fetchManufacturers().then(setManufacturers);
  }, [fetchCars, fetchManufacturers]);

  const handleFiltersChange = (newFilters: APIFilters) => {
    setFilters(newFilters);
    fetchCars(1, newFilters, true);
  };

  const handleClearFilters = () => {
    setFilters({});
    fetchCars(1, {}, true);
  };

  const handleRefresh = useCallback(() => {
    console.log('🔄 Refresh button clicked');
    fetchCars(1, filters, true);
  }, [fetchCars, filters]);

  return (
    <section id="cars" className="py-4 sm:py-6 lg:py-8 bg-secondary/30">
      <div className="container-responsive">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
            Makinat e Disponueshme
          </h2>
          
          <div className="flex justify-center items-center mt-4 sm:mt-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={loading} 
              className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Duke u ngarkuar...' : 'Rifresko'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 mb-6 sm:mb-8 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg mx-2 sm:mx-0">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-yellow-800 dark:text-yellow-200 text-sm sm:text-base text-left sm:text-center">
              Problem me lidhjen API: {error}
            </span>
          </div>
        )}

        {/* Filter Form */}
        <div className="mb-6 sm:mb-8">
          <FilterForm
            filters={filters}
            manufacturers={manufacturers}
            models={models}
            generations={generations}
            filterCounts={filterCounts}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            onManufacturerChange={(manufacturerId) => {
              if (manufacturerId) {
                fetchModels(manufacturerId).then(setModels);
                setGenerations([]);
              }
            }}
            onModelChange={(modelId) => {
              if (modelId) {
                fetchGenerations(modelId).then(setGenerations);
              }
            }}
          />
        </div>

        {/* Sort Control */}
        <div className="mb-6 sm:mb-8 mx-2 sm:mx-0">
          <div className="flex justify-end">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <ArrowUpDown className="h-3 w-3 mr-2" />
                <SelectValue placeholder="Rreshtoni sipas..." />
              </SelectTrigger>
              <SelectContent>
                {getSortOptions().map(option => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                <div className="h-48 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-base sm:text-lg text-muted-foreground mb-4">
              Nuk u gjetën makina në këtë moment.
            </p>
            <Button onClick={handleRefresh} variant="outline" className="min-h-[44px]">
              Provo përsëri
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
              {displayedCars.map(car => {
                const lot = car.lots?.[0];
                const usdPrice = lot?.buy_now || 25000;
                const price = convertUSDtoEUR(Math.round(usdPrice + 2200));
                return (
                  <LazyCarCard 
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
            <div className="text-center mt-8 space-y-4">
              {sortedCars.length > 8 && !showAllCars && (
                <Button 
                  onClick={() => setShowAllCars(true)} 
                  variant="outline" 
                  size="lg" 
                  className="bg-card border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3"
                >
                  Shiko të gjitha ({sortedCars.length} makina)
                </Button>
              )}
              
              <Button 
                onClick={() => navigate('/catalog')} 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
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

HomeCarsSection.displayName = 'HomeCarsSection';
export default HomeCarsSection;