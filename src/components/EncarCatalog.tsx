import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Grid, List, ArrowLeft } from 'lucide-react';
import CarCard from '@/components/CarCard';
import { useAuctionAPI } from '@/hooks/useAuctionAPI';
import FilterForm from '@/components/FilterForm';

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
  search?: string;
}

const EncarCatalog = () => {
  const { toast } = useToast();
  const { cars, loading, error, totalCount, hasMorePages, fetchCars, fetchManufacturers, loadMore } = useAuctionAPI();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<APIFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [manufacturers, setManufacturers] = useState<{id: number, name: string}[]>([]);

  const handleFiltersChange = (newFilters: APIFilters) => {
    setFilters(newFilters);
    fetchCars(1, newFilters, true);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    fetchCars(1, {}, true);
  };

  const handleSearch = () => {
    const newFilters = {
      ...filters,
      search: searchTerm.trim() || undefined
    };
    handleFiltersChange(newFilters);
  };

  const handleLoadMore = () => {
    loadMore(filters);
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

  // Handle filter changes
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchCars(1, filters, true);
    }
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header with Back Button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'} 
            className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Car Catalog
            </h1>
            <p className="text-muted-foreground mt-2">
              {totalCount.toLocaleString()} cars available
            </p>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search by brand, model, or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 h-11 bg-background border-border"
        />
        <Button onClick={handleSearch} disabled={loading} className="h-11 px-6">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Filter Form */}
      <div className="mb-6">
        <FilterForm
          filters={filters}
          manufacturers={manufacturers}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && cars.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading cars...</span>
        </div>
      )}

      {/* No Results State */}
      {!loading && cars.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cars found matching your filters.</p>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Cars Grid/List */}
      {cars.length > 0 && (
        <>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
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
                />
              );
            })}
          </div>

          {/* Load More */}
          {hasMorePages && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  `Load More Cars`
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EncarCatalog;