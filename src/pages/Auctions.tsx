import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Gauge, Fuel, Settings2, ExternalLink, Download, Clock, MessageCircle, Info } from 'lucide-react';
import auctionData from '@/data/auctions.json';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useAdminCheck } from '@/hooks/useAdminCheck';
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
  const [showBlockingModal, setShowBlockingModal] = useState(false);
  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    // Show blocking modal on first load
    setShowBlockingModal(true);

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
      // Close blocking modal after data loads
      setShowBlockingModal(false);
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
      a.download = `korauto_lista_${new Date().toISOString().split('T')[0]}.xls`;
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

  const handleWhatsAppContact = (car: AuctionCar) => {
    const message = `Përshëndetje! Jam i interesuar për ${car.name} (Çmimi fillestare: $${car.price.toLocaleString()}) - Stock #${car.stock_no}. A mund të më jepni më shumë informacion?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRequestFullList = () => {
    const message = `Përshëndetje! Dëshiroj të marr listën e plotë të veturave në ankand. Faleminderit!`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
      {/* Blocking Auction Schedule Modal */}
      <Dialog open={showBlockingModal} onOpenChange={setShowBlockingModal}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Orari i Ankandit të Drejtpërdrejtë</DialogTitle>
            <DialogDescription className="text-center">
              {isAuctionEnded ? 'Ankandi ka përfunduar sot' : 'Ankandi aktual'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            {schedule && (
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Orari</h3>
                  {schedule.uploadTime && (
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Ngarkuar:</span>
                      <span className="text-sm font-medium">{schedule.uploadTime}</span>
                    </div>
                  )}
                  {schedule.bidStartTime && (
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg mt-2">
                      <span className="text-sm">Fillimi i Ofertave:</span>
                      <span className="text-sm font-medium">{schedule.bidStartTime}</span>
                    </div>
                  )}
                </div>

                {timeLeft && !isAuctionEnded && (
                  <div className="text-center p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Koha e mbetur</p>
                    <div className="text-4xl font-bold text-primary font-mono">
                      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                    </div>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground mt-4">
                  {cars.length} vetura disponueshme
                </div>
              </div>
            )}

            <Button
              onClick={() => setShowBlockingModal(false)}
              className="w-full"
              size="lg"
            >
              Shiko Vetura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Small Schedule Info Button */}
      {schedule && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mb-4 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Orari i Ankandit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Orari i Ankandit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {schedule.uploadTime && (
                <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Ngarkuar</span>
                  <span className="text-sm font-medium">{schedule.uploadTime}</span>
                </div>
              )}
              {schedule.bidStartTime && (
                <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Fillimi i Ofertave</span>
                  <span className="text-sm font-medium">{schedule.bidStartTime}</span>
                </div>
              )}
              {timeLeft && (
                <div className="flex justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm font-semibold">Koha e mbetur</span>
                  <span className="font-mono font-bold text-lg text-primary">
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ankandet e Drejtpërdrejta</h1>
          <p className="text-muted-foreground">
            Vetura nga ankandet e Koresë së Jugut - të përditësuara automatikisht
          </p>
          {timeLeft && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Koha e mbetur:</span>
              <span className="font-mono font-semibold text-primary">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </span>
            </div>
          )}
          <Badge variant="outline" className="mt-2">
            {cars.length} vetura disponueshme
          </Badge>
        </div>
        {isAdmin ? (
          <Button onClick={handleDownloadExcel} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Shkarko Listën (Excel)
          </Button>
        ) : (
          <Button onClick={handleRequestFullList} variant="outline" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="h-4 w-4" />
            Kërko listën e plotë
          </Button>
        )}
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

              <div className="flex flex-col gap-3 pt-4 border-t">
                <div className="flex items-center justify-between">
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
                <Button
                  onClick={() => handleWhatsAppContact(car)}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Kontakto në WhatsApp
                </Button>
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
