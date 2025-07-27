import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, MapPin, Gauge, Fuel, Calendar, Eye,
  Heart, Share2, ArrowRight
} from "lucide-react";

interface EncarCarCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  mileage?: string;
  fuel?: string;
  location?: string;
  isNew?: boolean;
  isCertified?: boolean;
}

const EncarCarCard = ({ 
  id, make, model, year, price, image, mileage, fuel, location, isNew, isCertified 
}: EncarCarCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);

  const handleCardClick = () => {
    navigate(`/car/${id}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Link Copied",
      description: "Car listing link copied to clipboard",
    });
  };

  const handleInspectionRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Inspection Request Submitted",
      description: "KORAUTO will contact you at +38348181116 for inspection scheduling",
      duration: 6000,
    });
  };

  return (
    <Card 
      className="group cursor-pointer bg-white border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`${year} ${make} ${model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300x200/f5f5f5/999999?text=No+Image";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Car className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isNew && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-1">
              NEW
            </Badge>
          )}
          {isCertified && (
            <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
              CERTIFIED
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={handleLikeClick}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={handleShareClick}
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* View count */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>{Math.floor(Math.random() * 500) + 50}</span>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Car Title */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-base leading-tight">
            {year} {make} {model}
          </h3>
          {location && (
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {location}
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
          {mileage && (
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              <span>{mileage}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3" />
              <span className="capitalize">{fuel}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{year}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-primary">
            €{price.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            KORAUTO Price
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button 
            onClick={handleInspectionRequest}
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-8"
          >
            Inspect (€50)
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-7 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: "Info Request Sent",
                  description: "We'll send detailed information to robert_gashi@live.com",
                });
              }}
            >
              Request Info
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-7 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                window.open('tel:+38348181116');
              }}
            >
              Call Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EncarCarCard;