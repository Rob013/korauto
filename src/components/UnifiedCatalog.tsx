import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/contexts/NavigationContext";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useUnifiedCars, UnifiedCarsFilters } from "@/hooks/useUnifiedCars";
import { useUnifiedCarDetails } from "@/hooks/useUnifiedCarDetails";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Car, 
  Calendar, 
  Gauge, 
  Fuel, 
  Settings,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc
} from "lucide-react";
import { formatMileage } from "@/utils/mileageFormatter";

interface UnifiedCatalogProps {
  highlightCarId?: string | null;
}

interface CarCardProps {
  car: any;
  onCarClick: (carId: string) => void;
  isHighlighted?: boolean;
}

const CarCard = React.memo(({ car, onCarClick, isHighlighted }: CarCardProps) => {
  const { convertUSDtoEUR, exchangeRate } = useCurrencyAPI();
  
  const handleClick = useCallback(() => {
    onCarClick(car.id);
  }, [car.id, onCarClick]);

  const price = useMemo(() => {
    return convertUSDtoEUR(car.price || 0, exchangeRate.rate);
  }, [car.price, convertUSDtoEUR, exchangeRate.rate]);

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        isHighlighted ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Car Image */}
        <div className="aspect-w-16 aspect-h-12 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
          {car.image_url ? (
            <img
              src={car.image_url}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <Car className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Car Info */}
        <div className="p-4 space-y-3">
          {/* Title and Price */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
              {car.year} {car.make} {car.model}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                €{price.toLocaleString()}
              </span>
              {car.is_live && (
                <Badge variant="destructive" className="animate-pulse">
                  Live
                </Badge>
              )}
            </div>
          </div>

          {/* Car Details */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Gauge className="h-4 w-4" />
              <span>{car.mileage ? formatMileage(car.mileage) : 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{car.year}</span>
            </div>
            {car.fuel && (
              <div className="flex items-center space-x-1">
                <Fuel className="h-4 w-4" />
                <span className="capitalize">{car.fuel}</span>
              </div>
            )}
            {car.transmission && (
              <div className="flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span className="capitalize">{car.transmission}</span>
              </div>
            )}
          </div>

          {/* Source Badge */}
          {car.source_api && (
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {car.source_api === 'auctions_api' ? 'Auctions API' : 
                 car.source_api === 'auctionapis' ? 'Auction APIs' :
                 car.source_api === 'encar' ? 'Encar' : car.source_api}
              </Badge>
              {car.lot_number && (
                <span className="text-xs text-gray-500">#{car.lot_number}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

CarCard.displayName = "CarCard";

const UnifiedCatalog = ({ highlightCarId }: UnifiedCatalogProps) => {
  const { toast } = useToast();
  const { restorePageState } = useNavigation();
  const { convertUSDtoEUR, exchangeRate } = useCurrencyAPI();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [filters, setFilters] = useState<UnifiedCarsFilters>({
    page: 1,
    pageSize: 24,
    sortBy: 'last_synced_at',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recently_added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use unified cars hook
  const {
    cars,
    total,
    page,
    totalPages,
    hasMore,
    loading,
    error
  } = useUnifiedCars(filters);

  // Available filter options
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableFuels, setAvailableFuels] = useState<string[]>([]);
  const [availableTransmissions, setAvailableTransmissions] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  // Price range
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [yearRange, setYearRange] = useState<[number, number]>([1990, 2024]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // This would load available filter options from the API
        // For now, we'll use static data
        setAvailableMakes(['BMW', 'Audi', 'Mercedes-Benz', 'Toyota', 'Honda', 'Ford', 'Volkswagen']);
        setAvailableModels(['X5', 'A4', 'C-Class', 'Camry', 'Civic', 'Focus', 'Golf']);
        setAvailableFuels(['Gasoline', 'Diesel', 'Hybrid', 'Electric']);
        setAvailableTransmissions(['Automatic', 'Manual', 'CVT']);
        setAvailableColors(['Black', 'White', 'Silver', 'Red', 'Blue', 'Gray']);
        setAvailableSources(['auctions_api', 'auctionapis', 'encar']);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof UnifiedCarsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  }, []);

  // Handle car click
  const handleCarClick = useCallback((carId: string) => {
    window.location.href = `/car/${carId}`;
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    
    let sortField = 'last_synced_at';
    if (newSortBy === 'price') sortField = 'price';
    else if (newSortBy === 'year') sortField = 'year';
    else if (newSortBy === 'mileage') sortField = 'mileage';
    else if (newSortBy === 'make') sortField = 'make';
    
    setFilters(prev => ({
      ...prev,
      sortBy: sortField,
      sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  }, [sortOrder]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      setFilters(prev => ({
        ...prev,
        page: (prev.page || 1) + 1
      }));
    }
  }, [hasMore, loading]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      pageSize: 24,
      sortBy: 'last_synced_at',
      sortOrder: 'desc'
    });
    setSearchTerm("");
    setPriceRange([0, 100000]);
    setYearRange([1990, 2024]);
  }, []);

  // Loading skeleton
  const CarSkeleton = () => (
    <Card>
      <CardContent className="p-0">
        <Skeleton className="w-full h-48 rounded-t-lg" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Kërko makina..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {/* Sort */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recently_added">Sapo shtuar</SelectItem>
                  <SelectItem value="price">Çmimi</SelectItem>
                  <SelectItem value="year">Viti</SelectItem>
                  <SelectItem value="mileage">Kilometrazhi</SelectItem>
                  <SelectItem value="make">Marka</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              {/* View Mode */}
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

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtra
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filtra</h3>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Pastro
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Çmimi: €{priceRange[0].toLocaleString()} - €{priceRange[1].toLocaleString()}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={100000}
                        min={0}
                        step={1000}
                        className="w-full"
                      />
                    </div>

                    {/* Year Range */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Viti: {yearRange[0]} - {yearRange[1]}
                      </label>
                      <Slider
                        value={yearRange}
                        onValueChange={setYearRange}
                        max={2024}
                        min={1990}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Make */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Marka</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableMakes.map(make => (
                          <div key={make} className="flex items-center space-x-2">
                            <Checkbox
                              id={make}
                              checked={filters.make?.includes(make) || false}
                              onCheckedChange={(checked) => {
                                const currentMakes = filters.make || [];
                                const newMakes = checked
                                  ? [...currentMakes, make]
                                  : currentMakes.filter(m => m !== make);
                                handleFilterChange('make', newMakes.length > 0 ? newMakes : undefined);
                              }}
                            />
                            <label htmlFor={make} className="text-sm">{make}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fuel */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Karburanti</label>
                      <div className="space-y-2">
                        {availableFuels.map(fuel => (
                          <div key={fuel} className="flex items-center space-x-2">
                            <Checkbox
                              id={fuel}
                              checked={filters.fuel?.includes(fuel) || false}
                              onCheckedChange={(checked) => {
                                const currentFuels = filters.fuel || [];
                                const newFuels = checked
                                  ? [...currentFuels, fuel]
                                  : currentFuels.filter(f => f !== fuel);
                                handleFilterChange('fuel', newFuels.length > 0 ? newFuels : undefined);
                              }}
                            />
                            <label htmlFor={fuel} className="text-sm">{fuel}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Source */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Burimi</label>
                      <div className="space-y-2">
                        {availableSources.map(source => (
                          <div key={source} className="flex items-center space-x-2">
                            <Checkbox
                              id={source}
                              checked={filters.source_api?.includes(source) || false}
                              onCheckedChange={(checked) => {
                                const currentSources = filters.source_api || [];
                                const newSources = checked
                                  ? [...currentSources, source]
                                  : currentSources.filter(s => s !== source);
                                handleFilterChange('source_api', newSources.length > 0 ? newSources : undefined);
                              }}
                            />
                            <label htmlFor={source} className="text-sm">
                              {source === 'auctions_api' ? 'Auctions API' : 
                               source === 'auctionapis' ? 'Auction APIs' :
                               source === 'encar' ? 'Encar' : source}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {total > 0 ? `${total.toLocaleString()} makina të gjetura` : 'Nuk u gjet asnjë makinë'}
                </h2>
                {loading && (
                  <p className="text-sm text-gray-500 mt-1">Duke ngarkuar...</p>
                )}
              </div>
              
              {!isMobile && (
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Fshih Filtra' : 'Shfaq Filtra'}
                </Button>
              )}
            </div>

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <RefreshCw className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-lg font-medium">Gabim në ngarkim</p>
                  <p className="text-sm">{error}</p>
                </div>
                <Button onClick={() => window.location.reload()}>
                  Provo përsëri
                </Button>
              </div>
            )}

            {/* Cars Grid */}
            {!error && (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {loading && cars.length === 0 ? (
                  // Loading skeletons
                  Array.from({ length: 12 }).map((_, index) => (
                    <CarSkeleton key={index} />
                  ))
                ) : (
                  cars.map((car) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      onCarClick={handleCarClick}
                      isHighlighted={car.id === highlightCarId}
                    />
                  ))
                )}
              </div>
            )}

            {/* Load More */}
            {hasMore && !loading && (
              <div className="text-center mt-8">
                <Button onClick={handleLoadMore} size="lg">
                  Ngarko më shumë makina
                </Button>
              </div>
            )}

            {/* Pagination Info */}
            {total > 0 && (
              <div className="text-center mt-8 text-sm text-gray-500">
                Faqja {page} nga {totalPages} ({total.toLocaleString()} makina në total)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCatalog;
