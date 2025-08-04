import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string | React.ReactNode;
  disabled?: boolean;
}

interface AdaptiveSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  options: SelectOption[];
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

// Device detection utility
const useDeviceDetection = () => {
  const [isIPhone, setIsIPhone] = useState(false);
  
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    setIsIPhone(/iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
  }, []);
  
  return { isIPhone };
};

// Native HTML Select for iPhone
const NativeSelect: React.FC<AdaptiveSelectProps> = ({
  value,
  onValueChange,
  disabled,
  placeholder,
  className,
  options
}) => {
  return (
    <select
      value={value || ''}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "appearance-none", // Remove default styling
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '1rem',
        backgroundRepeat: 'no-repeat',
        paddingRight: '2.5rem'
      }}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
          disabled={option.disabled}
        >
          {typeof option.label === 'string' ? option.label : option.value}
        </option>
      ))}
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
  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={() => onSelect(value)}
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
          {options.map((option) => (
            <AdaptiveSelectItem
              key={option.value}
              value={option.value}
              onSelect={handleSelect}
              isSelected={option.value === value}
            >
              {option.label}
            </AdaptiveSelectItem>
          ))}
        </AdaptiveSelectContent>
      )}
    </div>
  );
};

// Main Adaptive Select Component
export const AdaptiveSelect: React.FC<AdaptiveSelectProps> = (props) => {
  const { isIPhone } = useDeviceDetection();

  // Add media query detection for mobile devices
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Use native select for iPhone or mobile devices, custom select for desktop
  if (isIPhone || isMobile) {
    return <NativeSelect {...props} />;
  }

  return <CustomSelect {...props} />;
};

// Helper components for compatibility with existing Radix UI usage
export const AdaptiveSelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return <span className="placeholder">{placeholder}</span>;
};

// CSS styles for mobile optimization
export const adaptiveSelectStyles = `
/* Mobile optimization for max-width: 768px */
@media (max-width: 768px) {
  .adaptive-select-trigger {
    height: 44px; /* iOS-friendly touch target */
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  .adaptive-select-content {
    max-height: 50vh; /* Limit height on mobile */
  }
  
  .adaptive-select-item {
    padding: 12px 16px; /* Larger touch targets */
    min-height: 44px;
  }
}

/* iPhone specific optimizations */
@supports (-webkit-touch-callout: none) {
  .adaptive-select select {
    font-size: 16px; /* Prevent zoom */
    border-radius: 8px; /* iOS-style corners */
  }
}
`;

export default AdaptiveSelect;