// Enhanced Catalog Component with real external API integration and comprehensive Encar-style filtering
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown,
  Loader2,
  Grid3X3,
  List,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Heart,
  Share2,
  Phone,
  Eye,
  Car,
  Settings
} from 'lucide-react';
import { EnhancedCarFilter } from '@/components/EnhancedCarFilter';
import { useEnhancedCarAPI } from '@/hooks/useEnhancedCarAPI';
import { useCurrencyAPI } from '@/hooks/useCurrencyAPI';
import type { ExternalCar } from '@/services/externalCarAPI';

interface EnhancedCatalogProps {
  highlightCarId?: string | null;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Latest Listed' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'year_asc', label: 'Year: Oldest First' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_desc', label: 'Mileage: High to Low' },
];

export const EnhancedCatalog: React.FC<EnhancedCatalogProps> = ({
  highlightCarId,
  className = ''
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { convertUSDtoEUR } = useCurrencyAPI();

  // Enhanced API hook
  const {
    cars,
    loading,
    error,
    totalCount,
    hasMore,
    filterOptions,
    loadingFilters,
    filters,
    setFilters,
    resetFilters,
    loadMore,
    searchCars
  } = useEnhancedCarAPI();

  // Local UI state
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created_desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: any = {};
    
    if (searchParams.get('manufacturer_id')) {
      urlFilters.manufacturer_id = searchParams.get('manufacturer_id');
    }
    if (searchParams.get('model_id')) {
      urlFilters.model_id = searchParams.get('model_id');
    }
    if (searchParams.get('price_from')) {
      urlFilters.price_from = parseInt(searchParams.get('price_from') || '0');
    }
    if (searchParams.get('price_to')) {
      urlFilters.price_to = parseInt(searchParams.get('price_to') || '200000');
    }
    if (searchParams.get('year_from')) {
      urlFilters.year_from = parseInt(searchParams.get('year_from') || '2000');
    }
    if (searchParams.get('year_to')) {
      urlFilters.year_to = parseInt(searchParams.get('year_to') || '2024');
    }
    if (searchParams.get('search')) {
      setSearchTerm(searchParams.get('search') || '');
      urlFilters.search = searchParams.get('search');
    }

    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, [searchParams, setFilters]);

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newParams.set(key, value.toString());
      }
    });

    if (searchTerm) {
      newParams.set('search', searchTerm);
    }

    setSearchParams(newParams, { replace: true });
  }, [filters, searchTerm, setSearchParams]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      searchCars(searchTerm.trim());
    } else {
      const newFilters = { ...filters };
      delete newFilters.search;
      setFilters(newFilters);
    }
  }, [searchTerm, searchCars, filters, setFilters]);

  // Handle search input key press
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Car card component
  const CarCard: React.FC<{ car: ExternalCar; isHighlighted?: boolean }> = ({ 
    car, 
    isHighlighted = false 
  }) => {
    const primaryLot = car.lots?.[0];
    const price = primaryLot?.buy_now || 0;
    const mileage = primaryLot?.odometer?.km || 0;
    const imageUrl = primaryLot?.images?.normal?.[0] || primaryLot?.images?.big?.[0];
    const condition = primaryLot?.condition?.name || 'Good';
    
    const convertedPrice = useMemo(() => {
      return convertUSDtoEUR ? convertUSDtoEUR(price) : price;
    }, [price, convertUSDtoEUR]);

    return (
      <Card 
        className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
          isHighlighted ? 'ring-2 ring-primary' : ''
        } ${viewMode === 'list' ? 'flex' : ''}`}
      >
        <div className={`relative ${viewMode === 'list' ? 'w-64 flex-shrink-0' : 'w-full h-48'}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={car.title || `${car.manufacturer?.name} ${car.model?.name}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Car className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Condition badge */}
          <Badge 
            variant={condition === 'Excellent' ? 'default' : 'secondary'}
            className="absolute top-2 left-2"
          >
            {condition}
          </Badge>

          {/* Favorite and share buttons */}
          <div className="absolute top-2 right-2 flex gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-background/80">
              <Heart className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-background/80">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2">
              {car.title || `${car.year} ${car.manufacturer?.name} ${car.model?.name}`}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-primary">
                €{convertedPrice?.toLocaleString() || price.toLocaleString()}
              </div>
              {primaryLot?.bid && (
                <div className="text-sm text-muted-foreground">
                  Current bid: €{convertUSDtoEUR ? convertUSDtoEUR(primaryLot.bid).toLocaleString() : primaryLot.bid.toLocaleString()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {car.year}
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="w-4 h-4" />
                {mileage.toLocaleString()} km
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="w-4 h-4" />
                {car.fuel?.name || 'N/A'}
              </div>
              <div className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                {car.transmission?.name || 'N/A'}
              </div>
            </div>

            {car.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {car.location}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
              <Button size="sm" variant="outline">
                <Phone className="w-4 h-4 mr-1" />
                Contact
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Premium Cars from South Korea</h1>
              <p className="text-muted-foreground">
                Discover high-quality vehicles with comprehensive filtering
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and sort bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>
                Search
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {totalCount > 0 && (
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {totalCount.toLocaleString()} cars found
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <EnhancedCarFilter
                filters={filters}
                filterOptions={filterOptions}
                onFiltersChange={setFilters}
                onResetFilters={resetFilters}
                loadingFilters={loadingFilters}
                totalResults={totalCount}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Error State */}
            {error && (
              <Card className="p-6 text-center">
                <p className="text-destructive">Error: {error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </Card>
            )}

            {/* Loading State */}
            {loading && cars.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="w-full h-48 bg-muted animate-pulse" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-6 bg-muted animate-pulse rounded" />
                      <div className="h-8 bg-muted animate-pulse rounded" />
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="h-4 bg-muted animate-pulse rounded" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Cars Grid/List */}
            {!loading && cars.length > 0 && (
              <>
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }>
                  {cars.map((car) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      isHighlighted={car.id === highlightCarId}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More Cars'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* No Results */}
            {!loading && cars.length === 0 && !error && (
              <Card className="p-12 text-center">
                <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No cars found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};