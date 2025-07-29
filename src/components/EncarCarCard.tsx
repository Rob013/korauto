import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, MapPin, Gauge, Fuel, Calendar, Eye,
  Heart, Share2, ArrowRight, MessageCircle, Shield, 
  AlertTriangle, Key, Settings, Palette, Hash, Info,
  Award, Wrench, DollarSign, FileText
} from "lucide-react";
import InspectionRequestForm from "./InspectionRequestForm";

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
  // Enhanced fields from API
  vin?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  lot?: string;
  cylinders?: number;
  // Insurance information
  insurance?: {
    accident_history?: string;
    repair_count?: string;
    total_loss?: string;
    repair_cost?: string;
    flood_damage?: string;
    own_damage?: string;
    other_damage?: string;
  };
  insurance_v2?: {
    myAccidentCnt?: number;
    otherAccidentCnt?: number;
    ownerChangeCnt?: number;
    robberCnt?: number;
    totalLossCnt?: number;
    floodTotalLossCnt?: number;
    accidentCnt?: number;
  };
  // Location details
  locationDetails?: {
    country?: { name: string; iso: string };
    city?: { name: string };
    state?: string;
  };
  // Inspection details
  inspect?: {
    accident_summary?: {
      main_framework?: string;
      exterior1rank?: string;
      exterior2rank?: string;
      simple_repair?: string;
      accident?: string;
    };
  };
  // Vehicle details from lots
  details?: {
    engine_volume?: number;
    original_price?: number;
    year?: number;
    month?: number;
    first_registration?: {
      year: number;
      month: number;
      day: number;
    };
    badge?: string;
    comment?: string;
    description_ko?: string;
    description_en?: string;
    is_leasing?: boolean;
    sell_type?: string;
    equipment?: any;
    options?: {
      type?: string;
      standard?: string[];
      etc?: string[];
      choice?: string[];
      tuning?: string[];
    };
    inspect_outer?: Array<{
      type: { code: string; title: string };
      statusTypes: Array<{ code: string; title: string }>;
      attributes: string[];
    }>;
    seats_count?: number;
  };
}

const EncarCarCard = ({ 
  id, make, model, year, price, image, mileage, fuel, location, isNew, isCertified,
  vin, transmission, color, condition, lot, cylinders, insurance, insurance_v2, 
  locationDetails, inspect, details
}: EncarCarCardProps) => {
  const navigate = useNavigate();
  const { setPreviousPage } = useNavigation();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);

  const handleCardClick = () => {
    // Save current page and any filter state before navigating
    setPreviousPage(window.location.pathname + window.location.search);
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

  const handleContactWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Përshëndetje! Jam i interesuar për ${year} ${make} ${model}. A mund të më jepni më shumë informacion?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
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
          {transmission && (
            <div className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              <span className="capitalize">{transmission}</span>
            </div>
          )}
          {color && (
            <div className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              <span className="capitalize">{color}</span>
            </div>
          )}
          {cylinders && (
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              <span>{cylinders} Cyl</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{year}</span>
          </div>
        </div>

        {/* Insurance & Safety Info */}
        {(insurance_v2 || inspect) && (
          <div className="space-y-1 mb-3 p-2 bg-gray-50 rounded-md">
            <h5 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Insurance Report
            </h5>
            {insurance_v2?.accidentCnt !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span>Accidents:</span>
                <Badge variant={insurance_v2.accidentCnt === 0 ? "secondary" : "destructive"} className="text-xs px-1 py-0">
                  {insurance_v2.accidentCnt === 0 ? 'Clean' : insurance_v2.accidentCnt}
                </Badge>
              </div>
            )}
            {insurance_v2?.ownerChangeCnt !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span>Owners:</span>
                <span className="font-medium">{insurance_v2.ownerChangeCnt}</span>
              </div>
            )}
            {inspect?.accident_summary?.accident && inspect.accident_summary.accident !== "doesn't exist" && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{inspect.accident_summary.accident}</span>
              </div>
            )}
            {lot && (
              <div className="flex items-center justify-between text-xs">
                <span>Lot:</span>
                <span className="font-medium">{lot}</span>
              </div>
            )}
          </div>
        )}

        {/* Vehicle Details */}
        {details && (
          <div className="space-y-1 mb-3 p-2 bg-blue-50 rounded-md">
            <h5 className="text-xs font-semibold text-blue-700 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Details
            </h5>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {details.engine_volume && (
                <div>
                  <span className="text-gray-600">Engine:</span>
                  <div className="font-medium">{details.engine_volume}cc</div>
                </div>
              )}
              {details.first_registration && (
                <div>
                  <span className="text-gray-600">Registered:</span>
                  <div className="font-medium">{details.first_registration.year}-{String(details.first_registration.month).padStart(2, '0')}</div>
                </div>
              )}
              {details.badge && (
                <div className="col-span-2">
                  <span className="text-gray-600">Badge:</span>
                  <div className="font-medium">{details.badge}</div>
                </div>
              )}
              {details.seats_count && (
                <div>
                  <span className="text-gray-600">Seats:</span>
                  <div className="font-medium">{details.seats_count}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equipment & Options */}
        {details?.options && (details.options.standard?.length || details.options.choice?.length) && (
          <div className="space-y-1 mb-3 p-2 bg-green-50 rounded-md">
            <h5 className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Award className="h-3 w-3" />
              Equipment
            </h5>
            {details.options.standard && details.options.standard.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {details.options.standard.slice(0, 3).map((option, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">{option}</Badge>
                ))}
                {details.options.standard.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">+{details.options.standard.length - 3}</Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inspection Report */}
        {details?.inspect_outer && details.inspect_outer.length > 0 && (
          <div className="space-y-1 mb-3 p-2 bg-orange-50 rounded-md">
            <h5 className="text-xs font-semibold text-orange-700 flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              Inspection
            </h5>
            <div className="space-y-1">
              {details.inspect_outer.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="truncate">{item.type.title}:</span>
                  <div className="flex gap-1">
                    {item.statusTypes.map((status, i) => (
                      <Badge 
                        key={i} 
                        variant={status.code === 'X' ? "destructive" : status.code === 'W' ? "secondary" : "outline"} 
                        className="text-xs px-1 py-0"
                      >
                        {status.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {details.inspect_outer.length > 2 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs px-1 py-0">+{details.inspect_outer.length - 2} more</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Source Information */}
        {(details?.sell_type || details?.original_price) && (
          <div className="space-y-1 mb-3 p-2 bg-purple-50 rounded-md">
            <h5 className="text-xs font-semibold text-purple-700 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Source Info
            </h5>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {details.sell_type && (
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{details.sell_type}</span>
                </div>
              )}
              {details.original_price && (
                <div className="flex justify-between">
                  <span>Original:</span>
                  <span className="font-medium">₩{details.original_price.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
          <div className="flex gap-2">
            <InspectionRequestForm
              trigger={
                <Button 
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs h-6"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Kërkoni inspektim për ${year} ${make} ${model}`}
                >
                  Inspektim (€50)
                </Button>
              }
            />
            <Button 
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-6 border-primary text-primary hover:bg-primary hover:text-white"
              onClick={handleContactWhatsApp}
              aria-label={`Kontaktoni për më shumë informacion rreth ${year} ${make} ${model}`}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Kontakt
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EncarCarCard;