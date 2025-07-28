import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Grid, List, RefreshCw, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';

interface Car {
  id: string;
  manufacturer: { id: number; name: string };
  model: { id: number; name: string };
  year: number;
  price?: string;
  mileage?: string;
  title?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  condition?: string;
  lot_number?: string;
  image_url?: string;
  color?: { id: number; name: string };
  lots?: {
    buy_now?: number;
    odometer?: {
      km?: number;
      mi?: number;
    };
    images?: {
      normal?: string[];
      big?: string[];
    };
  }[];
}

interface CarFilters {
  search?: string;
  manufacturer?: string;
  fuel?: string;
  transmission?: string;
  yearFrom?: string;
  yearTo?: string;
  priceFrom?: string;
  priceTo?: string;
}

  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

const EncarCatalog = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<CarFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCars = async (page: number, perPage: number, filters?: CarFilters) => {
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        simple_paginate: '0',
      });

      if (filters?.search) {
        params.append('search', filters.search);
      }

     const response = await fetch(`${API_BASE_URL}/cars?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });
      const json = await response.json();

      const newCars = json.data;
      setTotalCount(json.meta?.total || 0);

      if (page === 1) {
        setCars(newCars);
      } else {
        setCars((prev) => [...prev, ...newCars]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cars.');
      toast({
        title: 'Fetch error',
        description: err.message || 'Failed to fetch cars.',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = async () => {
    const newFilters = {
      ...filters,
      search: searchTerm.trim() || undefined
    };
    setFilters(newFilters);
    setCurrentPage(1);
    setLoading(true);
    await fetchCars(1, 100, newFilters);
    setLoading(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || loading) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    await fetchCars(nextPage, 100, filters);
    setCurrentPage(nextPage);
    setLoadingMore(false);
  };

const formatPrice = (price: string | number) =>
  price
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(Number(price))
    : 'N/A';

const formatMileage = (mileage?: string | number) =>
  mileage && !isNaN(Number(mileage))
    ? `${new Intl.NumberFormat('en-US').format(Number(mileage))} km`
    : 'N/A';


  useEffect(() => {
    setLoading(true);
    fetchCars(1, 100, filters).finally(() => setLoading(false));
  }, []);

  // Apply client-side filters
  useEffect(() => {
    let filtered = cars;

    if (filters.manufacturer) {
      filtered = filtered.filter(car => car.manufacturer?.name === filters.manufacturer);
    }
    if (filters.fuel) {
      filtered = filtered.filter(car => car.fuel?.name === filters.fuel);
    }
    if (filters.transmission) {
      filtered = filtered.filter(car => car.transmission?.name === filters.transmission);
    }
    if (filters.yearFrom) {
      filtered = filtered.filter(car => car.year >= parseInt(filters.yearFrom!));
    }
    if (filters.yearTo) {
      filtered = filtered.filter(car => car.year <= parseInt(filters.yearTo!));
    }

    setFilteredCars(filtered);
  }, [cars, filters]);

  const getStatusIcon = () => {
    return <></>
  };

  const getStatusText = () => {
    return <></>
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Encar Car Catalog
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse {totalCount.toLocaleString()} authentic Korean cars from Encar.com
          </p>
        </div>
        
        {/* Refresh Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
          
          {/* <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSyncAction('incremental')}
              disabled={loading || syncStatus?.status === 'running'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Quick Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSyncAction('full')}
              disabled={loading || syncStatus?.status === 'running'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Full Refresh
            </Button>
          </div> */}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="flex gap-2">
            <Input
              placeholder="Search cars by make, model, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-background border rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Manufacturer</label>
              <Select value={filters.manufacturer || ''} onValueChange={(value) => setFilters({...filters, manufacturer: value || undefined})}>
                <SelectTrigger>
                  <SelectValue placeholder="All manufacturers" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(cars.map(car => car.manufacturer?.name).filter(Boolean))).map(manufacturer => (
                    <SelectItem key={manufacturer} value={manufacturer!}>{manufacturer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fuel Type</label>
              <Select value={filters.fuel || ''} onValueChange={(value) => setFilters({...filters, fuel: value || undefined})}>
                <SelectTrigger>
                  <SelectValue placeholder="All fuel types" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(cars.map(car => car.fuel?.name).filter(Boolean))).map(fuel => (
                    <SelectItem key={fuel} value={fuel!}>{fuel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Transmission</label>
              <Select value={filters.transmission || ''} onValueChange={(value) => setFilters({...filters, transmission: value || undefined})}>
                <SelectTrigger>
                  <SelectValue placeholder="All transmissions" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(cars.map(car => car.transmission?.name).filter(Boolean))).map(transmission => (
                    <SelectItem key={transmission} value={transmission!}>{transmission}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year Range</label>
              <div className="flex gap-2">
                <Input
                  placeholder="From"
                  type="number"
                  value={filters.yearFrom || ''}
                  onChange={(e) => setFilters({...filters, yearFrom: e.target.value || undefined})}
                />
                <Input
                  placeholder="To"
                  type="number"
                  value={filters.yearTo || ''}
                  onChange={(e) => setFilters({...filters, yearTo: e.target.value || undefined})}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

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
      {!loading && cars.length > 0 && filteredCars.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cars match your current filters.</p>
          <Button
            variant="outline"
            onClick={() => setFilters({})}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Cars Grid/List */}
      {filteredCars.length > 0 && (
        <>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
             {filteredCars.map((car) => (
              <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between">
                <CardHeader className="p-0">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={car.lots?.[0]?.images?.normal?.[0] || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'}
                      alt={car.title || `${car.manufacturer?.name} ${car.model?.name}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800';
                      }}
                    />
                    {car.condition && (
                      <Badge className="absolute top-2 left-2" variant="secondary">
                        {car.condition}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                   <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {car.title || `${car.manufacturer?.name} ${car.model?.name} ${car.year}`}
                   </h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Year:</span>
                      <span className="font-medium">{car.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mileage:</span>
                    <span>{formatMileage(car.lots?.[0]?.odometer?.km) ?? "N/A"}</span>
                    </div>
                    {car.fuel && (
                      <div className="flex justify-between">
                        <span>Fuel:</span>
                       <span className="font-medium capitalize">{car.fuel?.name}</span>
                      </div>
                    )}
                    {car.transmission && (
                      <div className="flex justify-between">
                        <span>Transmission:</span>
                     <span className="font-medium capitalize">{car.transmission?.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  <div className="w-full flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      <span>{formatPrice(car.lots?.[0]?.buy_now) ?? "N/A"}</span>
                    </div>
                    <Badge variant="outline">
                      {car.lot_number || 'Encar'}
                    </Badge> 
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {cars.length < totalCount && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  `Shfaq më shumë (${cars.length} prej ${totalCount.toLocaleString()})`
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