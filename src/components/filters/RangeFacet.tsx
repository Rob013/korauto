import { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface RangeFacetProps {
  title: string;
  field: string;
  min: number;
  max: number;
  step?: number;
  selectedRange?: { min?: number; max?: number };
  onRangeChange: (range: { min?: number; max?: number } | undefined) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
}

export const RangeFacet = ({
  title,
  field,
  min,
  max,
  step = 1,
  selectedRange,
  onRangeChange,
  formatValue = (value) => value.toLocaleString(),
  disabled = false,
  className = '',
  debounceMs = 300,
}: RangeFacetProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sliderValue, setSliderValue] = useState<[number, number]>([
    selectedRange?.min ?? min,
    selectedRange?.max ?? max,
  ]);
  const [inputMin, setInputMin] = useState(selectedRange?.min?.toString() ?? '');
  const [inputMax, setInputMax] = useState(selectedRange?.max?.toString() ?? '');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout>();

  // Update local state when props change
  useEffect(() => {
    if (selectedRange) {
      const newMin = selectedRange.min ?? min;
      const newMax = selectedRange.max ?? max;
      setSliderValue([newMin, newMax]);
      setInputMin(selectedRange.min?.toString() ?? '');
      setInputMax(selectedRange.max?.toString() ?? '');
    } else {
      setSliderValue([min, max]);
      setInputMin('');
      setInputMax('');
    }
  }, [selectedRange, min, max]);

  // Debounced update function
  const debouncedUpdate = useCallback((newRange: { min?: number; max?: number } | undefined) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      onRangeChange(newRange);
    }, debounceMs);

    setDebounceTimeout(timeout);
  }, [onRangeChange, debounceMs, debounceTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // Handle slider change
  const handleSliderChange = (value: [number, number]) => {
    if (disabled) return;
    
    setSliderValue(value);
    setInputMin(value[0] === min ? '' : value[0].toString());
    setInputMax(value[1] === max ? '' : value[1].toString());

    // Create range object
    const range = {
      min: value[0] === min ? undefined : value[0],
      max: value[1] === max ? undefined : value[1],
    };

    // If both values are at defaults, pass undefined to clear the filter
    if (range.min === undefined && range.max === undefined) {
      debouncedUpdate(undefined);
    } else {
      debouncedUpdate(range);
    }
  };

  // Handle input change
  const handleInputChange = (type: 'min' | 'max', value: string) => {
    if (disabled) return;

    if (type === 'min') {
      setInputMin(value);
    } else {
      setInputMax(value);
    }

    // Parse and validate
    const numValue = value === '' ? undefined : parseFloat(value);
    if (value !== '' && (isNaN(numValue!) || numValue! < min || numValue! > max)) {
      return; // Don't update if invalid
    }

    // Update slider and trigger change
    const currentMin = type === 'min' ? numValue : sliderValue[0];
    const currentMax = type === 'max' ? numValue : sliderValue[1];
    
    const newSliderMin = currentMin ?? min;
    const newSliderMax = currentMax ?? max;
    
    // Ensure min <= max
    if (newSliderMin > newSliderMax) return;
    
    setSliderValue([newSliderMin, newSliderMax]);

    const range = {
      min: currentMin,
      max: currentMax,
    };

    // If both values are at defaults or undefined, pass undefined to clear the filter
    if ((range.min === undefined || range.min === min) && 
        (range.max === undefined || range.max === max)) {
      debouncedUpdate(undefined);
    } else {
      debouncedUpdate(range);
    }
  };

  // Clear range
  const handleClear = () => {
    if (disabled) return;
    
    setSliderValue([min, max]);
    setInputMin('');
    setInputMax('');
    onRangeChange(undefined);
  };

  // Check if range is active
  const isActive = selectedRange && (selectedRange.min !== undefined || selectedRange.max !== undefined);

  if (!isExpanded) {
    return (
      <div className={`border rounded-lg p-3 ${className}`}>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto"
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {isActive && (
              <Badge variant="secondary" className="text-xs">
                {selectedRange?.min !== undefined && formatValue(selectedRange.min)}
                {selectedRange?.min !== undefined && selectedRange?.max !== undefined && ' - '}
                {selectedRange?.max !== undefined && formatValue(selectedRange.max)}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-0 h-auto font-medium"
          onClick={() => setIsExpanded(false)}
          disabled={disabled}
        >
          {title}
          {isActive && (
            <Badge variant="secondary" className="text-xs">
              {selectedRange?.min !== undefined && formatValue(selectedRange.min)}
              {selectedRange?.min !== undefined && selectedRange?.max !== undefined && ' - '}
              {selectedRange?.max !== undefined && formatValue(selectedRange.max)}
            </Badge>
          )}
          <ChevronUp className="h-4 w-4" />
        </Button>
        
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="text-xs h-6 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Slider */}
      <div className="px-1 mb-4">
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full"
        />
        
        {/* Range labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${field}-min`} className="text-xs text-muted-foreground">
            Min
          </Label>
          <Input
            id={`${field}-min`}
            type="number"
            placeholder={formatValue(min)}
            value={inputMin}
            onChange={(e) => handleInputChange('min', e.target.value)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
        
        <div>
          <Label htmlFor={`${field}-max`} className="text-xs text-muted-foreground">
            Max
          </Label>
          <Input
            id={`${field}-max`}
            type="number"
            placeholder={formatValue(max)}
            value={inputMax}
            onChange={(e) => handleInputChange('max', e.target.value)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Current range display */}
      {isActive && (
        <div className="mt-3 pt-2 border-t">
          <div className="text-xs text-center text-muted-foreground">
            {selectedRange?.min !== undefined ? formatValue(selectedRange.min) : 'Any'} 
            {' - '}
            {selectedRange?.max !== undefined ? formatValue(selectedRange.max) : 'Any'}
          </div>
        </div>
      )}
    </div>
  );
};