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
        if (!price) return "Nuk ka informacion";
        return `${(price / 10000).toFixed(1)} milionë won`;
    };

    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return "Nuk ka informacion";

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' });
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
                {value || "Nuk ka informacion"}
            </div>
        </div>
    );

    return (
        <div className={className}>
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Car className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Informacioni i historisë së mjetit</h3>
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
                        <h4 className="font-semibold mb-3 text-sm">Informacioni bazë</h4>
                        <div className="space-y-0">
                            <InfoRow
                                label="Kompania prodhuese"
                                value={manufacturer}
                                icon={Factory}
                            />
                            <InfoRow
                                label="Emri i modelit"
                                value={model}
                                icon={Car}
                            />
                            <InfoRow
                                label="Vlerësimi"
                                value={rating}
                            />
                            <InfoRow
                                label="Viti i prodhimit"
                                value={yearOfManufacture ? `${yearOfManufacture}/01 (modeli ${yearOfManufacture})` : undefined}
                                icon={Calendar}
                            />
                            <InfoRow
                                label="Kilometrazha"
                                value={mileage ? `${mileage.toLocaleString()}km` : undefined}
                                icon={Gauge}
                            />
                        </div>
                    </div>

                    {/* Shipping Information */}
                    <div className="p-4">
                        <h4 className="font-semibold mb-3 text-sm">Informacioni i dërgesës</h4>
                        <div className="space-y-0">
                            <InfoRow
                                label="Data e prodhimit"
                                value={formatDate(productionDate)}
                                icon={Calendar}
                            />
                            <InfoRow
                                label="Vendi i origjinës"
                                value={countryOfOrigin}
                                icon={MapPin}
                            />
                            <InfoRow
                                label="Përdorimi"
                                value={use}
                            />
                            <InfoRow
                                label="Çmimi i makinës së re"
                                value={formatPrice(newCarPrice)}
                                icon={DollarSign}
                            />
                            <InfoRow
                                label="Çmimi i lëshimit të makinës së re"
                                value={formatPrice(newCarReleasePrice)}
                            />
                        </div>
                    </div>

                    {/* Fuel & Consumption */}
                    {(fuel || cityFuelConsumption || highwayFuelConsumption) && (
                        <div className="p-4">
                            <h4 className="font-semibold mb-3 text-sm">Informacioni i karburantit</h4>
                            <div className="space-y-0">
                                <InfoRow
                                    label="Karburanti"
                                    value={fuel}
                                    icon={Fuel}
                                />
                                <InfoRow
                                    label="Konsumi i karburantit në qytet"
                                    value={cityFuelConsumption}
                                />
                                <InfoRow
                                    label="Konsumi i karburantit në autostradë"
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
                    ⚠️ <strong>Kujdes</strong>
                    <br />
                    Ndërsa pjesët e lidhura mund të jenë riparuar ose zëvendësuar, puna aktuale mund të ndryshojë. Për histori më të saktë të aksidenteve të automjetit, ju lutemi referojuni regjistrimit të inspektimit të performancës më poshtë.
                </p>
            </div>
        </div>
    );
};
