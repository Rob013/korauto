import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Car, ExternalLink, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CarSearchResult {
  id: string;
  year: number;
  make: string;
  model: string;
  vin?: string;
  lot_number?: string;
  price?: number;
  image?: string;
  mileage?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
}

interface AdminCarSearchProps {
  className?: string;
}

const AdminCarSearch: React.FC<AdminCarSearchProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CarSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (term.length < 3) {
      return; // Don't search for very short terms
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      console.log('🔍 Searching for:', term);

      // First try to search in cached cars
      const { data: cachedCars, error: cacheError } = await supabase
        .from('cars_cache')
        .select('api_id, make, model, year, vin, lot_number, car_data')
        .or(`api_id.ilike.%${term}%,vin.ilike.%${term}%,lot_number.ilike.%${term}%`)
        .limit(10);

      let results: CarSearchResult[] = [];

      if (cachedCars && cachedCars.length > 0) {
        console.log('✅ Found cached cars:', cachedCars.length);
        results = cachedCars.map(car => {
          const carData = car.car_data as any;
          const lot = carData?.lots?.[0];
          
          return {
            id: car.api_id,
            year: car.year,
            make: car.make,
            model: car.model,
            vin: car.vin,
            lot_number: car.lot_number || lot?.lot,
            price: lot?.buy_now ? Math.round(lot.buy_now + 2200) : undefined,
            image: lot?.images?.normal?.[0] || lot?.images?.big?.[0],
            mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined,
            fuel: carData?.fuel?.name,
            transmission: carData?.transmission?.name,
            color: carData?.color?.name,
          };
        });
      }

      // If no cached results, try API search
      if (results.length === 0) {
        console.log('🔍 No cached results, trying API search...');
        
        try {
          const { data: apiData, error: apiError } = await supabase.functions.invoke(
            'secure-cars-api',
            {
              body: {
                endpoint: 'cars',
                filters: {
                  search: term,
                  per_page: '10'
                }
              }
            }
          );

          if (!apiError && apiData?.data) {
            console.log('✅ API search results:', apiData.data.length);
            results = apiData.data.map((car: any) => {
              const lot = car.lots?.[0];
              return {
                id: car.id,
                year: car.year,
                make: car.manufacturer?.name || 'Unknown',
                model: car.model?.name || 'Unknown',
                vin: car.vin,
                lot_number: car.lot_number || lot?.lot,
                price: lot?.buy_now ? Math.round(lot.buy_now + 2200) : undefined,
                image: lot?.images?.normal?.[0] || lot?.images?.big?.[0],
                mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined,
                fuel: car.fuel?.name,
                transmission: car.transmission?.name,
                color: car.color?.name,
              };
            });
          }
        } catch (apiError) {
          console.error('API search error:', apiError);
        }
      }

      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: 'No results found',
          description: `No cars found matching "${term}"`,
          variant: 'default',
        });
      }

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search for cars. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Handle search input with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 500); // 500ms debounce
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    inputRef.current?.focus();
  }, []);

  // Open car details
  const openCarDetails = useCallback((carId: string) => {
    const url = `/car/${carId}`;
    window.open(url, '_blank');
    toast({
      title: 'Opening car details',
      description: `Opening car details for ID: ${carId}`,
    });
  }, [toast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Car Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search by Car ID, Lot Number, or VIN..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => performSearch(searchTerm)}
              disabled={isSearching || !searchTerm.trim()}
              className="flex items-center gap-1"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {/* Search Results */}
          {showResults && (
            <div className="mt-4">
              {isSearching ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((car) => (
                      <div
                        key={car.id}
                        className="group relative p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all duration-200 bg-card/50 hover:bg-card cursor-pointer"
                        onClick={() => openCarDetails(car.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Car Image */}
                          <div className="shrink-0 w-16 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {car.image ? (
                              <img
                                src={car.image}
                                alt={`${car.year} ${car.make} ${car.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Car className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Car Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm text-foreground truncate">
                                  {car.year} {car.make} {car.model}
                                </h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    ID: {car.id}
                                  </Badge>
                                  {car.lot_number && (
                                    <Badge variant="outline" className="text-xs">
                                      Lot: {car.lot_number}
                                    </Badge>
                                  )}
                                  {car.vin && (
                                    <Badge variant="outline" className="text-xs">
                                      VIN: {car.vin.slice(-6)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>

                            {/* Additional Info */}
                            <div className="text-xs text-muted-foreground space-y-1">
                              {car.price && (
                                <div>Price: €{car.price.toLocaleString()}</div>
                              )}
                              <div className="flex gap-4">
                                {car.mileage && <span>📏 {car.mileage}</span>}
                                {car.fuel && <span>⛽ {car.fuel}</span>}
                                {car.transmission && <span>⚙️ {car.transmission}</span>}
                                {car.color && <span>🎨 {car.color}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No cars found matching "{searchTerm}"</p>
                  <p className="text-xs mt-1">Try searching by Car ID, Lot Number, or VIN</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCarSearch;