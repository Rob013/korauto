import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CarCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
}

const CarCard = ({ id, make, model, year, price, image }: CarCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInspectionRequest = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Inspection Requested",
        description: `Professional inspection for ${year} ${make} ${model} has been scheduled. You will be contacted within 24 hours.`,
        duration: 5000,
      });
    }, 2000);
  };

  const fallbackImage = `https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop&auto=format`;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border">
      <div className="relative">
        <img
          src={image || fallbackImage}
          alt={`${year} ${make} ${model}`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-2">
          {year} {make} {model}
        </h3>
        
        <div className="text-2xl font-bold text-primary mb-4">
          €{price?.toLocaleString() || 'Price on request'}
        </div>

        <Button 
          className="w-full bg-inspection hover:bg-inspection/90 text-inspection-foreground"
          onClick={handleInspectionRequest}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Request Inspection (€50)'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CarCard;