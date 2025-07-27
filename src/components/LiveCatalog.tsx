import { useState, useEffect, useMemo } from 'react';
import { useLiveAuctionAPI } from '@/hooks/useLiveAuctionAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MobileCarCard from '@/components/MobileCarCard';
import CarCard from '@/components/CarCard';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download,
  Grid,
  List,
  TrendingUp,
  Car,
  Clock,
  Eye
} from 'lucide-react';

interface Filters {
  search: string;
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  mileageFrom: string;
  mileageTo: string;
  fuel: string;
  transmission: string;
  condition: string;
  isLive: boolean | null;
}

const LiveCatalog = () => {
  const {
    cars,
    manufacturers,
    models,
    loading,
    syncStatus,
    totalCars,
    error,
    lastSync,
    loadAllCars,
    performRealTimeUpdate,
    loadFromDatabase
  } = useLiveAuctionAPI();

  const [filters, setFilters] = useState<Filters>({
    search: '',
    make: '',
    model: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
    mileageFrom: '',
    mileageTo: '',
    fuel: '',
    transmission: '',
    condition: '',
    isLive: null
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'price' | 'year' | 'mileage' | 'updated'>('updated');
  const [displayedCars, setDisplayedCars] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  // Filter cars based on search and filters
  const filteredCars = useMemo(() => {
    let filtered = cars;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(car => 
        car.make.toLowerCase().includes(searchLower) ||
        car.model.toLowerCase().includes(searchLower) ||
        car.title?.toLowerCase().includes(searchLower) ||
        car.vin?.toLowerCase().includes(searchLower)
      );
    }

    // Make filter
    if (filters.make) {
      filtered = filtered.filter(car => car.make === filters.make);
    }

    // Model filter
    if (filters.model) {
      filtered = filtered.filter(car => car.model === filters.model);
    }

    // Year filter
    if (filters.yearFrom) {
      filtered = filtered.filter(car => car.year >= parseInt(filters.yearFrom));
    }
    if (filters.yearTo) {
      filtered = filtered.filter(car => car.year <= parseInt(filters.yearTo));
    }

    // Price filter
    if (filters.priceFrom) {
      filtered = filtered.filter(car => car.price >= parseInt(filters.priceFrom));
    }
    if (filters.priceTo) {
      filtered = filtered.filter(car => car.price <= parseInt(filters.priceTo));
    }

    // Mileage filter
    if (filters.mileageFrom) {
      filtered = filtered.filter(car => (car.mileage || 0) >= parseInt(filters.mileageFrom));
    }
    if (filters.mileageTo) {
      filtered = filtered.filter(car => (car.mileage || 0) <= parseInt(filters.mileageTo));
    }

    // Fuel filter
    if (filters.fuel) {
      filtered = filtered.filter(car => car.fuel === filters.fuel);
    }

    // Transmission filter
    if (filters.transmission) {
      filtered = filtered.filter(car => car.transmission === filters.transmission);
    }

    // Condition filter
    if (filters.condition) {
      filtered = filtered.filter(car => car.condition === filters.condition);
    }

    // Live status filter
    if (filters.isLive !== null) {
      filtered = filtered.filter(car => car.is_live === filters.isLive);
    }

    // Sort cars
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'year':
          return b.year - a.year;
        case 'mileage':
          return (a.mileage || 0) - (b.mileage || 0);
        case 'updated':
        default:
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      }
    });
  }, [cars, filters, sortBy]);

  // Get available models for selected make
  const availableModels = useMemo(() => {
    if (!filters.make) return [];
    return models.filter(model => {
      const manufacturer = manufacturers.find(m => m.name === filters.make);
      return manufacturer && model.manufacturer_id === manufacturer.id;
    });
  }, [filters.make, models, manufacturers]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    return {
      fuels: Array.from(new Set(cars.map(car => car.fuel).filter(Boolean))),
      transmissions: Array.from(new Set(cars.map(car => car.transmission).filter(Boolean))),
      conditions: Array.from(new Set(cars.map(car => car.condition).filter(Boolean)))
    };
  }, [cars]);

  // Load more cars (infinite scroll simulation)
  const loadMoreCars = () => {
    setDisplayedCars(prev => Math.min(prev + 20, filteredCars.length));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      make: '',
      model: '',
      yearFrom: '',
      yearTo: '',
      priceFrom: '',
      priceTo: '',
      mileageFrom: '',
      mileageTo: '',
      fuel: '',
      transmission: '',
      condition: '',
      isLive: null
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Live Status */}
      <div className="bg-[#003087] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Live Car Auctions</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Live Data</span>
                </div>
                <span>{totalCars.toLocaleString()} Cars Available</span>
                {lastSync && (
                  <span>Updated {lastSync.toLocaleTimeString()}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={performRealTimeUpdate}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {syncStatus === 'idle' && cars.length === 0 && (
                <Button
                  onClick={loadAllCars}
                  disabled={loading}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Load All Cars
                </Button>
              )}
            </div>
          </div>

          {/* Sync Status */}
          {syncStatus === 'syncing' && (
            <div className="mt-4 p-3 bg-blue-600 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing live data from auction API...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-600 rounded-lg">
              <p>Error: {error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, VIN, or keyword..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Latest</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="mileage">Mileage</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Advanced Filters</span>
                <Button variant="ghost" onClick={clearFilters} size="sm">
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Make */}
                <div>
                  <label className="block text-sm font-medium mb-1">Make</label>
                  <Select value={filters.make} onValueChange={(value) => setFilters(prev => ({ ...prev, make: value, model: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Makes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Makes</SelectItem>
                      {manufacturers.map(manufacturer => (
                        <SelectItem key={manufacturer.id} value={manufacturer.name}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  <Select value={filters.model} onValueChange={(value) => setFilters(prev => ({ ...prev, model: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Models" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Models</SelectItem>
                      {availableModels.map(model => (
                        <SelectItem key={model.id} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Range */}
                <div>
                  <label className="block text-sm font-medium mb-1">Year From</label>
                  <Input
                    type="number"
                    placeholder="2000"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Year To</label>
                  <Input
                    type="number"
                    placeholder="2024"
                    value={filters.yearTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-1">Price From (€)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.priceFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceFrom: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price To (€)</label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={filters.priceTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceTo: e.target.value }))}
                  />
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Fuel Type</label>
                  <Select value={filters.fuel} onValueChange={(value) => setFilters(prev => ({ ...prev, fuel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Fuels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Fuels</SelectItem>
                      {filterOptions.fuels.map(fuel => (
                        <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Live Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={filters.isLive === null ? '' : filters.isLive.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, isLive: value === '' ? null : value === 'true' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="true">Live Auctions</SelectItem>
                      <SelectItem value="false">Buy Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Showing {Math.min(displayedCars, filteredCars.length)} of {filteredCars.length.toLocaleString()} cars
            </span>
            {filteredCars.length !== totalCars && (
              <Badge variant="secondary">
                Filtered from {totalCars.toLocaleString()} total
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Updates every minute</span>
          </div>
        </div>

        {/* Cars Grid/List */}
        {loading && cars.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Loading live auction data...</p>
              <p className="text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No cars found</p>
            <p className="text-muted-foreground">Try adjusting your filters</p>
            <Button onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <>
                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCars.slice(0, displayedCars).map((car) => (
                    <MobileCarCard key={car.id} car={{...car, isLive: car.is_live || false, imageUrl: car.image_url}} />
                  ))}
                </div>

                {/* Mobile Grid */}
                <div className="grid md:hidden grid-cols-1 gap-4">
                  {filteredCars.slice(0, displayedCars).map((car) => (
                    <MobileCarCard key={car.id} car={{...car, isLive: car.is_live || false, imageUrl: car.image_url}} />
                  ))}
                </div>
              </>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredCars.slice(0, displayedCars).map((car) => (
                  <MobileCarCard key={car.id} car={{...car, isLive: car.is_live || false, imageUrl: car.image_url}} />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {displayedCars < filteredCars.length && (
              <div className="text-center mt-8">
                <Button onClick={loadMoreCars} size="lg">
                  <Eye className="h-4 w-4 mr-2" />
                  Load More Cars ({filteredCars.length - displayedCars} remaining)
                </Button>
              </div>
            )}
          </>
        )}

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Live Auctions</p>
                  <p className="text-2xl font-bold text-green-600">
                    {cars.filter(car => car.is_live).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cars</p>
                  <p className="text-2xl font-bold">{totalCars.toLocaleString()}</p>
                </div>
                <Car className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Brands Available</p>
                  <p className="text-2xl font-bold">{manufacturers.length}</p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  397 Total
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveCatalog;