import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { trackPageView, trackCarView } from "@/utils/analytics";
import { calculateFinalPriceEUR } from "@/utils/carPricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { ArrowLeft, Car, Gauge, Fuel, Palette, Calendar, FileText, MessageCircle, Heart, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";
import { fallbackCars } from "@/data/fallbackData";
import { formatMileage } from "@/utils/mileageFormatter";

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  vin?: string;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  images?: string[];
  odometer?: {
    km: number;
    mi: number;
  };
  engine?: {
    name: string;
  };
  cylinders?: number;
  drive_wheel?: {
    name: string;
  };
  body_type?: {
    name: string;
  };
  damage?: {
    main: string | null;
    second: string | null;
  };
  keys_available?: boolean;
  features?: string[];
}

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setPreviousPage } = useNavigation();
  const { toast } = useToast();
  const { convertUSDtoEUR } = useCurrencyAPI();

  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch car details
  const fetchCarDetails = useCallback(async (carId: string) => {
    try {
      console.log('🔍 Fetching car details for ID:', carId);
      setLoading(true);
      setError(null);

      // Try secure API first with correct format
      const { data, error } = await supabase.functions.invoke('secure-cars-api', {
        body: { 
          endpoint: 'cars', 
          carId: carId,
          filters: {}
        }
      });

      console.log('🔍 API Response:', { data, error });

      if (error) {
        console.error('❌ API Error:', error);
        throw error;
      }

      if (data && (data.data || data.car)) {
        const carData = data.data || data.car || data;
        console.log('✅ Car data received:', carData);
        setCar(carData);
        trackCarView(carData.id, carData);
        return;
      }

      console.log('⚠️ No car data in response, trying fallback...');
      
      // Fallback to local data
      const fallbackCar = fallbackCars.find(c => c.id === carId);
      if (fallbackCar) {
        console.log('✅ Using fallback car:', fallbackCar);
        // Transform fallback car to match our interface
        const transformedCar: CarDetails = {
          ...fallbackCar,
          make: fallbackCar.manufacturer?.name || '',
          model: fallbackCar.model?.name || '',
          mileage: fallbackCar.odometer,
          fuel: fallbackCar.fuel?.name,
          transmission: fallbackCar.transmission?.name,
          color: fallbackCar.color?.name,
          lot: fallbackCar.lot_number,
          features: fallbackCar.features || fallbackCar.equipment_options?.standard || [],
          odometer: fallbackCar.odometer ? {
            km: fallbackCar.odometer,
            mi: Math.round(fallbackCar.odometer * 0.621371)
          } : undefined
        };
        setCar(transformedCar);
        trackCarView(carId, transformedCar);
        return;
      }

      console.error('❌ Car not found in API or fallback data');
      setError("Makina nuk u gjet");
    } catch (err) {
      console.error('❌ Error fetching car details:', err);
      setError("Gabim në ngarkimin e detajeve");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchCarDetails(id);
      trackPageView(`/car/${id}`);
    }
  }, [id, fetchCarDetails]);

  useEffect(() => {
    setPreviousPage('Catalog');
  }, [setPreviousPage]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleImageNavigation = useCallback((direction: 'prev' | 'next') => {
    if (!car?.images) return;
    
    if (direction === 'prev') {
      setSelectedImageIndex(prev => prev > 0 ? prev - 1 : car.images!.length - 1);
    } else {
      setSelectedImageIndex(prev => prev < car.images!.length - 1 ? prev + 1 : 0);
    }
  }, [car?.images]);

  const handleToggleFavorite = useCallback(() => {
    setIsFavorited(prev => !prev);
    toast({
      title: isFavorited ? "Hequr nga të preferuarat" : "Shtuar në të preferuarat",
      description: isFavorited ? "Makina u hoq nga lista juaj" : "Makina u shtua në listën tuaj"
    });
  }, [isFavorited, toast]);

  const handleCopyLot = useCallback(() => {
    if (car?.lot) {
      navigator.clipboard.writeText(car.lot);
      toast({
        title: "Kopjuar!",
        description: `Lot #${car.lot} u kopjua në clipboard`
      });
    }
  }, [car?.lot, toast]);

  const handleContactWhatsApp = useCallback(() => {
    if (car) {
      const message = `Përshëndetje! Jam i interesuar për makinën ${car.make} ${car.model} ${car.year}, Lot #${car.lot}. A mund të më jepni më shumë informacion?`;
      const whatsappUrl = `https://wa.me/38344123456?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  }, [car]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Duke ngarkuar detajet e makinës...</p>
            <p className="text-sm text-muted-foreground">ID: {id}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Problem me ngarkimin</h2>
            <p className="text-muted-foreground">{error || "Makina nuk u gjet"}</p>
            <p className="text-sm text-muted-foreground">Car ID: {id}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleBack} variant="outline">
              Kthehu mbrapa
            </Button>
            <Button onClick={() => window.location.reload()} variant="default">
              Provo përsëri
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const images = car.images || [car.image].filter(Boolean) as string[];
  const finalPrice = convertUSDtoEUR(car.price);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button onClick={handleBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Mbrapa
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">{car.year} {car.make} {car.model}</h1>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={images[selectedImageIndex]}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    className="w-full h-96 object-cover rounded-t-lg cursor-pointer"
                    onClick={() => setIsImageZoomOpen(true)}
                  />
                  
                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <Button
                        onClick={() => handleImageNavigation('prev')}
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleImageNavigation('next')}
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </div>

                {/* Thumbnail Navigation */}
                {images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                          selectedImageIndex === index 
                            ? 'border-primary' 
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informacione Bazike</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Viti:</span> {car.year}
                    </span>
                  </div>
                  
                  {car.odometer && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Kilometrazha:</span> {formatMileage(car.odometer.km || car.mileage || 0)}
                      </span>
                    </div>
                  )}

                  {car.fuel && (
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Karburanti:</span> {car.fuel}
                      </span>
                    </div>
                  )}

                  {car.transmission && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Transmisioni:</span> {car.transmission}
                      </span>
                    </div>
                  )}

                  {car.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Ngjyra:</span> {car.color}
                      </span>
                    </div>
                  )}

                  {car.lot && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Lot:</span> #{car.lot}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pajisjet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {car.features.slice(0, 12).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  {car.features.length > 12 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      +{car.features.length - 12} më shumë pajisje
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Price and Actions */}
          <div className="space-y-6">
            {/* Price and Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    €{Math.round(finalPrice).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    +350€ deri në Prishtinë
                  </div>
                </div>

                <div className="space-y-3">
                  <InspectionRequestForm 
                    trigger={
                      <Button className="w-full" size="lg">
                        <FileText className="h-4 w-4 mr-2" />
                        Kërko Inspektim
                      </Button>
                    } 
                    carId={car.id} 
                    carMake={car.make} 
                    carModel={car.model} 
                    carYear={car.year} 
                  />
                  
                  <Button 
                    onClick={handleContactWhatsApp} 
                    variant="outline" 
                    className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    size="lg"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Kontakto në WhatsApp
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleToggleFavorite}>
                    <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                    {isFavorited ? 'Ruajtur' : 'Ruaj'}
                  </Button>
                  
                  <Button variant="outline" onClick={handleCopyLot}>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopjo Lot
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Specs */}
            <Card>
              <CardHeader>
                <CardTitle>Specifikime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {car.engine?.name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Motori:</span>
                      <span className="font-medium">{car.engine.name}</span>
                    </div>
                  )}
                  
                  {car.cylinders && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cilindrat:</span>
                      <span className="font-medium">{car.cylinders}</span>
                    </div>
                  )}
                  
                  {car.drive_wheel?.name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tërheqje:</span>
                      <span className="font-medium">{car.drive_wheel.name}</span>
                    </div>
                  )}
                  
                  {car.body_type?.name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Karoceria:</span>
                      <span className="font-medium">{car.body_type.name}</span>
                    </div>
                  )}

                  {car.damage && (car.damage.main || car.damage.second) && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium text-orange-600 mb-2">Dëmtime</p>
                      {car.damage.main && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kryesor:</span>
                          <span className="font-medium text-orange-600">{car.damage.main}</span>
                        </div>
                      )}
                      {car.damage.second && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dytësor:</span>
                          <span className="font-medium text-orange-600">{car.damage.second}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Inspection Diagram */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Diagrami i Inspektimit</CardTitle>
          </CardHeader>
          <CardContent>
            <CarInspectionDiagram />
          </CardContent>
        </Card>
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomOpen && (
        <ImageZoom
          src={images[selectedImageIndex]}
          alt={`${car.year} ${car.make} ${car.model}`}
          isOpen={isImageZoomOpen}
          onClose={() => setIsImageZoomOpen(false)}
          images={images}
          currentIndex={selectedImageIndex}
          onImageChange={setSelectedImageIndex}
        />
      )}
    </div>
  );
};

export default CarDetails;