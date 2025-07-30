import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import FilterForm from '@/components/FilterForm';
import { getSortOptions, SortOption } from '@/hooks/useSortedCars';

interface APIFilters {
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
  search?: string;
  seats_count?: string;
}

interface CatalogFiltersProps {
  filters: APIFilters;
  manufacturers: any[];
  models: any[];
  generations: any[];
  filterCounts: any;
  loadingCounts: boolean;
  showAdvancedFilters: boolean;
  sortBy: SortOption;
  onFiltersChange: (filters: APIFilters) => void;
  onClearFilters: () => void;
  onManufacturerChange: (manufacturerId: string) => void;
  onModelChange: (modelId: string) => void;
  onToggleAdvanced: () => void;
  onSortChange: (sort: SortOption) => void;
}

const CatalogFilters = ({
  filters,
  manufacturers,
  models,
  generations,
  filterCounts,
  loadingCounts,
  showAdvancedFilters,
  sortBy,
  onFiltersChange,
  onClearFilters,
  onManufacturerChange,
  onModelChange,
  onToggleAdvanced,
  onSortChange
}: CatalogFiltersProps) => {
  return (
    <div className="mb-6 space-y-4">
      <FilterForm
        filters={filters}
        manufacturers={manufacturers}
        models={models}
        generations={generations}
        filterCounts={filterCounts}
        loadingCounts={loadingCounts}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
        onManufacturerChange={onManufacturerChange}
        onModelChange={onModelChange}
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={onToggleAdvanced}
      />
      
      {/* Sort Control */}
      <div className="flex justify-end">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <ArrowUpDown className="h-3 w-3 mr-2" />
            <SelectValue placeholder="Rreshtoni sipas..." />
          </SelectTrigger>
          <SelectContent>
            {getSortOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CatalogFilters;