import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Search, ChevronDown, ChevronUp } from "lucide-react";
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
    }, [manufacturers, POPULAR_BRANDS]);

    // Helper to get logo URL
    const getLogoUrl = (manufacturer: Manufacturer) => {
        return manufacturer.image || `https://auctionsapi.com/images/brands/${manufacturer.name}.svg`;
    };

    const selectedManufacturer = manufacturers.find(m => m.id.toString() === filters.manufacturer_id);

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

    const inputClass = "w-full h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent";
    const labelClass = "block text-xs font-semibold mb-1 text-gray-900 dark:text-gray-100";
    const subLabelClass = "block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5";

    return (
        <div className={className || "fixed inset-0 flex flex-col bg-white dark:bg-gray-900 z-50 overflow-hidden touch-action-manipulation"}>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="px-4 py-2.5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Filtrat e Kërkimit
                    </h2>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}>
                <div className="px-3 py-3 space-y-2.5">

                    {/* BASIC FILTERS */}
                    <div className="space-y-2.5">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wide">
                            Filtrat Bazë
                        </h3>

                        {/* Manufacturer */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className={labelClass}>Marka</label>
                                {selectedManufacturer && (
                                    <img
                                        src={getLogoUrl(selectedManufacturer)}
                                        alt={selectedManufacturer.name}
                                        className="h-5 w-5 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                            </div>
                            <select
                                value={filters.manufacturer_id || ''}
                                onChange={(e) => handleChange('manufacturer_id', e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Të gjitha markat</option>
                                {/* Popular Brands */}
                                {manufacturersList.popular.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {m.count > 0 ? `(${m.count})` : ''}
                                    </option>
                                ))}
                                {/* Separator */}
                                {manufacturersList.popular.length > 0 && manufacturersList.others.length > 0 && (
                                    <option disabled>──────────</option>
                                )}
                                {/* Other Brands */}
                                {manufacturersList.others.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} {m.count > 0 ? `(${m.count})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Model */}
                        <div>
                            <label className={labelClass}>Modeli</label>
                            <select
                                value={filters.model_id || ''}
                                onChange={(e) => handleChange('model_id', e.target.value)}
                                disabled={!filters.manufacturer_id}
                                className={inputClass + " disabled:opacity-50 disabled:cursor-not-allowed"}
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
                            <label className={labelClass}>Viti</label>
                            {/* Fast Year Selection */}
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                                {[2022, 2020, 2018, 2016].map(year => (
                                    <button
                                        key={year}
                                        onClick={() => handleChange('from_year', year.toString())}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${filters.from_year === year.toString()
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {year}+
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={subLabelClass}>Nga</label>
                                    <select
                                        value={filters.from_year || ''}
                                        onChange={(e) => handleChange('from_year', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Çdo vit</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={subLabelClass}>Deri</label>
                                    <select
                                        value={filters.to_year || ''}
                                        onChange={(e) => handleChange('to_year', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Çdo vit</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Price */}
                        <div>
                            <label className={labelClass}>Çmimi (EUR)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={subLabelClass}>Nga</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={filters.buy_now_price_from || ''}
                                        onChange={(e) => handleChange('buy_now_price_from', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={subLabelClass}>Deri</label>
                                    <input
                                        type="number"
                                        placeholder="100000"
                                        value={filters.buy_now_price_to || ''}
                                        onChange={(e) => handleChange('buy_now_price_to', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mileage */}
                        <div>
                            <label className={labelClass}>Kilometrazha (KM)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={subLabelClass}>Nga</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={filters.odometer_from_km || ''}
                                        onChange={(e) => handleChange('odometer_from_km', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={subLabelClass}>Deri</label>
                                    <input
                                        type="number"
                                        placeholder="300000"
                                        value={filters.odometer_to_km || ''}
                                        onChange={(e) => handleChange('odometer_to_km', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ADVANCED FILTERS TOGGLE */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            Filtrat Avancuar
                        </span>
                        {showAdvanced ? (
                            <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                    </button>

                    {/* ADVANCED FILTERS */}
                    {showAdvanced && (
                        <div className="space-y-2.5">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wide">
                                Më shumë opcione
                            </h3>

                            {/* Fuel Type */}
                            <div>
                                <label className={labelClass}>Lloji i karburantit</label>
                                <select
                                    value={filters.fuel_type || ''}
                                    onChange={(e) => handleChange('fuel_type', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Çdo lloj</option>
                                    {Object.entries(FUEL_TYPES).map(([name, id]) => (
                                        <option key={id} value={id}>
                                            {name} {filterCounts?.fuelTypes?.[id] ? `(${filterCounts.fuelTypes[id]})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Transmission */}
                            <div>
                                <label className={labelClass}>Transmisioni</label>
                                <select
                                    value={filters.transmission || ''}
                                    onChange={(e) => handleChange('transmission', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Çdo transmision</option>
                                    {Object.entries(TRANSMISSIONS).map(([name, id]) => (
                                        <option key={id} value={id}>
                                            {name} {filterCounts?.transmissions?.[id] ? `(${filterCounts.transmissions[id]})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Body Type */}
                            <div>
                                <label className={labelClass}>Lloji i trupit</label>
                                <select
                                    value={filters.body_type || ''}
                                    onChange={(e) => handleChange('body_type', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Çdo lloj</option>
                                    {Object.entries(BODY_TYPES).map(([name, id]) => (
                                        <option key={id} value={id}>
                                            {name} {filterCounts?.bodyTypes?.[id] ? `(${filterCounts.bodyTypes[id]})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Color */}
                            <div>
                                <label className={labelClass}>Ngjyra</label>
                                <select
                                    value={filters.color || ''}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Çdo ngjyrë</option>
                                    {Object.entries(COLORS).map(([name, id]) => (
                                        <option key={id} value={id}>
                                            {name} {filterCounts?.colors?.[id] ? `(${filterCounts.colors[id]})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Drive Type */}
                            <div>
                                <label className={labelClass}>Tipi i nxitjes</label>
                                <select
                                    value={filters.drive_type || ''}
                                    onChange={(e) => handleChange('drive_type', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Çdo tip</option>
                                    {DRIVE_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Steering Position */}
                            <div>
                                <label className={labelClass}>Pozicioni i timonit</label>
                                <select
                                    value={filters.steering_position || ''}
                                    onChange={(e) => handleChange('steering_position', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Çdo pozicion</option>
                                    {STEERING_POSITIONS.map(pos => (
                                        <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Engine Displacement */}
                            <div>
                                <label className={labelClass}>Vëllimi i motorit (L)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={subLabelClass}>Nga</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="0.0"
                                            value={filters.engine_from || ''}
                                            onChange={(e) => handleChange('engine_from', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={subLabelClass}>Deri</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="10.0"
                                            value={filters.engine_to || ''}
                                            onChange={(e) => handleChange('engine_to', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Seats */}
                            <div>
                                <label className={labelClass}>Numri i ulëseve</label>
                                <select
                                    value={filters.seats_count || ''}
                                    onChange={(e) => handleChange('seats_count', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Çdo numër</option>
                                    {[2, 4, 5, 6, 7, 8, 9].map(seats => (
                                        <option key={seats} value={seats}>{seats} ulëse</option>
                                    ))}
                                </select>
                            </div>

                            {/* Doors */}
                            <div>
                                <label className={labelClass}>Numri i dyerve</label>
                                <select
                                    value={filters.doors_count || ''}
                                    onChange={(e) => handleChange('doors_count', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Çdo numër</option>
                                    {[2, 3, 4, 5].map(doors => (
                                        <option key={doors} value={doors}>{doors} dyer</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Bottom Buttons */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-2 shadow-lg">
                <Button
                    onClick={onApply}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                    <Search className="h-4 w-4" />
                    Kërko Makinat
                </Button>
                <Button
                    onClick={onClearFilters}
                    variant="outline"
                    className="w-full h-9 font-semibold text-xs"
                >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Pastro të gjitha filtrat
                </Button>
            </div>
        </div>
    );
};
