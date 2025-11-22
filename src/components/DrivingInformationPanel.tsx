import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Calendar, TrendingUp } from "lucide-react";

interface OwnershipPeriod {
    fromDate: string;
    toDate?: string;
    location: string;
    ownerType: string;
    distanceKm: number;
}

interface DrivingInformationPanelProps {
    ownershipHistory?: OwnershipPeriod[];
    className?: string;
}

const formatDate = (dateStr: string | undefined, monthYearOnly = false): string => {
    if (!dateStr) return "Aktual";

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        if (monthYearOnly) {
            return date.toLocaleDateString('sq-AL', { year: 'numeric', month: 'long' });
        }
        return date.toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return dateStr;
    }
};

const translateOwnerType = (type: string): string => {
    const typeMap: Record<string, string> = {
        'individual': 'Individ',
        'woman': 'Grua',
        'man': 'Burrë',
        'male': 'Burrë',
        'female': 'Grua',
        'corporation': 'Kompani',
        'company': 'Kompani',
        'business': 'Biznes',
        'rental': 'Me qira',
        'lease': 'Leasing',
    };

    const lowerType = type.toLowerCase();
    return typeMap[lowerType] || type;
};

export const DrivingInformationPanel: React.FC<DrivingInformationPanelProps> = ({
    ownershipHistory = [],
    className = ""
}) => {
    if (!ownershipHistory || ownershipHistory.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nuk ka të dhëna të disponueshme për historikun e pronësisë
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Sort by date (newest first)
    const sortedHistory = [...ownershipHistory].sort((a, b) => {
        const dateA = new Date(a.fromDate || '').getTime();
        const dateB = new Date(b.fromDate || '').getTime();
        return dateB - dateA;
    });

    const totalDistance = ownershipHistory.reduce((sum, period) => sum + (period.distanceKm || 0), 0);

    return (
        <div className={className}>
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">Informacioni i vozitjes</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{totalDistance.toLocaleString()} km distancë totale e vozitjes</span>
                </div>
            </div>

            {/* Ownership periods */}
            <div className="space-y-3">
                {sortedHistory.map((period, index) => {
                    const isActive = !period.toDate;

                    return (
                        <Card
                            key={index}
                            className={`border ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: Date range and details */}
                                    <div className="flex-1 space-y-2">
                                        {/* Date range */}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">
                                                {formatDate(period.fromDate, true)} - {formatDate(period.toDate, true)}
                                            </span>
                                            {isActive && (
                                                <Badge variant="default" className="text-xs">
                                                    Në operim
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Location */}
                                        {period.location && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span>{period.location}</span>
                                            </div>
                                        )}

                                        {/* Owner type */}
                                        {period.ownerType && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="h-3.5 w-3.5" />
                                                <span>{translateOwnerType(period.ownerType)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Distance */}
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            {period.distanceKm.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">km</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* No history message */}
            {sortedHistory.length === 0 && (
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground text-center">
                            Kjo makinë nuk ka histori të ndryshimit të qëllimit të përdorimit!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
