import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Car, Search, Gauge, Settings, Fuel, Palette, Hash } from "lucide-react";
import InspectionRequestForm from "@/components/InspectionRequestForm";
interface CarCardProps {
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
}
const CarCard = ({
  id,
  make,
  model,
  year,
  price,
  image,
  vin,
  mileage,
  transmission,
  fuel,
  color,
  condition,
  lot,
  title
}: CarCardProps) => {
  const navigate = useNavigate();
  const handleCardClick = () => {
    navigate(`/car/${id}`);
  };
  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-500 border border-border cursor-pointer hover:scale-[1.02] hover:border-primary/20" onClick={handleCardClick}>
      <div className="relative h-56 bg-gradient-to-br from-muted to-muted/80 overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={`${year} ${make} ${model}`} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            onError={e => {
              e.currentTarget.src = "/placeholder.svg";
            }} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
            <Car className="h-20 w-20 text-muted-foreground/50" />
          </div>
        )}
        {lot && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
            Kodi #{lot}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-5 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-foreground tracking-tight leading-tight">
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-sm text-muted-foreground mt-1 font-medium">{title}</p>
          )}
        </div>

        {/* Car Details Grid */}
        <div className="grid grid-cols-2 gap-3 py-2">
          {mileage && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{mileage}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground capitalize">{transmission}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Fuel className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground capitalize">{fuel}</span>
            </div>
          )}
          {color && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground capitalize">{color}</span>
            </div>
          )}
        </div>

        {/* VIN */}
        {vin && (
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
            <Hash className="h-4 w-4 text-accent" />
            <span className="text-xs font-mono text-muted-foreground tracking-wider">{vin}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-center py-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            €{price.toLocaleString()}
          </span>
        </div>

        {/* Action Button */}
        <InspectionRequestForm
          carId={id}
          carMake={make}
          carModel={model}
          carYear={year}
          trigger={
            <Button
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
              size="lg"
              aria-label={`Request inspection for ${year} ${make} ${model}`}
            >
              <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Kërko Inspektim (€50)
            </Button>
          }
        />
        
        {/* Footer */}
        <div className="text-center pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground font-medium">
            KORAUTO Shërbim profesional i importit
          </p>
        </div>
      </div>
    </div>
  );
};
export default CarCard;