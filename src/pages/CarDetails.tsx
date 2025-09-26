import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { trackPageView, trackCarView, trackFavorite } from "@/utils/analytics";
import { calculateFinalPriceEUR } from "@/utils/carPricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, Share2, Heart, ChevronLeft, ChevronRight, Expand, Copy, ChevronDown, ChevronUp, DollarSign, Cog, Lightbulb, Camera, Thermometer, Wind, Radar } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";
import { useImagePreload } from "@/hooks/useImagePreload";
import { useImageSwipe } from "@/hooks/useImageSwipe";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { fallbackCars } from "@/data/fallbackData";
import { formatMileage } from "@/utils/mileageFormatter";

// Helper function to format production date as MM/YYYY
const getFormattedProductionDate = (car: {
  year?: number;
  month?: number;
  details?: {
    first_registration?: { month?: number };
    month?: number;
  };
}): string => {
  // Try to get month from first_registration first, then details.month
  const month = car.details?.first_registration?.month || car.details?.month || car.month;
  const year = car.year;
  
  if (month >= 1 && month <= 12 && year) {
    // Format month with leading zero if needed
    const formattedMonth = month.toString().padStart(2, '0');
    // Use full 4-digit year
    const formattedYear = year.toString();
    return `${formattedMonth}/${formattedYear}`;
  }
  
  // Fallback to just year if no month available
  return year ? year.toString() : '';
};

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
  // Numeric format fallback
  "1": "Klimatizimi",
  "2": "Dritaret Elektrike",
  "3": "Mbyllja Qendrore",
  "4": "Frena ABS",
  "5": "Airbag Sistemi",
  "6": "Radio/Sistemi Audio",
  "7": "CD Player",
  "8": "Bluetooth",
  "9": "Navigacioni GPS",
  "10": "Kamera e Prapme",
  "11": "Sensorët e Parkimit",
  "12": "Kontrolli i Kursimit",
  "13": "Sistemi Start/Stop",
  "14": "Dritat LED",
  "15": "Dritat Xenon",
  "16": "Pasqyrat Elektrike",
  "17": "Pasqyrat e Ngrohura",
  "18": "Kontrolli Elektronik i Stabilitetit",
  "19": "Sistemi Kundër Bllokimit",
  "20": "Kontrolli i Traksionit"
};

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
    status: {
      name: string;
    };
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
  airbags?: string;
  grade_iaai?: string;
  seller?: string;
  seller_type?: string;
  sale_date?: string;
  bid?: number;
  buy_now?: number;
  final_bid?: number;
  features?: string[];
  safety_features?: string[];
  comfort_features?: string[];
  performance_rating?: number;
  popularity_score?: number;
  // Enhanced API data
  insurance?: any;
  insurance_v2?: any;
  location?: any;
  inspect?: any;
  details?: any;
  lots?: any[];
}

// Equipment Options Section Component with Show More functionality
interface EquipmentOptionsProps {
  options: {
    standard?: string[];
    choice?: string[];
    tuning?: string[];
  };
  features?: string[];
  safetyFeatures?: string[];
  comfortFeatures?: string[];
}
const EquipmentOptionsSection = memo(({
  options,
  features,
  safetyFeatures,
  comfortFeatures
}: EquipmentOptionsProps) => {
  const [showAllStandard, setShowAllStandard] = useState(false);
  const [showAllChoice, setShowAllChoice] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showAllSafety, setShowAllSafety] = useState(false);
  const [showAllComfort, setShowAllComfort] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const INITIAL_SHOW_COUNT = 6;
  const PREVIEW_SHOW_COUNT = 10;

  // Helper function to get appropriate icon for equipment item
  const getEquipmentIcon = (item: string) => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('air') || itemLower.includes('klima')) return <Settings className="h-3 w-3 text-primary" />;
    if (itemLower.includes('brake') || itemLower.includes('frena')) return <Shield className="h-3 w-3 text-primary" />;
    if (itemLower.includes('engine') || itemLower.includes('motor')) return <Cog className="h-3 w-3 text-primary" />;
    if (itemLower.includes('seat') || itemLower.includes('ulëse')) return <Car className="h-3 w-3 text-primary" />;
    if (itemLower.includes('window') || itemLower.includes('dritare')) return <Eye className="h-3 w-3 text-primary" />;
    if (itemLower.includes('light') || itemLower.includes('dritë')) return <Star className="h-3 w-3 text-primary" />;
    if (itemLower.includes('radio') || itemLower.includes('audio')) return <MessageCircle className="h-3 w-3 text-primary" />;
    // Default icon for standard equipment
    return <CheckCircle className="h-3 w-3 text-primary" />;
  };

  // Get specific equipment preview items (up to 10 items from real API data)
  const getSpecificPreviewItems = () => {
    if (!options.standard || options.standard.length === 0) {
      return [];
    }
    
    // Get the first 10 most useful equipment items from the API
    const previewItems = options.standard.slice(0, 10);
    
    return previewItems.map((item, index) => {
      const itemName = typeof item === 'string' ? item : String(item);
      
      // Get appropriate icon based on equipment name
      const getIconForEquipment = (name: string) => {
        const itemLower = name.toLowerCase();
        if (itemLower.includes('air') || itemLower.includes('klima') || itemLower.includes('conditioning')) return Settings;
        if (itemLower.includes('brake') || itemLower.includes('frena') || itemLower.includes('abs')) return Shield;
        if (itemLower.includes('engine') || itemLower.includes('motor')) return Cog;
        if (itemLower.includes('seat') || itemLower.includes('ulëse')) return Car;
        if (itemLower.includes('window') || itemLower.includes('dritare')) return Eye;
        if (itemLower.includes('light') || itemLower.includes('dritë') || itemLower.includes('led') || itemLower.includes('xenon')) return Lightbulb;
        if (itemLower.includes('radio') || itemLower.includes('audio') || itemLower.includes('bluetooth')) return MessageCircle;
        if (itemLower.includes('camera') || itemLower.includes('kamerë')) return Camera;
        if (itemLower.includes('sensor') || itemLower.includes('sensorët') || itemLower.includes('radar')) return Radar;
        if (itemLower.includes('navigation') || itemLower.includes('gps') || itemLower.includes('navigacion')) return MapPin;
        if (itemLower.includes('cruise') || itemLower.includes('control') || itemLower.includes('kontroll')) return Gauge;
        if (itemLower.includes('heated') || itemLower.includes('ngrohje') || itemLower.includes('thermostat')) return Thermometer;
        if (itemLower.includes('vent') || itemLower.includes('air') || itemLower.includes('ajros')) return Wind;
        // Default icon for standard equipment
        return CheckCircle;
      };
      
      const IconComponent = getIconForEquipment(itemName);
      
      return {
        name: itemName,
        hasFeature: true, // All items from options.standard are available features
        icon: IconComponent
      };
    });
  };

  // Get preview items for display (standard equipment items)
  const getPreviewItems = () => {
    if (options.standard && options.standard.length > 0) {
      return options.standard.slice(0, PREVIEW_SHOW_COUNT);
    }
    return [];
  };

  const previewItems = getPreviewItems();
  const specificFeatures = getSpecificPreviewItems();
  
  return <div className="overflow-hidden bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/40 backdrop-blur-sm shadow-lg">
        {/* Equipment Preview - Shows up to 10 real equipment items from API */}
        {!showOptions && (
          <div className="p-4 border-b border-border/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <h5 className="text-sm font-medium text-foreground">Pajisje Standarde</h5>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
              {specificFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors min-h-[80px] justify-center ${
                    feature.hasFeature 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <IconComponent className={`h-5 w-5 flex-shrink-0 ${
                      feature.hasFeature 
                        ? 'text-primary font-bold' 
                        : 'text-gray-400'
                    }`} />
                    <span className={`text-xs font-medium text-center leading-tight break-words hyphens-auto max-w-full ${
                      feature.hasFeature 
                        ? 'text-foreground' 
                        : 'text-gray-400'
                    }`}>
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <Button onClick={() => setShowOptions(!showOptions)} variant="ghost" className="w-full justify-between p-4 h-auto group hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Cog className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">
              {showOptions ? "Fsheh Pajisjet dhe Opsionet" : "Shfaq të Gjitha Pajisjet dhe Opsionet"}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${showOptions ? "rotate-180 text-primary" : ""}`} />
        </Button>

        {showOptions && <div className="px-4 pb-4 space-y-4 animate-fade-in-up">
            {/* Standard Equipment */}
            {options.standard && options.standard.length > 0 && <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <h5 className="text-sm font-medium text-foreground">Pajisje Standarde</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(showAllStandard ? options.standard : options.standard.slice(0, INITIAL_SHOW_COUNT)).map((option, index) => <Badge key={index} variant="secondary" className="justify-center py-1.5 px-3 text-xs font-medium bg-primary/10 text-primary border-0 hover:bg-primary/20 transition-colors">
                      {option}
                    </Badge>)}
                </div>
                {options.standard.length > INITIAL_SHOW_COUNT && <Button variant="ghost" size="sm" onClick={() => setShowAllStandard(!showAllStandard)} className="h-8 px-3 text-xs text-primary hover:bg-primary/10 font-medium">
                    {showAllStandard ? `Më pak` : `Shiko të gjitha (${options.standard.length - INITIAL_SHOW_COUNT} më shumë)`}
                  </Button>}
              </div>}

            {/* Optional Equipment */}
            {options.choice && options.choice.length > 0 && <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <h5 className="text-sm font-medium text-foreground">Pajisje Opsionale</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(showAllChoice ? options.choice : options.choice.slice(0, INITIAL_SHOW_COUNT)).map((option, index) => <Badge key={index} variant="outline" className="justify-center py-1.5 px-3 text-xs font-medium bg-accent/10 text-accent-foreground border-accent/30 hover:bg-accent/20 transition-colors">
                      {option}
                    </Badge>)}
                </div>
                {options.choice.length > INITIAL_SHOW_COUNT && <Button variant="ghost" size="sm" onClick={() => setShowAllChoice(!showAllChoice)} className="h-8 px-3 text-xs text-primary hover:bg-primary/10 font-medium">
                    {showAllChoice ? `Më pak` : `Shiko të gjitha (${options.choice.length - INITIAL_SHOW_COUNT} më shumë)`}
                  </Button>}
              </div>}

            {/* Tuning Modifications */}
            {options.tuning && options.tuning.length > 0 && <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <h5 className="text-sm font-medium text-foreground">Modifikimet</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {options.tuning.map((option, index) => <Badge key={index} variant="destructive" className="justify-center py-1.5 px-3 text-xs font-medium bg-destructive/10 text-destructive border-0 hover:bg-destructive/20 transition-colors">
                      {option}
                    </Badge>)}
                </div>
              </div>}

            {/* General Features */}
            {features && features.length > 0 && <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  <h5 className="text-sm font-medium text-foreground">Karakteristika të Përgjithshme</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(showAllFeatures ? features : features.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => <Badge key={index} variant="outline" className="justify-center py-1.5 px-3 text-xs font-medium bg-muted/10 text-muted-foreground border-muted/40 hover:bg-muted/20 transition-colors">
                      {feature}
                    </Badge>)}
                </div>
                {features.length > INITIAL_SHOW_COUNT && <Button variant="ghost" size="sm" onClick={() => setShowAllFeatures(!showAllFeatures)} className="h-8 px-3 text-xs text-primary hover:bg-primary/10 font-medium">
                    {showAllFeatures ? `Më pak` : `Shiko të gjitha (${features.length - INITIAL_SHOW_COUNT} më shumë)`}
                  </Button>}
              </div>}

            {/* Safety Features */}
            {safetyFeatures && safetyFeatures.length > 0 && <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <h5 className="text-sm font-medium text-foreground">Sigurinë</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(showAllSafety ? safetyFeatures : safetyFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => <Badge key={index} variant="secondary" className="justify-center py-1.5 px-3 text-xs font-medium bg-green-100 text-green-700 border-0 hover:bg-green-200 transition-colors">
                      {feature}
                    </Badge>)}
                </div>
                {safetyFeatures.length > INITIAL_SHOW_COUNT && <Button variant="ghost" size="sm" onClick={() => setShowAllSafety(!showAllSafety)} className="h-8 px-3 text-xs text-primary hover:bg-primary/10 font-medium">
                    {showAllSafety ? `Më pak` : `Shiko të gjitha (${safetyFeatures.length - INITIAL_SHOW_COUNT} më shumë)`}
                  </Button>}
              </div>}

            {/* Comfort Features */}
            {comfortFeatures && comfortFeatures.length > 0 && <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <h5 className="text-sm font-medium text-foreground">Komforti</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(showAllComfort ? comfortFeatures : comfortFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => <Badge key={index} variant="secondary" className="justify-center py-1.5 px-3 text-xs font-medium bg-blue-100 text-blue-700 border-0 hover:bg-blue-200 transition-colors">
                      {feature}
                    </Badge>)}
                </div>
                {comfortFeatures.length > INITIAL_SHOW_COUNT && <Button variant="ghost" size="sm" onClick={() => setShowAllComfort(!showAllComfort)} className="h-8 px-3 text-xs text-primary hover:bg-primary/10 font-medium">
                    {showAllComfort ? `Më pak` : `Shiko të gjitha (${comfortFeatures.length - INITIAL_SHOW_COUNT} më shumë)`}
                  </Button>}
              </div>}
          </div>}
      </div>;
});
EquipmentOptionsSection.displayName = "EquipmentOptionsSection";

const CarDetails = () => {
  const { lot } = useParams<{ lot: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { exchangeRate, loading: currencyLoading, error: currencyError } = useCurrencyAPI();
  const { } = useNavigation();

  // Get instant car data from navigation state or sessionStorage (for mobile new tab)
  const instantCarData = useMemo(() => {
    // First try navigation state (desktop and same-tab mobile)
    if (location.state?.carData) {
      return location.state.carData;
    }
    
    // Then try sessionStorage (mobile new tab)
    if (lot) {
      const storedData = sessionStorage.getItem(`carData_${lot}`);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          // Clean up after using
          sessionStorage.removeItem(`carData_${lot}`);
          return parsed;
        } catch (e) {
          console.error("Failed to parse stored car data:", e);
        }
      }
    }
    
    return null;
  }, [location.state, lot]);

  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(!instantCarData); // Start as not loading if we have instant data
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageContainerRef, setImageContainerRef] = useState<HTMLDivElement | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showInspectionReport, setShowInspectionReport] = useState(false);
  const [showEngineSection, setShowEngineSection] = useState(false);
   const [title, setTitle] = useState("Car Details");

  // Set up instant display from navigation state
  useEffect(() => {
    if (instantCarData && !car) {
      console.log("Setting up instant car display from navigation state:", instantCarData);
      
      // Transform instant car data to CarDetails format
      const transformedCar: CarDetails = {
        id: instantCarData.id || lot || "",
        make: instantCarData.make || "Unknown",
        model: instantCarData.model || "Unknown", 
        year: instantCarData.year || 2020,
        price: instantCarData.price || 0,
        image: instantCarData.image || (instantCarData.images && instantCarData.images[0]),
        images: instantCarData.images || [instantCarData.image].filter(Boolean),
        vin: instantCarData.vin,
        mileage: instantCarData.mileage,
        transmission: instantCarData.transmission,
        fuel: instantCarData.fuel,
        color: instantCarData.color,
        condition: instantCarData.condition,
        lot: instantCarData.lot || lot || "",
        title: instantCarData.title || `${instantCarData.make} ${instantCarData.model}`,
        features: [],
        safety_features: [],
        comfort_features: [],
        performance_rating: 4.5,
        popularity_score: 85,
        // Additional fields from navigation state
        cylinders: instantCarData.cylinders,
        insurance: instantCarData.insurance,
        insurance_v2: instantCarData.insurance_v2,
        location: instantCarData.locationDetails,
        inspect: instantCarData.inspect,
        details: instantCarData.details
      };
      
      setCar(transformedCar);
      setLoading(false); // Stop loading since we have instant data
      
      // Track the instant view
      trackCarView(instantCarData.id || lot || "", transformedCar);
    }
  }, [instantCarData, car, lot]);

  // Helper functions
  const processFloodDamageText = (text: string): string => {
    if (!text) return "Nuk ka informacion për dëmtimet nga përmbytja";
    
    // Handle common flood damage statuses
    const floodMap: { [key: string]: string } = {
      "flood_damage": "Dëmtim nga përmbytja",
      "no_flood_damage": "Pa dëmtime nga përmbytja",
      "flood": "Dëmtim nga ujërat",
      "water_damage": "Dëmtim nga uji",
      "normal": "Normal - pa dëmtime nga uji"
    };
    
    return floodMap[text.toLowerCase()] || text;
  };

  const convertOptionsToNames = (options: any) => {
    if (!options) return { standard: [], choice: [], tuning: [] };
    
    // Convert the options object to arrays of readable names
    const convertArray = (arr: any[]) => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item.name) return item.name;
        if (typeof item === 'number') return FEATURE_MAPPING[item.toString()] || `Option ${item}`;
        return String(item);
      });
    };

    return {
      standard: convertArray(options.standard || []),
      choice: convertArray(options.choice || []),
      tuning: convertArray(options.tuning || [])
    };
  };

  // Extract features from car data
  const getCarFeatures = (carData: any, lotData: any): string[] => {
    const features = [];
    if (carData.transmission?.name) features.push(`Transmisioni: ${carData.transmission.name}`);
    if (carData.fuel?.name) features.push(`Karburanti: ${carData.fuel.name}`);
    if (carData.color?.name) features.push(`Ngjyra: ${carData.color.name}`);
    if (carData.engine?.name) features.push(`Motori: ${carData.engine.name}`);
    if (carData.cylinders) features.push(`${carData.cylinders} Cilindra`);
    if (carData.drive_wheel?.name) features.push(`Tërheqje: ${carData.drive_wheel.name}`);
    if (lotData?.keys_available) features.push("Çelësat të Disponueshëm");

    // Add basic features if list is empty
    if (features.length === 0) {
      return ["Klimatizimi", "Dritaret Elektrike", "Mbyllja Qendrore", "Frena ABS"];
    }
    return features;
  };
  const getSafetyFeatures = (carData: any, lotData: any): string[] => {
    const safety = [];
    if (lotData?.airbags) safety.push(`Sistemi i Airbag-ëve: ${lotData.airbags}`);
    if (carData.transmission?.name === "automatic") safety.push("ABS Sistemi i Frënimit");
    safety.push("Sistemi i Stabilitetit Elektronik");
    if (lotData?.keys_available) safety.push("Sistemi i Sigurisë");

    // Add default safety features
    return safety.length > 0 ? safety : ["ABS Sistemi i Frënimit", "Airbag Sistemi", "Mbyllja Qendrore"];
  };
  const getComfortFeatures = (carData: any, lotData: any): string[] => {
    const comfort = [];
    if (carData.transmission?.name === "automatic") comfort.push("Transmisioni Automatik");
    comfort.push("Klimatizimi");
    comfort.push("Dritaret Elektrike");
    comfort.push("Pasqyrat Elektrike");
    return comfort;
  };

  // Background data enhancement - fetch complete details even if we have instant data
  useEffect(() => {
    let isMounted = true;
    if (!lot || currencyLoading) return;

    // Skip background fetch if we already have complete data with detailed information
    if (car && car.details && car.insurance_v2 && car.images && car.images.length > 3) {
      console.log("Already have complete car data, skipping background fetch");
      return;
    }

    const fetchCarDetails = async () => {
      try {
        // Only show loading if we don't have instant data
        if (!instantCarData) {
          setLoading(true);
        }
        setError(null);

        // First try to find car in cache
        const { data: cachedCar, error: cacheError } = await supabase
          .from('cars_cache')
          .select('*')
          .or(`id.eq.${lot},api_id.eq.${lot},lot_number.eq.${lot}`)
          .single();

        console.log("Cache query result:", {
          lot,
          cachedCar,
          cacheError
        });

        if (!cacheError && cachedCar && isMounted) {
          console.log("Found car in cache:", cachedCar);

          // Transform cached car data to CarDetails format
          const carData = typeof cachedCar.car_data === "string" ? JSON.parse(cachedCar.car_data) : cachedCar.car_data;
          const lotData = typeof cachedCar.lot_data === "string" ? JSON.parse(cachedCar.lot_data || "{}") : cachedCar.lot_data || {};
          const images = typeof cachedCar.images === "string" ? JSON.parse(cachedCar.images || "[]") : cachedCar.images || [];
          const basePrice = lotData.buy_now || cachedCar.price;
          if (!basePrice) {
            console.log("Car doesn't have buy_now pricing, redirecting to catalog");
            navigate('/catalog');
            return;
          }
          const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);
          const transformedCar: CarDetails = {
            id: cachedCar.id,
            make: cachedCar.make || "Unknown",
            model: cachedCar.model || "Unknown",
            year: cachedCar.year || 2020,
            price,
            image: images[0] || "/placeholder.svg",
            images: images || [],
            vin: cachedCar.vin || carData.vin,
            mileage: cachedCar.mileage || lotData.odometer?.km,
            transmission: cachedCar.transmission || carData.transmission?.name,
            fuel: cachedCar.fuel || carData.fuel?.name,
            color: cachedCar.color || carData.color?.name,
            condition: cachedCar.condition || lotData.condition?.name?.replace("run_and_drives", "Good Condition"),
            lot: cachedCar.lot_number || lotData.lot,
            title: `${cachedCar.year} ${cachedCar.make} ${cachedCar.model}`,
            odometer: lotData.odometer,
            engine: carData.engine,
            cylinders: carData.cylinders,
            drive_wheel: carData.drive_wheel,
            body_type: carData.body_type,
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
            features: getCarFeatures(carData, lotData),
            safety_features: getSafetyFeatures(carData, lotData),
            comfort_features: getComfortFeatures(carData, lotData),
            performance_rating: 4.5,
            popularity_score: 85,
            // Enhanced API data
            insurance: lotData.insurance,
            insurance_v2: lotData.insurance_v2,
            location: lotData.location,
            inspect: lotData.inspect,
            details: lotData.details
          };
          setCar(transformedCar);
          setLoading(false);

          // Track car view analytics
          trackCarView(cachedCar.id || cachedCar.api_id, transformedCar);
          return;
        }

      // If no data found, try fallback data
      const fallbackCar = fallbackCars.find(car => 
        car.id === lot || car.lot_number === lot
      );

      if (fallbackCar && isMounted) {
        console.log("Using fallback car data:", fallbackCar);
        
        const lotData = (fallbackCar.lots && fallbackCar.lots[0]) || {} as any;
        const basePrice = lotData?.buy_now || fallbackCar.price;
        if (!basePrice) {
          setError(`Car with lot ${lot} is not available for purchase.`);
          setLoading(false);
          return;
        }

        const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);
        const transformedCar: CarDetails = {
          id: fallbackCar.id || lot,
          make: fallbackCar.manufacturer?.name || "Unknown",
          model: fallbackCar.model?.name || "Unknown",
          year: fallbackCar.year || 2020,
          price,
          image: lotData?.images?.normal?.[0] || lotData?.images?.big?.[0] || (fallbackCar as any).image_url || (fallbackCar.lots?.[0] as any)?.images?.normal?.[0],
          images: [...(lotData?.images?.normal || []), ...(lotData?.images?.big || []), ...((fallbackCar.lots?.[0] as any)?.images?.normal || [])].filter(Boolean),
          vin: fallbackCar.vin,
          mileage: lotData?.odometer?.km || fallbackCar.odometer,
          transmission: fallbackCar.transmission?.name,
          fuel: fallbackCar.fuel?.name,
          color: fallbackCar.color?.name,
          condition: lotData?.condition?.name?.replace("run_and_drives", "Good Condition"),
          lot: fallbackCar.lot_number || lot,
          title: fallbackCar.title,
          features: [],
          safety_features: [],
          comfort_features: [],
          performance_rating: 4.5,
          popularity_score: 85
        };
        
        setCar(transformedCar);
        setLoading(false);
        trackCarView(fallbackCar.id || transformedCar.id, transformedCar);
        return;
      }

      // If no fallback data found either, show error
      setError(`Car with lot number ${lot} not found. This car may have been sold or is no longer available.`);
      setLoading(false);

    } catch (apiError) {
      console.error("Error fetching car details:", apiError);

      if (!isMounted) return;

      // Final fallback - try fallback data one more time
      const fallbackCar = fallbackCars.find(car => 
        car.id === lot || car.lot_number === lot
      );

      if (fallbackCar && isMounted) {
        console.log("Using fallback car data as final option:", fallbackCar);
        
        const lotData = (fallbackCar.lots && fallbackCar.lots[0]) || {} as any;
        const basePrice = lotData?.buy_now || fallbackCar.price;
        if (!basePrice) {
            console.log("Fallback car doesn't have buy_now pricing, showing error");
            throw new Error("Car pricing not available");
          }
          const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);
          const transformedCar: CarDetails = {
            id: fallbackCar.id,
            make: fallbackCar.manufacturer?.name || "Unknown",
            model: fallbackCar.model?.name || "Unknown",
            year: fallbackCar.year || 2020,
            price,
            image: lotData?.images?.normal?.[0] || lotData?.images?.big?.[0] || "/placeholder.svg",
            images: lotData?.images?.normal || lotData?.images?.big || [],
            vin: fallbackCar.vin,
            mileage: lotData?.odometer?.km,
            transmission: fallbackCar.transmission?.name,
            fuel: fallbackCar.fuel?.name,
            color: fallbackCar.color?.name,
            condition: "Good Condition",
            lot: fallbackCar.lot_number,
            title: fallbackCar.title,
            odometer: lotData?.odometer ? {
              km: lotData.odometer.km || 0,
              mi: Math.round((lotData.odometer.km || 0) * 0.621371),
              status: {
                name: "Verified"
              }
            } : {
              km: 0,
              mi: 0,
              status: {
                name: "Unknown"
              }
            },
            features: fallbackCar.features || [],
            safety_features: ["ABS", "Airbags", "Stability Control"],
            comfort_features: ["Air Conditioning", "Power Windows"],
            performance_rating: 4.5,
            popularity_score: 85,
            // Enhanced API data  
            details: (lotData as any)?.details || undefined
          };
          setCar(transformedCar);
          setLoading(false);
          return;
        }

        // If no fallback data found, show appropriate error message
        const errorMessage = apiError instanceof Error ? apiError.message.includes("Failed to fetch") ? "Unable to connect to the server. Please check your internet connection and try again." : apiError.message.includes("404") ? `Car with ID ${lot} is not available. This car may have been sold or removed.` : "Car not found" : "Car not found";
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchCarDetails();
    return () => {
      isMounted = false;
    };
  }, [lot, exchangeRate.rate, currencyLoading, navigate, instantCarData, car]);

  // Set page title based on car data
  useEffect(() => {
    if (car) {
      const pageTitle = `${car.year} ${car.make} ${car.model} - Car Details`;
      setTitle(pageTitle);
      document.title = pageTitle;
      trackPageView(window.location.pathname, {});
    } else {
      setTitle("Car Details");
      document.title = "Car Details";
    }
  }, [car]);

  // Preload images when car data is available
  useImagePreload(car?.images?.[0] || "");

  // Get current images for display
  const images = useMemo(() => {
    if (car?.images?.length) {
      return car.images;
    }
    if (car?.image) {
      return [car.image];
    }
    return ["/placeholder.svg"];
  }, [car?.images, car?.image]);

  // Enhanced image navigation with swipe support
  const swipeHandlers = useImageSwipe({
    images: images,
    onImageChange: setSelectedImageIndex
  });

  // Navigation functions
  const nextImage = useCallback(() => {
    if (car?.images && selectedImageIndex < car.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  }, [car?.images, selectedImageIndex]);

  const prevImage = useCallback(() => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }, [selectedImageIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') nextImage();
      if (event.key === 'ArrowLeft') prevImage();
      if (event.key === 'Escape') setIsImageZoomOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextImage, prevImage]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoplayEnabled || !car?.images || car.images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex(prevIndex => 
        prevIndex >= (car.images!.length - 1) ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [autoplayEnabled, car?.images]);


  // Check if current image is a placeholder
  const isPlaceholderImage = useMemo(() => {
    const currentImage = images[selectedImageIndex];
    return currentImage === "/placeholder.svg" || currentImage?.includes("placeholder");
  }, [images, selectedImageIndex]);

  // Handle contact via WhatsApp
  const handleContactWhatsApp = useCallback(() => {
    if (!car) return;
    
    const message = `Përshëndetje! Jam i interesuar për makinën ${car.year} ${car.make} ${car.model} (Lot #${car.lot}) me çmim €${Math.round(car.price).toLocaleString()}. A mund të më jepni më shumë informacione?`;
    const whatsappUrl = `https://wa.me/38349123456?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }, [car]);

  // Handle copying lot number
  const handleCopyLot = useCallback(async () => {
    if (!car?.lot) return;
    
    try {
      await navigator.clipboard.writeText(car.lot);
      toast({
        title: "Kopjuar!",
        description: "Numri i lotit u kopjua në clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Gabim",
        description: "Nuk u arrit të kopjohet numri i lotit",
        variant: "destructive",
      });
    }
  }, [car?.lot, toast]);

  // Toggle favorite status
  const handleToggleFavorite = useCallback(() => {
    if (!car) return;
    
    setIsFavorited(!isFavorited);
    trackFavorite(car.id, isFavorited ? "remove" : "add");
    
    toast({
      title: isFavorited ? "Hequr nga të preferuarat" : "Shtuar në të preferuarat",
      description: `${car.year} ${car.make} ${car.model}`,
    });
  }, [car, isFavorited, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 rounded-xl border-0 shadow-2xl max-w-sm w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Po ngarkohen detajet...</h2>
          <p className="text-sm text-muted-foreground">Ju lutemi prisni ndërkohë që marrim informacionet e makinës.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 rounded-xl border-0 shadow-2xl max-w-md w-full text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-4">Makina nuk u gjet</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/catalog')} variant="outline" className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu në katalog
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Provo përsëri
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Back Navigation - Always Visible */}
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => navigate('/catalog')} className="text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu në katalog
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Left Column - Images and Gallery */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-4">
            {/* Compact Main Image */}
            <Card className="glass-card border-0 shadow-2xl overflow-hidden rounded-xl">
              <CardContent className="p-0">
                <div 
                  ref={swipeHandlers.containerRef} 
                  className="car-details-hero relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] bg-gradient-to-br from-muted to-muted/50 overflow-hidden group cursor-pointer" 
                  onClick={() => setIsImageZoomOpen(true)}
                  data-fancybox="gallery"
                >
                  {images.length > 0 ? (
                    <img 
                      src={images[selectedImageIndex]} 
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className={`w-full h-full transition-transform duration-300 hover:scale-105 ${
                        isPlaceholderImage 
                          ? "object-cover" // Use object-cover for placeholder to fill container properly on mobile
                          : "object-contain bg-white" // Use object-contain for real images to show full image with white background
                      }`}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}

                  {/* Navigation Arrows - Desktop Only */}
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        disabled={selectedImageIndex === 0}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 hidden lg:flex items-center justify-center w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        disabled={selectedImageIndex === images.length - 1}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden lg:flex items-center justify-center w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Swipe Hint - Mobile Only */}
                  {images.length > 1 && (
                    <div className="lg:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white opacity-70">
                      Swipe to see more photos
                    </div>
                  )}
                  
                  {car.lot && (
                    <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-1 text-xs font-medium shadow-lg">
                      Lot #{car.lot}
                    </Badge>
                  )}
                  {/* Zoom icon */}
                  <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Expand className="h-3 w-3 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Car Title and Details - VISIBLE ON ALL DEVICES */}
            <div>
              <h1 className="car-details-title">
                {car.make} {car.model}
              </h1>
              <div className="car-details-row">
                <span>{getFormattedProductionDate(car)}</span>
                <span>•</span>
                <span>{formatMileage(car.mileage)?.replace(' km', ' Km')}</span>
                <span>•</span>
                <span style={{ textTransform: 'capitalize' }}>{car.fuel || 'gasoline'}</span>
                <a href="#specifications" className="detail-link">In detail</a>
              </div>
            </div>

            {/* Enhanced Image Thumbnails - Better Mobile Layout - HIDDEN ON MOBILE */}
            {images.length > 1 && (
              <div className="car-details-thumbnails hidden md:grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-2">
                {images.slice(0, 24).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Shiko imazhin ${index + 1} nga ${images.length}`}
                    className={`relative h-12 sm:h-14 md:h-16 bg-muted rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                      selectedImageIndex === index 
                        ? "border-primary shadow-md ring-2 ring-primary/50" 
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Enhanced Vehicle Specifications - Mobile Optimized */}
            <Card id="specifications" className="glass-card border-0 shadow-xl rounded-xl mobile-specs-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center text-foreground">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                    Specifikimet Teknike
                  </h3>

                  {/* Enhanced Price and action buttons - Mobile First */}
                  <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center sm:text-left">
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        €{Math.round(car.price).toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        +350€ deri në Prishtinë
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <InspectionRequestForm 
                        trigger={
                          <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto h-9 text-sm">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Kërko Inspektim
                          </Button>
                        } 
                        carId={car.id} 
                        carMake={car.make} 
                        carModel={car.model} 
                        carYear={car.year} 
                      />
                      <Button onClick={handleContactWhatsApp} size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white w-full sm:w-auto h-9 text-sm">
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Enhanced car info grid with better mobile spacing */}
                <div className="glass-panel p-3 sm:p-4 rounded-lg bg-gradient-to-br from-card to-card/50 border border-border/20">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-muted-foreground font-medium text-left text-xs sm:text-sm">
                      {getFormattedProductionDate(car)}
                    </span>
                    <span className="text-muted-foreground font-medium text-right text-xs sm:text-sm">
                      {car.make} {car.model}
                    </span>
                  </div>

                  {/* Responsive specifications grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                    {/* VIN */}
                    {car.vin && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">VIN</span>
                        </div>
                        <span className="text-muted-foreground font-mono text-xs break-all">{car.vin}</span>
                      </div>
                    )}

                    {/* Mileage */}
                    <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-foreground text-xs">Kilometrazha</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{formatMileage(car.mileage)?.replace(' km', ' Km') || 'N/A'}</span>
                    </div>

                    {/* Transmission */}
                    {car.transmission && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Transmisioni</span>
                        </div>
                        <span className="text-muted-foreground capitalize text-xs">{car.transmission}</span>
                      </div>
                    )}

                    {/* Fuel */}
                    {car.fuel && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Fuel className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Karburanti</span>
                        </div>
                        <span className="text-muted-foreground capitalize text-xs">{car.fuel}</span>
                      </div>
                    )}

                    {/* Color */}
                    {car.color && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Palette className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Ngjyra</span>
                        </div>
                        <span className="text-muted-foreground capitalize text-xs">{car.color}</span>
                      </div>
                    )}

                    {/* Condition */}
                    {car.condition && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Gjendja</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{car.condition}</span>
                      </div>
                    )}

                    {/* Engine */}
                    {car.engine?.name && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Cog className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Motori</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{car.engine.name}</span>
                      </div>
                    )}

                    {/* Cylinders */}
                    {car.cylinders && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Cilindrat</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{car.cylinders}</span>
                      </div>
                    )}

                    {/* Drive Wheel */}
                    {car.drive_wheel?.name && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Car className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Tërheqje</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{car.drive_wheel.name}</span>
                      </div>
                    )}

                    {/* Body Type */}
                    {car.body_type?.name && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Car className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Karoceria</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{car.body_type.name}</span>
                      </div>
                    )}

                    {/* Keys Available */}
                    {car.keys_available !== undefined && (
                      <div className="flex flex-col p-2 sm:p-3 bg-background/50 rounded-lg border border-border/10 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-foreground text-xs">Çelësat</span>
                        </div>
                        <span className={`text-xs ${car.keys_available ? 'text-green-600' : 'text-red-600'}`}>
                          {car.keys_available ? 'Të Disponueshëm' : 'Nuk Disponohen'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Detailed Information Section */}
            <Card className="glass-panel border-0 shadow-2xl rounded-xl mobile-detailed-info-card">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
                  
                  
                </div>

                {car.details && <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-top-2 duration-300">
                    {/* Insurance & Safety Report - Mobile Optimized */}
                    {(car.insurance_v2 || car.inspect || car.insurance) && <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted/50 rounded-lg mobile-info-section">
                        <h4 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                          Raporti i Sigurisë dhe Sigurimit
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                          {car.insurance_v2?.accidentCnt !== undefined && <div className="flex items-center justify-between p-2 sm:p-3 bg-card border border-border rounded-lg mobile-detail-item">
                              <span className="text-xs sm:text-sm font-medium">
                                Historia e Aksidenteve:
                              </span>
                              <Badge variant={car.insurance_v2.accidentCnt === 0 ? "secondary" : "destructive"} className="text-xs">
                                {car.insurance_v2.accidentCnt === 0 ? "E Pastër" : `${car.insurance_v2.accidentCnt} aksidente`}
                              </Badge>
                            </div>}
                          {car.insurance_v2?.ownerChangeCnt !== undefined && <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">
                                Ndryshime Pronësie:
                              </span>
                              <span className="font-medium">
                                {car.insurance_v2.ownerChangeCnt}
                              </span>
                            </div>}
                          {car.insurance_v2?.totalLossCnt !== undefined && car.insurance_v2.totalLossCnt > 0 && <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                <span className="text-sm">Humbje Totale:</span>
                                <Badge variant="destructive">
                                  {car.insurance_v2.totalLossCnt}
                                </Badge>
                              </div>}
                          {car.insurance_v2?.floodTotalLossCnt !== undefined && car.insurance_v2.floodTotalLossCnt > 0 && <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                <span className="text-sm">
                                  demtime:
                                </span>
                                <Badge variant="destructive">
                                  {car.insurance_v2.floodTotalLossCnt}
                                </Badge>
                              </div>}
                        </div>
                      </div>}

                    {/* Vehicle Details */}
                    {car.details && <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <Button onClick={() => {
                        setShowInspectionReport(!showInspectionReport);
                      }} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                              {showInspectionReport ? "Fshih Raportin" : "Raporti"}
                              {/* Show indicators for available inspection data */}
                              {!showInspectionReport && <div className="ml-2 flex gap-1">
                                  {car.details?.inspect_outer && <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Visual inspection data available" />}
                                  {(car.details?.inspect?.inner || car.details?.insurance) && <div className="w-2 h-2 bg-orange-400 rounded-full" title="Technical inspection data available" />}
                                  {car.insurance_v2?.accidents && <div className="w-2 h-2 bg-red-400 rounded-full" title="Accident history available" />}
                                </div>}
                            </Button>
                      </div>}

                    {/* Compact Modern Inspection Report Section - Triggered by Raporti Button */}
                    {showInspectionReport && <div className="space-y-4 p-4 lg:p-6 bg-card rounded-xl border border-border shadow-md px-0 py-0">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <h4 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                            Raporti i Inspektimit të Plotë
                          </h4>
                          <p className="text-muted-foreground text-sm lg:text-base max-w-xl mx-auto">
                            Analiza e detajuar profesionale e gjendjes së automjetit
                          </p>
                        </div>

                        {/* Inspection Groups - Compact Modern Cards Layout */}
                        <div className="grid gap-4">
                          
                          {/* Technical Inspection - Engine & Mechanical - Collapsible - Mobile Optimized */}
                          {car.details?.inspect?.inner && <div className="overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 inspection-section-black mobile-inspection-section">
                              <Button onClick={() => setShowEngineSection(!showEngineSection)} variant="ghost" className="w-full p-2 sm:p-3 md:p-4 h-auto group hover:bg-blue-100/50 transition-all duration-300">
                                {/* Mobile Layout: Stack vertically */}
                                <div className="flex flex-col gap-1.5 sm:gap-2 w-full sm:hidden">
                                  {/* Title row with icon and chevron */}
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors flex-shrink-0">
                                        <Cog className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                      </div>
                                      <div className="text-left min-w-0 flex-1">
                                        <h5 className="text-xs sm:text-sm font-bold text-foreground inspection-text-black">Motori dhe Sistemi Mekanik</h5>
                                        <p className="text-muted-foreground text-xs inspection-subtext-black">Kontrolli teknik i komponentëve kryesorë</p>
                                      </div>
                                    </div>
                                    <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground transition-all duration-300 flex-shrink-0 ${showEngineSection ? "rotate-180 text-primary" : ""}`} />
                                  </div>
                                  {/* Status indicators row */}
                                  {!showEngineSection && <div className="flex items-center gap-1 sm:gap-2 justify-center">
                                      <div className="flex gap-0.5 sm:gap-1">
                                        {Object.entries(car.details.inspect.inner).slice(0, 3).map(([key, value], index) => {
                                const isGood = value === "goodness" || value === "proper" || value === "doesn't exist";
                                return <div key={index} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`} title={`${key}: ${value}`} />;
                              })}
                                        {Object.entries(car.details.inspect.inner).length > 3 && <span className="text-xs text-muted-foreground ml-1">
                                            +{Object.entries(car.details.inspect.inner).length - 3}
                                          </span>}
                                      </div>
                                    </div>}
                                </div>

                                {/* Desktop Layout: Horizontal */}
                                <div className="hidden sm:flex sm:items-center sm:justify-between sm:w-full">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors flex-shrink-0">
                                      <Cog className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="text-left min-w-0 flex-1">
                                      <h5 className="text-base md:text-lg font-bold text-foreground inspection-text-black">Motori dhe Sistemi Mekanik</h5>
                                      <p className="text-muted-foreground text-xs inspection-subtext-black">Kontrolli teknik i komponentëve kryesorë</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {!showEngineSection && <div className="flex gap-1">
                                        {Object.entries(car.details.inspect.inner).slice(0, 3).map(([key, value], index) => {
                                const isGood = value === "goodness" || value === "proper" || value === "doesn't exist";
                                return <div key={index} className={`w-2 h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`} title={`${key}: ${value}`} />;
                              })}
                                        {Object.entries(car.details.inspect.inner).length > 3 && <span className="text-xs text-muted-foreground ml-1">
                                            +{Object.entries(car.details.inspect.inner).length - 3}
                                          </span>}
                                      </div>}
                                    <ChevronDown className={`h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-all duration-300 ${showEngineSection ? "rotate-180 text-primary" : ""}`} />
                                  </div>
                                </div>
                              </Button>

                              {showEngineSection && <div className="px-3 pb-3 space-y-2 animate-fade-in">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    {Object.entries(car.details.inspect.inner).map(([key, value]: [string, any]) => {
                            const isGood = value === "goodness" || value === "proper" || value === "doesn't exist";
                            const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                            return <div key={key} className={`flex items-center justify-between p-3 bg-card rounded-lg border transition-all hover:shadow-sm ${isGood ? 'border-green-200' : 'border-red-200'}`}>
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isGood ? 'bg-green-500' : 'bg-red-500'}`} />
                                              <span className="text-sm font-medium text-foreground truncate">
                                                {label}
                                              </span>
                                            </div>
                                            <Badge variant={isGood ? "default" : "destructive"} className={`text-xs font-medium flex-shrink-0 ml-2 px-2 py-1 ${isGood ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                              {value === "goodness" && "✓ Mirë"}
                                              {value === "proper" && "✓ Normal"}
                                              {value === "doesn't exist" && "✓ Pa Probleme"}
                                              {!["goodness", "proper", "doesn't exist"].includes(value) && `⚠ ${value}`}
                                            </Badge>
                                          </div>;
                          })}
                                  </div>
                                </div>}
                            </div>}

                          {/* Insurance & Safety History */}
                          {car.details?.insurance && <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 inspection-section-black">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                  <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h5 className="text-xl font-bold text-foreground">Historia e Sigurisë dhe Sigurimit</h5>
                                  <p className="text-muted-foreground text-sm">Të dhënat e sigurimit dhe aksidenteve</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {car.details.insurance.car_info && <>
                                    <div className="p-4 bg-card rounded-lg border border-green-500/20 hover:shadow-md transition-shadow">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold text-foreground">
                                          Historia e Aksidenteve
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {car.details.insurance.car_info.accident_history}
                                      </p>
                                    </div>
                                    <div className="p-4 bg-card rounded-lg border border-green-500/20 hover:shadow-md transition-shadow">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Settings className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold text-foreground">
                                          riparime
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {car.details.insurance.car_info.repair_count}
                                      </p>
                                    </div>
                                    <div className="p-4 bg-card rounded-lg border border-green-500/20 hover:shadow-md transition-shadow">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold text-foreground">
                                          Humbje Totale
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {car.details.insurance.car_info.total_loss}
                                      </p>
                                    </div>
                                    <div className="p-4 bg-card rounded-lg border border-green-500/20 hover:shadow-md transition-shadow">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Car className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold text-foreground">
                                          demtime
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {processFloodDamageText(car.details.insurance.car_info.flood_damage)}
                                      </p>
                                    </div>
                                  </>}
                              </div>
                            </div>}

                          {/* Exterior & Body Condition */}
                          {car.damage && <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 inspection-section-black">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                                  <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h5 className="text-xl font-bold text-foreground inspection-text-black">Gjendja e Jashtme dhe Karocerisë</h5>
                                  <p className="text-muted-foreground text-sm inspection-subtext-black">Vlerësimi i dëmtimeve dhe riparime</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {car.damage.main && <div className="p-4 bg-card rounded-lg border border-orange-500/20 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                                      <span className="text-sm font-semibold text-foreground">
                                        Dëmtimi Kryesor
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {car.damage.main}
                                    </p>
                                  </div>}
                                {car.damage.second && <div className="p-4 bg-card rounded-lg border border-orange-500/20 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                                      <span className="text-sm font-semibold text-foreground">
                                        Dëmtimi Dytësor
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {car.damage.second}
                                    </p>
                                  </div>}
                              </div>
                            </div>}

                          {/* Owner History */}
                          {car.details?.insurance?.owner_changes && car.details.insurance.owner_changes.length > 0 && <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 inspection-section-black">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <Users className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <h5 className="text-xl font-bold text-foreground">Historia e Pronarëve</h5>
                                    <p className="text-muted-foreground text-sm">Ndryshimet e pronësisë përgjatë kohës</p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  {car.details.insurance.owner_changes.map((change: any, index: number) => <div key={index} className="p-4 bg-card rounded-lg border border-purple-500/20 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                            <div>
                                              <span className="text-sm font-semibold text-foreground">
                                                {change.change_type}
                                              </span>
                                              {change.usage_type && <p className="text-xs text-muted-foreground mt-1">
                                                  Lloji: {change.usage_type}
                                                </p>}
                                            </div>
                                          </div>
                                          <span className="text-xs text-muted-foreground bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                                            {change.date}
                                          </span>
                                        </div>
                                      </div>)}
                                </div>
                              </div>}

                          {/* Visual Inspection Diagram */}
                          {car.details?.inspect_outer && car.details.inspect_outer.length > 0 && <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 inspection-section-black px-0 py-0">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mx-[15px]">
                                    <Car className="h-5 w-5 text-white mx-0" />
                                  </div>
                                  <div>
                                    <h5 className="text-lg font-bold text-foreground mx-px px-0 py-[5px]">Diagrami i Inspektimit të Automjetit</h5>
                                    <p className="text-muted-foreground text-xs inspection-subtext-black">Gjendja vizuale e pjesëve të jashtme</p>
                                  </div>
                                </div>
                                <CarInspectionDiagram inspectionData={car.details.inspect_outer} className="mt-3" />
                              </div>}

                          {/* Maintenance History */}
                          {car.details?.maintenance_history && car.details.maintenance_history.length > 0 && <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 inspection-section-black">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <h5 className="text-xl font-bold text-foreground">Historia e Mirëmbajtjes</h5>
                                    <p className="text-muted-foreground text-sm">Shërbimet dhe mirëmbajtja e bërë</p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  {car.details.maintenance_history.map((record: any, index: number) => <div key={index} className="p-4 bg-card rounded-lg border border-yellow-500/20 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                            <div>
                                              <span className="text-sm font-semibold text-foreground">
                                                {record.service_type || record.type || "Shërbim i Përgjithshëm"}
                                              </span>
                                              {record.description && <p className="text-xs text-muted-foreground mt-1">
                                                  {record.description}
                                                </p>}
                                            </div>
                                          </div>
                                          {record.date && <span className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded">
                                              {record.date}
                                            </span>}
                                        </div>
                                        {record.mileage && <span className="text-xs text-muted-foreground block mt-2">
                                            Kilometrazh: {record.mileage}
                                          </span>}
                                      </div>)}
                                </div>
                              </div>}
                        </div>
                      </div>}

                    {/* Equipment & Options */}

                    {car.details?.options && <EquipmentOptionsSection options={convertOptionsToNames(car.details.options)} features={car.features} safetyFeatures={car.safety_features} comfortFeatures={car.comfort_features} />}

                    {/* Fallback if no options found */}
                    {!car.details?.options && <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Pajisjet dhe Opsionet
                        </h4>
                        <p className="text-muted-foreground">
                          Nuk ka informacion për pajisjet dhe opsionet e kësaj
                          makine.
                        </p>
                      </div>}

                    {/* Comprehensive Inspection Report */}
                  </div>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact and Quick Actions - HIDDEN ON MOBILE, VISIBLE ON DESKTOP */}
          <div className="hidden lg:block space-y-4">
            <Card className="glass-card border-0 shadow-xl rounded-xl sticky top-6">
              <CardContent className="p-4">
                {/* Price and Primary Actions */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-1">
                    €{Math.round(car.price).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    +350€ deri në Prishtinë
                  </div>
                  
                  <div className="space-y-3">
                    <InspectionRequestForm 
                      trigger={
                        <Button className="w-full h-11 text-sm font-semibold">
                          <FileText className="h-4 w-4 mr-2" />
                          Kërko Inspektim
                        </Button>
                      } 
                      carId={car.id} 
                      carMake={car.make} 
                      carModel={car.model} 
                      carYear={car.year} 
                    />
                    
                    <Button onClick={handleContactWhatsApp} variant="outline" className="w-full h-11 text-sm font-semibold border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Kontakto në WhatsApp
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    Kontakti
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/20">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">+383 49 123 456</span>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/20">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">info@autoauction.com</span>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/20">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Prishtinë, Kosovë</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Veprime të Shpejta</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={handleToggleFavorite} className="h-8 text-xs">
                      <Heart className={`h-3 w-3 mr-1 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                      {isFavorited ? 'Hequr' : 'Ruaj'}
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={handleCopyLot} className="h-8 text-xs">
                      <Copy className="h-3 w-3 mr-1" />
                      Kopjo Lot
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.share?.({
                        title: `${car.year} ${car.make} ${car.model}`,
                        text: `Shiko këtë makinë: €${Math.round(car.price).toLocaleString()}`,
                        url: window.location.href
                      });
                    }} className="h-8 text-xs">
                      <Share2 className="h-3 w-3 mr-1" />
                      Shpërndaj
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => setAutoplayEnabled(!autoplayEnabled)} className="h-8 text-xs">
                      {autoplayEnabled ? <Clock className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                      {autoplayEnabled ? 'Stop' : 'Auto'}
                    </Button>
                  </div>
                </div>

                {/* Lot Information */}
                {car.lot && (
                  <>
                    <Separator className="my-4" />
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Numri i Lotit</div>
                      <Badge variant="outline" className="text-sm font-mono">
                        {car.lot}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Inspection Report Section with Real Data */}
        {car.details && (
          <Card className="glass-card border-0 shadow-xl rounded-xl mt-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Raporti i Inspektimit</h3>
                  <p className="text-muted-foreground">Detaje të plota mbi gjendjen e makinës dhe historinë e saj</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Insurance Information */}
                  {car.insurance && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 inspection-section-black">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h5 className="text-xl font-bold text-foreground inspection-text-black">Informacione të Sigurisë</h5>
                          <p className="text-muted-foreground text-sm inspection-subtext-black">Detaje mbi sigurinë dhe gjendjen ligjore</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {car.insurance.total_loss_date && (
                          <div className="p-4 bg-card rounded-lg border border-blue-500/20 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-foreground">Data e Humbjes së Plotë</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(car.insurance.total_loss_date).toLocaleDateString('sq-AL')}
                            </p>
                          </div>
                        )}

                        {car.details?.insurance?.car_info?.flood_damage && (
                          <>
                            <div className="p-4 bg-card rounded-lg border border-blue-500/20 hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-foreground">Dëmtimet nga Përmbytja</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {processFloodDamageText(car.details.insurance.car_info.flood_damage)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exterior & Body Condition */}
                  {car.damage && (
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 inspection-section-black">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h5 className="text-xl font-bold text-foreground inspection-text-black">Gjendja e Jashtme dhe Karocerisë</h5>
                          <p className="text-muted-foreground text-sm inspection-subtext-black">Vlerësimi i dëmtimeve dhe riparime</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {car.damage.main && (
                          <div className="p-4 bg-card rounded-lg border border-orange-500/20 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-semibold text-foreground">Dëmtimi Kryesor</span>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{car.damage.main}</p>
                          </div>
                        )}
                        {car.damage.second && (
                          <div className="p-4 bg-card rounded-lg border border-orange-500/20 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-semibold text-foreground">Dëmtimi Dytësor</span>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{car.damage.second}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Technical Specifications */}
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 inspection-section-black">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <Cog className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h5 className="text-xl font-bold text-foreground inspection-text-black">Specifikimet Teknike</h5>
                        <p className="text-muted-foreground text-sm inspection-subtext-black">Detaje të motorit dhe performancës</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {car.engine?.name && (
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-green-500/20 hover:shadow-md transition-shadow">
                          <span className="text-sm font-medium text-foreground">Motori:</span>
                          <span className="text-sm text-muted-foreground">{car.engine.name}</span>
                        </div>
                      )}
                      {car.cylinders && (
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-green-500/20 hover:shadow-md transition-shadow">
                          <span className="text-sm font-medium text-foreground">Cilindrat:</span>
                          <span className="text-sm text-muted-foreground">{car.cylinders}</span>
                        </div>
                      )}
                      {car.drive_wheel?.name && (
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-green-500/20 hover:shadow-md transition-shadow">
                          <span className="text-sm font-medium text-foreground">Tërheqje:</span>
                          <span className="text-sm text-muted-foreground">{car.drive_wheel.name}</span>
                        </div>
                      )}
                      {car.body_type?.name && (
                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-green-500/20 hover:shadow-md transition-shadow">
                          <span className="text-sm font-medium text-foreground">Karoceria:</span>
                          <span className="text-sm text-muted-foreground">{car.body_type.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Odometer Information */}
                  {car.odometer && (
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 inspection-section-black">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Gauge className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h5 className="text-xl font-bold text-foreground inspection-text-black">Kilometrazha</h5>
                          <p className="text-muted-foreground text-sm inspection-subtext-black">Informacione mbi distancën e përdorimit</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-card rounded-lg border border-purple-500/20 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Kilometra:</span>
                            <span className="text-lg font-bold text-purple-600">
                              {car.odometer.km?.toLocaleString()} km
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Milje:</span>
                            <span className="text-sm text-muted-foreground">
                              {car.odometer.mi?.toLocaleString()} mi
                            </span>
                          </div>
                        </div>
                        
                        {car.odometer.status?.name && (
                          <div className="p-4 bg-card rounded-lg border border-purple-500/20 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-foreground">Statusi: {car.odometer.status.name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Equipment and Features Section with Real API Data */}
        {(car.features || car.safety_features || car.comfort_features) && (
          <Card className="glass-card border-0 shadow-xl rounded-xl mt-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Pajisjet dhe Opsionet</h3>
                  <p className="text-muted-foreground">Lista e plotë e paisjeve standarde dhe opsionale</p>
                </div>
              </div>

              <EquipmentOptionsSection 
                options={{ 
                  standard: car.features, 
                  choice: [], 
                  tuning: [] 
                }}
                features={car.features}
                safetyFeatures={car.safety_features}
                comfortFeatures={car.comfort_features}
              />
            </CardContent>
          </Card>
        )}

        {/* Vehicle Inspection Diagram - Enhanced */}
        <Card className="glass-card border-0 shadow-xl rounded-xl mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center">
                <Search className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Diagrami i Inspektimit</h3>
                <p className="text-muted-foreground">Vlerësimi vizual i gjendjes së makinës</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-card to-card/50 rounded-xl p-6 border border-border/20">
              <CarInspectionDiagram />
            </div>
          </CardContent>
        </Card>

        {/* Contact Footer - Mobile Visible */}
        <Card className="glass-card border-0 shadow-xl rounded-xl mt-6 lg:hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  €{Math.round(car.price).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  +350€ deri në Prishtinë
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <InspectionRequestForm 
                  trigger={
                    <Button className="w-full h-12 text-base font-semibold">
                      <FileText className="h-5 w-5 mr-2" />
                      Kërko Inspektim
                    </Button>
                  } 
                  carId={car.id} 
                  carMake={car.make} 
                  carModel={car.model} 
                  carYear={car.year} 
                />
                
                <Button onClick={handleContactWhatsApp} variant="outline" className="w-full h-12 text-base font-semibold border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Kontakto në WhatsApp
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleToggleFavorite}>
                  <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                  {isFavorited ? 'Ruajtur' : 'Ruaj'}
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleCopyLot}>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopjo Lot #{car.lot}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Image Zoom Modal */}
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
