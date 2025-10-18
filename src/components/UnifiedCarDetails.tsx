import React, { useState, useCallback, memo, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { trackPageView, trackCarView, trackFavorite } from "@/utils/analytics";
import { calculateFinalPriceEUR } from "@/utils/carPricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, Share2, Heart, ChevronLeft, ChevronRight, Expand, Copy, ChevronDown, ChevronUp, DollarSign, Cog, Lightbulb, Camera, Thermometer, Wind, Radar, Tag } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";
import { useImagePreload } from "@/hooks/useImagePreload";
import { useImageSwipe } from "@/hooks/useImageSwipe";
import { formatMileage } from "@/utils/mileageFormatter";
import { useUnifiedCarDetails, UnifiedCarDetails } from "@/hooks/useUnifiedCarDetails";

// Enhanced Feature mapping for equipment/options - supporting both string and numeric formats
const FEATURE_MAPPING: { [key: string]: string } = {
  // String format (with leading zeros)
  "001": "Klimatizimi",
  "002": "Dritaret Elektrike",
  "003": "Mbyllja Qendrore",
  "004": "Frena ABS",
  "005": "Airbag Sistemi",
  "006": "Radio/Sistemi Audio",
  "007": "CD Player",
  "008": "Bluetooth",
  "009": "Navigacioni GPS",
  "010": "Kamera e Prapme",
  "011": "Sensorët e Parkimit",
  "012": "Kontrolli i Kursimit",
  "013": "Sistemi Start/Stop",
  "014": "Dritat LED",
  "015": "Dritat Xenon",
  "016": "Pasqyrat Elektrike",
  "017": "Pasqyrat e Ngrohura",
  "018": "Kontrolli Elektronik i Stabilitetit",
  "019": "Sistemi Kundër Bllokimit",
  "020": "Kontrolli i Traksionit",
  "021": "Distribimi Elektronik i Forcës së Frënimit",
  "022": "Sistemi i Monitorimit të Presionit të Gomas",
  "023": "Sistemi i Paralajmërimit të Largimit nga Korsia",
  "024": "Kontrolli Adaptiv i Kursimit",
  "025": "Sistemi i Paralajmërimit të Kolizionit",
  "026": "Frënimi Emergjent Automatik",
  "027": "Kontrolli i Bordit Elektronik",
  "028": "Sistemi Keyless",
  "029": "Filteri i Grimcave",
  "030": "Sistemi i Kontrollit të Stabilitetit",
  "031": "Rrota e Rezervës",
  "032": "Kompleti i RIPARIM të Gomas",
  "033": "Kapaku i Motorit",
  "034": "Spoiler i Prapëm",
  "035": "Rrota Alumini",
  "036": "Rrota Çeliku",
  "037": "Sistemi i Ngrohjes së Ulëseve",
  "038": "Ulëset e Lëkurës",
  "039": "Ulëset e Tekstilit",
  "040": "Kontrolli Elektrik i Ulëseve",
  "041": "Dritaret me Tinte",
  "042": "Sistemi i Alarmshmërisë",
  "043": "Imobilizuesi",
  "044": "Kopja e Çelësave",
  "045": "Kontrolli i Temperaturës",
  "046": "Ventilimi Automatik",
  "047": "Sistemi i Pastrimit të Dritareve",
  "048": "Sistemi i Ujit të Xhamit",
  "049": "Defogger i Prapëm",
  "050": "Sistemi i Ndriçimit të Brendshëm",
  "051": "Sistemi i Ngrohjes së Dritareve",
  "052": "Kontrolli i Temperaturës së Klimatizimit",
  "053": "Sistemi i Pastrimit të Dritareve të Prapme",
  "054": "Kontrolli i Shpejtësisë",
  "055": "Sistemi i Monitorimit të Presionit të Gomas",
  "056": "Sistemi i Paralajmërimit të Largimit nga Korsia",
  "057": "Kontrolli Adaptiv i Kursimit",
  "058": "Sistemi i Paralajmërimit të Kolizionit",
  "059": "Frënimi Emergjent Automatik",
  "060": "Kontrolli i Bordit Elektronik",
  "061": "Sistemi Keyless Entry",
  "062": "Sistemi i Alarmshmërisë",
  "063": "Imobilizuesi i Motorit",
  "064": "Kopja e Çelësave",
  "065": "Sistemi i Ngrohjes së Ulëseve të Prapme",
  "066": "Ulëset e Lëkurës të Prapme",
  "067": "Ulëset e Tekstilit të Prapme",
  "068": "Kontrolli Elektrik i Ulëseve të Prapme",
  "069": "Dritaret me Tinte të Prapme",
  "070": "Sistemi i Alarmshmërisë të Prapme",
  "071": "Imobilizuesi i Prapme",
  "072": "Kopja e Çelësave të Prapme",
  "073": "Kontrolli i Temperaturës së Prapme",
  "074": "Ventilimi Automatik i Prapme",
  "075": "Sistemi i Pastrimit të Dritareve të Prapme",
  "076": "Sistemi i Ujit të Xhamit të Prapme",
  "077": "Defogger i Prapëm i Prapme",
  "078": "Sistemi i Ndriçimit të Brendshëm të Prapme",
  "079": "Sistemi i Ngrohjes së Dritareve të Prapme",
  "080": "Kontrolli i Temperaturës së Klimatizimit të Prapme"
};

// Equipment Options Section Component with Show More functionality
interface EquipmentOptionsProps {
  options: string[];
  title: string;
  maxInitial?: number;
}

const EquipmentOptionsSection = memo(({ options, title, maxInitial = 6 }: EquipmentOptionsProps) => {
  const [showAll, setShowAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!options || options.length === 0) return null;

  const displayOptions = showAll ? options : options.slice(0, maxInitial);
  const hasMore = options.length > maxInitial;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {showAll ? "Shfaq më pak" : `Shfaq të gjitha (${options.length})`}
          </Button>
        )}
      </div>
      
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${isExpanded ? '' : 'max-h-48 overflow-hidden'}`}>
        {displayOptions.map((option, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
          </div>
        ))}
      </div>
      
      {hasMore && options.length > 12 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Mbyll
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Zgjero
            </>
          )}
        </Button>
      )}
    </div>
  );
});

EquipmentOptionsSection.displayName = "EquipmentOptionsSection";

const UnifiedCarDetails = memo(() => {
  // Translation functions for Albanian
  const translateTransmission = (transmission: string): string => {
    const transmissionMap: Record<string, string> = {
      'automatic': 'automatik',
      'manual': 'manual',
      'cvt': 'CVT',
      'semiautomatic': 'gjysëm automatik',
      'automated manual': 'manual i automatizuar'
    };
    return transmissionMap[transmission?.toLowerCase()] || transmission;
  };

  const translateColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      'black': 'zi',
      'white': 'bardhë',
      'grey': 'gri',
      'gray': 'gri',
      'red': 'kuq',
      'blue': 'blu',
      'silver': 'argjend',
      'green': 'jeshil',
      'yellow': 'verdh',
      'brown': 'kafe',
      'orange': 'portokalli',
      'purple': 'vjollcë',
      'pink': 'rozë',
      'gold': 'ar',
      'beige': 'bezhë',
      'dark blue': 'blu i errët',
      'light blue': 'blu i çelët',
      'dark green': 'jeshil i errët',
      'light green': 'jeshil i çelët'
    };
    return colorMap[color?.toLowerCase()] || color;
  };

  const translateFuel = (fuel: string): string => {
    const fuelMap: Record<string, string> = {
      'gasoline': 'Benzin',
      'petrol': 'Benzin',
      'diesel': 'Diesel',
      'hybrid': 'Hibrid',
      'electric': 'Elektrik',
      'lpg': 'LPG',
      'gas': 'Gaz'
    };
    return fuelMap[fuel?.toLowerCase()] || fuel;
  };

  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { goBack, restorePageState, pageState } = useNavigation();
  const { convertUSDtoEUR, processFloodDamageText, exchangeRate } = useCurrencyAPI();
  
  // Use unified car details hook
  const { car, loading, error, refetch } = useUnifiedCarDetails(lot || '');
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [showInspectionReport, setShowInspectionReport] = useState(false);

  // Track page view
  useEffect(() => {
    trackPageView('car-details', { carId: lot });
  }, [lot]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email === 'admin@korauto.com') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
      }
    };
    checkAdminStatus();
  }, []);

  // Track car view when car data is loaded
  useEffect(() => {
    if (car) {
      trackCarView(car.id, car);
    }
  }, [car]);

  const handleContactWhatsApp = useCallback(() => {
    const currentUrl = window.location.href;
    const message = `Përshëndetje! Jam i interesuar për ${car?.year} ${car?.make} ${car?.model} (€${car?.price.toLocaleString()}) - Kodi #${car?.lot || lot}. A mund të më jepni më shumë informacion? ${currentUrl}`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }, [car, lot]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Linku u kopjua!",
      description: "Linku i makinës u kopjua në clipboard.",
    });
  }, [toast]);

  const handleFavorite = useCallback(async () => {
    if (!car) return;
    
    try {
      await trackFavorite(car.id, car);
      toast({
        title: "U shtua në të preferuarat!",
        description: `${car.year} ${car.make} ${car.model} u shtua në listën tuaj të preferuarave.`,
      });
    } catch (error) {
      console.error("Failed to add to favorites:", error);
      toast({
        title: "Gabim",
        description: "Nuk mund të shtohet në të preferuarat. Ju lutemi provoni përsëri.",
        variant: "destructive",
      });
    }
  }, [car, toast]);

  // Image handling
  const images = car?.images || [];
  const { currentImageIndex, goToNextImage, goToPreviousImage } = useImageSwipe(images, selectedImageIndex, setSelectedImageIndex);
  const { preloadedImages } = useImagePreload(images);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Duke ngarkuar detajet e makinës...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gabim në ngarkim</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Provo përsëri
            </Button>
            <Button onClick={() => navigate('/catalog')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu te katalogu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No car found
  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Makina nuk u gjet</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Makina që kërkoni nuk është e disponueshme.</p>
          <Button onClick={() => navigate('/catalog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu te katalogu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/catalog')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kthehu
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {car.year} {car.make} {car.model}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Ndaj
              </Button>
              <Button variant="ghost" size="sm" onClick={handleFavorite}>
                <Heart className="h-4 w-4 mr-2" />
                Të preferuarat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-w-16 aspect-h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex] || "/placeholder.svg"}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setIsImageZoomOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-w-16 aspect-h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${
                      selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${car.year} ${car.make} ${car.model} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="space-y-6">
            {/* Price */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{car.price.toLocaleString()}
                </h2>
                {car.is_live && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Clock className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Viti:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{car.year}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Kilometrazhi:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {car.mileage ? formatMileage(car.mileage) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Transmetimi:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {car.transmission ? translateTransmission(car.transmission) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Karburanti:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {car.fuel ? translateFuel(car.fuel) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Ngjyra:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {car.color ? translateColor(car.color) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Gjendja:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {car.condition || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Kontakto për më shumë informacion
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={handleContactWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Kontakto në WhatsApp
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Telefon: +383 48 181 116
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email: info@korauto.com
                </Button>
              </div>
            </div>

            {/* Source Information */}
            {car.source_api && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informacion mbi burimin
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Burimi:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {car.source_api === 'auctions_api' ? 'Auctions API' : 
                       car.source_api === 'auctionapis' ? 'Auction APIs' :
                       car.source_api === 'encar' ? 'Encar' : car.source_api}
                    </span>
                  </div>
                  {car.lot && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Kodi i lotit:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{car.lot}</span>
                    </div>
                  )}
                  {car.last_synced_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Përditësuar:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(car.last_synced_at).toLocaleDateString('sq-AL')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        {(car.features && car.features.length > 0) && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <EquipmentOptionsSection
              options={car.features}
              title="Pajisje dhe Opsione"
              maxInitial={8}
            />
          </div>
        )}

        {/* Safety Features */}
        {(car.safety_features && car.safety_features.length > 0) && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <EquipmentOptionsSection
              options={car.safety_features}
              title="Siguria"
              maxInitial={6}
            />
          </div>
        )}

        {/* Comfort Features */}
        {(car.comfort_features && car.comfort_features.length > 0) && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <EquipmentOptionsSection
              options={car.comfort_features}
              title="Komforti"
              maxInitial={6}
            />
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomOpen && images.length > 0 && (
        <ImageZoom
          images={images}
          currentIndex={selectedImageIndex}
          onClose={() => setIsImageZoomOpen(false)}
          onIndexChange={setSelectedImageIndex}
        />
      )}
    </div>
  );
});

UnifiedCarDetails.displayName = "UnifiedCarDetails";

export default UnifiedCarDetails;
