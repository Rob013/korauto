import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { APIFilters } from "@/utils/catalog-filter";
import { Slider } from "@/components/ui/slider";
import { useEncarFilterOptions } from "@/hooks/useEncarFilterOptions";
import { debounce } from "@/utils/performance";

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
    manufacturer_id?: number;
}

interface FilterCounts {
    manufacturers?: Record<number, number>;
    models?: Record<number, number>;
    fuelTypes?: Record<number, number>;
    transmissions?: Record<number, number>;
    colors?: Record<number, number>;
    bodyTypes?: Record<number, number>;
}

interface Generation {
    id: number;
    name: string;
    cars_qty?: number;
}

interface Variant {
    value: string;
    label: string;
    count?: number;
}

interface MobileFiltersPanelProps {
    filters: APIFilters;
    manufacturers: Manufacturer[];
    models: Model[];
    generations?: Generation[];
    variants?: Variant[];
    filterCounts?: FilterCounts;
    onFiltersChange: (filters: any) => void;
    onClearFilters: () => void;
    onApply: () => void;
    onManufacturerChange?: (manufacturerId: string) => void;
    onModelChange?: (modelId: string) => void;
    onGenerationChange?: (generationId: string) => void;
    className?: string;
    usePortal?: boolean;
}

const DRIVE_TYPES = ['2WD', '4WD', 'AWD'];
const STEERING_POSITIONS = ['Majtas', 'Djathtas'];

export const MobileFiltersPanel: React.FC<MobileFiltersPanelProps> = ({
    filters,
    manufacturers,
    models,
    generations = [],
    variants = [],
    filterCounts,
    onFiltersChange,
    onClearFilters,
    onApply,
    onManufacturerChange,
    onModelChange,
    onGenerationChange,
    className,
    usePortal = false
}) => {
    // Local state for immediate UI updates without triggering full catalog re-render
    const [localFilters, setLocalFilters] = useState(filters);
    
    // Fetch dynamic filter options from database
    const { data: filterOptions, isLoading: filterOptionsLoading } = useEncarFilterOptions();

    // Sync local filters when parent filters change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // Debounced filter change for non-critical filters (300ms delay)
    const debouncedFilterChange = useRef(
        debounce((newFilters: APIFilters) => {
            onFiltersChange(newFilters);
        }, 300)
    ).current;

    const handleChange = useCallback((key: string, value: string) => {
        const actualValue = value === '' || value === 'all' ? undefined : value;
        const newFilters = { ...localFilters, [key]: actualValue };

        // Update local state immediately for instant UI feedback
        setLocalFilters(newFilters);

        // Critical filters (manufacturer, model, generation) need immediate update
        // because they affect other filter options
        if (key === 'manufacturer_id') {
            if (onManufacturerChange) {
                onManufacturerChange(actualValue || '');
            } else {
                const resetFilters = { ...newFilters, model_id: undefined, generation_id: undefined, grade_iaai: undefined };
                setLocalFilters(resetFilters);
                onFiltersChange(resetFilters);
            }
        } else if (key === 'model_id') {
            if (onModelChange) {
                onModelChange(actualValue || '');
            } else {
                const resetFilters = { ...newFilters, generation_id: undefined, grade_iaai: undefined };
                setLocalFilters(resetFilters);
                onFiltersChange(resetFilters);
            }
        } else if (key === 'generation_id') {
            if (onGenerationChange) {
                onGenerationChange(actualValue || '');
            } else {
                const resetFilters = { ...newFilters, grade_iaai: undefined };
                setLocalFilters(resetFilters);
                onFiltersChange(resetFilters);
            }
        } else {
            // Non-critical filters use debouncing to prevent UI freezing
            debouncedFilterChange(newFilters);
        }
    }, [localFilters, onFiltersChange, onManufacturerChange, onModelChange, onGenerationChange, debouncedFilterChange]);

    const handleSliderChange = useCallback((key: string, values: number[]) => {
        let newFilters = { ...localFilters };
        
        if (key === 'mileage') {
            newFilters = {
                ...newFilters,
                odometer_from_km: values[0].toString(),
                odometer_to_km: values[1].toString()
            };
        } else if (key === 'price') {
            newFilters = {
                ...newFilters,
                buy_now_price_from: values[0].toString(),
                buy_now_price_to: values[1].toString()
            };
        }
        
        // Update local state immediately
        setLocalFilters(newFilters);
        
        // Debounce the actual filter change to prevent freezing
        debouncedFilterChange(newFilters);
    }, [localFilters, debouncedFilterChange]);

    // Popular brands (in order)
    const POPULAR_BRANDS = ['AUDI', 'MERCEDES-BENZ', 'VOLKSWAGEN', 'BMW'];

    // Get manufacturers with counts, sorted with popular brands first
    const manufacturersList = useMemo(() => {
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

    // Get models for selected manufacturer with STRICT filtering
    const modelsList = useMemo(() => {
        if (!localFilters.manufacturer_id) return [];

        return models
            .filter(m => {
                // Strict check: if model has manufacturer_id, it MUST match the selected one
                if (m.manufacturer_id !== undefined) {
                    return m.manufacturer_id.toString() === localFilters.manufacturer_id;
                }
                // If no manufacturer_id on model, assume it's correct (legacy behavior)
                return true;
            })
            .filter(m => (m.cars_qty || 0) > 0) // Filter out models with 0 cars
            .map(m => ({
                id: m.id,
                name: m.name,
                count: m.cars_qty || 0
            }));
    }, [localFilters.manufacturer_id, models]);

    // Generate years
    const currentYear = new Date().getFullYear();
    const years = useMemo(() =>
        Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i)
        , [currentYear]);

    // Get display values
    const getMileageValue = useCallback(() => {
        if (localFilters.odometer_from_km && localFilters.odometer_to_km)
            return `${localFilters.odometer_from_km} - ${localFilters.odometer_to_km} km`;
        if (localFilters.odometer_from_km) return `${localFilters.odometer_from_km}+ km`;
        if (localFilters.odometer_to_km) return `deri ${localFilters.odometer_to_km} km`;
        return 'Të gjitha';
    }, [localFilters.odometer_from_km, localFilters.odometer_to_km]);

    const getPriceValue = useCallback(() => {
        if (localFilters.buy_now_price_from && localFilters.buy_now_price_to)
            return `€${localFilters.buy_now_price_from} - €${localFilters.buy_now_price_to}`;
        if (localFilters.buy_now_price_from) return `€${localFilters.buy_now_price_from}+`;
        if (localFilters.buy_now_price_to) return `deri €${localFilters.buy_now_price_to}`;
        return 'Të gjitha';
    }, [localFilters.buy_now_price_from, localFilters.buy_now_price_to]);

    const content = (
        <div className={className || "fixed inset-y-0 right-0 flex flex-col w-full md:w-80 bg-white dark:bg-black z-[9999] overflow-y-auto touch-action-manipulation shadow-2xl"}>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black sticky top-0 z-10">
                <div className="px-4 py-2.5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Filtrat e Kërkimit
                    </h2>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 space-y-4 bg-muted/20 dark:bg-black">
                    {/* Manufacturer Select */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="block text-sm font-medium">Marka</label>
                            {localFilters.manufacturer_id && manufacturers.find(m => m.id.toString() === localFilters.manufacturer_id)?.image && (
                                <img
                                    src={manufacturers.find(m => m.id.toString() === localFilters.manufacturer_id)?.image}
                                    alt="Brand Logo"
                                    className="h-5 w-auto object-contain"
                                />
                            )}
                        </div>
                        <select
                            value={localFilters.manufacturer_id || ''}
                            onChange={(e) => handleChange('manufacturer_id', e.target.value)}
                            className="w-full h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
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
                            value={localFilters.model_id || ''}
                            onChange={(e) => handleChange('model_id', e.target.value)}
                            disabled={!localFilters.manufacturer_id}
                            className="w-full h-11 px-3 text-sm border border-border rounded-lg bg-background disabled:opacity-50 transition-colors"
                        >
                            <option value="">
                                {localFilters.manufacturer_id ? 'Të gjithë modelet' : 'Zgjidhni markën së pari'}
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
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
                            {[2022, 2020, 2018, 2016].map(year => (
                                <button
                                    key={year}
                                    onClick={() => handleChange('from_year', year.toString())}
                                    className={`flex-shrink-0 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border transition-all ${localFilters.from_year === year.toString()
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-background border-border hover:bg-muted'
                                        }`}
                                >
                                    {year}+
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={localFilters.from_year || ''}
                                onChange={(e) => handleChange('from_year', e.target.value)}
                                className="h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                            >
                                <option value="">Nga</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <select
                                value={localFilters.to_year || ''}
                                onChange={(e) => handleChange('to_year', e.target.value)}
                                className="h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                            >
                                <option value="">Deri</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mileage Range */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Kilometrazha</label>
                        <div className="text-xs text-muted-foreground text-center mb-3 font-medium">
                            {getMileageValue()}
                        </div>
                        <Slider
                            min={0}
                            max={300000}
                            step={5000}
                            value={[
                                parseInt(localFilters.odometer_from_km || '0'),
                                parseInt(localFilters.odometer_to_km || '300000')
                            ]}
                            onValueChange={(values) => handleSliderChange('mileage', values)}
                            className="mb-2"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <input
                                type="number"
                                placeholder="0"
                                value={localFilters.odometer_from_km || ''}
                                onChange={(e) => handleChange('odometer_from_km', e.target.value)}
                                className="h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                            />
                            <input
                                type="number"
                                placeholder="300000"
                                value={localFilters.odometer_to_km || ''}
                                onChange={(e) => handleChange('odometer_to_km', e.target.value)}
                                className="h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                            />
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Çmimi (EUR)</label>
                        <div className="text-xs text-muted-foreground text-center mb-3 font-medium">
                            {getPriceValue()}
                        </div>
                        <Slider
                            min={0}
                            max={100000}
                            step={1000}
                            value={[
                                parseInt(localFilters.buy_now_price_from || '0'),
                                parseInt(localFilters.buy_now_price_to || '100000')
                            ]}
                            onValueChange={(values) => handleSliderChange('price', values)}
                            className="mb-2"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <input
                                type="number"
                                placeholder="0"
                                value={localFilters.buy_now_price_from || ''}
                                onChange={(e) => handleChange('buy_now_price_from', e.target.value)}
                                className="h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                            />
                            <input
                                type="number"
                                placeholder="100000"
                                value={localFilters.buy_now_price_to || ''}
                                onChange={(e) => handleChange('buy_now_price_to', e.target.value)}
                                className="h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                            />
                        </div>
                    </div>

                    {/* Advanced Filters Divider */}
                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Filtra të Avancuar</h3>

                        {/* Fuel Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Karburanti</label>
                            {filterOptionsLoading ? (
                                <div className="text-xs text-muted-foreground py-2">Duke ngarkuar opsionet...</div>
                            ) : filterOptions?.fuelTypes && filterOptions.fuelTypes.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {filterOptions.fuelTypes.map((option) => {
                                        const isSelected = localFilters.fuel_type === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    handleChange('fuel_type', isSelected ? '' : option.value);
                                                }}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer select-none touch-manipulation ${
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-background border-border hover:bg-muted active:scale-95'
                                                }`}
                                            >
                                                {option.label} {option.count ? `(${option.count})` : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground py-2">Nuk ka opsione të disponueshme</div>
                            )}
                        </div>

                        {/* Transmission */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Transmisioni</label>
                            {filterOptionsLoading ? (
                                <div className="text-xs text-muted-foreground py-2">Duke ngarkuar opsionet...</div>
                            ) : filterOptions?.transmissions && filterOptions.transmissions.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {filterOptions.transmissions.map((option) => {
                                        const isSelected = localFilters.transmission === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    handleChange('transmission', isSelected ? '' : option.value);
                                                }}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer select-none touch-manipulation ${
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-background border-border hover:bg-muted active:scale-95'
                                                }`}
                                            >
                                                {option.label} {option.count ? `(${option.count})` : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground py-2">Nuk ka opsione të disponueshme</div>
                            )}
                        </div>

                        {/* Body Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Karroceria</label>
                            <select
                                value={localFilters.body_type || ''}
                                onChange={(e) => {
                                    handleChange('body_type', e.target.value);
                                }}
                                className="w-full h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors cursor-pointer"
                                disabled={filterOptionsLoading || !filterOptions?.bodyTypes || filterOptions.bodyTypes.length === 0}
                            >
                                <option value="">Të gjitha</option>
                                {filterOptions?.bodyTypes && filterOptions.bodyTypes.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label} {option.count ? `(${option.count})` : ''}
                                    </option>
                                ))}
                            </select>
                            {!filterOptionsLoading && (!filterOptions?.bodyTypes || filterOptions.bodyTypes.length === 0) && (
                                <div className="text-xs text-muted-foreground mt-1">Nuk ka opsione të disponueshme</div>
                            )}
                        </div>

                        {/* Color */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Ngjyra</label>
                            <select
                                value={localFilters.color || ''}
                                onChange={(e) => {
                                    handleChange('color', e.target.value);
                                }}
                                className="w-full h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors cursor-pointer"
                                disabled={filterOptionsLoading || !filterOptions?.colors || filterOptions.colors.length === 0}
                            >
                                <option value="">Të gjitha</option>
                                {filterOptions?.colors && filterOptions.colors.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label} {option.count ? `(${option.count})` : ''}
                                    </option>
                                ))}
                            </select>
                            {!filterOptionsLoading && (!filterOptions?.colors || filterOptions.colors.length === 0) && (
                                <div className="text-xs text-muted-foreground mt-1">Nuk ka opsione të disponueshme</div>
                            )}
                        </div>

                        {/* Drive Type & Steering */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Tërheqja</label>
                                <select
                                    value={localFilters.drive_type || ''}
                                    onChange={(e) => handleChange('drive_type', e.target.value)}
                                    className="w-full h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                                >
                                    <option value="">Të gjitha</option>
                                    {DRIVE_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Timoni</label>
                                <select
                                    value={localFilters.steering_position || ''}
                                    onChange={(e) => handleChange('steering_position', e.target.value)}
                                    className="w-full h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                                >
                                    <option value="">Të gjitha</option>
                                    {STEERING_POSITIONS.map(pos => (
                                        <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Engine Capacity */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Motorri (cc)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={localFilters.engine_from || ''}
                                    onChange={(e) => handleChange('engine_from', e.target.value)}
                                    className="h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                                >
                                    <option value="">Nga</option>
                                    {[800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500, 3000, 3500, 4000, 5000].map(cc => (
                                        <option key={cc} value={cc}>{cc} cc</option>
                                    ))}
                                </select>
                                <select
                                    value={localFilters.engine_to || ''}
                                    onChange={(e) => handleChange('engine_to', e.target.value)}
                                    className="h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                                >
                                    <option value="">Deri</option>
                                    {[1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500, 3000, 3500, 4000, 5000, 6000].map(cc => (
                                        <option key={cc} value={cc}>{cc} cc</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Seats & Doors */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Ulëse</label>
                                <select
                                    value={localFilters.seats_count || ''}
                                    onChange={(e) => handleChange('seats_count', e.target.value)}
                                    className="w-full h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                                >
                                    <option value="">Të gjitha</option>
                                    {[2, 4, 5, 6, 7, 8, 9].map(seats => (
                                        <option key={seats} value={seats}>{seats}</option>
                                    ))}
                                    <option value="10+">10+</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Dyer</label>
                                <select
                                    value={localFilters.doors_count || ''}
                                    onChange={(e) => handleChange('doors_count', e.target.value)}
                                    className="w-full h-11 px-3 text-sm border border-border rounded-lg bg-background transition-colors"
                                >
                                    <option value="">Të gjitha</option>
                                    {[2, 3, 4, 5].map(doors => (
                                        <option key={doors} value={doors}>{doors}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Buttons - Only Clear Filters */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-3">
                <Button
                    onClick={onClearFilters}
                    variant="outline"
                    className="w-full h-11 font-semibold"
                >
                    <X className="h-4 w-4 mr-2" />
                    Pastro Filtrat
                </Button>
                <Button
                    onClick={() => {
                        onApply();
                        // The parent component handles closing via onApply, but we can also ensure it here if needed
                    }}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm"
                >
                    <Search className="h-4 w-4 mr-2" />
                    Kërko Makinat
                </Button>
            </div>
        </div>
    );

    if (usePortal) {
        return createPortal(content, document.body);
    }

    return content;
};
