import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Search, ChevronRight } from "lucide-react";
import { APIFilters } from "@/utils/catalog-filter";
import { Slider } from "@/components/ui/slider";

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
    bodyTypes?: Record<number, number>;
}

interface MobileFiltersPanelProps {
    filters: APIFilters;
    manufacturers: Manufacturer[];
    models: Model[];
    filterCounts?: FilterCounts;
    onFiltersChange: (filters: any) => void;
    onClearFilters: () => void;
    onApply: () => void;
    onManufacturerChange?: (manufacturerId: string) => void;
    className?: string;
}

const FUEL_TYPES: Record<string, number> = {
    'Benzinë': 1,
    'Dizel': 2,
    'Hibrid': 3,
    'Elektrik': 4,
    'Gaz': 5
};

const TRANSMISSIONS: Record<string, number> = {
    'Automatik': 1,
    'Manual': 2,
    'CVT': 3
};

const BODY_TYPES: Record<string, number> = {
    'Sedan': 1,
    'SUV': 2,
    'Hatchback': 3,
    'Wagon': 4,
    'Coupe': 5,
    'Convertible': 6,
    'Van': 7,
    'Truck': 8
};

const COLORS: Record<string, number> = {
    'E zezë': 1,
    'E bardhë': 2,
    'Gri': 3,
    'Argjend': 4,
    'Blu': 5,
    'E kuqe': 6,
    'Kafe': 7,
    'Jeshile': 8,
    'Portokalli': 9,
    'Ari': 10
};

const DRIVE_TYPES = ['2WD', '4WD', 'AWD'];
const STEERING_POSITIONS = ['Majtas', 'Djathtas'];

export const MobileFiltersPanel: React.FC<MobileFiltersPanelProps> = ({
    filters,
    manufacturers,
    models,
    filterCounts,
    onFiltersChange,
    onClearFilters,
    onApply,
    onManufacturerChange,
    className
}) => {

    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (key: string, value: string) => {
        const actualValue = value === '' || value === 'all' ? undefined : value;

        if (key === 'manufacturer_id') {
            onFiltersChange({ ...filters, manufacturer_id: actualValue, model_id: undefined });
            // Trigger model fetching for selected manufacturer
            if (onManufacturerChange) {
                onManufacturerChange(actualValue || '');
            }
        } else {
            onFiltersChange({ ...filters, [key]: actualValue });
        }
    };

    // Popular brands (in order)
    const POPULAR_BRANDS = ['AUDI', 'MERCEDES-BENZ', 'VOLKSWAGEN', 'BMW'];

    // Get manufacturers with counts, sorted with popular brands first
    const manufacturersList = React.useMemo(() => {
        const allManufacturers = manufacturers
            .filter(m => (m.cars_qty || m.car_count || 0) > 0 || m.cars_qty === undefined)
            .map(m => ({
                id: m.id,
                name: m.name,
                count: m.cars_qty || m.car_count || 0
            }));

        // Separate popular and other brands
        const popular: typeof allManufacturers = [];
        const others: typeof allManufacturers = [];

        allManufacturers.forEach(m => {
            const normalizedName = m.name.toUpperCase().replace(/\s+/g, '-');
            if (POPULAR_BRANDS.some(p => normalizedName.includes(p) || p.includes(normalizedName))) {
                popular.push(m);
            } else {
                others.push(m);
            }
        });

        // Sort popular brands by POPULAR_BRANDS order
        popular.sort((a, b) => {
            const aIndex = POPULAR_BRANDS.findIndex(p =>
                a.name.toUpperCase().replace(/\s+/g, '-').includes(p) ||
                p.includes(a.name.toUpperCase().replace(/\s+/g, '-'))
            );
            const bIndex = POPULAR_BRANDS.findIndex(p =>
                b.name.toUpperCase().replace(/\s+/g, '-').includes(p) ||
                p.includes(b.name.toUpperCase().replace(/\s+/g, '-'))
            );
            return aIndex - bIndex;
        });

        // Sort others by car count (highest first)
        others.sort((a, b) => b.count - a.count);

        return { popular, others };
    }, [manufacturers]);

    // Get models for selected manufacturer
    const modelsList = filters.manufacturer_id
        ? models.filter(m => (m.cars_qty || 0) > 0).map(m => ({
            id: m.id,
            name: m.name,
            count: m.cars_qty || 0
        }))
        : [];

    // Generate years
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

    // Helper for filter row item
    const FilterRow = ({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between py-3.5 px-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs text-primary font-medium">{value}</span>}
                <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
        </button>
    );

    // Get display values
    const getYearValue = () => {
        if (filters.from_year && filters.to_year) return `${filters.from_year} - ${filters.to_year}`;
        if (filters.from_year) return `${filters.from_year}+`;
        if (filters.to_year) return `deri ${filters.to_year}`;
        return 'Të gjitha';
    };

    const getPriceValue = () => {
        if (filters.buy_now_price_from && filters.buy_now_price_to) 
            return `€${filters.buy_now_price_from} - €${filters.buy_now_price_to}`;
        if (filters.buy_now_price_from) return `€${filters.buy_now_price_from}+`;
        if (filters.buy_now_price_to) return `deri €${filters.buy_now_price_to}`;
        return 'Të gjitha';
    };

    const getMileageValue = () => {
        if (filters.odometer_from_km && filters.odometer_to_km) 
            return `${filters.odometer_from_km} - ${filters.odometer_to_km} km`;
        if (filters.odometer_from_km) return `${filters.odometer_from_km}+ km`;
        if (filters.odometer_to_km) return `deri ${filters.odometer_to_km} km`;
        return 'Të gjitha';
    };

    const selectedManufacturerName = manufacturers.find(m => m.id.toString() === filters.manufacturer_id)?.name || 'Të gjitha';
    const selectedModelName = models.find(m => m.id.toString() === filters.model_id)?.name || 'Të gjitha';

    return (
        <div className={className || "fixed inset-0 flex flex-col bg-background z-50 overflow-hidden"}>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border bg-background">
                <div className="px-4 py-3 flex items-center justify-between">
                    <h2 className="text-base font-bold">Filtrat e Kërkimit</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.history.back()}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="divide-y divide-border">
                    {/* Main Filter Rows */}
                    <FilterRow 
                        label="Marka" 
                        value={selectedManufacturerName !== 'Të gjitha' ? selectedManufacturerName : undefined}
                        onClick={() => {/* TODO: Open manufacturer drawer */}}
                    />
                    
                    <FilterRow 
                        label="Modeli" 
                        value={selectedModelName !== 'Të gjitha' ? selectedModelName : undefined}
                        onClick={() => {/* TODO: Open model drawer */}}
                    />
                    
                    <FilterRow 
                        label="Viti" 
                        value={getYearValue() !== 'Të gjitha' ? getYearValue() : undefined}
                        onClick={() => {/* TODO: Open year drawer */}}
                    />
                    
                    <FilterRow 
                        label="Kilometrazha" 
                        value={getMileageValue() !== 'Të gjitha' ? getMileageValue() : undefined}
                        onClick={() => {/* TODO: Open mileage drawer */}}
                    />
                    
                    <FilterRow 
                        label="Çmimi" 
                        value={getPriceValue() !== 'Të gjitha' ? getPriceValue() : undefined}
                        onClick={() => {/* TODO: Open price drawer */}}
                    />

                    {/* Temporary inline filters - will be replaced with drawers */}
                    <div className="p-4 space-y-4 bg-muted/30">
                        {/* Manufacturer Select */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Marka</label>
                            <select
                                value={filters.manufacturer_id || ''}
                                onChange={(e) => {
                                    handleChange('manufacturer_id', e.target.value);
                                    setTimeout(() => onApply?.(), 100);
                                }}
                                className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background"
                            >
                                <option value="">Të gjitha markat</option>
                                {manufacturersList.popular.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {m.count > 0 ? `(${m.count})` : ''}
                                    </option>
                                ))}
                                {manufacturersList.popular.length > 0 && manufacturersList.others.length > 0 && (
                                    <option disabled>──────────</option>
                                )}
                                {manufacturersList.others.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {m.count > 0 ? `(${m.count})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Model Select */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Modeli</label>
                            <select
                                value={filters.model_id || ''}
                                onChange={(e) => {
                                    handleChange('model_id', e.target.value);
                                    setTimeout(() => onApply?.(), 100);
                                }}
                                disabled={!filters.manufacturer_id}
                                className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background disabled:opacity-50"
                            >
                                <option value="">
                                    {filters.manufacturer_id ? 'Të gjithë modelet' : 'Zgjidhni markën së pari'}
                                </option>
                                {modelsList.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {m.count > 0 ? `(${m.count})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Year Range */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Viti</label>
                            <div className="flex gap-2 mb-3">
                                {[2022, 2020, 2018, 2016].map(year => (
                                    <button
                                        key={year}
                                        onClick={() => handleChange('from_year', year.toString())}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                            filters.from_year === year.toString()
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-background border-border hover:bg-muted'
                                        }`}
                                    >
                                        {year}+
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={filters.from_year || ''}
                                    onChange={(e) => handleChange('from_year', e.target.value)}
                                    className="h-10 px-3 text-sm border border-border rounded-lg bg-background"
                                >
                                    <option value="">Nga</option>
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <select
                                    value={filters.to_year || ''}
                                    onChange={(e) => handleChange('to_year', e.target.value)}
                                    className="h-10 px-3 text-sm border border-border rounded-lg bg-background"
                                >
                                    <option value="">Deri</option>
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Mileage Range with Slider */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Kilometrazha</label>
                            <div className="text-xs text-muted-foreground text-center mb-3">
                                {getMileageValue()}
                            </div>
                            <Slider
                                min={0}
                                max={300000}
                                step={5000}
                                value={[
                                    parseInt(filters.odometer_from_km || '0'),
                                    parseInt(filters.odometer_to_km || '300000')
                                ]}
                                onValueChange={(values) => {
                                    handleChange('odometer_from_km', values[0].toString());
                                    handleChange('odometer_to_km', values[1].toString());
                                }}
                                className="mb-2"
                            />
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.odometer_from_km || ''}
                                    onChange={(e) => handleChange('odometer_from_km', e.target.value)}
                                    className="h-10 px-3 text-sm border border-border rounded-lg bg-background"
                                />
                                <input
                                    type="number"
                                    placeholder="300000"
                                    value={filters.odometer_to_km || ''}
                                    onChange={(e) => handleChange('odometer_to_km', e.target.value)}
                                    className="h-10 px-3 text-sm border border-border rounded-lg bg-background"
                                />
                            </div>
                        </div>

                        {/* Price Range with Slider */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Çmimi (EUR)</label>
                            <div className="text-xs text-muted-foreground text-center mb-3">
                                {getPriceValue()}
                            </div>
                            <Slider
                                min={0}
                                max={100000}
                                step={1000}
                                value={[
                                    parseInt(filters.buy_now_price_from || '0'),
                                    parseInt(filters.buy_now_price_to || '100000')
                                ]}
                                onValueChange={(values) => {
                                    handleChange('buy_now_price_from', values[0].toString());
                                    handleChange('buy_now_price_to', values[1].toString());
                                }}
                                className="mb-2"
                            />
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.buy_now_price_from || ''}
                                    onChange={(e) => handleChange('buy_now_price_from', e.target.value)}
                                    className="h-10 px-3 text-sm border border-border rounded-lg bg-background"
                                />
                                <input
                                    type="number"
                                    placeholder="100000"
                                    value={filters.buy_now_price_to || ''}
                                    onChange={(e) => handleChange('buy_now_price_to', e.target.value)}
                                    className="h-10 px-3 text-sm border border-border rounded-lg bg-background"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Buttons */}
            <div className="flex-shrink-0 border-t border-border bg-background p-3 space-y-2">
                <Button
                    onClick={onClearFilters}
                    variant="outline"
                    className="w-full h-11 font-semibold"
                >
                    <X className="h-4 w-4 mr-2" />
                    Pastro Filtrat
                </Button>
                <Button
                    onClick={onApply}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm"
                >
                    <Search className="h-4 w-4 mr-2" />
                    Kërko Makinat
                </Button>
            </div>
        </div>
    );
};
