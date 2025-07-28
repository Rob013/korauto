import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, X, Loader2 } from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '@/hooks/useAuctionAPI';

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
}

interface Generation {
  id: number;
  name: string;
  car_count?: number;
}

interface FilterCounts {
  manufacturers: { [key: string]: number };
  models: { [key: string]: number };
  generations: { [key: string]: number };
  colors: { [key: string]: number };
  fuelTypes: { [key: string]: number };
  transmissions: { [key: string]: number };
  years: { [key: string]: number };
}

interface FilterFormProps {
  filters: {
    manufacturer_id?: string;
    model_id?: string;
    generation_id?: string;
    color?: string;
    fuel_type?: string;
    transmission?: string;
    odometer_from_km?: string;
    odometer_to_km?: string;
    from_year?: string;
    to_year?: string;
    buy_now_price_from?: string;
    buy_now_price_to?: string;
  };
  manufacturers: Manufacturer[];
  models?: Model[];
  generations?: Generation[];
  filterCounts?: FilterCounts;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  onManufacturerChange?: (manufacturerId: string) => void;
  onModelChange?: (modelId: string) => void;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
  loadingCounts?: boolean;
}

const FilterForm: React.FC<FilterFormProps> = ({
  filters,
  manufacturers,
  models = [],
  generations = [],
  filterCounts,
  loadingCounts = false,
  onFiltersChange,
  onClearFilters,
  onManufacturerChange,
  onModelChange,
  showAdvanced = false,
  onToggleAdvanced
}) => {
  const updateFilter = (key: string, value: string) => {
    // Handle special "all" values by converting them to undefined
    const actualValue = value === 'all' || value === 'any' ? undefined : value;
    
    // Handle cascading filters
    if (key === 'manufacturer_id') {
      onManufacturerChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        model_id: undefined,
        generation_id: undefined
      });
    } else if (key === 'model_id') {
      onModelChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        generation_id: undefined
      });
    } else {
      onFiltersChange({
        ...filters,
        [key]: actualValue
      });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="text-lg font-semibold">Filtrat</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Pastro
        </Button>
      </div>

      {/* Basic Filters - Only Brand, Model, Generation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Marka</Label>
          <Select value={filters.manufacturer_id || 'all'} onValueChange={(value) => updateFilter('manufacturer_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Të gjitha Markat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjitha Markat</SelectItem>
              {manufacturers.map((manufacturer) => {
                const count = filterCounts?.manufacturers[manufacturer.id.toString()];
                const isDisabled = count === 0;
                return (
                  <SelectItem 
                    key={manufacturer.id} 
                    value={manufacturer.id.toString()}
                    disabled={isDisabled}
                    className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {manufacturer.name} {count !== undefined && `(${count})`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Modeli</Label>
          <Select 
            value={filters.model_id || 'all'} 
            onValueChange={(value) => updateFilter('model_id', value)}
            disabled={!filters.manufacturer_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={filters.manufacturer_id ? "Të gjithë Modelet" : "Zgjidh markën së pari"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjithë Modelet</SelectItem>
              {models.map((model) => {
                const count = filterCounts?.models[model.id.toString()];
                const isDisabled = count === 0;
                return (
                  <SelectItem 
                    key={model.id} 
                    value={model.id.toString()}
                    disabled={isDisabled}
                    className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {model.name} {count !== undefined && `(${count})`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="generation">Gjeneratat</Label>
          <Select
            value={filters.generation_id || 'all'} 
            onValueChange={(value) => updateFilter('generation_id', value)}
            disabled={!filters.model_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={filters.model_id ? "Të gjitha Gjeneratat" : "Zgjidh modelin së pari"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjitha Gjeneratat</SelectItem>
              {generations.map((generation) => {
                const count = filterCounts?.generations[generation.id.toString()];
                const isDisabled = count === 0;
                return (
                  <SelectItem 
                    key={generation.id} 
                    value={generation.id.toString()}
                    disabled={isDisabled}
                    className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {generation.name} {count !== undefined && `(${count})`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggle Advanced Filters */}
      {onToggleAdvanced && (
        <Button variant="ghost" size="sm" onClick={onToggleAdvanced}>
          {showAdvanced ? 'Fshih' : 'Shfaq'} Filtrat e Avancuara
        </Button>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Ngjyra</Label>
              <Select value={filters.color || 'all'} onValueChange={(value) => updateFilter('color', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Të gjitha Ngjyrat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjitha Ngjyrat</SelectItem>
                  {Object.entries(COLOR_OPTIONS).map(([name, id]) => {
                    return (
                      <SelectItem 
                        key={id} 
                        value={id.toString()}
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel_type">Lloji i Karburantit</Label>
              <Select value={filters.fuel_type || 'all'} onValueChange={(value) => updateFilter('fuel_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Të gjithë Llojet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjithë Llojet</SelectItem>
                  {Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => {
                    return (
                      <SelectItem 
                        key={id} 
                        value={id.toString()}
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transmission">Transmisioni</Label>
              <Select value={filters.transmission || 'all'} onValueChange={(value) => updateFilter('transmission', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Të gjithë" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjithë</SelectItem>
                  {Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => {
                    return (
                      <SelectItem 
                        key={id} 
                        value={id.toString()}
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_year">Nga Viti</Label>
              <Select value={filters.from_year || 'any'} onValueChange={(value) => updateFilter('from_year', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Çdo vit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Çdo vit</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to_year">Deri në Vitin</Label>
              <Select value={filters.to_year || 'any'} onValueChange={(value) => updateFilter('to_year', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Çdo vit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Çdo vit</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Intervali i Çmimit (Blerje direkte)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Minimum"
                  type="number"
                  value={filters.buy_now_price_from || ''}
                  onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                />
                <Input
                  placeholder="Maksimum"
                  type="number"
                  value={filters.buy_now_price_to || ''}
                  onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Intervali i Kilometrazhit (km)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Minimum"
                  type="number"
                  value={filters.odometer_from_km || ''}
                  onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                />
                <Input
                  placeholder="Maksimum"
                  type="number"
                  value={filters.odometer_to_km || ''}
                  onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterForm;