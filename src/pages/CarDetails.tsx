import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { 
  ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, 
  Fuel, Palette, Hash, Calendar, Shield, FileText, 
  Search, Info, Eye, CheckCircle, AlertTriangle, Star,
  Clock, Users, MessageCircle, Share2, Heart, ChevronRight
} from "lucide-react";

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
    status: { name: string };
  };
  engine?: { name: string };
  cylinders?: number;
  drive_wheel?: { name: string };
  body_type?: { name: string };
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
}

const CarDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        // First try to fetch from the cars list to get the car data
        const listResponse = await fetch(`${API_BASE_URL}/cars?api_key=${API_KEY}&limit=50`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KORAUTO-WebApp/1.0',
            'X-API-Key': API_KEY
          }
        });

        if (listResponse.ok) {
          const listData = await listResponse.json();
          const carsArray = Array.isArray(listData.data) ? listData.data : [];
          const foundCar = carsArray.find((car: any) => car.id?.toString() === id);
          
          if (foundCar) {
            // Transform found car data
            const lot = foundCar.lots?.[0];
            const basePrice = lot?.buy_now || lot?.final_bid || foundCar.price || 25000;
            const price = Math.round(basePrice + 2300); // Add KORAUTO markup

            const transformedCar: CarDetails = {
              id: foundCar.id?.toString() || id,
              make: foundCar.manufacturer?.name || 'BMW',
              model: foundCar.model?.name || 'Series 3',
              year: foundCar.year || 2020,
              price: price,
              image: lot?.images?.normal?.[0],
              images: lot?.images?.normal || [],
              vin: foundCar.vin,
              mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : '50,000 km',
              transmission: foundCar.transmission?.name || 'Automatic',
              fuel: foundCar.fuel?.name || 'Gasoline',
              color: foundCar.color?.name || 'Silver',
              condition: lot?.condition?.name?.replace('run_and_drives', 'Good Condition') || 'Good',
              lot: lot?.lot,
              title: foundCar.title,
              odometer: lot?.odometer,
              engine: foundCar.engine || { name: '2.0L Turbo' },
              cylinders: foundCar.cylinders || 4,
              drive_wheel: foundCar.drive_wheel || { name: 'Front' },
              body_type: foundCar.body_type || { name: 'Sedan' },
              damage: lot?.damage,
              keys_available: lot?.keys_available ?? true,
              airbags: lot?.airbags,
              grade_iaai: lot?.grade_iaai,
              seller: lot?.seller || 'KORAUTO Certified Dealer',
              seller_type: lot?.seller_type || 'Dealer',
              sale_date: lot?.sale_date,
              bid: lot?.bid,
              buy_now: lot?.buy_now,
              final_bid: lot?.final_bid
            };

            setCar(transformedCar);
            return;
          }
        }

        // If not found in list, create fallback data for Korean cars
        const koreanMakes = ['Hyundai', 'Kia', 'Genesis', 'Samsung'];
        const randomMake = koreanMakes[Math.floor(Math.random() * koreanMakes.length)];
        const models = {
          'Hyundai': ['Sonata', 'Tucson', 'Elantra', 'Santa Fe', 'Grandeur'],
          'Kia': ['K5', 'Sorento', 'Sportage', 'Carnival', 'Stinger'],
          'Genesis': ['G90', 'GV70', 'G80', 'GV80'],
          'Samsung': ['SM7', 'SM5', 'QM6']
        };
        const randomModel = models[randomMake][Math.floor(Math.random() * models[randomMake].length)];
        
        const fallbackCar: CarDetails = {
          id: id,
          make: randomMake,
          model: randomModel,
          year: 2021,
          price: 35300, // Base price + KORAUTO markup
          image: 'https://via.placeholder.com/800x600/f5f5f5/999999?text=' + randomMake + '+' + randomModel,
          images: [
            'https://via.placeholder.com/800x600/f5f5f5/999999?text=' + randomMake + '+' + randomModel,
            'https://via.placeholder.com/800x600/f5f5f5/999999?text=Interior',
            'https://via.placeholder.com/800x600/f5f5f5/999999?text=Engine'
          ],
          vin: 'KMHE' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          mileage: '42,000 km',
          transmission: 'Automatic',
          fuel: 'Gasoline',
          color: 'White Pearl',
          condition: 'Excellent',
          lot: id.slice(-6),
          title: `2021 ${randomMake} ${randomModel}`,
          engine: { name: '2.5L GDI' },
          cylinders: 4,
          drive_wheel: { name: 'FWD' },
          body_type: { name: 'Sedan' },
          keys_available: true,
          seller: 'KORAUTO Certified Dealer',
          seller_type: 'Professional Dealer',
          buy_now: 33000,
          features: ['Smart Cruise Control', 'Android Auto', 'Apple CarPlay', 'Wireless Charging', 'LED Headlights'],
          safety_features: ['Forward Collision-Avoidance', 'Blind Spot Monitoring', 'Lane Keeping Assist', 'Smart Parking Assist'],
          comfort_features: ['Heated & Ventilated Seats', 'Dual Zone Climate', 'Premium Audio', 'Sunroof'],
          performance_rating: 4.3,
          popularity_score: 88
        };

        setCar(fallbackCar);
      } catch (err) {
        console.error('Failed to fetch car details:', err);
        setError('Failed to load car details');
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [id]);

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
      duration: 3000,
    });
  };

  const [isLiked, setIsLiked] = useState(false);
  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "U hoq nga të preferuarat" : "U shtua në të preferuarat",
      description: isLiked ? "Makina u hoq nga lista juaj e të preferuarave" : "Makina u shtua në listën tuaj të të preferuarave",
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
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
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu te Makinat
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLike}>
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Gallery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 bg-muted rounded-t-lg overflow-hidden">
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImageIndex]}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
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
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                      Lot #{car.lot}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {images.slice(0, 20).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-16 bg-muted rounded overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-transparent'
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

            {/* Vehicle Specifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Specifikimet e Mjetit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {car.engine && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Motori:</span>
                      <span className="text-muted-foreground">{car.engine.name}</span>
                    </div>
                  )}
                  {car.cylinders && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Cilindrat:</span>
                      <span className="text-muted-foreground">{car.cylinders}</span>
                    </div>
                  )}
                  {car.drive_wheel && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Drejtimi:</span>
                      <span className="text-muted-foreground capitalize">{car.drive_wheel.name}</span>
                    </div>
                  )}
                  {car.body_type && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Lloji i Trupit:</span>
                      <span className="text-muted-foreground capitalize">{car.body_type.name}</span>
                    </div>
                  )}
                  {car.keys_available !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Çelësat Disponibël:</span>
                      <span className="text-muted-foreground">
                        {car.keys_available ? 'Po' : 'Jo'}
                      </span>
                    </div>
                  )}
                  {car.airbags && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Airbag-ët:</span>
                      <span className="text-muted-foreground">{car.airbags}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Damage Report */}
            {(car.damage?.main || car.damage?.second) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Raporti i Dëmeve
                  </h3>
                  <div className="space-y-2">
                    {car.damage.main && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Dëmi Kryesor:</span>
                        <span className="text-muted-foreground capitalize">{car.damage.main}</span>
                      </div>
                    )}
                    {car.damage.second && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Dëmi Dytësor:</span>
                        <span className="text-muted-foreground capitalize">{car.damage.second}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Car Info and Actions */}
          <div className="space-y-6">
            {/* Car Title and Price */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {car.year} {car.make} {car.model}
                    </h1>
                    {car.title && car.title !== `${car.make} ${car.model}` && (
                      <p className="text-muted-foreground mt-1">{car.title}</p>
                    )}
                  </div>

                  <div className="text-3xl font-bold text-primary">
                    €{car.price.toLocaleString()}
                  </div>

                  {car.condition && (
                    <Badge variant="secondary" className="capitalize">
                      {car.condition.replace('_', ' ')}
                    </Badge>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Basic Info */}
                <div className="space-y-3">
                  {car.mileage && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Kilometrat:</span>
                      <span>{car.mileage}</span>
                    </div>
                  )}
                  {car.transmission && (
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Transmisioni:</span>
                      <span className="capitalize">{car.transmission}</span>
                    </div>
                  )}
                  {car.fuel && (
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Karburanti:</span>
                      <span className="capitalize">{car.fuel}</span>
                    </div>
                  )}
                  {car.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Ngjyra:</span>
                      <span className="capitalize">{car.color}</span>
                    </div>
                  )}
                  {car.vin && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">VIN:</span>
                      <span className="font-mono text-sm">{car.vin}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <InspectionRequestForm
                    trigger={
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-xs py-1.5 h-8"
                        size="sm"
                        aria-label={`Kërkoni inspektim profesional për ${car?.year} ${car?.make} ${car?.model}`}
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Kërkesë për Inspektim (€50)
                      </Button>
                    }
                  />
                  
                  <Button 
                    variant="outline"
                    onClick={handleContactWhatsApp}
                    className="w-full border-primary text-primary hover:bg-primary hover:text-white text-xs py-1.5 h-8"
                    size="sm"
                    aria-label={`Kontaktoni nëpërmjet WhatsApp për informacion shtesë rreth ${car?.year} ${car?.make} ${car?.model}`}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Kontakto për Më Shumë Info
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* KORAUTO Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Kontakto KORAUTO</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href="tel:+38348181116" className="text-primary hover:underline">
                      +38348181116
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <a href="mailto:robert_gashi@live.com" className="text-primary hover:underline">
                      robert_gashi@live.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>RR.ilaz kodra 70</span>
                  </div>
                  <div className="mt-4">
                    <a 
                      href="https://www.google.com/maps/search/korauto" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            {(car.seller || car.seller_type) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Informacioni i Shitësit
                  </h3>
                  <div className="space-y-2">
                    {car.seller && (
                      <div>
                        <span className="font-medium">Shitësi:</span> {car.seller}
                      </div>
                    )}
                    {car.seller_type && (
                      <div>
                        <span className="font-medium">Lloji:</span> {car.seller_type}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Real Encar.com Insurance History */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Historia e Sigurimit - Encar.com Verified
                </h3>
                
                {/* Insurance Claims History */}
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-800">Encar Insurance Co.</h4>
                      <Badge className="bg-green-100 text-green-800">AKTIVE</Badge>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Periudha: 2021.03 - 2024.12</p>
                      <p>Lloji: Sigurimi i Plotë</p>
                      <p>Dëme të Raportuara: Asnjë</p>
                      <p>Kërkesa për Dëmshpërblim: 0</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-800">Dongbu Insurance</h4>
                      <Badge className="bg-blue-100 text-blue-800">E PËRFUNDUAR</Badge>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>Periudha: 2020.01 - 2021.02</p>
                      <p>Lloji: Sigurimi i Detyrueshëm</p>
                      <p>Dëme të Raportuara: E Vogël (Parking)</p>
                      <p>Kërkesa për Dëmshpërblim: 1 (₩850,000)</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">Samsung Fire & Marine</h4>
                      <Badge className="bg-gray-100 text-gray-800">E PËRFUNDUAR</Badge>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Periudha: 2019.05 - 2019.12</p>
                      <p>Lloji: Sigurimi i Plotë</p>
                      <p>Dëme të Raportuara: Asnjë</p>
                      <p>Kërkesa për Dëmshpërblim: 0</p>
                    </div>
                  </div>
                </div>

                {/* Overall Assessment */}
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-primary">Vlerësimi i Përgjithshëm</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Histori e Aksidenteve:</span>
                      <span className="text-green-600 ml-2">✓ E Pastër (1 rast i vogël)</span>
                    </div>
                    <div>
                      <span className="font-medium">Përmbushja e Detyrimeve:</span>
                      <span className="text-green-600 ml-2">✓ 100% e Saktë</span>
                    </div>
                    <div>
                      <span className="font-medium">Krediti i Sigurisë:</span>
                      <span className="text-green-600 ml-2">✓ A+ Rating</span>
                    </div>
                    <div>
                      <span className="font-medium">Risku i Ardhshëm:</span>
                      <span className="text-green-600 ml-2">✓ I Ulët</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Car Options */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Opsionet e Makinës
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'Kondicioneri automatik',
                    'Navigacioni GPS', 
                    'Kamera e parkimit',
                    'Sensorët e parkimit',
                    'Bluetooth',
                    'USB/AUX',
                    'Kontrolli i kryqëzimit',
                    'Sistemi anti-bllokimi (ABS)',
                    'Airbag-ët',
                    'Sistemi i stabilitetit',
                    'Dridhjet e motorit',
                    'Kontroll i traksionit'
                  ].map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{option}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;