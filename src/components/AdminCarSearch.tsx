
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
  source?: 'cached' | 'api'; // Add source tracking
}

interface CachedCarData {
  api_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  lot_number?: string;
  car_data: Record<string, any>;
  price?: number;
  mileage?: string;
  color?: string;
  fuel?: string;
  transmission?: string;
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

  // Comprehensive search function across all API data
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
      console.log('🔍 Comprehensive search for:', term);

      const allResults: CarSearchResult[] = [];

      // 1. First search in cached cars (fastest) - Enhanced with exact and partial matches
      console.log('🔍 Searching cached database...');
      
      // Enhanced search: exact matches first, then partial matches
      const searchQueries = [
        // Exact matches (highest priority)
        supabase
          .from('active_cars')
          .select('api_id, make, model, year, vin, lot_number, car_data, price, mileage, color, fuel, transmission')
          .or(`api_id.eq.${term},lot_number.eq.${term},vin.eq.${term}`)
          .limit(5),
        
        // Partial matches with ilike (secondary priority)
        supabase
          .from('active_cars')
          .select('api_id, make, model, year, vin, lot_number, car_data, price, mileage, color, fuel, transmission')
          .or(`api_id.ilike.%${term}%,vin.ilike.%${term}%,lot_number.ilike.%${term}%`)
          .limit(8),
          
        // Additional broad search including make/model if term is longer
        ...(term.length >= 4 ? [
          supabase
            .from('active_cars')
            .select('api_id, make, model, year, vin, lot_number, car_data, price, mileage, color, fuel, transmission')
            .or(`make.ilike.%${term}%,model.ilike.%${term}%`)
            .limit(5)
        ] : [])
      ];

      const cachedResults = await Promise.all(searchQueries);
      const allCachedCars: CachedCarData[] = [];
      
      // Combine results from all queries, removing duplicates
      cachedResults.forEach(({ data: cars, error }) => {
        if (!error && cars && cars.length > 0) {
          cars.forEach(car => {
            if (!allCachedCars.some(existing => existing.api_id === car.api_id)) {
              // Cast car_data from Json to Record<string, any> to match CachedCarData interface
              const cachedCar: CachedCarData = {
                ...car,
                car_data: car.car_data as Record<string, any>
              };
              allCachedCars.push(cachedCar);
            }
          });
        }
      });

      if (allCachedCars && allCachedCars.length > 0) {
        console.log('✅ Found cached cars:', allCachedCars.length);
        const cachedCarResults = allCachedCars.map((car: CachedCarData) => {
          const carData = car.car_data as Record<string, any>;
          const lot = carData?.lots?.[0];
          
          return {
            id: car.api_id,
            year: car.year,
            make: car.make,
            model: car.model,
            vin: car.vin,
            lot_number: car.lot_number || lot?.lot,
            price: car.price || (lot?.buy_now ? Math.round(lot.buy_now) : undefined),
            image: lot?.images?.normal?.[0] || lot?.images?.big?.[0],
            mileage: car.mileage || (lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined),
            fuel: car.fuel || carData?.fuel?.name,
            transmission: car.transmission || carData?.transmission?.name,
            color: car.color || carData?.color?.name,
            source: 'cached' as const,
          };
        });
        allResults.push(...cachedCarResults);
      }



      // 2. Comprehensive API search across all data sources
      console.log('🔍 Searching across all API data sources...');
      
      // Define multiple search methods for comprehensive coverage
      const searchMethods = [
        // Direct car ID search
        {
          method: "Car ID",
          payload: {
            endpoint: "cars",
            carId: term,
          },
        },
        // Lot number search in IAAI
        {
          method: "Lot Number (IAAI)",
          payload: {
            endpoint: "search-lot",
            lotNumber: term,
          },
        },
        // General search with filters
        {
          method: "General Search",
          payload: {
            endpoint: "cars",
            filters: {
              search: term,
              per_page: '10'
            },
          },
        },
        // VIN-specific search
        {
          method: "VIN Search",
          payload: {
            endpoint: "cars",
            filters: {
              vin: term,
              per_page: '10'
            },
          },
        },
        // Enhanced lot-specific search
        {
          method: "Enhanced Lot Search",
          payload: {
            endpoint: "cars",
            filters: {
              lot_number: term,
              per_page: '10'
            },
          },
        },
      ];

      // Try each search method and collect results
      let apiSearchSuccessful = false;
      for (const searchMethod of searchMethods) {
        try {
          console.log(`🔍 Trying ${searchMethod.method}...`);

          const response = await supabase.functions.invoke('secure-cars-api', {
            body: searchMethod.payload
          });

          if (!response.error && response.data) {
            let apiResults: CarSearchResult[] = [];
            
            // Handle different response formats
            let carData = null;
            
            if (response.data.data && Array.isArray(response.data.data)) {
              // If it's a search result with data array
              carData = response.data.data;
            } else if (response.data.lots && response.data.lots.length > 0) {
              // If it's a direct car result
              carData = [response.data];
            } else if (Array.isArray(response.data)) {
              // If it's an array of cars
              carData = response.data;
            } else if (response.data.id || response.data.year) {
              // If it's a single car object
              carData = [response.data];
            }

            if (carData && Array.isArray(carData)) {
              console.log(`✅ Found ${carData.length} results via ${searchMethod.method}`);
              apiSearchSuccessful = true;
              
              apiResults = carData.map((car: Record<string, any>) => {
                const lot = car.lots?.[0];
                return {
                  id: car.id || car.api_id,
                  year: car.year,
                  make: car.manufacturer?.name || car.make || 'Unknown',
                  model: car.model?.name || car.model || 'Unknown',
                  vin: car.vin,
                  lot_number: car.lot_number || lot?.lot,
                  price: lot?.buy_now ? Math.round(lot.buy_now) : undefined,
                  image: lot?.images?.normal?.[0] || lot?.images?.big?.[0],
                  mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined,
                  fuel: car.fuel?.name,
                  transmission: car.transmission?.name,
                  color: car.color?.name,
                  source: 'api' as const,
                };
              });

              // Add to results, avoiding duplicates
              apiResults.forEach(result => {
                if (!allResults.some(existing => existing.id === result.id)) {
                  allResults.push(result);
                }
              });
            }
          }
        } catch (methodError) {
          console.log(`⚠️ ${searchMethod.method} failed:`, methodError);
          // Continue with next method
        }
      }

      // Provide feedback based on API search results
      if (!apiSearchSuccessful && allResults.length === 0) {
        console.log('ℹ️ No API results due to network restrictions, showing cached results only');
      }

      // Remove duplicates based on ID and sort by relevance
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.id === result.id)
      );

      // Sort results: exact ID matches first, then lot number matches, then others
      const sortedResults = uniqueResults.sort((a, b) => {
        const termLower = term.toLowerCase();
        const aIdMatch = a.id.toLowerCase() === termLower;
        const bIdMatch = b.id.toLowerCase() === termLower;
        const aLotMatch = a.lot_number?.toLowerCase() === termLower;
        const bLotMatch = b.lot_number?.toLowerCase() === termLower;
        
        if (aIdMatch && !bIdMatch) return -1;
        if (!aIdMatch && bIdMatch) return 1;
        if (aLotMatch && !bLotMatch) return -1;
        if (!aLotMatch && bLotMatch) return 1;
        
        return 0;
      });

      setSearchResults(sortedResults.slice(0, 10)); // Limit to 10 results

      if (sortedResults.length === 0) {
        toast({
          title: 'No results found',
          description: `No cars found matching "${term}". Searched ${allCachedCars.length > 0 ? 'cached database and ' : ''}live APIs across multiple auction sources.`,
          variant: 'default',
        });
      } else {
        const sourceBreakdown = sortedResults.reduce((acc, car) => {
          acc[car.source] = (acc[car.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const sourceText = Object.entries(sourceBreakdown)
          .map(([source, count]) => `${count} from ${source === 'cached' ? 'database' : 'live API'}`)
          .join(', ');
        
        toast({
          title: 'Search completed successfully',
          description: `Found ${sortedResults.length} car${sortedResults.length !== 1 ? 's' : ''}: ${sourceText}`,
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
            Enhanced Car Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search by Car ID, Lot Number, VIN... (enhanced search: exact matches first, then partial)"
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
                                  <Badge 
                                    variant={car.source === 'cached' ? 'default' : 'secondary'} 
                                    className="text-xs"
                                  >
                                    {car.source === 'cached' ? '💾 Cached' : '🌐 Live API'}
                                  </Badge>
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
                  <p className="text-xs mt-1">Comprehensive search across cached database and live APIs</p>
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