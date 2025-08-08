import React, { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RangeFilter {
  min?: number;
  max?: number;
}

interface RangeFacetProps {
  title: string;
  value: RangeFilter;
  onChange: (value: RangeFilter) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export function RangeFacet({
  title,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  unit = '',
  disabled = false,
  className
}: RangeFacetProps) {
  const [localMin, setLocalMin] = useState<string>(value.min?.toString() || '');
  const [localMax, setLocalMax] = useState<string>(value.max?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);

  // Current slider values
  const sliderValues = useMemo(() => {
    const currentMin = value.min ?? min;
    const currentMax = value.max ?? max;
    return [currentMin, currentMax];
  }, [value.min, value.max, min, max]);

  // Format display value
  const formatDisplayValue = (val: number): string => {
    if (formatValue) {
      return formatValue(val);
    }
    return `${val.toLocaleString()}${unit}`;
  };

  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    const [newMin, newMax] = values;
    const newValue: RangeFilter = {};
    
    if (newMin > min) newValue.min = newMin;
    if (newMax < max) newValue.max = newMax;
    
    onChange(newValue);
  };

  // Handle input change
  const handleInputChange = (type: 'min' | 'max', inputValue: string) => {
    if (type === 'min') {
      setLocalMin(inputValue);
    } else {
      setLocalMax(inputValue);
    }
  };

  // Apply input values
  const applyInputValues = () => {
    const newValue: RangeFilter = {};
    
    const minVal = parseFloat(localMin);
    const maxVal = parseFloat(localMax);
    
    if (!isNaN(minVal) && minVal >= min && minVal <= max) {
      newValue.min = minVal;
    }
    
    if (!isNaN(maxVal) && maxVal >= min && maxVal <= max) {
      newValue.max = maxVal;
    }
    
    // Ensure min <= max
    if (newValue.min && newValue.max && newValue.min > newValue.max) {
      [newValue.min, newValue.max] = [newValue.max, newValue.min];
    }
    
    onChange(newValue);
    setIsEditing(false);
  };

  // Clear filter
  const clearFilter = () => {
    onChange({});
    setLocalMin('');
    setLocalMax('');
  };

  // Check if filter is active
  const isActive = value.min !== undefined || value.max !== undefined;

  // Sync local state when value changes externally
  React.useEffect(() => {
    if (!isEditing) {
      setLocalMin(value.min?.toString() || '');
      setLocalMax(value.max?.toString() || '');
    }
  }, [value.min, value.max, isEditing]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          {title}
          {isActive && (
            <Badge variant="secondary" className="text-xs">
              {formatDisplayValue(value.min ?? min)} - {formatDisplayValue(value.max ?? max)}
            </Badge>
          )}
        </h4>
        {isActive && (
          <button
            onClick={clearFilter}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <Slider
          value={sliderValues}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full"
        />
        
        {/* Range labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatDisplayValue(min)}</span>
          <span>{formatDisplayValue(max)}</span>
        </div>
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Min</Label>
          <Input
            type="number"
            placeholder={min.toString()}
            value={localMin}
            onChange={(e) => handleInputChange('min', e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={applyInputValues}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            disabled={disabled}
            className="text-sm h-8"
            min={min}
            max={max}
            step={step}
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Max</Label>
          <Input
            type="number"
            placeholder={max.toString()}
            value={localMax}
            onChange={(e) => handleInputChange('max', e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={applyInputValues}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            disabled={disabled}
            className="text-sm h-8"
            min={min}
            max={max}
            step={step}
          />
        </div>
      </div>

      {/* Quick preset buttons for common ranges */}
      {title.toLowerCase().includes('price') && (
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'Under 10k', max: 10000 },
            { label: '10k-20k', min: 10000, max: 20000 },
            { label: '20k-50k', min: 20000, max: 50000 },
            { label: 'Over 50k', min: 50000 }
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => onChange(preset)}
              disabled={disabled}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      {title.toLowerCase().includes('year') && (
        <div className="flex flex-wrap gap-1">
          {[
            { label: '2020+', min: 2020 },
            { label: '2015+', min: 2015 },
            { label: '2010+', min: 2010 },
            { label: '2000+', min: 2000 }
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => onChange(preset)}
              disabled={disabled}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      {title.toLowerCase().includes('mileage') && (
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'Under 50k', max: 50000 },
            { label: '50k-100k', min: 50000, max: 100000 },
            { label: '100k-200k', min: 100000, max: 200000 },
            { label: 'Over 200k', min: 200000 }
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => onChange(preset)}
              disabled={disabled}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact range facet for mobile/sidebar use
 */
export function CompactRangeFacet({
  title,
  value,
  onChange,
  min,
  max,
  formatValue,
  unit = '',
  disabled = false,
  className
}: Omit<RangeFacetProps, 'step'>) {
  const isActive = value.min !== undefined || value.max !== undefined;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium">
          {title}
        </h4>
        {isActive && (
          <button
            onClick={() => onChange({})}
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1">
        <Input
          type="number"
          placeholder="Min"
          value={value.min || ''}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange({ ...value, min: isNaN(val) ? undefined : val });
          }}
          disabled={disabled}
          className="text-xs h-7"
          min={min}
          max={max}
        />
        <Input
          type="number"
          placeholder="Max"
          value={value.max || ''}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange({ ...value, max: isNaN(val) ? undefined : val });
          }}
          disabled={disabled}
          className="text-xs h-7"
          min={min}
          max={max}
        />
      </div>

      {isActive && (
        <div className="text-xs text-muted-foreground">
          {formatValue ? formatValue(value.min ?? min) : `${(value.min ?? min).toLocaleString()}${unit}`} - {formatValue ? formatValue(value.max ?? max) : `${(value.max ?? max).toLocaleString()}${unit}`}
        </div>
      )}
    </div>
  );
}