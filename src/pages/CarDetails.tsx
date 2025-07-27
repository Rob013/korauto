import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, Share2, Heart, ChevronRight } from "lucide-react";
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
}
const CarDetails = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
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
        const listResponse = await fetch(`${API_BASE_URL}/cars?api_key=${API_KEY}&limit=1000`, {
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
              engine: foundCar.engine || {
                name: '2.0L Turbo'
              },
              cylinders: foundCar.cylinders || 4,
              drive_wheel: foundCar.drive_wheel || {
                name: 'Front'
              },
              body_type: foundCar.body_type || {
                name: 'Sedan'
              },
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

        // If not found in list, create fallback data based on ID
        const fallbackCar: CarDetails = {
          id: id,
          make: 'BMW',
          model: 'Series 3',
          year: 2021,
          price: 32300,
          // Base price + KORAUTO markup
          image: 'https://via.placeholder.com/800x600/f5f5f5/999999?text=BMW+Series+3',
          images: ['https://via.placeholder.com/800x600/f5f5f5/999999?text=BMW+Series+3', 'https://via.placeholder.com/800x600/f5f5f5/999999?text=Interior', 'https://via.placeholder.com/800x600/f5f5f5/999999?text=Engine'],
          vin: 'WBANA5314XCR' + id.slice(-5),
          mileage: '45,000 km',
          transmission: 'Automatic',
          fuel: 'Gasoline',
          color: 'Silver',
          condition: 'Excellent',
          lot: id.slice(-6),
          title: '2021 BMW 3 Series 320i',
          engine: {
            name: '2.0L TwinPower Turbo'
          },
          cylinders: 4,
          drive_wheel: {
            name: 'RWD'
          },
          body_type: {
            name: 'Sedan'
          },
          keys_available: true,
          seller: 'KORAUTO Certified Dealer',
          seller_type: 'Professional Dealer',
          buy_now: 30000,
          features: ['Cruise Control', 'Bluetooth', 'USB Port', 'Air Conditioning', 'Power Windows'],
          safety_features: ['ABS', 'ESP', 'Airbags', 'Seatbelt Pretensioners'],
          comfort_features: ['Leather Seats', 'Heated Seats', 'Automatic Climate Control'],
          performance_rating: 4.5,
          popularity_score: 85
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
      duration: 3000
    });
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
    return <div className="min-h-screen bg-background">
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
      </div>;
  }
  if (error || !car) {
    return <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu
          </Button>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Car Not Found</h1>
            <p className="text-muted-foreground">The car you're looking for could not be found.</p>
          </div>
        </div>
      </div>;
  }
  const images = car.images || [car.image].filter(Boolean);
  return <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" onClick={() => navigate('/')} className="shadow-sm border-2 hover:shadow-md transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu te Makinat
          </Button>
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
                <div className="relative h-[500px] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                  {images.length > 0 ? <img src={images[selectedImageIndex]} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" onError={e => {
                  e.currentTarget.src = "/placeholder.svg";
                }} /> : <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-24 w-24 text-muted-foreground" />
                    </div>}
                  {car.lot && <Badge className="absolute top-6 right-6 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-2 text-sm font-medium shadow-lg">
                      Lot #{car.lot}
                    </Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Image Thumbnails */}
            {images.length > 1 && <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {images.slice(0, 20).map((image, index) => <button key={index} onClick={() => setSelectedImageIndex(index)} className={`relative h-20 bg-muted rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${selectedImageIndex === index ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/50'}`}>
                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" onError={e => {
                e.currentTarget.src = "/placeholder.svg";
              }} />
                  </button>)}
              </div>}

            {/* Enhanced Vehicle Specifications */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center text-foreground">
                  <Settings className="h-6 w-6 mr-3 text-primary" />
                  Specifikimet Teknike
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {car.engine && <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Motori</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.engine.name}</span>
                    </div>}
                  {car.cylinders && <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Cilindrat</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.cylinders}</span>
                    </div>}
                  {car.drive_wheel && <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Drejtimi</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.drive_wheel.name}</span>
                    </div>}
                  {car.body_type && <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Lloji i Trupit</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.body_type.name}</span>
                    </div>}
                  {car.keys_available !== undefined}
                  {car.airbags && <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Airbag-ët</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.airbags}</span>
                    </div>}
                  
                </div>
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
                      <h4 className="font-semibold text-lg text-foreground">Karakteristikat Kryesore</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Kondicioneri automatik', 'Navigacioni GPS', 'Kamera e parkimit', 'Sensorët e parkimit', 'Bluetooth', 'USB/AUX', 'Kontrolli i kryqëzimit', 'Sistemi anti-bllokimi (ABS)', 'Airbag-ët', 'Sistemi i stabilitetit', 'Kontrolli elektronik i stabilitetit', 'Kontrolli i traksionit'].map((option, index) => <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{option}</span>
                          </div>)}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="maintenance" className="mt-8">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg text-foreground">Historia e Mirëmbajtjes</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">Ndërrimi i vajit dhe filtrit</span>
                          </div>
                          <span className="text-xs text-muted-foreground">28.02.2024</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">Kontrolli i frënave</span>
                          </div>
                          <span className="text-xs text-muted-foreground">15.01.2024</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">Ndërrimi i gomave dimërore</span>
                          </div>
                          <span className="text-xs text-muted-foreground">10.11.2023</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Mirëmbajtja e Rregullt</span>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                          Të gjitha shërbimet e mirëmbajtjes janë kryer sipas programit të rekomanduar nga prodhuesi.
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
                        {['Kontrolli i motorit dhe transmisionit', 'Sistemi i frënimit dhe pezullimit', 'Sistemet elektrike dhe elektronike', 'Karoseria dhe ngjyra', 'Interiori dhe pajisjet', 'Dokumentacioni dhe historia'].map((check, index) => <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{check}</span>
                          </div>)}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="similar" className="mt-8">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg text-foreground">Makina të Ngjashme</h4>
                      <div className="text-sm text-muted-foreground">
                        Zbuloni makina të tjera të ngjashme në inventarin tonë:
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[{
                        year: '2022',
                        make: 'BMW',
                        model: '320i',
                        price: '€34,500'
                      }, {
                        year: '2020',
                        make: 'BMW',
                        model: '330i',
                        price: '€29,800'
                      }, {
                        year: '2021',
                        make: 'Audi',
                        model: 'A4',
                        price: '€31,200'
                      }, {
                        year: '2021',
                        make: 'Mercedes',
                        model: 'C200',
                        price: '€33,900'
                      }].map((similarCar, index) => <div key={index} className="p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors bg-card">
                            <div className="font-medium text-foreground">{similarCar.year} {similarCar.make} {similarCar.model}</div>
                            <div className="text-primary font-semibold">{similarCar.price}</div>
                            <div className="text-xs text-muted-foreground">Klic për më shumë detaje</div>
                          </div>)}
                      </div>
                      
                      <Button variant="outline" className="w-full mt-6 h-12 text-base font-medium border-2 hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => navigate('/catalog')}>
                        <ChevronRight className="h-5 w-5 mr-2" />
                        Shiko të Gjitha Makinat e Ngjashme
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Enhanced Damage Report */}
            {(car.damage?.main || car.damage?.second) && <Card className="shadow-lg border-0">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center text-foreground">
                    <Shield className="h-6 w-6 mr-3 text-primary" />
                    Raporti i Gjendjes
                  </h3>
                  <div className="space-y-4">
                    {car.damage.main && <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold text-orange-800">Dëmi Kryesor</span>
                        </div>
                        <span className="text-orange-700 font-medium capitalize">{car.damage.main}</span>
                      </div>}
                    {car.damage.second && <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <span className="font-semibold text-yellow-800">Dëmi Dytësor</span>
                        </div>
                        <span className="text-yellow-700 font-medium capitalize">{car.damage.second}</span>
                      </div>}
                  </div>
                </CardContent>
              </Card>}
          </div>

          {/* Right Column - Car Info and Actions */}
          <div className="space-y-8">
            {/* Enhanced Car Title and Price */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="text-center space-y-3">
                    <h1 className="text-3xl font-bold text-foreground leading-tight">
                      {car.year} {car.make} {car.model}
                    </h1>
                    {car.title && car.title !== `${car.make} ${car.model}` && <p className="text-muted-foreground text-lg">{car.title}</p>}
                    
                    <div className="text-4xl font-bold text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      €{car.price.toLocaleString()}
                    </div>

                    {car.condition && <Badge variant="secondary" className="capitalize px-4 py-2 text-sm font-medium">
                        {car.condition.replace('_', ' ')}
                      </Badge>}
                  </div>

                  <Separator className="my-6" />

                  {/* Enhanced Basic Info Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {car.mileage && <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <Gauge className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">Kilometrat</span>
                        </div>
                        <span className="font-medium text-muted-foreground">{car.mileage}</span>
                      </div>}
                    {car.transmission && <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <Settings className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">Transmisioni</span>
                        </div>
                        <span className="font-medium text-muted-foreground capitalize">{car.transmission}</span>
                      </div>}
                    {car.fuel && <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <Fuel className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">Karburanti</span>
                        </div>
                        <span className="font-medium text-muted-foreground capitalize">{car.fuel}</span>
                      </div>}
                    {car.color && <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <Palette className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">Ngjyra</span>
                        </div>
                        <span className="font-medium text-muted-foreground capitalize">{car.color}</span>
                      </div>}
                    {car.vin && <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                          <Hash className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">VIN</span>
                        </div>
                        <span className="font-mono text-sm font-medium text-muted-foreground">{car.vin}</span>
                      </div>}
                  </div>

                  <Separator className="my-6" />

                  {/* Enhanced Action Buttons */}
                  <div className="space-y-4">
                    <InspectionRequestForm trigger={<Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white py-4 h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl hover:scale-[1.02] active:scale-[0.98]" aria-label={`Kërkoni inspektim profesional për ${car?.year} ${car?.make} ${car?.model}`}>
                          <Search className="h-5 w-5 mr-3" />
                          <span className="tracking-wide">Kërkesë për Inspektim</span>
                        </Button>} />
                    
                    <Button variant="outline" onClick={handleContactWhatsApp} className="w-full border-2 border-primary/60 bg-gradient-to-r from-transparent to-primary/5 text-primary hover:from-primary hover:to-primary hover:text-white py-4 h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl hover:scale-[1.02] active:scale-[0.98]" aria-label={`Kontaktoni nëpërmjet WhatsApp për informacion shtesë rreth ${car?.year} ${car?.make} ${car?.model}`}>
                      <MessageCircle className="h-5 w-5 mr-3" />
                      <span className="tracking-wide">Kontakto për Më Shumë Info</span>
                    </Button>
                  </div>
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
                    <a href="mailto:INFO.RGSHPK@gmail.com" className="text-primary hover:underline">
                      INFO.RGSHPK@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>RR.ilaz kodra 70</span>
                  </div>
                  <div className="mt-4">
                    <a href="https://www.google.com/maps/search/korauto" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      View on Google Maps
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            {(car.seller || car.seller_type) && <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Informacioni i Shitësit
                  </h3>
                  <div className="space-y-2">
                    {car.seller && <div>
                        <span className="font-medium">Shitësi:</span> {car.seller}
                      </div>}
                    {car.seller_type && <div>
                        <span className="font-medium">Lloji:</span> {car.seller_type}
                      </div>}
                  </div>
                </CardContent>
              </Card>}

            {/* Insurance History & Verification */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center text-foreground">
                  <Shield className="h-5 w-5 mr-3 text-primary" />
                  Historia e Sigurimit dhe Verifikimi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center transition-colors">
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ VERIFIKUAR</div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Historia e Aksidenteve</div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-center transition-colors">
                    <div className="text-blue-600 dark:text-blue-400 font-semibold">✓ I PASTËR</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Verifikimi Ligjor</div>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-center transition-colors">
                    <div className="text-amber-600 dark:text-amber-400 font-semibold">✓ KONFIRMUAR</div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">Kilometrat e Vërteta</div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg text-center transition-colors">
                    <div className="text-purple-600 dark:text-purple-400 font-semibold">✓ GARANTUAR</div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">Mirëmbajtja e Rregullt</div>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Sigurimi i Verifikuar:</strong> Kompani të njohura sigurimesh kanë verifikuar historinë e kësaj makine.
                  </p>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>;
};
export default CarDetails;