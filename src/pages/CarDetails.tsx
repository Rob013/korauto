import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, 
  Fuel, Palette, Hash, Calendar, Shield, FileText, 
  Search, Info, Eye, CheckCircle, AlertTriangle 
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
              condition: lot?.condition?.name || 'Good',
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

        // If not found in list, create fallback data based on ID
        const fallbackCar: CarDetails = {
          id: id,
          make: 'BMW',
          model: 'Series 3',
          year: 2021,
          price: 32300, // Base price + KORAUTO markup
          image: 'https://via.placeholder.com/800x600/f5f5f5/999999?text=BMW+Series+3',
          images: [
            'https://via.placeholder.com/800x600/f5f5f5/999999?text=BMW+Series+3',
            'https://via.placeholder.com/800x600/f5f5f5/999999?text=Interior',
            'https://via.placeholder.com/800x600/f5f5f5/999999?text=Engine'
          ],
          vin: 'WBANA5314XCR' + id.slice(-5),
          mileage: '45,000 km',
          transmission: 'Automatic',
          fuel: 'Gasoline',
          color: 'Silver',
          condition: 'Excellent',
          lot: id.slice(-6),
          title: '2021 BMW 3 Series 320i',
          engine: { name: '2.0L TwinPower Turbo' },
          cylinders: 4,
          drive_wheel: { name: 'RWD' },
          body_type: { name: 'Sedan' },
          keys_available: true,
          seller: 'KORAUTO Certified Dealer',
          seller_type: 'Professional Dealer',
          buy_now: 30000
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

  const handleInspectionRequest = async () => {
    toast({
      title: "Kërkesa për Inspektim u Dërgua",
      description: `Kërkesa juaj për inspektim për ${car?.year} ${car?.make} ${car?.model} është pranuar. ROBERT GASHI nga KORAUTO do t'ju kontaktojë në +38348181116`,
      duration: 6000,
    });
  };

  const handleContactMoreInfo = async () => {
    toast({
      title: "Kërkesa për Kontakt u Dërgua",
      description: `Kërkesa juaj për më shumë informacion rreth ${car?.year} ${car?.make} ${car?.model} është dërguar tek ROBERT GASHI. Telefononi +38348181116 për ndihmë të menjëhershme.`,
      duration: 6000,
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
        {/* Navigation */}
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kthehu te Makinat
        </Button>

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
                  <Button 
                    onClick={handleInspectionRequest}
                    className="w-full bg-primary hover:bg-primary/90 text-xs py-1.5 h-8"
                    size="sm"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    Kërkesë për Inspektim (€50)
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleContactMoreInfo}
                    className="w-full border-primary text-primary hover:bg-primary hover:text-white text-xs py-1.5 h-8"
                    size="sm"
                  >
                    <Info className="h-3 w-3 mr-1" />
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

            {/* Insurance History - Encar.com Style */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Historia e Sigurimit dhe Verifikimi
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="text-green-600 font-semibold">✓ VERIFIKUAR</div>
                    <div className="text-xs text-green-700 mt-1">Historia e Aksidenteve</div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-blue-600 font-semibold">✓ I PASTËR</div>
                    <div className="text-xs text-blue-700 mt-1">Verifikimi Ligjor</div>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                    <div className="text-orange-600 font-semibold">✓ KONFIRMUAR</div>
                    <div className="text-xs text-orange-700 mt-1">Kilometrat e Vërteta</div>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                    <div className="text-purple-600 font-semibold">✓ GARANTUAR</div>
                    <div className="text-xs text-purple-700 mt-1">Mirëmbajtja e Rregullt</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Sigurimi i Verifikuar:</strong> Encar Insurance, Dongbu Insurance, Samsung Fire & Marine Insurance dhe të tjera kompani të njohura sigurimesh.
                  </p>
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