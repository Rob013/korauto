import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle, XCircle, Wrench, Car, Shield, DollarSign } from "lucide-react";

interface RecallItem {
    title: string;
    status?: string;
    count?: number;
}

interface SpecialUsage {
    totalLoss?: boolean;
    flooding?: boolean;
    theft?: boolean;
    commercial?: boolean;
    taxi?: boolean;
    police?: boolean;
    rental?: boolean;
}

interface InsuranceGap {
    exists: boolean;
    periods?: string[];
}

interface AttentionHistoryPanelProps {
    recalls?: RecallItem[];
    insuranceGap?: InsuranceGap;
    specialUsage?: SpecialUsage;
    className?: string;
}

export const AttentionHistoryPanel: React.FC<AttentionHistoryPanelProps> = ({
    recalls = [],
    insuranceGap,
    specialUsage,
    className = ""
}) => {
    const AttentionItem = ({
        icon: Icon,
        iconColor,
        title,
        status,
        statusColor
    }: {
        icon: React.ElementType;
        iconColor: string;
        title: string;
        status: string;
        statusColor: string;
    }) => (
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-sm">{title}</span>
            </div>
            <Badge
                variant={statusColor === 'red' ? 'destructive' : statusColor === 'yellow' ? 'secondary' : 'default'}
                className="font-mono"
            >
                {status}
            </Badge>
        </div>
    );

    const hasRecalls = recalls && recalls.length > 0;
    const recallCount = recalls?.reduce((sum, r) => sum + (r.count || 1), 0) || 0;

    const hasInsuranceGap = insuranceGap?.exists;
    const insuranceGapText = hasInsuranceGap
        ? (insuranceGap?.periods?.length ? `${insuranceGap.periods.length} periudha` : 'Ka')
        : "Nuk ekziston";

    return (
        <div className={className}>
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold">Historia e vëmendjes</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Alarme të rëndësishme të historisë së mjetit dhe informacione të përdorimit special
                </p>
            </div>

            <div className="space-y-3">
                {/* Recall Required */}
                <AttentionItem
                    icon={Wrench}
                    iconColor={hasRecalls ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}
                    title="🔧 Recall i kërkuar"
                    status={hasRecalls ? `${recallCount} raste` : "Nuk ekziston"}
                    statusColor={hasRecalls ? "red" : "default"}
                />

                {/* Recall Details */}
                {hasRecalls && (
                    <Card className="ml-12 border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                {recalls.map((recall, index) => (
                                    <div key={index} className="text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="text-red-600 font-bold">•</span>
                                            <div>
                                                <p className="font-medium">{recall.title}</p>
                                                {recall.status && (
                                                    <p className="text-xs text-muted-foreground">Statusi: {recall.status}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Insurance Gap */}
                <AttentionItem
                    icon={Shield}
                    iconColor={hasInsuranceGap ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}
                    title="⚠️ Periudha e mosabonimit në sigurim automjeti"
                    status={insuranceGapText}
                    statusColor={hasInsuranceGap ? "yellow" : "default"}
                />

                {/* Total Loss, Flooding, Theft */}
                <AttentionItem
                    icon={AlertCircle}
                    iconColor={specialUsage?.totalLoss ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}
                    title="🚨 Humbje totale, përmbytje, vjedhje"
                    status={specialUsage?.totalLoss || specialUsage?.flooding || specialUsage?.theft ? "Ekziston" : "Nuk ekziston"}
                    statusColor={specialUsage?.totalLoss || specialUsage?.flooding || specialUsage?.theft ? "red" : "default"}
                />

                {/* Commercial Use (Taxi) */}
                <AttentionItem
                    icon={Car}
                    iconColor={specialUsage?.taxi || specialUsage?.commercial ? "bg-gray-100 dark:bg-gray-800 text-gray-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}
                    title="🚕 Për përdorim komercial si taksi"
                    status={specialUsage?.taxi || specialUsage?.commercial ? "Ekziston" : "Nuk ekziston"}
                    statusColor={specialUsage?.taxi || specialUsage?.commercial ? "yellow" : "default"}
                />

                {/* Police Cars */}
                <AttentionItem
                    icon={Shield}
                    iconColor={specialUsage?.police ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}
                    title="🚔 Makina të policisë, etj."
                    status={specialUsage?.police ? "Ekziston" : "Nuk ekziston"}
                    statusColor={specialUsage?.police ? "yellow" : "default"}
                />

                {/* Rental Cars */}
                <AttentionItem
                    icon={DollarSign}
                    iconColor={specialUsage?.rental ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}
                    title="🚗 Për qëllime qiraje si makina me qira"
                    status={specialUsage?.rental ? "Ekziston" : "Nuk ekziston"}
                    statusColor={specialUsage?.rental ? "yellow" : "default"}
                />
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                        <p className="font-semibold mb-1">Artikujt e historisë së mirëmbajtjes janë informacion i dhënë përmes Ministrisë së Tokës, Infrastrukturës dhe Transportit dhe Institutit të Zhvillimit të Sigurimit.</p>
                        <p>Ndërsa pjesët e lidhura mund të jenë riparuar ose zëvendësuar, puna aktuale mund të ndryshojë. Për histori më të saktë të aksidenteve të automjetit, ju lutemi referojuni regjistrimit të inspektimit të performancës më poshtë.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
