import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Eye, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currentBid?: number;
  imageUrl?: string;
  images?: string[];
  mileage?: number;
  location?: string;
  endTime?: string;
  isLive: boolean;
  watchers?: number;
  condition?: string;
  transmission?: string;
  fuel?: string;
}

interface MobileCarCardProps {
  car: Car;
  onFavorite?: (carId: string) => void;
  isFavorite?: boolean;
}

const MobileCarCard = ({ car, onFavorite, isFavorite = false }: MobileCarCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const allImages = car.images && car.images.length > 0 
    ? car.images 
    : car.imageUrl 
      ? [car.imageUrl] 
      : ['/placeholder.svg'];

  const trackCarView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('car_views')
        .insert({
          car_id: car.id,
          user_id: user?.id || null,
          ip_address: null, // Will be handled by the database
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error tracking car view:', error);
    }
  };

  const handleViewDetails = () => {
    trackCarView();
    navigate(`/car/${car.id}`);
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_cars')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', car.id);

        if (error) throw error;

        toast({
          title: "Removed from favorites",
          description: `${car.year} ${car.make} ${car.model} removed from your favorites`,
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_cars')
          .insert({
            user_id: user.id,
            car_id: car.id,
            car_make: car.make,
            car_model: car.model,
            car_year: car.year,
            car_price: car.price,
            car_image: car.imageUrl
          });

        if (error) throw error;

        toast({
          title: "Added to favorites",
          description: `${car.year} ${car.make} ${car.model} added to your favorites`,
        });
      }

      onFavorite?.(car.id);
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="mobile-car-card overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Image Section with Gallery */}
        <div className="relative">
          <div 
            className="relative h-48 sm:h-56 cursor-pointer group"
            onClick={() => setIsImageDialogOpen(true)}
          >
            <img
              src={allImages[currentImageIndex]}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Zoom Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Image Navigation */}
            {allImages.length > 1 && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {allImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {car.isLive && (
                <Badge variant="destructive" className="text-xs px-2 py-1">
                  LIVE
                </Badge>
              )}
              {car.condition && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {car.condition}
                </Badge>
              )}
            </div>

            {/* Favorite Button */}
            <Button
              size="sm"
              variant="secondary"
              className={`absolute top-2 right-2 p-2 ${
                isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-600'
              }`}
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Car Details */}
        <div className="p-4 space-y-3">
          {/* Title and Price */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-tight">
              {car.year} {car.make} {car.model}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(car.price)}
              </span>
              {car.currentBid && (
                <span className="text-sm text-muted-foreground">
                  Current bid: {formatPrice(car.currentBid)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {car.mileage && (
              <span>{car.mileage.toLocaleString()} km</span>
            )}
            {car.transmission && (
              <span>{car.transmission}</span>
            )}
            {car.fuel && (
              <span>{car.fuel}</span>
            )}
            {car.location && (
              <span>{car.location}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleViewDetails} className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            {car.watchers && (
              <Badge variant="outline" className="px-3 py-2">
                {car.watchers} watching
              </Badge>
            )}
          </div>

          {/* End Time */}
          {car.endTime && car.isLive && (
            <div className="text-center">
              <Badge variant="secondary" className="text-xs">
                Ends {car.endTime}
              </Badge>
            </div>
          )}
        </div>

        {/* Fullscreen Image Dialog */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="max-w-screen-lg w-full h-full sm:h-auto p-0 bg-black">
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-4 right-4 z-10"
                onClick={() => setIsImageDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              <img
                src={allImages[currentImageIndex]}
                alt={`${car.year} ${car.make} ${car.model}`}
                className="max-w-full max-h-full object-contain"
              />

              {allImages.length > 1 && (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  
                  {/* Thumbnail Strip */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
                    {allImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`View ${index + 1}`}
                        className={`w-16 h-12 object-cover rounded cursor-pointer border-2 transition-all ${
                          index === currentImageIndex ? 'border-white' : 'border-transparent opacity-70'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MobileCarCard;