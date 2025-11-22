import React from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { EncarsInspectionResponse } from "@/services/encarApi";

interface InspectionItemListProps {
    inspectionData?: EncarsInspectionResponse;
    className?: string;
}

const STATUS_COLORS: Record<string, string> = {
    good: "text-green-600 dark:text-green-400",
    normal: "text-green-600 dark:text-green-400",
    pass: "text-green-600 dark:text-green-400",
    ok: "text-green-600 dark:text-green-400",
    replaced: "text-orange-600 dark:text-orange-400",
    replace: "text-orange-600 dark:text-orange-400",
    repair: "text-yellow-600 dark:text-yellow-400",
    repaired: "text-yellow-600 dark:text-yellow-400",
    damaged: "text-red-600 dark:text-red-400",
    fail: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400",
};

const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    for (const [key, color] of Object.entries(STATUS_COLORS)) {
        if (normalized.includes(key)) return color;
    }
    return "text-gray-600 dark:text-gray-400";
};

const InspectionItemRow = ({ label, status }: { label: string; status: string }) => {
    const colorClass = getStatusColor(status);

    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <span className={cn("text-sm font-medium", colorClass)}>{status}</span>
        </div>
    );
};

export const InspectionItemList = ({ inspectionData, className }: InspectionItemListProps) => {
    if (!inspectionData) return null;

    const { outers, inners } = inspectionData;

    const renderItems = (items: any[], title: string) => {
        if (!items || items.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">{title}</h3>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    {items.map((item, idx) => {
                        const label = item.type?.title || item.title || "Unknown Part";
                        const statusObj = item.statusType || (item.statusTypes && item.statusTypes[0]);
                        const status = statusObj?.title || statusObj?.code || "Unknown";

                        return <InspectionItemRow key={idx} label={label} status={status} />;
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className={cn("space-y-6", className)}>
            {renderItems(inners || [], "Frame Diagnostic Item")}
            {renderItems(outers || [], "External Panel Diagnosis Item")}
        </div>
    );
};
