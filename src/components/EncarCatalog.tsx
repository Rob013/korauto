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
  manufacturer_id?: string;
  model_id?: string;
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
  const [manufacturers, setManufacturers] = useState<{id: number, name: string}[]>([]);
  const [models, setModels] = useState<{id: number, name: string}[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

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
      if (filters?.manufacturer_id) {
        params.append('manufacturer_id', filters.manufacturer_id);
      }
      if (filters?.model_id) {
        params.append('model_id', filters.model_id);
      }
      if (filters?.color) {
        params.append('color', filters.color);
      }
      if (filters?.odometer_from_km) {
        params.append('odometer_from_km', filters.odometer_from_km);
      }
      if (filters?.odometer_to_km) {
        params.append('odometer_to_km', filters.odometer_to_km);
      }
      if (filters?.from_year) {
        params.append('from_year', filters.from_year);
      }
      if (filters?.to_year) {
        params.append('to_year', filters.to_year);
      }
      if (filters?.buy_now_price_from) {
        params.append('buy_now_price_from', filters.buy_now_price_from);
      }
      if (filters?.buy_now_price_to) {
        params.append('buy_now_price_to', filters.buy_now_price_to);
      }
      if (filters?.transmission) {
        params.append('transmission', filters.transmission);
      }
      if (filters?.fuel_type) {
        params.append('fuel_type', filters.fuel_type);
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
        setFilteredCars(newCars);
      } else {
        setCars((prev) => [...prev, ...newCars]);
        setFilteredCars((prev) => [...prev, ...newCars]);
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


  const fetchManufacturers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/manufacturers/cars`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });
      const data = await response.json();
      setManufacturers(data.data || []);
    } catch (err) {
      console.error('Failed to fetch manufacturers:', err);
    }
  };

  const fetchModels = async (manufacturerId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/${manufacturerId}/cars`, {
        headers: {
          'Accept': '*/*',
          'X-API-Key': API_KEY
        }
      });
      const data = await response.json();
      setModels(data.data || []);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setModels([]);
    }
  };

  const fetchStatistics = async (manufacturerId?: string) => {
    if (!manufacturerId) {
      setStatistics(null);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/statistics?manufacturer_id=${manufacturerId}`, {
        headers: {
          'Accept': '*/*',
          'X-API-Key': API_KEY
        }
      });
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setStatistics(null);
    }
  };

  const fetchDuplicates = async (minutes: number = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/korea-duplicates?minutes=${minutes}&per_page=1000`, {
        headers: {
          'Accept': '*/*',
          'X-API-Key': API_KEY
        }
      });
      const data = await response.json();
      setDuplicates(data.data || []);
    } catch (err) {
      console.error('Failed to fetch duplicates:', err);
      setDuplicates([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCars(1, 100, filters),
      fetchManufacturers()
    ]).finally(() => setLoading(false));
  }, []);

  // Fetch models and statistics when manufacturer changes
  useEffect(() => {
    if (filters.manufacturer_id) {
      fetchModels(filters.manufacturer_id);
      fetchStatistics(filters.manufacturer_id);
    } else {
      setModels([]);
      setStatistics(null);
    }
  }, [filters.manufacturer_id]);

  // Re-fetch cars when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      setLoading(true);
      setCurrentPage(1);
      fetchCars(1, 100, filters).finally(() => setLoading(false));
    }
  }, [filters]);

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
            variant={showDuplicates ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowDuplicates(!showDuplicates);
              if (!showDuplicates && duplicates.length === 0) {
                fetchDuplicates();
              }
            }}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Duplicates
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Manufacturer</label>
              <Select value={filters.manufacturer_id || ''} onValueChange={(value) => setFilters({...filters, manufacturer_id: value || undefined, model_id: undefined})}>
                <SelectTrigger>
                  <SelectValue placeholder="All manufacturers" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map(manufacturer => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>{manufacturer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <Select value={filters.model_id || ''} onValueChange={(value) => setFilters({...filters, model_id: value || undefined})} disabled={!filters.manufacturer_id}>
                <SelectTrigger>
                  <SelectValue placeholder={filters.manufacturer_id ? "All models" : "Select manufacturer first"} />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id.toString()}>{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <Select value={filters.color || ''} onValueChange={(value) => setFilters({...filters, color: value || undefined})}>
                <SelectTrigger>
                  <SelectValue placeholder="All colors" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(cars.map(car => car.color).filter(c => c?.id && c?.name))).map(color => (
                    <SelectItem key={color!.id} value={color!.id.toString()}>{color!.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fuel Type</label>
              <Select value={filters.fuel_type || ''} onValueChange={(value) => setFilters({...filters, fuel_type: value || undefined})}>
                <SelectTrigger>
                  <SelectValue placeholder="All fuel types" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(cars.map(car => car.fuel).filter(f => f?.id && f?.name))).map(fuel => (
                    <SelectItem key={fuel!.id} value={fuel!.id.toString()}>{fuel!.name}</SelectItem>
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
                  <SelectItem value="1">Automatic</SelectItem>
                  <SelectItem value="2">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year Range</label>
              <div className="flex gap-2">
                <Input
                  placeholder="From"
                  type="number"
                  value={filters.from_year || ''}
                  onChange={(e) => setFilters({...filters, from_year: e.target.value || undefined})}
                />
                <Input
                  placeholder="To"
                  type="number"
                  value={filters.to_year || ''}
                  onChange={(e) => setFilters({...filters, to_year: e.target.value || undefined})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mileage Range (km)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="From"
                  type="number"
                  value={filters.odometer_from_km || ''}
                  onChange={(e) => setFilters({...filters, odometer_from_km: e.target.value || undefined})}
                />
                <Input
                  placeholder="To"
                  type="number"
                  value={filters.odometer_to_km || ''}
                  onChange={(e) => setFilters({...filters, odometer_to_km: e.target.value || undefined})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Price Range ($)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="From"
                  type="number"
                  value={filters.buy_now_price_from || ''}
                  onChange={(e) => setFilters({...filters, buy_now_price_from: e.target.value || undefined})}
                />
                <Input
                  placeholder="To"
                  type="number"
                  value={filters.buy_now_price_to || ''}
                  onChange={(e) => setFilters({...filters, buy_now_price_to: e.target.value || undefined})}
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

      {/* Statistics Display */}
      {statistics && (
        <div className="bg-card border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {manufacturers.find(m => m.id.toString() === filters.manufacturer_id)?.name} Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statistics.total_cars && (
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-2xl font-bold text-primary">{statistics.total_cars.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Cars</div>
              </div>
            )}
            {statistics.average_price && (
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-2xl font-bold text-primary">{formatPrice(statistics.average_price)}</div>
                <div className="text-sm text-muted-foreground">Average Price</div>
              </div>
            )}
            {statistics.price_range && (
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-sm font-bold text-primary">
                  {formatPrice(statistics.price_range.min)} - {formatPrice(statistics.price_range.max)}
                </div>
                <div className="text-sm text-muted-foreground">Price Range</div>
              </div>
            )}
            {statistics.average_year && (
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-2xl font-bold text-primary">{Math.round(statistics.average_year)}</div>
                <div className="text-sm text-muted-foreground">Average Year</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicates Display */}
      {showDuplicates && (
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Korea Duplicates Analysis
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDuplicates(5)}
              >
                Last 5 min
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDuplicates(10)}
              >
                Last 10 min
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDuplicates(60)}
              >
                Last hour
              </Button>
            </div>
          </div>
          
          {duplicates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No duplicates found in the selected time period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{duplicates.length}</div>
                  <div className="text-sm text-muted-foreground">Total Duplicates</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {Array.from(new Set(duplicates.map(d => d.manufacturer?.name))).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Affected Brands</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-warning">
                    {duplicates.filter(d => d.lots?.length > 1).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Multiple Lots</div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {duplicates.slice(0, 12).map((duplicate, index) => (
                    <Card key={index} className="border-destructive/20">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-2 line-clamp-1">
                          {duplicate.title || `${duplicate.manufacturer?.name} ${duplicate.model?.name}`}
                        </h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>Year: {duplicate.year}</div>
                          <div>Lots: {duplicate.lots?.length || 0}</div>
                          <div>VIN: {duplicate.vin?.slice(-8) || 'N/A'}</div>
                        </div>
                        <Badge variant="destructive" className="mt-2 text-xs">
                          Duplicate
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {duplicates.length > 12 && (
                  <div className="text-center mt-4 text-sm text-muted-foreground">
                    ... and {duplicates.length - 12} more duplicates
                  </div>
                )}
              </div>
            </div>
          )}
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