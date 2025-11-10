import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";
import { calculateFinalPriceEUR } from "@/utils/carPricing";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useKoreaOptions } from "@/hooks/useKoreaOptions";
import { fallbackCars } from "@/data/fallbackData";
import { formatMileage } from "@/utils/mileageFormatter";
import { InspectionDiagramPanel } from "@/components/InspectionDiagramPanel";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { openCarDetailsInNewTab } from "@/utils/navigation";
import {
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  Car,
  CheckCircle,
  Clock,
  Cog,
  FileText,
  Gauge,
  Loader2,
  MapPin,
  Image,
  Shield,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface InspectionReportCar {
  id: string;
  lot?: string;
  make?: string;
  model?: string;
  year?: number;
  title?: string;
  image?: string;
  priceEUR?: number;
  mileageKm?: number;
  odometer?: {
    km?: number;
    mi?: number;
    status?: {
      name?: string;
    };
  };
  vin?: string;
  fuel?: string;
  firstRegistration?: string;
  postedAt?: string;
  engineDisplacement?: number | string;
  engineCode?: string;
  transmissionName?: string;
  damage?: {
    main?: string | null;
    second?: string | null;
  } | null;
  insurance?: any;
  insurance_v2?: any;
  details?: any;
  inspect?: any;
  ownerChanges?: any[];
  maintenanceHistory?: any[];
  location?: any;
  grade?: string;
  sourceLabel?: string;
}

type InsuranceSummaryInfo = {
  accident_history?: unknown;
  repair_count?: unknown;
  total_loss?: unknown;
  flood_damage?: unknown;
  [key: string]: unknown;
};

type UsageHistoryEntry = { description?: string; value?: string };

type OwnerChangeEntry = {
  date?: string;
  change_type?: string;
  previous_number?: string;
  usage_type?: string;
};

type SpecialAccidentEntry = { type?: string; value?: string };

const API_BASE_URL = "https://auctionsapi.com/api";
const API_KEY = "d00985c77981fe8d26be16735f932ed1";

const positiveStatusValues = new Set([
  "goodness",
  "proper",
  "doesn't exist",
  "good",
  "ok",
  "okay",
  "normal",
  "excellent",
  "perfect",
  "fine",
  "good condition",
]);

const translateStatusValue = (value: unknown) => {
  if (typeof value !== "string") return String(value ?? "") || "-";
  const normalized = value.toLowerCase();
  switch (normalized) {
    case "goodness":
    case "good":
    case "ok":
    case "okay":
    case "fine":
      return "Mirë";
    case "proper":
      return "Saktë";
    case "doesn't exist":
      return "Nuk ekziston";
    case "normal":
      return "Normal";
    case "excellent":
      return "Shkëlqyeshëm";
    case "perfect":
      return "Perfekt";
    default:
      return value;
  }
};

const isPositiveStatus = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return positiveStatusValues.has(value.toLowerCase());
  }
  return false;
};

const formatKeyLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const translateOdometerStatus = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.toString().toLowerCase();
  if (normalized.includes("actual")) return "I verifikuar";
  if (normalized.includes("not") && normalized.includes("actual"))
    return "I pasaktë";
  if (normalized.includes("not") && normalized.includes("exempt"))
    return "I përjashtuar";
  if (normalized.includes("exempt")) return "I përjashtuar";
  if (normalized.includes("unknown")) return "E panjohur";
  if (normalized.includes("tampered")) return "Dyshohet për manipulim";
  return value;
};

const translateTransmissionName = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.toString().toLowerCase();
  if (normalized.includes("automatic") || normalized === "auto")
    return "Automatike";
  if (normalized.includes("manual")) return "Manuale";
  if (normalized.includes("dual") || normalized.includes("dct"))
    return "DCT (Dual Clutch)";
  if (normalized.includes("cvt")) return "CVT";
  if (normalized.includes("amt")) return "Transmision i automatizuar";
  if (normalized.includes("semi")) return "Polo-automatike";
  return value;
};

const translateFuelName = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.toString().toLowerCase();
  if (normalized.includes("diesel")) return "Naftë";
  if (normalized.includes("gasoline") || normalized.includes("petrol"))
    return "Benzinë";
  if (normalized.includes("hybrid")) return "Hibride";
  if (normalized.includes("electric")) return "Elektrike";
  if (normalized.includes("lpg")) return "LPG";
  if (normalized.includes("cng")) return "CNG";
  return value;
};

const formatEngineDisplacementValue = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.round(value).toLocaleString("sq-AL")} cc`;
  }

  const numeric = Number(
    typeof value === "string" ? value.replace(/[^\d.]/g, "") : value,
  );

  if (!Number.isNaN(numeric) && isFinite(numeric) && numeric > 20) {
    return `${Math.round(numeric).toLocaleString("sq-AL")} cc`;
  }

  return typeof value === "string" ? value : undefined;
};

const formatDisplayDate = (
  value?: unknown,
  { monthYear = false }: { monthYear?: boolean } = {},
) => {
  if (value === undefined || value === null) return null;
  // If object, try common date-carrying fields
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidate =
      obj.first_registration ||
      obj.firstDate ||
      obj.date ||
      obj.value ||
      obj.regDate ||
      obj.created_at ||
      obj.updated_at;
    return formatDisplayDate(candidate, { monthYear });
  }
  const raw = typeof value === "number" ? value.toString() : `${value}`.trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, "");

  const monthYearMatch = normalized.match(/^(\d{2})[./](\d{4})$/);
  if (monthYearMatch) {
    return `${monthYearMatch[1]}.${monthYearMatch[2]}`;
  }

  const dayMonthYearMatch = normalized.match(
    /^(\d{2})[./-](\d{2})[./-](\d{4})$/,
  );
  if (dayMonthYearMatch) {
    const [, dd, mm, yyyy] = dayMonthYearMatch;
    return monthYear ? `${mm}.${yyyy}` : `${dd}.${mm}.${yyyy}`;
  }

  const yearMonthDayMatch = normalized.match(
    /^(\d{4})[./-](\d{2})[./-](\d{2})$/,
  );
  if (yearMonthDayMatch) {
    const [, yyyy, mm, dd] = yearMonthDayMatch;
    return monthYear ? `${mm}.${yyyy}` : `${dd}.${mm}.${yyyy}`;
  }

  const digitsOnly = normalized.replace(/[^0-9]/g, "");
  if (digitsOnly.length === 8) {
    const yyyy = digitsOnly.slice(0, 4);
    const mm = digitsOnly.slice(4, 6);
    const dd = digitsOnly.slice(6, 8);
    return monthYear ? `${mm}.${yyyy}` : `${dd}.${mm}.${yyyy}`;
  }

  if (digitsOnly.length === 6) {
    const yyyy = digitsOnly.slice(0, 4);
    const mm = digitsOnly.slice(4, 6);
    return `${mm}.${yyyy}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    if (monthYear) {
      return parsed.toLocaleDateString("sq-AL", {
        month: "2-digit",
        year: "numeric",
      });
    }
    return parsed.toLocaleDateString("sq-AL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return raw.replace(/-/g, ".").replace(/T.*/, "");
};

const CarInspectionReport = () => {
  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exchangeRate, processFloodDamageText, convertKRWtoEUR } =
    useCurrencyAPI();
  const {
    getOptionName,
    getOptionDescription,
    loading: optionsLoading,
  } = useKoreaOptions();
  const [car, setCar] = useState<InspectionReportCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllStandard, setShowAllStandard] = useState(false);
  const [showAllChoice, setShowAllChoice] = useState(false);

  const fetchInspectionReport = useCallback(async () => {
    if (!lot) return;

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
        headers: {
          accept: "*/*",
          "x-api-key": API_KEY,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        response = await fetch(`${API_BASE_URL}/search?lot_number=${lot}`, {
          headers: {
            accept: "*/*",
            "x-api-key": API_KEY,
          },
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const carData = data.data;
      const lotData = carData?.lots?.[0];

      if (!lotData) {
        throw new Error("Informacioni i lotit mungon në përgjigjen e API-së");
      }

      const basePrice = lotData.buy_now || lotData.final_bid || lotData.price;
      const priceEUR = basePrice
        ? calculateFinalPriceEUR(basePrice, exchangeRate.rate)
        : undefined;

      const details = lotData.details || {};

      // Extract inspect data from details.inspect and carData.details
      const inspectData =
        details?.inspect ||
        lotData.inspect ||
        (carData as any)?.details?.inspect ||
        {};
      // Prefer array-based sources for outer inspection details
      const inspectOuterCandidates: any[] = [];
      if (Array.isArray(details?.inspect_outer))
        inspectOuterCandidates.push(...(details as any).inspect_outer);
      if (Array.isArray((carData as any)?.details?.inspect_outer))
        inspectOuterCandidates.push(...(carData as any).details.inspect_outer);
      if (Array.isArray((inspectData as any)?.inspect_outer))
        inspectOuterCandidates.push(...(inspectData as any).inspect_outer);
      if (Array.isArray((inspectData as any)?.outer))
        inspectOuterCandidates.push(...(inspectData as any).outer);
      const inspectOuter = inspectOuterCandidates;
      const inspectInner = (inspectData as any).inner || {};
      const accidentSummary = (inspectData as any).accident_summary || {};

      // Extract insurance_v2 data
      const insuranceV2 = lotData.insurance_v2 || details?.insurance_v2 || {};

      // Extract options data
      const optionsData = details?.options || {};
      const optionsExtra = details?.options_extra || [];

      if (process.env.NODE_ENV === "development") {
        console.log("🔍 Inspection Report Data Collection:", {
          "details.inspect": details?.inspect,
          "inspectData.accident_summary": accidentSummary,
          "inspectData.outer": inspectOuter,
          "inspectData.inner": inspectInner,
          insurance_v2: insuranceV2,
          options: optionsData,
          options_extra: optionsExtra,
          hasAccidentSummary: Object.keys(accidentSummary).length > 0,
          hasOuterData: Object.keys(inspectOuter).length > 0,
          hasInsuranceData: Object.keys(insuranceV2).length > 0,
          hasOptionsExtra: optionsExtra.length > 0,
        });
      }

      const transformed: InspectionReportCar = {
        id: carData.id?.toString() || lot,
        lot: lotData.lot || lot,
        make: carData.manufacturer?.name,
        model: carData.model?.name,
        year: carData.year,
        title: carData.title || lotData.title,
        image: lotData.images?.big?.[0] || lotData.images?.normal?.[0],
        priceEUR,
        mileageKm: lotData.odometer?.km,
        odometer: lotData.odometer,
        vin:
          lotData.vin ||
          carData.vin ||
          details?.vin ||
          details?.insurance?.car_info?.vin,
        fuel:
          carData.fuel?.name ||
          lotData.fuel?.name ||
          details?.fuel?.name ||
          details?.specs?.fuel,
        firstRegistration:
          lotData.first_registration ||
          (typeof lotData.firstRegistration === "string" &&
            lotData.firstRegistration) ||
          details?.first_registration ||
          lotData.insurance_v2?.firstDate ||
          carData.insurance_v2?.firstDate,
        postedAt:
          lotData.listed_at ||
          lotData.posted_at ||
          lotData.created_at ||
          carData.listed_at ||
          carData.posted_at ||
          carData.created_at,
          engineDisplacement:
            lotData.insurance_v2?.displacement ||
            carData.insurance_v2?.displacement ||
            details?.engine_volume ||
            details?.engine?.displacement,
          engineCode:
            carData.engine?.name ||
            (details?.engine as any)?.name ||
            lotData.engine?.name,
          transmissionName:
            carData.transmission?.name ||
            lotData.transmission?.name ||
            (details?.transmission as any)?.name,
        damage: lotData.damage || details?.damage || null,
        insurance: lotData.insurance || details?.insurance || carData.insurance,
        insurance_v2: insuranceV2,
        details: {
          ...details,
          inspect_outer: inspectOuter,
          inspect: {
            accident_summary: accidentSummary,
            outer: inspectOuter,
            inner: inspectInner,
          },
          options: optionsData,
          options_extra: optionsExtra,
        },
        inspect: {
          accident_summary: accidentSummary,
          outer: inspectOuter,
          inner: inspectInner,
        },
        ownerChanges: details?.insurance?.owner_changes || [],
        maintenanceHistory: details?.maintenance_history || [],
        location: lotData.location,
        grade: lotData.grade_iaai,
        sourceLabel: carData.source_label || carData.domain_name,
      };

      setCar(transformed);
      setLoading(false);
    } catch (apiError) {
      console.error("Failed to fetch inspection report:", apiError);

      const fallbackCar = fallbackCars.find(
        (fallback) =>
          fallback.id === lot ||
          fallback.lot_number === lot ||
          fallback?.lots?.[0]?.lot === lot,
      );

      if (fallbackCar && fallbackCar.lots?.[0]) {
        const lotData = fallbackCar.lots[0];
        const basePrice = lotData.buy_now || fallbackCar.price;
        const priceEUR = basePrice
          ? calculateFinalPriceEUR(basePrice, exchangeRate.rate)
          : undefined;

        const lotDataAny = lotData as any;
        const fallbackCarAny = fallbackCar as any;

        setCar({
          id: fallbackCar.id,
          lot: lotData.lot,
          make: fallbackCar.manufacturer?.name,
          model: fallbackCar.model?.name,
          year: fallbackCar.year,
          title: fallbackCar.title,
          image: lotData.images?.big?.[0] || lotData.images?.normal?.[0],
          priceEUR,
          mileageKm: lotData.odometer?.km,
          odometer: lotData.odometer,
          vin: fallbackCarAny.vin || lotDataAny.vin,
          fuel:
            fallbackCar.fuel?.name ||
            lotDataAny.fuel?.name ||
            fallbackCarAny.details?.fuel?.name,
          firstRegistration:
            lotDataAny.first_registration ||
            fallbackCarAny.first_registration ||
            fallbackCarAny.details?.first_registration,
          postedAt: lotDataAny.listed_at || fallbackCarAny.listed_at,
          engineDisplacement:
            fallbackCarAny.details?.engine_volume ||
            lotDataAny.insurance_v2?.displacement,
          engineCode:
            fallbackCarAny.engine?.name ||
            fallbackCarAny.details?.engine?.name ||
            lotDataAny.engine?.name,
          transmissionName:
            fallbackCarAny.transmission?.name ||
            lotDataAny.transmission?.name ||
            fallbackCarAny.details?.transmission?.name,
          damage: lotDataAny.damage || null,
          insurance: lotDataAny.insurance,
          insurance_v2: lotDataAny.insurance_v2,
          details: lotDataAny.details,
          maintenanceHistory: lotDataAny.details?.maintenance_history || [],
          ownerChanges: lotDataAny.details?.insurance?.owner_changes || [],
        });
        setLoading(false);
        return;
      }

      setError(
        apiError instanceof Error
          ? apiError.message
          : "Nuk u arrit të ngarkohej raporti i inspektimit",
      );
      setLoading(false);
    }
  }, [exchangeRate.rate, lot]);

  useEffect(() => {
    trackPageView(`/car/${lot}/report`, {
      page_type: "inspection_report",
    });
  }, [lot]);

  useEffect(() => {
    fetchInspectionReport();
  }, [fetchInspectionReport]);

  const inspectionOuterData = useMemo(() => {
    // Try multiple potential locations and merge arrays if found
    const candidates: unknown[] = [];
    const pushIfArray = (val: unknown) => {
      if (Array.isArray(val)) candidates.push(...val);
    };
    pushIfArray(car?.details?.inspect_outer);
    pushIfArray(car?.inspect?.outer);
    pushIfArray(car?.inspect?.inspect_outer);
    pushIfArray((car as any)?.details?.inspect?.outer);
    pushIfArray((car as any)?.details?.outer);
    // Deduplicate by type.code if present
    const keyed = new Map<string, any>();
    for (const item of candidates) {
      const code =
        (item as any)?.type?.code ||
        (item as any)?.code ||
        JSON.stringify(item);
      if (!keyed.has(code)) keyed.set(code, item);
    }
    return Array.from(keyed.values());
  }, [car]);

  const inspectionInnerData = useMemo(() => {
    const raw =
      car?.details?.inspect?.inner ||
      car?.inspect?.inner ||
      (car as any)?.details?.inspect_inner ||
      null;

    if (!raw || typeof raw !== "object") return null;

    const result: Record<string, unknown> = {};

    const walk = (obj: any, prefix = "") => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix} ${k}` : k;
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          walk(v, key);
        } else if (Array.isArray(v)) {
          // Join simple arrays, or recurse elements
          const simple = v.every((el) => typeof el !== "object");
          if (simple) {
            result[key] = v.join(", ");
          } else {
            v.forEach((el, idx) => walk(el, `${key} ${idx + 1}`));
          }
        } else {
          result[key] = v as unknown;
        }
      }
    };

    walk(raw);
    return result;
  }, [car]);

  const inspectionIssueSummary = useMemo(() => {
    if (!inspectionOuterData || inspectionOuterData.length === 0) {
      return { replacements: 0, repairs: 0, total: 0, unaffected: 0 };
    }

    let replacements = 0;
    let repairs = 0;

    inspectionOuterData.forEach((item: any) => {
      const rawStatuses =
        item?.statusTypes ?? (item as any)?.status_types ?? [];
      const statuses = Array.isArray(rawStatuses)
        ? rawStatuses
        : rawStatuses
          ? [rawStatuses]
          : [];
      const rawAttributes = item?.attributes ?? (item as any)?.attribute;
      const attributes = Array.isArray(rawAttributes)
        ? rawAttributes
        : rawAttributes
          ? [rawAttributes]
          : [];

      let markerType: "N" | "R" | null = null;

      statuses.forEach((status: any) => {
        const code = (status?.code || status?.status || "")
          .toString()
          .toUpperCase();
        const title = (status?.title || status?.name || "")
          .toString()
          .toLowerCase();

        if (
          code === "X" ||
          code === "N" ||
          title.includes("exchange") ||
          title.includes("replacement") ||
          title.includes("교환")
        ) {
          markerType = "N";
        } else if (
          code === "A" ||
          code === "R" ||
          code === "W" ||
          title.includes("repair") ||
          title.includes("수리") ||
          title.includes("weld") ||
          title.includes("용접")
        ) {
          markerType = markerType === "N" ? markerType : "R";
        }
      });

      if (!markerType) {
        const hasRankIndicator = attributes.some((attr: any) => {
          const value =
            typeof attr === "string"
              ? attr
              : typeof attr?.code === "string"
                ? attr.code
                : typeof attr?.title === "string"
                  ? attr.title
                  : "";
          const normalized = value.toUpperCase();
          return normalized.includes("RANK") || normalized.includes("GRADE");
        });

        if (hasRankIndicator) {
          markerType = "R";
        }
      }

      if (markerType === "N") {
        replacements += 1;
      } else if (markerType === "R") {
        repairs += 1;
      }
    });

    const total = inspectionOuterData.length;
    const affected = replacements + repairs;
    const unaffected = Math.max(total - affected, 0);

    return { replacements, repairs, total, unaffected };
  }, [inspectionOuterData]);

  const insuranceCarInfo = useMemo<InsuranceSummaryInfo | undefined>(() => {
    const baseInfo =
      car?.details?.insurance?.car_info &&
      typeof car.details.insurance.car_info === "object"
        ? { ...(car.details.insurance.car_info as Record<string, unknown>) }
        : {};

    const insuranceV2 = car?.insurance_v2 as
      | Record<string, unknown>
      | undefined;
    if (insuranceV2) {
      const assignIfMissing = (
        key: keyof InsuranceSummaryInfo,
        value: unknown,
      ) => {
        if (value === undefined || value === null || value === "") return;
        if (!(key in baseInfo)) {
          baseInfo[key] = value;
        }
      };

      const accidentCount =
        typeof insuranceV2.accidentCnt === "number"
          ? insuranceV2.accidentCnt
          : ((insuranceV2.myAccidentCnt as number | undefined) ?? 0) +
            ((insuranceV2.otherAccidentCnt as number | undefined) ?? 0);
      if (accidentCount) {
        assignIfMissing("accident_history", accidentCount);
      }

      const repairCount =
        typeof insuranceV2.myAccidentCnt === "number" &&
        typeof insuranceV2.otherAccidentCnt === "number"
          ? insuranceV2.myAccidentCnt + insuranceV2.otherAccidentCnt
          : (insuranceV2.myAccidentCnt ?? insuranceV2.otherAccidentCnt);
      if (repairCount !== undefined) {
        assignIfMissing("repair_count", repairCount);
      }

      if (typeof insuranceV2.totalLossCnt === "number") {
        assignIfMissing("total_loss", insuranceV2.totalLossCnt);
      }

      if (typeof insuranceV2.floodTotalLossCnt === "number") {
        assignIfMissing("flood_damage", insuranceV2.floodTotalLossCnt);
      }
    }

    return Object.keys(baseInfo).length > 0
      ? (baseInfo as InsuranceSummaryInfo)
      : undefined;
  }, [car]);

  const accidents = useMemo(() => {
    if (!car?.insurance_v2?.accidents) return [];
    if (Array.isArray(car.insurance_v2.accidents)) {
      return car.insurance_v2.accidents;
    }
    return [];
  }, [car]);

  const usageHistoryList = useMemo<UsageHistoryEntry[]>(() => {
    const entries: UsageHistoryEntry[] = [];

    const addEntry = (entry: any) => {
      if (!entry) return;
      const description = entry.description ?? entry.type ?? entry.label;
      const rawValue = entry.value ?? entry.result ?? entry.details;
      entries.push({
        description,
        value:
          typeof rawValue === "string"
            ? rawValue
            : rawValue !== undefined && rawValue !== null
              ? String(rawValue)
              : undefined,
      });
    };

    const usageHistory = car?.details?.insurance?.usage_history;
    if (Array.isArray(usageHistory)) {
      usageHistory.forEach(addEntry);
    }

    const carInfoChanges = (car?.insurance_v2 as any)?.carInfoChanges;
    if (Array.isArray(carInfoChanges)) {
      carInfoChanges.forEach((change: any) => {
        const description =
          change?.description ||
          change?.type ||
          (change?.carNo
            ? `Ndryshim targash (${change.carNo})`
            : "Ndryshim informacioni");
        const formattedDate =
          formatDisplayDate(change?.date, { monthYear: true }) ??
          formatDisplayDate(change?.changed_at, { monthYear: true }) ??
          change?.date ??
          change?.changed_at ??
          undefined;

        entries.push({
          description,
          value: formattedDate,
        });
      });
    }

    return entries.filter((entry) => entry.description || entry.value);
  }, [car]);

  const toYesNo = useCallback((value?: string | number | boolean | null) => {
    const evaluate = (input: unknown): "Po" | "Jo" | null => {
      if (input === undefined || input === null) return null;

      if (Array.isArray(input)) {
        for (const item of input) {
          const result = evaluate(item);
          if (result) return result;
        }
        return null;
      }

      if (typeof input === "boolean") return input ? "Po" : "Jo";
      if (typeof input === "number") return input > 0 ? "Po" : "Jo";

      const rawString = input.toString().trim();
      if (!rawString) return null;

      const normalized = rawString.toLowerCase();
      const compact = normalized.replace(/\s+/g, "");
      const asciiOnly = normalized.replace(/[^a-z0-9]/g, "");
      const tokens = normalized
        .replace(/[\u3000]/g, " ")
        .split(/[\s,.;:!?()<>|/\\\-]+/)
        .filter(Boolean);
      const tokenSet = new Set(tokens);

      const containsIndicator = (text: string, indicators: string[]) =>
        indicators.some((indicator) => text.includes(indicator));

      const unknownIndicators = [
        "unknown",
        "n/a",
        "n\\a",
        "not available",
        "no data",
        "not provided",
        "unavailable",
        "undefined",
        "정보없",
        "미확인",
        "확인불가",
        "미제공",
        "알수없",
        "확인 안됨",
        "정보 없음",
      ];
      if (
        containsIndicator(normalized, unknownIndicators) ||
        containsIndicator(compact, unknownIndicators)
      ) {
        return null;
      }

      const directYesTokens = [
        "po",
        "yes",
        "true",
        "y",
        "present",
        "exists",
        "available",
        "positive",
      ];
      const directYesAscii = ["1"];
      if (
        directYesTokens.some((token) => tokenSet.has(token)) ||
        directYesAscii.includes(asciiOnly)
      ) {
        return "Po";
      }

      const directNoTokens = [
        "jo",
        "no",
        "false",
        "n",
        "never",
        "none",
        "without",
        "absent",
        "missing",
        "lack",
        "zero",
        "negative",
      ];
      const directNoAscii = ["0"];
      if (
        directNoTokens.some((token) => tokenSet.has(token)) ||
        directNoAscii.includes(asciiOnly)
      ) {
        return "Jo";
      }

      const negativeIndicators = [
        "없음",
        "없다",
        "無",
        "무사",
        "무이력",
        "미사용",
        "미이용",
        "미보유",
        "미등록",
        "미발견",
        "미이력",
        "미취급",
        "미진행",
        "미해당",
        "해당없",
        "해당 없음",
        "해당사항없",
        "해당 사항 없음",
        "아님",
        "아니",
        "불가",
        "비영업",
        "비사업",
        "자가용",
        "private",
        "non-commercial",
        "non commercial",
        "noncommercial",
        "no history",
        "no histories",
        "no record",
        "no records",
        "no rental",
        "no rent",
        "no commercial",
        "no usage",
        "no usage history",
        "no history of use",
        "no business history",
        "no rental history",
        "without usage",
        "without usage history",
        "without history of use",
        "usage history not found",
        "history of use none",
        "nuk ka histori",
        "nuk ka perdorim",
        "nuk ka përdorim",
        "not found",
        "norent",
        "norental",
        "norecord",
        "미렌트",
        "렌트이력없음",
        "영업이력없음",
      ];
      if (
        containsIndicator(normalized, negativeIndicators) ||
        containsIndicator(compact, negativeIndicators)
      ) {
        return "Jo";
      }

      const historyContextTerms = [
        "history",
        "record",
        "histori",
        "perdorim",
        "përdorim",
        "이력",
        "기록",
      ];
      const usageContextTerms = [
        "use",
        "usage",
        "perdorim",
        "perdorimi",
        "përdorim",
        "përdorimi",
        "rental",
        "rent",
        "lease",
        "leasing",
        "business",
        "commercial",
        "fleet",
        "operation",
        "biznes",
        "taxi",
      ];
      const positiveHistoryPresenceTerms = [
        "has",
        "have",
        "having",
        "with",
        "exists",
        "exist",
        "present",
        "available",
        "recorded",
        "ka ",
        "ka-",
        "ka histori",
        "ka perdorim",
        "ka përdorim",
      ];
      const negativeHistoryPresenceTerms = [
        "no",
        "without",
        "none",
        "never",
        "lack",
        "absent",
        "nuk",
        "pa ",
        "pa-",
      ];

      const hasHistoryContext =
        containsIndicator(normalized, historyContextTerms) ||
        containsIndicator(compact, historyContextTerms);
      const hasUsageContext =
        containsIndicator(normalized, usageContextTerms) ||
        containsIndicator(compact, usageContextTerms);
      const hasPositiveHistoryPresence =
        containsIndicator(normalized, positiveHistoryPresenceTerms) ||
        /있다|있음|보유|유|존재/.test(normalized);
      const hasNegativeHistoryPresence =
        containsIndicator(normalized, negativeHistoryPresenceTerms) ||
        /없|無|미사용|비사용|무이력/.test(normalized);

      if (
        hasHistoryContext &&
        hasUsageContext &&
        hasPositiveHistoryPresence &&
        !hasNegativeHistoryPresence
      ) {
        return "Po";
      }

      if (
        (tokenSet.has("non") &&
          (tokenSet.has("commercial") ||
            tokenSet.has("business") ||
            tokenSet.has("rental") ||
            tokenSet.has("rent"))) ||
        (tokenSet.has("no") &&
          (tokenSet.has("commercial") ||
            tokenSet.has("business") ||
            tokenSet.has("rental") ||
            tokenSet.has("rent")))
      ) {
        return "Jo";
      }

      const positiveIndicators = [
        "있음",
        "있다",
        "유",
        "보유",
        "사용",
        "사용중",
        "임대",
        "렌트",
        "렌터카",
        "임차",
        "대여",
        "영업",
        "영업용",
        "사업",
        "사업용",
        "업무용",
        "상업",
        "komerc",
        "komercial",
        "commercial",
        "corporate",
        "taxi",
        "fleet",
        "lease",
        "leasing",
        "법인",
        "biz",
        "biznes",
      ];
      if (
        containsIndicator(normalized, positiveIndicators) ||
        containsIndicator(compact, positiveIndicators)
      ) {
        return "Po";
      }

      const numeric = parseFloat(asciiOnly || normalized);
      if (!isNaN(numeric)) {
        return numeric > 0 ? "Po" : "Jo";
      }

      return null;
    };

    return evaluate(value);
  }, []);

  const ownerChangesList = useMemo<OwnerChangeEntry[]>(() => {
    const entries: OwnerChangeEntry[] = [];
    const addEntry = (entry: any) => {
      if (!entry) return;
      entries.push({
        date:
          entry?.date ||
          entry?.change_date ||
          entry?.changeDate ||
          entry?.changed_at ||
          entry?.created_at ||
          entry?.updated_at,
        change_type:
          entry?.change_type ||
          entry?.type ||
          entry?.description ||
          entry?.label,
        previous_number:
          entry?.previous_number ||
          entry?.previousNumber ||
          entry?.carNo ||
          entry?.number,
        usage_type: entry?.usage_type || entry?.usageType || entry?.useType,
      });
    };

    const insuranceOwnerChanges = car?.details?.insurance?.owner_changes;
    if (Array.isArray(insuranceOwnerChanges)) {
      insuranceOwnerChanges.forEach(addEntry);
    }

    if (Array.isArray(car?.ownerChanges)) {
      car.ownerChanges.forEach(addEntry);
    }

    const ownerChangesV2 = (car?.insurance_v2 as any)?.ownerChanges;
    if (Array.isArray(ownerChangesV2)) {
      ownerChangesV2.forEach(addEntry);
    }

    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = `${entry.date ?? ""}-${entry.change_type ?? ""}-${entry.previous_number ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [car]);

  const accidentEntries = useMemo(() => {
    return accidents.map((accident: any) => {
      const dateValue =
        accident?.date ||
        accident?.accidentDate ||
        accident?.accident_date ||
        accident?.created_at ||
        accident?.updated_at;

      const normalizeValue = (value: unknown) => {
        if (value === undefined || value === null || value === "") return "-";
        if (typeof value === "number") {
          const eurValue = Math.round(convertKRWtoEUR(value));
          return eurValue > 0 ? `${eurValue}€` : "-";
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return "-";
          return trimmed;
        }
        return String(value) || "-";
      };

      return {
        date: dateValue ? (formatDisplayDate(dateValue) ?? dateValue) : "-",
        type:
          accident?.type === "2"
            ? "Dëmtimi i vet"
            : accident?.type === "3"
              ? "Dëmtim nga tjeri"
              : accident?.type
                ? `Tipi ${accident.type}`
                : "-",
        part: normalizeValue(
          accident?.part ||
            accident?.partCost ||
            accident?.parts ||
            accident?.component ||
            accident?.position,
        ),
        paint: normalizeValue(
          accident?.paintingCost || accident?.paint || accident?.painting,
        ),
        labor: normalizeValue(
          accident?.laborCost || accident?.labor || accident?.workCost,
        ),
        total: normalizeValue(
          accident?.insuranceBenefit ||
            accident?.total ||
            accident?.totalCost ||
            accident?.sum,
        ),
      };
    });
  }, [accidents, convertKRWtoEUR]);

  const hasAccidentDetails = useMemo(
    () =>
      accidentEntries.some((entry) =>
        Object.values(entry).some(
          (value) =>
            value !== "-" &&
            value !== "" &&
            value !== null &&
            value !== undefined,
        ),
      ),
    [accidentEntries],
  );

  const ownerChangeCount =
    typeof car?.insurance_v2?.ownerChangeCnt === "number"
      ? car.insurance_v2.ownerChangeCnt
      : ownerChangesList.length > 0
        ? ownerChangesList.length
        : car?.ownerChanges?.length;

  const ownerChangesDisplay =
    ownerChangeCount === undefined
      ? "-"
      : ownerChangeCount === 0
        ? "Asnjë"
        : ownerChangeCount === 1
          ? "1 herë"
          : `${ownerChangeCount} herë`;

  const plateNumber = useMemo(() => {
    const infoChanges = (car?.insurance_v2 as any)?.carInfoChanges;
    if (Array.isArray(infoChanges) && infoChanges.length > 0) {
      const latest = [...infoChanges]
        .reverse()
        .find(
          (change) =>
            change &&
            typeof change.carNo === "string" &&
            change.carNo.trim().length > 0,
        );
      if (latest) {
        return latest.carNo.trim();
      }
    }

    const insuranceCarInfo =
      (car?.details?.insurance as any)?.car_info ||
      (car?.insurance as any)?.car_info;

    if (insuranceCarInfo && typeof insuranceCarInfo === "object") {
      const possible =
        (insuranceCarInfo as any).car_no ??
        (insuranceCarInfo as any).carNo ??
        (insuranceCarInfo as any).license ??
        (insuranceCarInfo as any).plate_no ??
        (insuranceCarInfo as any).plateNo;
      if (typeof possible === "string" && possible.trim().length > 0) {
        return possible.trim();
      }
    }

    return undefined;
  }, [car]);

  const lotDisplay = car?.lot ?? lot ?? "-";

  const engineSpecification = useMemo(() => {
    const displacement = formatEngineDisplacementValue(
      car?.engineDisplacement ?? null,
    );
    if (car?.engineCode && displacement) {
      return `${car.engineCode} • ${displacement}`;
    }
    if (car?.engineCode) return car.engineCode;
    return displacement;
  }, [car?.engineCode, car?.engineDisplacement]);

  const transmissionDisplay = useMemo(() => {
    const translated = translateTransmissionName(car?.transmissionName);
    if (translated) return translated;
    if (
      typeof car?.transmissionName === "string" &&
      car.transmissionName.trim()
    ) {
      return car.transmissionName;
    }
    return undefined;
  }, [car?.transmissionName]);

  const fuelDisplay = useMemo(() => {
    const translated = translateFuelName(car?.fuel);
    if (translated) return translated;
    if (typeof car?.fuel === "string" && car.fuel.trim()) {
      return car.fuel;
    }
    return undefined;
  }, [car?.fuel]);

  const insuranceRegDateDisplay = useMemo(() => {
    const rawDate =
      (car?.insurance_v2 as any)?.regDate ??
      (car?.insurance_v2 as any)?.firstDate ??
      car?.firstRegistration ??
      car?.postedAt;
    return formatDisplayDate(rawDate);
  }, [car?.firstRegistration, car?.insurance_v2, car?.postedAt]);

  const usageHighlights = useMemo(() => {
    const resolveUsageStatus = (
      _keywords: string[],
      sources: Array<
        | string
        | number
        | boolean
        | null
        | undefined
        | string[]
      >,
    ) => {
      let hasPositive = false;
      let hasNegative = false;

      const consider = (input: unknown) => {
        const status = toYesNo(input as any);
        if (status === "Po") {
          hasPositive = true;
        } else if (status === "Jo") {
          hasNegative = true;
        }
      };

      for (const source of sources) {
        if (!source) continue;

        if (Array.isArray(source)) {
          source.forEach(consider);
        } else {
          consider(source);
        }
      }

      if (hasPositive) return "Po";
      if (hasNegative) return "Jo";
      return "Jo";
    };

    const rentalUsageValue = resolveUsageStatus(
      [
        "rent",
        "rental",
        "qira",
        "lease",
        "leasing",
        "임대",
        "렌트",
        "렌터카",
        "임차",
        "대여",
      ],
      [
        car?.details?.insurance?.general_info?.usage_type,
        (car?.insurance_v2 as any)?.usageType,
        (car?.insurance_v2 as any)?.useType,
        (car?.insurance_v2 as any)?.rent,
        (car?.insurance_v2 as any)?.rentCnt,
        (car?.insurance_v2 as any)?.rentHistory,
        (car?.insurance_v2 as any)?.rental,
        car?.insurance_v2?.carInfoUse1s,
        car?.insurance_v2?.carInfoUse2s,
        (car?.details as any)?.usage_type,
      ],
    );

    const commercialUsageValue = resolveUsageStatus(
      [
        "komerc",
        "komercial",
        "commercial",
        "biznes",
        "business",
        "fleet",
        "taxi",
        "영업",
        "영업용",
        "사업",
        "사업용",
        "업무",
        "법인",
      ],
      [
        car?.details?.insurance?.general_info?.usage_type,
        (car?.insurance_v2 as any)?.business,
        (car?.insurance_v2 as any)?.businessCnt,
        (car?.insurance_v2 as any)?.companyUse,
        (car?.insurance_v2 as any)?.government,
        car?.insurance_v2?.carInfoUse1s,
        car?.insurance_v2?.carInfoUse2s,
        (car?.details as any)?.usage_type,
      ],
    );

    return [
      {
        label: "Përdorur si veturë me qira",
        value: rentalUsageValue,
      },
      {
        label: "Përdorur për qëllime komerciale",
        value: commercialUsageValue,
      },
    ];
  }, [car, toYesNo]);

  const specialAccidentHistory = useMemo<SpecialAccidentEntry[]>(() => {
    const entries: SpecialAccidentEntry[] = [];

    const rawHistory = car?.details?.insurance?.special_accident_history;
    if (Array.isArray(rawHistory)) {
      rawHistory.forEach((item: any) => {
        if (!item) return;
        entries.push({
          type: item.type,
          value:
            typeof item.value === "string"
              ? item.value
              : item.value !== undefined && item.value !== null
                ? String(item.value)
                : undefined,
        });
      });
    }

    accidentEntries.forEach((entry) => {
      const valueParts = [
        entry.date && entry.date !== "-" ? `Data: ${entry.date}` : null,
        entry.part && entry.part !== "-" ? `Pjesë: ${entry.part}` : null,
        entry.paint && entry.paint !== "-" ? `Bojë: ${entry.paint}` : null,
        entry.labor && entry.labor !== "-" ? `Punë: ${entry.labor}` : null,
        entry.total && entry.total !== "-" ? `Total: ${entry.total}` : null,
      ].filter(Boolean);

      if (valueParts.length > 0) {
        entries.push({
          type: entry.type || "Ngjarje",
          value: valueParts.join(" • "),
        });
      }
    });

    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = `${entry.type ?? ""}-${entry.value ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [accidentEntries, car]);

  const specialAccidentStats = useMemo(() => {
    const floodSource =
      typeof car?.insurance_v2?.floodTotalLossCnt === "number"
        ? car.insurance_v2.floodTotalLossCnt
        : insuranceCarInfo?.flood_damage;

    const totalLossSource =
      typeof car?.insurance_v2?.totalLossCnt === "number"
        ? car.insurance_v2.totalLossCnt
        : insuranceCarInfo?.total_loss;

    const accidentCountSource =
      typeof car?.insurance_v2?.accidentCnt === "number"
        ? car.insurance_v2.accidentCnt
        : insuranceCarInfo?.accident_history;

    const floodValue =
      typeof floodSource === "number"
        ? floodSource > 0
          ? "Po"
          : "Jo"
        : floodSource
          ? (toYesNo(floodSource as any) ??
            processFloodDamageText(String(floodSource)))
          : "Nuk ka informata";

    const totalLossValue =
      typeof totalLossSource === "number"
        ? totalLossSource > 0
          ? "Po"
          : "Jo"
        : totalLossSource !== undefined
          ? (toYesNo(totalLossSource as any) ?? `${totalLossSource}`)
          : "Nuk ka informata";

    const accidentCountValue =
      accidentCountSource !== undefined &&
      accidentCountSource !== null &&
      accidentCountSource !== ""
        ? `${accidentCountSource}`
        : "Nuk ka informata";

    return [
      {
        label: "Vërshuar?",
        value: floodValue,
      },
      {
        label: "Humbje totale?",
        value: totalLossValue,
      },
      {
        label: "Aksidente të raportuara",
        value: accidentCountValue,
      },
      {
        label: "Pronaret e ndërruar",
        value: ownerChangesDisplay,
      },
    ];
  }, [
    car,
    insuranceCarInfo,
    ownerChangesDisplay,
    processFloodDamageText,
    toYesNo,
  ]);

  const handleContactWhatsApp = useCallback(() => {
    if (!car) return;
    const messageParts = [
      "Përshëndetje! Jam i interesuar për raportin e inspektimit",
      car.year ? `${car.year}` : "",
      car.make ?? "",
      car.model ?? "",
      car.lot ? `(Kodi ${car.lot})` : "",
      "- a mund të më dërgoni më shumë informacione?",
    ]
      .filter(Boolean)
      .join(" ");
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(messageParts)}`;
    window.open(whatsappUrl, "_blank");
  }, [car]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Po ngarkohet raporti i inspektimit...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-lg shadow-lg">
          <CardHeader className="flex flex-col items-center text-center gap-2">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Nuk u arrit të ngarkohej raporti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-muted-foreground">
            <p>{error}</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Kthehu mbrapa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!car) {
    return null;
  }

  const carName =
    `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim();
  const formattedPrice = car.priceEUR
    ? `${car.priceEUR.toLocaleString("de-DE")} €`
    : undefined;
  const formattedMileage = car.mileageKm
    ? formatMileage(car.mileageKm)
    : car.odometer?.km
      ? formatMileage(car.odometer.km)
      : undefined;

  // Removed Posted At display per request

  const firstRegistrationDisplay = formatDisplayDate(
    car.firstRegistration ||
      car.details?.first_registration ||
      car.details?.registration_date ||
      car.insurance_v2?.firstDate,
    { monthYear: true },
  );

  const engineSource =
    car.engineDisplacement ||
    car.details?.engine_volume ||
    car.details?.engine?.displacement ||
    car.details?.engine_capacity ||
    car.insurance_v2?.displacement;

  const displacementDisplay = formatEngineDisplacementValue(engineSource);
  const engineDisplay =
    (car.engineCode && displacementDisplay
      ? `${car.engineCode} • ${displacementDisplay}`
      : car.engineCode ?? displacementDisplay) ?? null;

  const fuelSource =
    car.fuel ||
    car.details?.fuel_type ||
    car.details?.fuel?.name ||
    car.insurance_v2?.fuel ||
    car.details?.specs?.fuel;

  const rawFuelDisplay =
    typeof fuelSource === "string" && fuelSource.trim()
      ? fuelSource.trim()
      : fuelSource ?? null;
  const fuelDisplay =
    translateFuelName(rawFuelDisplay) ??
    (typeof rawFuelDisplay === "string" && rawFuelDisplay
      ? rawFuelDisplay.charAt(0).toUpperCase() + rawFuelDisplay.slice(1)
      : null);

  const transmissionDisplay =
    translateTransmissionName(car.transmissionName) ??
    (typeof car.transmissionName === "string" &&
    car.transmissionName.trim()
      ? car.transmissionName.trim()
      : null);

  const mileageDisplay = formattedMileage || "-";

  const generalStatusItems = useMemo(() => {
    const items: { label: string; value: string }[] = [];

    const odometerStatus = translateOdometerStatus(
      car?.odometer?.status?.name,
    );
    if (odometerStatus) {
      items.push({
        label: "Gjendja e odometrit",
        value: odometerStatus,
      });
    }

    if (mileageDisplay && mileageDisplay !== "-") {
      items.push({
        label: "Kilometrazhi aktual",
        value: mileageDisplay,
      });
    }

    if (plateNumber) {
      items.push({
        label: "Targa e regjistruar",
        value: plateNumber,
      });
    }

    if (car?.vin) {
      items.push({
        label: "VIN",
        value: car.vin,
      });
    }

    if (transmissionDisplay) {
      items.push({
        label: "Transmisioni",
        value: transmissionDisplay,
      });
    }

    if (engineDisplay) {
      items.push({
        label: "Motori",
        value: engineDisplay,
      });
    }

    if (fuelDisplay) {
      items.push({
        label: "Karburanti",
        value: fuelDisplay,
      });
    }

    if (ownerChangesDisplay && ownerChangesDisplay !== "-") {
      items.push({
        label: "Ndërrime pronari",
        value: ownerChangesDisplay,
      });
    }

    if (insuranceRegDateDisplay) {
      items.push({
        label: "Data e raportit të sigurimit",
        value: insuranceRegDateDisplay,
      });
    }

    const loanStatus = toYesNo((car?.insurance_v2 as any)?.loan);
    if (loanStatus) {
      items.push({
        label: "Pengesë financiare",
        value: loanStatus === "Po" ? "Po" : "Jo",
      });
    }

    const historyHasRecall = Array.isArray(car?.details?.history)
      ? (car?.details?.history as any[]).some((entry) =>
          Array.isArray(entry?.content) &&
          entry.content.some(
            (item: any) =>
              typeof item?.flag === "string" &&
              item.flag.toLowerCase().includes("recall"),
          ),
        )
      : false;

    if (historyHasRecall) {
      items.push({
        label: "Thirrje për rikujtesë",
        value: "Po (raportuar)",
      });
    }

    usageHighlights.forEach((highlight) => {
      if (highlight.value) {
        items.push({
          label: highlight.label,
          value: highlight.value,
        });
      }
    });

    return items;
  }, [
    car,
    engineDisplay,
    fuelDisplay,
    insuranceRegDateDisplay,
    mileageDisplay,
    ownerChangesDisplay,
    plateNumber,
    toYesNo,
    transmissionDisplay,
    usageHighlights,
  ]);

  const accidentOverviewItems = useMemo(() => {
    const summarySource =
      car?.inspect?.accident_summary ??
      (car?.details?.inspect as any)?.accident_summary ??
      (car?.details?.inspect as any)?.accidentSummary;

    const entries: Array<{ label: string; value: string; negative?: boolean }> =
      [];

    const resolveValue = (value: unknown) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return "-";
        const normalized = trimmed.toLowerCase();
        if (normalized === "yes") return "Po";
        if (normalized === "no") return "Jo";
        return translateStatusValue(trimmed);
      }
      const yesNo = toYesNo(value as any);
      if (yesNo) return yesNo;
      if (typeof value === "number") return value.toString();
      return value ? String(value) : "-";
    };

    const pushEntry = (label: string, rawValue: unknown) => {
      const value = resolveValue(rawValue);
      entries.push({
        label,
        value,
        negative:
          value === "Po" ||
          value === "Po (raportuar)" ||
          (typeof rawValue === "number" && rawValue > 0),
      });
    };

    if (summarySource && typeof summarySource === "object") {
      const labelMap: Record<string, string> = {
        accident: "Aksidentet",
        "simple repair": "Riparime të thjeshta",
        simple_repair: "Riparime të thjeshta",
        main_framework: "Korniza kryesore",
        "main framework": "Korniza kryesore",
        exterior1rank: "Vlerësimi i jashtëm 1",
        exterior2rank: "Vlerësimi i jashtëm 2",
      };

      Object.entries(summarySource as Record<string, unknown>).forEach(
        ([key, value]) => {
          const normalizedKey = key.toLowerCase();
          const label =
            labelMap[normalizedKey] ||
            key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase());
          pushEntry(label, value);
        },
      );
      return entries;
    }

    if (typeof car?.insurance_v2?.accidentCnt === "number") {
      pushEntry(
        "Aksidente të raportuara",
        car.insurance_v2.accidentCnt,
      );
    }

    if (typeof car?.insurance_v2?.totalLossCnt === "number") {
      pushEntry("Humbje totale", car.insurance_v2.totalLossCnt);
    }

    if (typeof car?.insurance_v2?.floodTotalLossCnt === "number") {
      pushEntry("Dëmtime nga përmbytjet", car.insurance_v2.floodTotalLossCnt);
    }

    if (entries.length === 0) {
      entries.push({
        label: "Informacioni mbi aksidentet",
        value: "Nuk raportohet",
      });
    }

    return entries;
  }, [car, toYesNo]);

  const mechanicalSections = useMemo(() => {
    if (!inspectionInnerData) return [];

    const categories: Record<
      string,
      {
        title: string;
        items: Array<{ label: string; value: string; positive: boolean }>;
      }
    > = {
      engine: {
        title: "Motori dhe furnizimi me karburant",
        items: [],
      },
      transmission: {
        title: "Transmisioni",
        items: [],
      },
      drivetrain: {
        title: "Treni lëvizës",
        items: [],
      },
      steering: {
        title: "Sistemi i drejtimit",
        items: [],
      },
      brakes: {
        title: "Sistemi i frenimit",
        items: [],
      },
      electrical: {
        title: "Sistemi elektrik",
        items: [],
      },
      diagnostics: {
        title: "Diagnoza dhe vetëkontrolli",
        items: [],
      },
      other: {
        title: "Komponentë të tjerë",
        items: [],
      },
    };

    const categorize = (key: string) => {
      const normalized = key.toLowerCase();
      if (
        normalized.includes("motor") ||
        normalized.includes("engine") ||
        normalized.includes("fuel") ||
        normalized.includes("oil") ||
        normalized.includes("cool")
      ) {
        return "engine";
      }
      if (normalized.includes("trans")) {
        return "transmission";
      }
      if (
        normalized.includes("differential") ||
        normalized.includes("velocity") ||
        normalized.includes("joint")
      ) {
        return "drivetrain";
      }
      if (normalized.includes("steering")) {
        return "steering";
      }
      if (normalized.includes("brake")) {
        return "brakes";
      }
      if (
        normalized.includes("electric") ||
        normalized.includes("generator") ||
        normalized.includes("wiper") ||
        normalized.includes("window")
      ) {
        return "electrical";
      }
      if (normalized.includes("self_check")) {
        return "diagnostics";
      }
      return "other";
    };

    Object.entries(inspectionInnerData).forEach(([key, value]) => {
      const categoryKey = categorize(key);
      const label = formatKeyLabel(key);
      const translatedValue = translateStatusValue(value);
      const positive = isPositiveStatus(value);
      categories[categoryKey].items.push({
        label,
        value: translatedValue,
        positive,
      });
    });

    return Object.values(categories).filter(
      (category) => category.items.length > 0,
    );
  }, [inspectionInnerData]);

  const inspectionPhotos = useMemo(() => {
    if (!lotDisplay || lotDisplay === "-") return [];
    const sanitizedLot = lotDisplay.trim();
    return [
      {
        label: "Pamja e përparme",
        url: `https://ci.encar.com/carsdata/cars/inspection/${sanitizedLot}_photoFront.jpg`,
        alt: "Foto e përparme e inspektimit",
      },
      {
        label: "Pamja e pasme",
        url: `https://ci.encar.com/carsdata/cars/inspection/${sanitizedLot}_photoBack.jpg`,
        alt: "Foto e pasme e inspektimit",
      },
    ];
  }, [lotDisplay]);

  const inspectionDateDisplay =
    formatDisplayDate(
      (car?.details as any)?.inspect_date ??
        (car?.details as any)?.inspect?.date ??
        (car?.details as any)?.inspect?.created_at ??
        (car?.insurance_v2 as any)?.regDate ??
        car?.firstRegistration,
    ) ?? insuranceRegDateDisplay;

  const performanceRecordItems = useMemo(
    () =>
      [
        {
          label: "Transmisioni",
          value: transmissionDisplay ?? "-",
        },
        {
          label: "Karburanti",
          value: fuelDisplay ?? "-",
        },
        {
          label: "Specifikimi i motorit",
          value: engineDisplay ?? "-",
        },
        {
          label: "Data e raportit të performancës",
          value: inspectionDateDisplay ?? "-",
        },
      ].filter((item) => item.value && item.value !== "-"),
    [engineDisplay, fuelDisplay, inspectionDateDisplay, transmissionDisplay],
  );

  const topVehicleInfo = [
    { label: "Vetura", value: carName || car.title || "-" },
    { label: "Regjistrimi i parë", value: firstRegistrationDisplay ?? "-" },
    { label: "Numri i shasisë", value: car.vin || "-" },
    { label: "Karburanti", value: fuelDisplay || "-" },
    { label: "Kilometra", value: mileageDisplay },
  ];

  const generalVehicleInfo = [
    { label: "Prodhuesi", value: car.make || "-" },
    { label: "Modeli", value: car.model || "-" },
    { label: "Regjistrimi i parë", value: firstRegistrationDisplay ?? "-" },
    { label: "Karburanti", value: fuelDisplay || "-" },
    { label: "Motorri", value: engineDisplay || "-" },
    { label: "Pronaret e ndërruar", value: ownerChangesDisplay },
  ];

  const accidentBadgeCount =
    typeof car.insurance_v2?.accidentCnt === "number"
      ? car.insurance_v2.accidentCnt
      : accidentEntries.length;

  const heroImageSrc = car.image || "/placeholder.svg";

  const quickStats: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    highlight?: boolean;
  }> = [
    {
      label: "Kilometrazhi",
      value: mileageDisplay,
      icon: Gauge,
    },
    {
      label: "Aksidente",
      value: `${accidentBadgeCount}`,
      icon: AlertTriangle,
      highlight: accidentBadgeCount > 0,
    },
    {
      label: "Ndërrime pronari",
      value: ownerChangesDisplay,
      icon: Users,
    },
    {
      label: "Regjistrimi i parë",
      value: firstRegistrationDisplay ?? "-",
      icon: Clock,
    },
  ];

  const vehicleSubtitle =
    car.title &&
    carName &&
    car.title.trim().toLowerCase() !== carName.toLowerCase()
      ? car.title
      : undefined;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="bg-muted/30 border-b border-border">
          <div className="container-responsive py-3 flex flex-col gap-2 items-start text-left">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => openCarDetailsInNewTab(car.lot || lot)}
              >
                <ArrowLeft className="h-4 w-4" />
                Kthehu te makina
              </Button>
              <Badge variant="secondary" className="text-sm">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Raporti i Inspektimit
              </Badge>
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {carName || car.title || "Raporti i Automjetit"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {(car.year || plateNumber) && (
                    <span className="font-semibold">
                      {car.year ? `Viti ${car.year}` : ""}
                      {car.year && plateNumber ? ", " : ""}
                      {plateNumber ? `Targa ${plateNumber}` : ""}
                    </span>
                  )}
                  {lotDisplay && lotDisplay !== "-" && (
                    <>
                      {(car.year || plateNumber) && (
                        <span className="hidden sm:inline">•</span>
                      )}
                      <span>Numri i lotit {lotDisplay}</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-start gap-2 text-sm text-muted-foreground text-left">
                  <span>
                    Raport i detajuar i inspektimit dhe historisë së automjetit
                  </span>
                  {car.location?.name && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {car.location.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
          </div>
        </div>

      <div className="container-responsive py-3 md:py-5">
        <Card className="overflow-hidden border border-border/70 bg-background/95 shadow-lg">
          <div className="grid gap-0 md:grid-cols-[minmax(0,320px),1fr]">
            <div className="relative h-full bg-muted">
              <img
                src={heroImageSrc}
                alt={`Foto e ${carName || car.title || "automjetit"}`}
                className="h-full w-full object-cover max-h-[260px] md:max-h-none"
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.svg";
                }}
              />
              {car.sourceLabel && (
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 bg-background/80 text-foreground shadow"
                >
                  {car.sourceLabel}
                </Badge>
              )}
              {accidentBadgeCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute bottom-3 left-3 shadow"
                >
                  {accidentBadgeCount} aksidente
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-4 p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 text-left">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {carName || car.title || "Raporti i Automjetit"}
                  </h2>
                  {vehicleSubtitle && (
                    <p className="text-sm text-muted-foreground">
                      {vehicleSubtitle}
                    </p>
                  )}
                  {car.grade && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Shield className="h-3.5 w-3.5" />
                      Grade IAAI: {car.grade}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {formattedPrice && (
                    <Badge
                      variant="outline"
                      className="text-base font-semibold px-3 py-1"
                    >
                      {formattedPrice}
                    </Badge>
                  )}
                  {car.lot && (
                    <Badge
                      variant="secondary"
                      className="text-xs uppercase tracking-wide"
                    >
                      Kodi: {car.lot}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                {quickStats.map(({ label, value, icon: Icon, highlight }) => (
                  <div
                    key={label}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left ${
                      highlight
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border/60 bg-muted/40"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        highlight
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          highlight ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {car.vin && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-mono text-xs">
                    <FileText className="h-3.5 w-3.5 opacity-70" />
                    {car.vin}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

        <div className="container-responsive py-2 md:py-4 space-y-3 md:space-y-4">
          <Tabs defaultValue="diagram" className="space-y-2 md:space-y-3">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 md:gap-1.5 bg-muted/60 backdrop-blur-sm p-1 md:p-1.5 rounded-2xl h-auto">
              <TabsTrigger
                value="diagram"
                className="flex w-full items-center justify-start gap-1.5 rounded-xl border border-transparent bg-transparent px-2.5 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:border-border/50 hover:bg-background/40 data-[state=active]:border-primary/40 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:px-3.5 md:py-2.5 md:text-xs lg:text-sm"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span>Diagrami i Inspektimit</span>
              </TabsTrigger>
              <TabsTrigger
                value="exterior"
                className="flex w-full items-center justify-start gap-1.5 rounded-xl border border-transparent bg-transparent px-2.5 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:border-border/50 hover:bg-background/40 data-[state=active]:border-primary/40 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:px-3.5 md:py-2.5 md:text-xs lg:text-sm"
              >
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Gjendja e Jashtme</span>
              </TabsTrigger>
              <TabsTrigger
                value="insurance"
                className="flex w-full items-center justify-start gap-1.5 rounded-xl border border-transparent bg-transparent px-2.5 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:border-border/50 hover:bg-background/40 data-[state=active]:border-primary/40 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:px-3.5 md:py-2.5 md:text-xs lg:text-sm"
              >
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span>Historia e Sigurimit</span>
              </TabsTrigger>
              <TabsTrigger
                value="options"
                className="flex w-full items-center justify-start gap-1.5 rounded-xl border border-transparent bg-transparent px-2.5 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:border-border/50 hover:bg-background/40 data-[state=active]:border-primary/40 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:px-3.5 md:py-2.5 md:text-xs lg:text-sm"
              >
                <Cog className="h-4 w-4 text-primary" />
                <span>Pajisjet & Opsionet</span>
              </TabsTrigger>
              <TabsTrigger
                value="warranty"
                className="flex w-full items-center justify-start gap-1.5 rounded-xl border border-transparent bg-transparent px-2.5 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-all duration-200 hover:border-border/50 hover:bg-background/40 data-[state=active]:border-primary/40 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:px-3.5 md:py-2.5 md:text-xs lg:text-sm"
              >
                <Shield className="h-4 w-4 text-primary" />
                <span>Garancioni</span>
              </TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="space-y-4 md:space-y-5">
            <Card className="border border-primary/20 bg-primary/5 backdrop-blur-sm shadow-sm">
              <CardContent className="px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      <Wrench className="h-3.5 w-3.5" />
                      Përmbledhja e kontrollit
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {inspectionIssueSummary.total > 0
                        ? `${inspectionIssueSummary.total} zona të kontrolluara në raportin zyrtar korean të inspektimit.`
                        : "Të dhënat e jashtme të inspektimit nuk janë të disponueshme për këtë automjet."}
                    </p>
                  </div>
                  {inspectionIssueSummary.total > 0 && (
                    <div className="flex flex-col gap-3 lg:items-end lg:text-right">
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="rounded-xl border border-primary/30 bg-background/80 px-3 py-2 sm:px-4">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Ndërrime (N)
                          </span>
                          <p className="text-lg font-bold text-[#E53935]">
                            {inspectionIssueSummary.replacements}
                          </p>
                        </div>
                        <div className="rounded-xl border border-primary/30 bg-background/80 px-3 py-2 sm:px-4">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Riparime (R)
                          </span>
                          <p className="text-lg font-bold text-[#D84315]">
                            {inspectionIssueSummary.repairs}
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 dark:bg-emerald-500/10 px-3 py-2 sm:px-4">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Zona pa shenja
                          </span>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {inspectionIssueSummary.unaffected}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] md:text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E53935] text-xs font-bold text-white shadow-sm">
                            N
                          </span>
                          <span>Ndërrim i panelit</span>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D84315] text-xs font-bold text-white shadow-sm">
                            R
                          </span>
                          <span>Riparim / saldim</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/80">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <CardTitle className="text-base md:text-xl">
                    Regjistri i inspektimit
                  </CardTitle>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Informacioni përbërës nga raporti koreano-zyrtar i performancës
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Regjistri i performancës
                    </h4>
                    {performanceRecordItems.length > 0 ? (
                      <ul className="space-y-1.5 text-sm">
                        {performanceRecordItems.map((item) => (
                          <li
                            key={`${item.label}-${item.value}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                          >
                            <span className="text-muted-foreground">
                              {item.label}
                            </span>
                            <span className="font-semibold text-foreground">
                              {item.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nuk ka të dhëna të regjistrit të performancës.
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gjendja e automjetit
                    </h4>
                    {generalStatusItems.length > 0 ? (
                      <ul className="space-y-1.5 text-sm">
                        {generalStatusItems.map((item) => (
                          <li
                            key={`${item.label}-${item.value}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                          >
                            <span className="text-muted-foreground">
                              {item.label}
                            </span>
                            <span className="font-semibold text-foreground">
                              {item.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nuk ka informacion shtesë mbi gjendjen.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/80 overflow-hidden">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <CardTitle className="text-base md:text-xl">
                    Diagrami i inspektimit
                  </CardTitle>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Vizualizim i zonave me ndërhyrje të raportuara gjatë kontrollit
                </p>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <InspectionDiagramPanel
                  outerInspectionData={inspectionOuterData}
                />
              </CardContent>
            </Card>

            {mechanicalSections.length > 0 && (
              <Card className="shadow-sm border-border/80">
                <CardHeader className="pb-3 md:pb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Cog className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <CardTitle className="text-base md:text-xl">
                      Raporti i sistemit mekanik
                    </CardTitle>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Gjendja e detajuar e komponentëve kryesorë të automjetit
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mechanicalSections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                        {section.title}
                      </h4>
                      <ul className="space-y-1.5">
                        {section.items.map((item) => (
                          <li
                            key={`${section.title}-${item.label}`}
                            className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                          >
                            <span
                              className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                                item.positive ? "bg-emerald-500" : "bg-destructive"
                              }`}
                            />
                            <span className="flex-1 text-muted-foreground">
                              {item.label}
                            </span>
                            <span
                              className={`font-semibold ${
                                item.positive ? "text-emerald-600" : "text-destructive"
                              }`}
                            >
                              {item.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm border-border/80">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <CardTitle className="text-base md:text-xl">
                    Përmbledhje e aksidenteve
                  </CardTitle>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Statistika të raportuara në sigurim dhe në kontrollin fizik
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm">
                  {accidentOverviewItems.map((item) => (
                    <li
                      key={`${item.label}-${item.value}`}
                      className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                    >
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          item.negative ? "bg-destructive" : "bg-emerald-500"
                        }`}
                      />
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {item.label}
                        </span>
                        <span
                          className={`font-semibold ${
                            item.negative ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {item.value}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {specialAccidentStats.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {specialAccidentStats.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                      >
                        <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-base font-semibold text-foreground">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {inspectionPhotos.length > 0 && (
              <Card className="shadow-sm border-border/80">
                <CardHeader className="pb-3 md:pb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Image className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <CardTitle className="text-base md:text-xl">
                      Fotografitë nga inspektimi
                    </CardTitle>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Momente kyçe gjatë procesit të kontrollit teknik
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {inspectionPhotos.map((photo) => (
                      <figure
                        key={photo.url}
                        className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-2"
                      >
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          className="h-full w-full rounded-md object-cover"
                          loading="lazy"
                        />
                        <figcaption className="text-xs text-muted-foreground">
                          {photo.label}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-dashed border-border/70 bg-muted/10 shadow-sm">
              <CardContent className="space-y-2 p-4 md:p-6 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Ky raport bazohet në të dhënat zyrtare të kontrollit koreano të
                  siguruara nga partneri ynë. Informacioni përditësohet automatikisht
                  sapo publikohet nga sigurimet ose qendrat e inspektimit.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                  <span>Data e raportit: {inspectionDateDisplay ?? "-"}</span>
                  <span>Burimi: Encar / sigurimet lokale</span>
                  {lotDisplay && lotDisplay !== "-" && (
                    <span>Lot: {lotDisplay}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vlerat e paraqitura shërbejnë për informim. Korauto nuk mban përgjegjësi
                  për ndryshimet pas datës së raportimit ose për pasaktësi të deklaruara nga palë të treta.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance History & Mechanical System Tab */}
          <TabsContent value="insurance" className="space-y-4">
            <Card className="shadow-md border-border/80">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <CardTitle className="text-base md:text-xl">
                    Historia e Sigurimit dhe Aksidenteve
                  </CardTitle>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Të dhëna të plota nga kompania e sigurimit dhe historia e
                  aksidenteve
                </p>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-6">
                {/* Insurance Summary Stats */}
                {car.insurance_v2 &&
                Object.keys(car.insurance_v2).length > 0 ? (
                  <div className="grid gap-2 grid-cols-2 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-0.5 md:gap-1 rounded-lg border border-border/60 bg-muted/40 p-2 md:p-3">
                      <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                        Aksidente
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-destructive">
                        {car.insurance_v2.accidentCnt || 0}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1 rounded-lg border border-border/60 bg-muted/40 p-2 md:p-3">
                      <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                        Ndërrimi i Pronarëve
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-foreground">
                        {car.insurance_v2.ownerChangeCnt || 0}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1 rounded-lg border border-border/60 bg-muted/40 p-2 md:p-3">
                      <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                        Humbje Totale
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-foreground">
                        {car.insurance_v2.totalLossCnt || 0}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1 rounded-lg border border-border/60 bg-muted/40 p-2 md:p-3">
                      <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                        Vjedhje
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-foreground">
                        {car.insurance_v2.robberCnt || 0}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Detailed Accident History */}
                {car.insurance_v2?.accidents &&
                  car.insurance_v2.accidents.length > 0 && (
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-base md:text-lg font-semibold text-foreground">
                        Detajet e Aksidenteve
                      </h3>
                      <div className="space-y-2 md:space-y-3">
                        {car.insurance_v2.accidents.map(
                          (accident: any, idx: number) => (
                            <Card
                              key={idx}
                              className="border-l-4 border-l-destructive"
                            >
                              <CardContent className="p-2.5 md:p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3 mb-2 md:mb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                                    <span className="text-sm md:text-base font-semibold">
                                      {accident.date || "Data e panjohur"}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-xs"
                                  >
                                    Tipi:{" "}
                                    {accident.type === "2"
                                      ? "Dëmtimi i vet"
                                      : accident.type === "3"
                                        ? "Dëmtim nga tjeri"
                                        : `Tipi ${accident.type}`}
                                  </Badge>
                                </div>
                                <div className="grid gap-1.5 md:gap-2 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground">
                                      Shpenzimi Total
                                    </span>
                                    <span className="text-sm md:text-base font-bold text-destructive">
                                      {Math.round(
                                        convertKRWtoEUR(
                                          accident.insuranceBenefit || 0,
                                        ),
                                      ).toLocaleString()}
                                      €
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground">
                                      Punë
                                    </span>
                                    <span className="text-sm md:text-base font-semibold">
                                      {Math.round(
                                        convertKRWtoEUR(
                                          accident.laborCost || 0,
                                        ),
                                      ).toLocaleString()}
                                      €
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground">
                                      Lyerje
                                    </span>
                                    <span className="text-sm md:text-base font-semibold">
                                      {Math.round(
                                        convertKRWtoEUR(
                                          accident.paintingCost || 0,
                                        ),
                                      ).toLocaleString()}
                                      €
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 md:gap-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground">
                                      Pjesë
                                    </span>
                                    <span className="text-sm md:text-base font-semibold">
                                      {Math.round(
                                        convertKRWtoEUR(accident.partCost || 0),
                                      ).toLocaleString()}
                                      €
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Car Info Changes (License Plate Changes) */}
                {car.insurance_v2?.carInfoChanges &&
                  car.insurance_v2.carInfoChanges.length > 0 && (
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-base md:text-lg font-semibold text-foreground">
                        Ndryshimet e Informacionit të Makinës
                      </h3>
                      <div className="space-y-1.5 md:space-y-2">
                        {car.insurance_v2.carInfoChanges.map(
                          (change: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 md:p-3 rounded-lg border border-border/60 bg-muted/30"
                            >
                              <span className="text-sm md:text-base font-mono font-semibold">
                                {change.carNo || "N/A"}
                              </span>
                              <span className="text-xs md:text-sm text-muted-foreground">
                                {change.date || "Data e panjohur"}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {(!car.insurance_v2 ||
                  Object.keys(car.insurance_v2).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Nuk ka informata për historinë e sigurimit</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance History */}
            {car.maintenanceHistory && car.maintenanceHistory.length > 0 && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Historia e Mirëmbajtjes
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Shërbimet dhe mirëmbajtjet e regjistruara për automjetin
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {car.maintenanceHistory.map((record: any, index: number) => (
                    <Card
                      key={index}
                      className="border border-border/60 bg-muted/40"
                    >
                      <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
                        <div className="flex flex-wrap justify-between gap-2">
                          <div className="font-semibold text-foreground">
                            {record.service_type ||
                              record.type ||
                              "Shërbim i përgjithshëm"}
                          </div>
                          {record.date && (
                            <Badge variant="outline" className="text-xs">
                              {record.date}
                            </Badge>
                          )}
                        </div>
                        {record.description && <p>{record.description}</p>}
                        {record.mileage && (
                          <p className="text-xs">
                            Kilometrazh:{" "}
                            <span className="font-medium">
                              {record.mileage}
                            </span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Special Accident History - Moved from Exterior Tab */}
            {(specialAccidentStats.length > 0 || insuranceCarInfo) && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Detajet e Aksidenteve dhe Dëmtimeve
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Informacion i detajuar për aksidentet dhe dëmtimet e
                    regjistruara
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {specialAccidentStats.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {specialAccidentStats.map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-gradient-to-br from-muted/50 to-muted/30 p-3"
                        >
                          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            {item.label}
                          </span>
                          <span className="text-base font-bold text-foreground">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {specialAccidentHistory.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Kronologjia e Aksidenteve
                      </h4>
                      {specialAccidentHistory.map((entry, index) => (
                        <div
                          key={`${entry?.type || "event"}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/60 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                        >
                          <span className="font-medium text-foreground">
                            {entry?.type || "Ngjarje"}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {entry?.value || "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {insuranceCarInfo && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        Përmbledhje Sigurimi
                      </h4>
                      {[
                        {
                          label: "Historia e aksidenteve",
                          value: insuranceCarInfo.accident_history,
                        },
                        {
                          label: "Riparime të regjistruara",
                          value: insuranceCarInfo.repair_count,
                        },
                        {
                          label: "Humbje totale",
                          value: insuranceCarInfo.total_loss,
                        },
                        {
                          label: "Dëmtime nga uji",
                          value: insuranceCarInfo.flood_damage
                            ? processFloodDamageText(
                                String(insuranceCarInfo.flood_damage),
                              )
                            : undefined,
                        },
                      ]
                        .filter((item) => item.value)
                        .map((item) => (
                          <div
                            key={item.label}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-gradient-to-r from-background/80 to-background/60 px-4 py-3 text-sm"
                          >
                            <span className="font-semibold text-foreground">
                              {item.label}
                            </span>
                            <span className="text-muted-foreground font-medium">
                              {String(item.value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Options & Equipment Tab */}
          <TabsContent value="options" className="space-y-4">
            <Card className="shadow-md border-border/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Cog className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">
                    Pajisjet dhe Opsionet
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lista e plotë e pajisjeve standarde dhe opsionale
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Extra Options with Details */}
                {car.details?.options_extra &&
                  car.details.options_extra.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <h3 className="text-base font-semibold text-foreground">
                          Opsione Shtesë me Çmim
                        </h3>
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {car.details.options_extra.length} opsione
                        </span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                        {car.details.options_extra.map(
                          (option: any, idx: number) => {
                            const translatedName =
                              getOptionName(option.code) !== option.code
                                ? getOptionName(option.code)
                                : option.name || option.name_original;
                            const priceKRW = option.price || 0;
                            const priceInEur = Math.round(
                              convertKRWtoEUR(priceKRW),
                            );

                            return (
                              <Card key={idx} className="border-primary/20">
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-base">
                                        {translatedName}
                                      </h4>
                                      {option.name_original &&
                                        translatedName !==
                                          option.name_original && (
                                          <p className="text-xs text-muted-foreground">
                                            {option.name_original}
                                          </p>
                                        )}
                                    </div>
                                    {priceInEur > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-sm font-bold"
                                      >
                                        {priceInEur.toLocaleString()}€
                                      </Badge>
                                    )}
                                  </div>
                                  {(getOptionDescription(option.code) ||
                                    option.description) && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {getOptionDescription(option.code) ||
                                        option.description}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                {/* Standard Options */}
                {car.details?.options?.standard &&
                  Array.isArray(car.details.options.standard) &&
                  car.details.options.standard.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <h3 className="text-base font-semibold text-foreground">
                          Pajisje Standarde
                        </h3>
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {car.details.options.standard.length} pajisje
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {(showAllStandard
                          ? car.details.options.standard
                          : car.details.options.standard.slice(0, 6)
                        ).map((optionCode: string, idx: number) => {
                          const displayName = getOptionName(optionCode);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span className="text-xs text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                                {displayName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {car.details.options.standard.length > 6 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllStandard(!showAllStandard)}
                            className="h-9 px-4 text-sm text-primary hover:bg-primary/10 font-medium border-primary/30"
                          >
                            {showAllStandard
                              ? `Më pak`
                              : `Shfaq të gjitha (${car.details.options.standard.length - 6} më shumë)`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                {/* Choice Options */}
                {car.details?.options?.choice &&
                  Array.isArray(car.details.options.choice) &&
                  car.details.options.choice.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <h3 className="text-base font-semibold text-foreground">
                          Opsione të Zgjedhura
                        </h3>
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {car.details.options.choice.length} opsione
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {(showAllChoice
                          ? car.details.options.choice
                          : car.details.options.choice.slice(0, 6)
                        ).map((optionCode: string, idx: number) => {
                          const displayName = getOptionName(optionCode);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 bg-accent/5 border border-accent/20 rounded-md hover:bg-accent/10 hover:border-accent/30 transition-all duration-200 group"
                            >
                              <Cog className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                              <span className="text-xs text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-1">
                                {displayName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {car.details.options.choice.length > 6 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllChoice(!showAllChoice)}
                            className="h-9 px-4 text-sm text-accent hover:bg-accent/10 font-medium border-accent/30"
                          >
                            {showAllChoice
                              ? `Më pak`
                              : `Shfaq të gjitha (${car.details.options.choice.length - 6} më shumë)`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                {(!car.details?.options_extra ||
                  car.details.options_extra.length === 0) &&
                  (!car.details?.options?.standard ||
                    car.details.options.standard.length === 0) &&
                  (!car.details?.options?.choice ||
                    car.details.options.choice.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Cog className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Nuk ka informata për pajisjet dhe opsionet</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warranty" className="space-y-4">
            <Card className="shadow-md border-border/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Garancioni KORAUTO</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Përmbledhje e mbulimit të garancionit për automjetet tona
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Nëse pas inspektimit në Kosovë automjeti rezulton me defekte
                  në aksident ne pjesen e jashtme dhe brendshme motor,
                  transmision apo manipulim kilometrazhi , shitësi mban
                  përgjegjësi. Për pjesët harxhueshme nuk ofrohet garanci dhe
                  nuk mbahet përgjegjësi.
                </p>

                <p>Pjesët e Mbulueshme dhe të Përjashtuara nga Garancia</p>

                <h3 className="font-semibold text-foreground">
                  I. Pjesë të Pa-Konsumueshme (të mbuluara nga garancia)
                </h3>
                <p>
                  Këto pjesë mbulohen vetëm në rast defekti të brendshëm teknik,
                  jo konsum normal:
                </p>
                <p>- Motori (blloku, koka e cilindrit, pistonët, boshtet)</p>
                <p>
                  - Transmisioni (manual ose automatik, përjashtuar clutch &
                  flywheel)
                </p>
                <p>- Diferenciali dhe boshtet e fuqisë</p>
                <p>- ECU, alternatori, starteri</p>
                <p>- Kompresori i AC, kondensatori, avulluesi</p>
                <p>- Airbagët, rripat e sigurimit</p>
                <p>- Struktura e karrocerisë dhe shasia</p>

                <h3 className="font-semibold text-foreground">
                  II. Pjesë të Konsumueshme (të përjashtuara nga garancia)
                </h3>
                <p>
                  Të gjitha pjesët e mëposhtme janë konsumueshme dhe
                  përjashtohen nga garancia:
                </p>

                <p>• Debrisi dhe pjesët përreth:</p>
                <p> - Disku i debrisit</p>
                <p> - Pllaka e presionit</p>
                <p> - Rulllja e lirimit (release bearing)</p>
                <p> - Flywheel (rrota e masës, DMF)</p>
                <p> - Damper pulley / torsional dampers</p>

                <p>• Sistemi i Frenimit:</p>
                <p> - Diskat e frenave, blloqet (pads), këpucët e frenimit</p>
                <p> - Lëngu i frenave</p>

                <p>• Filtrat & Lëngjet:</p>
                <p> - Filtri i vajit, ajrit, kabinës, karburantit</p>
                <p> - Vaji i motorit, antifrizi, vaji i transmisionit</p>
                <p> - Lëngu i larjes së xhamave</p>

                <p>• Suspensioni & Drejtimi:</p>
                <p> - Amortizatorët (vaj, vula, konsumim)</p>
                <p> - Bushingët, nyjet e topit, lidhëset stabilizuese</p>

                <p>• Rrotat & Energjia:</p>
                <p>
                  {" "}
                  - Velgjat (Fellnet) Gomat, balancimi, rregullimi i
                  drejtimit{" "}
                </p>
                <p> - Bateria 12V, llambat, siguresat</p>

                <p>• Të tjera Konsumueshme:</p>
                <p> - Fshirëset e xhamave, spërkatësit</p>
                <p> - Spark plugs, glow plugs</p>
                <p>
                  {" "}
                  - Rripat (serpentine, timing sipas intervalit të prodhuesit)
                </p>
                <p> - Tubat gome, vulat, garniturat</p>

                <h3 className="font-semibold text-foreground">III. Kushtet</h3>
                <p>
                  - Garancia mbulon vetëm defekte teknike jo të lidhura me
                  konsumim normal.
                </p>
                <p>
                  - Për makinat e përdorura, të gjitha pjesët konsumueshme janë
                  të përjashtuara pa përjashtim.
                </p>
                <p>- Mirëmbajtja e rregullt është përgjegjësi e klientit.</p>

                <div className="pt-1">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/garancioni")}
                  >
                    Shiko faqen e plotë të garancionit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exterior" className="space-y-4">
            <Card className="shadow-md border-border/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">
                    Gjendja e Jashtme dhe Përdorimi
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Informacion për historinë e përdorimit dhe pronësisë së
                  automjetit
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Historia e përdorimit të veturës
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {usageHighlights.map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-3"
                      >
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-base font-semibold text-foreground">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {usageHistoryList.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {usageHistoryList.map((entry, index) => (
                        <div
                          key={`${entry.description || "usage"}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/60 px-4 py-3 text-sm"
                        >
                          <span className="font-medium text-foreground">
                            {entry.description || "Përdorim"}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {entry.value || "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Historia e ndërrimit të pronarëve
                  </h3>
                  {ownerChangesList.length > 0 ? (
                    <div className="space-y-3">
                      {ownerChangesList.map((change, index) => (
                        <div
                          key={`${change?.change_type || "owner"}-${index}`}
                          className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">
                              {change?.change_type || "Ndryshim pronari"}
                            </span>
                            {change?.date && (
                              <Badge variant="outline" className="text-xs">
                                {formatDisplayDate(change.date) ?? change.date}
                              </Badge>
                            )}
                          </div>
                          {change?.usage_type && (
                            <p className="text-xs text-muted-foreground">
                              Përdorim: {change.usage_type}
                            </p>
                          )}
                          {change?.previous_number && (
                            <p className="text-xs text-muted-foreground">
                              Numri paraprak: {change.previous_number}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      Nuk ka informata për ndërrimin e pronarëve.
                    </p>
                  )}
                </section>
              </CardContent>
            </Card>

            {car.damage && (car.damage.main || car.damage.second) && (
              <Card className="shadow-md border-border/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">
                      Dëmtimet e raportuara
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vlerësimi i dëmtimeve të evidentuara nga inspektimi
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {car.damage?.main && (
                    <div className="p-3 rounded-lg border border-border/60 bg-muted/40">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Dëmtimi kryesor
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {car.damage.main}
                      </p>
                    </div>
                  )}
                  {car.damage?.second && (
                    <div className="p-3 rounded-lg border border-border/60 bg-muted/40">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Dëmtimi dytësor
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {car.damage.second}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-md border-border/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">
                    Historia e aksidenteve
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Detaje të plota të aksidenteve të raportuara për automjetin.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Detajet e plota të aksidenteve tani gjenden në tabin{" "}
                  <span className="font-semibold text-foreground">
                    Historia e Sigurimit
                  </span>
                  , ku ofrohet tabela me shpenzimet, pjesët dhe kronologjinë e
                  ngjarjeve.
                </p>
                <p className="text-xs sm:text-sm">
                  Shfrytëzoni tabin për të parë çdo aksident individual, kostot
                  e riparimit dhe shënimet nga kompania e sigurimit.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-sm text-muted-foreground md:max-w-xl">
            <p>
              Për informacione shtesë ose pyetje rreth raportit, kontaktoni
              ekipin tonë të inspektimit — jemi këtu për t’ju udhëzuar në çdo
              hap.
            </p>
            <p className="font-medium text-foreground">
              Ndiqni inspektimin, kërkoni sqarime shtesë ose ktheni te detajet e
              makinës me butonat më poshtë.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <Button
              onClick={handleContactWhatsApp}
              variant="outline"
              className="h-11 flex-1 rounded-xl border border-green-500/50 bg-green-500/10 text-green-700 hover:border-green-500 hover:bg-green-500 hover:text-white transition-all"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <InspectionRequestForm
              trigger={
                <Button className="h-11 flex-1 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all">
                  <FileText className="h-4 w-4 mr-2" />
                  Kërko Inspektim
                </Button>
              }
              carId={car.id}
              carMake={car.make}
              carModel={car.model}
              carYear={car.year}
            />
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl border border-border/60 hover:bg-muted/40 transition-all"
              onClick={() => openCarDetailsInNewTab(car.lot || lot)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu te makina
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarInspectionReport;
