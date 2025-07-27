import CarCard from "./CarCard";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
}

const CarsSection = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Try multiple possible API base URLs
  const POSSIBLE_API_URLS = [
    'https://api.auctionsapi.com',
    'https://auctionsapi.com',
    'https://auctionsapi.com/api',
    'https://carapis.com/api/encar'
  ];
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

  const tryApiEndpoint = async (baseUrl: string, endpoint: string, params: URLSearchParams): Promise<any> => {
    console.log(`Trying API endpoint: ${baseUrl}${endpoint}?${params}`);
    const response = await fetch(`${baseUrl}${endpoint}?${params}`);
    if (!response.ok) {
      throw new Error(`${baseUrl} returned ${response.status}`);
    }
    return response.json();
  };

  const fetchCars = async (minutes?: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        limit: '50' // Demo mode limit
      });

      if (minutes) {
        params.append('minutes', minutes.toString());
      }

      let data = null;
      let successfulUrl = '';

      // Try each possible API URL
      for (const baseUrl of POSSIBLE_API_URLS) {
        try {
          console.log(`Attempting to fetch from: ${baseUrl}`);
          data = await tryApiEndpoint(baseUrl, '/api/cars', params);
          successfulUrl = baseUrl;
          console.log(`Success with URL: ${baseUrl}`);
          break;
        } catch (err) {
          console.log(`Failed with ${baseUrl}:`, err);
          continue;
        }
      }

      if (!data) {
        throw new Error('All API endpoints failed. Using fallback data.');
      }
      
      // Transform API data to our Car interface
      const transformedCars: Car[] = data.cars?.map((car: any, index: number) => ({
        id: car.id || `car-${index}`,
        make: car.make || 'BMW',
        model: car.model || 'Series 3',
        year: car.year || 2020 + (index % 4),
        price: car.price || 25000 + (index * 1000),
        image: car.image || undefined
      })) || [];

      // If no cars from API, use fallback data
      if (transformedCars.length === 0) {
        throw new Error('No cars returned from API');
      }

      setCars(transformedCars);
      setLastUpdate(new Date());
      console.log(`Successfully loaded ${transformedCars.length} cars from ${successfulUrl}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      console.error('API Error:', err);
      
      // Use fallback data on error
      const fallbackCars: Car[] = [
        { id: '1', make: 'BMW', model: 'M3', year: 2022, price: 65000 },
        { id: '2', make: 'Mercedes-Benz', model: 'C-Class', year: 2021, price: 45000 },
        { id: '3', make: 'Audi', model: 'A4', year: 2023, price: 42000 },
        { id: '4', make: 'Volkswagen', model: 'Golf', year: 2022, price: 28000 },
        { id: '5', make: 'Porsche', model: 'Cayenne', year: 2021, price: 85000 },
        { id: '6', make: 'Tesla', model: 'Model S', year: 2023, price: 95000 },
        { id: '7', make: 'Ford', model: 'Mustang', year: 2022, price: 55000 },
        { id: '8', make: 'Chevrolet', model: 'Camaro', year: 2021, price: 48000 },
        { id: '9', make: 'Jaguar', model: 'F-Type', year: 2022, price: 78000 }
      ];
      setCars(fallbackCars);
      setLastUpdate(new Date());
      console.log('Using fallback car data');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedLots = async () => {
    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        minutes: '60'
      });

      // Try each possible API URL for archived lots
      for (const baseUrl of POSSIBLE_API_URLS) {
        try {
          const data = await tryApiEndpoint(baseUrl, '/api/archived-lots', params);
          const archivedIds = data.archivedLots?.map((lot: any) => lot.id) || [];
          
          // Remove archived cars from current list
          setCars(prevCars => prevCars.filter(car => !archivedIds.includes(car.id)));
          console.log(`Successfully fetched archived lots from ${baseUrl}`);
          break;
        } catch (err) {
          console.log(`Failed to fetch archived lots from ${baseUrl}:`, err);
          continue;
        }
      }
    } catch (err) {
      console.error('Failed to fetch archived lots from all endpoints:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCars();
  }, []);

  // Set up hourly updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCars(60); // Fetch updates from last 60 minutes
      fetchArchivedLots(); // Remove sold cars
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchCars();
  };

  return (
    <section id="cars" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Available Cars</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse our selection of premium vehicles. Each car can be professionally inspected for only €50.
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
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            {lastUpdate && (
              <span className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              API Connection Issue: {error}. Displaying demo cars with full inspection service available.
            </span>
          </div>
        )}

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
            {cars.map((car) => (
              <CarCard key={car.id} {...car} />
            ))}
          </div>
        )}

        {cars.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No cars available at the moment.</p>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CarsSection;