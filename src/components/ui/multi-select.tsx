import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from './checkbox';
import { Badge } from './badge';

interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface MultiSelectProps {
  value?: string[];
  onValueChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayed?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  onValueChange,
  options,
  placeholder = "Select options...",
  className,
  disabled = false,
  maxDisplayed = 2
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOption = (optionValue: string) => {
    if (disabled) return;
    
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onValueChange(newValue);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange([]);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    
    if (value.length <= maxDisplayed) {
      const selectedLabels = value.map(v => 
        options.find(opt => opt.value === v)?.label || v
      );
      return selectedLabels.join(', ');
    }
    
    return `${value.length} selected`;
  };

  const selectedCount = value.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <div className="flex items-center gap-1 flex-1 overflow-hidden">
          <span className={cn(
            "truncate",
            value.length === 0 && "text-muted-foreground"
          )}>
            {getDisplayText()}
          </span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {selectedCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedCount > 0 && (
            <X 
              className="h-4 w-4 text-muted-foreground hover:text-foreground" 
              onClick={handleClearAll}
            />
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No options available
            </div>
          ) : (
            <div className="p-1">
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleToggleOption(option.value)}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Checkbox
                    size="sm"
                    checked={value.includes(option.value)}
                    disabled={option.disabled}
                    onChange={() => {}} // Handled by parent onClick
                  />
                  <span className="flex-1 text-sm">
                    {option.label}
                    {option.count !== undefined && (
                      <span className="text-muted-foreground ml-1">
                        ({option.count})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};