import CarCard from "./CarCard";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertCircle, Filter, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filters, setFilters] = useState<ApiFilters>({});
  const [manufacturers, setManufacturers] = useState<{id: number, name: string}[]>([]);
  const [models, setModels] = useState<{id: number, name: string}[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [koreaOptions, setKoreaOptions] = useState<any>(null);
  
  // API configuration
  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const tryApiEndpoint = async (endpoint: string, params: URLSearchParams, retryCount = 0): Promise<any> => {
    console.log(`API Request: ${API_BASE_URL}${endpoint}?${params}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });

      if (response.status === 429) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${retryCount + 1}`);
        
        if (retryCount < 3) {
          await delay(waitTime);
          return tryApiEndpoint(endpoint, params, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded after retries');
        }
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`API Success: ${data?.data?.length || 0} cars received`);
      return data;
    } catch (err) {
      console.error(`API Request failed:`, err);
      throw err;
    }
  };

  const fetchCars = async (apiFilters?: ApiFilters) => {
    const params = new URLSearchParams({
      per_page: '12',
      page: '1',
      simple_paginate: '0'
    });

    // Add API filters
    if (apiFilters?.manufacturer_id) {
      params.append('manufacturer_id', apiFilters.manufacturer_id);
    }
    if (apiFilters?.model_id) {
      params.append('model_id', apiFilters.model_id);
    }
    if (apiFilters?.color) {
      params.append('color', apiFilters.color);
    }
    if (apiFilters?.odometer_from_km) {
      params.append('odometer_from_km', apiFilters.odometer_from_km);
    }
    if (apiFilters?.odometer_to_km) {
      params.append('odometer_to_km', apiFilters.odometer_to_km);
    }
    if (apiFilters?.from_year) {
      params.append('from_year', apiFilters.from_year);
    }
    if (apiFilters?.to_year) {
      params.append('to_year', apiFilters.to_year);
    }
    if (apiFilters?.buy_now_price_from) {
      params.append('buy_now_price_from', apiFilters.buy_now_price_from);
    }
    if (apiFilters?.buy_now_price_to) {
      params.append('buy_now_price_to', apiFilters.buy_now_price_to);
    }
    if (apiFilters?.transmission) {
      params.append('transmission', apiFilters.transmission);
    }
    if (apiFilters?.fuel_type) {
      params.append('fuel_type', apiFilters.fuel_type);
    }

    await fetchCarsWithParams(params);
  };

  const fetchManufacturers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/manufacturers/cars`, {
        headers: {
          'Accept': '*/*',
          'X-API-Key': API_KEY
        }
      });
      const data = await response.json();
      
      // Prioritize top 4 brands
      const topBrands = ['Audi', 'Volkswagen', 'BMW', 'Mercedes-Benz'];
      const allManufacturers = data.data || [];
      
      const prioritized = [];
      const others = [];
      
      allManufacturers.forEach(manufacturer => {
        if (topBrands.includes(manufacturer.name)) {
          prioritized.push(manufacturer);
        } else {
          others.push(manufacturer);
        }
      });
      
      // Sort prioritized by the order defined in topBrands
      prioritized.sort((a, b) => topBrands.indexOf(a.name) - topBrands.indexOf(b.name));
      
      // Sort others alphabetically
      others.sort((a, b) => a.name.localeCompare(b.name));
      
      setManufacturers([...prioritized, ...others]);
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

  const formatPrice = (price: string | number) =>
    price
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(Number(price))
      : 'N/A';

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

  const fetchKoreaOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/korea-options`, {
        headers: {
          'Accept': '*/*',
          'X-API-Key': API_KEY
        }
      });
      const data = await response.json();
      setKoreaOptions(data);
    } catch (err) {
      console.error('Failed to fetch Korea options:', err);
    }
  };

  // Initial fetch with random offset for homepage
  useEffect(() => {
    // Generate random page number to get different cars each time
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const params = new URLSearchParams({
      per_page: '12',
      page: randomPage.toString(),
      simple_paginate: '0'
    });
    
    Promise.all([
      fetchCarsWithParams(params),
      fetchManufacturers(),
      fetchKoreaOptions()
    ]);
  }, []);

  const fetchCarsWithParams = async (customParams?: URLSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      await delay(500);

      const params = customParams || new URLSearchParams({
        per_page: '12',
        page: '1',
        simple_paginate: '0'
      });

      console.log('Fetching cars from API...');
      const data = await tryApiEndpoint('/cars', params);

      if (!data) {
        throw new Error('No data received from API');
      }
      
      const carsArray = Array.isArray(data.data) ? data.data : [];
      console.log(`Raw API data:`, carsArray);
      
      const transformedCars: Car[] = carsArray.map((car: any, index: number) => {
        const lot = car.lots?.[0];
        const basePrice = lot?.buy_now || lot?.final_bid || 25000 + (index * 1000);
        const price = Math.round(basePrice + 2300);
        
        const images = lot?.images?.normal;
        const image = Array.isArray(images) && images.length > 0 ? images[0] : undefined;
        
        const odometer = lot?.odometer;
        const mileage = odometer?.km ? `${odometer.km.toLocaleString()} km` : undefined;
        
        return {
          id: car.id?.toString() || `car-${index}`,
          make: car.manufacturer?.name || 'Unknown',
          model: car.model?.name || 'Unknown',
          year: car.year || 2020,
          price: price,
          image: image,
          vin: car.vin,
          mileage: mileage,
          transmission: car.transmission?.name,
          fuel: car.fuel?.name,
          color: car.color?.name,
          lot: lot?.lot,
          title: car.title
        };
      });

      console.log(`Transformed cars:`, transformedCars);

      if (transformedCars.length === 0) {
        throw new Error('No cars returned from API');
      }

      setCars(transformedCars);
      setLastUpdate(new Date());
      console.log(`Successfully loaded ${transformedCars.length} cars from API`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      console.error('API Error:', err);
      
      // Use fallback data on error
      const fallbackCars: Car[] = [
        { id: '1', make: 'BMW', model: 'M3', year: 2022, price: 67300, mileage: '25,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '2', make: 'Mercedes-Benz', model: 'C-Class', year: 2021, price: 47300, mileage: '30,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '3', make: 'Audi', model: 'A4', year: 2023, price: 44300, mileage: '15,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '4', make: 'Volkswagen', model: 'Golf', year: 2022, price: 30300, mileage: '20,000 km', transmission: 'manual', fuel: 'benzinë' },
        { id: '5', make: 'Porsche', model: 'Cayenne', year: 2021, price: 87300, mileage: '35,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '6', make: 'Tesla', model: 'Model S', year: 2023, price: 97300, mileage: '10,000 km', transmission: 'automatic', fuel: 'elektrike' }
      ];
      setCars(fallbackCars);
      setLastUpdate(new Date());
      console.log('Using fallback car data');
    } finally {
      setLoading(false);
    }
  };

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

  // Re-fetch when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchCars(filters);
    }
  }, [filters]);

  const handleRefresh = () => {
    fetchCars(filters);
  };

  const clearFilters = () => {
    setFilters({});
    setModels([]);
    setStatistics(null);
    setDuplicates([]);
    setShowMoreFilters(false);
    setShowDuplicates(false);
    fetchCars();
  };

  // Get unique values for filter dropdowns
  const uniqueMakes = [...new Set(cars.map(car => car.make))].sort();
  const uniqueColors = [...new Set(cars.map(car => car.color).filter(Boolean))].sort();
  const uniqueFuels = [...new Set(cars.map(car => car.fuel).filter(Boolean))].sort();

  return (
    <section id="cars" className="py-8 sm:py-12 lg:py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 mb-6 sm:mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mx-4 sm:mx-0">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-yellow-800 text-sm sm:text-base text-left sm:text-center">
              Problem me lidhjen API: {error}. Duke shfaqur makina demo me shërbim të plotë inspektimi të disponueshëm.
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-card rounded-lg border border-border mx-2 sm:mx-0">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <h3 className="text-base sm:text-lg font-semibold">Kërko & Filtro Makinat</h3>
          </div>
          
          {/* Main Filters - Always Visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Marka</label>
              <Select value={filters.manufacturer_id || ''} onValueChange={(value) => setFilters({...filters, manufacturer_id: value || undefined, model_id: undefined})}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Të gjitha Markat" />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60">
                  {manufacturers.map(manufacturer => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>{manufacturer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Modeli</label>
              <Select value={filters.model_id || ''} onValueChange={(value) => setFilters({...filters, model_id: value || undefined})} disabled={!filters.manufacturer_id}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={filters.manufacturer_id ? "Të gjithë Modelet" : "Zgjidh markën së pari"} />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60">
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id.toString()}>{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Viti</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nga"
                  type="number"
                  value={filters.from_year || ''}
                  onChange={(e) => setFilters({...filters, from_year: e.target.value || undefined})}
                />
                <Input
                  placeholder="Deri"
                  type="number"
                  value={filters.to_year || ''}
                  onChange={(e) => setFilters({...filters, to_year: e.target.value || undefined})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Çmimi ($)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nga"
                  type="number"
                  value={filters.buy_now_price_from || ''}
                  onChange={(e) => setFilters({...filters, buy_now_price_from: e.target.value || undefined})}
                />
                <Input
                  placeholder="Deri"
                  type="number"
                  value={filters.buy_now_price_to || ''}
                  onChange={(e) => setFilters({...filters, buy_now_price_to: e.target.value || undefined})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Transmisioni</label>
              <Select value={filters.transmission || ''} onValueChange={(value) => setFilters({...filters, transmission: value || undefined})}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Të gjithë" />
                </SelectTrigger>
                <SelectContent>
                  {koreaOptions?.transmissions ? koreaOptions.transmissions.map((transmission: any) => (
                    <SelectItem key={transmission.id} value={transmission.id.toString()}>{transmission.name}</SelectItem>
                  )) : (
                    <>
                      <SelectItem value="1">Automatik</SelectItem>
                      <SelectItem value="2">Manual</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Filters - Collapsible */}
          {showMoreFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium mb-2 block">Karburanti</label>
                <Select value={filters.fuel_type || ''} onValueChange={(value) => setFilters({...filters, fuel_type: value || undefined})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Të gjithë" />
                  </SelectTrigger>
                  <SelectContent>
                    {koreaOptions?.fuel_types ? koreaOptions.fuel_types.map((fuel: any) => (
                      <SelectItem key={fuel.id} value={fuel.id.toString()}>{fuel.name}</SelectItem>
                    )) : (
                      <>
                        <SelectItem value="4">Benzinë</SelectItem>
                        <SelectItem value="5">Diesel</SelectItem>
                        <SelectItem value="6">Hibrid</SelectItem>
                        <SelectItem value="7">Elektrik</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Kilometrazhi (km)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nga"
                    type="number"
                    value={filters.odometer_from_km || ''}
                    onChange={(e) => setFilters({...filters, odometer_from_km: e.target.value || undefined})}
                  />
                  <Input
                    placeholder="Deri"
                    type="number"
                    value={filters.odometer_to_km || ''}
                    onChange={(e) => setFilters({...filters, odometer_to_km: e.target.value || undefined})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ngjyra</label>
                <Select value={filters.color || ''} onValueChange={(value) => setFilters({...filters, color: value || undefined})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Të gjitha" />
                  </SelectTrigger>
                  <SelectContent>
                    {koreaOptions?.colors ? koreaOptions.colors.map((color: any) => (
                      <SelectItem key={color.id} value={color.id.toString()}>{color.name}</SelectItem>
                    )) : (
                      <>
                        <SelectItem value="13">E bardhë</SelectItem>
                        <SelectItem value="1">E zezë</SelectItem>
                        <SelectItem value="2">E hirtë</SelectItem>
                        <SelectItem value="3">E kuqe</SelectItem>
                        <SelectItem value="4">E kaltër</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="flex items-center gap-2"
            >
              {showMoreFilters ? 'Fshih Filtrat' : 'Shfaq Më Shumë Filtra'}
              <ChevronDown className={`h-4 w-4 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Pastro Filtrat
            </Button>
            
            <span className="text-sm text-muted-foreground flex items-center">
              {cars.length} makina të gjetura
            </span>
          </div>
        </div>

        {/* Statistics Display */}
        {statistics && (
          <div className="bg-card border rounded-lg p-6 mb-8 mx-2 sm:mx-0">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {manufacturers.find(m => m.id.toString() === filters.manufacturer_id)?.name} Statistikat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statistics.total_cars && (
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statistics.total_cars.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Makina Totale</div>
                </div>
              )}
              {statistics.average_price && (
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatPrice(statistics.average_price)}</div>
                  <div className="text-sm text-muted-foreground">Çmimi Mesatar</div>
                </div>
              )}
              {statistics.price_range && (
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-sm font-bold text-primary">
                    {formatPrice(statistics.price_range.min)} - {formatPrice(statistics.price_range.max)}
                  </div>
                  <div className="text-sm text-muted-foreground">Diapazoni i Çmimit</div>
                </div>
              )}
              {statistics.average_year && (
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-primary">{Math.round(statistics.average_year)}</div>
                  <div className="text-sm text-muted-foreground">Viti Mesatar</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Duplicates Display */}
        {showDuplicates && (
          <div className="bg-card border rounded-lg p-6 mb-8 mx-2 sm:mx-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Analiza e Duplikateve nga Korea
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDuplicates(5)}
                >
                  5 min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDuplicates(10)}
                >
                  10 min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDuplicates(60)}
                >
                  1 orë
                </Button>
              </div>
            </div>
            
            {duplicates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nuk u gjetën duplikate në periudhën e zgjedhur.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-destructive">{duplicates.length}</div>
                    <div className="text-sm text-muted-foreground">Duplikate Totale</div>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {Array.from(new Set(duplicates.map(d => d.manufacturer?.name))).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Marka të Prekura</div>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-warning">
                      {duplicates.filter(d => d.lots?.length > 1).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Lot të Shumëfishta</div>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {duplicates.slice(0, 9).map((duplicate, index) => (
                      <Card key={index} className="border-destructive/20">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-sm mb-2 line-clamp-1">
                            {duplicate.title || `${duplicate.manufacturer?.name} ${duplicate.model?.name}`}
                          </h4>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>Viti: {duplicate.year}</div>
                            <div>Lots: {duplicate.lots?.length || 0}</div>
                            <div>VIN: {duplicate.vin?.slice(-8) || 'N/A'}</div>
                          </div>
                          <Badge variant="destructive" className="mt-2 text-xs">
                            Duplikat
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {duplicates.length > 9 && (
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      ... dhe {duplicates.length - 9} duplikate të tjera
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
            <Button onClick={clearFilters} variant="outline" className="min-h-[44px]">
              Pastro Filtrat
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
            {cars.map((car) => (
              <CarCard key={car.id} {...car} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeCarsSection;