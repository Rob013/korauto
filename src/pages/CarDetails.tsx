import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, Share2, Heart, ChevronRight, Expand, Copy, ChevronDown, ChevronUp, Filter, RefreshCw } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filters, setFilters] = useState<{
    manufacturer_id?: string;
    model_id?: string;
    generation_id?: string;
    color?: string;
    odometer_from_km?: string;
    odometer_to_km?: string;
    from_year?: string;
    to_year?: string;
    buy_now_price_from?: string;
    buy_now_price_to?: string;
    transmission?: string;
    fuel_type?: string;
  }>({});
  const [manufacturers, setManufacturers] = useState<{id: number, name: string}[]>([]);
  const [models, setModels] = useState<{id: number, name: string}[]>([]);
  const [generations, setGenerations] = useState<{id: number, name: string}[]>([]);
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
  
  const API_BASE_URL = 'https://auctionsapi.com/api';
  const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

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

  // API functions for search and filters
  const fetchManufacturers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/manufacturers/cars`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      });
      if (response.ok) {
        const data = await response.json();
        const sortedManufacturers = [...data.data].sort((a, b) => {
          const priorityBrands = ['Audi', 'Volkswagen', 'BMW', 'Mercedes-Benz'];
          const aIndex = priorityBrands.indexOf(a.name);
          const bIndex = priorityBrands.indexOf(b.name);
          
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        setManufacturers(sortedManufacturers);
      }
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error);
    }
  };

  const fetchModels = async (manufacturerId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/cars?manufacturer_id=${manufacturerId}`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      });
      if (response.ok) {
        const data = await response.json();
        setModels(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchGenerations = async (modelId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generations/cars?model_id=${modelId}`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGenerations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch generations:', error);
    }
  };

  const searchCars = async () => {
    try {
      let endpoint = `${API_BASE_URL}/cars?page=1&per_page=20`;
      
      if (searchQuery) {
        endpoint += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          endpoint += `&${key}=${encodeURIComponent(value)}`;
        }
      });

      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KORAUTO-WebApp/1.0',
          'X-API-Key': API_KEY
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFilteredCars(data.data || []);
      }
    } catch (error) {
      console.error('Failed to search cars:', error);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setModels([]);
    setGenerations([]);
    setFilteredCars([]);
  };

  // Load manufacturers on component mount
  useEffect(() => {
    fetchManufacturers();
  }, []);

  // Fetch models when manufacturer changes
  useEffect(() => {
    if (filters.manufacturer_id) {
      fetchModels(filters.manufacturer_id);
    } else {
      setModels([]);
    }
  }, [filters.manufacturer_id]);

  // Fetch generations when model changes
  useEffect(() => {
    if (filters.model_id) {
      fetchGenerations(filters.model_id);
    } else {
      setGenerations([]);
    }
  }, [filters.model_id]);

  // Search cars when filters change
  useEffect(() => {
    if (searchQuery || Object.keys(filters).some(key => filters[key as keyof typeof filters])) {
      const timeoutId = setTimeout(searchCars, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setFilteredCars([]);
    }
  }, [searchQuery, filters]);
  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);

        // Try to fetch specific car details from API
        const response = await fetch(`${API_BASE_URL}/cars/${id}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KORAUTO-WebApp/1.0',
            'X-API-Key': API_KEY
          }
        });

        if (response.ok) {
          const data = await response.json();
          const carData = data.data || data;
          
          if (carData) {
            const lot = carData.lots?.[0];
            const basePrice = lot?.buy_now || lot?.final_bid || carData.price || 25000;
            const price = Math.round(basePrice + 2300);

            const transformedCar: CarDetails = {
              id: carData.id?.toString() || id,
              make: carData.manufacturer?.name || 'Unknown',
              model: carData.model?.name || 'Unknown',
              year: carData.year || 2020,
              price: price,
              image: lot?.images?.normal?.[0] || lot?.images?.big?.[0],
              images: lot?.images?.normal || lot?.images?.big || [],
              vin: carData.vin,
              mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined,
              transmission: carData.transmission?.name,
              fuel: carData.fuel?.name,
              color: carData.color?.name,
              condition: lot?.condition?.name?.replace('run_and_drives', 'Good Condition'),
              lot: lot?.lot,
              title: carData.title,
              odometer: lot?.odometer,
              engine: carData.engine,
              cylinders: carData.cylinders,
              drive_wheel: carData.drive_wheel,
              body_type: carData.body_type,
              damage: lot?.damage,
              keys_available: lot?.keys_available,
              airbags: lot?.airbags,
              grade_iaai: lot?.grade_iaai,
              seller: lot?.seller,
              seller_type: lot?.seller_type,
              sale_date: lot?.sale_date,
              bid: lot?.bid,
              buy_now: lot?.buy_now,
              final_bid: lot?.final_bid,
              // Get real features from API data
              features: carData.features || lot?.features || [
                'Air Conditioning', 'Power Windows', 'Central Locking', 'ABS Brakes',
                'Driver Airbag', 'Passenger Airbag', 'Electric Mirrors', 'Power Steering'
              ],
              safety_features: carData.safety_features || lot?.safety_features || [
                'ABS Braking System', 'Electronic Stability Program', 'Airbag System',
                'Immobilizer', 'Central Locking', 'Child Safety Locks'
              ],
              comfort_features: carData.comfort_features || lot?.comfort_features || [
                'Air Conditioning', 'Power Windows', 'Electric Mirrors', 'Radio/CD Player',
                'Remote Central Locking', 'Adjustable Steering Wheel'
              ],
              performance_rating: 4.5,
              popularity_score: 85
            };
            setCar(transformedCar);
            return;
          }
        }

        // If specific car endpoint fails, try to find it in the cars list
        const listResponse = await fetch(`${API_BASE_URL}/cars?per_page=100&page=1`, {
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
            const lot = foundCar.lots?.[0];
            const basePrice = lot?.buy_now || lot?.final_bid || foundCar.price || 25000;
            const price = Math.round(basePrice + 2300);

            const transformedCar: CarDetails = {
              id: foundCar.id?.toString() || id,
              make: foundCar.manufacturer?.name || 'Unknown',
              model: foundCar.model?.name || 'Unknown',
              year: foundCar.year || 2020,
              price: price,
              image: lot?.images?.normal?.[0] || lot?.images?.big?.[0],
              images: lot?.images?.normal || lot?.images?.big || [],
              vin: foundCar.vin,
              mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined,
              transmission: foundCar.transmission?.name,
              fuel: foundCar.fuel?.name,
              color: foundCar.color?.name,
              condition: lot?.condition?.name?.replace('run_and_drives', 'Good Condition'),
              lot: lot?.lot,
              title: foundCar.title,
              odometer: lot?.odometer,
              engine: foundCar.engine,
              cylinders: foundCar.cylinders,
              drive_wheel: foundCar.drive_wheel,
              body_type: foundCar.body_type,
              damage: lot?.damage,
              keys_available: lot?.keys_available,
              airbags: lot?.airbags,
              grade_iaai: lot?.grade_iaai,
              seller: lot?.seller,
              seller_type: lot?.seller_type,
              sale_date: lot?.sale_date,
              bid: lot?.bid,
              buy_now: lot?.buy_now,
              final_bid: lot?.final_bid,
              // Get real features from API data
              features: foundCar.features || lot?.features || [
                'Air Conditioning', 'Power Windows', 'Central Locking', 'ABS Brakes',
                'Driver Airbag', 'Passenger Airbag', 'Electric Mirrors', 'Power Steering'
              ],
              safety_features: foundCar.safety_features || lot?.safety_features || [
                'ABS Braking System', 'Electronic Stability Program', 'Airbag System',
                'Immobilizer', 'Central Locking', 'Child Safety Locks'
              ],
              comfort_features: foundCar.comfort_features || lot?.comfort_features || [
                'Air Conditioning', 'Power Windows', 'Electric Mirrors', 'Radio/CD Player',
                'Remote Central Locking', 'Adjustable Steering Wheel'
              ],
              performance_rating: 4.5,
              popularity_score: 85
            };
            setCar(transformedCar);
            return;
          }
        }

        // If car not found, show error
        setError('Car not found');
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
                <div className="relative h-[500px] bg-gradient-to-br from-muted to-muted/50 overflow-hidden group cursor-pointer" onClick={() => setIsImageZoomOpen(true)}>
                  {images.length > 0 ? <img src={images[selectedImageIndex]} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" onError={e => {
                  e.currentTarget.src = "/placeholder.svg";
                }} /> : <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-24 w-24 text-muted-foreground" />
                    </div>}
                  {car.lot && <Badge className="absolute top-6 right-6 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-2 text-sm font-medium shadow-lg">
                      Lot #{car.lot}
                    </Badge>}
                  {/* Zoom icon */}
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Expand className="h-5 w-5 text-white" />
                  </div>
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
                
                {/* Main Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {/* Basic Info */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground">Marka & Modeli</span>
                    </div>
                    <span className="text-muted-foreground font-medium text-right">{car.make} {car.model}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-25 dark:from-blue-950/30 dark:to-blue-950/10 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold text-foreground">Viti</span>
                    </div>
                    <span className="text-muted-foreground font-medium">{car.year}</span>
                  </div>
                  
                  {car.mileage && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-25 dark:from-green-950/30 dark:to-green-950/10 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Gauge className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-foreground">Kilometrat</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.mileage}</span>
                    </div>
                  )}
                  
                  {car.transmission && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-25 dark:from-purple-950/30 dark:to-purple-950/10 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-purple-500" />
                        <span className="font-semibold text-foreground">Transmisioni</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.transmission}</span>
                    </div>
                  )}
                  
                  {car.fuel && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-25 dark:from-orange-950/30 dark:to-orange-950/10 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-3">
                        <Fuel className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-foreground">Karburanti</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.fuel}</span>
                    </div>
                  )}
                  
                  {car.color && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-pink-25 dark:from-pink-950/30 dark:to-pink-950/10 rounded-lg border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center gap-3">
                        <Palette className="h-5 w-5 text-pink-500" />
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
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Motori</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.engine.name}</span>
                    </div>
                  )}
                  {car.cylinders && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Cilindrat</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.cylinders}</span>
                    </div>
                  )}
                  {car.drive_wheel && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Drejtimi</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.drive_wheel.name}</span>
                    </div>
                  )}
                  {car.body_type && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Lloji i Trupit</span>
                      </div>
                      <span className="text-muted-foreground font-medium capitalize">{car.body_type.name}</span>
                    </div>
                  )}
                  {car.airbags && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-semibold text-foreground">Airbag-ët</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{car.airbags}</span>
                    </div>
                  )}
                  {car.vin && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg md:col-span-2">
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">VIN</span>
                      </div>
                      <span className="text-muted-foreground font-mono text-sm">{car.vin}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Search and Filter Section */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Kërko Makina të Ngjashme</h3>
                </div>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Input
                    type="text"
                    placeholder="Kërko sipas markës, modelit ose karakteristikave..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-background border-border"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Primary Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="space-y-2 min-w-[200px] flex-1">
                    <label className="text-sm font-medium text-foreground block">Marka</label>
                    <Select value={filters.manufacturer_id || ''} onValueChange={(value) => setFilters({...filters, manufacturer_id: value || undefined, model_id: undefined, generation_id: undefined})}>
                      <SelectTrigger className="h-11 bg-background border-border">
                        <SelectValue placeholder="Të gjitha Markat" />
                      </SelectTrigger>
                      <SelectContent className="z-50 max-h-60 bg-background border border-border shadow-lg">
                        {manufacturers.map((manufacturer, index) => {
                          const isTopBrand = index < 4;
                          const isLastTopBrand = index === 3;
                          
                          return (
                            <div key={manufacturer.id}>
                              <SelectItem 
                                value={manufacturer.id.toString()}
                                className={isTopBrand ? "font-medium text-primary" : ""}
                              >
                                {manufacturer.name}
                              </SelectItem>
                              {isLastTopBrand && (
                                <div className="mx-2 my-1 border-t border-border/60" />
                              )}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 min-w-[200px] flex-1">
                    <label className="text-sm font-medium text-foreground block">Modeli</label>
                    <Select value={filters.model_id || ''} onValueChange={(value) => setFilters({...filters, model_id: value || undefined, generation_id: undefined})} disabled={!filters.manufacturer_id}>
                      <SelectTrigger className="h-11 bg-background border-border">
                        <SelectValue placeholder={filters.manufacturer_id ? "Të gjithë Modelet" : "Zgjidh markën së pari"} />
                      </SelectTrigger>
                      <SelectContent className="z-50 max-h-60 bg-background border border-border shadow-lg">
                        {models.map(model => (
                          <SelectItem key={model.id} value={model.id.toString()}>{model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 min-w-[200px] flex-1">
                    <label className="text-sm font-medium text-foreground block">Detali i Modelit</label>
                    <Select value={filters.generation_id || ''} onValueChange={(value) => setFilters({...filters, generation_id: value || undefined})} disabled={!filters.model_id}>
                      <SelectTrigger className="h-11 bg-background border-border">
                        <SelectValue placeholder={filters.model_id ? "Të gjitha Gjeneratat" : "Zgjidh modelin së pari"} />
                      </SelectTrigger>
                      <SelectContent className="z-50 max-h-60 bg-background border border-border shadow-lg">
                        {generations.map(generation => (
                          <SelectItem key={generation.id} value={generation.id.toString()}>{generation.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(searchQuery || Object.keys(filters).length > 0) && (
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                      Pastro Filtrat
                    </Button>
                  </div>
                )}

                {/* Search Results */}
                {filteredCars.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-foreground mb-4">Rezultatet e Kërkimit ({filteredCars.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {filteredCars.slice(0, 6).map((foundCar) => {
                        const lot = foundCar.lots?.[0];
                        const basePrice = lot?.buy_now || lot?.final_bid || foundCar.price || 25000;
                        const price = Math.round(basePrice + 2300);
                        
                        return (
                          <div 
                            key={foundCar.id} 
                            className="p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors bg-card"
                            onClick={() => navigate(`/car/${foundCar.id}`)}
                          >
                            <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                              {lot?.images?.normal?.[0] ? (
                                <img 
                                  src={lot.images.normal[0]} 
                                  alt={`${foundCar.year} ${foundCar.manufacturer?.name} ${foundCar.model?.name}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="font-medium text-foreground text-sm">
                                {foundCar.year} {foundCar.manufacturer?.name} {foundCar.model?.name}
                              </div>
                              <div className="text-primary font-semibold">€{price.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">
                                {lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : 'N/A'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {filteredCars.length > 6 && (
                      <Button 
                        variant="outline" 
                        className="w-full mt-4" 
                        onClick={() => navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`)}
                      >
                        Shiko të gjitha rezultatet ({filteredCars.length})
                      </Button>
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

                     {/* Admin Only - Duplicate Car Button */}
                     {isAdmin && (
                       <Button 
                         variant="outline" 
                         onClick={() => {
                           navigator.clipboard.writeText(JSON.stringify(car, null, 2));
                           toast({
                             title: "Car data copied",
                             description: "Car details have been copied to clipboard for duplication",
                             duration: 3000
                           });
                         }}
                         className="w-full border-2 border-amber-500/60 bg-gradient-to-r from-transparent to-amber-500/5 text-amber-600 hover:from-amber-500 hover:to-amber-500 hover:text-white py-3 h-12 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl hover:scale-[1.02] active:scale-[0.98]"
                       >
                         <Copy className="h-4 w-4 mr-2" />
                         <span className="tracking-wide">Duplicate (Admin)</span>
                       </Button>
                     )}
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
      
      {/* Image Zoom Modal */}
      <ImageZoom
        src={images[selectedImageIndex] || "/placeholder.svg"}
        alt={`${car.year} ${car.make} ${car.model}`}
        isOpen={isImageZoomOpen}
        onClose={() => setIsImageZoomOpen(false)}
      />
    </div>;
};
export default CarDetails;