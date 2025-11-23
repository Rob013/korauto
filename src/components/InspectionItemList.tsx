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

// Translation mappings
const LABEL_TRANSLATIONS: Record<string, string> = {
    "자기진단": "Vetë-diagnostikim",
    "원동기": "Motori",
    "변속기": "Transmisioni",
    "동력전달": "Transmetimi i fuqisë",
    "조향": "Drejtimi",
    "제동": "Frenimi",
    "전기": "Elektrika",
    "연료": "Karburanti",
    "리어 도어(우)": "Dera e pasme (Djathtas)",
    "판금/용접": "Llamarina/Saldim",
    "프론트 휠하우스(우)": "Shtëpiza e rrotës së përparme (Djathtas)",
    "교환(교체)": "Ndërrim (Zëvendësim)",
    "프론트 휀더(우)": "Fenderi i përparmë (Djathtas)",
    "후드": "Kofano",
    "인사이드 패널(우)": "Paneli i brendshëm (Djathtas)",
    "쿼터 패널(우)": "Paneli çerek (Djathtas)",
    "라디에이터 서포트(볼트체결부품)": "Mbështetësja e radiatorit (Me bulona)",
    "프론트 도어(우)": "Dera e përparme (Djathtas)",
    "engine": "Motori",
    "transmission": "Transmisioni",
    "steering": "Drejtimi",
    "braking": "Frenimi",
    "electrical": "Elektrika",
    "fuel": "Karburanti",
    "hood": "Kofano",
    "door": "Derë",
    "fender": "Fender",
    "panel": "Panel",
    "radiator support": "Mbështetësja e radiatorit",
    "wheel house": "Shtëpiza e rrotës",
    "quarter panel": "Panel çerek"
};

const STATUS_TRANSLATIONS: Record<string, string> = {
    "정상": "Normal",
    "양호": "Në gjendje të mirë",
    "없음": "Asnjë",
    "교환": "Zëvendësuar",
    "교체": "Zëvendësuar",
    "용접": "Salduar",
    "수리": "Riparuar",
    "판금": "Llamarina",
    "good": "Mirë",
    "normal": "Normal",
    "ok": "Në rregull",
    "none": "Asnjë",
    "exchange": "Zëvendësuar",
    "replacement": "Zëvendësuar",
    "welding": "Salduar",
    "repair": "Riparuar",
    "unknown": "E panjohur"
};

const translateText = (text: string): string => {
    if (!text) return text;

    // Check exact match first
    if (LABEL_TRANSLATIONS[text]) return LABEL_TRANSLATIONS[text];
    if (STATUS_TRANSLATIONS[text]) return STATUS_TRANSLATIONS[text];

    // Check case-insensitive match
    const lowerText = text.toLowerCase();
    for (const [key, value] of Object.entries(LABEL_TRANSLATIONS)) {
        if (key.toLowerCase() === lowerText) return value;
    }
    for (const [key, value] of Object.entries(STATUS_TRANSLATIONS)) {
        if (key.toLowerCase() === lowerText) return value;
    }

    // Check if text contains any keywords
    for (const [key, value] of Object.entries(LABEL_TRANSLATIONS)) {
        if (text.includes(key)) {
            return text.replace(key, value);
        }
    }

    return text;
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
                        const label = translateText(item.type?.title || item.title || "Unknown Part");
                        const statusObj = item.statusType || (item.statusTypes && item.statusTypes[0]);
                        const status = translateText(statusObj?.title || statusObj?.code || "Unknown");

                        return <InspectionItemRow key={idx} label={label} status={status} />;
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className={cn("space-y-6", className)}>
            {renderItems(inners || [], "Artikujt e diagnostikimit të kornizës")}
            {renderItems(outers || [], "Artikujt e diagnostikimit të panelit të jashtëm")}
        </div>
    );
};
