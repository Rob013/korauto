import CarCard from "./CarCard";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertCircle, Filter, SortAsc } from "lucide-react";

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

const CarsSection = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'year' | 'make'>('price');
  const [filterMake, setFilterMake] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterFuel, setFilterFuel] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterTransmission, setFilterTransmission] = useState<string>('all');
  const [filterBodyType, setFilterBodyType] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [mileageRange, setMileageRange] = useState<[number, number]>([0, 300000]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);

  // Correct API endpoint based on 429 response analysis
  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

  // Add delay between requests to respect rate limits
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
        // Rate limited - implement exponential backoff
        const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s...
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

  const fetchCars = async (minutes?: number) => {
    setLoading(true);
    setError(null);

    try {
      // Add delay to respect rate limits
      await delay(500);

      const params = new URLSearchParams({
        api_key: API_KEY,
        limit: '50' // Demo mode limit
      });

      if (minutes) {
        params.append('minutes', minutes.toString());
      }

      console.log('Fetching cars from API...');
      const data = await tryApiEndpoint('/cars', params);

      if (!data) {
        throw new Error('No data received from API');
      }
      
      // Transform API data to our Car interface
      // API returns cars directly in 'data' array, not 'data.cars'
      const carsArray = Array.isArray(data.data) ? data.data : [];
      console.log(`Raw API data:`, carsArray);
      
      const transformedCars: Car[] = carsArray.map((car: any, index: number) => {
        // Extract price from lots[0].buy_now or lots[0].final_bid
        const lot = car.lots?.[0];
        const basePrice = lot?.buy_now || lot?.final_bid || 25000 + (index * 1000);
        // Add KORAUTO markup of 2300 euro
        const price = Math.round(basePrice + 2300);
        
        // Extract image from lots[0].images.normal[0]
        const images = lot?.images?.normal;
        const image = Array.isArray(images) && images.length > 0 ? images[0] : undefined;
        
        // Extract mileage
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
          condition: lot?.condition?.name,
          lot: lot?.lot,
          title: car.title
        };
      });

      console.log(`Transformed cars:`, transformedCars);

      // If no cars from API, use fallback data
      if (transformedCars.length === 0) {
        throw new Error('No cars returned from API');
      }

      setCars(transformedCars);
      setFilteredCars(transformedCars);
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
        { id: '9', make: 'Jaguar', model: 'F-Type', year: 2022, price: 80300, mileage: '12,000 km', transmission: 'automatic', fuel: 'benzinë' }
      ];
      setCars(fallbackCars);
      setFilteredCars(fallbackCars);
      setLastUpdate(new Date());
      console.log('Using fallback car data');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedLots = async () => {
    try {
      // Add delay to respect rate limits
      await delay(300);

      const params = new URLSearchParams({
        api_key: API_KEY,
        minutes: '60'
      });

      console.log('Fetching archived lots...');
      const data = await tryApiEndpoint('/archived-lots', params);
      const archivedIds = data.archivedLots?.map((lot: any) => lot.id) || [];
      
      // Remove archived cars from current list
      setCars(prevCars => prevCars.filter(car => !archivedIds.includes(car.id)));
      console.log(`Successfully removed ${archivedIds.length} archived cars`);
    } catch (err) {
      console.error('Failed to fetch archived lots:', err);
      // Don't show error to user for archived lots - not critical
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCars();
  }, []);

  // Set up periodic updates with staggered timing to avoid rate limits
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('Running periodic update...');
      await fetchCars(60); // Fetch updates from last 60 minutes
      await delay(2000); // Wait 2 seconds between calls
      await fetchArchivedLots(); // Remove sold cars
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, []);

  // Sorting and filtering logic
  useEffect(() => {
    let filtered = [...cars];

    // Apply filters
    if (filterMake && filterMake !== 'all') {
      filtered = filtered.filter(car => 
        car.make.toLowerCase().includes(filterMake.toLowerCase())
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

    if (filterCondition && filterCondition !== 'all') {
      filtered = filtered.filter(car => 
        car.condition?.toLowerCase().includes(filterCondition.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(car => 
      car.price >= priceRange[0] && car.price <= priceRange[1]
    );

    // Filter by mileage range (extract number from mileage string)
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
          return b.year - a.year; // Newest first
        case 'make':
          return a.make.localeCompare(b.make);
        default:
          return 0;
      }
    });

    setFilteredCars(filtered);
  }, [cars, sortBy, filterMake, filterYear, filterFuel, filterColor, filterTransmission, filterBodyType, filterCondition, priceRange, mileageRange]);

  const handleRefresh = () => {
    fetchCars();
  };

  // Get unique values for filter dropdowns
  const uniqueMakes = [...new Set(cars.map(car => car.make))].sort();
  const uniqueYears = [...new Set(cars.map(car => car.year))].sort((a, b) => b - a);
  const uniqueFuels = [...new Set(cars.map(car => car.fuel).filter(Boolean))].sort();
  const uniqueColors = [...new Set(cars.map(car => car.color).filter(Boolean))].sort();
  const uniqueTransmissions = [...new Set(cars.map(car => car.transmission).filter(Boolean))].sort();
  const uniqueConditions = [...new Set(cars.map(car => car.condition).filter(Boolean))].sort();
  const uniqueBodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Pickup'];

  return (
    <section id="cars" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Makinat e Disponueshme</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Shfletoni përzgjedhjen tonë të mjeteve të cilësisë së lartë. Çdo makinë mund të inspektohet profesionalisht vetëm për €50.
          </p>
          
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Duke u ngarkuar...' : 'Rifresko'}
            </Button>
            {lastUpdate && (
              <span className="text-sm text-muted-foreground">
                Përditësuar për herë të fundit: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              Problem me lidhjen API: {error}. Duke shfaqur makina demo me shërbim të plotë inspektimi të disponueshëm.
            </span>
          </div>
        )}

        {/* Filters and Sorting */}
        <div className="mb-8 p-6 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Kërko & Filtro Makinat</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
              <label className="text-sm font-medium mb-2 block">Marka</label>
              <Select value={filterMake} onValueChange={setFilterMake}>
                <SelectTrigger>
                  <SelectValue placeholder="Të gjitha Markat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjitha Markat</SelectItem>
                  {uniqueMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Viti</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Të gjithë Vitet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjithë Vitet</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
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
              <label className="text-sm font-medium mb-2 block">Çmimi max (€)</label>
              <Input 
                type="number" 
                placeholder="200000"
                value={priceRange[1] === 200000 ? '' : priceRange[1].toString()}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 200000])}
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
              <label className="text-sm font-medium mb-2 block">Lloji i Trupit</label>
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
              <label className="text-sm font-medium mb-2 block">Gjendja</label>
              <Select value={filterCondition} onValueChange={setFilterCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Të gjitha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjitha</SelectItem>
                  {uniqueConditions.map(condition => (
                    <SelectItem key={condition} value={condition}>{condition}</SelectItem>
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

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Duke shfaqur {filteredCars.length} nga {cars.length} makina
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFilterMake('all');
                setFilterYear('all');
                setFilterFuel('all');
                setFilterColor('all');
                setFilterTransmission('all');
                setFilterBodyType('all');
                setFilterCondition('all');
                setPriceRange([0, 200000]);
                setMileageRange([0, 300000]);
                setSortBy('price');
              }}
            >
              Pastro Filtrat
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
                <div className="h-48 bg-muted"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <CarCard key={car.id} {...car} />
            ))}
          </div>
        )}

        {filteredCars.length === 0 && !loading && cars.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Asnjë makinë nuk përputhet me filtrat tuaj.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterMake('all');
                setFilterYear('all');
                setFilterFuel('all');
                setFilterColor('all');
                setPriceRange([0, 200000]);
              }}
              className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Pastro Filtrat
            </Button>
          </div>
        )}

        {cars.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Asnjë makinë nuk është e disponueshme në këtë moment.</p>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Provo Përsëri
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CarsSection;