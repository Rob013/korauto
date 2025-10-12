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
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, Share2, Heart, ChevronLeft, ChevronRight, Expand, Copy, ChevronDown, ChevronUp, DollarSign, Cog, Lightbulb, Camera, Thermometer, Wind, Radar, Tag } from "lucide-react";
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

        {showOptions && <div className="px-4 pb-4 space-y-4 animate-fade-in-up">
            {/* Standard Equipment */}
            {options.standard && options.standard.length > 0 && <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <h5 className="text-sm font-medium text-foreground">Pajisje Standarde</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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
                      <Badge key={index} variant="secondary" className="flex items-center gap-1.5 justify-center py-1.5 px-3 text-xs font-medium bg-primary/10 text-primary border-0 hover:bg-primary/20 transition-colors">
                        <OptionIcon className="h-3.5 w-3.5" />
                        <span>{option}</span>
                      </Badge>
                    );
                  })}
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
                      <Badge key={index} variant="outline" className="flex items-center gap-1.5 justify-center py-1.5 px-3 text-xs font-medium bg-accent/10 text-accent-foreground border-accent/30 hover:bg-accent/20 transition-colors">
                        <OptionIcon className="h-3.5 w-3.5" />
                        <span>{option}</span>
                      </Badge>
                    );
                  })}
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
                  {options.tuning.map((option, index) => {
                    const itemLower = option.toString().toLowerCase();
                    let OptionIcon = Settings;
                    if (itemLower.includes('sport') || itemLower.includes('performance')) OptionIcon = Gauge;
                    else if (itemLower.includes('exhaust') || itemLower.includes('marmit')) OptionIcon = Cog;
                    return (
                      <Badge key={index} variant="destructive" className="flex items-center gap-1.5 justify-center py-1.5 px-3 text-xs font-medium bg-destructive/10 text-destructive border-0 hover:bg-destructive/20 transition-colors">
                        <OptionIcon className="h-3.5 w-3.5" />
                        <span>{option}</span>
                      </Badge>
                    );
                  })}
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
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <h5 className="text-sm font-medium text-foreground">Karakteristika të Sigurisë</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(showAllSafety ? safetyFeatures : safetyFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => <Badge key={index} variant="outline" className="justify-center py-1.5 px-3 text-xs font-medium bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20 transition-colors">
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
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <h5 className="text-sm font-medium text-foreground">Karakteristika të Rehatisë</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(showAllComfort ? comfortFeatures : comfortFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => <Badge key={index} variant="secondary" className="justify-center py-1.5 px-3 text-xs font-medium bg-secondary/10 text-secondary-foreground border-0 hover:bg-secondary/20 transition-colors">
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
  const [showVin, setShowVin] = useState(false);

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

  // Convert option numbers to feature names
  const convertOptionsToNames = (options: any): any => {
    console.log("🔧 Converting options:", options);
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
        const mapped = FEATURE_MAPPING[optionStr] || `Pajisje ${optionStr}`;
        console.log(`📝 Mapping: ${optionStr} → ${mapped}`);
        return mapped;
      });
    }

    // Process optional equipment
    if (options.choice && Array.isArray(options.choice)) {
      result.choice = options.choice.map((option: any) => {
        const optionStr = option.toString().trim();
        const mapped = FEATURE_MAPPING[optionStr] || `Opsion ${optionStr}`;
        return mapped;
      });
    }

    // Process tuning/modifications
    if (options.tuning && Array.isArray(options.tuning)) {
      result.tuning = options.tuning.map((option: any) => {
        const optionStr = option.toString().trim();
        const mapped = FEATURE_MAPPING[optionStr] || `Modifikim ${optionStr}`;
        return mapped;
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
        console.error("Failed to check admin status:", error);
      }
    };
    checkAdminStatus();
  }, []);
  useEffect(() => {
    let isMounted = true;
    const fetchCarDetails = async () => {
      if (!lot) return;
      try {
        // Try to fetch from cache using OR condition for all possible matches
        console.log("Searching for car with lot:", lot);
        const {
          data: cachedCar,
          error: cacheError
        } = await supabase.from("cars_cache").select("*").or(`id.eq.${lot},api_id.eq.${lot},lot_number.eq.${lot}`).maybeSingle();
        console.log("Cache query result:", {
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

        // If not found in cache, try Supabase edge function with lot number search
        try {
          const secureResponse = await fetch(`https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/secure-cars-api`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8`
            },
            body: JSON.stringify({
              endpoint: "search-lot",
              lotNumber: lot
            })
          });
          if (secureResponse.ok) {
            const carData = await secureResponse.json();
            if (carData && carData.lots && carData.lots[0] && isMounted) {
              const lotData = carData.lots[0];
              const basePrice = lotData.buy_now;
              if (!basePrice) {
                console.log("Car doesn't have buy_now pricing, redirecting to catalog");
                navigate('/catalog');
                return;
              }
              const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);
              const transformedCar: CarDetails = {
                id: carData.id?.toString() || lotData.lot,
                make: carData.manufacturer?.name || "Unknown",
                model: carData.model?.name || "Unknown",
                year: carData.year || 2020,
                price,
                image: lotData.images?.normal?.[0] || lotData.images?.big?.[0],
                images: lotData.images?.normal || lotData.images?.big || [],
                vin: carData.vin,
                mileage: lotData.odometer?.km,
                transmission: carData.transmission?.name,
                fuel: carData.fuel?.name,
                color: carData.color?.name,
                condition: lotData.condition?.name?.replace("run_and_drives", "Good Condition"),
                lot: lotData.lot,
                title: lotData.title || carData.title,
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
                insurance: lotData.insurance,
                insurance_v2: lotData.insurance_v2,
                location: lotData.location,
                inspect: lotData.inspect,
                details: lotData.details
              };
              setCar(transformedCar);
              setLoading(false);
              trackCarView(carData.id || lot, transformedCar);
              return;
            }
          } else {
            // Handle specific error cases from edge function
            const errorData = await secureResponse.json().catch(() => ({}));
            if (secureResponse.status === 404 || errorData.error?.includes("404")) {
              setError(`Car with ID ${lot} is not available in our database. This car may have been sold or removed from the auction.`);
              setLoading(false);
              return;
            }
          }
        } catch (edgeFunctionError) {
          console.log("Edge function failed:", edgeFunctionError);
        }

        // If edge function fails, try external API with both lot ID and as lot number
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
          console.log("First API attempt failed, trying as lot number...");
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
          console.log("Car doesn't have buy_now pricing, redirecting to catalog");
          navigate('/catalog');
          return;
        }
        const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);
        const transformedCar: CarDetails = {
          id: carData.id?.toString() || lotData.lot,
          make: carData.manufacturer?.name || "Unknown",
          model: carData.model?.name || "Unknown",
          year: carData.year || 2020,
          price,
          image: lotData.images?.normal?.[0] || lotData.images?.big?.[0],
          images: lotData.images?.normal || lotData.images?.big || [],
          vin: carData.vin,
          mileage: lotData.odometer?.km,
          transmission: carData.transmission?.name,
          fuel: carData.fuel?.name,
          color: carData.color?.name,
          condition: lotData.condition?.name?.replace("run_and_drives", "Good Condition"),
          lot: lotData.lot,
          title: lotData.title || carData.title,
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
        console.error("Failed to fetch car data:", apiError);
        if (isMounted) {
          // Try to find the car in fallback data as a last resort
          const fallbackCar = fallbackCars.find(car => car.id === lot || car.lot_number === lot);
          if (fallbackCar && fallbackCar.lots?.[0]) {
            console.log("Using fallback car data for:", lot);
            const lotData = fallbackCar.lots[0];
            const basePrice = lotData.buy_now || fallbackCar.price;
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
    return <div className="min-h-screen bg-background">
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
      </div>;
  }
  if (error || !car) {
    return <div className="min-h-screen bg-background animate-fade-in">
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
      </div>;
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
            console.log("🔙 Attempting to go back...");
            console.log("Page state from context:", pageState);

            // Use the enhanced navigation context which handles state restoration
            if (pageState && pageState.url) {
              console.log("🔙 Using saved page state:", pageState.url);
              // Navigate to the saved URL and restore state
              navigate(pageState.url);
              // Let the target page handle state restoration through restorePageState
            } else {
              // Fallback to the original goBack logic
              console.log("🔙 Using goBack fallback");
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
            {/* Main Image with modern styling - Improved responsive design */}
            <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div 
                  ref={imageContainerRef} 
                  className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] bg-gradient-to-br from-muted/50 via-muted/30 to-background/50 overflow-hidden group cursor-pointer" 
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
                      Lot #{car.lot}
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

            {/* Car Title - Modern Style - Same on all devices */}
            <div className="animate-fade-in" style={{animationDelay: '200ms'}}>
              <h1 className="text-2xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {car.year} {car.make} {car.model} {car.title && car.title !== `${car.year} ${car.make} ${car.model}` && ` ${car.title}`}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{car.year}/ model {car.year}</span>
                <span className="text-primary">•</span>
                <span className="font-medium">{formatMileage(car.mileage)}</span>
                <span className="text-primary">•</span>
                <span className="font-medium">{car.fuel || 'Diesel'}</span>
                <a href="#specifications" className="ml-auto text-primary hover:underline font-medium hover-scale inline-block">Detajet →</a>
              </div>
            </div>

            {/* Image Thumbnails - Improved responsive grid */}
            {images.length > 1 && (
              <div className="hidden md:block animate-fade-in" style={{animationDelay: '300ms'}}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground">Gallery</h3>
                  <span className="text-sm text-muted-foreground">{images.length} images</span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-16 gap-2">
                  {images.slice(0, 24).map((image, index) => (
                    <button 
                      key={index} 
                      onClick={() => setSelectedImageIndex(index)} 
                      aria-label={`View image ${index + 1} of ${images.length}`}
                      className={`relative aspect-square bg-muted rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        selectedImageIndex === index 
                          ? "border-primary shadow-lg ring-2 ring-primary/50 scale-105" 
                          : "border-border hover:border-primary/70 hover:shadow-md"
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`Thumbnail ${index + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-300" 
                        onError={e => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                        loading="lazy"
                      />
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle Specifications - Modern Card */}
            <Card id="specifications" className="border-0 shadow-2xl rounded-2xl mobile-specs-card bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden animate-fade-in" style={{animationDelay: '400ms'}}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center text-foreground">
                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                      <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    Specifikimet Teknike
                  </h3>

                  {/* Price and Actions - Modern Layout */}
                  <div className="flex flex-col gap-4 sm:gap-4 p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-center sm:text-left">
                        <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          €{car.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium mt-1">
                          +350€ deri në Prishtinë
                        </div>
                      </div>
                      <div className="flex gap-2 flex-col sm:flex-row">
                        <InspectionRequestForm trigger={<Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto h-10 text-sm hover-scale shadow-md">
                              <FileText className="h-4 w-4 mr-2" />
                              Kërko Inspektim
                            </Button>} carId={car.id} carMake={car.make} carModel={car.model} carYear={car.year} />
                        <Button onClick={handleContactWhatsApp} size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white w-full sm:w-auto h-10 text-sm hover-scale shadow-md">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specifications Grid - Modern Cards - 2 Columns Compact */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-sm items-stretch auto-rows-fr isolate relative z-0">
                  {/* Basic Info */}
                  <div className="group grid grid-cols-[auto,1fr] items-start gap-x-3 sm:gap-x-4 p-3 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                        <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      </div>
                    </div>
                    <span className="text-muted-foreground font-medium text-left sm:text-right leading-tight whitespace-normal break-words min-w-0">
                      {car.make} {car.model}
                    </span>
                   </div>
                   
                   {car.details?.badge && <div className="group grid grid-cols-[auto,1fr] items-start gap-x-3 sm:gap-x-4 p-3 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                     <div className="flex items-center gap-2 sm:gap-3">
                       <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                          <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        </div>
                      </div>
                     <span className="text-muted-foreground font-medium text-left sm:text-right leading-tight whitespace-normal break-words min-w-0">
                       {car.details.badge}
                     </span>
                   </div>}
                   
                   {car.details?.seats_count && <div className="group grid grid-cols-[auto,1fr] items-start gap-x-3 sm:gap-x-4 p-3 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                     <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                           <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        </div>
                      </div>
                     <span className="text-muted-foreground font-medium text-left sm:text-right leading-tight whitespace-normal break-words min-w-0">
                       {car.details.seats_count} vende
                     </span>
                   </div>}
                   
                   {car.transmission && <div className="group grid grid-cols-[auto,1fr] items-start gap-x-3 sm:gap-x-4 p-3 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                     <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                           <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        </div>
                      </div>
                     <span className="text-muted-foreground font-medium capitalize text-left sm:text-right leading-tight whitespace-normal break-words min-w-0">
                        {translateTransmission(car.transmission)}
                      </span>
                    </div>}

                  {car.details?.engine_volume && <div className="group grid grid-cols-[auto,1fr] items-start gap-x-3 sm:gap-x-4 p-3 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                           <Cog className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium text-left sm:text-right leading-tight whitespace-normal break-words min-w-0">
                        {car.details.engine_volume}cc
                      </span>
                    </div>}

                  {car.fuel && <div className="group grid grid-cols-[auto,1fr] items-start gap-x-3 sm:gap-x-4 p-3 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                           <Fuel className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize text-left sm:text-right leading-tight whitespace-normal break-words min-w-0">
                        {car.fuel}
                      </span>
                    </div>}

                  {car.color && <div className="group grid grid-cols-[auto,1fr] items-start gap-x-3 sm:gap-x-4 p-3 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                           <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize text-left sm:text-right leading-tight whitespace-normal break-words min-w-0">
                        {translateColor(car.color)}
                      </span>
                    </div>}

                  {car.vin && <div className="group grid grid-cols-[auto,1fr] items-start gap-x-3 sm:gap-x-4 p-3 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border rounded-xl hover:shadow-lg hover:border-primary/50 transition-all duration-300 mobile-spec-item h-full overflow-hidden relative z-0 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300 shrink-0">
                           <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 min-w-0">
                        {!showVin && <Button size="sm" variant="outline" className="h-8 px-2 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => setShowVin(true)}>
                          Shfaq VIN
                        </Button>}
                        {showVin && <span className="text-muted-foreground font-medium font-mono text-sm text-left sm:text-right leading-tight whitespace-normal break-words min-w-0">
                          {car.vin}
                        </span>}
                      </div>
                    </div>}
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