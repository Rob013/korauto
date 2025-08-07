// Shared car details display component to reduce duplication
import { formatPrice, formatMileage } from "@/types/car";
import { AttributeIcons } from "./CarIcons";

interface CarDetailsProps {
  price: number;
  final_price?: number;
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  year: number;
  location?: string;
  layout?: "horizontal" | "vertical";
  showIcons?: boolean;
  className?: string;
}

export const CarDetails = ({
  price,
  final_price,
  mileage,
  transmission,
  fuel,
  color,
  year,
  location,
  layout = "vertical",
  showIcons = true,
  className = ""
}: CarDetailsProps) => {
  const items = [
    { 
      icon: AttributeIcons.price, 
      label: "Price", 
      value: `$${formatPrice(price, final_price)}` 
    },
    { 
      icon: AttributeIcons.year, 
      label: "Year", 
      value: year.toString() 
    },
    mileage && { 
      icon: AttributeIcons.mileage, 
      label: "Mileage", 
      value: formatMileage(mileage) 
    },
    transmission && { 
      icon: AttributeIcons.transmission, 
      label: "Transmission", 
      value: transmission 
    },
    fuel && { 
      icon: AttributeIcons.fuel, 
      label: "Fuel", 
      value: fuel 
    },
    color && { 
      icon: AttributeIcons.color, 
      label: "Color", 
      value: color 
    },
    location && { 
      icon: AttributeIcons.location, 
      label: "Location", 
      value: location 
    }
  ].filter(Boolean);

  const containerClass = layout === "horizontal" 
    ? "flex flex-wrap gap-4" 
    : "space-y-2";

  const itemClass = layout === "horizontal"
    ? "flex items-center gap-1 text-sm"
    : "flex items-center gap-2 text-sm";

  return (
    <div className={`${containerClass} ${className}`}>
      {items.map((item, index) => {
        if (!item) return null;
        
        const Icon = item.icon;
        return (
          <div key={index} className={itemClass}>
            {showIcons && <Icon className="h-4 w-4 text-muted-foreground" />}
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-medium">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
};