import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { isIPhone } from "@/utils/deviceDetection";
import { useIsMobile } from "@/hooks/use-mobile";

// Car brand categories as specified in requirements
export const CAR_BRAND_CATEGORIES = [
  { value: 'all', label: 'All', id: null },
  { value: 'audi', label: 'Audi', id: '1' },
  { value: 'bmw', label: 'BMW', id: '9' },
  { value: 'mercedes-benz', label: 'Mercedes-Benz', id: '16' },
  { value: 'volkswagen', label: 'Volkswagen', id: '147' },
  { value: 'porsche', label: 'Porsche', id: '142' },
  { value: 'land-rover', label: 'Land Rover', id: '71' },
  { value: 'volvo', label: 'Volvo', id: '162' },
  { value: 'aston-martin', label: 'Aston Martin', id: '8' },
  { value: 'bentley', label: 'Bentley', id: '13' },
] as const;

interface CategoryFilterProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  value = 'all',
  onValueChange,
  disabled = false,
  className = '',
  label = 'Category'
}) => {
  const [shouldUseNative, setShouldUseNative] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Use native select for iPhone to trigger iOS picker
    setShouldUseNative(isIPhone());
  }, []);

  const handleNativeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange(event.target.value);
  };

  // Native HTML select for iPhone
  if (shouldUseNative) {
    return (
      <div className={`space-y-1 category-filter-mobile category-filter-ios ${className}`}>
        <Label htmlFor="category-filter" className="text-xs font-medium">
          {label}
        </Label>
        <select
          id="category-filter"
          value={value}
          onChange={handleNativeChange}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-sm
            bg-background border border-input rounded-md
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            appearance-none
            ${isMobile ? 'h-12 text-base' : 'h-8 text-sm'}
          `}
          style={{
            // Ensure proper iOS styling
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
        >
          {CAR_BRAND_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Custom styled select for other devices
  return (
    <div className={`space-y-1 category-filter-mobile ${className}`}>
      <Label htmlFor="category-filter" className="text-xs font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger 
          className={`
            select-trigger
            ${isMobile ? 'h-12 text-base' : 'h-8 text-xs'}
          `}
          id="category-filter"
        >
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="select-content max-h-60 overflow-y-auto">
          {CAR_BRAND_CATEGORIES.map((category) => (
            <SelectItem 
              key={category.value} 
              value={category.value}
              className={`select-item ${isMobile ? 'text-base py-3' : 'text-sm'}`}
            >
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;