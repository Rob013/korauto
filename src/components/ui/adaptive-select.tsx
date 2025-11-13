import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string | React.ReactNode;
  disabled?: boolean;
  icon?: string;
}

interface AdaptiveSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  options: SelectOption[];
  forceNative?: boolean;
}

interface AdaptiveSelectTriggerProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

interface AdaptiveSelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface AdaptiveSelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect: (value: string) => void;
  isSelected: boolean;
  className?: string;
}

// Enhanced device detection utility with comprehensive Apple device support
const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isMac: false,
    isAndroid: false,
    isMobile: false,
    isTouch: false,
    isPad: false
  });
  
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Enhanced iOS detection (includes iPhone, iPad, iPod)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    // iPad specific detection (including iPad Pro running iPadOS)
    const isPad = /iPad/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Enhanced Mac detection (Mac, Mac Mini, iMac, MacBook, Mac Pro, Mac Studio)
    // Includes all Apple desktop and laptop computers
    const isMac = /Macintosh|Mac OS X|MacIntel/.test(userAgent) && !isIOS && !isPad;
    
    // Android detection
    const isAndroid = /Android/.test(userAgent);
    
    // Mobile detection (screen size + user agent)
    const isMobileUA = /Mobi|Android/i.test(userAgent);
    const isMobileScreen = window.matchMedia('(max-width: 768px)').matches;
    const isMobile = isMobileUA || isMobileScreen;
    
    // Touch device detection
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    setDeviceInfo({
      isIOS,
      isMac,
      isAndroid,
      isMobile,
      isTouch,
      isPad
    });
  }, []);
  
  return deviceInfo;
};

// Helper function to extract text from JSX or React elements
const extractTextFromJSX = (element: any): string => {
  if (typeof element === 'string') {
    return element;
  }
  
  if (typeof element === 'number') {
    return element.toString();
  }
  
  if (React.isValidElement(element)) {
    // If it's a React element, try to extract text from its children
    const children = (element.props as any)?.children;
    
    if (Array.isArray(children)) {
      // Handle array of children - concatenate text from all elements
      return children
        .map(child => extractTextFromJSX(child))
        .filter(text => text && text.trim())
        .join(' ');
    } else if (children) {
      return extractTextFromJSX(children);
    }
  }
  
  if (Array.isArray(element)) {
    return element
      .map(item => extractTextFromJSX(item))
      .filter(text => text && text.trim())
      .join(' ');
  }
  
  // Fallback to empty string for other types
  return '';
};

// Enhanced Native HTML Select for mobile devices and touch interfaces
const NativeSelect: React.FC<AdaptiveSelectProps> = ({
  value,
  onValueChange,
  disabled,
  placeholder,
  className,
  options
}) => {
  const selectedOption = options.find(option => option.value === value);
  const arrowSvg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3e%3c/svg%3e";
  const iconBackground = selectedOption?.icon ? `url("${selectedOption.icon}")` : undefined;
  const backgroundImage = iconBackground ? `${iconBackground}, url("${arrowSvg}")` : `url("${arrowSvg}")`;
  const backgroundPosition = iconBackground ? 'left 0.75rem center, right 0.75rem center' : 'right 0.75rem center';
  const backgroundSize = iconBackground ? '1.5rem 1.5rem, 1rem' : '1rem';
  const backgroundRepeat = iconBackground ? 'no-repeat, no-repeat' : 'no-repeat';

  return (
    <select
      value={value || ''}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "appearance-none", // Remove default styling
        // Enhanced mobile styling for iOS/iPad
        "min-h-[44px] text-[16px] sm:text-sm", // iOS-friendly touch target and font size (16px prevents zoom)
        // iPad specific styling
        "md:min-h-[48px]", // Larger touch targets on tablets
        // iOS Safari specific fixes
        "-webkit-appearance-none",
        "focus:-webkit-appearance-none",
        // Dark mode specific styling for native select
        "dark:bg-background dark:border-border dark:text-foreground",
        "dark:focus:ring-ring dark:focus:ring-offset-background",
        className
      )}
      style={{
        backgroundImage,
        backgroundPosition,
        backgroundSize,
        backgroundRepeat,
        paddingLeft: iconBackground ? '3rem' : undefined,
        paddingRight: '2.5rem',
        // iOS Safari specific fixes
        WebkitAppearance: 'none',
        MozAppearance: 'none'
      }}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((option) => {
        // Extract text content from JSX labels or use the label as-is if it's a string
        const displayText = typeof option.label === 'string'
          ? option.label
          : extractTextFromJSX(option.label) || option.value;

        if (option.value.startsWith('separator-')) {
          return (
            <option
              key={option.value}
              value={option.value}
              disabled
              className="py-2 px-3 font-semibold text-muted-foreground"
            >
              {displayText}
            </option>
          );
        }

        return (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="py-2 px-3 dark:bg-background dark:text-foreground"
          >
            {displayText}
          </option>
        );
      })}
    </select>
  );
};

// Custom Select Item Component
const AdaptiveSelectItem: React.FC<AdaptiveSelectItemProps> = ({
  value,
  children,
  onSelect,
  isSelected,
  className
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(value);
    }
  };

  return (
    <div
      role="option"
      tabIndex={-1}
      aria-selected={isSelected}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onPointerDown={(event) => {
        event.preventDefault();
        onSelect(value);
      }}
      onKeyDown={handleKeyDown}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="block truncate">{children}</span>
    </div>
  );
};

// Custom Select Trigger Component
const AdaptiveSelectTrigger: React.FC<AdaptiveSelectTriggerProps> = ({
  className,
  children,
  onClick,
  disabled
}) => {
  return (
    <button
      type="button"
      role="combobox"
      aria-expanded="false"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

// Custom Select Content Component
const AdaptiveSelectContent: React.FC<AdaptiveSelectContentProps> = ({
  children,
  className
}) => {
  return (
    <div
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        "absolute top-full left-0 right-0 mt-1",
        className
      )}
    >
      <div className="p-1 max-h-60 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

// Custom Dropdown for Desktop/Android
const CustomSelect: React.FC<AdaptiveSelectProps> = ({
  value,
  onValueChange,
  disabled,
  placeholder,
  className,
  options
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    const option = options.find(opt => opt.value === optionValue);
    if (!option) return;

    if (option.disabled) {
      return;
    }

    // Don't allow selection of separator items
    if (optionValue.startsWith('separator-')) {
      return;
    }

    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={selectRef}>
      <AdaptiveSelectTrigger
        onClick={handleToggle}
        disabled={disabled}
        className={className}
      >
        <span className={cn(
          "block truncate",
          !selectedOption && "text-muted-foreground"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </AdaptiveSelectTrigger>
      
      {isOpen && (
        <AdaptiveSelectContent>
          {options.map((option) => {
            // Handle separator items differently
            if (option.value.startsWith('separator-')) {
              return (
                <div
                  key={option.value}
                  className="px-2 py-1 text-xs font-medium text-muted-foreground border-b border-border text-center"
                >
                  {option.label}
                </div>
              );
            }
            
            return (
              <AdaptiveSelectItem
                key={option.value}
                value={option.value}
                onSelect={handleSelect}
                isSelected={option.value === value}
                className={option.disabled ? "opacity-50 cursor-not-allowed" : ""}
              >
                {option.label}
              </AdaptiveSelectItem>
            );
          })}
        </AdaptiveSelectContent>
      )}
    </div>
  );
};

// Main Adaptive Select Component with improved device detection
export const AdaptiveSelect: React.FC<AdaptiveSelectProps> = (props) => {
  const { forceNative, ...rest } = props;
  const { isIOS, isMac, isAndroid, isMobile, isTouch, isPad } = useDeviceDetection();

  // Enhanced logic for when to use native select:
  // 1. ALL Apple devices (iPhone, iPad, Mac, Mac Mini) - always use native for best UX
  // 2. Android mobile devices - use native
  // 3. Touch devices with small screens - use native
  // 4. Other desktop devices - use custom select for better styling control
  const shouldUseNative = useMemo(() => {
    if (forceNative) {
      return true;
    }

    // Always use native on iOS (iPhone, iPad, iPod)
    if (isIOS) return true;

    // Always use native on iPad (even when not detected as iOS)
    if (isPad) return true;
    
    // Always use native on Mac devices (Mac, Mac Mini, iMac, MacBook)
    if (isMac) return true;
    
    // Use native on Android mobile devices
    if (isAndroid && isMobile) return true;
    
    // Use native on small touch screens
    if (isTouch && isMobile) return true;
    
    // Use custom select for non-Apple desktop devices
    return false;
  }, [forceNative, isIOS, isPad, isMac, isAndroid, isMobile, isTouch]);

  if (shouldUseNative) {
    return <NativeSelect {...props} />;
  }

  return <CustomSelect {...rest} />;
};

// Helper components for compatibility with existing Radix UI usage
export const AdaptiveSelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return <span className="placeholder">{placeholder}</span>;
};

// CSS styles for enhanced mobile and cross-device optimization with Apple device focus
export const adaptiveSelectStyles = `
/* Base responsive optimizations for all devices */
.adaptive-select-trigger {
  min-height: 44px; /* iOS and Android friendly touch target */
  transition: all 0.2s ease;
}

/* Mobile optimization for touch devices */
@media (max-width: 768px), (pointer: coarse) {
  .adaptive-select-trigger {
    height: 48px; /* Larger touch target for mobile */
    font-size: 16px; /* Prevent zoom on iOS */
    padding: 12px 16px;
  }
  
  .adaptive-select-content {
    max-height: 60vh; /* Limit height on mobile */
    margin-top: 4px;
  }
  
  .adaptive-select-item {
    padding: 16px 20px; /* Larger touch targets */
    min-height: 48px;
    font-size: 16px;
  }
}

/* iPad specific optimizations */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait),
       (min-width: 1024px) and (max-width: 1366px) and (orientation: landscape) {
  .adaptive-select-trigger {
    height: 44px;
    font-size: 16px;
  }
}

/* Enhanced macOS optimization for all Mac devices (iMac, MacBook, Mac Mini, Mac Pro, Mac Studio) */
@supports (-webkit-touch-callout: none) {
  .adaptive-select select {
    font-size: 16px; /* Prevent zoom */
    border-radius: 8px; /* macOS-style corners */
    -webkit-appearance: none;
    appearance: none;
    background-color: var(--background);
    border-color: var(--border);
  }
  
  /* Enhanced focus styling for macOS Safari */
  .adaptive-select select:focus {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring));
    border-color: hsl(var(--ring));
  }
}

/* macOS Safari specific native select optimizations */
@media (min-width: 1024px) and (-webkit-min-device-pixel-ratio: 1) {
  .adaptive-select select {
    min-height: 40px;
    font-size: 14px;
    padding: 8px 12px;
    background-color: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
  }
  
  .adaptive-select select:hover {
    border-color: hsl(var(--ring));
  }
  
  .adaptive-select select:focus {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring));
    border-color: hsl(var(--ring));
  }
}

/* Dark mode specific styling for native select elements on Apple devices */
.dark .adaptive-select select {
  background-color: hsl(var(--background));
  border-color: hsl(var(--border));
  color: hsl(var(--foreground));
}

.dark .adaptive-select select:focus {
  ring-color: hsl(var(--ring));
  ring-offset-color: hsl(var(--background));
}

.dark .adaptive-select select option {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* Enhanced hover states for non-touch devices (desktop Macs with mouse) */
@media (hover: hover) and (pointer: fine) {
  .adaptive-select-trigger:hover {
    background-color: hsl(var(--accent));
  }
  
  .adaptive-select-item:hover {
    background-color: hsl(var(--accent));
  }
  
  .adaptive-select select:hover {
    border-color: hsl(var(--ring));
  }
}

/* High DPI display optimizations for Retina displays (Mac devices) */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .adaptive-select-trigger {
    border-width: 0.5px;
  }
  
  .adaptive-select select {
    border-width: 0.5px;
  }
}
`;

export default AdaptiveSelect;