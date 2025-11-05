import { useEffect, useState, useCallback, memo, useMemo } from "react";
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
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, Share2, Heart, ChevronLeft, ChevronRight, Expand, Copy, ChevronDown, ChevronUp, DollarSign, Cog, Lightbulb, Camera, Thermometer, Wind, Radar, Tag, Armchair, DoorClosed, Cylinder, CircleDot, PaintBucket, Disc3 } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";
import { useImagePreload } from "@/hooks/useImagePreload";
import { useImageSwipe } from "@/hooks/useImageSwipe";
import { fallbackCars } from "@/data/fallbackData";
import { formatMileage } from "@/utils/mileageFormatter";

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
  "080": "Kontrolli i Temperaturës së Klimatizimit të Prapme",
  "081": "Sistemi i Pastrimit të Dritareve të Prapme të Prapme",
  "082": "Kontrolli i Shpejtësisë të Prapme",
  "083": "Sistemi i Monitorimit të Presionit të Gomas të Prapme",
  "084": "Sistemi i Paralajmërimit të Largimit nga Korsia të Prapme",
  "085": "Kontrolli Adaptiv i Kursimit të Prapme",
  "086": "Sistemi i Paralajmërimit të Kolizionit të Prapme",
  "087": "Frënimi Emergjent Automatik i Prapme",
  "088": "Kontrolli i Bordit Elektronik të Prapme",
  "089": "Sistemi Keyless Entry i Prapme",
  "090": "Sistemi i Alarmshmërisë të Prapme",
  "091": "Imobilizuesi i Motorit të Prapme",
  "092": "Kopja e Çelësave të Prapme",
  "093": "Sistemi i Ngrohjes së Ulëseve të Prapme të Prapme",
  "094": "Ulëset e Lëkurës të Prapme të Prapme",
  "095": "Ulëset e Tekstilit të Prapme të Prapme",
  "096": "Kontrolli Elektrik i Ulëseve të Prapme të Prapme",
  "097": "Dritaret me Tinte të Prapme të Prapme",
  "098": "Sistemi i Alarmshmërisë të Prapme të Prapme",
  "099": "Imobilizuesi i Prapme të Prapme",
  "100": "Kopja e Çelësave të Prapme të Prapme",
  // Extended mapping for higher codes
  "1001": "Pasqyra Anësore me Palosje Elektrike",
  "1002": "Pasqyrë e Brendshme ECM",
  "1003": "Hi Pass",
  "1004": "Timon me Drejtim Elektrik",
  "1005": "Dritare Elektrike",
  "1006": "Çelës Inteligjent",
  "1007": "Navigacion",
  "1008": "Monitor AV i Përparmë",
  "1009": "Terminal USB",
  "1010": "Sedilje Lëkure",
  "1011": "Sedilje të Përparme me Ngrohje",
  "1012": "Bllokim Elektrik i Dyerve",
  "1013": "Airbag për Pasagjerin",
  "1014": "Frena ABS",
  "1015": "Sistemi TCS",
  "1016": "Sistemi ESC",
  "1017": "Sistemi TPMS",
  "1018": "Sensor Parkimi i Pasmë",
  "1019": "Kamera e Pasme",
  "1020": "Bllokim Dyersh pa Tel",
  "1021": "Sistemi i Ngrohjes së Ulëseve",
  "1022": "Kontrolli i Temperaturës së Klimatizimit",
  "1023": "Sistemi i Pastrimit të Dritareve",
  "1024": "Kontrolli i Shpejtësisë",
  "1025": "Sistemi i Monitorimit të Presionit të Gomas",
  "1026": "Sistemi i Paralajmërimit të Largimit nga Korsia",
  "1027": "Kontrolli Adaptiv i Kursimit",
  "1028": "Sistemi i Paralajmërimit të Kolizionit",
  "1029": "Frënimi Emergjent Automatik",
  "1030": "Kontrolli i Bordit Elektronik",
  "1031": "Sistemi Keyless Entry",
  "1032": "Sistemi i Alarmshmërisë",
  "1033": "Imobilizuesi i Motorit",
  "1034": "Kopja e Çelësave",
  "1035": "Sistemi i Ngrohjes së Ulëseve të Prapme",
  "1036": "Ulëset e Lëkurës të Prapme",
  "1037": "Ulëset e Tekstilit të Prapme",
  "1038": "Kontrolli Elektrik i Ulëseve të Prapme",
  "1039": "Dritaret me Tinte të Prapme",
  "1040": "Sistemi i Alarmshmërisë të Prapme",
  "1041": "Imobilizuesi i Prapme",
  "1042": "Kopja e Çelësave të Prapme",
  "1043": "Kontrolli i Temperaturës së Prapme",
  "1044": "Ventilimi Automatik i Prapme",
  "1045": "Sistemi i Pastrimit të Dritareve të Prapme",
  "1046": "Sistemi i Ujit të Xhamit të Prapme",
  "1047": "Defogger i Prapëm i Prapme",
  "1048": "Sistemi i Ndriçimit të Brendshëm të Prapme",
  "1049": "Sistemi i Ngrohjes së Dritareve të Prapme",
  "1050": "Kontrolli i Temperaturës së Klimatizimit të Prapme"
};

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  source_label?: string;
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

  // Comprehensive helper function to get appropriate icon for equipment item
  const getEquipmentIcon = (item: string) => {
    const itemLower = item.toLowerCase();
    
    // Climate control & Air conditioning
    if (itemLower.includes('air conditioning') || itemLower.includes('climate') || itemLower.includes('klima') || 
        itemLower.includes('a/c') || itemLower.includes('hvac')) 
      return <Wind className="h-3 w-3 text-primary" />;
    
    // Heating
    if (itemLower.includes('heated') || itemLower.includes('ngroh') || itemLower.includes('heat'))
      return <Thermometer className="h-3 w-3 text-primary" />;
    
    // Safety - Brakes & ABS
    if (itemLower.includes('brake') || itemLower.includes('frena') || itemLower.includes('abs') || 
        itemLower.includes('ebd') || itemLower.includes('brake assist'))
      return <Shield className="h-3 w-3 text-primary" />;
    
    // Airbags
    if (itemLower.includes('airbag'))
      return <Shield className="h-3 w-3 text-primary" />;
    
    // Lighting - LED, Xenon, Headlights
    if (itemLower.includes('light') || itemLower.includes('dritë') || itemLower.includes('led') || 
        itemLower.includes('xenon') || itemLower.includes('headlight') || itemLower.includes('lamp'))
      return <Lightbulb className="h-3 w-3 text-primary" />;
    
    // Camera systems
    if (itemLower.includes('camera') || itemLower.includes('kamerë') || itemLower.includes('view'))
      return <Camera className="h-3 w-3 text-primary" />;
    
    // Parking sensors & Radar
    if (itemLower.includes('sensor') || itemLower.includes('parking') || itemLower.includes('radar') || 
        itemLower.includes('proximity') || itemLower.includes('park assist'))
      return <Radar className="h-3 w-3 text-primary" />;
    
    // Navigation & GPS
    if (itemLower.includes('navigation') || itemLower.includes('gps') || itemLower.includes('navigacion') ||
        itemLower.includes('maps'))
      return <MapPin className="h-3 w-3 text-primary" />;
    
    // Audio & Entertainment
    if (itemLower.includes('radio') || itemLower.includes('audio') || itemLower.includes('speaker') ||
        itemLower.includes('sound') || itemLower.includes('stereo') || itemLower.includes('cd') ||
        itemLower.includes('bluetooth') || itemLower.includes('usb') || itemLower.includes('aux'))
      return <MessageCircle className="h-3 w-3 text-primary" />;
    
    // Cruise control & Speed control
    if (itemLower.includes('cruise') || itemLower.includes('speed control') || itemLower.includes('kontroll'))
      return <Gauge className="h-3 w-3 text-primary" />;
    
    // Engine & Transmission
    if (itemLower.includes('engine') || itemLower.includes('motor') || itemLower.includes('transmission') ||
        itemLower.includes('gearbox'))
      return <Cog className="h-3 w-3 text-primary" />;
    
    // Seats
    if (itemLower.includes('seat') || itemLower.includes('ulëse'))
      return <Users className="h-3 w-3 text-primary" />;
    
    // Windows
    if (itemLower.includes('window') || itemLower.includes('dritare') || itemLower.includes('glass'))
      return <Eye className="h-3 w-3 text-primary" />;
    
    // Wheels & Tires
    if (itemLower.includes('wheel') || itemLower.includes('alloy') || itemLower.includes('rim') ||
        itemLower.includes('tire') || itemLower.includes('tyre'))
      return <Settings className="h-3 w-3 text-primary" />;
    
    // Keys & Security
    if (itemLower.includes('key') || itemLower.includes('keyless') || itemLower.includes('security') ||
        itemLower.includes('alarm') || itemLower.includes('immobilizer'))
      return <Shield className="h-3 w-3 text-primary" />;
    
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
      
      // Comprehensive icon mapping based on equipment name
      const getIconForEquipment = (name: string) => {
        const itemLower = name.toLowerCase();
        
        // Climate control & Air conditioning
        if (itemLower.includes('air conditioning') || itemLower.includes('climate') || itemLower.includes('klima') || 
            itemLower.includes('a/c') || itemLower.includes('hvac')) 
          return Wind;
        
        // Heating
        if (itemLower.includes('heated') || itemLower.includes('ngroh') || itemLower.includes('heat'))
          return Thermometer;
        
        // Safety - Brakes & ABS
        if (itemLower.includes('brake') || itemLower.includes('frena') || itemLower.includes('abs') || 
            itemLower.includes('ebd') || itemLower.includes('brake assist'))
          return Shield;
        
        // Airbags
        if (itemLower.includes('airbag'))
          return Shield;
        
        // Lighting - LED, Xenon, Headlights
        if (itemLower.includes('light') || itemLower.includes('dritë') || itemLower.includes('led') || 
            itemLower.includes('xenon') || itemLower.includes('headlight') || itemLower.includes('lamp'))
          return Lightbulb;
        
        // Camera systems
        if (itemLower.includes('camera') || itemLower.includes('kamerë') || itemLower.includes('view'))
          return Camera;
        
        // Parking sensors & Radar
        if (itemLower.includes('sensor') || itemLower.includes('parking') || itemLower.includes('radar') || 
            itemLower.includes('proximity') || itemLower.includes('park assist'))
          return Radar;
        
        // Navigation & GPS
        if (itemLower.includes('navigation') || itemLower.includes('gps') || itemLower.includes('navigacion') ||
            itemLower.includes('maps'))
          return MapPin;
        
        // Audio & Entertainment
        if (itemLower.includes('radio') || itemLower.includes('audio') || itemLower.includes('speaker') ||
            itemLower.includes('sound') || itemLower.includes('stereo') || itemLower.includes('cd') ||
            itemLower.includes('bluetooth') || itemLower.includes('usb') || itemLower.includes('aux'))
          return MessageCircle;
        
        // Cruise control & Speed control
        if (itemLower.includes('cruise') || itemLower.includes('speed control') || itemLower.includes('kontroll'))
          return Gauge;
        
        // Engine & Transmission
        if (itemLower.includes('engine') || itemLower.includes('motor') || itemLower.includes('transmission') ||
            itemLower.includes('gearbox'))
          return Cog;
        
        // Seats
        if (itemLower.includes('seat') || itemLower.includes('ulëse'))
          return Users;
        
        // Windows
        if (itemLower.includes('window') || itemLower.includes('dritare') || itemLower.includes('glass'))
          return Eye;
        
        // Wheels & Tires
        if (itemLower.includes('wheel') || itemLower.includes('alloy') || itemLower.includes('rim') ||
            itemLower.includes('tire') || itemLower.includes('tyre'))
          return Settings;
        
        // Keys & Security
        if (itemLower.includes('key') || itemLower.includes('keyless') || itemLower.includes('security') ||
            itemLower.includes('alarm') || itemLower.includes('immobilizer'))
          return Shield;
        
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

        {showOptions && <div className="px-4 pb-4 space-y-6 animate-fade-in-up">
            {/* Standard Equipment */}
            {options.standard && options.standard.length > 0 && <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <h5 className="text-base font-semibold text-foreground">Pajisje Standarde</h5>
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground font-medium">{options.standard.length} pajisje</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {(showAllStandard ? options.standard : options.standard.slice(0, INITIAL_SHOW_COUNT)).map((option, index) => {
                    const itemLower = option.toString().toLowerCase();
                    let OptionIcon = CheckCircle;
                    if (itemLower.includes('klime') || itemLower.includes('clima') || itemLower.includes('ac') || itemLower.includes('air conditioning')) OptionIcon = Wind;
                    else if (itemLower.includes('ngroh') || itemLower.includes('heated')) OptionIcon = Thermometer;
                    else if (itemLower.includes('kamera') || itemLower.includes('camera')) OptionIcon = Camera;
                    else if (itemLower.includes('drita') || itemLower.includes('light')) OptionIcon = Lightbulb;
                    else if (itemLower.includes('sensor') || itemLower.includes('radar') || itemLower.includes('park')) OptionIcon = Radar;
                    else if (itemLower.includes('audio') || itemLower.includes('multimedia')) OptionIcon = Settings;
                    else if (itemLower.includes('leather') || itemLower.includes('lëkur')) OptionIcon = Users;
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/15 hover:border-primary/30 transition-all duration-200 group">
                        <div className="flex-shrink-0">
                          <OptionIcon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{option}</span>
                      </div>
                    );
                  })}
                </div>
                {options.standard.length > INITIAL_SHOW_COUNT && <div className="flex justify-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAllStandard(!showAllStandard)} className="h-9 px-4 text-sm text-primary hover:bg-primary/10 font-medium border-primary/30">
                    {showAllStandard ? `Më pak` : `Shiko të gjitha (${options.standard.length - INITIAL_SHOW_COUNT} më shumë)`}
                  </Button>
                </div>}
              </div>}

            {/* Optional Equipment */}
            {options.choice && options.choice.length > 0 && <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <h5 className="text-base font-semibold text-foreground">Pajisje Opsionale</h5>
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground font-medium">{options.choice.length} opsione</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {(showAllChoice ? options.choice : options.choice.slice(0, INITIAL_SHOW_COUNT)).map((option, index) => {
                    const itemLower = option.toString().toLowerCase();
                    let OptionIcon = CheckCircle;
                    if (itemLower.includes('klime') || itemLower.includes('clima') || itemLower.includes('ac') || itemLower.includes('air conditioning')) OptionIcon = Wind;
                    else if (itemLower.includes('ngroh') || itemLower.includes('heated')) OptionIcon = Thermometer;
                    else if (itemLower.includes('kamera') || itemLower.includes('camera')) OptionIcon = Camera;
                    else if (itemLower.includes('drita') || itemLower.includes('light')) OptionIcon = Lightbulb;
                    else if (itemLower.includes('sensor') || itemLower.includes('radar') || itemLower.includes('park')) OptionIcon = Radar;
                    else if (itemLower.includes('audio') || itemLower.includes('multimedia')) OptionIcon = Settings;
                    else if (itemLower.includes('leather') || itemLower.includes('lëkur')) OptionIcon = Users;
                    return (
                      <div key={index} className="group relative overflow-hidden h-16 sm:h-20">
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20 rounded-lg sm:rounded-xl hover:bg-gradient-to-r hover:from-accent/10 hover:to-accent/15 hover:border-accent/30 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-accent/10 group-hover:-translate-y-0.5">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-accent/25 transition-all duration-300">
                              <OptionIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-accent transition-colors duration-300 leading-tight line-clamp-2">
                              {option}
                            </span>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {options.choice.length > INITIAL_SHOW_COUNT && <div className="flex justify-center pt-3">
                  <Button variant="outline" size="sm" onClick={() => setShowAllChoice(!showAllChoice)} className="h-10 px-6 text-sm font-semibold text-accent hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/100 dark:hover:from-accent/900/20 dark:hover:to-accent/800/20 border-accent/30 dark:border-accent/600/60 hover:border-accent/40/80 dark:hover:border-accent/500/80 transition-all duration-300 hover:shadow-md hover:shadow-accent/10">
                    {showAllChoice ? (
                      <div className="flex items-center gap-2">
                        <span>Më pak</span>
                        <div className="w-1 h-1 rounded-full bg-accent"></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Shiko të gjitha ({options.choice.length - INITIAL_SHOW_COUNT} më shumë)</span>
                        <div className="w-1 h-1 rounded-full bg-accent"></div>
                      </div>
                    )}
                  </Button>
                </div>}
              </div>}

            {/* Tuning Modifications */}
            {options.tuning && options.tuning.length > 0 && <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <h5 className="text-base font-semibold text-foreground">Modifikimet</h5>
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground font-medium">{options.tuning.length} modifikime</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {options.tuning.map((option, index) => {
                    const itemLower = option.toString().toLowerCase();
                    let OptionIcon = Settings;
                    if (itemLower.includes('sport') || itemLower.includes('performance')) OptionIcon = Gauge;
                    else if (itemLower.includes('exhaust') || itemLower.includes('marmit')) OptionIcon = Cog;
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-destructive/5 to-destructive/10 border border-destructive/20 rounded-lg hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/15 hover:border-destructive/30 transition-all duration-200 group">
                        <div className="flex-shrink-0">
                          <OptionIcon className="h-4 w-4 text-destructive" />
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-destructive transition-colors">{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>}

            {/* General Features */}
            {features && features.length > 0 && <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"></div>
                    <h5 className="text-lg font-bold text-foreground bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      Karakteristika të Përgjithshme
                    </h5>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent"></div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        {features.length} karakteristika
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {(showAllFeatures ? features : features.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => (
                    <div key={index} className="group relative overflow-hidden h-16 sm:h-20">
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200/60 dark:border-slate-700/60 rounded-lg sm:rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 hover:border-blue-300/60 dark:hover:border-blue-600/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/10 group-hover:-translate-y-0.5">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-blue-500/25 transition-all duration-300">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300 leading-tight line-clamp-2">
                            {feature}
                          </span>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {features.length > INITIAL_SHOW_COUNT && <div className="flex justify-center pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAllFeatures(!showAllFeatures)} 
                    className="h-10 px-6 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 border-blue-300/60 dark:border-blue-600/60 hover:border-blue-400/80 dark:hover:border-blue-500/80 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/10"
                  >
                    {showAllFeatures ? (
                      <div className="flex items-center gap-2">
                        <span>Më pak</span>
                        <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Shiko të gjitha ({features.length - INITIAL_SHOW_COUNT} më shumë)</span>
                        <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                      </div>
                    )}
                  </Button>
                </div>}
              </div>}

            {/* Safety Features */}
            {safetyFeatures && safetyFeatures.length > 0 && <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-sm"></div>
                    <h5 className="text-lg font-bold text-foreground bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                      Karakteristika të Sigurisë
                    </h5>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent"></div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-full">
                      <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                        {safetyFeatures.length} siguri
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {(showAllSafety ? safetyFeatures : safetyFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => (
                    <div key={index} className="group relative overflow-hidden h-16 sm:h-20">
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200/60 dark:border-red-700/60 rounded-lg sm:rounded-xl hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 hover:border-red-300/60 dark:hover:border-red-600/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-500/10 group-hover:-translate-y-0.5">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-red-500/25 transition-all duration-300">
                            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-200 group-hover:text-red-800 dark:group-hover:text-red-100 transition-colors duration-300 leading-tight line-clamp-2">
                            {feature}
                          </span>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {safetyFeatures.length > INITIAL_SHOW_COUNT && <div className="flex justify-center pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAllSafety(!showAllSafety)} 
                    className="h-10 px-6 text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 border-red-300/60 dark:border-red-600/60 hover:border-red-400/80 dark:hover:border-red-500/80 transition-all duration-300 hover:shadow-md hover:shadow-red-500/10"
                  >
                    {showAllSafety ? (
                      <div className="flex items-center gap-2">
                        <span>Më pak</span>
                        <div className="w-1 h-1 rounded-full bg-red-500"></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Shiko të gjitha ({safetyFeatures.length - INITIAL_SHOW_COUNT} më shumë)</span>
                        <div className="w-1 h-1 rounded-full bg-red-500"></div>
                      </div>
                    )}
                  </Button>
                </div>}
              </div>}

            {/* Comfort Features */}
            {comfortFeatures && comfortFeatures.length > 0 && <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm"></div>
                    <h5 className="text-lg font-bold text-foreground bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      Karakteristika të Rehatisë
                    </h5>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent"></div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-full">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {comfortFeatures.length} rehati
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {(showAllComfort ? comfortFeatures : comfortFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => (
                    <div key={index} className="group relative overflow-hidden h-16 sm:h-20">
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200/60 dark:border-emerald-700/60 rounded-lg sm:rounded-xl hover:bg-gradient-to-br hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/10 group-hover:-translate-y-0.5">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-100 transition-colors duration-300 leading-tight line-clamp-2">
                            {feature}
                          </span>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {comfortFeatures.length > INITIAL_SHOW_COUNT && <div className="flex justify-center pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAllComfort(!showAllComfort)} 
                    className="h-10 px-6 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 border-emerald-300/60 dark:border-emerald-600/60 hover:border-emerald-400/80 dark:hover:border-emerald-500/80 transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/10"
                  >
                    {showAllComfort ? (
                      <div className="flex items-center gap-2">
                        <span>Më pak</span>
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Shiko të gjitha ({comfortFeatures.length - INITIAL_SHOW_COUNT} më shumë)</span>
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                      </div>
                    )}
                  </Button>
                </div>}
              </div>}
          </div>}
      </div>;
});
EquipmentOptionsSection.displayName = "EquipmentOptionsSection";
const CarDetails = memo(() => {
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
  const {
    id: lot
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    goBack,
    restorePageState,
    pageState
  } = useNavigation();
  const {
    convertUSDtoEUR,
    processFloodDamageText,
    exchangeRate
  } = useCurrencyAPI();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [showInspectionReport, setShowInspectionReport] = useState(false);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [showEngineSection, setShowEngineSection] = useState(false);
  const [isPlaceholderImage, setIsPlaceholderImage] = useState(false);

  // Reset placeholder state when image selection changes
  useEffect(() => {
    setIsPlaceholderImage(false);
  }, [selectedImageIndex]);

  // Auto-expand detailed info if car has rich data (only once)
  useEffect(() => {
    if (car && !hasAutoExpanded) {
      const hasRichData = car.details?.options || car.insurance_v2 || car.details?.inspect_outer || car.details?.inspect?.inner || car.details?.insurance;
      if (hasRichData) {
        setShowDetailedInfo(true);
        setHasAutoExpanded(true);
      }
    }
  }, [car, hasAutoExpanded]);
  const API_BASE_URL = "https://auctionsapi.com/api";
  const API_KEY = "d00985c77981fe8d26be16735f932ed1";
  const KBC_DOMAINS = ['kbchachacha', 'kbchacha', 'kb_chachacha', 'kbc', 'kbcchachacha'];
  
  // Convert option numbers to feature names
  const convertOptionsToNames = (options: any): any => {
    if (!options) return {
      standard: [],
      choice: [],
      tuning: []
    };
    const result: any = {
      standard: [],
      choice: [],
      tuning: []
    };

    // Process standard equipment
    if (options.standard && Array.isArray(options.standard)) {
      result.standard = options.standard.map((option: any) => {
        const optionStr = option.toString().trim();
        const mapped = FEATURE_MAPPING[optionStr];
        if (mapped) {
          return mapped;
        } else {
          // If no mapping found, show the raw option as-is (it might be a real name)
          return optionStr;
        }
      });
    }

    // Process optional equipment
    if (options.choice && Array.isArray(options.choice)) {
      result.choice = options.choice.map((option: any) => {
        const optionStr = option.toString().trim();
        const mapped = FEATURE_MAPPING[optionStr];
        if (mapped) {
          return mapped;
        } else {
          // If no mapping found, show the raw option as-is
          return optionStr;
        }
      });
    }

    // Process tuning/modifications
    if (options.tuning && Array.isArray(options.tuning)) {
      result.tuning = options.tuning.map((option: any) => {
        const optionStr = option.toString().trim();
        const mapped = FEATURE_MAPPING[optionStr];
        if (mapped) {
          return mapped;
        } else {
          // If no mapping found, show the raw option as-is
          return optionStr;
        }
      });
    }
    
    return result;
  };

  // Extract features from car data
  const getCarFeatures = (carData: any, lot: any): string[] => {
    const features = [];
    if (carData.transmission?.name) features.push(`Transmisioni: ${carData.transmission.name}`);
    if (carData.fuel?.name) features.push(`Karburanti: ${carData.fuel.name}`);
    if (carData.color?.name) features.push(`Ngjyra: ${carData.color.name}`);
    if (carData.engine?.name) features.push(`Motori: ${carData.engine.name}`);
    if (carData.cylinders) features.push(`${carData.cylinders} Cilindra`);
    if (carData.drive_wheel?.name) features.push(`Tërheqje: ${carData.drive_wheel.name}`);
    if (lot?.keys_available) features.push("Çelësat të Disponueshëm");

    // Add basic features if list is empty
    if (features.length === 0) {
      return ["Klimatizimi", "Dritaret Elektrike", "Mbyllja Qendrore", "Frena ABS"];
    }
    return features;
  };
  const getSafetyFeatures = (carData: any, lot: any): string[] => {
    const safety = [];
    if (lot?.airbags) safety.push(`Sistemi i Airbag-ëve: ${lot.airbags}`);
    if (carData.transmission?.name === "automatic") safety.push("ABS Sistemi i Frënimit");
    safety.push("Sistemi i Stabilitetit Elektronik");
    if (lot?.keys_available) safety.push("Sistemi i Sigurisë");

    // Add default safety features
    return safety.length > 0 ? safety : ["ABS Sistemi i Frënimit", "Airbag Sistemi", "Mbyllja Qendrore"];
  };
  const getComfortFeatures = (carData: any, lot: any): string[] => {
    const comfort = [];
    if (carData.transmission?.name === "automatic") comfort.push("Transmisioni Automatik");
    comfort.push("Klimatizimi");
    comfort.push("Dritaret Elektrike");
    comfort.push("Pasqyrat Elektrike");
    return comfort;
  };

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        if (session?.user) {
          const {
            data: adminCheck
          } = await supabase.rpc("is_admin");
          setIsAdmin(adminCheck || false);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Failed to check admin status:", error);
        }
      }
    };
    checkAdminStatus();
  }, []);
  useEffect(() => {
    let isMounted = true;
    const fetchCarDetails = async () => {
      if (!lot) return;
      try {
        // Use external API directly with API key
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Try to fetch by lot ID first, then by lot number if that fails
        let response;
        try {
          response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
            headers: {
              accept: "*/*",
              "x-api-key": API_KEY
            },
            signal: controller.signal
          });
        } catch (firstAttemptError) {
          // If first attempt fails, try searching by lot number
          // First API attempt failed, trying as lot number
          response = await fetch(`${API_BASE_URL}/search?lot_number=${lot}`, {
            headers: {
              accept: "*/*",
              "x-api-key": API_KEY
            },
            signal: controller.signal
          });
        }
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (!isMounted) return;
        const carData = data.data;
        const lotData = carData.lots?.[0];
        if (!lotData) throw new Error("Missing lot data");
        const basePrice = lotData.buy_now;
        if (!basePrice) {
          // Car doesn't have buy_now pricing, redirecting to catalog
          navigate('/catalog');
          return;
        }
        const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);
        const domainRaw = String(lotData?.domain?.name || carData?.domain_name || carData?.provider || carData?.source_api || '').toLowerCase();
        const isKbc = KBC_DOMAINS.some(k => domainRaw.includes(k));
        const sourceLabel = domainRaw ? (isKbc ? 'KB Chachacha' : 'Encar') : undefined;

        const transformedCar: CarDetails = {
          id: carData.id?.toString() || lotData.lot,
          make: carData.manufacturer?.name || "Unknown",
          model: carData.model?.name || "Unknown",
          year: carData.year || 2020,
          price,
          image: lotData.images?.normal?.[0] || lotData.images?.big?.[0],
          images: lotData.images?.normal || lotData.images?.big || [],
          source_label: sourceLabel,
          vin: carData.vin,
          mileage: lotData.odometer?.km,
          transmission: carData.transmission?.name,
          fuel: carData.fuel?.name,
          color: carData.color?.name,
          condition: lotData.condition?.name?.replace("run_and_drives", "Good Condition"),
          lot: lotData.lot,
          title: carData.title || lotData.title,
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
        trackCarView(lot, transformedCar);
      } catch (apiError) {
        if (import.meta.env.DEV) {
          console.error("Failed to fetch car data:", apiError);
        }
        if (isMounted) {
          // Try to find the car in fallback data as a last resort
          const fallbackCar = fallbackCars.find(car => car.id === lot || car.lot_number === lot);
          if (fallbackCar && fallbackCar.lots?.[0]) {
            // Using fallback car data
            const lotData = fallbackCar.lots[0];
            const basePrice = lotData.buy_now || fallbackCar.price;
            if (!basePrice) {
              // Fallback car doesn't have buy_now pricing, showing error
              throw new Error("Car pricing not available");
            }
            const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);
            const transformedCar: CarDetails = {
              id: fallbackCar.id,
              make: fallbackCar.manufacturer?.name || "Unknown",
              model: fallbackCar.model?.name || "Unknown",
              year: fallbackCar.year || 2020,
              price,
              image: lotData.images?.normal?.[0] || lotData.images?.big?.[0] || "/placeholder.svg",
              images: lotData.images?.normal || lotData.images?.big || [],
              vin: fallbackCar.vin,
              mileage: lotData.odometer?.km,
              transmission: fallbackCar.transmission?.name,
              fuel: fallbackCar.fuel?.name,
              color: fallbackCar.color?.name,
              condition: "Good Condition",
              lot: fallbackCar.lot_number,
              title: fallbackCar.title,
              odometer: lotData.odometer ? {
                km: lotData.odometer.km,
                mi: Math.round(lotData.odometer.km * 0.621371),
                status: {
                  name: "Verified"
                }
              } : undefined,
              features: fallbackCar.features || [],
              safety_features: ["ABS", "Airbags", "Stability Control"],
              comfort_features: ["Air Conditioning", "Power Windows"],
              performance_rating: 4.5,
              popularity_score: 85,
              // Enhanced API data  
              details: lotData && 'details' in lotData ? lotData.details : undefined
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
      }
    };
    fetchCarDetails();
    return () => {
      isMounted = false;
    };
  }, [lot, convertUSDtoEUR]);
  const handleContactWhatsApp = useCallback(() => {
    const currentUrl = window.location.href;
    const message = `Përshëndetje! Jam i interesuar për ${car?.year} ${car?.make} ${car?.model} (€${car?.price.toLocaleString()}) - Kodi #${car?.lot || lot}. A mund të më jepni më shumë informacion? ${currentUrl}`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }, [car, lot]);
  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link-u u kopjua",
      description: "Link-u i makinës u kopjua në clipboard",
      duration: 3000
    });
  }, [toast]);

  // Memoize images array for performance - compute before early returns (limit to 20 for gallery)
  const images = useMemo(() => {
    if (car?.images?.length) {
      return car.images.slice(0, 20); // Limit to 20 images as per API specification
    }
    if (car?.image) {
      return [car.image];
    }
    return [];
  }, [car?.images, car?.image]);

  // Add swipe functionality for car detail photos - must be before early returns
  const {
    currentIndex: swipeCurrentIndex,
    containerRef: imageContainerRef,
    goToNext,
    goToPrevious,
    goToIndex
  } = useImageSwipe({
    images,
    onImageChange: index => setSelectedImageIndex(index)
  });

  // Sync swipe current index with selected image index
  useEffect(() => {
    if (swipeCurrentIndex !== selectedImageIndex) {
      goToIndex(selectedImageIndex);
    }
  }, [selectedImageIndex, swipeCurrentIndex, goToIndex]);
  const carImages = useMemo(() => car?.images || [], [car?.images]);
  const [isLiked, setIsLiked] = useState(false);
  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "U hoq nga të preferuarat" : "U shtua në të preferuarat",
      description: isLiked ? "Makina u hoq nga lista juaj e të preferuarave" : "Makina u shtua në listën tuaj të të preferuarave",
      duration: 3000
    });
  }, [isLiked, toast]);

  // Handler for opening gallery images in a new page
  const handleGalleryClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Track gallery view
    trackPageView(`/car/${lot}/gallery`);
    // Navigate to gallery page with all images
    navigate(`/car/${lot}/gallery`, {
      state: {
        images: images, // Already limited to 20 in images memo
        carMake: car?.make,
        carModel: car?.model,
        carYear: car?.year,
        carLot: car?.lot || lot
      }
    });
  }, [images, navigate, lot, car]);

  // Preload important images
  useImagePreload(car?.image);
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-responsive py-8">
          <div className="space-y-6 animate-fade-in">
            <div className="h-8 bg-muted/50 rounded-lg w-32 animate-pulse"></div>
            <div className="h-64 bg-muted/50 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted/50 rounded-lg w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted/50 rounded-lg w-1/2 animate-pulse"></div>
                <div className="h-32 bg-muted/50 rounded-xl animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-muted/50 rounded-lg w-1/2 animate-pulse"></div>
                <div className="h-24 bg-muted/50 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !car) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        <div className="container-responsive py-8">
          <Button variant="outline" onClick={() => navigate("/")} className="mb-6 hover:scale-105 transition-transform">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kryefaqja
          </Button>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Makina Nuk u Gjet
            </h1>
            <p className="text-muted-foreground">
              Makina që po kërkoni nuk mund të gjindet në bazën tonë të të
              dhënave.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background animate-fade-in">
      <div className="container-responsive py-6 max-w-[1600px]">
        {/* Header with Actions - Modern Layout with animations */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Navigation and Action Buttons with hover effects */}
          <div className="flex flex-wrap items-center gap-2"
            style={{
              animation: 'fadeIn 0.3s ease-out forwards',
              animationDelay: '0.1s',
              opacity: 0
            }}
          >
            <Button variant="outline" onClick={() => {
            // Attempting to go back using saved page state

            // Use the enhanced navigation context which handles state restoration
            if (pageState && pageState.url) {
              // Using saved page state
              // Navigate to the saved URL and restore state
              navigate(pageState.url);
              // Let the target page handle state restoration through restorePageState
            } else {
              // Fallback to the original goBack logic
              // Using goBack fallback
              goBack();
            }
          }} className="flex-1 sm:flex-none hover-scale shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-4 group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="hidden sm:inline font-medium">Kthehu te Makinat</span>
              <span className="sm:hidden font-medium">Kthehu</span>
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="flex-1 sm:flex-none hover-scale shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-4 group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="hidden sm:inline font-medium">Kryefaqja</span>
              <span className="sm:hidden font-medium">Home</span>
            </Button>
            <div className="flex-1"></div>
            <Button variant="outline" size="sm" onClick={handleLike} className="hover-scale shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-4 group">
              <Heart className={`h-4 w-4 mr-2 transition-all duration-300 ${isLiked ? "fill-red-500 text-red-500 scale-110" : "group-hover:scale-110"}`} />
              <span className="hidden sm:inline font-medium">Pëlqej</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="hover-scale shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-4 group">
              <Share2 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline font-medium">Ndaj</span>
            </Button>
          </div>
        </div>

        {/* Main Content - Modern Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8">
          {/* Left Column - Images and Gallery */}
          <div className="space-y-6 animate-fade-in" style={{animationDelay: '100ms'}}>
            {/* Main Image with modern styling - Compact mobile design */}
            <div className="hidden lg:flex lg:gap-4">
              {/* Main Image Card */}
              <Card className="border-0 shadow-2xl overflow-hidden rounded-xl md:rounded-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm flex-1">
                <CardContent className="p-0">
                  <div 
                    ref={imageContainerRef} 
                    className="relative w-full aspect-[4/3] bg-gradient-to-br from-muted/50 via-muted/30 to-background/50 overflow-hidden group cursor-pointer"
                    onClick={(e) => handleGalleryClick(e)} 
                    data-fancybox="gallery"
                  >
                  {/* Main Image with improved loading states */}
                  {images.length > 0 ? (
                    <img 
                      src={images[selectedImageIndex]} 
                      alt={`${car.year} ${car.make} ${car.model} - Image ${selectedImageIndex + 1}`} 
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
                      onError={e => {
                        e.currentTarget.src = "/placeholder.svg";
                        setIsPlaceholderImage(true);
                      }} 
                      onLoad={e => {
                        if (!e.currentTarget.src.includes("/placeholder.svg")) {
                          setIsPlaceholderImage(false);
                        }
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Navigation arrows - Improved positioning and visibility */}
                  {images.length > 1 && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex z-20 hover:scale-110" 
                        onClick={e => {
                          e.stopPropagation();
                          goToPrevious();
                        }}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex z-20 hover:scale-110" 
                        onClick={e => {
                          e.stopPropagation();
                          goToNext();
                        }}
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>
                    </>
                  )}
                  
                  {/* Image counter and gallery button - Improved mobile design */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      {/* Mobile gallery button */}
                      <button
                        onClick={handleGalleryClick}
                        className="gallery-button md:hidden bg-black/80 hover:bg-black/90 text-white px-3 py-2 rounded-lg text-xs font-medium backdrop-blur-sm flex items-center gap-2"
                        aria-label={`View all ${images.length} images`}
                      >
                        <Camera className="h-3 w-3" />
                        {selectedImageIndex + 1}/{images.length}
                      </button>
                      
                      {/* Desktop gallery button */}
                      <button
                        onClick={handleGalleryClick}
                        className="gallery-button hidden md:flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm"
                        aria-label={`View all ${images.length} images`}
                      >
                        <Camera className="h-4 w-4" />
                        View Gallery ({images.length})
                      </button>
                    </div>
                  )}
                  
                  {/* Lot number badge - Improved positioning */}
                  {car.lot && (
                    <Badge className="absolute top-3 left-3 bg-primary/95 backdrop-blur-md text-primary-foreground px-3 py-1.5 text-sm font-semibold shadow-xl rounded-lg">
                      {car.lot}
                    </Badge>
                  )}
                  
                  {/* Zoom icon - Improved positioning and visibility */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                    <Expand className="h-4 w-4 text-white" />
                  </div>
                  
                  {/* Loading indicator */}
                  {isPlaceholderImage && (
                    <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Desktop Thumbnail Gallery - 6 thumbnails on right side */}
            {images.length > 1 && (
              <div className="hidden lg:flex lg:flex-col lg:gap-2 animate-fade-in" style={{animationDelay: '200ms'}}>
                {images.slice(1, 7).map((image, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setSelectedImageIndex(index + 1)}
                    className={`flex-shrink-0 w-16 h-14 xl:w-20 xl:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                      selectedImageIndex === index + 1 
                        ? 'border-primary shadow-lg scale-105' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    aria-label={`View image ${index + 2}`}
                  >
                    <img
                      src={image}
                      alt={`${car.year} ${car.make} ${car.model} - Thumbnail ${index + 2}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </button>
                ))}
                {images.length > 7 && (
                  <button
                    onClick={handleGalleryClick}
                    className="flex-shrink-0 w-16 h-14 xl:w-20 xl:h-16 rounded-lg border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center transition-all duration-200"
                    aria-label="View all images"
                  >
                    <Camera className="h-4 w-4 xl:h-5 xl:w-5 text-primary mb-1" />
                    <span className="text-xs xl:text-sm text-primary font-medium">+{images.length - 7}</span>
                  </button>
                )}
              </div>
            )}
            </div>

            {/* Mobile Main Image - Full width for mobile */}
            <Card className="lg:hidden border-0 shadow-2xl overflow-hidden rounded-xl md:rounded-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div 
                  ref={imageContainerRef} 
                  className="relative w-full aspect-[3/2] sm:aspect-[16/10] bg-gradient-to-br from-muted/50 via-muted/30 to-background/50 overflow-hidden group cursor-pointer"
                  onClick={(e) => handleGalleryClick(e)} 
                  data-fancybox="gallery"
                >
                  {/* Main Image with improved loading states */}
                  {images.length > 0 ? (
                    <img 
                      src={images[selectedImageIndex]} 
                      alt={`${car.year} ${car.make} ${car.model} - Image ${selectedImageIndex + 1}`} 
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
                      onError={e => {
                        e.currentTarget.src = "/placeholder.svg";
                        setIsPlaceholderImage(true);
                      }} 
                      onLoad={e => {
                        if (!e.currentTarget.src.includes("/placeholder.svg")) {
                          setIsPlaceholderImage(false);
                        }
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Navigation arrows - Improved positioning and visibility */}
                  {images.length > 1 && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex z-20 hover:scale-110" 
                        onClick={e => {
                          e.stopPropagation();
                          goToPrevious();
                        }}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 hidden sm:flex z-20 hover:scale-110" 
                        onClick={e => {
                          e.stopPropagation();
                          goToNext();
                        }}
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>
                    </>
                  )}
                  
                  {/* Image counter and gallery button - Improved mobile design */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      {/* Mobile gallery button */}
                      <button
                        onClick={handleGalleryClick}
                        className="gallery-button md:hidden bg-black/80 hover:bg-black/90 text-white px-3 py-2 rounded-lg text-xs font-medium backdrop-blur-sm flex items-center gap-2"
                        aria-label={`View all ${images.length} images`}
                      >
                        <Camera className="h-3 w-3" />
                        {selectedImageIndex + 1}/{images.length}
                      </button>
                      
                      {/* Desktop gallery button */}
                      <button
                        onClick={handleGalleryClick}
                        className="gallery-button hidden md:flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm"
                        aria-label={`View all ${images.length} images`}
                      >
                        <Camera className="h-4 w-4" />
                        View Gallery ({images.length})
                      </button>
                    </div>
                  )}
                  
                  {/* Lot number badge - Improved positioning */}
                  {car.lot && (
                    <Badge className="absolute top-3 left-3 bg-primary/95 backdrop-blur-md text-primary-foreground px-3 py-1.5 text-sm font-semibold shadow-xl rounded-lg">
                      {car.lot}
                    </Badge>
                  )}
                  
                  {/* Zoom icon - Improved positioning and visibility */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                    <Expand className="h-4 w-4 text-white" />
                  </div>
                  
                  {/* Loading indicator */}
                  {isPlaceholderImage && (
                    <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Car Title with Price - Compact mobile design */}
            <div className="animate-fade-in" style={{animationDelay: '200ms'}}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h1 className="text-lg md:text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-tight flex-1 min-w-0">
                  {car.year} {car.make} {car.model}
                </h1>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    €{car.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    +350€ deri në Prishtinë
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Compact Layout */}
              <div className="flex gap-2 mb-2">
                <InspectionRequestForm trigger={<Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-1 h-9 text-xs hover-scale shadow-md">
                      <FileText className="h-3 w-3 mr-1.5" />
                      <span className="hidden sm:inline">Kërko Inspektim</span>
                      <span className="sm:hidden">Inspektim</span>
                    </Button>} carId={car.id} carMake={car.make} carModel={car.model} carYear={car.year} />
                <Button onClick={handleContactWhatsApp} size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white flex-1 h-9 text-xs hover-scale shadow-md">
                  <MessageCircle className="h-3 w-3 mr-1.5" />
                  WhatsApp
                </Button>
              </div>
            </div>


            {/* Vehicle Specifications - Compact Mobile Card */}
            <Card id="specifications" className="border-0 shadow-2xl rounded-xl md:rounded-2xl mobile-specs-card bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden animate-fade-in" style={{animationDelay: '400ms'}}>
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col gap-2 md:gap-4 mb-3 md:mb-6">
                  <h3 className="text-base md:text-xl font-bold flex items-center text-foreground">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg mr-2 md:mr-3">
                      <Settings className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                    </div>
                    Specifikimet Teknike
                  </h3>
                </div>

                {/* Specifications Grid - Reorganized in specific order */}
                <div className="grid grid-cols-2 gap-1.5 md:gap-3 text-xs md:text-sm items-stretch auto-rows-fr isolate relative z-0">
                  {/* 1. Brand - e.g., Volkswagen */}
                  <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Car className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {car.make}
                    </span>
                  </div>

                  {/* 2. Model - e.g., Tiguan */}
                  <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Tag className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {car.model}
                    </span>
                  </div>

                  {/* 3. Year - e.g., 2022 */}
                  <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {car.year}
                    </span>
                  </div>

                  {/* 4. Mileage */}
                  <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Gauge className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {formatMileage(car.mileage)}
                    </span>
                  </div>

                  {/* Cylinders */}
                  {car.cylinders && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Cylinder className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.cylinders}
                      </span>
                    </div>
                  )}

                  {/* Doors */}
                  {car.details?.doors_count && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <DoorClosed className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.details.doors_count}
                      </span>
                    </div>
                  )}

                  {/* Fuel Type */}
                  <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center">
                      <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Fuel className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                      {translateFuel(car.fuel || 'Diesel')}
                    </span>
                  </div>

                  {/* 5. Engine - e.g., 998cc */}
                  {car.details?.engine_volume && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Cog className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.details.engine_volume}cc
                      </span>
                    </div>
                  )}

                  {/* Transmission */}
                  {car.transmission && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Settings className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {translateTransmission(car.transmission)}
                      </span>
                    </div>
                  )}

                  {/* Drivetrain */}
                  {car.drive_wheel?.name && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <CircleDot className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium uppercase text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.drive_wheel.name}
                      </span>
                    </div>
                  )}

                  {/* Seats */}
                  {car.details?.seats_count && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Armchair className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {car.details.seats_count}
                      </span>
                    </div>
                  )}

                  {/* Exterior Color */}
                  {car.color && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <PaintBucket className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {translateColor(car.color)}
                      </span>
                    </div>
                  )}

                  {/* Interior Color */}
                  {car.details?.interior_color && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Armchair className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize text-right leading-tight whitespace-normal break-words min-w-0 text-xs md:text-sm">
                        {translateColor(car.details.interior_color)}
                      </span>
                    </div>
                  )}

                  {/* VIN Number */}
                  {car.vin && (
                    <div className="group grid grid-cols-[auto,1fr] items-center gap-x-2 md:gap-x-3 p-2 md:p-3 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-lg md:rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center">
                        <div className="p-1 md:p-2 bg-primary/10 rounded-md md:rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Car className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 md:gap-2 min-w-0">
                        <span className="text-muted-foreground font-medium font-mono text-xs md:text-sm text-right leading-tight whitespace-normal break-words min-w-0">
                          {car.vin}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Detailed Information Section */}
            <Card className="glass-panel border-0 shadow-2xl rounded-xl mobile-detailed-info-card">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
                  
                  
                </div>

                {showDetailedInfo && <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-top-2 duration-300">
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
                    {showInspectionReport && <div className="space-y-6 p-4 lg:p-6 bg-card rounded-xl border border-border shadow-lg">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <h4 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                            Raporti i Inspektimit
                          </h4>
                          <p className="text-muted-foreground text-sm lg:text-base max-w-xl mx-auto">
                            Analiza e detajuar profesionale e gjendjes së automjetit
                          </p>
                        </div>

                        {/* Tabs Navigation */}
                        <Tabs defaultValue={defaultInspectionTab} className="w-full">
                          <div className="flex justify-center mb-6">
                            <TabsList className="grid w-full max-w-2xl grid-cols-3 gap-2 bg-muted/50 p-1 rounded-lg">
                              {(car.details?.inspect?.inner || car.details?.insurance) && (
                                <TabsTrigger 
                                  value="teknik" 
                                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-4 py-2"
                                >
                                  Raporti i Inspektimit të Plotë
                                </TabsTrigger>
                              )}
                              {(car.details?.insurance || car.damage) && (
                                <TabsTrigger 
                                  value="demtime" 
                                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-4 py-2"
                                >
                                  Vlerësimi i Dëmtimeve dhe Riparimeve
                                </TabsTrigger>
                              )}
                              {car.details?.inspect_outer && car.details.inspect_outer.length > 0 && (
                                <TabsTrigger 
                                  value="vizuale" 
                                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-4 py-2"
                                >
                                  Gjendja Vizuale e Pjesëve të Jashtme
                                </TabsTrigger>
                              )}
                            </TabsList>
                          </div>

                          {/* Tab 1: Raporti i Inspektimit të Plotë */}
                          <TabsContent value="teknik" className="mt-6 space-y-6">
                            {/* Inspection Groups - Compact Modern Cards Layout */}
                          
                            {/* Technical Inspection - Engine & Mechanical */}
                            {car.details?.inspect?.inner && (
                              <div className="p-4 lg:p-6 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-12 h-12 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Cog className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-lg lg:text-xl font-bold text-foreground">Kontrolli Teknik</h5>
                                    <p className="text-muted-foreground text-sm">Motori dhe Sistemi Mekanik - Kontrolli teknik i komponentëve kryesorë</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(car.details.inspect.inner).map(([key, value], index) => {
                                    const isGood = value === "goodness" || value === "proper" || value === "doesn't exist" || 
                                                  value === "good" || value === "ok" || value === "okay" || value === "normal" || 
                                                  value === "excellent" || value === "perfect" || value === "fine";
                                    const displayValue = value === "goodness" ? "Mirë" : 
                                                       value === "proper" ? "Saktë" : 
                                                       value === "doesn't exist" ? "Nuk ekziston" : 
                                                       value === "good" ? "Mirë" : 
                                                       value === "ok" ? "Mirë" : 
                                                       value === "okay" ? "Mirë" : 
                                                       value === "normal" ? "Normal" : 
                                                       value === "excellent" ? "Shkëlqyeshëm" : 
                                                       value === "perfect" ? "Perfekt" : 
                                                       value === "fine" ? "Mirë" : value;
                                    return (
                                      <div key={index} className={`p-3 bg-card rounded-lg border transition-all ${
                                        isGood 
                                          ? 'border-green-500/30 dark:border-green-500/20 bg-green-50/50 dark:bg-green-950/20 hover:shadow-md' 
                                          : 'border-red-500/30 dark:border-red-500/20 bg-red-50/50 dark:bg-red-950/20 hover:shadow-md'
                                      }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isGood ? 'bg-green-500' : 'bg-red-500'}`} />
                                          <span className="text-xs font-semibold text-foreground capitalize truncate">
                                            {key.replace(/_/g, ' ')}
                                          </span>
                                        </div>
                                        <p className={`text-xs font-medium ${isGood ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                          {String(displayValue)}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Insurance & Safety History */}
                            {car.details?.insurance && (
                              <div className="p-4 lg:p-6 bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-12 h-12 bg-green-600 dark:bg-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Shield className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-lg lg:text-xl font-bold text-foreground">Historia e Sigurisë dhe Sigurimit</h5>
                                    <p className="text-muted-foreground text-sm">Të dhënat e sigurimit dhe aksidenteve</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {car.details.insurance.car_info && (
                                    <>
                                      <div className="p-4 bg-card rounded-lg border border-green-500/20 dark:border-green-500/10 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          <span className="text-sm font-semibold text-foreground">
                                            Historia e Aksidenteve
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {car.details.insurance.car_info.accident_history}
                                        </p>
                                      </div>
                                      <div className="p-4 bg-card rounded-lg border border-green-500/20 dark:border-green-500/10 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          <span className="text-sm font-semibold text-foreground">
                                            Numri i Riparimeve
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {car.details.insurance.car_info.repair_count}
                                        </p>
                                      </div>
                                      <div className="p-4 bg-card rounded-lg border border-green-500/20 dark:border-green-500/10 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                          <AlertTriangle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          <span className="text-sm font-semibold text-foreground">
                                            Humbje Totale
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {car.details.insurance.car_info.total_loss}
                                        </p>
                                      </div>
                                      <div className="p-4 bg-card rounded-lg border border-green-500/20 dark:border-green-500/10 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          <span className="text-sm font-semibold text-foreground">
                                            Dëmtimet nga Uji
                                          </span>
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
                          </TabsContent>

                          {/* Tab 2: Vlerësimi i Dëmtimeve dhe Riparimeve */}
                          <TabsContent value="demtime" className="mt-6 space-y-6">
                            {/* Exterior & Body Condition - Damage Assessment */}
                            {car.damage && <div className="p-4 lg:p-6 bg-gradient-to-br from-orange-50/50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-orange-600 dark:bg-orange-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-lg lg:text-xl font-bold text-foreground">Gjendja e Jashtme dhe Karocerisë</h5>
                                  <p className="text-muted-foreground text-sm">Vlerësimi i dëmtimeve dhe riparimeve</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {car.damage.main && (
                                  <div className="p-4 bg-card rounded-lg border border-orange-500/20 dark:border-orange-500/10 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                      <span className="text-sm font-semibold text-foreground">
                                        Dëmtimi Kryesor
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {car.damage.main}
                                    </p>
                                  </div>
                                )}
                                {car.damage.second && (
                                  <div className="p-4 bg-card rounded-lg border border-orange-500/20 dark:border-orange-500/10 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                      <span className="text-sm font-semibold text-foreground">
                                        Dëmtimi Dytësor
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {car.damage.second}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>}

                            {/* Insurance Repairs Information */}
                            {car.details?.insurance?.car_info && (
                              <div className="p-4 lg:p-6 bg-gradient-to-br from-amber-50/50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-12 h-12 bg-amber-600 dark:bg-amber-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Settings className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-lg lg:text-xl font-bold text-foreground">Informacion mbi Riparimet</h5>
                                    <p className="text-muted-foreground text-sm">Detajet e riparimeve të bëra</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div className="p-4 bg-card rounded-lg border border-amber-500/20 dark:border-amber-500/10 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                      <span className="text-sm font-semibold text-foreground">
                                        Numri i Riparimeve
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {car.details.insurance.car_info.repair_count}
                                    </p>
                                  </div>
                                  {car.details.insurance.car_info.total_loss && (
                                    <div className="p-4 bg-card rounded-lg border border-amber-500/20 dark:border-amber-500/10 hover:shadow-md transition-shadow">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <span className="text-sm font-semibold text-foreground">
                                          Humbje Totale
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {car.details.insurance.car_info.total_loss}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </TabsContent>

                          {/* Tab 3: Gjendja Vizuale e Pjesëve të Jashtme */}
                          <TabsContent value="vizuale" className="mt-6">
                            {car.details?.inspect_outer && car.details.inspect_outer.length > 0 && (
                              <div className="p-4 lg:p-6 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-950/20 dark:to-gray-900/20 rounded-xl border border-gray-200/50 dark:border-gray-800/50">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-12 h-12 bg-gray-600 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Car className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-lg lg:text-xl font-bold text-foreground">Diagrami i Inspektimit të Automjetit</h5>
                                    <p className="text-muted-foreground text-sm">Gjendja vizuale e pjesëve të jashtme</p>
                                  </div>
                                </div>
                                <CarInspectionDiagram inspectionData={car.details.inspect_outer} className="mt-4" />
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>

                        {/* Owner History - Below Tabs */}
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

          {/* Right Column - Enhanced Contact Card */}
          <div className="space-y-4">
            {/* Enhanced Contact & Inspection Card */}
            <Card className="glass-panel border-0 shadow-2xl lg:sticky top-20 lg:top-4 right-4 lg:right-auto rounded-xl z-50 lg:z-auto w-[calc(100%-2rem)] lg:w-auto max-w-sm lg:max-w-none">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold mb-4 text-center text-foreground">
                  Kontakt & Inspektim
                </h3>

                {/* Enhanced Contact Buttons */}
                <div className="space-y-3 mb-4">
                  <Button onClick={handleContactWhatsApp} className="w-full h-10 text-sm font-medium shadow-md hover:shadow-lg transition-shadow bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>

                  <Button variant="outline" className="w-full h-10 text-sm font-medium border hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => window.open("tel:+38348181116", "_self")}>
                    <Phone className="h-4 w-4 mr-2" />
                    +383 48 181 116
                  </Button>

                  <Button variant="outline" className="w-full h-10 text-sm font-medium border hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => window.open("mailto:info@korauto.com", "_self")}>
                    <Mail className="h-4 w-4 mr-2" />
                    info@korauto.com
                  </Button>
                </div>

                {/* Enhanced Inspection Request Button */}
                <div className="border-t border-border pt-4">
                  <InspectionRequestForm trigger={<Button className="w-full h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                        <FileText className="h-4 w-4 mr-2" />
                        Kërko Inspektim
                      </Button>} carId={car.id} carMake={car.make} carModel={car.model} carYear={car.year} />
                </div>

                {/* Enhanced Location */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <a href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors cursor-pointer leading-relaxed">
                      Rr. Ilaz Kodra 70, Prishtinë, Kosovo
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Zoom Modal - Removed, now using gallery page for all image viewing */}
      </div>
    </div>
  );
});

export default CarDetails;