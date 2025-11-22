import React, { useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Car, Calendar, Gauge, DollarSign, Settings, Fuel, X } from "lucide-react";
import { APIFilters } from "@/utils/catalog-filter";

interface Manufacturer {
    id: number;
    name: string;
    image?: string;
    cars_qty?: number;
    car_count?: number;
}

interface Model {
    id: number;
    name: string;
    cars_qty?: number;
}

interface FilterCounts {
    manufacturers?: Record<number, number>;
    models?: Record<number, number>;
    fuelTypes?: Record<number, number>;
    transmissions?: Record<number, number>;
    colors?: Record<number, number>;
}

interface MobileFiltersPanelProps {
    filters: APIFilters;
    manufacturers: Manufacturer[];
    models: Model[];
    filterCounts?: FilterCounts;
    onFiltersChange: (filters: any) => void;
    onClearFilters: () => void;
    onApply: () => void;
}

const FUEL_TYPE_OPTIONS: Record<string, number> = {
    'Benzinë': 1,
    'Dizel': 2,
    'Hibrid': 3,
    'Elektrik': 4,
    'Gaz': 5
};

const TRANSMISSION_OPTIONS: Record<string, number> = {
    'Automatik': 1,
    'Manual': 2,
    'CVT': 3
};

export const MobileFiltersPanel: React.FC<MobileFiltersPanelProps> = ({
    filters,
    manufacturers,
    models,
    filterCounts,
    onFiltersChange,
    onClearFilters,
    onApply
}) => {

    const updateFilter = (key: string, value: string) => {
        const actualValue = value === 'all' || value === '' ? undefined : value;

        if (key === 'manufacturer_id') {
            onFiltersChange({ ...filters, manufacturer_id: actualValue, model_id: undefined });
        } else {
            onFiltersChange({ ...filters, [key]: actualValue });
        }
    };

    // Manufacturer options with counts
    const manufacturerOptions = useMemo(() => {
        const options = manufacturers
            .filter(m => {
                const count = m.cars_qty || m.car_count || 0;
                return count > 0 || (m.cars_qty === undefined && m.car_count === undefined);
            })
            .map(m => ({
                value: m.id.toString(),
                label: `${m.name}${m.cars_qty || m.car_count ? ` (${m.cars_qty || m.car_count})` : ''}`
            }));

        return [{ value: 'all', label: 'Të gjitha markat' }, ...options];
    }, [manufacturers]);

    // Model options with counts
    const modelOptions = useMemo(() => {
        if (!filters.manufacturer_id) return [{ value: 'all', label: 'Zgjidhni markën së pari' }];

        const filteredModels = models
            .filter(m => (m.cars_qty || 0) > 0)
            .map(m => ({
                value: m.id.toString(),
                label: `${m.name}${m.cars_qty ? ` (${m.cars_qty})` : ''}`
            }));

        return [{ value: 'all', label: 'Të gjithë modelet' }, ...filteredModels];
    }, [models, filters.manufacturer_id]);

    // Fuel type options with counts
    const fuelTypeOptions = useMemo(() => {
        const options = Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
            value: id.toString(),
            label: `${name}${filterCounts?.fuelTypes?.[id] ? ` (${filterCounts.fuelTypes[id]})` : ''}`
        }));
        return [{ value: 'all', label: 'Çdo lloj' }, ...options];
    }, [filterCounts]);

    // Transmission options with counts
    const transmissionOptions = useMemo(() => {
        const options = Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
            value: id.toString(),
            label: `${name}${filterCounts?.transmissions?.[id] ? ` (${filterCounts.transmissions[id]})` : ''}`
        }));
        return [{ value: 'all', label: 'Çdo transmision' }, ...options];
    }, [filterCounts]);

    // Year options
    const currentYear = new Date().getFullYear();
    const yearOptions = useMemo(() => {
        const years = [];
        for (let year = currentYear; year >= 2000; year--) {
            years.push({ value: year.toString(), label: year.toString() });
        }
        return [{ value: 'all', label: 'Çdo vit' }, ...years];
    }, [currentYear]);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* Brand */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        Marka
                    </Label>
                    <AdaptiveSelect
                        value={filters.manufacturer_id || 'all'}
                        onValueChange={(value) => updateFilter('manufacturer_id', value)}
                        options={manufacturerOptions}
                        className="w-full"
                        forceNative
                    />
                </div>

                {/* Model */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        Modeli
                    </Label>
                    <AdaptiveSelect
                        value={filters.model_id || 'all'}
                        onValueChange={(value) => updateFilter('model_id', value)}
                        options={modelOptions}
                        disabled={!filters.manufacturer_id}
                        className="w-full"
                        forceNative
                    />
                </div>

                {/* Year Range */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Viti
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nga</Label>
                            <AdaptiveSelect
                                value={filters.from_year || 'all'}
                                onValueChange={(value) => updateFilter('from_year', value)}
                                options={yearOptions}
                                className="w-full"
                                forceNative
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Deri</Label>
                            <AdaptiveSelect
                                value={filters.to_year || 'all'}
                                onValueChange={(value) => updateFilter('to_year', value)}
                                options={yearOptions}
                                className="w-full"
                                forceNative
                            />
                        </div>
                    </div>
                </div>

                {/* Mileage */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-primary" />
                        Kilometrazha (KM)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            placeholder="Nga"
                            value={filters.odometer_from_km || ''}
                            onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                            className="w-full"
                        />
                        <Input
                            type="number"
                            placeholder="Deri"
                            value={filters.odometer_to_km || ''}
                            onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Çmimi (EUR)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            placeholder="Nga"
                            value={filters.buy_now_price_from || ''}
                            onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                            className="w-full"
                        />
                        <Input
                            type="number"
                            placeholder="Deri"
                            value={filters.buy_now_price_to || ''}
                            onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Fuel Type */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-primary" />
                        Lloji i karburantit
                    </Label>
                    <AdaptiveSelect
                        value={filters.fuel_type || 'all'}
                        onValueChange={(value) => updateFilter('fuel_type', value)}
                        options={fuelTypeOptions}
                        className="w-full"
                        forceNative
                    />
                </div>

                {/* Transmission */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        Transmisioni
                    </Label>
                    <AdaptiveSelect
                        value={filters.transmission || 'all'}
                        onValueChange={(value) => updateFilter('transmission', value)}
                        options={transmissionOptions}
                        className="w-full"
                        forceNative
                    />
                </div>
            </div>

            {/* Fixed bottom buttons */}
            <div className="border-t bg-background p-4 space-y-2">
                <Button
                    onClick={onApply}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                >
                    Apliko Filtrat
                </Button>
                <Button
                    onClick={onClearFilters}
                    variant="outline"
                    className="w-full"
                    size="lg"
                >
                    <X className="h-4 w-4 mr-2" />
                    Pastro të gjitha
                </Button>
            </div>
        </div>
    );
};
