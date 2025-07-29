import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { ArrowLeft, Phone, Mail, Car, Fuel, Palette, Hash, Calendar, Shield, Info, Eye, Heart, Share2, Copy, MessageCircle, Gauge, Settings } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import { useFavorites } from "@/hooks/useFavorites";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  images?: string[];
  vin?: string;
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  engine?: { name: string };
  cylinders?: number;
  drive_wheel?: { name: string };
  body_type?: { name: string };
  odometer?: { km: number; mi: number; status: { name: string } };
  damage?: { main: string | null; second: string | null };
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  seller?: string;
  seller_type?: string;
  sale_date?: string;
  bid?: number;
  buy_now?: number;
  final_bid?: number;
  insurance?: any;
  insurance_v2?: any;
  location?: any;
  inspect?: any;
  details?: any;
}

const CarDetailsOptimized = () => {
  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const { user, toggleFavorite, isFavorited } = useFavorites();
  
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  
  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!lot) return;

      try {
        setLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
          headers: {
            accept: '*/*',
            'x-api-key': API_KEY,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Makina nuk u gjet në sistemin e ankandeve");
          }
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const carData = data.data;
        const lotData = carData.lots?.[0];

        if (!lotData) throw new Error("Të dhënat e lotit nuk u gjetën");

        const basePrice = lotData.buy_now ?? lotData.final_bid ?? lotData.price ?? 25000;
        const price = convertUSDtoEUR(Math.round(basePrice + 2200));

        const transformedCar: CarDetails = {
          id: carData.id?.toString() || lotData.lot,
          make: carData.manufacturer?.name || 'E panjohur',
          model: carData.model?.name || 'E panjohur',
          year: carData.year || 2020,
          price,
          image: lotData.images?.normal?.[0] || lotData.images?.big?.[0],
          images: lotData.images?.normal || lotData.images?.big || [],
          vin: carData.vin,
          mileage: lotData.odometer?.km ? `${lotData.odometer.km.toLocaleString()} km` : undefined,
          transmission: carData.transmission?.name,
          fuel: carData.fuel?.name,
          color: carData.color?.name,
          condition: lotData.condition?.name?.replace('run_and_drives', 'Gjendje e Mirë'),
          lot: lotData.lot,
          title: lotData.title || carData.title,
          engine: carData.engine,
          cylinders: carData.cylinders,
          drive_wheel: carData.drive_wheel,
          body_type: carData.body_type,
          odometer: lotData.odometer,
          damage: lotData.damage,
          keys_available: lotData.keys_available,
          airbags: lotData.airbags,
          grade_iaai: lotData.grade_iaai,
          seller: lotData.seller,
          seller_type: lotData.seller_type,
          sale_date: lotData.sale_date,
          bid: lotData.bid,
          buy_now: lotData.buy_now,
          final_bid: lotData.final_bid,
          insurance: lotData.insurance,
          insurance_v2: lotData.insurance_v2,
          location: lotData.location,
          inspect: lotData.inspect,
          details: lotData.details,
        };

        setCar(transformedCar);
      } catch (error: any) {
        console.error('Error fetching car details:', error);
        setError(error.message || 'Nuk mundëm të ngarkojmë të dhënat e makinës');
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [lot, convertUSDtoEUR]);

  const handleContactWhatsApp = () => {
    if (!car) return;
    const message = `Përshëndetje! Jam i interesuar për ${car.year} ${car.make} ${car.model} (€${car.price.toLocaleString()}). A mund të më jepni më shumë informacion?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Linku u kopjua",
      description: "Linku i makinës u kopjua në clipboard",
      duration: 3000
    });
  };

  const handleFavoriteToggle = async () => {
    if (!car) return;
    await toggleFavorite(car.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Duke ngarkuar detajet...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Gabim në ngarkim</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu Mbrapa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu Mbrapa
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex-1 sm:flex-initial"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Shpërndaj
            </Button>
            
            <Button
              variant={isFavorited(car.id) ? "default" : "outline"}
              size="sm"
              onClick={handleFavoriteToggle}
              className="flex-1 sm:flex-initial"
            >
              <Heart className={`h-4 w-4 mr-2 ${isFavorited(car.id) ? 'fill-current' : ''}`} />
              {isFavorited(car.id) ? 'E Ruajtur' : 'Ruaj'}
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video">
                {car.images && car.images.length > 0 ? (
                  <img
                    src={car.images[selectedImageIndex]}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => setIsImageZoomOpen(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Car className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                {/* Image Counter */}
                {car.images && car.images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {car.images.length}
                  </div>
                )}
              </div>
            </Card>

            {/* Image Thumbnails */}
            {car.images && car.images.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {car.images.slice(0, 6).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Car Info & Actions */}
          <div className="space-y-6">
            {/* Car Header */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {car.year} {car.make} {car.model}
                    </h1>
                    <p className="text-lg text-muted-foreground">{car.title}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-primary">
                      €{car.price.toLocaleString()}
                    </div>
                    {car.lot && (
                      <Badge variant="outline" className="text-sm">
                        Lot #{car.lot}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Specs */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {car.mileage && (
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span>{car.mileage}</span>
                      </div>
                    )}
                    {car.transmission && (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>{car.transmission}</span>
                      </div>
                    )}
                    {car.fuel && (
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-muted-foreground" />
                        <span>{car.fuel}</span>
                      </div>
                    )}
                    {car.color && (
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <span>{car.color}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleContactWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Kontakto në WhatsApp
              </Button>

              <InspectionRequestForm
                trigger={
                  <Button variant="outline" className="w-full" size="lg">
                    <Shield className="h-5 w-5 mr-2" />
                    Kërko Inspektim
                  </Button>
                }
                carId={car.id}
                carMake={car.make}
                carModel={car.model}
                carYear={car.year}
              />
            </div>

            {/* Additional Info Cards */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Informacion Shtesë</h3>
                <div className="space-y-3 text-sm">
                  {car.vin && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VIN:</span>
                      <span className="font-mono">{car.vin}</span>
                    </div>
                  )}
                  {car.condition && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gjendja:</span>
                      <Badge variant="secondary">{car.condition}</Badge>
                    </div>
                  )}
                  {car.engine?.name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Motori:</span>
                      <span>{car.engine.name}</span>
                    </div>
                  )}
                  {car.cylinders && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cilindra:</span>
                      <span>{car.cylinders}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="specs">Specifikimet</TabsTrigger>
              <TabsTrigger value="inspection">Inspektimi</TabsTrigger>
              <TabsTrigger value="contact">Kontakti</TabsTrigger>
            </TabsList>

            <TabsContent value="specs" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Specifikimet Teknike</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Technical specifications grid */}
                    {car.body_type?.name && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Lloji i Trupit</span>
                        <p className="font-medium">{car.body_type.name}</p>
                      </div>
                    )}
                    {car.drive_wheel?.name && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Tërheqja</span>
                        <p className="font-medium">{car.drive_wheel.name}</p>
                      </div>
                    )}
                    {car.keys_available !== undefined && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Çelësat</span>
                        <p className="font-medium">{car.keys_available ? 'Të Disponueshëm' : 'Jo të Disponueshëm'}</p>
                      </div>
                    )}
                    {car.airbags && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Airbags</span>
                        <p className="font-medium">{car.airbags}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inspection" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Diagrami i Inspektimit</h3>
                  {car.inspect && (
                    <CarInspectionDiagram 
                      inspectionData={car.inspect}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Informacion Kontakti</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">WhatsApp</p>
                        <p className="text-sm text-muted-foreground">+383 48 181 116</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">info@korauto.com</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {car.images && car.images.length > 0 && (
        <ImageZoom
          src={car.images[selectedImageIndex]}
          alt={`${car.make} ${car.model}`}
          isOpen={isImageZoomOpen}
          onClose={() => setIsImageZoomOpen(false)}
        />
      )}
    </div>
  );
};

export default CarDetailsOptimized;