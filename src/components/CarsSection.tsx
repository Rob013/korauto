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
        const price = lot?.buy_now || lot?.final_bid || 25000 + (index * 1000);
        
        // Extract image from lots[0].images.normal[0]
        const images = lot?.images?.normal;
        const image = Array.isArray(images) && images.length > 0 ? images[0] : undefined;
        
        return {
          id: car.id?.toString() || `car-${index}`,
          make: car.manufacturer?.name || 'Unknown',
          model: car.model?.name || 'Unknown',
          year: car.year || 2020,
          price: Math.round(price),
          image: image
        };
      });

      console.log(`Transformed cars:`, transformedCars);

      // If no cars from API, use fallback data
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