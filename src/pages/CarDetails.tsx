import { lazy, Suspense, memo, useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { useImageSwipe } from "@/hooks/useImageSwipe";
import { useCarDetailsData } from "@/hooks/useCarDetailsData";
import { convertOptionsToNames } from "@/components/car-details/FeatureMapping";
import { 
  ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, 
  Palette, Hash, Calendar, FileText, Info, Heart, 
  ChevronLeft, ChevronRight, Expand, Share2, Instagram, Facebook,
  Shield, AlertTriangle, DollarSign
} from "lucide-react";
import { formatMileage } from "@/utils/mileageFormatter";

// Lazy load heavy components
const CarInspectionDiagram = lazy(() => import("@/components/CarInspectionDiagram"));
const InspectionRequestForm = lazy(() => import("@/components/InspectionRequestForm"));
const EquipmentSection = lazy(() => import("@/components/car-details/EquipmentSection").then(m => ({ default: m.EquipmentSection })));

// Optimized image component with lazy loading
const CarImage = memo(({ src, alt, onClick }: { src: string; alt: string; onClick?: (e: React.MouseEvent) => void }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative w-full h-full">
      {!loaded && <Skeleton className="absolute inset-0 rounded-xl" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onClick={onClick}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 cursor-pointer ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
});

CarImage.displayName = 'CarImage';

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container-responsive py-8">
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const translateTransmission = (transmission: string): string => {
  const map: Record<string, string> = {
    'automatic': 'automatik', 'manual': 'manual', 'cvt': 'CVT',
    'semiautomatic': 'gjysëm automatik', 'automated manual': 'manual i automatizuar'
  };
  return map[transmission?.toLowerCase()] || transmission;
};

const translateColor = (color: string): string => {
  const map: Record<string, string> = {
    'black': 'zi', 'white': 'bardhë', 'grey': 'gri', 'gray': 'gri',
    'red': 'kuq', 'blue': 'blu', 'silver': 'argjend', 'green': 'jeshil',
    'yellow': 'verdh', 'brown': 'kafe', 'orange': 'portokalli',
    'purple': 'vjollcë', 'pink': 'rozë', 'gold': 'ar', 'beige': 'bezhë'
  };
  return map[color?.toLowerCase()] || color;
};

const translateFuel = (fuel: string): string => {
  const map: Record<string, string> = {
    'gasoline': 'Benzin', 'petrol': 'Benzin', 'diesel': 'Diesel',
    'hybrid': 'Hibrid', 'electric': 'Elektrik', 'lpg': 'LPG', 'gas': 'Gaz'
  };
  return map[fuel?.toLowerCase()] || fuel;
};

const CarDetailsOptimized = memo(() => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { impact } = useHaptics();
  const { goBack } = useNavigation();
  const { car, loading, error, lot } = useCarDetailsData();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

  // Memoize images array
  const images = useMemo(() => {
    if (car?.images?.length) return car.images.slice(0, 20);
    if (car?.image) return [car.image];
    return [];
  }, [car?.images, car?.image]);

  // Image swipe functionality
  const {
    containerRef: imageContainerRef,
    goToNext,
    goToPrevious,
    isClickAllowed
  } = useImageSwipe({
    images,
    onImageChange: index => setSelectedImageIndex(index)
  });

  // Memoize equipment options
  const equipmentOptions = useMemo(() => {
    if (!car?.details?.options) return { standard: [], choice: [], tuning: [] };
    return convertOptionsToNames(car.details.options);
  }, [car?.details?.options]);

  const handleContactWhatsApp = useCallback(() => {
    impact('light');
    const message = `Përshëndetje! Jam i interesuar për ${car?.year} ${car?.make} ${car?.model} (€${car?.price.toLocaleString()}) - Kodi #${car?.lot || lot}. ${window.location.href}`;
    window.open(`https://wa.me/38348181116?text=${encodeURIComponent(message)}`, "_blank");
  }, [car, lot, impact]);

  const handleShare = useCallback(() => {
    impact('light');
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link-u u kopjua", description: "Link-u i makinës u kopjua në clipboard", duration: 3000 });
  }, [toast, impact]);

  const handleGalleryClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isClickAllowed()) return;
    navigate(`/car/${lot}/gallery`, {
      state: {
        images,
        carMake: car?.make,
        carModel: car?.model,
        carYear: car?.year,
        carLot: car?.lot || lot
      }
    });
  }, [images, navigate, lot, car, isClickAllowed]);

  const handleLike = useCallback(() => {
    impact(isLiked ? 'light' : 'medium');
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "U hoq nga të preferuarat" : "U shtua në të preferuarat",
      description: isLiked ? "Makina u hoq nga lista juaj e të preferuarave" : "Makina u shtua në listën tuaj të të preferuarave",
      duration: 3000
    });
  }, [isLiked, toast, impact]);

  // Auto-expand detailed info if rich data exists
  useEffect(() => {
    if (car && !showDetailedInfo) {
      const hasRichData = car.details?.options || car.insurance_v2 || car.details?.inspect_outer;
      if (hasRichData) setShowDetailedInfo(true);
    }
  }, [car, showDetailedInfo]);

  if (loading) return <LoadingSkeleton />;

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        <div className="container-responsive py-8">
          <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kryefaqja
          </Button>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Makina Nuk u Gjet</h1>
            <p className="text-muted-foreground">Makina që po kërkoni nuk mund të gjindet në bazën tonë të të dhënave.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container-responsive py-6 max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Button variant="outline" onClick={goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Prapa
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            variant={isLiked ? "default" : "outline"} 
            size="icon" 
            onClick={handleLike}
            className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden border-0 shadow-2xl">
              <CardContent className="p-0">
                <div ref={imageContainerRef} className="relative h-[400px] sm:h-[500px] group">
                  <CarImage 
                    src={images[selectedImageIndex] || "/placeholder.svg"} 
                    alt={`${car.make} ${car.model}`}
                    onClick={handleGalleryClick}
                  />
                  
                  {/* Navigation Buttons */}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={goToPrevious}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={goToNext}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleGalleryClick}
                      >
                        <Expand className="h-6 w-6" />
                      </Button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Car Info */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {car.year} {car.make} {car.model}
                    </h1>
                    {car.source_label && (
                      <Badge variant="secondary" className="mb-2">
                        {car.source_label}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">€{car.price?.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Përfshirë Taksat</div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Key Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {car.mileage && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Kilometrazha</div>
                        <div className="font-semibold">{formatMileage(car.mileage)}</div>
                      </div>
                    </div>
                  )}
                  {car.transmission && (
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Transmisioni</div>
                        <div className="font-semibold">{translateTransmission(car.transmission)}</div>
                      </div>
                    </div>
                  )}
                  {car.fuel && (
                    <div className="flex items-center gap-2">
                      <Fuel className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Karburanti</div>
                        <div className="font-semibold">{translateFuel(car.fuel)}</div>
                      </div>
                    </div>
                  )}
                  {car.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Ngjyra</div>
                        <div className="font-semibold">{translateColor(car.color)}</div>
                      </div>
                    </div>
                  )}
                  {car.lot && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Kodi</div>
                        <div className="font-semibold">{car.lot}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Viti</div>
                      <div className="font-semibold">{car.year}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Section - Lazy Loaded */}
            {(equipmentOptions.standard?.length > 0 || equipmentOptions.choice?.length > 0) && (
              <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
                <EquipmentSection
                  options={equipmentOptions}
                  features={car.features}
                  safetyFeatures={car.safety_features}
                  comfortFeatures={car.comfort_features}
                />
              </Suspense>
            )}

            {/* Inspection Diagram - Lazy Loaded */}
            {car.details?.inspect_outer && (
              <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                <CarInspectionDiagram inspectionData={car.details.inspect_outer} />
              </Suspense>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl sticky top-6">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-bold mb-4">Kontakt & Inspektim</h3>
                
                <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                  <InspectionRequestForm
                    trigger={
                      <Button className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Kërko Inspektim
                      </Button>
                    }
                    carId={car.id}
                    carMake={car.make}
                    carModel={car.model}
                    carYear={car.year}
                  />
                </Suspense>

                <Button variant="outline" className="w-full" onClick={handleContactWhatsApp}>
                  <Phone className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>

                <Button variant="outline" className="w-full" onClick={() => window.open("tel:+38348181116")}>
                  <Phone className="h-4 w-4 mr-2" />
                  +383 48 181 116
                </Button>

                <Button variant="outline" className="w-full" onClick={() => window.open("https://www.instagram.com/korauto.ks/", "_blank")}>
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </Button>

                <Button variant="outline" className="w-full" onClick={() => window.open("https://www.facebook.com/share/19tUXpz5dG/", "_blank")}>
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>

                <Button variant="outline" className="w-full" onClick={() => window.open("mailto:info@korauto.com")}>
                  <Mail className="h-4 w-4 mr-2" />
                  info@korauto.com
                </Button>

                <Separator />

                <Button variant="outline" className="w-full" onClick={() => navigate("/garancioni")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Garancioni
                </Button>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <a 
                      href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      Rr. Ilaz Kodra 70, Prishtinë, Kosovo
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

CarDetailsOptimized.displayName = 'CarDetailsOptimized';

export default CarDetailsOptimized;
