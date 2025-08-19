import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { categorizeGrades, categorizeTrimLevels, deduplicateOptions, groupOptionsByCategory } from "@/utils/gradeUtils";
import { filterRealCars } from "@/utils/filterTestCars";

interface Grade {
  value: string;
  label: string;
}

interface TrimLevel {
  value: string;
  label: string;
}

interface Manufacturer {
  id: number;
  name: string;
  cars_qty?: number;
}

interface Model {
  id: number;
  name: string;
  cars_qty?: number;
}

interface Generation {
  id: number;
  name: string;
  from_year?: number;
  to_year?: number;
  cars_qty?: number;
}

interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  trim_level?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  search?: string;
  seats_count?: string;
  max_accidents?: string;
  per_page?: string;
}

interface FilterProps {
  filters: APIFilters;
  onFiltersChange: (filters: APIFilters) => void;
  manufacturers: Manufacturer[];
  models: Model[];
  generations: Generation[];
  grades: Grade[];
  trimLevels: TrimLevel[];
  filterCounts?: any;
  onManufacturerChange?: (manufacturerId: string) => void;
  onModelChange?: (modelId: string) => void;
  fetchGrades?: (filters: any) => Promise<Grade[]>;
  fetchTrimLevels?: (filters: any) => Promise<TrimLevel[]>;
  isLoading?: boolean;
  isLoadingManufacturers?: boolean;
  isLoadingModels?: boolean;
  isLoadingGenerations?: boolean;
  isLoadingGrades?: boolean;
  isLoadingTrimLevels?: boolean;
  showAllFilters?: boolean;
}

const ImprovedEncarStyleFilter: React.FC<FilterProps> = ({
  filters,
  onFiltersChange,
  manufacturers = [],
  models = [],
  generations = [],
  grades = [],
  trimLevels = [],
  filterCounts,
  onManufacturerChange,
  onModelChange,
  fetchGrades,
  fetchTrimLevels,
  isLoading = false,
  isLoadingManufacturers = false,
  isLoadingModels = false,
  isLoadingGenerations = false,
  isLoadingGrades = false,
  isLoadingTrimLevels = false,
  showAllFilters = true
}) => {
  const { toast } = useToast();
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingTrimLevels, setLoadingTrimLevels] = useState(false);

  // Filter out test manufacturers and invalid entries
  const validManufacturers = useMemo(() => {
    return manufacturers.filter(m => 
      m.id && 
      m.name && 
      typeof m.name === 'string' && 
      m.name.trim().length > 0 &&
      !['test', 'demo', 'sample', 'fake'].some(word => 
        m.name.toLowerCase().includes(word)
      ) &&
      (m.cars_qty && m.cars_qty > 0)
    ).map(m => ({
      value: m.id.toString(),
      label: `${m.name} ${m.cars_qty ? `(${m.cars_qty})` : ''}`
    }));
  }, [manufacturers]);

  // Filter out test models and invalid entries
  const validModels = useMemo(() => {
    return models.filter(m => 
      m.id && 
      m.name && 
      typeof m.name === 'string' && 
      m.name.trim().length > 0 &&
      !['test', 'demo', 'sample', 'fake'].some(word => 
        m.name.toLowerCase().includes(word)
      )
    ).map(m => ({
      value: m.id.toString(),
      label: `${m.name} ${m.cars_qty ? `(${m.cars_qty})` : ''}`
    }));
  }, [models]);

  // Filter out test generations and invalid entries
  const validGenerations = useMemo(() => {
    return generations.filter(g => 
      g.id && 
      g.name && 
      typeof g.name === 'string' && 
      g.name.trim().length > 0 &&
      !['test', 'demo', 'sample', 'fake'].some(word => 
        g.name.toLowerCase().includes(word)
      )
    ).map(g => ({
      value: g.id.toString(),
      label: `${g.name} ${g.from_year && g.to_year ? `(${g.from_year}-${g.to_year})` : ''} ${g.cars_qty ? `(${g.cars_qty})` : ''}`
    }));
  }, [generations]);

  // Categorize and deduplicate grades
  const categorizedGrades = useMemo(() => {
    const validGrades = grades.filter(g => 
      g.value && 
      g.label && 
      !['test', 'demo', 'sample', 'fake'].some(word => 
        g.label.toLowerCase().includes(word)
      )
    );
    
    const deduplicatedGrades = deduplicateOptions(validGrades);
    return categorizeGrades(deduplicatedGrades);
  }, [grades]);

  // Categorize and deduplicate trim levels
  const categorizedTrimLevels = useMemo(() => {
    const validTrimLevels = trimLevels.filter(t => 
      t.value && 
      t.label && 
      !['test', 'demo', 'sample', 'fake'].some(word => 
        t.label.toLowerCase().includes(word)
      )
    );
    
    const deduplicatedTrimLevels = deduplicateOptions(validTrimLevels);
    return categorizeTrimLevels(deduplicatedTrimLevels);
  }, [trimLevels]);

  // Group grades by category for dropdown rendering
  const gradeGroups = useMemo(() => {
    return groupOptionsByCategory(categorizedGrades);
  }, [categorizedGrades]);

  // Group trim levels by category for dropdown rendering
  const trimLevelGroups = useMemo(() => {
    return groupOptionsByCategory(categorizedTrimLevels);
  }, [categorizedTrimLevels]);

  const handleManufacturerChange = useCallback(async (manufacturerId: string) => {
    const newFilters = { 
      ...filters, 
      manufacturer_id: manufacturerId || undefined,
      model_id: undefined,
      generation_id: undefined,
      grade_iaai: undefined,
      trim_level: undefined
    };
    
    onFiltersChange(newFilters);
    
    if (onManufacturerChange) {
      onManufacturerChange(manufacturerId);
    }
  }, [filters, onFiltersChange, onManufacturerChange]);

  const handleModelChange = useCallback(async (modelId: string) => {
    const newFilters = { 
      ...filters, 
      model_id: modelId || undefined,
      generation_id: undefined,
      grade_iaai: undefined,
      trim_level: undefined
    };
    
    onFiltersChange(newFilters);
    
    if (onModelChange) {
      onModelChange(modelId);
    }

    // Load grades for the selected model
    if (fetchGrades && modelId) {
      setLoadingGrades(true);
      try {
        await fetchGrades({ model_id: modelId });
      } catch (error) {
        console.error('Failed to load grades:', error);
      } finally {
        setLoadingGrades(false);
      }
    }

    // Load trim levels for the selected model
    if (fetchTrimLevels && modelId) {
      setLoadingTrimLevels(true);
      try {
        await fetchTrimLevels({ model_id: modelId });
      } catch (error) {
        console.error('Failed to load trim levels:', error);
      } finally {
        setLoadingTrimLevels(false);
      }
    }
  }, [filters, onFiltersChange, onModelChange, fetchGrades, fetchTrimLevels]);

  const handleFieldChange = useCallback((field: keyof APIFilters, value: string | undefined) => {
    const newFilters = { ...filters, [field]: value || undefined };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = currentYear + 2 - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Basic color options
  const colorOptions = [
    { value: 'Black', label: 'Black' },
    { value: 'White', label: 'White' },
    { value: 'Silver', label: 'Silver' },
    { value: 'Gray', label: 'Gray' },
    { value: 'Blue', label: 'Blue' },
    { value: 'Red', label: 'Red' },
    { value: 'Green', label: 'Green' },
    { value: 'Yellow', label: 'Yellow' },
  ];

  // Basic fuel type options
  const fuelTypeOptions = [
    { value: 'Gasoline', label: 'Gasoline' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'Hybrid', label: 'Hybrid' },
    { value: 'Electric', label: 'Electric' },
  ];

  // Basic transmission options
  const transmissionOptions = [
    { value: 'Automatic', label: 'Automatic' },
    { value: 'Manual', label: 'Manual' },
    { value: 'CVT', label: 'CVT' },
  ];

  return (
    <div className="space-y-4">
      {/* Manufacturer */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Brand
        </label>
        <Select
          value={filters.manufacturer_id || ""}
          onValueChange={handleManufacturerChange}
          disabled={isLoadingManufacturers}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Brand" />
          </SelectTrigger>
          <SelectContent>
            {validManufacturers.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      {filters.manufacturer_id && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Model
          </label>
          <Select
            value={filters.model_id || ""}
            onValueChange={handleModelChange}
            disabled={isLoadingModels}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              {validModels.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Generation */}
      {filters.model_id && validGenerations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Generation
          </label>
          <Select
            value={filters.generation_id || ""}
            onValueChange={(value) => handleFieldChange('generation_id', value)}
            disabled={isLoadingGenerations}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Generation" />
            </SelectTrigger>
            <SelectContent>
              {validGenerations.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Grade/Engine - Categorized */}
      {showAllFilters && categorizedGrades.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Grade / Engine
          </label>
          <Select
            value={filters.grade_iaai || ""}
            onValueChange={(value) => handleFieldChange('grade_iaai', value)}
            disabled={loadingGrades || isLoadingGrades}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Grade/Engine" />
            </SelectTrigger>
            <SelectContent>
              {gradeGroups.map((group) => (
                <div key={group.category}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {group.category}
                  </div>
                  {group.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Trim Level - Categorized */}
      {showAllFilters && categorizedTrimLevels.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Trim Level
          </label>
          <Select
            value={filters.trim_level || ""}
            onValueChange={(value) => handleFieldChange('trim_level', value)}
            disabled={loadingTrimLevels || isLoadingTrimLevels}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Trim Level" />
            </SelectTrigger>
            <SelectContent>
              {trimLevelGroups.map((group) => (
                <div key={group.category}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {group.category}
                  </div>
                  {group.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Color */}
      {showAllFilters && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Color
          </label>
          <Select
            value={filters.color || ""}
            onValueChange={(value) => handleFieldChange('color', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Color" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Fuel Type */}
      {showAllFilters && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Fuel Type
          </label>
          <Select
            value={filters.fuel_type || ""}
            onValueChange={(value) => handleFieldChange('fuel_type', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Fuel Type" />
            </SelectTrigger>
            <SelectContent>
              {fuelTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Transmission */}
      {showAllFilters && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Transmission
          </label>
          <Select
            value={filters.transmission || ""}
            onValueChange={(value) => handleFieldChange('transmission', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Transmission" />
            </SelectTrigger>
            <SelectContent>
              {transmissionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Year Range */}
      {showAllFilters && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              From Year
            </label>
            <Select
              value={filters.from_year || ""}
              onValueChange={(value) => handleFieldChange('from_year', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              To Year
            </label>
            <Select
              value={filters.to_year || ""}
              onValueChange={(value) => handleFieldChange('to_year', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="To" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      <Button
        variant="outline"
        onClick={handleClearFilters}
        className="w-full"
        disabled={isLoading}
      >
        Clear All Filters
      </Button>
    </div>
  );
};

export default ImprovedEncarStyleFilter;