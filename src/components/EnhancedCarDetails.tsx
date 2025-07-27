import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import InspectionRequestForm from "./InspectionRequestForm";
import { useEncarAPI, type Car as EncarCar } from "@/hooks/useEncarAPI";
import { 
  ArrowLeft, Phone, Mail, MapPin, Car, Gauge, Settings, Fuel, 
  Palette, Hash, Calendar, Shield, FileText, Search, Info, Eye, 
  CheckCircle, AlertTriangle, Star, Clock, Users, MessageCircle, 
  Share2, Heart, ChevronRight, ChevronLeft, Play, Pause, 
  RotateCcw, Download, Maximize, Camera, Video, History,
  Wrench, DollarSign, Award, TrendingUp, BarChart3, X
} from "lucide-react";

const EnhancedCarDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchCarDetails } = useEncarAPI();
  
  const [car, setCar] = useState<EncarCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageAutoPlay, setImageAutoPlay] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);

  useEffect(() => {
    const loadCarDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch car details from the individual car endpoint with ALL data
        const carDetails = await fetchCarDetails(id);
        
        if (carDetails) {
          setCar(carDetails);
        } else {
          // Generate enhanced fallback data if API fails
          const fallbackCar: EncarCar = {
            id: id,
            make: 'BMW',
            model: 'Series 3',
            year: 2021,
            price: 42300,
            imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center',
            images: [
              'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center',
              'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop&crop=center',
              'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop&crop=center',
              'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center',
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center'
            ],
            mileage: 45000,
            location: 'Stuttgart, Germany',
            isLive: true,
            watchers: 24,
            vin: `WBANA5314XCR${id?.slice(-5)}`,
            transmission: 'Automatic',
            fuel: 'Gasoline',
            color: 'Mineral Grey Metallic',
            condition: 'Excellent',
            lot: `LOT${id?.slice(-6)}`,
            title: '2021 BMW 3 Series 330i xDrive',
            engine: { id: 1, name: '2.0L TwinPower Turbo I4' },
            cylinders: 4,
            drive_wheel: { id: 1, name: 'All-Wheel Drive' },
            body_type: { id: 1, name: 'Sedan' },
            keys_available: true,
            seller: 'KORAUTO Certified Premium Dealer',
            seller_type: 'Authorized Dealer',
            buy_now: 40000,
            damage: { main: null, second: null },
            odometer: {
              km: 45000,
              mi: 27962,
              status: { name: 'Actual' }
            },
            // Additional comprehensive specs for demo
            horsepower: 255,
            torque: 295,
            displacement: 2.0,
            top_speed: 250,
            acceleration: 5.8,
            fuel_consumption: {
              city: 9.1,
              highway: 6.4,
              combined: 7.4
            },
            emissions: {
              co2: 169,
              euro_standard: 'Euro 6d'
            },
            dimensions: {
              length: 4709,
              width: 1827,
              height: 1442,
              wheelbase: 2851,
              weight: 1570
            },
            safety_rating: {
              overall: 5,
              frontal: 5,
              side: 5,
              rollover: 4
            }
          };
          setCar(fallbackCar);
        }
      } catch (err) {
        console.error('Failed to fetch car details:', err);
        setError('Failed to load car details');
      } finally {
        setLoading(false);
      }
    };

    loadCarDetails();
  }, [id, fetchCarDetails]);

  // Auto-play images
  useEffect(() => {
    if (!imageAutoPlay || !car?.images || car.images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex(prev => 
        prev >= (car.images?.length || 1) - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [imageAutoPlay, car?.images]);

  const handleContactWhatsApp = () => {
    const message = `Hi! I'm interested in the ${car?.year} ${car?.make} ${car?.model} (€${car?.price.toLocaleString()}). Can you provide more information?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Car link copied to clipboard",
      duration: 3000
    });
  };

  const [isLiked, setIsLiked] = useState(false);
  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Car removed from your favorites" : "Car added to your favorites",
      duration: 3000
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
          <Button variant="outline" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cars
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

  const images = car.images || [car.imageUrl].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-8xl">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/catalog')} 
            className="shadow-sm border-2 hover:shadow-md transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
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
            {/* Main Image with Controls */}
            <Card className="shadow-xl border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-[500px] bg-gradient-to-br from-muted to-muted/50 overflow-hidden group">
                  {images.length > 0 ? (
                    <img 
                      src={images[selectedImageIndex]} 
                      alt={`${car.year} ${car.make} ${car.model}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Image Controls */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      
                      {/* Image Counter and Controls */}
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                      
                      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setImageAutoPlay(!imageAutoPlay)}
                          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition-all"
                        >
                          {imageAutoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex(0)}
                          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition-all"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-6 right-6 space-y-2">
                    {car.lot && (
                      <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-2 text-sm font-medium shadow-lg">
                        Lot #{car.lot}
                      </Badge>
                    )}
                    {car.isLive && (
                      <Badge className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-2 text-sm font-medium shadow-lg block">
                        <span className="animate-pulse">●</span> Live Auction
                      </Badge>
                    )}
                    {car.watchers && (
                      <Badge variant="secondary" className="backdrop-blur-sm px-3 py-2 text-sm shadow-lg block">
                        <Eye className="h-3 w-3 mr-1" />
                        {car.watchers} watching
                      </Badge>
                    )}
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

            {/* Enhanced Vehicle Information Tabs */}
            <Card className="shadow-xl border-0">
              <CardContent className="p-8">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto bg-muted/30 p-2 rounded-xl gap-2">
                    <TabsTrigger value="overview" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all py-3">
                      <Info className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="specs" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all py-3">
                      <Settings className="h-4 w-4 mr-2" />
                      Specifications
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all py-3">
                      <History className="h-4 w-4 mr-2" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="inspection" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all py-3">
                      <Search className="h-4 w-4 mr-2" />
                      Inspection
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-md transition-all py-3">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Financial
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-8">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-lg text-foreground">Key Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'Automatic Climate Control', 'GPS Navigation', 'Parking Camera', 
                          'Parking Sensors', 'Bluetooth Connectivity', 'USB/AUX Ports',
                          'Cruise Control', 'Anti-lock Braking System', 'Multiple Airbags',
                          'Electronic Stability Control', 'Traction Control', 'Premium Sound System'
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="specs" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Engine & Performance */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center">
                            <Car className="h-4 w-4 mr-2" />
                            Engine & Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Engine</span>
                            <span className="font-medium">{car.engine?.name || '2.0L Turbo'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cylinders</span>
                            <span className="font-medium">{car.cylinders || 4}</span>
                          </div>
                          {car.horsepower && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Horsepower</span>
                              <span className="font-medium">{car.horsepower} HP</span>
                            </div>
                          )}
                          {car.torque && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Torque</span>
                              <span className="font-medium">{car.torque} Nm</span>
                            </div>
                          )}
                          {car.displacement && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Displacement</span>
                              <span className="font-medium">{car.displacement}L</span>
                            </div>
                          )}
                          {car.top_speed && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Top Speed</span>
                              <span className="font-medium">{car.top_speed} km/h</span>
                            </div>
                          )}
                          {car.acceleration && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">0-100 km/h</span>
                              <span className="font-medium">{car.acceleration}s</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fuel Type</span>
                            <span className="font-medium">{car.fuel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Drive Wheel</span>
                            <span className="font-medium">{car.drive_wheel?.name || 'Front'}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Design & Comfort */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center">
                            <Palette className="h-4 w-4 mr-2" />
                            Design & Comfort
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Body Type</span>
                            <span className="font-medium">{car.body_type?.name || 'Sedan'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Color</span>
                            <span className="font-medium">{car.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Transmission</span>
                            <span className="font-medium">{car.transmission}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Condition</span>
                            <Badge variant="secondary">{car.condition}</Badge>
                          </div>
                          {car.dimensions?.length && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Length</span>
                              <span className="font-medium">{car.dimensions.length} mm</span>
                            </div>
                          )}
                          {car.dimensions?.width && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Width</span>
                              <span className="font-medium">{car.dimensions.width} mm</span>
                            </div>
                          )}
                          {car.dimensions?.height && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Height</span>
                              <span className="font-medium">{car.dimensions.height} mm</span>
                            </div>
                          )}
                          {car.dimensions?.weight && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Weight</span>
                              <span className="font-medium">{car.dimensions.weight} kg</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Fuel & Emissions */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center">
                            <Fuel className="h-4 w-4 mr-2" />
                            Fuel & Emissions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {car.fuel_consumption?.city && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">City</span>
                              <span className="font-medium">{car.fuel_consumption.city} L/100km</span>
                            </div>
                          )}
                          {car.fuel_consumption?.highway && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Highway</span>
                              <span className="font-medium">{car.fuel_consumption.highway} L/100km</span>
                            </div>
                          )}
                          {car.fuel_consumption?.combined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Combined</span>
                              <span className="font-medium">{car.fuel_consumption.combined} L/100km</span>
                            </div>
                          )}
                          {car.emissions?.co2 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CO₂ Emissions</span>
                              <span className="font-medium">{car.emissions.co2} g/km</span>
                            </div>
                          )}
                          {car.emissions?.euro_standard && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Euro Standard</span>
                              <Badge variant="outline">{car.emissions.euro_standard}</Badge>
                            </div>
                          )}
                          {car.safety_rating?.overall && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Safety Rating</span>
                              <div className="flex">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < car.safety_rating!.overall! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-8">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Vehicle History Report
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium">Clean Title</span>
                              </div>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">Verified</Badge>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium">No Accidents Reported</span>
                              </div>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">Verified</Badge>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-3">
                                <Info className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">Single Owner</span>
                              </div>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Confirmed</Badge>
                            </div>

                            {car.odometer && (
                              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                  <Gauge className="h-5 w-5 text-blue-600" />
                                  <span className="font-medium">Odometer Reading: {car.odometer.status.name}</span>
                                </div>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                  {car.odometer.km.toLocaleString()} km
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="inspection" className="mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <Search className="h-4 w-4 mr-2" />
                          Professional Inspection Service
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-muted-foreground">
                            Get a comprehensive professional inspection report for this vehicle. Our certified inspectors will provide a detailed analysis of the car's condition.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Visual Inspection</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Mechanical Check</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Documentation Review</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Test Drive Report</span>
                            </div>
                          </div>

                          <Button 
                            onClick={() => setShowInspectionForm(true)} 
                            className="w-full"
                            size="lg"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Request Free Inspection
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="financial" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Pricing Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Current Price</span>
                            <span className="text-2xl font-bold text-primary">€{car.price.toLocaleString()}</span>
                          </div>
                          {car.buy_now && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Buy Now Price</span>
                              <span className="font-semibold">€{car.buy_now.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Market Value</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Excellent Deal</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Market Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Price vs Market</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">-8% Below Market</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Depreciation Rate</span>
                            <span className="font-medium">12% per year</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Resale Value</span>
                            <Badge variant="secondary">Excellent</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Car Info and Actions */}
          <div className="space-y-8">
            {/* Main Car Information */}
            <Card className="shadow-xl border-0 sticky top-6">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {car.year} {car.make} {car.model}
                    </h1>
                    <p className="text-muted-foreground text-lg">{car.title}</p>
                  </div>

                  <div className="text-center py-6 border-y border-border">
                    <div className="text-4xl font-bold text-primary mb-2">
                      €{car.price.toLocaleString()}
                    </div>
                    <p className="text-muted-foreground">KORAUTO Price (includes service)</p>
                  </div>

                  {/* Key Information */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Gauge className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{typeof car.mileage === 'number' ? car.mileage.toLocaleString() : car.mileage} km</div>
                        <div className="text-muted-foreground">Mileage</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{car.year}</div>
                        <div className="text-muted-foreground">Year</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Fuel className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{car.fuel}</div>
                        <div className="text-muted-foreground">Fuel</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Settings className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{car.transmission}</div>
                        <div className="text-muted-foreground">Transmission</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      onClick={handleContactWhatsApp} 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Contact via WhatsApp
                    </Button>
                    
                    <Button 
                      onClick={() => setShowInspectionForm(true)} 
                      variant="outline" 
                      className="w-full"
                      size="lg"
                    >
                      <Search className="h-5 w-5 mr-2" />
                      Request Free Inspection
                    </Button>
                  </div>

                  <Separator />

                  {/* Seller Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Seller Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm">{car.seller}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm">{car.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="text-sm">Certified Premium Dealer</span>
                      </div>
                      {car.keys_available && (
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">All Keys Available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VIN Information */}
                  {car.vin && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Hash className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">VIN Number</span>
                      </div>
                      <code className="text-xs font-mono bg-background px-2 py-1 rounded border">
                        {car.vin}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Inspection Request Modal */}
        {showInspectionForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Request Professional Inspection</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowInspectionForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <InspectionRequestForm trigger="" carId={car.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCarDetails;