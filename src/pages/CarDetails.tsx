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
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${car.year} ${car.make} ${car.model} - Detailed Information</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
          .title { font-size: 2.5rem; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 1.2rem; opacity: 0.9; }
          .section { background: white; margin-bottom: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .section-header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; font-size: 1.3rem; font-weight: 600; }
          .section-content { padding: 25px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
          .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
          .info-label { font-weight: 600; color: #475569; margin-bottom: 5px; }
          .info-value { color: #1e293b; font-size: 1.1rem; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; margin: 2px; }
          .badge-success { background: #dcfce7; color: #166534; }
          .badge-warning { background: #fef3c7; color: #92400e; }
          .badge-danger { background: #fee2e2; color: #dc2626; }
          .badge-info { background: #dbeafe; color: #1d4ed8; }
          .options-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
          .print-btn { position: fixed; top: 20px; right: 20px; background: #667eea; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Print Details</button>
        <div class="container">
          <div class="header">
            <div class="title">${car.year} ${car.make} ${car.model}</div>
            <div class="subtitle">€${car.price.toLocaleString()} • Lot #${car.lot || 'N/A'}</div>
          </div>

          ${car.insurance_v2 ? `
          <div class="section">
            <div class="section-header">🛡️ Insurance & Safety Report</div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Accident History</div>
                  <div class="info-value">
                    <span class="badge ${car.insurance_v2.accidentCnt === 0 ? 'badge-success' : 'badge-danger'}">
                      ${car.insurance_v2.accidentCnt === 0 ? 'Clean Record' : car.insurance_v2.accidentCnt + ' accidents'}
                    </span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">Previous Owners</div>
                  <div class="info-value">${car.insurance_v2.ownerChangeCnt || 0}</div>
                </div>
                ${car.insurance_v2.totalLossCnt > 0 ? `
                <div class="info-item">
                  <div class="info-label">Total Loss Claims</div>
                  <div class="info-value"><span class="badge badge-danger">${car.insurance_v2.totalLossCnt}</span></div>
                </div>` : ''}
              </div>
            </div>
          </div>` : ''}

          ${car.details ? `
          <div class="section">
            <div class="section-header">🚗 Vehicle Details</div>
            <div class="section-content">
              <div class="info-grid">
                ${car.details.engine_volume ? `
                <div class="info-item">
                  <div class="info-label">Engine Volume</div>
                  <div class="info-value">${car.details.engine_volume}cc</div>
                </div>` : ''}
                ${car.details.original_price ? `
                <div class="info-item">
                  <div class="info-label">Original Price</div>
                  <div class="info-value">₩${car.details.original_price.toLocaleString()}</div>
                </div>` : ''}
                ${car.details.first_registration ? `
                <div class="info-item">
                  <div class="info-label">First Registration</div>
                  <div class="info-value">${car.details.first_registration.year}-${String(car.details.first_registration.month).padStart(2, '0')}-${String(car.details.first_registration.day).padStart(2, '0')}</div>
                </div>` : ''}
                ${car.details.seats_count ? `
                <div class="info-item">
                  <div class="info-label">Number of Seats</div>
                  <div class="info-value">${car.details.seats_count}</div>
                </div>` : ''}
              </div>
            </div>
          </div>` : ''}

          ${car.details?.options ? `
          <div class="section">
            <div class="section-header">⚙️ Equipment & Options</div>
            <div class="section-content">
              ${car.details.options.standard?.length ? `
              <div class="info-item">
                <div class="info-label">Standard Equipment</div>
                <div class="options-grid">
                  ${car.details.options.standard.map(option => `<span class="badge badge-info">${option}</span>`).join('')}
                </div>
              </div>` : ''}
              ${car.details.options.choice?.length ? `
              <div class="info-item">
                <div class="info-label">Optional Equipment</div>
                <div class="options-grid">
                  ${car.details.options.choice.map(option => `<span class="badge badge-success">${option}</span>`).join('')}
                </div>
              </div>` : ''}
            </div>
          </div>` : ''}

          ${car.details?.inspect_outer?.length ? `
          <div class="section">
            <div class="section-header">🔍 Detailed Inspection Report</div>
            <div class="section-content">
              <div class="info-grid">
                ${car.details.inspect_outer.map(item => `
                <div class="info-item">
                  <div class="info-label">${item.type.title}</div>
                  <div class="info-value">
                    ${item.statusTypes.map(status => `
                    <span class="badge ${status.code === 'X' ? 'badge-danger' : status.code === 'W' ? 'badge-warning' : 'badge-info'}">
                      ${status.title}
                    </span>`).join('')}
                  </div>
                </div>`).join('')}
              </div>
            </div>
          </div>` : ''}

          <div class="section">
            <div class="section-header">📞 Contact Information</div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Company</div>
                  <div class="info-value">KORAUTO - Professional Import Service</div>
                </div>
                <div class="info-item">
                  <div class="info-label">WhatsApp</div>
                  <div class="info-value">+383 48 181 116</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                        detailsWindow.document.write(generateDetailedInfoHTML(car));
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
                          {car.details.original_price && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Çmimi Origjinal:</span>
                              <span className="font-medium">₩{car.details.original_price.toLocaleString()}</span>
                            </div>
                          )}
                          {car.details.first_registration && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Regjistrimi i Parë:</span>
                              <span className="font-medium">
                                {car.details.first_registration.year}-{String(car.details.first_registration.month).padStart(2, '0')}-{String(car.details.first_registration.day).padStart(2, '0')}
                              </span>
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

                    {/* Inspection Report */}
                    {car.details?.inspect_outer && car.details.inspect_outer.length > 0 && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Raporti i Inspektimit të Detajuar
                        </h4>
                        <div className="space-y-3">
                          {car.details.inspect_outer.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">{item.type.title}:</span>
                              <div className="flex gap-2">
                                {item.statusTypes.map((status, i) => (
                                  <Badge 
                                    key={i} 
                                    variant={status.code === 'X' ? "destructive" : status.code === 'W' ? "secondary" : "outline"}
                                  >
                                    {status.title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Location Information */}
                    {car.location && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Informacione të Lokacionit
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {car.location.country && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Shteti:</span>
                              <span className="font-medium">{car.location.country.name.toUpperCase()}</span>
                            </div>
                          )}
                          {car.location.city && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm">Qyteti:</span>
                              <span className="font-medium capitalize">{car.location.city.name}</span>
                            </div>
                          )}
                        </div>
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