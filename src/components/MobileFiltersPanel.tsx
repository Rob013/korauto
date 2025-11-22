import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

export const MobileFiltersPanel: React.FC<MobileFiltersPanelProps> = ({
    filters,
    manufacturers,
    models,
    filterCounts,
    onFiltersChange,
    onClearFilters,
    onApply
}) => {

    const handleChange = (key: string, value: string) => {
        const actualValue = value === '' || value === 'all' ? undefined : value;

        if (key === 'manufacturer_id') {
            onFiltersChange({ ...filters, manufacturer_id: actualValue, model_id: undefined });
        } else {
            onFiltersChange({ ...filters, [key]: actualValue });
        }
    };

    // Get manufacturers with counts
    const manufacturersList = manufacturers
        .filter(m => (m.cars_qty || m.car_count || 0) > 0 || m.cars_qty === undefined)
        .map(m => ({
            id: m.id,
            name: m.name,
            count: m.cars_qty || m.car_count || 0
        }));

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

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">

                    {/* Brand */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                            Marka
                        </label>
                        <select
                            value={filters.manufacturer_id || ''}
                            onChange={(e) => handleChange('manufacturer_id', e.target.value)}
                            className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">Të gjitha markat</option>
                            {manufacturersList.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} {m.count > 0 ? `(${m.count})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Model */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                            Modeli
                        </label>
                        <select
                            value={filters.model_id || ''}
                            onChange={(e) => handleChange('model_id', e.target.value)}
                            disabled={!filters.manufacturer_id}
                            className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
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
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                            Viti
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nga</label>
                                <select
                                    value={filters.from_year || ''}
                                    onChange={(e) => handleChange('from_year', e.target.value)}
                                    className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Çdo vit</option>
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Deri</label>
                                <select
                                    value={filters.to_year || ''}
                                    onChange={(e) => handleChange('to_year', e.target.value)}
                                    className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Çdo vit</option>
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Mileage */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                            Kilometrazha (KM)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                placeholder="Nga"
                                value={filters.odometer_from_km || ''}
                                onChange={(e) => handleChange('odometer_from_km', e.target.value)}
                                className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <input
                                type="number"
                                placeholder="Deri"
                                value={filters.odometer_to_km || ''}
                                onChange={(e) => handleChange('odometer_to_km', e.target.value)}
                                className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                            Çmimi (EUR)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                placeholder="Nga"
                                value={filters.buy_now_price_from || ''}
                                onChange={(e) => handleChange('buy_now_price_from', e.target.value)}
                                className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <input
                                type="number"
                                placeholder="Deri"
                                value={filters.buy_now_price_to || ''}
                                onChange={(e) => handleChange('buy_now_price_to', e.target.value)}
                                className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Fuel Type */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                            Lloji i karburantit
                        </label>
                        <select
                            value={filters.fuel_type || ''}
                            onChange={(e) => handleChange('fuel_type', e.target.value)}
                            className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
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
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                            Transmisioni
                        </label>
                        <select
                            value={filters.transmission || ''}
                            onChange={(e) => handleChange('transmission', e.target.value)}
                            className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">Çdo transmision</option>
                            {Object.entries(TRANSMISSIONS).map(([name, id]) => (
                                <option key={id} value={id}>
                                    {name} {filterCounts?.transmissions?.[id] ? `(${filterCounts.transmissions[id]})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>

            {/* Fixed Bottom Buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
                <Button
                    onClick={onApply}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base"
                >
                    Apliko Filtrat
                </Button>
                <Button
                    onClick={onClearFilters}
                    variant="outline"
                    className="w-full h-12 font-semibold text-base"
                >
                    <X className="h-5 w-5 mr-2" />
                    Pastro të gjitha
                </Button>
            </div>
        </div>
    );
};
