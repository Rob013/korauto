import CarCard from "./CarCard";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useAuctionAPI } from '@/hooks/useAuctionAPI';
import FilterForm from '@/components/FilterForm';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  vin?: string;
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
}

interface ApiFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  color?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  transmission?: string;
  fuel_type?: string;
}

const HomeCarsSection = () => {
  const navigate = useNavigate();
  const { cars, loading, error, fetchCars, fetchManufacturers, fetchModels, fetchGenerations, fetchFilterCounts } = useAuctionAPI();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filters, setFilters] = useState<ApiFilters>({});
  const [manufacturers, setManufacturers] = useState<{id: number, name: string, car_count?: number}[]>([]);
  const [models, setModels] = useState<{id: number, name: string, car_count?: number}[]>([]);
  const [generations, setGenerations] = useState<{id: number, name: string, car_count?: number}[]>([]);
  const [filterCounts, setFilterCounts] = useState<any>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  
  const handleFiltersChange = (newFilters: ApiFilters) => {
    setFilters(newFilters);
    fetchCars(1, newFilters, true);
  };

  const handleClearFilters = () => {
    setFilters({});
    setModels([]);
    setGenerations([]);
    fetchCars(1, {}, true);
  };

  const handleManufacturerChange = async (manufacturerId: string) => {
    if (manufacturerId) {
      const modelData = await fetchModels(manufacturerId);
      setModels(modelData);
    } else {
      setModels([]);
    }
    setGenerations([]);
  };

  const handleModelChange = async (modelId: string) => {
    if (modelId) {
      const generationData = await fetchGenerations(modelId);
      setGenerations(generationData);
    } else {
      setGenerations([]);
    }
  };

  // Load manufacturers on mount
  useEffect(() => {
    const loadManufacturers = async () => {
      const manufacturerData = await fetchManufacturers();
      setManufacturers(manufacturerData);
    };
    
    loadManufacturers();
    fetchCars(1, {}, true);
  }, []);

  // Handle filter changes and fetch counts
  useEffect(() => {
    const loadData = async () => {
      if (Object.keys(filters).length > 0) {
        fetchCars(1, filters, true);
      }
      
      // Only fetch filter counts if manufacturers are loaded
      if (manufacturers.length > 0) {
        setLoadingCounts(true);
        try {
          const counts = await fetchFilterCounts(filters, manufacturers);
          setFilterCounts(counts);
        } finally {
          setLoadingCounts(false);
        }
      }
    };
    
    loadData();
  }, [filters, manufacturers]);

  // Load filter counts on mount and when manufacturers change
  useEffect(() => {
    const loadInitialCounts = async () => {
      if (manufacturers.length > 0) {
        setLoadingCounts(true);
        try {
          const counts = await fetchFilterCounts({}, manufacturers);
          setFilterCounts(counts);
        } finally {
          setLoadingCounts(false);
        }
      }
    };
    
    loadInitialCounts();
  }, [manufacturers]);

  const handleRefresh = () => {
    fetchCars(1, filters, true);
  };

  return (
    <section id="cars" className="py-4 sm:py-6 lg:py-8 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-foreground">Makinat e Disponueshme</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Shfletoni përzgjedhjen tonë të mjeteve të cilësisë së lartë. Çdo makinë mund të inspektohet profesionalisht falas.
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
              {loading ? 'Duke u ngarkuar...' : 'Rifresko'}
            </Button>
            
            {lastUpdate && (
              <span className="text-sm text-muted-foreground text-center">
                Përditësuar për herë të fundit: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 mb-6 sm:mb-8 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg mx-2 sm:mx-0">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-yellow-800 dark:text-yellow-200 text-sm sm:text-base text-left sm:text-center">
              Problem me lidhjen API: {error}. Duke shfaqur makina demo me shërbim të plotë inspektimi të disponueshëm.
            </span>
          </div>
        )}

        {/* Filter Form */}
        <div className="mb-6 sm:mb-8 mx-2 sm:mx-0">
          <FilterForm
            filters={filters}
            manufacturers={manufacturers}
            models={models}
            generations={generations}
            filterCounts={filterCounts}
            loadingCounts={loadingCounts}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            onManufacturerChange={handleManufacturerChange}
            onModelChange={handleModelChange}
            showAdvanced={showMoreFilters}
            onToggleAdvanced={() => setShowMoreFilters(!showMoreFilters)}
          />
        </div>

        {/* Car Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
            {[...Array(6)].map((_, i) => (
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
              Nuk u gjetën makina me këto filtra.
            </p>
            <Button onClick={handleClearFilters} variant="outline" className="min-h-[44px]">
              Pastro Filtrat
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
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
                    status={car.status || lot?.status}
                    sale_status={car.sale_status || lot?.sale_status}
                    final_price={car.final_price || lot?.final_price}
                  />
                );
              })}
            </div>
            
            {/* Show More Button */}
            <div className="text-center mt-8">
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
};

export default HomeCarsSection;