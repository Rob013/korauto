import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Heart, MapPin } from "lucide-react";

interface CarCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currentBid?: number;
  imageUrl: string;
  mileage: number;
  location: string;
  endTime: string;
  isLive: boolean;
  watchers?: number;
}

const CarCard = ({ 
  make, 
  model, 
  year, 
  price, 
  currentBid, 
  imageUrl, 
  mileage, 
  location, 
  endTime, 
  isLive,
  watchers = 0 
}: CarCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={imageUrl}
          alt={`${year} ${make} ${model}`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {isLive && (
            <Badge className="bg-red-500 text-white animate-pulse">
              LIVE
            </Badge>
          )}
          <Badge variant="secondary" className="bg-black/80 text-white">
            {watchers} <Eye className="h-3 w-3 ml-1" />
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 text-white hover:bg-white/20"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-foreground">
            {year} {make} {model}
          </h3>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {location}
          </div>
          <div>Mileage: {mileage.toLocaleString()} km</div>
        </div>

        <div className="mt-4 space-y-1">
          {currentBid ? (
            <>
              <div className="text-sm text-muted-foreground">Current Bid</div>
              <div className="text-2xl font-bold text-accent">
                €{currentBid.toLocaleString()}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">Starting Bid</div>
              <div className="text-2xl font-bold text-accent">
                €{price.toLocaleString()}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          Ends: {endTime}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-2">
        <div className="w-full space-y-2">
          <Button className="w-full bg-accent hover:bg-accent/90">
            Place Bid
          </Button>
          <Button variant="outline" className="w-full" size="sm">
            Request Inspection (€50)
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CarCard;