import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Calendar, Shield, FileText, Info, Copy, Share2, Heart, MessageCircle, CheckCircle, AlertTriangle, Key, Users, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  images?: string[];
  vin?: string;
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  cylinders?: number;
  engine?: string;
  drive_wheel?: string;
  body_type?: string;
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
  insurance_v2?: any;
  location?: any;
  details?: any;
}

const CarDetailsOptimized = () => {
  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackCarView } = useAnalytics();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

  // Check auth and favorites
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user && lot) {
        // Check if this car is already favorited
        const { data } = await supabase
          .from('favorite_cars')
          .select('id')
          .eq('user_id', user.id)
          .eq('car_id', lot)
          .single();
        
        setIsFavorite(!!data);
      }
    };
    
    getUser();
  }, [lot]);

  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!lot) return;

      try {
        setLoading(true);
        setError(null);
        
        // Track car view
        trackCarView(lot);

        const response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
          headers: {
            accept: '*/*',
            'x-api-key': API_KEY,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('not_found');
            return;
          }
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const carData = data.data;
        const lotData = carData.lots?.[0];

        if (!lotData) {
          setError('not_found');
          return;
        }

        const basePrice = lotData.buy_now ?? lotData.final_bid ?? lotData.price ?? 25000;
        const price = Math.round(basePrice * 0.85 + 2200); // Convert to EUR

        const transformedCar: CarDetails = {
          id: carData.id?.toString() || lot,
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
          condition: lotData.condition?.name?.replace('run_and_drives', 'Gjendje e Mirë'),
          lot: lotData.lot,
          title: lotData.title || carData.title,
          cylinders: carData.cylinders,
          engine: carData.engine?.name,
          drive_wheel: carData.drive_wheel?.name,
          body_type: carData.body_type?.name,
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
          insurance_v2: lotData.insurance_v2,
          location: lotData.location,
          details: lotData.details,
        };

        setCar(transformedCar);
      } catch (error) {
        console.error('Failed to fetch car details:', error);
        setError('general');
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [lot, trackCarView]);

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Duhet të hyni në llogari",
        description: "Ju lutem hyni në llogari për të ruajtur makinat e preferuara",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorite_cars')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', lot);
        
        setIsFavorite(false);
        toast({
          title: "U hoq nga të preferuarat",
          description: "Makina u hoq nga lista juaj e preferuarve"
        });
      } else {
        await supabase
          .from('favorite_cars')
          .insert({
            user_id: user.id,
            car_id: lot
          });
        
        setIsFavorite(true);
        toast({
          title: "U shtua në të preferuarat",
          description: "Makina u ruajt në listën tuaj të preferuarve"
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Gabim",
        description: "Dështoi përditësimi i të preferuarve",
        variant: "destructive"
      });
    }
  };

  const handleContactWhatsApp = () => {
    if (!car) return;
    
    const message = `Përshëndetje! Jam i interesuar për ${car.year} ${car.make} ${car.model} (€${car.price.toLocaleString()}). A mund të më jepni më shumë informacion?`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-responsive py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-responsive py-16 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Makina nuk u gjet</h1>
          <p className="text-muted-foreground mb-8">
            Makina që kërkoni nuk u gjet në sistemin e ankandeve ose mund të jetë shitur.
          </p>
          <div className="space-x-4">
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu në faqen kryesore
            </Button>
            <Button variant="outline" onClick={() => navigate('/catalog')}>
              Shiko makinat e tjera
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error === 'general' || !car) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-responsive py-16 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Gabim në ngarkim</h1>
          <p className="text-muted-foreground mb-8">
            Ndodhi një gabim gjatë ngarkimit të detajeve të makinës. Ju lutem provoni përsëri.
          </p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>
              Rifresko faqen
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu në faqen kryesore
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const images = car.images || [car.image].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container-responsive py-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Mbrapa
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={toggleFavorite}>
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            
            <InspectionRequestForm 
              trigger={
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
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
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {images.slice(0, 6).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-muted rounded overflow-hidden border-2 transition-colors ${
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
          </div>

          {/* Car Information */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {car.year} {car.make} {car.model}
              </h1>
              {car.lot && (
                <Badge variant="outline" className="mb-4">
                  Kodi: #{car.lot}
                </Badge>
              )}
              <div className="text-3xl font-bold text-primary mb-2">
                €{car.price.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">
                Çmimi përfshirë transportin deri në portin e Durrësit
              </p>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-4">
              {car.mileage && (
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{car.mileage}</span>
                </div>
              )}
              {car.transmission && (
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{car.transmission}</span>
                </div>
              )}
              {car.fuel && (
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{car.fuel}</span>
                </div>
              )}
              {car.color && (
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{car.color}</span>
                </div>
              )}
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              <h3 className="font-semibold">Karakteristikat kryesore:</h3>
              <div className="grid grid-cols-1 gap-2">
                {car.engine && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Motori:</span>
                    <span className="text-sm font-medium">{car.engine}</span>
                  </div>
                )}
                {car.cylinders && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Cilindra:</span>
                    <span className="text-sm font-medium">{car.cylinders}</span>
                  </div>
                )}
                {car.drive_wheel && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Tërheqje:</span>
                    <span className="text-sm font-medium">{car.drive_wheel}</span>
                  </div>
                )}
                {car.condition && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Gjendja:</span>
                    <span className="text-sm font-medium">{car.condition}</span>
                  </div>
                )}
                {car.keys_available !== undefined && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Çelësat:</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      {car.keys_available ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Të disponueshëm
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Jo të disponueshëm
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleContactWhatsApp}
                className="w-full"
                size="lg"
              >
                <Phone className="h-4 w-4 mr-2" />
                Kontakto via WhatsApp
              </Button>
              
              <InspectionRequestForm 
                trigger={
                  <Button variant="outline" className="w-full" size="lg">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Kërko Shërbimin e Inspektimit
                  </Button>
                }
                carId={car.id}
                carMake={car.make}
                carModel={car.model}
                carYear={car.year}
              />
            </div>

            {/* Additional Info */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">KORAUTO - Importuesi juaj i besueshëm</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rr. Ilaz Kodra 70, Prishtinë, Kosovë
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CarDetailsOptimized;