import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Gauge, Fuel, Settings2, ExternalLink, Download, Clock } from 'lucide-react';
import auctionData from '@/data/auctions.json';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuctionCar {
  id: string;
  stock_no: string;
  name: string;
  price: number;
  detail_url: string;
  make: string;
  model: string;
  images: string[];
  specs: Record<string, string>;
  options: string[];
  auction_date: string;
}

interface AuctionSchedule {
  weekNo: string;
  uploadTime: string | null;
  bidStartTime: string | null;
  bidEndTime: string | null;
  lastUpdated: string;
}

interface AuctionData {
  auctionSchedule: AuctionSchedule;
  cars: AuctionCar[];
  totalCars: number;
  lastUpdated: string;
}

const Auctions = () => {
  const [cars, setCars] = useState<AuctionCar[]>([]);
  const [schedule, setSchedule] = useState<AuctionSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    // Load data
    const timer = setTimeout(() => {
      // @ts-ignore - JSON import type mismatch is expected
      const data = auctionData as AuctionData;

      if (data.cars && Array.isArray(data.cars)) {
        setCars(data.cars);
      }

      if (data.auctionSchedule) {
        setSchedule(data.auctionSchedule);
      }

      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!schedule?.bidEndTime) return;

    const updateCountdown = () => {
      const endDate = new Date(schedule.bidEndTime!);
      const now = new Date();
      const timeDifference = endDate.getTime() - now.getTime();

      if (timeDifference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [schedule]);

  // Auto-refresh: Check for updates 3-4 minutes after upload time
  useEffect(() => {
    if (!schedule?.uploadTime) return;

    const checkForUpdates = () => {
      // Parse upload time and add 4 minutes
      const uploadDate = new Date(schedule.uploadTime!);
      const checkTime = new Date(uploadDate.getTime() + 4 * 60 * 1000);
      const now = new Date();

      if (now >= checkTime) {
        // Reload the page to get fresh data
        console.log('🔄 Auto-refreshing auction data...');
        window.location.reload();
      }
    };

    // Check every minute
    const intervalId = setInterval(checkForUpdates, 60 * 1000);
    // Also check immediately
    checkForUpdates();

    return () => clearInterval(intervalId);
  }, [schedule]);

  const handleDownloadExcel = async () => {
    try {
      const weekNo = schedule?.weekNo || '1';
      const excelUrl = `https://www.ssancar.com/ajax/excel_car_list.php?week=${weekNo}`;

      // Fetch the file
      const response = await fetch(excelUrl);
      const blob = await response.blob();

      // Create a download link with custom filename
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auction_cars_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download Excel file:', error);
      // Fallback to direct link
      const weekNo = schedule?.weekNo || '1';
      window.location.href = `https://www.ssancar.com/ajax/excel_car_list.php?week=${weekNo}`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Ankandet e Drejtpërdrejta</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  const isAuctionEnded = timeLeft && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Auction Schedule Banner */}
      {schedule && (
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Clock className="h-5 w-5" />
          <AlertDescription className="ml-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                {isAuctionEnded ? (
                  <p className="font-semibold text-lg">Ankandi ka përfunduar sot</p>
                ) : (
                  <p className="font-semibold text-lg">Ankandi në vazhdim</p>
                )}
                {schedule.uploadTime && (
                  <p className="text-sm text-muted-foreground">
                    Ngarkuar: {new Date(schedule.uploadTime).toLocaleString('sq-AL')}
                  </p>
                )}
                {schedule.bidStartTime && (
                  <p className="text-sm text-muted-foreground">
                    Fillimi i Ofertave: {new Date(schedule.bidStartTime).toLocaleString('sq-AL')}
                  </p>
                )}
              </div>
              {timeLeft && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Koha e mbetur:</span>
                  <span className="font-mono font-bold text-lg">
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                  </span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ankandet e Drejtpërdrejta</h1>
          <p className="text-muted-foreground">
            Vetura nga ankandet e Koresë së Jugut - të përditësuara automatikisht
          </p>
          <Badge variant="outline" className="mt-2">
            {cars.length} vetura disponueshme
          </Badge>
        </div>
        <Button onClick={handleDownloadExcel} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Shkarko Listën (Excel)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cars.map((car) => (
          <Card key={car.stock_no} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 bg-muted">
              {car.images && car.images.length > 0 && !car.images[0].includes('no_image') ? (
                <img
                  src={car.images[0]}
                  alt={car.model}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">Nuk ka imazh</span>
                </div>
              )}
              <Badge className="absolute top-2 right-2 bg-background/90">
                #{car.stock_no}
              </Badge>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {car.name}
              </h3>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{car.specs['Year'] || car.specs['Model Year'] || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  <span>{car.specs['Mileage'] || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span>{car.specs['Transmission'] || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  <span>{car.specs['Fuel'] || '-'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Oferta fillestare</div>
                  <div className="text-xl font-bold text-primary">
                    ${car.price.toLocaleString()}
                  </div>
                </div>
                <a
                  href={`/auction/${car.id}`}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Shiko
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cars.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nuk ka vetura të disponueshme në ankandin e tanishëm
        </div>
      )}
    </div>
  );
};

export default Auctions;
