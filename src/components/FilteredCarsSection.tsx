import CarCard from "./CarCard";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertCircle, Filter, SortAsc, ChevronDown } from "lucide-react";

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

const FilteredCarsSection = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  // const [displayedCars, setDisplayedCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showMoreCars, setShowMoreCars] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  // Sorting and filtering states
  const [sortBy, setSortBy] = useState<'price' | 'year' | 'make'>('price');
  const [filterMake, setFilterMake] = useState<string>('all');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [filterFuel, setFilterFuel] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterTransmission, setFilterTransmission] = useState<string>('all');
  const [filterBodyType, setFilterBodyType] = useState<string>('all');
  const [mileageRange, setMileageRange] = useState<[number, number]>([0, 300000]);

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

  const fetchCars = async (page=1, minutes?: number) => {
    setLoading(true);
    setError(null);

    try {
      await delay(500);

      const params = new URLSearchParams({
      per_page: '50',
      page: page.toString(),
      simple_paginate: '0'
      });

      if (minutes) {
        params.append('minutes', minutes.toString());
      }

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

      const newCars = page === 1 ? transformedCars : [...cars, ...transformedCars];
      setCars(newCars);
      setFilteredCars(newCars);
      if (page > 1 && carListRef.current) {
      carListRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      setCurrentPage(page);
      setHasMorePages(transformedCars.length === 50);
      setLastUpdate(new Date());
      console.log(`Successfully loaded ${transformedCars.length} cars from API`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      console.error('API Error:', err);
      
      // Use fallback data on error with KORAUTO markup
      const fallbackCars: Car[] = [
        { id: '1', make: 'BMW', model: 'M3', year: 2022, price: 67300, mileage: '25,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '2', make: 'Mercedes-Benz', model: 'C-Class', year: 2021, price: 47300, mileage: '30,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '3', make: 'Audi', model: 'A4', year: 2023, price: 44300, mileage: '15,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '4', make: 'Volkswagen', model: 'Golf', year: 2022, price: 30300, mileage: '20,000 km', transmission: 'manual', fuel: 'benzinë' },
        { id: '5', make: 'Porsche', model: 'Cayenne', year: 2021, price: 87300, mileage: '35,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '6', make: 'Tesla', model: 'Model S', year: 2023, price: 97300, mileage: '10,000 km', transmission: 'automatic', fuel: 'elektrike' },
        { id: '7', make: 'Ford', model: 'Mustang', year: 2022, price: 57300, mileage: '18,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '8', make: 'Chevrolet', model: 'Camaro', year: 2021, price: 50300, mileage: '22,000 km', transmission: 'manual', fuel: 'benzinë' },
        { id: '9', make: 'Jaguar', model: 'F-Type', year: 2022, price: 80300, mileage: '12,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '10', make: 'Land Rover', model: 'Range Rover', year: 2023, price: 95300, mileage: '8,000 km', transmission: 'automatic', fuel: 'benzinë' },
        { id: '11', make: 'Lexus', model: 'RX', year: 2022, price: 62300, mileage: '28,000 km', transmission: 'automatic', fuel: 'hybrid' },
        { id: '12', make: 'Infiniti', model: 'Q50', year: 2021, price: 45300, mileage: '32,000 km', transmission: 'automatic', fuel: 'benzinë' }
      ];
      setCars(fallbackCars);
      setFilteredCars(fallbackCars);
      setLastUpdate(new Date());
      console.log('Using fallback car data');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCars();
  }, []);

  // // Update displayed cars when filtered cars change
  // useEffect(() => {
  //   const carLimit = showMoreCars ? filteredCars.length : 6;
  //   setDisplayedCars(filteredCars.slice(0, carLimit));
  // }, [filteredCars, showMoreCars]);

  // Sorting and filtering logic
  useEffect(() => {
    let filtered = [...cars];

    // Apply filters
    if (filterMake && filterMake !== 'all') {
      filtered = filtered.filter(car => 
        car.make.toLowerCase().includes(filterMake.toLowerCase())
      );
    }

    if (filterModel && filterModel !== 'all') {
      filtered = filtered.filter(car => 
        car.model.toLowerCase().includes(filterModel.toLowerCase())
      );
    }

    if (filterYear && filterYear !== 'all') {
      filtered = filtered.filter(car => 
        car.year.toString().includes(filterYear)
      );
    }

    if (filterFuel && filterFuel !== 'all') {
      filtered = filtered.filter(car => 
        car.fuel?.toLowerCase().includes(filterFuel.toLowerCase())
      );
    }

    if (filterColor && filterColor !== 'all') {
      filtered = filtered.filter(car => 
        car.color?.toLowerCase().includes(filterColor.toLowerCase())
      );
    }

    if (filterTransmission && filterTransmission !== 'all') {
      filtered = filtered.filter(car => 
        car.transmission?.toLowerCase().includes(filterTransmission.toLowerCase())
      );
    }

    if (filterBodyType && filterBodyType !== 'all') {
      filtered = filtered.filter(car => 
        car.title?.toLowerCase().includes(filterBodyType.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(car => 
      car.price >= priceRange[0] && car.price <= priceRange[1]
    );

    // Filter by mileage range
    filtered = filtered.filter(car => {
      if (!car.mileage) return true;
      const mileageNum = parseInt(car.mileage.replace(/[^\d]/g, ''));
      return mileageNum >= mileageRange[0] && mileageNum <= mileageRange[1];
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'year':
          return b.year - a.year;
        case 'make':
          return a.make.localeCompare(b.make);
        default:
          return 0;
      }
    });

    setFilteredCars(filtered);
  }, [cars, sortBy, filterMake, filterModel, filterYear, filterFuel, filterColor, filterTransmission, filterBodyType, priceRange, mileageRange]);

  const handleRefresh = () => {
    fetchCars();
  };

  const clearFilters = () => {
    setSortBy('price');
    setFilterMake('all');
    setFilterModel('all');
    setFilterYear('all');
    setFilterFuel('all');
    setFilterColor('all');
    setFilterTransmission('all');
    setFilterBodyType('all');
    setPriceRange([0, 200000]);
    setMileageRange([0, 300000]);
    setShowMoreFilters(false);
  };

  // Get unique values for filter dropdowns
  const uniqueMakes = [...new Set(cars.map(car => car.make))].sort();
  const uniqueModels = [...new Set(cars.map(car => car.model))].sort();
  const uniqueYears = [...new Set(cars.map(car => car.year))].sort((a, b) => b - a);
  const uniqueFuels = [...new Set(cars.map(car => car.fuel).filter(Boolean))].sort();
  const uniqueColors = [...new Set(cars.map(car => car.color).filter(Boolean))].sort();
  const uniqueTransmissions = [...new Set(cars.map(car => car.transmission).filter(Boolean))].sort();
  const uniqueBodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Pickup'];

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

        {/* Filters and Sorting */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-card rounded-lg border border-border mx-2 sm:mx-0">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <h3 className="text-base sm:text-lg font-semibold">Kërko & Filtro Makinat</h3>
          </div>
          
          {/* Main Filters - Always Visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Marka</label>
              <Select value={filterMake} onValueChange={setFilterMake}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Të gjitha Markat" />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60">
                  <SelectItem value="all">Të gjitha Markat</SelectItem>
                  {uniqueMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Modeli</label>
              <Select value={filterModel} onValueChange={setFilterModel}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Të gjithë Modelet" />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60">
                  <SelectItem value="all">Të gjithë Modelet</SelectItem>
                  {uniqueModels.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Viti</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Të gjithë Vitet" />
                </SelectTrigger>
                <SelectContent className="z-100 max-h-60">
                  <SelectItem value="all">Të gjithë Vitet</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Çmimi max (€)</label>
              <Input 
                type="number" 
                placeholder="200000"
                className="h-11"
                value={priceRange[1] === 200000 ? '' : priceRange[1].toString()}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 200000])}
              />
            </div>
          </div>

          {/* Additional Filters - Collapsible */}
          {showMoreFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium mb-2 block">Rendit sipas</label>
                <Select value={sortBy} onValueChange={(value: 'price' | 'year' | 'make') => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Çmimi (Nga i ulëti te i larti)</SelectItem>
                    <SelectItem value="year">Viti (Më i riu së pari)</SelectItem>
                    <SelectItem value="make">Marka (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Çmimi min (€)</label>
                <Input 
                  type="number" 
                  placeholder="0"
                  value={priceRange[0] === 0 ? '' : priceRange[0].toString()}
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Karburanti</label>
                <Select value={filterFuel} onValueChange={setFilterFuel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Të gjithë" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Të gjithë</SelectItem>
                    {uniqueFuels.map(fuel => (
                      <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ngjyra</label>
                <Select value={filterColor} onValueChange={setFilterColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Të gjitha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Të gjitha</SelectItem>
                    {uniqueColors.map(color => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Transmisioni</label>
                <Select value={filterTransmission} onValueChange={setFilterTransmission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Të gjithë" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Të gjithë</SelectItem>
                    {uniqueTransmissions.map(transmission => (
                      <SelectItem key={transmission} value={transmission}>{transmission}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Lloji i Karosërisë</label>
                <Select value={filterBodyType} onValueChange={setFilterBodyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Të gjithë" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Të gjithë</SelectItem>
                    {uniqueBodyTypes.map(bodyType => (
                      <SelectItem key={bodyType} value={bodyType}>{bodyType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Km min</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={mileageRange[0] === 0 ? '' : mileageRange[0].toString()}
                  onChange={(e) => setMileageRange([parseInt(e.target.value) || 0, mileageRange[1]])}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Km max</label>
                <Input 
                  type="number" 
                  placeholder="300000"
                  value={mileageRange[1] === 300000 ? '' : mileageRange[1].toString()}
                  onChange={(e) => setMileageRange([mileageRange[0], parseInt(e.target.value) || 300000])}
                />
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
              {filteredCars.length} makina të gjetura
            </span>
          </div>
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
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-base sm:text-lg text-muted-foreground mb-4">
              Nuk u gjetën makina me këto filtra.
            </p>
            <Button onClick={clearFilters} variant="outline" className="min-h-[44px]">
              Pastro Filtrat
            </Button>
          </div>
        ) : (
          <>
            <div ref={carListRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
              {filteredCars.map((car) => (
                <CarCard key={car.id} {...car} />
              ))}
            </div>
            
            {hasMorePages && (
              <div className="text-center px-4">
                <Button 
                   onClick={() => fetchCars(currentPage + 1)}
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 min-h-[48px] text-base"
                >
                  Shfaq Më Shumë Makina të tjera
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FilteredCarsSection;