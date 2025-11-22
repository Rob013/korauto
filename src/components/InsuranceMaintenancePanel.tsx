import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wrench, DollarSign, Calendar, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface InsuranceClaim {
    date: string;
    type: 'my_damage' | 'other_damage' | 'estimate';
    costParts?: number;
    costService?: number;
    costCoating?: number;
    description?: string;
}

interface MaintenanceRecord {
    date: string;
    type: string;
    description: string;
    cost?: number;
}

interface InsuranceMaintenancePanelProps {
    insuranceClaims?: InsuranceClaim[];
    maintenanceRecords?: MaintenanceRecord[];
    className?: string;
}

export const InsuranceMaintenancePanel: React.FC<InsuranceMaintenancePanelProps> = ({
    insuranceClaims = [],
    maintenanceRecords = [],
    className = ""
}) => {
    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatCurrency = (amount: number | undefined): string => {
        if (!amount) return '-';
        return `${amount.toLocaleString()} won`;
    };

    const getClaimTypeLabel = (type: string): { label: string; color: string } => {
        switch (type) {
            case 'my_damage':
                return { label: 'Pretendimi i sigurimit (dëmtimi i makinës sime)', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
            case 'other_damage':
                return { label: 'Përpunimi i sigurimit (dëmtimi i makinës tjetër)', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' };
            case 'estimate':
                return { label: 'Vetëm vlerësim', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' };
            default:
                return { label: type, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700' };
        }
    };

    const getMonthYear = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('sq-AL', { year: 'numeric', month: 'long' });
        } catch {
            return dateStr;
        }
    };

    // Combine and sort all records chronologically
    const allRecords = [
        ...insuranceClaims.map(claim => ({ ...claim, recordType: 'insurance' as const })),
        ...maintenanceRecords.map(record => ({ ...record, recordType: 'maintenance' as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className={className}>
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">Historia e Sigurimit/Mirëmbajtjes</h3>
                <p className="text-sm text-muted-foreground">
                    Gjithsej {allRecords.length} raste
                </p>
            </div>

            {/* Sorting tabs */}
            <div className="flex gap-4 mb-4 pb-2 border-b border-border">
                <button className="text-sm font-medium pb-2 border-b-2 border-primary">
                    Renditja kronologjike
                </button>
                <button className="text-sm text-muted-foreground pb-2">
                    Rendit sipas artikullit
                </button>
            </div>

            {/* Records */}
            <div className="space-y-4">
                {allRecords.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Nuk ka regjistrime të sigurimit ose mirëmbajtjes të disponueshme
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    allRecords.map((record, index) => {
                        if (record.recordType === 'insurance') {
                            const claim = record as InsuranceClaim & { recordType: 'insurance' };
                            const typeInfo = getClaimTypeLabel(claim.type);
                            const totalCost = (claim.costParts || 0) + (claim.costService || 0) + (claim.costCoating || 0);

                            return (
                                <Card key={`insurance-${index}`} className="overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* Date marker */}
                                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 border-l-4 border-l-red-500">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                                                {getMonthYear(claim.date)}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            {/* Type badge */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                                <Badge className={typeInfo.color}>
                                                    {typeInfo.label}
                                                </Badge>
                                            </div>

                                            {/* Date of occurrence */}
                                            <div className="flex items-center gap-2 mb-3 text-sm">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Data e ndodhjes:</span>
                                                <span className="font-medium">{formatDate(claim.date)}</span>
                                            </div>

                                            {/* Cost breakdown */}
                                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Pjesë</span>
                                                        <span className="font-mono">{formatCurrency(claim.costParts)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Shërbim publik</span>
                                                        <span className="font-mono">{formatCurrency(claim.costService)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-sm pt-2 border-t border-border">
                                                    <span className="text-muted-foreground">Veshje</span>
                                                    <span className="font-mono">{formatCurrency(claim.costCoating)}</span>
                                                </div>
                                            </div>

                                            {/* Total */}
                                            {totalCost > 0 && (
                                                <div className="mt-3 flex items-center justify-between text-sm">
                                                    <span className="font-semibold">Kosto totale:</span>
                                                    <span className="text-lg font-bold text-primary">
                                                        {formatCurrency(totalCost)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Description */}
                                            {claim.description && (
                                                <p className="mt-3 text-xs text-muted-foreground italic">
                                                    {claim.description}
                                                </p>
                                            )}

                                            {/* Note */}
                                            <p className="mt-3 text-xs text-muted-foreground">
                                                Në rastin e riparimeve individuale me para të sigurimit të marra drejtpërdrejt, mund të mos ketë kosto për pjesë, punë ose lyerje.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        } else {
                            const maintenance = record as MaintenanceRecord & { recordType: 'maintenance' };

                            return (
                                <Card key={`maintenance-${index}`} className="overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* Date marker */}
                                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-l-4 border-l-blue-500">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                {getMonthYear(maintenance.date)}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            {/* Type badge */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <Wrench className="h-4 w-4 text-blue-600" />
                                                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                    Mirëmbajtje e përgjithshme
                                                </Badge>
                                            </div>

                                            {/* Description */}
                                            <p className="text-sm font-medium mb-2">{maintenance.description}</p>

                                            {/* Date */}
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(maintenance.date)}</span>
                                            </div>

                                            {/* Cost if available */}
                                            {maintenance.cost && (
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Kostoja:</span>
                                                    <span className="font-mono font-semibold">
                                                        {formatCurrency(maintenance.cost)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }
                    })
                )}
            </div>

            {/* Footer note */}
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex gap-2">
                    <FileText className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-800 dark:text-yellow-200">
                        <p className="font-semibold mb-1">Artikujt e historisë së mirëmbajtjes janë informacion i dhënë përmes Ministrisë së Tokës, Infrastrukturës dhe Transportit dhe Institutit të Zhvillimit të Sigurimit.</p>
                        <p>Ndërsa pjesët e lidhura mund të jenë riparuar ose zëvendësuar, puna aktuale mund të ndryshojë. Për histori më të saktë të aksidenteve të automjetit, ju lutemi referojuni regjistrimit të inspektimit të performancës më poshtë.</p>
                        <button className="mt-2 text-blue-600 dark:text-blue-400 underline font-medium">
                            Shiko regjistrat e inspektimit të performancës
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
