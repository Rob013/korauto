import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Calendar, MapPin, Fuel, DollarSign, Gauge, Factory } from "lucide-react";

interface VehicleHistoryPanelProps {
    manufacturer?: string;
    model?: string;
    rating?: string;
    yearOfManufacture?: number;
    mileage?: number;
    productionDate?: string;
    countryOfOrigin?: string;
    use?: string;
    newCarPrice?: number;
    newCarReleasePrice?: number;
    fuel?: string;
    cityFuelConsumption?: string;
    highwayFuelConsumption?: string;
    className?: string;
}

export const VehicleHistoryPanel: React.FC<VehicleHistoryPanelProps> = ({
    manufacturer,
    model,
    rating,
    yearOfManufacture,
    mileage,
    productionDate,
    countryOfOrigin,
    use,
    newCarPrice,
    newCarReleasePrice,
    fuel,
    cityFuelConsumption,
    highwayFuelConsumption,
    className = ""
}) => {
    const formatPrice = (price: number | undefined) => {
        if (!price) return "No information";
        return `${(price / 10000).toFixed(1)} million won`;
    };

    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return "No information";

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const InfoRow = ({
        label,
        value,
        icon: Icon
    }: {
        label: string;
        value: string | number | undefined;
        icon?: React.ElementType
    }) => (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
            </div>
            <div className="text-sm font-medium text-right">
                {value || "No information"}
            </div>
        </div>
    );

    return (
        <div className={className}>
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Car className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Vehicle history information</h3>
                </div>
                {manufacturer && model && (
                    <p className="text-2xl font-bold text-primary">
                        {manufacturer} {model}
                    </p>
                )}
                {rating && (
                    <Badge variant="secondary" className="mt-2">
                        {rating}
                    </Badge>
                )}
            </div>

            <Card>
                <CardContent className="p-0 divide-y divide-border">
                    {/* Basic Information */}
                    <div className="p-4">
                        <h4 className="font-semibold mb-3 text-sm">Basic Information</h4>
                        <div className="space-y-0">
                            <InfoRow
                                label="manufacturing company"
                                value={manufacturer}
                                icon={Factory}
                            />
                            <InfoRow
                                label="model name"
                                value={model}
                                icon={Car}
                            />
                            <InfoRow
                                label="rating"
                                value={rating}
                            />
                            <InfoRow
                                label="Year of manufacture"
                                value={yearOfManufacture ? `${yearOfManufacture}/01 (${yearOfManufacture} model)` : undefined}
                                icon={Calendar}
                            />
                            <InfoRow
                                label="mileage"
                                value={mileage ? `${mileage.toLocaleString()}km` : undefined}
                                icon={Gauge}
                            />
                        </div>
                    </div>

                    {/* Shipping Information */}
                    <div className="p-4">
                        <h4 className="font-semibold mb-3 text-sm">Shipping Information</h4>
                        <div className="space-y-0">
                            <InfoRow
                                label="Production date"
                                value={formatDate(productionDate)}
                                icon={Calendar}
                            />
                            <InfoRow
                                label="Country of origin"
                                value={countryOfOrigin}
                                icon={MapPin}
                            />
                            <InfoRow
                                label="use"
                                value={use}
                            />
                            <InfoRow
                                label="New car price"
                                value={formatPrice(newCarPrice)}
                                icon={DollarSign}
                            />
                            <InfoRow
                                label="New car release price"
                                value={formatPrice(newCarReleasePrice)}
                            />
                        </div>
                    </div>

                    {/* Fuel & Consumption */}
                    {(fuel || cityFuelConsumption || highwayFuelConsumption) && (
                        <div className="p-4">
                            <h4 className="font-semibold mb-3 text-sm">Fuel Information</h4>
                            <div className="space-y-0">
                                <InfoRow
                                    label="fuel"
                                    value={fuel}
                                    icon={Fuel}
                                />
                                <InfoRow
                                    label="City fuel consumption rate"
                                    value={cityFuelConsumption}
                                />
                                <InfoRow
                                    label="Highway fuel consumption rate"
                                    value={highwayFuelConsumption}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notice */}
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>caution</strong>
                    <br />
                    While related parts may have been repaired or replaced, the actual work may differ. For more accurate vehicle accident history, please refer to the performance inspection record below.
                </p>
            </div>
        </div>
    );
};
