import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, Share2, Heart, ChevronRight, Expand, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SimilarCarsTab from "@/components/SimilarCarsTab";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import CarInspectionDiagram from "@/components/CarInspectionDiagram";

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

const CarDetails = () => {
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
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  
  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

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
  const fetchCarDetails = async () => {
    if (!lot) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
        headers: {
          accept: '*/*',
          'x-api-key': API_KEY,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const carData = data.data;
      const lotData = carData.lots?.[0];
      console.log("lotsdata",lotData)

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
    } catch (apiError) {
      console.error('❌ Failed to fetch from lot endpoint:', apiError);
      setError('Failed to load car data');
      setLoading(false);
    }
  };

  fetchCarDetails();
}, [lot]);


  const handleContactWhatsApp = () => {
    const message = `Përshëndetje! Jam i interesuar për ${car?.year} ${car?.make} ${car?.model} (€${car?.price.toLocaleString()}). A mund të më jepni më shumë informacion?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link-u u kopjua",
      description: "Link-u i makinës u kopjua në clipboard",
      duration: 3000
    });
  };

  // Generate detailed info HTML for new window
  const generateDetailedInfoHTML = (car: CarDetails) => {
    return `
      <!DOCTYPE html>
      <html lang="en" class="light">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${car.year} ${car.make} ${car.model} - Detailed Information</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700&display=swap');
          
          :root {
            --background: 0 0% 100%;
            --foreground: 0 0% 3.9%;
            --card: 0 0% 100%;
            --card-foreground: 0 0% 3.9%;
            --primary: 0 0% 9%;
            --primary-foreground: 0 0% 98%;
            --secondary: 0 0% 96.1%;
            --secondary-foreground: 0 0% 9%;
            --muted: 0 0% 96.1%;
            --muted-foreground: 0 0% 45.1%;
            --accent: 0 0% 96.1%;
            --accent-foreground: 0 0% 9%;
            --border: 0 0% 89.8%;
            --ring: 0 0% 3.9%;
          }
          
          .dark {
            --background: 0 0% 3.9%;
            --foreground: 0 0% 98%;
            --card: 0 0% 3.9%;
            --card-foreground: 0 0% 98%;
            --primary: 0 0% 98%;
            --primary-foreground: 0 0% 9%;
            --secondary: 0 0% 14.9%;
            --secondary-foreground: 0 0% 98%;
            --muted: 0 0% 14.9%;
            --muted-foreground: 0 0% 63.9%;
            --accent: 0 0% 14.9%;
            --accent-foreground: 0 0% 98%;
            --border: 0 0% 14.9%;
            --ring: 0 0% 83.1%;
          }
          
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
          }
          
          body { 
            font-family: 'Noto Sans', sans-serif; 
            line-height: 1.6; 
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            min-height: 100vh;
          }
          
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          
          .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            gap: 10px;
            flex-wrap: wrap;
          }
          
          .theme-toggle {
            background: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            border: 1px solid hsl(var(--border));
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
          }
          .theme-toggle:hover {
            background: hsl(var(--accent));
          }
          
          .print-btn { 
            background: hsl(var(--primary)); 
            color: hsl(var(--primary-foreground)); 
            border: none; 
            padding: 10px 16px; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 14px;
          }
          .print-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
          
          .header { 
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground)); 
            padding: 30px; 
            border-radius: 12px; 
            margin-bottom: 30px; 
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .title { font-size: 2.5rem; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 1.2rem; opacity: 0.9; }
          
          .section { 
            background: hsl(var(--card)); 
            color: hsl(var(--card-foreground));
            margin-bottom: 25px; 
            border-radius: 12px; 
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); 
            overflow: hidden;
            border: 1px solid hsl(var(--border));
          }
          .section-header { 
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground)); 
            padding: 20px; 
            font-size: 1.3rem; 
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .section-content { padding: 25px; }
          
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 15px; 
          }
          .info-item { 
            background: hsl(var(--muted)); 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid hsl(var(--primary));
            transition: all 0.2s ease;
          }
          .info-item:hover {
            background: hsl(var(--accent));
            transform: translateY(-1px);
          }
          .info-label { 
            font-weight: 600; 
            color: hsl(var(--muted-foreground)); 
            margin-bottom: 5px; 
            font-size: 0.9rem;
          }
          .info-value { 
            color: hsl(var(--foreground)); 
            font-size: 1.1rem; 
            font-weight: 500;
          }
          
          .badge { 
            display: inline-block; 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 0.85rem; 
            font-weight: 500; 
            margin: 2px;
            border: 1px solid transparent;
          }
          .badge-success { 
            background: hsl(142.1, 76.2%, 36.3%); 
            color: white; 
          }
          .badge-warning { 
            background: hsl(47.9, 95.8%, 53.1%); 
            color: hsl(var(--foreground)); 
          }
          .badge-danger { 
            background: hsl(0, 84.2%, 60.2%); 
            color: white; 
          }
          .badge-info { 
            background: hsl(var(--primary)); 
            color: hsl(var(--primary-foreground)); 
          }
          .badge-outline { 
            background: transparent; 
            color: hsl(var(--foreground)); 
            border: 1px solid hsl(var(--border));
          }
          
          .options-grid { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
            margin-top: 10px; 
          }
          
          .car-diagram {
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .legend {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
            flex-wrap: wrap;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            color: hsl(var(--foreground));
          }
          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
          }
          
          .contact-info {
            background: hsl(142.1, 76.2%, 36.3%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          
          .show-more-btn {
            background: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            border: 1px solid hsl(var(--border));
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            margin-top: 10px;
            transition: all 0.2s ease;
          }
          .show-more-btn:hover {
            background: hsl(var(--accent));
          }
          
          @media (max-width: 768px) {
            .container { padding: 15px; }
            .title { font-size: 2rem; }
            .subtitle { font-size: 1rem; }
            .info-grid { grid-template-columns: 1fr; }
            .section-content { padding: 20px; }
            .controls { justify-content: center; }
          }
          
          @media print { 
            .controls, .theme-toggle, .print-btn { display: none; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="controls">
            <h1 style="font-size: 1.5rem; font-weight: 600;">Car Details Report</h1>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button onclick="toggleTheme()" class="theme-toggle" id="themeToggle" title="Toggle theme">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </button>
              <button onclick="window.print()" class="print-btn">🖨️ Print</button>
            </div>
          </div>
          
          <div class="header">
            <div class="title">${car.year} ${car.make} ${car.model}</div>
            <div class="subtitle">€${car.price.toLocaleString()} • Lot #${car.lot || 'N/A'}</div>
          </div>

          ${car.insurance_v2 || car.insurance || car.inspect ? `
          <div class="section">
            <div class="section-header">
              🛡️ Insurance & Safety Report
            </div>
            <div class="section-content">
              <div class="info-grid">
                ${car.insurance_v2?.accidentCnt !== undefined ? `
                <div class="info-item">
                  <div class="info-label">Accident History</div>
                  <div class="info-value">
                    <span class="badge ${car.insurance_v2.accidentCnt === 0 ? 'badge-success' : 'badge-danger'}">
                      ${car.insurance_v2.accidentCnt === 0 ? '✅ Clean Record' : `⚠️ ${car.insurance_v2.accidentCnt} accidents`}
                    </span>
                  </div>
                </div>` : ''}
                ${car.insurance_v2?.ownerChangeCnt !== undefined ? `
                <div class="info-item">
                  <div class="info-label">Previous Owners</div>
                  <div class="info-value">${car.insurance_v2.ownerChangeCnt} owners</div>
                </div>` : ''}
                ${car.insurance_v2?.totalLossCnt > 0 ? `
                <div class="info-item">
                  <div class="info-label">Total Loss Claims</div>
                  <div class="info-value"><span class="badge badge-danger">🚨 ${car.insurance_v2.totalLossCnt} claims</span></div>
                </div>` : ''}
                ${car.insurance_v2?.floodTotalLossCnt > 0 ? `
                <div class="info-item">
                  <div class="info-label">Flood Damage</div>
                  <div class="info-value"><span class="badge badge-danger">🌊 ${car.insurance_v2.floodTotalLossCnt} incidents</span></div>
                </div>` : ''}
                ${car.keys_available !== undefined ? `
                <div class="info-item">
                  <div class="info-label">Keys Availability</div>
                  <div class="info-value">
                    <span class="badge ${car.keys_available ? 'badge-success' : 'badge-danger'}">
                      ${car.keys_available ? '🔑 Available' : '❌ Not Available'}
                    </span>
                  </div>
                </div>` : ''}
                ${car.inspect?.accident_summary?.accident && car.inspect.accident_summary.accident !== "doesn't exist" ? `
                <div class="info-item">
                  <div class="info-label">Inspection Summary</div>
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
              🚗 Vehicle Details
            </div>
            <div class="section-content">
              <div class="info-grid">
                ${car.details.engine_volume ? `
                <div class="info-item">
                  <div class="info-label">Engine Volume</div>
                  <div class="info-value">🔧 ${car.details.engine_volume}cc</div>
                </div>` : ''}
                ${car.details.first_registration ? `
                <div class="info-item">
                  <div class="info-label">First Registration</div>
                  <div class="info-value">📅 ${car.details.first_registration.year}-${String(car.details.first_registration.month).padStart(2, '0')}-${String(car.details.first_registration.day).padStart(2, '0')}</div>
                </div>` : ''}
                ${car.details.badge ? `
                <div class="info-item">
                  <div class="info-label">Vehicle Badge/Trim</div>
                  <div class="info-value">🏷️ ${car.details.badge}</div>
                </div>` : ''}
                ${car.details.seats_count ? `
                <div class="info-item">
                  <div class="info-label">Number of Seats</div>
                  <div class="info-value">👥 ${car.details.seats_count} seats</div>
                </div>` : ''}
                ${car.details.sell_type ? `
                <div class="info-item">
                  <div class="info-label">Sale Type</div>
                  <div class="info-value">🏪 ${car.details.sell_type.charAt(0).toUpperCase() + car.details.sell_type.slice(1)}</div>
                </div>` : ''}
              </div>
            </div>
          </div>` : ''}

          ${car.details?.options ? `
          <div class="section">
            <div class="section-header">
              ⚙️ Equipment & Options
            </div>
            <div class="section-content">
              ${car.details.options.standard?.length ? `
              <div class="info-item">
                <div class="info-label">Standard Equipment</div>
                <div class="options-grid">
                  <div id="standard-options">
                    ${car.details.options.standard.slice(0, 5).map(option => `<span class="badge badge-info">${option}</span>`).join('')}
                  </div>
                  ${car.details.options.standard.length > 5 ? `
                  <div id="standard-hidden" style="display: none;">
                    ${car.details.options.standard.slice(5).map(option => `<span class="badge badge-info">${option}</span>`).join('')}
                  </div>
                  <button onclick="toggleOptions('standard')" id="standard-toggle" class="show-more-btn">
                    Show ${car.details.options.standard.length - 5} more
                  </button>` : ''}
                </div>
              </div>` : ''}
              ${car.details.options.choice?.length ? `
              <div class="info-item">
                <div class="info-label">Optional Equipment</div>
                <div class="options-grid">
                  <div id="choice-options">
                    ${car.details.options.choice.slice(0, 5).map(option => `<span class="badge badge-success">${option}</span>`).join('')}
                  </div>
                  ${car.details.options.choice.length > 5 ? `
                  <div id="choice-hidden" style="display: none;">
                    ${car.details.options.choice.slice(5).map(option => `<span class="badge badge-success">${option}</span>`).join('')}
                  </div>
                  <button onclick="toggleOptions('choice')" id="choice-toggle" class="show-more-btn">
                    Show ${car.details.options.choice.length - 5} more
                  </button>` : ''}
                </div>
              </div>` : ''}
              ${car.details.options.tuning?.length ? `
              <div class="info-item">
                <div class="info-label">Tuning Modifications</div>
                <div class="options-grid">
                  <div id="tuning-options">
                    ${car.details.options.tuning.slice(0, 5).map(option => `<span class="badge badge-warning">${option}</span>`).join('')}
                  </div>
                  ${car.details.options.tuning.length > 5 ? `
                  <div id="tuning-hidden" style="display: none;">
                    ${car.details.options.tuning.slice(5).map(option => `<span class="badge badge-warning">${option}</span>`).join('')}
                  </div>
                  <button onclick="toggleOptions('tuning')" id="tuning-toggle" class="show-more-btn">
                    Show ${car.details.options.tuning.length - 5} more
                  </button>` : ''}
                </div>
              </div>` : ''}
            </div>
          </div>` : ''}

          ${car.details?.inspect_outer?.length ? `
          <div class="section">
            <div class="section-header">
              🔍 Detailed Inspection Report
            </div>
            <div class="section-content">
              <div class="car-diagram">
                <h4 style="text-align: center; margin-bottom: 20px; color: hsl(var(--foreground));">Vehicle Inspection Diagram</h4>
                
                <!-- Car Inspection Diagram - Korean Style -->
                <div style="display: flex; justify-content: center; margin-bottom: 30px;">
                  <svg width="800" height="500" viewBox="0 0 800 500" style="border: 1px solid hsl(var(--border)); border-radius: 8px; background: hsl(var(--card));">
                    <!-- Title -->
                    <text x="400" y="25" text-anchor="middle" fill="hsl(var(--foreground))" font-size="18" font-weight="bold">Vehicle Inspection Diagram</text>
                    
                    <!-- Front View (앞/전방) -->
                    <g transform="translate(50, 60)">
                      <text x="150" y="-5" text-anchor="middle" fill="hsl(var(--foreground))" font-size="14" font-weight="bold">Front View (앞/전방)</text>
                      
                      <!-- Car outline from front -->
                      <path d="M50 50 L50 280 L80 300 L220 300 L250 280 L250 50 Z" 
                            fill="none" stroke="hsl(var(--border))" stroke-width="2"/>
                      
                      <!-- Hood -->
                      <rect x="70" y="50" width="160" height="40" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="hood-front"/>
                      <text x="150" y="75" text-anchor="middle" fill="white" font-size="10" font-weight="bold">Hood</text>
                      
                      <!-- Front Bumper -->
                      <rect x="60" y="90" width="180" height="25" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="front-bumper-main"/>
                      <text x="150" y="107" text-anchor="middle" fill="white" font-size="10" font-weight="bold">Front Bumper</text>
                      
                      <!-- Left Front Fender -->
                      <rect x="50" y="115" width="40" height="60" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="left-front-fender"/>
                      <text x="70" y="150" text-anchor="middle" fill="white" font-size="9" font-weight="bold">L Fender</text>
                      
                      <!-- Right Front Fender -->
                      <rect x="210" y="115" width="40" height="60" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="right-front-fender"/>
                      <text x="230" y="150" text-anchor="middle" fill="white" font-size="9" font-weight="bold">R Fender</text>
                      
                      <!-- Left Front Door -->
                      <rect x="90" y="115" width="50" height="80" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="left-front-door"/>
                      <text x="115" y="160" text-anchor="middle" fill="white" font-size="9" font-weight="bold">L F Door</text>
                      
                      <!-- Right Front Door -->
                      <rect x="160" y="115" width="50" height="80" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="right-front-door"/>
                      <text x="185" y="160" text-anchor="middle" fill="white" font-size="9" font-weight="bold">R F Door</text>
                      
                      <!-- Left Rear Door -->
                      <rect x="90" y="195" width="50" height="70" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="left-rear-door"/>
                      <text x="115" y="235" text-anchor="middle" fill="white" font-size="9" font-weight="bold">L R Door</text>
                      
                      <!-- Right Rear Door -->
                      <rect x="160" y="195" width="50" height="70" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="right-rear-door"/>
                      <text x="185" y="235" text-anchor="middle" fill="white" font-size="9" font-weight="bold">R R Door</text>
                      
                      <!-- Trunk -->
                      <rect x="70" y="265" width="160" height="35" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="trunk-main"/>
                      <text x="150" y="285" text-anchor="middle" fill="white" font-size="10" font-weight="bold">Trunk</text>
                      
                      <!-- Wheels -->
                      <circle cx="80" cy="320" r="15" fill="#6b7280" stroke="hsl(var(--border))" stroke-width="1" id="front-left-wheel"/>
                      <circle cx="220" cy="320" r="15" fill="#6b7280" stroke="hsl(var(--border))" stroke-width="1" id="front-right-wheel"/>
                    </g>
                    
                    <!-- Top View (위/후방) -->
                    <g transform="translate(400, 60)">
                      <text x="150" y="-5" text-anchor="middle" fill="hsl(var(--foreground))" font-size="14" font-weight="bold">Top View (위/후방)</text>
                      
                      <!-- Car outline from top -->
                      <path d="M80 50 L80 80 L50 100 L50 250 L80 270 L220 270 L250 250 L250 100 L220 80 L220 50 Z" 
                            fill="none" stroke="hsl(var(--border))" stroke-width="2"/>
                      
                      <!-- Roof -->
                      <rect x="80" y="50" width="140" height="220" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="5" id="roof-main"/>
                      <text x="150" y="165" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Roof</text>
                      
                      <!-- Windshield -->
                      <rect x="85" y="55" width="130" height="25" fill="#e5e7eb" stroke="hsl(var(--border))" stroke-width="1" rx="3"/>
                      <text x="150" y="72" text-anchor="middle" fill="black" font-size="9">Windshield</text>
                      
                      <!-- Rear Window -->
                      <rect x="85" y="240" width="130" height="25" fill="#e5e7eb" stroke="hsl(var(--border))" stroke-width="1" rx="3"/>
                      <text x="150" y="257" text-anchor="middle" fill="black" font-size="9">Rear Window</text>
                      
                      <!-- Side Mirrors -->
                      <rect x="65" y="85" width="15" height="10" fill="#6b7280" stroke="hsl(var(--border))" stroke-width="1" rx="2"/>
                      <rect x="220" y="85" width="15" height="10" fill="#6b7280" stroke="hsl(var(--border))" stroke-width="1" rx="2"/>
                      
                      <!-- Wheels positions -->
                      <rect x="40" y="90" width="20" height="40" fill="#374151" stroke="hsl(var(--border))" stroke-width="1" rx="3"/>
                      <rect x="240" y="90" width="20" height="40" fill="#374151" stroke="hsl(var(--border))" stroke-width="1" rx="3"/>
                      <rect x="40" y="190" width="20" height="40" fill="#374151" stroke="hsl(var(--border))" stroke-width="1" rx="3"/>
                      <rect x="240" y="190" width="20" height="40" fill="#374151" stroke="hsl(var(--border))" stroke-width="1" rx="3"/>
                    </g>
                    
                    <!-- Rear View -->
                    <g transform="translate(150, 370)">
                      <text x="100" y="-5" text-anchor="middle" fill="hsl(var(--foreground))" font-size="14" font-weight="bold">Rear View (뒤/후방)</text>
                      
                      <!-- Rear Bumper -->
                      <rect x="20" y="10" width="160" height="25" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="rear-bumper-main"/>
                      <text x="100" y="27" text-anchor="middle" fill="white" font-size="10" font-weight="bold">Rear Bumper</text>
                      
                      <!-- Quarter Panels -->
                      <rect x="10" y="35" width="35" height="50" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="left-quarter-panel"/>
                      <text x="27" y="65" text-anchor="middle" fill="white" font-size="9" font-weight="bold">L Quarter</text>
                      
                      <rect x="155" y="35" width="35" height="50" fill="#22c55e" stroke="hsl(var(--border))" stroke-width="1" rx="3" id="right-quarter-panel"/>
                      <text x="172" y="65" text-anchor="middle" fill="white" font-size="9" font-weight="bold">R Quarter</text>
                      
                      <!-- Rear Lights -->
                      <rect x="45" y="40" width="15" height="20" fill="#ef4444" stroke="hsl(var(--border))" stroke-width="1" rx="2"/>
                      <rect x="140" y="40" width="15" height="20" fill="#ef4444" stroke="hsl(var(--border))" stroke-width="1" rx="2"/>
                    </g>
                  </svg>
                </div>
                
                <div class="legend">
                  <div class="legend-item">
                    <div class="legend-color" style="background: hsl(142.1, 76.2%, 36.3%);"></div>
                    <span>Normal Condition</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: hsl(47.9, 95.8%, 53.1%);"></div>
                    <span>Repair/Welding Required</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: hsl(0, 84.2%, 60.2%);"></div>
                    <span>Exchange/Replacement</span>
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

          ${car.bid || car.final_bid || car.details?.original_price || car.insurance_v2?.preAccidentValue || car.insurance_v2?.wholesaleValue || car.insurance_v2?.actualCashValue ? `
          <div class="section">
            <div class="section-header">
              💰 Market Values & Pricing
            </div>
            <div class="section-content">
              <div class="info-grid">
                ${car.insurance_v2?.preAccidentValue ? `
                <div class="info-item">
                  <div class="info-label">Pre-Accident Value</div>
                  <div class="info-value">💎 $${car.insurance_v2.preAccidentValue.toLocaleString()}</div>
                </div>` : ''}
                ${car.insurance_v2?.wholesaleValue ? `
                <div class="info-item">
                  <div class="info-label">Wholesale Value</div>
                  <div class="info-value">🏪 $${car.insurance_v2.wholesaleValue.toLocaleString()}</div>
                </div>` : ''}
                ${car.insurance_v2?.actualCashValue ? `
                <div class="info-item">
                  <div class="info-label">Actual Cash Value</div>
                  <div class="info-value">💵 $${car.insurance_v2.actualCashValue.toLocaleString()}</div>
                </div>` : ''}
                ${car.bid ? `
                <div class="info-item">
                  <div class="info-label">Current Bid</div>
                  <div class="info-value">🎯 $${car.bid.toLocaleString()}</div>
                </div>` : ''}
                ${car.final_bid ? `
                <div class="info-item">
                  <div class="info-label">Final Bid</div>
                  <div class="info-value">🏆 $${car.final_bid.toLocaleString()}</div>
                </div>` : ''}
                ${car.insurance_v2?.estimatedRepairCost ? `
                <div class="info-item">
                  <div class="info-label">Estimated Repair Costs</div>
                  <div class="info-value">🔧 $${car.insurance_v2.estimatedRepairCost.toLocaleString()}</div>
                </div>` : ''}
                <div class="info-item">
                  <div class="info-label">KORAUTO Price</div>
                  <div class="info-value">🏷️ €${car.price.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>` : ''}

          <div class="section">
            <div class="section-header">
              📋 Source Information
            </div>
            <div class="section-content">
              <div class="info-grid">
                ${car.id || car.lot ? `
                <div class="info-item">
                  <div class="info-label">External ID</div>
                  <div class="info-value">🆔 ${car.id || car.lot || 'N/A'}</div>
                </div>` : ''}
                ${car.lot ? `
                <div class="info-item">
                  <div class="info-label">Lot Number</div>
                  <div class="info-value">🏷️ ${car.lot}</div>
                </div>` : ''}
                ${car.vin ? `
                <div class="info-item">
                  <div class="info-label">VIN Number</div>
                  <div class="info-value">🔍 ${car.vin}</div>
                </div>` : ''}
                ${car.seller ? `
                <div class="info-item">
                  <div class="info-label">Seller</div>
                  <div class="info-value">🏪 ${car.seller}</div>
                </div>` : ''}
                ${car.sale_date ? `
                <div class="info-item">
                  <div class="info-label">Sale Date</div>
                  <div class="info-value">📅 ${new Date(car.sale_date).toLocaleDateString()}</div>
                </div>` : ''}
                ${car.details?.created_at ? `
                <div class="info-item">
                  <div class="info-label">Last Updated</div>
                  <div class="info-value">🔄 ${new Date(car.details.created_at).toLocaleDateString()}</div>
                </div>` : ''}
                ${car.details?.auction_date ? `
                <div class="info-item">
                  <div class="info-label">Auction Date</div>
                  <div class="info-value">🏛️ ${new Date(car.details.auction_date).toLocaleDateString()}</div>
                </div>` : ''}
                ${car.location ? `
                <div class="info-item">
                  <div class="info-label">Location</div>
                  <div class="info-value">📍 ${car.location}</div>
                </div>` : ''}
              </div>
            </div>
          </div>

          <div class="contact-info">
            <h3 style="margin-bottom: 15px; font-size: 1.5rem;">📞 Contact KORAUTO</h3>
            <div class="info-grid" style="gap: 20px;">
              <div>
                <div style="font-weight: 600; margin-bottom: 5px;">WhatsApp</div>
                <div style="font-size: 1.2rem;">+383 48 181 116</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 5px;">Service</div>
                <div>Professional Import Service</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 5px;">Delivery</div>
                <div>Door to Port of Durres + €350 to Pristina</div>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Ensure DOM is loaded before executing scripts
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializePage);
          } else {
            initializePage();
          }
          
          function initializePage() {
            console.log('Initializing car details page...');
            
            // Apply colors to car parts
            const inspectionData = ${JSON.stringify(car.details?.inspect_outer || [])};
            console.log('Inspection data:', inspectionData);
            
            const parts = [
              'front-bumper', 'hood', 'front-fender-left', 'front-fender-right',
              'front-door-left', 'front-door-right', 'roof', 'rear-door-left',
              'rear-door-right', 'trunk', 'rear-bumper', 'quarter-panel-left',
              'quarter-panel-right'
            ];
            
            parts.forEach(partId => {
              const element = document.getElementById(partId);
              if (element) {
                const color = getPartColor(partId, inspectionData);
                element.setAttribute('fill', color);
                console.log('Applied color', color, 'to part', partId);
              } else {
                console.warn('Element not found:', partId);
              }
            });
          }
          
          function getPartColor(partCode, inspectionData) {
            const part = inspectionData.find(item => {
              const itemCode = item.type.code ? item.type.code.toLowerCase() : '';
              const itemTitle = item.type.title ? item.type.title.toLowerCase() : '';
              const searchCode = partCode.toLowerCase().replace(/-/g, '_');
              
              return itemCode.includes(searchCode) || 
                     itemTitle.includes(searchCode.replace('_', ' ')) ||
                     itemTitle.includes(searchCode.replace('_', '')) ||
                     (searchCode.includes('fender') && itemTitle.includes('fender')) ||
                     (searchCode.includes('door') && itemTitle.includes('door')) ||
                     (searchCode.includes('bumper') && itemTitle.includes('bumper'));
            });
            
            if (!part || !part.statusTypes || part.statusTypes.length === 0) {
              return '#22c55e'; // Normal - green
            }
            
            const hasExchange = part.statusTypes.some(status => status.code === 'X');
            const hasRepair = part.statusTypes.some(status => status.code === 'W');
            
            if (hasExchange) return '#ef4444'; // Exchange - red
            if (hasRepair) return '#f59e0b'; // Repair - orange
            return '#22c55e'; // Normal - green
          }
          
          function toggleOptions(type) {
            const hiddenDiv = document.getElementById(type + '-hidden');
            const toggleBtn = document.getElementById(type + '-toggle');
            
            if (hiddenDiv && toggleBtn) {
              if (hiddenDiv.style.display === 'none') {
                hiddenDiv.style.display = 'block';
                toggleBtn.textContent = 'Show less';
              } else {
                hiddenDiv.style.display = 'none';
                const count = hiddenDiv.children.length;
                toggleBtn.textContent = 'Show ' + count + ' more';
              }
            }
          }
          
          function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.classList.remove('light', 'dark');
            html.classList.add(newTheme);
            
            // Update toggle icon
            const toggle = document.getElementById('themeToggle');
            if (toggle) {
              if (newTheme === 'dark') {
                toggle.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>';
              } else {
                toggle.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>';
              }
            }
          }
      </body>
      </html>
    `;
  };

  const [isLiked, setIsLiked] = useState(false);
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "U hoq nga të preferuarat" : "U shtua në të preferuarat",
      description: isLiked ? "Makina u hoq nga lista juaj e të preferuarave" : "Makina u shtua në listën tuaj të të preferuarave",
      duration: 3000
    });
  };

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
            <h1 className="text-2xl font-bold text-foreground mb-2">Car Not Found</h1>
            <p className="text-muted-foreground">The car you're looking for could not be found.</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Gallery */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Image */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-[500px] bg-gradient-to-br from-muted to-muted/50 overflow-hidden group cursor-pointer" onClick={() => setIsImageZoomOpen(true)}>
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
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center text-foreground">
                    <Settings className="h-6 w-6 mr-3 text-primary" />
                    Specifikimet Teknike
                  </h3>
                  
                  {/* Small buttons beside title */}
                   <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        €{car.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        +350 euro deri ne Prishtine
                      </div>
                    </div>
                    <InspectionRequestForm 
                      trigger={
                        <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                </div>

                {/* Technical Details */}
                <Separator className="my-6" />
                <h4 className="text-lg font-semibold mb-4 text-foreground">Detaje Teknike</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center text-foreground">
                    <Info className="h-6 w-6 mr-3 text-primary" />
                    Informacione të Detajuara
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const detailsWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                      if (detailsWindow) {
                        const htmlContent = generateDetailedInfoHTML(car);
                        detailsWindow.document.write(htmlContent);
                        detailsWindow.document.close(); // Important: close the document stream
                        detailsWindow.document.title = `${car.year} ${car.make} ${car.model} - Detailed Information`;
                      }
                    }}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Shiko Detajet
                    <ChevronDown className="h-4 w-4 ml-2" />
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
                    {car.details?.options && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Pajisjet dhe Opsionet
                        </h4>
                        {car.details.options.standard && car.details.options.standard.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Pajisje Standarde:</h5>
                            <div className="flex flex-wrap gap-2">
                              {car.details.options.standard.map((option, index) => (
                                <Badge key={index} variant="outline">{option}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {car.details.options.choice && car.details.options.choice.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Pajisje Opsionale:</h5>
                            <div className="flex flex-wrap gap-2">
                              {car.details.options.choice.map((option, index) => (
                                <Badge key={index} variant="secondary">{option}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
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

            {/* Enhanced Information Tabs */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-10">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-20 lg:h-16 bg-muted/30 p-2 rounded-xl gap-2">
                    <TabsTrigger value="overview" className="rounded-lg text-sm md:text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all px-3 py-3 text-center leading-tight min-h-[3.5rem] flex items-center justify-center">
                      <span className="whitespace-nowrap">Përshkrimi</span>
                    </TabsTrigger>
                    <TabsTrigger value="maintenance" className="rounded-lg text-sm md:text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all px-3 py-3 text-center leading-tight min-h-[3.5rem] flex items-center justify-center">
                      <span className="whitespace-nowrap">Mirëmbajtja</span>
                    </TabsTrigger>
                    <TabsTrigger value="inspection" className="rounded-lg text-sm md:text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all px-3 py-3 text-center leading-tight min-h-[3.5rem] flex items-center justify-center">
                      <span className="whitespace-nowrap">Inspektimi</span>
                    </TabsTrigger>
                    <TabsTrigger value="similar" className="rounded-lg text-sm md:text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all px-3 py-3 text-center leading-tight min-h-[3.5rem] flex items-center justify-center">
                      <span className="whitespace-nowrap">Të Ngjashme</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-8">
                    <div className="space-y-6">
                      {/* Collapsible Features Section */}
                      <Collapsible open={featuresExpanded} onOpenChange={setFeaturesExpanded}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg text-foreground">Karakteristikat</h4>
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:text-primary-foreground hover:bg-primary"
                            >
                              <span className="mr-2">
                                {featuresExpanded 
                                  ? `Fshih të gjitha (${(car.features?.length || 0) + (car.safety_features?.length || 0) + (car.comfort_features?.length || 0)})` 
                                  : `Shiko të gjitha (${(car.features?.length || 0) + (car.safety_features?.length || 0) + (car.comfort_features?.length || 0)})`
                                }
                              </span>
                              {featuresExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        
                        {/* Always show first few features */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {car.features?.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-sm text-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <CollapsibleContent className="space-y-6">
                          {/* Remaining main features */}
                          {car.features && car.features.length > 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {car.features.slice(4).map((feature, index) => (
                                <div key={index + 4} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                  <span className="text-sm text-foreground">{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Safety Features */}
                          {car.safety_features && car.safety_features.length > 0 && (
                            <>
                              <h5 className="font-semibold text-md text-foreground mt-6">Karakteristikat e Sigurisë</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {car.safety_features.map((feature, index) => (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                    <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-sm text-foreground">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          
                          {/* Comfort Features */}
                          {car.comfort_features && car.comfort_features.length > 0 && (
                            <>
                              <h5 className="font-semibold text-md text-foreground mt-6">Karakteristikat e Komforit</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {car.comfort_features.map((feature, index) => (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                    <Star className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span className="text-sm text-foreground">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="maintenance" className="mt-8">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg text-foreground">Historia e Mirëmbajtjes & Sigurisë</h4>
                      
                      {/* Maintenance History from API */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-foreground">Regjistrimet e Mirëmbajtjes:</h5>
                        {car.grade_iaai && (
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <div className="flex items-center gap-3">
                              <Star className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-foreground">Vlerësimi IAAI</span>
                            </div>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{car.grade_iaai}</span>
                          </div>
                        )}
                        
                        {car.condition && (
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-sm text-foreground">Gjendja e Përgjithshme</span>
                            </div>
                            <span className="text-xs text-muted-foreground capitalize">{car.condition.replace('_', ' ')}</span>
                          </div>
                        )}

                        {car.keys_available !== undefined && (
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-3">
                              <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-sm text-foreground">Çelësat e Disponueshëm</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{car.keys_available ? 'Po' : 'Jo'}</span>
                          </div>
                        )}

                        {car.odometer?.status && (
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-3">
                              <Gauge className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-foreground">Statusi i Kilometrave</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{car.odometer.status.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Insurance/Safety Information */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-foreground">Informacionet e Sigurisë:</h5>
                        
                        {car.airbags && (
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <div className="flex items-center gap-3">
                              <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-foreground">Sistemi i Airbag-ëve</span>
                            </div>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{car.airbags}</span>
                          </div>
                        )}

                        {car.sale_date && (
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              <span className="text-sm text-foreground">Data e Shitjes</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(car.sale_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Verifikuar nga KORAUTO</span>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                          Të gjitha informacionet e mësipërme janë verifikuar nga sistemi ynë professional i inspektimit.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="inspection" className="mt-8">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg text-foreground">Raporti i Inspektimit KORAUTO</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                          <Star className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">9.2/10</div>
                          <div className="text-xs text-emerald-700 dark:text-emerald-300">Vlerësimi i Përgjithshëm</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                          <div className="font-semibold text-blue-600 dark:text-blue-400">Excellent</div>
                          <div className="text-xs text-blue-700 dark:text-blue-300">Gjendja e Motorit</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                          <div className="font-semibold text-purple-600 dark:text-purple-400">Verified</div>
                          <div className="text-xs text-purple-700 dark:text-purple-300">Dokumentacioni</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h5 className="font-medium text-foreground">Kontrollet e Kryera:</h5>
                        {[
                          'Kontrolli i motorit dhe transmisionit',
                          'Sistemi i frënimit dhe pezullimit',
                          'Sistemet elektrike dhe elektronike',
                          'Karoseria dhe ngjyra',
                          'Interiori dhe pajisjet',
                          'Dokumentacioni dhe historia'
                        ].map((check, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{check}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="similar" className="mt-8">
                    <SimilarCarsTab carMake={car.make} carModel={car.model} currentCarId={car.id} />
                  </TabsContent>
                </Tabs>
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
};

export default CarDetails;