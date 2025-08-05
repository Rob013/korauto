import React, { createContext, useContext, useState } from 'react';
import { AdaptiveSelect } from './adaptive-select';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string | React.ReactNode;
  disabled?: boolean;
}

interface SelectContextType {
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

// Root Select component - maintains compatibility with Radix UI API
interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  disabled, 
  children 
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Select Trigger component
interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  className, 
  children 
}) => {
  const { open, setOpen } = useSelectContext();
  
  return (
    <div 
      className={cn("adaptive-select-trigger", className)}
      onClick={() => setOpen(!open)}
    >
      {children}
    </div>
  );
};

// Select Value component
interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ 
  placeholder,
  className 
}) => {
  return (
    <span className={cn("text-sm", className)}>
      {placeholder}
    </span>
  );
};

// Select Content component
interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={cn("adaptive-select-content", className)}>
      {children}
    </div>
  );
};

// Select Item component
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({ 
  value, 
  children,
  className 
}) => {
  const { value: selectedValue, onValueChange } = useSelectContext();
  
  return (
    <div 
      className={cn("adaptive-select-item", className)}
      onClick={() => onValueChange(value)}
    >
      {children}
    </div>
  );
};

// Enhanced Adaptive Select Wrapper
interface EnhancedSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
  options: SelectOption[];
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  value,
  onValueChange,
  disabled,
  placeholder,
  className,
  options
}) => {
  return (
    <AdaptiveSelect
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      options={options}
    />
  );
};

export default Select;