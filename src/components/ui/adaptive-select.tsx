import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { shouldUseNativeSelect, isIPhone, isIPad, isTouchDevice } from "@/utils/deviceDetection";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

interface AdaptiveSelectOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface AdaptiveSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: AdaptiveSelectOption[];
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  id?: string;
  showCounts?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
}

const AdaptiveSelect: React.FC<AdaptiveSelectProps> = ({
  value = '',
  onValueChange,
  options = [],
  disabled = false,
  loading = false,
  className = '',
  label,
  placeholder = "Select an option",
  id,
  showCounts = true,
  emptyMessage = "No options available",
  loadingMessage = "Loading..."
}) => {
  const [shouldUseNative, setShouldUseNative] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Use native select for mobile devices, tablets (including iPad), and touch devices
    setShouldUseNative(shouldUseNativeSelect());
  }, []);

  const handleNativeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange(event.target.value);
  };

  // Get device-specific CSS classes
  const getDeviceClasses = () => {
    const baseClasses = 'w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-colors';
    
    if (isIPhone()) {
      return `${baseClasses} h-12 text-base adaptive-select-ios min-h-[48px]`;
    } else if (isIPad()) {
      return `${baseClasses} h-11 text-base adaptive-select-ipad min-h-[44px]`;
    } else if (isMobile || isTouchDevice()) {
      return `${baseClasses} h-11 text-base adaptive-select-touch min-h-[44px]`;
    } else {
      return `${baseClasses} h-10 text-sm adaptive-select-desktop`;
    }
  };

  // Native HTML select for mobile devices, tablets, and touch devices
  if (shouldUseNative) {
    return (
      <div className={`space-y-1 adaptive-select-container adaptive-select-native ${className}`}>
        {label && (
          <Label htmlFor={id} className="text-xs font-medium">
            {label}
          </Label>
        )}
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={handleNativeChange}
            disabled={disabled || loading}
            className={getDeviceClasses()}
            style={{
              // Ensure proper native styling across all devices
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              backgroundImage: loading ? 'none' : `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: loading ? '2.5rem' : '2.5rem'
            }}
          >
            {placeholder && (
              <option value="" disabled>
                {loading ? loadingMessage : placeholder}
              </option>
            )}
            {loading ? (
              <option value="" disabled>{loadingMessage}</option>
            ) : options.length === 0 ? (
              <option value="" disabled>{emptyMessage}</option>
            ) : (
              options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value} 
                  disabled={option.disabled}
                >
                  {option.label}
                  {showCounts && option.count !== undefined ? ` (${option.count})` : ''}
                </option>
              ))
            )}
          </select>
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Custom styled select for other devices
  return (
    <div className={`space-y-1 adaptive-select-container adaptive-select-custom ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
        <SelectTrigger 
          className={`
            adaptive-select-trigger
            ${isMobile ? 'h-12 text-base min-h-[48px]' : 'h-8 text-xs'}
            ${loading ? 'cursor-wait' : ''}
          `}
          id={id}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{loadingMessage}</span>
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent className="adaptive-select-content max-h-60 overflow-y-auto">
          {loading ? (
            <SelectItem value="" disabled>
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{loadingMessage}</span>
              </div>
            </SelectItem>
          ) : options.length === 0 ? (
            <SelectItem value="" disabled>
              {emptyMessage}
            </SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className={`adaptive-select-item ${isMobile ? 'text-base py-3 min-h-[44px]' : 'text-sm'}`}
              >
                {option.label}
                {showCounts && option.count !== undefined ? ` (${option.count})` : ''}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AdaptiveSelect;