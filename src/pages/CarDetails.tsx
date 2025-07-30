import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { trackPageView, trackCarView, trackFavorite } from "@/utils/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, Share2, Heart, ChevronRight, Expand, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import { supabase } from "@/integrations/supabase/client";

import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";
import { useImagePreload } from "@/hooks/useImagePreload";

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  vin?: string;
  mileage?: string;
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

const EquipmentOptionsSection = memo(({ options, features, safetyFeatures, comfortFeatures }: EquipmentOptionsProps) => {
  const [showAllStandard, setShowAllStandard] = useState(false);
  const [showAllChoice, setShowAllChoice] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showAllSafety, setShowAllSafety] = useState(false);
  const [showAllComfort, setShowAllComfort] = useState(false);

  const INITIAL_SHOW_COUNT = 5;

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Pajisjet dhe Opsionet
      </h4>
      
      {/* Standard Equipment */}
      {options.standard && options.standard.length > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-foreground">Pajisje Standarde:</h5>
          <div className="flex flex-wrap gap-2">
            {(showAllStandard ? options.standard : options.standard.slice(0, INITIAL_SHOW_COUNT)).map((option, index) => (
              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">{option}</Badge>
            ))}
            {options.standard.length > INITIAL_SHOW_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllStandard(!showAllStandard)}
                className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
              >
                {showAllStandard 
                  ? `- Trego Më Pak` 
                  : `+ ${options.standard.length - INITIAL_SHOW_COUNT} Më Shumë`
                }
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Optional Equipment */}
      {options.choice && options.choice.length > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-foreground">Pajisje Opsionale:</h5>
          <div className="flex flex-wrap gap-2">
            {(showAllChoice ? options.choice : options.choice.slice(0, INITIAL_SHOW_COUNT)).map((option, index) => (
              <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">{option}</Badge>
            ))}
            {options.choice.length > INITIAL_SHOW_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllChoice(!showAllChoice)}
                className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
              >
                {showAllChoice 
                  ? `- Trego Më Pak` 
                  : `+ ${options.choice.length - INITIAL_SHOW_COUNT} Më Shumë`
                }
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tuning Modifications */}
      {options.tuning && options.tuning.length > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-foreground">Modifikimet:</h5>
          <div className="flex flex-wrap gap-2">
            {options.tuning.map((option, index) => (
              <Badge key={index} variant="destructive" className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">{option}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* General Features */}
      {features && features.length > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-foreground">Karakteristika të Përgjithshme:</h5>
          <div className="flex flex-wrap gap-2">
            {(showAllFeatures ? features : features.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => (
              <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">{feature}</Badge>
            ))}
            {features.length > INITIAL_SHOW_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
              >
                {showAllFeatures 
                  ? `- Trego Më Pak` 
                  : `+ ${features.length - INITIAL_SHOW_COUNT} Më Shumë`
                }
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Safety Features */}
      {safetyFeatures && safetyFeatures.length > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-foreground">Karakteristika të Sigurisë:</h5>
          <div className="flex flex-wrap gap-2">
            {(showAllSafety ? safetyFeatures : safetyFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => (
              <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">{feature}</Badge>
            ))}
            {safetyFeatures.length > INITIAL_SHOW_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSafety(!showAllSafety)}
                className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
              >
                {showAllSafety 
                  ? `- Trego Më Pak` 
                  : `+ ${safetyFeatures.length - INITIAL_SHOW_COUNT} Më Shumë`
                }
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Comfort Features */}
      {comfortFeatures && comfortFeatures.length > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-foreground">Karakteristika të Rehatisë:</h5>
          <div className="flex flex-wrap gap-2">
            {(showAllComfort ? comfortFeatures : comfortFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => (
              <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">{feature}</Badge>
            ))}
            {comfortFeatures.length > INITIAL_SHOW_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllComfort(!showAllComfort)}
                className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
              >
                {showAllComfort 
                  ? `- Trego Më Pak` 
                  : `+ ${comfortFeatures.length - INITIAL_SHOW_COUNT} Më Shumë`
                }
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

EquipmentOptionsSection.displayName = 'EquipmentOptionsSection';

const CarDetails = memo(() => {
  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { goBack, previousPage, filterState } = useNavigation();
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  
  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

  // Enhanced Feature mapping for equipment/options - supporting both string and numeric formats
  const FEATURE_MAPPING: { [key: string]: string } = {
    // String format (with leading zeros)
    '001': 'Klimatizimi',
    '002': 'Dritaret Elektrike',
    '003': 'Mbyllja Qendrore',
    '004': 'Frena ABS',
    '005': 'Airbag Sistemi',
    '006': 'Radio/Sistemi Audio',
    '007': 'CD Player',
    '008': 'Bluetooth',
    '009': 'Navigacioni GPS',
    '010': 'Kamera e Prapme',
    '011': 'Sensorët e Parkimit',
    '012': 'Kontrolli i Kursimit',
    '013': 'Sistemi Start/Stop',
    '014': 'Dritat LED',
    '015': 'Dritat Xenon',
    '016': 'Pasqyrat Elektrike',
    '017': 'Pasqyrat e Ngrohura',
    '018': 'Kontrolli Elektronik i Stabilitetit',
    '019': 'Sistemi Kundër Bllokimit',
    '020': 'Kontrolli i Traksionit',
    '021': 'Distribimi Elektronik i Forcës së Frënimit',
    '022': 'Sistemi i Monitorimit të Presionit të Gomas',
    '023': 'Sistemi i Paralajmërimit të Largimit nga Korsia',
    '024': 'Kontrolli Adaptiv i Kursimit',
    '025': 'Sistemi i Paralajmërimit të Kolizionit',
    '026': 'Frënimi Emergjent Automatik',
    '027': 'Kontrolli i Bordit Elektronik',
    '028': 'Sistemi Keyless',
    '029': 'Filteri i Grimcave',
    '030': 'Sistemi i Kontrollit të Stabilitetit',
    '031': 'Rrota e Rezervës',
    '032': 'Kompleti i Riparimit të Gomas',
    '033': 'Kapaku i Motorit',
    '034': 'Spoiler i Prapëm',
    '035': 'Rrota Alumini',
    '036': 'Rrota Çeliku',
    '037': 'Sistemi i Ngrohjes së Ulëseve',
    '038': 'Ulëset e Lëkurës',
    '039': 'Ulëset e Tekstilit',
    '040': 'Kontrolli Elektrik i Ulëseve',
    '041': 'Dritaret me Tinte',
    '042': 'Sistemi i Alarmshmërisë',
    '043': 'Imobilizuesi',
    '044': 'Kopja e Çelësave',
    '045': 'Kontrolli i Temperaturës',
    '046': 'Ventilimi Automatik',
    '047': 'Sistemi i Pastrimit të Dritareve',
    '048': 'Sistemi i Ujit të Xhamit',
    '049': 'Defogger i Prapëm',
    '050': 'Sistemi i Ndriçimit të Brendshëm',
    // Numeric format fallback
    '1': 'Klimatizimi',
    '2': 'Dritaret Elektrike',
    '3': 'Mbyllja Qendrore',
    '4': 'Frena ABS',
    '5': 'Airbag Sistemi',
    '6': 'Radio/Sistemi Audio',
    '7': 'CD Player',
    '8': 'Bluetooth',
    '9': 'Navigacioni GPS',
    '10': 'Kamera e Prapme',
    '11': 'Sensorët e Parkimit',
    '12': 'Kontrolli i Kursimit',
    '13': 'Sistemi Start/Stop',
    '14': 'Dritat LED',
    '15': 'Dritat Xenon',
    '16': 'Pasqyrat Elektrike',
    '17': 'Pasqyrat e Ngrohura',
    '18': 'Kontrolli Elektronik i Stabilitetit',
    '19': 'Sistemi Kundër Bllokimit',
    '20': 'Kontrolli i Traksionit'
  };

  // Convert option numbers to feature names
  const convertOptionsToNames = (options: any): any => {
    console.log('🔧 Converting options:', options);
    
    if (!options) return { standard: [], choice: [], tuning: [] };
    
    const result: any = { standard: [], choice: [], tuning: [] };
    
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
    
    console.log('✅ Converted result:', result);
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
    if (lot?.keys_available) features.push('Çelësat të Disponueshëm');
    
    // Add basic features if list is empty
    if (features.length === 0) {
      return ['Klimatizimi', 'Dritaret Elektrike', 'Mbyllja Qendrore', 'Frena ABS'];
    }
    return features;
  };

  const getSafetyFeatures = (carData: any, lot: any): string[] => {
    const safety = [];
    if (lot?.airbags) safety.push(`Sistemi i Airbag-ëve: ${lot.airbags}`);
    if (carData.transmission?.name === 'automatic') safety.push('ABS Sistemi i Frënimit');
    safety.push('Sistemi i Stabilitetit Elektronik');
    if (lot?.keys_available) safety.push('Sistemi i Sigurisë');
    
    // Add default safety features
    return safety.length > 0 ? safety : ['ABS Sistemi i Frënimit', 'Airbag Sistemi', 'Mbyllja Qendrore'];
  };

  const getComfortFeatures = (carData: any, lot: any): string[] => {
    const comfort = [];
    if (carData.transmission?.name === 'automatic') comfort.push('Transmisioni Automatik');
    comfort.push('Klimatizimi');
    comfort.push('Dritaret Elektrike');
    comfort.push('Pasqyrat Elektrike');
    
    return comfort;
  };

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: adminCheck } = await supabase.rpc('is_admin');
          setIsAdmin(adminCheck || false);
        }
      } catch (error) {
        console.error('Failed to check admin status:', error);
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
        console.log('Searching for car with lot:', lot);
        const { data: cachedCar, error: cacheError } = await supabase
          .from('cars_cache')
          .select('*')
          .or(`id.eq.${lot},api_id.eq.${lot},lot_number.eq.${lot}`)
          .maybeSingle();
        
        console.log('Cache query result:', { cachedCar, cacheError });

        if (!cacheError && cachedCar && isMounted) {
          console.log('Found car in cache:', cachedCar);
          
          // Transform cached car data to CarDetails format
          const carData = typeof cachedCar.car_data === 'string' ? JSON.parse(cachedCar.car_data) : cachedCar.car_data;
          const lotData = typeof cachedCar.lot_data === 'string' ? JSON.parse(cachedCar.lot_data || '{}') : (cachedCar.lot_data || {});
          const images = typeof cachedCar.images === 'string' ? JSON.parse(cachedCar.images || '[]') : (cachedCar.images || []);

          const basePrice = cachedCar.price || lotData.buy_now || lotData.final_bid || 25000;
          const price = convertUSDtoEUR(Math.round(basePrice + 2200));

          const transformedCar: CarDetails = {
            id: cachedCar.id,
            make: cachedCar.make || 'Unknown',
            model: cachedCar.model || 'Unknown',
            year: cachedCar.year || 2020,
            price,
            image: images[0] || '/placeholder.svg',
            images: images || [],
            vin: cachedCar.vin || carData.vin,
            mileage: cachedCar.mileage || (lotData.odometer?.km ? `${lotData.odometer.km.toLocaleString()} km` : undefined),
            transmission: cachedCar.transmission || carData.transmission?.name,
            fuel: cachedCar.fuel || carData.fuel?.name,
            color: cachedCar.color || carData.color?.name,
            condition: cachedCar.condition || lotData.condition?.name?.replace('run_and_drives', 'Good Condition'),
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
            details: lotData.details,
          };

          setCar(transformedCar);
          setLoading(false);
          
          // Track car view analytics
          trackCarView(cachedCar.id || cachedCar.api_id, transformedCar);
          return;
        }

        // If not found in cache, try Supabase edge function with lot number search
        console.log('🔍 Searching for lot number:', lot);
        console.log('📋 Cache search failed, trying external API...');
        try {
          const secureResponse = await fetch(`https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/secure-cars-api`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8`,
            },
            body: JSON.stringify({
              endpoint: 'search-lot',
              lotNumber: lot
            })
          });

          console.log('📡 Edge function response status:', secureResponse.status);
          
          if (secureResponse.ok) {
            const carData = await secureResponse.json();
            console.log('✅ Found car via edge function:', carData);
          } else {
            const errorText = await secureResponse.text();
            console.log('❌ Edge function error:', secureResponse.status, errorText);
          }

          if (secureResponse.ok) {
            const carData = await secureResponse.json();
            console.log('Found car via edge function:', carData);
            
            if (carData && carData.lots && carData.lots[0] && isMounted) {
              const lotData = carData.lots[0];
              const basePrice = lotData.buy_now ?? lotData.final_bid ?? lotData.price ?? 25000;
              const price = convertUSDtoEUR(Math.round(basePrice + 2200));

              const transformedCar: CarDetails = {
                id: carData.id?.toString() || lotData.lot,
                make: carData.manufacturer?.name || 'Unknown',
                model: carData.model?.name || 'Unknown',
                year: carData.year || 2020,
                price,
                image: lotData.images?.normal?.[0] || lotData.images?.big?.[0],
                images: lotData.images?.normal || lotData.images?.big || [],
                vin: carData.vin,
                mileage: lotData.odometer?.km ? `${lotData.odometer.km.toLocaleString()} km` : undefined,
                transmission: carData.transmission?.name,
                fuel: carData.fuel?.name,
                color: carData.color?.name,
                condition: lotData.condition?.name?.replace('run_and_drives', 'Good Condition'),
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
                details: lotData.details,
              };

              setCar(transformedCar);
              setLoading(false);
              trackCarView(carData.id || lot, transformedCar);
              return;
            }
          } else {
            // Handle specific error cases from edge function
            const errorData = await secureResponse.json().catch(() => ({}));
            if (secureResponse.status === 404 || errorData.error?.includes('404')) {
              setError(`Car with ID ${lot} is not available in our database. This car may have been sold or removed from the auction.`);
              setLoading(false);
              return;
            }
          }
        } catch (edgeFunctionError) {
          console.log('Edge function failed:', edgeFunctionError);
        }

        // If edge function fails, try external API with both lot ID and as lot number
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Try to fetch by lot ID first, then by lot number if that fails
        let response;
        try {
          response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
            headers: {
              accept: '*/*',
              'x-api-key': API_KEY,
            },
            signal: controller.signal,
          });
        } catch (firstAttemptError) {
          // If first attempt fails, try searching by lot number
          console.log('First API attempt failed, trying as lot number...');
          response = await fetch(`${API_BASE_URL}/search?lot_number=${lot}`, {
            headers: {
              accept: '*/*',
              'x-api-key': API_KEY,
            },
            signal: controller.signal,
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

        const basePrice = lotData.buy_now ?? lotData.final_bid ?? lotData.price ?? 25000;
        const price = convertUSDtoEUR(Math.round(basePrice + 2200));

        const transformedCar: CarDetails = {
          id: carData.id?.toString() || lotData.lot,
          make: carData.manufacturer?.name || 'Unknown',
          model: carData.model?.name || 'Unknown',
          year: carData.year || 2020,
          price,
          image: lotData.images?.normal?.[0] || lotData.images?.big?.[0],
          images: lotData.images?.normal || lotData.images?.big || [],
          vin: carData.vin,
          mileage: lotData.odometer?.km ? `${lotData.odometer.km.toLocaleString()} km` : undefined,
          transmission: carData.transmission?.name,
          fuel: carData.fuel?.name,
          color: carData.color?.name,
          condition: lotData.condition?.name?.replace('run_and_drives', 'Good Condition'),
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
          details: lotData.details,
        };

        setCar(transformedCar);
        setLoading(false);
        
        // Track car view analytics
        trackCarView(lot, transformedCar);
      } catch (apiError) {
        console.error('❌ Failed to fetch car data:', apiError);
        if (isMounted) {
          setError('Car not found');
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
    const message = `Përshëndetje! Jam i interesuar për ${car?.year} ${car?.make} ${car?.model} (€${car?.price.toLocaleString()}). A mund të më jepni më shumë informacion?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }, [car]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link-u u kopjua",
      description: "Link-u i makinës u kopjua në clipboard",
      duration: 3000
    });
  }, [toast]);

  // Generate detailed info HTML for new window
  const generateDetailedInfoHTML = (car: CarDetails) => {
    return `
      <!DOCTYPE html>
      <html lang="sq" class="light">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${car.year} ${car.make} ${car.model} - Raporti i Detajuar</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          :root {
            --background: 210 40% 98%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --primary: 220.9 39.3% 11%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96%;
            --secondary-foreground: 222.2 84% 4.9%;
            --muted: 210 40% 94%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 90%;
            --accent-foreground: 222.2 84% 4.9%;
            --border: 214.3 31.8% 91.4%;
            --ring: 220.9 39.3% 11%;
            --gradient-primary: linear-gradient(135deg, hsl(220.9, 39.3%, 11%), hsl(220.9, 39.3%, 16%));
            --gradient-secondary: linear-gradient(135deg, hsl(210, 40%, 96%), hsl(210, 40%, 98%));
            --shadow-elegant: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          
          .dark {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --card: 222.2 84% 6%;
            --card-foreground: 210 40% 98%;
            --primary: 210 40% 98%;
            --primary-foreground: 222.2 84% 4.9%;
            --secondary: 217.2 32.6% 17.5%;
            --secondary-foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --ring: 212.7 26.8% 83.9%;
            --gradient-primary: linear-gradient(135deg, hsl(210, 40%, 98%), hsl(210, 40%, 96%));
            --gradient-secondary: linear-gradient(135deg, hsl(217.2, 32.6%, 17.5%), hsl(222.2, 84%, 6%));
          }
          
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.7; 
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            min-height: 100vh;
            font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
          }
          
          .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 24px; 
          }
          
          .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            padding: 20px 0;
            border-bottom: 1px solid hsl(var(--border));
          }
          
          .theme-toggle {
            background: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            border: 1px solid hsl(var(--border));
            padding: 12px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            box-shadow: var(--shadow-card);
          }
          .theme-toggle:hover {
            background: hsl(var(--accent));
            transform: translateY(-2px);
            box-shadow: var(--shadow-elegant);
          }
          
          .print-btn { 
            background: var(--gradient-primary);
            color: hsl(var(--primary-foreground)); 
            border: none; 
            padding: 12px 24px; 
            border-radius: 12px; 
            cursor: pointer; 
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0.025em;
            box-shadow: var(--shadow-card);
            transition: all 0.3s ease;
          }
          .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-elegant);
          }
          
          .header { 
            background: var(--gradient-primary);
            color: hsl(var(--primary-foreground)); 
            padding: 48px; 
            border-radius: 24px; 
            margin-bottom: 40px; 
            text-align: center;
            box-shadow: var(--shadow-elegant);
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            pointer-events: none;
          }
          .title { 
            font-size: 3rem; 
            font-weight: 800; 
            margin-bottom: 12px; 
            letter-spacing: -0.025em;
            position: relative;
          }
          .subtitle { 
            font-size: 1.25rem; 
            opacity: 0.9; 
            font-weight: 500;
            position: relative;
          }
          
          .section { 
            background: hsl(var(--card)); 
            color: hsl(var(--card-foreground));
            margin-bottom: 32px; 
            border-radius: 20px; 
            box-shadow: var(--shadow-card);
            overflow: hidden;
            border: 1px solid hsl(var(--border));
            backdrop-filter: blur(10px);
          }
          .section-header { 
            background: var(--gradient-secondary);
            color: hsl(var(--foreground)); 
            padding: 24px 32px; 
            font-size: 1.5rem; 
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
            letter-spacing: -0.025em;
            border-bottom: 1px solid hsl(var(--border));
          }
          .section-content { padding: 32px; }
          
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
            gap: 20px; 
          }
          .info-item { 
            background: hsl(var(--muted)); 
            padding: 20px; 
            border-radius: 16px; 
            border-left: 4px solid hsl(var(--primary));
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .info-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .info-item:hover {
            background: hsl(var(--accent));
            transform: translateY(-4px);
            box-shadow: var(--shadow-elegant);
          }
          .info-item:hover::before {
            opacity: 1;
          }
          .info-label { 
            font-weight: 600; 
            color: hsl(var(--muted-foreground)); 
            margin-bottom: 8px; 
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .info-value { 
            color: hsl(var(--foreground)); 
            font-size: 1.125rem; 
            font-weight: 600;
          }
          
          .badge { 
            display: inline-block; 
            padding: 8px 16px; 
            border-radius: 24px; 
            font-size: 0.875rem; 
            font-weight: 600; 
            margin: 3px;
            border: 1px solid transparent;
            letter-spacing: 0.025em;
            transition: all 0.3s ease;
          }
          .badge:hover {
            transform: translateY(-1px);
          }
          .badge-success { 
            background: linear-gradient(135deg, hsl(142.1, 76.2%, 36.3%), hsl(142.1, 76.2%, 40%));
            color: white; 
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          }
          .badge-warning { 
            background: linear-gradient(135deg, hsl(47.9, 95.8%, 53.1%), hsl(47.9, 95.8%, 56%));
            color: hsl(var(--foreground)); 
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
          }
          .badge-danger { 
            background: linear-gradient(135deg, hsl(0, 84.2%, 60.2%), hsl(0, 84.2%, 64%));
            color: white; 
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          .badge-info { 
            background: var(--gradient-primary);
            color: hsl(var(--primary-foreground)); 
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          .badge-outline { 
            background: transparent; 
            color: hsl(var(--foreground)); 
            border: 2px solid hsl(var(--border));
          }
          
          .options-grid { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 12px; 
            margin-top: 16px; 
          }
          
          .car-diagram {
            background: hsl(var(--card));
            border: 2px solid hsl(var(--border));
            border-radius: 20px;
            padding: 32px;
            margin: 24px 0;
            box-shadow: var(--shadow-card);
          }
          
          .legend {
            display: flex;
            justify-content: center;
            gap: 32px;
            margin-top: 24px;
            flex-wrap: wrap;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.95rem;
            color: hsl(var(--foreground));
            font-weight: 500;
          }
          .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .contact-info {
            background: linear-gradient(135deg, hsl(142.1, 76.2%, 36.3%), hsl(142.1, 76.2%, 40%));
            color: white;
            padding: 32px;
            border-radius: 20px;
            margin-top: 32px;
            box-shadow: var(--shadow-elegant);
            position: relative;
            overflow: hidden;
          }
          .contact-info::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            pointer-events: none;
          }
          .contact-info h3 {
            position: relative;
          }
          .contact-info .info-grid {
            position: relative;
          }
          
          @media (max-width: 768px) {
            .container { padding: 16px; }
            .title { font-size: 2.5rem; }
            .subtitle { font-size: 1.125rem; }
            .info-grid { grid-template-columns: 1fr; }
            .section-content { padding: 24px; }
            .controls { flex-direction: column; gap: 16px; }
            .header { padding: 32px 24px; }
          }
          
          @media print { 
            .controls, .theme-toggle, .print-btn { display: none; }
            .section { break-inside: avoid; }
            body { background: white; color: black; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="controls">
            <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.025em;">Raporti i Detajuar i Makinës</h1>
            <div style="display: flex; gap: 12px; align-items: center;">
              <button onclick="toggleTheme()" class="theme-toggle" id="themeToggle" title="Ndrysho temën">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </button>
              <button onclick="window.print()" class="print-btn">🖨️ Printo</button>
            </div>
          </div>
          
          <div class="header">
            <div class="title">${car.year} ${car.make} ${car.model}</div>
            <div class="subtitle">€${car.price.toLocaleString()} • Lot #${car.lot || 'N/A'}</div>
          </div>
          
          <script>
            function toggleTheme() {
              const html = document.documentElement;
              const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
              const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
              
              html.classList.remove('light', 'dark');
              html.classList.add(newTheme);
              
              // Update toggle icon
              const toggle = document.getElementById('themeToggle');
              if (newTheme === 'dark') {
                toggle.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>';
              } else {
                toggle.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>';
              }
            }
          </script>

          ${car.insurance_v2 || car.insurance || car.inspect ? `
          <div class="section">
            <div class="section-header">
              🛡️ Raporti i Sigurisë & Sigurimit
            </div>
            <div class="section-content">
              <div class="info-grid">
                ${car.insurance_v2?.accidentCnt !== undefined ? `
                <div class="info-item">
                  <div class="info-label">Historiku i Aksidenteve</div>
                  <div class="info-value">
                    <span class="badge ${car.insurance_v2.accidentCnt === 0 ? 'badge-success' : 'badge-danger'}">
                      ${car.insurance_v2.accidentCnt === 0 ? '✅ Pa Aksidente' : `⚠️ ${car.insurance_v2.accidentCnt} aksidente`}
                    </span>
                  </div>
                </div>` : ''}
                ${car.insurance_v2?.ownerChangeCnt !== undefined ? `
                <div class="info-item">
                  <div class="info-label">Pronarë të Mëparshëm</div>
                  <div class="info-value">${car.insurance_v2.ownerChangeCnt} pronarë</div>
                </div>` : ''}
                ${car.insurance_v2?.totalLossCnt > 0 ? `
                <div class="info-item">
                  <div class="info-label">Dëme të Plota</div>
                  <div class="info-value"><span class="badge badge-danger">🚨 ${car.insurance_v2.totalLossCnt} raste</span></div>
                </div>` : ''}
                ${car.insurance_v2?.floodTotalLossCnt > 0 ? `
                <div class="info-item">
                  <div class="info-label">Dëme nga Përmbytja</div>
                  <div class="info-value"><span class="badge badge-danger">🌊 ${car.insurance_v2.floodTotalLossCnt} raste</span></div>
                </div>` : ''}
                ${car.keys_available !== undefined ? `
                <div class="info-item">
                  <div class="info-label">Disponueshmëria e Çelësave</div>
                  <div class="info-value">
                    <span class="badge ${car.keys_available ? 'badge-success' : 'badge-danger'}">
                      ${car.keys_available ? '🔑 Të Disponueshëm' : '❌ Jo të Disponueshëm'}
                    </span>
                  </div>
                </div>` : ''}
                ${car.inspect?.accident_summary?.accident && car.inspect.accident_summary.accident !== "doesn't exist" ? `
                <div class="info-item">
                  <div class="info-label">Përmbledhja e Inspektimit</div>
                  <div class="info-value">
                    <span class="badge badge-warning">⚠️ ${car.inspect.accident_summary.accident}</span>
                  </div>
                </div>` : ''}
              </div>
            </div>
          </div>` : ''}

          ${car.details ? `
          <div class="section">
            <div class="section-header">
              🚗 Detajet e Mjetit
            </div>
            <div class="section-content">
              <div class="info-grid">
                ${car.details.engine_volume ? `
                <div class="info-item">
                  <div class="info-label">Vëllimi i Motorit</div>
                  <div class="info-value">🔧 ${car.details.engine_volume}cc</div>
                </div>` : ''}
                ${car.details.first_registration ? `
                <div class="info-item">
                  <div class="info-label">Regjistrimi i Parë</div>
                  <div class="info-value">📅 ${car.details.first_registration.year}-${String(car.details.first_registration.month).padStart(2, '0')}-${String(car.details.first_registration.day).padStart(2, '0')}</div>
                </div>` : ''}
                ${car.details.badge ? `
                <div class="info-item">
                  <div class="info-label">Modeli/Versioni</div>
                  <div class="info-value">🏷️ ${car.details.badge}</div>
                </div>` : ''}
                ${car.details.seats_count ? `
                <div class="info-item">
                  <div class="info-label">Numri i Vendeve</div>
                  <div class="info-value">👥 ${car.details.seats_count} vende</div>
                </div>` : ''}
                ${car.details.sell_type ? `
                <div class="info-item">
                  <div class="info-label">Lloji i Shitjes</div>
                  <div class="info-value">🏪 ${car.details.sell_type.charAt(0).toUpperCase() + car.details.sell_type.slice(1)}</div>
                </div>` : ''}
              </div>
            </div>
          </div>` : ''}

          ${car.details?.options ? `
          <div class="section">
            <div class="section-header">
              ⚙️ Pajisjet & Opsionet
            </div>
            <div class="section-content">
              ${car.details.options.standard?.length ? `
              <div class="info-item">
                <div class="info-label">Pajisjet Standarde</div>
                <div class="options-grid">
                  ${car.details.options.standard.slice(0, 5).map(option => `<span class="badge badge-info">${option}</span>`).join('')}
                  ${car.details.options.standard.length > 5 ? `<span class="badge badge-outline">+${car.details.options.standard.length - 5} më shumë</span>` : ''}
                </div>
              </div>` : ''}
              ${car.details.options.choice?.length ? `
              <div class="info-item">
                <div class="info-label">Pajisjet Opsionale</div>
                <div class="options-grid">
                  ${car.details.options.choice.map(option => `<span class="badge badge-success">${option}</span>`).join('')}
                </div>
              </div>` : ''}
              ${car.details.options.tuning?.length ? `
              <div class="info-item">
                <div class="info-label">Modifikimet</div>
                <div class="options-grid">
                  ${car.details.options.tuning.map(option => `<span class="badge badge-warning">${option}</span>`).join('')}
                </div>
              </div>` : ''}
            </div>
          </div>` : ''}

          ${car.details?.inspect_outer?.length ? `
          <div class="section">
            <div class="section-header">
              🔍 Raporti i Detajuar i Inspektimit
            </div>
            <div class="section-content">
              <div class="car-diagram">
                <h4 style="text-align: center; margin-bottom: 20px; color: hsl(215.4, 16.3%, 46.9%); font-size: 1.25rem; font-weight: 600;">Përshkrimi i Inspektimit të Mjetit</h4>
                <div class="legend">
                  <div class="legend-item">
                    <div class="legend-color" style="background: hsl(142.1, 76.2%, 36.3%);"></div>
                    <span>Normal</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: hsl(47.9, 95.8%, 53.1%);"></div>
                    <span>Riparim/Saldim</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: hsl(0, 84.2%, 60.2%);"></div>
                    <span>Këmbim/Zëvendësim</span>
                  </div>
                </div>
              </div>
              <div class="info-grid">
                ${car.details.inspect_outer.map(item => `
                <div class="info-item">
                  <div class="info-label">${item.type.title}</div>
                  <div class="info-value">
                    ${item.statusTypes.map(status => `
                    <span class="badge ${status.code === 'X' ? 'badge-danger' : status.code === 'W' ? 'badge-warning' : 'badge-outline'}">
                      ${status.code === 'X' ? '🔄' : status.code === 'W' ? '🔧' : '✅'} ${status.title}
                    </span>`).join('')}
                  </div>
                </div>`).join('')}
              </div>
            </div>
          </div>` : ''}

          <div class="section">
            <div class="section-header">
              📋 Informacionet e Burimit
            </div>
            <div class="section-content">
              <div class="info-grid">
                ${car.lot ? `
                <div class="info-item">
                  <div class="info-label">Numri i Lot-it</div>
                  <div class="info-value">🏷️ ${car.lot}</div>
                </div>` : ''}
                ${car.vin ? `
                <div class="info-item">
                  <div class="info-label">Numri VIN</div>
                  <div class="info-value">🔍 ${car.vin}</div>
                </div>` : ''}
                ${car.seller ? `
                <div class="info-item">
                  <div class="info-label">Shitësi</div>
                  <div class="info-value">🏪 ${car.seller}</div>
                </div>` : ''}
                ${car.sale_date ? `
                <div class="info-item">
                  <div class="info-label">Data e Shitjes</div>
                  <div class="info-value">📅 ${new Date(car.sale_date).toLocaleDateString('sq-AL')}</div>
                </div>` : ''}
              </div>
            </div>
          </div>

          <div class="contact-info">
            <h3 style="margin-bottom: 20px; font-size: 1.75rem; font-weight: 800;">📞 Kontaktoni KORAUTO</h3>
            <div class="info-grid" style="gap: 24px;">
              <div>
                <div style="font-weight: 700; margin-bottom: 8px; font-size: 1.125rem;">WhatsApp</div>
                <div style="font-size: 1.5rem; font-weight: 600;">+383 48 181 116</div>
              </div>
              <div>
                <div style="font-weight: 700; margin-bottom: 8px; font-size: 1.125rem;">Shërbimi</div>
                <div style="font-size: 1.125rem;">Shërbim Profesional Importi</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Memoize images array for performance
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

  // Preload important images
  useImagePreload(car?.image);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-responsive py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-responsive py-8">
          <Button variant="outline" onClick={() => navigate('/')} className="mb-6">
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

  const images = car.images || [car.image].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container-responsive py-6 max-w-7xl">
        {/* Header with Actions */}
        <div className="flex flex-wrap gap-3 justify-between items-center mb-8">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                // Smart back navigation with multiple fallbacks
                console.log('🔙 Attempting to go back...');
                console.log('Previous page from context:', previousPage);
                console.log('Document referrer:', document.referrer);
                console.log('History length:', window.history.length);
                
                // Try multiple methods in order of preference
                if (previousPage && previousPage !== window.location.href) {
                  console.log('🔙 Using saved previous page:', previousPage);
                  navigate(previousPage);
                } else if (document.referrer && document.referrer !== window.location.href) {
                  // If the referrer is from our domain, use it
                  const referrerUrl = new URL(document.referrer);
                  const currentUrl = new URL(window.location.href);
                  if (referrerUrl.origin === currentUrl.origin) {
                    console.log('🔙 Using document referrer:', document.referrer);
                    window.location.href = document.referrer;
                    return;
                  }
                } else if (window.history.length > 1) {
                  console.log('🔙 Using browser back');
                  window.history.back();
                  return;
                }
                
                // Final fallbacks
                console.log('🔙 Using fallback to catalog');
                navigate('/catalog');
              }} 
              className="shadow-sm border-2 hover:shadow-md transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu te Makinat
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="shadow-sm border-2 hover:shadow-md transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kryefaqja
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleLike} className="shadow-sm hover:shadow-md transition-all">
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="shadow-sm hover:shadow-md transition-all">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Left Column - Images and Gallery */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-8">
            {/* Main Image */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-br from-muted to-muted/50 overflow-hidden group cursor-pointer" onClick={() => setIsImageZoomOpen(true)}>
                  {images.length > 0 ? (
                    <img 
                      src={images[selectedImageIndex]} 
                      alt={`${car.year} ${car.make} ${car.model}`} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                  {car.lot && (
                    <Badge className="absolute top-6 right-6 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-2 text-sm font-medium shadow-lg">
                      Lot #{car.lot}
                    </Badge>
                  )}
                  {/* Zoom icon */}
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Expand className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {images.slice(0, 20).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-20 bg-muted rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                      selectedImageIndex === index ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/50'
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

            {/* Enhanced Vehicle Specifications */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-4 lg:p-8">
                 <div className="flex flex-col gap-4 mb-6">
                   <h3 className="text-xl lg:text-2xl font-bold flex items-center text-foreground">
                     <Settings className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3 text-primary" />
                     Specifikimet Teknike
                   </h3>
                   
                   {/* Price and action buttons */}
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div className="text-left">
                       <div className="text-xl lg:text-2xl font-bold text-primary">
                         €{car.price.toLocaleString()}
                       </div>
                       <div className="text-sm text-muted-foreground">
                         +350€ deri në Prishtinë
                       </div>
                     </div>
                     <InspectionRequestForm 
                       trigger={
                         <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto">
                           <FileText className="h-4 w-4 mr-1" />
                           Kërko Inspektim
                         </Button>
                       }
                       carId={car.id}
                       carMake={car.make}
                       carModel={car.model}
                       carYear={car.year}
                     />
                   </div>
                </div>
                
                 {/* Main Specifications Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6">
                  {/* Basic Info */}
                  <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground">Marka & Modeli</span>
                    </div>
                    <span className="text-muted-foreground font-medium text-right">{car.make} {car.model}</span>
                  </div>
                  
                   <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                     <div className="flex items-center gap-3">
                       <Calendar className="h-5 w-5 text-primary" />
                       <span className="font-semibold text-foreground">Viti</span>
                     </div>
                     <span className="text-muted-foreground font-medium">{car.year}</span>
                   </div>
                   
                   {/* Add Production Year */}
                   {car.details?.first_registration && (
                     <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                       <div className="flex items-center gap-3">
                         <Calendar className="h-5 w-5 text-primary" />
                         <span className="font-semibold text-foreground">Viti i Prodhimit</span>
                       </div>
                       <span className="text-muted-foreground font-medium">{car.details.first_registration.year}</span>
                     </div>
                   )}
                  
                  {car.mileage && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Gauge className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Kilometrat</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.mileage}</span>
                    </div>
                  )}
                  
                  {car.transmission && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Transmisioni</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.transmission}</span>
                    </div>
                  )}
                  
                  {car.fuel && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Fuel className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Karburanti</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.fuel}</span>
                    </div>
                  )}
                  
                  {car.color && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Palette className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Ngjyra</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.color}</span>
                    </div>
                  )}

                  {car.details?.seats_count && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Numri i Vendeve</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.details.seats_count} Vende</span>
                    </div>
                  )}
                </div>

                 {/* Technical Details */}
                 <Separator className="my-6" />
                 <h4 className="text-lg font-semibold mb-4 text-foreground">Detaje Teknike</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Engine Displacement */}
                   {car.details?.engine_volume && (
                     <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="w-2 h-2 bg-primary rounded-full"></div>
                         <span className="font-semibold text-foreground">Vëllimi Motorit</span>
                       </div>
                       <span className="text-muted-foreground font-medium">{car.details.engine_volume}L</span>
                     </div>
                   )}
                   {car.engine && (
                     <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="w-2 h-2 bg-primary rounded-full"></div>
                         <span className="font-semibold text-foreground">Motori</span>
                       </div>
                       <span className="text-muted-foreground font-medium">{car.engine.name}</span>
                     </div>
                   )}
                  {car.cylinders && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Cilindrat</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.cylinders}</span>
                    </div>
                  )}
                  {car.drive_wheel && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Drejtimi</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.drive_wheel.name}</span>
                    </div>
                  )}
                  {car.body_type && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Lloji i Trupit</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.body_type.name}</span>
                    </div>
                  )}
                  {car.damage && (car.damage.main || car.damage.second) && (
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-destructive rounded-full"></div>
                        <span className="font-semibold text-foreground">Dëmtimet</span>
                      </div>
                      <span className="text-muted-foreground font-medium text-right">
                        {car.damage.main && <span>{car.damage.main}</span>}
                        {car.damage.main && car.damage.second && <span>, </span>}
                        {car.damage.second && <span>{car.damage.second}</span>}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Information Section */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-4 lg:p-8">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                   <h3 className="text-xl lg:text-2xl font-bold flex items-center text-foreground">
                     <Info className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3 text-primary" />
                     Informacione të Detajuara
                   </h3>
                   <Button
                     variant="outline"
                     onClick={() => {
                       const detailsWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                       if (detailsWindow) {
                         detailsWindow.document.write(generateDetailedInfoHTML(car));
                         detailsWindow.document.title = `${car.year} ${car.make} ${car.model} - Informacione të Detajuara`;
                       }
                     }}
                     className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto"
                   >
                     Shiko Detajet
                   </Button>
                </div>

                {showDetailedInfo && (
                  <div className="space-y-6">
                    {/* Insurance & Safety Report */}
                    {(car.insurance_v2 || car.inspect || car.insurance) && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Raporti i Sigurisë dhe Sigurimit
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {car.insurance_v2?.accidentCnt !== undefined && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Historia e Aksidenteve:</span>
                              <Badge variant={car.insurance_v2.accidentCnt === 0 ? "secondary" : "destructive"}>
                                {car.insurance_v2.accidentCnt === 0 ? 'E Pastër' : `${car.insurance_v2.accidentCnt} aksidente`}
                              </Badge>
                            </div>
                          )}
                          {car.insurance_v2?.ownerChangeCnt !== undefined && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Ndryshime Pronësie:</span>
                              <span className="font-medium">{car.insurance_v2.ownerChangeCnt}</span>
                            </div>
                          )}
                          {car.insurance_v2?.totalLossCnt !== undefined && car.insurance_v2.totalLossCnt > 0 && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Humbje Totale:</span>
                              <Badge variant="destructive">{car.insurance_v2.totalLossCnt}</Badge>
                            </div>
                          )}
                          {car.insurance_v2?.floodTotalLossCnt !== undefined && car.insurance_v2.floodTotalLossCnt > 0 && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Dëmtime nga Përmbytjet:</span>
                              <Badge variant="destructive">{car.insurance_v2.floodTotalLossCnt}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vehicle Details */}
                    {car.details && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Car className="h-5 w-5" />
                          Detaje të Veturës
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {car.details.engine_volume && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Vëllimi i Motorit:</span>
                              <span className="font-medium">{car.details.engine_volume}cc</span>
                            </div>
                          )}
                          {car.details.seats_count && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Numri i Vendeve:</span>
                              <span className="font-medium">{car.details.seats_count}</span>
                            </div>
                          )}
                          {car.details.badge && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Versioni:</span>
                              <span className="font-medium">{car.details.badge}</span>
                            </div>
                          )}
                          {car.details.sell_type && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Lloji i Shitjes:</span>
                              <span className="font-medium capitalize">{car.details.sell_type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Equipment & Options */}
                    {(() => {
                      // Debug info
                      if (car.details?.options) {
                        console.log('🔍 Car details options:', car.details.options);
                        console.log('🔍 Converted options:', convertOptionsToNames(car.details.options));
                      } else {
                        console.log('🔍 No options found. Car details:', car.details);
                      }
                      return null;
                    })()}
                    
                    {car.details?.options && (
                      <EquipmentOptionsSection 
                        options={convertOptionsToNames(car.details.options)} 
                        features={car.features}
                        safetyFeatures={car.safety_features}
                        comfortFeatures={car.comfort_features}
                      />
                    )}
                    
                    {/* Fallback if no options found */}
                    {!car.details?.options && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Pajisjet dhe Opsionet
                        </h4>
                        <p className="text-muted-foreground">Nuk ka informacion për pajisjet dhe opsionet e kësaj makine.</p>
                      </div>
                    )}

                    {/* Inspection Report with Car Diagram */}
                    {car.details?.inspect_outer && car.details.inspect_outer.length > 0 && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Raporti i Inspektimit të Detajuar
                        </h4>
                        <CarInspectionDiagram 
                          inspectionData={car.details.inspect_outer}
                          className="mt-4"
                        />
                      </div>
                    )}


                    {/* Admin Only Pricing Details */}
                    {isAdmin && (
                      <div className="space-y-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Detaje Çmimi (Vetëm Admin)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {car.bid && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Oferta Aktuale:</span>
                              <span className="font-medium">€{car.bid.toLocaleString()}</span>
                            </div>
                          )}
                          {car.buy_now && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Çmimi Blerje Tani:</span>
                              <span className="font-medium">€{car.buy_now.toLocaleString()}</span>
                            </div>
                          )}
                          {car.final_bid && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Oferta Finale:</span>
                              <span className="font-medium">€{car.final_bid.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Car Info and Contact */}
          <div className="space-y-6">
            {/* Contact & Inspection Card */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center text-foreground">
                  Kontaktoni dhe Kërkoni Inspektim
                </h3>

                {/* Contact Buttons */}
                <div className="space-y-4 mb-6">
                  <Button onClick={handleContactWhatsApp} className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-shadow bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Kontakto në WhatsApp
                  </Button>
                  
                  <Button variant="outline" className="w-full h-12 text-base font-medium border-2 hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => window.open('tel:+38348181116', '_self')}>
                    <Phone className="h-5 w-5 mr-2" />
                    Telefono: +383 48 181 116
                  </Button>
                  
                  <Button variant="outline" className="w-full h-12 text-base font-medium border-2 hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => window.open('mailto:info@korauto.com', '_self')}>
                    <Mail className="h-5 w-5 mr-2" />
                    Email: info@korauto.com
                  </Button>
                </div>

                {/* Inspection Request Button */}
                <div className="border-t border-border pt-6">
                  <InspectionRequestForm 
                    trigger={
                      <Button className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                        <FileText className="h-5 w-5 mr-2" />
                        Kërko Inspektim Professional
                      </Button>
                    }
                    carId={car.id}
                    carMake={car.make}
                    carModel={car.model}
                    carYear={car.year}
                  />
                </div>

                {/* Location */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <a 
                      href="https://maps.google.com/?q=KORAUTO,Rr.+Ilaz+Kodra+70,Prishtinë,Kosovo" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary transition-colors cursor-pointer"
                    >
                      Lokacioni: Rr. Ilaz Kodra 70, Prishtinë, Kosovë
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Zoom Modal */}
        {isImageZoomOpen && (
          <ImageZoom
            src={images[selectedImageIndex] || ''}
            alt={`Car image ${selectedImageIndex + 1}`}
            isOpen={isImageZoomOpen}
            onClose={() => setIsImageZoomOpen(false)}
            images={images}
            currentIndex={selectedImageIndex}
            onImageChange={setSelectedImageIndex}
          />
        )}
      </div>
    </div>
  );
});

export default CarDetails;